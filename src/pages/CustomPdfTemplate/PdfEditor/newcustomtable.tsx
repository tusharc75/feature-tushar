import type { Plugin, PDFRenderProps, Schema, UIRenderProps } from '@pdfme/common';
import { rgb } from '@pdfme/pdf-lib';
import { PLUGIN } from 'src/constants/helpers';

interface MyGridSchema extends Schema {
    type: 'myGridType';
    rows: string[][];
    cols: number;
    basePdf?: { width: number; height: number };
    // optional persisted sizes
    colWidths?: number[]; // px
    rowHeights?: number[]; // px
}

const stateMap = new WeakMap<HTMLElement, {
    rows: string[][];
    cols: number;
    focusedId?: string | null;
    colWidths?: number[]; // px per col
    rowHeights?: number[]; // px per row
}>();

const stopPropagationFor = (el: HTMLElement | HTMLTextAreaElement) => {
    const stop = (e: Event) => e.stopPropagation();
    el.addEventListener('mousedown', stop);
    el.addEventListener('click', stop);
    el.addEventListener('dblclick', stop);
    el.addEventListener('touchstart', stop);
    el.addEventListener('focus', stop, true as any);
    el.addEventListener('keydown', (e) => (e as Event).stopPropagation());
};

// helper to safely parse numbers
const ensureArrayLen = (arr: number[] | undefined, len: number, fill: number) => {
    const out = arr ? [...arr] : [];
    while (out.length < len) out.push(fill);
    if (out.length > len) out.length = len;
    return out;
};

const persistRows = (root: HTMLElement, onChange: UIRenderProps<MyGridSchema>['onChange']) => {
    const s = stateMap.get(root);
    if (!s || !onChange) return;
    const payload = JSON.parse(JSON.stringify(s.rows));
    onChange({ key: 'rows', value: payload });
};

const persistSizes = (root: HTMLElement, onChange: UIRenderProps<MyGridSchema>['onChange']) => {
    const s = stateMap.get(root);
    if (!s || !onChange) return;
    if (s.colWidths) onChange({ key: 'colWidths', value: JSON.parse(JSON.stringify(s.colWidths)) });
    if (s.rowHeights) onChange({ key: 'rowHeights', value: JSON.parse(JSON.stringify(s.rowHeights)) });
};

const focusCellIfNeeded = (root: HTMLElement) => {
    const s = stateMap.get(root);
    if (!s || !s.focusedId) return;
    const el = root.querySelector(`[data-cell-id="${s.focusedId}"]`) as HTMLTextAreaElement | null;
    if (el) {
        el.focus();
        const len = el.value?.length ?? 0;
        el.setSelectionRange(len, len);
    }
};

const MIN_COL_PX = 30;
const MIN_ROW_PX = 24;

const myGridPlugin: Plugin<MyGridSchema> = {
    ui: async (props: UIRenderProps<MyGridSchema>) => {
        let { rootElement, onChange, mode, schema } = props;
        const incomingRows = (schema?.rows as string[][]) ?? [['']];
        const incomingCols = (schema?.cols as number) ?? 1;
        let state = stateMap.get(rootElement);
        if (!state) {
            state = { rows: JSON.parse(JSON.stringify(incomingRows)), cols: incomingCols, focusedId: null };
            stateMap.set(rootElement, state);
        } else {
            if (incomingCols !== state.cols) state.cols = incomingCols;
            if (incomingRows.length !== state.rows.length || incomingRows.some((r, i) => !state!.rows[i] || state!.rows[i].length !== r.length)) {
                state.rows = JSON.parse(JSON.stringify(incomingRows));
            }
        }

        const active = document.activeElement as HTMLElement | null;
        if (active && active.dataset && active.dataset.cellId) {
            state.focusedId = active.dataset.cellId;
        }

        // reset DOM
        rootElement.innerHTML = '';
        rootElement.setAttribute('plugin-type', PLUGIN.CUSTOM_TABLE);

        Object.assign(rootElement.style, {
            display: 'flex',
            flexDirection: 'column',
            border: `${typeof schema?.tableBorderWidth === 'number' ? schema.tableBorderWidth : 1}px solid ${typeof schema?.tableBorderColor === 'string' ? schema.tableBorderColor : '#86A8E7'}`,
            boxSizing: 'border-box',
            overflow: 'visible',
            width: '100%',
            height: '100%',
            position: 'relative',
            background: 'transparent',
            padding: '0'
        });

        const rowsCount = Math.max(1, state.rows.length);
        const containerRect = rootElement.getBoundingClientRect();
        // base width in px to distribute columns
        const availableWidthPx = Math.max(200, containerRect.width || (schema?.width ? (schema.width as number) * 3 : 400));
        const initialColPx = Math.floor(availableWidthPx / Math.max(1, state.cols));
        const rowMinHeightPx = (typeof schema?.height === 'number' && schema.height > 0)
            ? Math.max(28, Math.floor((schema.height as number) / rowsCount))
            : 34;

        // init colWidths and rowHeights in state if missing (try persisted schema values first)
        if (!state.colWidths) {
            const persisted = schema?.colWidths as number[] | undefined;
            if (persisted && persisted.length === state.cols) {
                state.colWidths = [...persisted];
            } else {
                state.colWidths = Array(state.cols).fill(initialColPx);
            }
        } else {
            // ensure length fits cols
            state.colWidths = ensureArrayLen(state.colWidths, state.cols, initialColPx);
        }
        if (!state.rowHeights) {
            const persistedRows = schema?.rowHeights as number[] | undefined;
            if (persistedRows && persistedRows.length === state.rows.length) {
                state.rowHeights = [...persistedRows];
            } else {
                state.rowHeights = state.rows.map(() => rowMinHeightPx);
            }
        } else {
            state.rowHeights = ensureArrayLen(state.rowHeights, state.rows.length, rowMinHeightPx);
        }

        // Ensure each row has correct number of columns
        state.rows.forEach(r => {
            while (r.length < state.cols) r.push('');
            if (r.length > state.cols) r.length = state.cols;
        });

        // Container structure
        const mainContainer = document.createElement('div');
        Object.assign(mainContainer.style, {
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
        });

        const tableContainer = document.createElement('div');
        Object.assign(tableContainer.style, {
            flex: '1',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative' // needed for overlay resizers
        });

        // create all rows
        const rowWrappers: HTMLDivElement[] = [];
        state.rows.forEach((row, rowIndex) => {
            const rowWrapper = document.createElement('div');
            const gridTemplateCols = state.colWidths!.map(w => `${Math.max(MIN_COL_PX, Math.round(w))}px`).join(' ');
            Object.assign(rowWrapper.style, {
                display: 'grid',
                gridTemplateColumns: gridTemplateCols,
                borderBottom: `${typeof schema?.colBorderWidth === 'number' ? schema.colBorderWidth : 1}px solid ${typeof schema?.colBorderColor === 'string' ? schema.colBorderColor : '#e6eefc'}`,
                height: `${Math.max(MIN_ROW_PX, Math.round(state.rowHeights![rowIndex]))}px`,
                alignItems: 'stretch',
                boxSizing: 'border-box',
                width: '100%',
                overflow: 'hidden'
            });

            while (row.length < state.cols) row.push('');

            for (let colIndex = 0; colIndex < state.cols; colIndex++) {
                const cellContent = row[colIndex] ?? '';
                const cell = document.createElement('div');
                Object.assign(cell.style, {
                    borderRight: colIndex < state.cols - 1 ? `${typeof schema?.colBorderWidth === 'number' ? schema.colBorderWidth : 1}px solid ${typeof schema?.colBorderColor === 'string' ? schema.colBorderColor : '#e6eefc'}` : 'none',
                    display: 'flex',
                    alignItems: 'stretch',
                    padding: '4px',
                    boxSizing: 'border-box',
                    width: '100%'
                });

                const input = document.createElement('textarea');
                input.value = cellContent;
                input.setAttribute('data-cell-id', `${rowIndex}-${colIndex}`);
                Object.assign(input.style, {
                    width: '100%',
                    height: '100%',
                    minHeight: `${Math.max(24, Math.round(state.rowHeights![rowIndex]) - 8)}px`,
                    resize: 'none',
                    border: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontSize: `${typeof schema?.textSize === 'number' ? schema.textSize : 20}px`,
                    fontFamily: 'Roboto, Roboto-bold',
                    fontWeight: (typeof schema?.textWeight === 'string' ? schema.textWeight : 'normal') as 'normal' | 'bold',
                    color: typeof schema?.textColor === 'string' ? schema.textColor : '#000000',
                    background: 'transparent',
                    padding: '4px',
                    overflow: 'auto',
                    pointerEvents: 'auto',
                    userSelect: 'text',
                    caretColor: 'auto'
                });
                input.tabIndex = 0;
                input.autocomplete = 'off';
                input.spellcheck = false;
                stopPropagationFor(input);
                const onInput = (e: Event) => {
                    const val = (e.target as HTMLTextAreaElement).value;
                    state!.rows[rowIndex][colIndex] = val;
                };
                const onBlur = () => {
                    persistRows(rootElement, onChange!);
                    state!.focusedId = null;
                };
                input.addEventListener('input', onInput);
                input.addEventListener('blur', onBlur);

                // VARIABLE insertion event
                input.addEventListener('insert-variable', (e: Event) => {
                    e.stopPropagation();
                    const customEvent = e as CustomEvent;
                    const textToInsert = customEvent.detail.value;
                    if (!textToInsert) return;
                    const { selectionStart, selectionEnd } = input;
                    const currentValue = input.value;
                    const newValue =
                        currentValue.substring(0, selectionStart) +
                        textToInsert +
                        currentValue.substring(selectionEnd);
                    input.value = newValue;
                    state!.rows[rowIndex][colIndex] = newValue;
                    const newCursorPos = selectionStart + textToInsert.length;
                    input.focus();
                    input.setSelectionRange(newCursorPos, newCursorPos);
                });
                if (schema?.readOnly) input.readOnly = true;
                cell.appendChild(input);
                rowWrapper.appendChild(cell);
            }
            tableContainer.appendChild(rowWrapper);
            rowWrappers.push(rowWrapper);
        });
        mainContainer.appendChild(tableContainer);

        // RESIZERS LAYER
        const resizerLayer = document.createElement('div');
        Object.assign(resizerLayer.style, {
            position: 'absolute',
            left: '0',
            top: '0',
            right: '0',
            bottom: '0',
            pointerEvents: 'none', // individual resizer handles will enable pointer events
            zIndex: '10001'
        });

        // helper to update gridTemplateColumns for all row wrappers
        const applyColWidthsToRows = () => {
            const tpl = state!.colWidths!.map(w => `${Math.max(MIN_COL_PX, Math.round(w))}px`).join(' ');
            rowWrappers.forEach(rw => {
                (rw.style as any).gridTemplateColumns = tpl;
            });
        };

        // helper to update row heights
        const applyRowHeights = () => {
            rowWrappers.forEach((rw, idx) => {
                rw.style.height = `${Math.max(MIN_ROW_PX, Math.round(state!.rowHeights![idx]))}px`;
                // update contained textarea minHeight
                const ta = rw.querySelector('textarea') as HTMLTextAreaElement | null;
                if (ta) {
                    ta.style.minHeight = `${Math.max(24, Math.round(state!.rowHeights![idx]) - 8)}px`;
                }
            });
        };

        // create column resizers (vertical handles between columns)
        const createColResizers = () => {
            // compute cumulative left positions based on colWidths
            const tableRect = tableContainer.getBoundingClientRect();
            let cumLeft = 0;
            for (let ci = 0; ci < state!.cols; ci++) {
                cumLeft += state!.colWidths![ci];
                // create a resizer if not last column
                if (ci < state!.cols - 1) {
                    const handle = document.createElement('div');
                    Object.assign(handle.style, {
                        position: 'absolute',
                        top: '0px',
                        height: '100%',
                        width: '10px',
                        left: `${cumLeft - 5}px`,
                        transform: 'translateX(0)',
                        cursor: 'col-resize',
                        zIndex: '10002',
                        pointerEvents: 'auto',
                        background: 'transparent'
                    });
                    // visible thin line for affordance
                    const line = document.createElement('div');
                    Object.assign(line.style, {
                        position: 'absolute',
                        top: '10px',
                        bottom: '10px',
                        left: '50%',
                        width: '2px',
                        transform: 'translateX(-50%)',
                        background: 'rgba(0,0,0,0.12)',
                        borderRadius: '2px'
                    });
                    handle.appendChild(line);

                    let startX = 0;
                    let startLeftWidth = 0;
                    let startRightWidth = 0;
                    const leftIndex = ci;
                    const rightIndex = ci + 1;
                    const onMove = (ev: MouseEvent | TouchEvent) => {
                        ev.preventDefault();
                        const clientX = (ev instanceof TouchEvent) ? ev.touches[0].clientX : (ev as MouseEvent).clientX;
                        const dx = clientX - startX;
                        let newLeft = Math.max(MIN_COL_PX, startLeftWidth + dx);
                        let newRight = Math.max(MIN_COL_PX, startRightWidth - dx);
                        // if one side hits min, adjust the other accordingly
                        if (newLeft + newRight < startLeftWidth + startRightWidth) {
                            // keep total same, but enforce mins
                            const total = startLeftWidth + startRightWidth;
                            if (newLeft < MIN_COL_PX) {
                                newLeft = MIN_COL_PX;
                                newRight = total - newLeft;
                            } else if (newRight < MIN_COL_PX) {
                                newRight = MIN_COL_PX;
                                newLeft = total - newRight;
                            }
                        }
                        state!.colWidths![leftIndex] = newLeft;
                        state!.colWidths![rightIndex] = newRight;
                        applyColWidthsToRows();
                    };
                    const onUp = () => {
                        document.removeEventListener('mousemove', onMove as any);
                        document.removeEventListener('mouseup', onUp);
                        document.removeEventListener('touchmove', onMove as any);
                        document.removeEventListener('touchend', onUp);
                        persistSizes(rootElement, onChange!);
                    };

                    handle.addEventListener('mousedown', (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        startX = e.clientX;
                        startLeftWidth = state!.colWidths![leftIndex];
                        startRightWidth = state!.colWidths![rightIndex];
                        document.addEventListener('mousemove', onMove as any);
                        document.addEventListener('mouseup', onUp);
                    });

                    handle.addEventListener('touchstart', (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        startX = e.touches[0].clientX;
                        startLeftWidth = state!.colWidths![leftIndex];
                        startRightWidth = state!.colWidths![rightIndex];
                        document.addEventListener('touchmove', onMove as any, { passive: false });
                        document.addEventListener('touchend', onUp);
                    }, { passive: false });

                    resizerLayer.appendChild(handle);
                }
            }
        };

        // create horizontal row resizers
        const createRowResizers = () => {
            // need cumulative top positions
            let cumTop = 0;
            for (let ri = 0; ri < state!.rowHeights!.length; ri++) {
                const h = state!.rowHeights![ri];
                cumTop += h;
                if (ri < state!.rowHeights!.length - 1) {
                    const handle = document.createElement('div');
                    Object.assign(handle.style, {
                        position: 'absolute',
                        left: '0px',
                        right: '0px',
                        height: '10px',
                        top: `${cumTop - 5}px`,
                        cursor: 'row-resize',
                        zIndex: '10002',
                        pointerEvents: 'auto',
                        background: 'transparent'
                    });
                    const line = document.createElement('div');
                    Object.assign(line.style, {
                        position: 'absolute',
                        left: '10px',
                        right: '10px',
                        top: '50%',
                        height: '2px',
                        transform: 'translateY(-50%)',
                        background: 'rgba(0,0,0,0.12)',
                        borderRadius: '2px'
                    });
                    handle.appendChild(line);

                    let startY = 0;
                    let startTopHeight = 0;
                    let startBottomHeight = 0;
                    const topIndex = ri;
                    const bottomIndex = ri + 1;
                    const onMove = (ev: MouseEvent | TouchEvent) => {
                        ev.preventDefault();
                        const clientY = (ev instanceof TouchEvent) ? ev.touches[0].clientY : (ev as MouseEvent).clientY;
                        const dy = clientY - startY;
                        let newTop = Math.max(MIN_ROW_PX, startTopHeight + dy);
                        let newBottom = Math.max(MIN_ROW_PX, startBottomHeight - dy);
                        const total = startTopHeight + startBottomHeight;
                        if (newTop + newBottom < total) {
                            if (newTop < MIN_ROW_PX) {
                                newTop = MIN_ROW_PX;
                                newBottom = total - newTop;
                            } else if (newBottom < MIN_ROW_PX) {
                                newBottom = MIN_ROW_PX;
                                newTop = total - newBottom;
                            }
                        }
                        state!.rowHeights![topIndex] = newTop;
                        state!.rowHeights![bottomIndex] = newBottom;
                        applyRowHeights();
                    };
                    const onUp = () => {
                        document.removeEventListener('mousemove', onMove as any);
                        document.removeEventListener('mouseup', onUp);
                        document.removeEventListener('touchmove', onMove as any);
                        document.removeEventListener('touchend', onUp);
                        persistSizes(rootElement, onChange!);
                    };

                    handle.addEventListener('mousedown', (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        startY = e.clientY;
                        startTopHeight = state!.rowHeights![topIndex];
                        startBottomHeight = state!.rowHeights![bottomIndex];
                        document.addEventListener('mousemove', onMove as any);
                        document.addEventListener('mouseup', onUp);
                    });

                    handle.addEventListener('touchstart', (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        startY = e.touches[0].clientY;
                        startTopHeight = state!.rowHeights![topIndex];
                        startBottomHeight = state!.rowHeights![bottomIndex];
                        document.addEventListener('touchmove', onMove as any, { passive: false });
                        document.addEventListener('touchend', onUp);
                    }, { passive: false });

                    resizerLayer.appendChild(handle);
                }
            }
        };

        // Build resizers after DOM insertion: append resizerLayer and create handles
        rootElement.appendChild(mainContainer);
        // ensure initial sizes applied
        applyColWidthsToRows();
        applyRowHeights();

        // create resizer handles
        // Clear previous content in resizerLayer
        resizerLayer.innerHTML = '';
        createColResizers();
        createRowResizers();

        // append bottom/side controls (you had them appended directly to rootElement before)
        if (true) {
            const styleSmallBtn = (btn: HTMLButtonElement) => {
                Object.assign(btn.style, {
                    width: '34px',
                    height: '28px',
                    padding: '0',
                    margin: '0 4px',
                    fontSize: '14px',
                    borderRadius: '6px',
                    background: '#fff',
                    border: '1px solid rgba(0,0,0,0.12)',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                    cursor: 'pointer',
                    lineHeight: '1',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxSizing: 'border-box',
                    zIndex: '10000',
                    pointerEvents: 'auto'
                });
            };
            const bottomWrapper = document.createElement('div');
            Object.assign(bottomWrapper.style, {
                position: 'absolute',
                left: '50%',
                bottom: '-22px',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                zIndex: '10000',
                pointerEvents: 'auto'
            });

            const addRowBtn = document.createElement('button');
            addRowBtn.type = 'button';
            addRowBtn.textContent = '+';
            addRowBtn.title = 'Add row';
            styleSmallBtn(addRowBtn);
            addRowBtn.onclick = () => {
                state!.rows.push(Array(state!.cols).fill(''));
                // new row height default
                state!.rowHeights!.push(Math.max(rowMinHeightPx, rowMinHeightPx));
                onChange?.([
                    { key: 'rows', value: JSON.parse(JSON.stringify(state!.rows)) },
                    { key: 'cols', value: state!.cols },
                    { key: 'rowHeights', value: JSON.parse(JSON.stringify(state!.rowHeights)) }
                ]);
                // rerender: simply call plugin UI again by re-applying sizes and focus
                applyRowHeights();
                setTimeout(() => focusCellIfNeeded(rootElement), 0);
            };

            const removeRowBtn = document.createElement('button');
            removeRowBtn.type = 'button';
            removeRowBtn.textContent = '−';
            removeRowBtn.title = 'Remove last row';
            styleSmallBtn(removeRowBtn);
            removeRowBtn.onclick = () => {
                if (state!.rows.length <= 1) return; // keep at least one row
                state!.rows.pop();
                state!.rowHeights!.pop();
                onChange?.([
                    { key: 'rows', value: JSON.parse(JSON.stringify(state!.rows)) },
                    { key: 'cols', value: state!.cols },
                    { key: 'rowHeights', value: JSON.parse(JSON.stringify(state!.rowHeights)) }
                ]);
                applyRowHeights();
            };

            bottomWrapper.appendChild(addRowBtn);
            bottomWrapper.appendChild(removeRowBtn);

            // LEFT: add/remove column controls (stacked)
            const leftColWrapper = document.createElement('div');
            Object.assign(leftColWrapper.style, {
                position: 'absolute',
                left: '-36px',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                zIndex: '10000',
                pointerEvents: 'auto'
            });

            const addColLeft = document.createElement('button');
            addColLeft.type = 'button';
            addColLeft.textContent = '+';
            addColLeft.title = 'Add column to left';
            styleSmallBtn(addColLeft);
            addColLeft.onclick = () => {
                state!.cols += 1;
                // insert an empty cell at start of each row
                state!.rows = state!.rows.map(r => {
                    const copy = [...r];
                    copy.unshift('');
                    return copy;
                });
                // adjust colWidths: add default width
                const defaultWidth = Math.max(MIN_COL_PX, Math.floor((state!.colWidths!.reduce((a, b) => a + b, 0) / (state!.cols || 1))));
                state!.colWidths!.unshift(defaultWidth);
                onChange?.([
                    { key: 'cols', value: state!.cols },
                    { key: 'rows', value: JSON.parse(JSON.stringify(state!.rows)) },
                    { key: 'colWidths', value: JSON.parse(JSON.stringify(state!.colWidths)) }
                ]);
                applyColWidthsToRows();
            };

            const removeColLeft = document.createElement('button');
            removeColLeft.type = 'button';
            removeColLeft.textContent = '−';
            removeColLeft.title = 'Remove left column';
            styleSmallBtn(removeColLeft);
            removeColLeft.onclick = () => {
                if (state!.cols <= 1) return; // keep at least one column
                state!.cols -= 1;
                state!.rows = state!.rows.map(r => r.slice(1));
                state!.colWidths!.shift();
                onChange?.([
                    { key: 'cols', value: state!.cols },
                    { key: 'rows', value: JSON.parse(JSON.stringify(state!.rows)) },
                    { key: 'colWidths', value: JSON.parse(JSON.stringify(state!.colWidths)) }
                ]);
                applyColWidthsToRows();
            };

            leftColWrapper.appendChild(addColLeft);
            leftColWrapper.appendChild(removeColLeft);

            // RIGHT: add/remove column controls (stacked)
            const rightColWrapper = document.createElement('div');
            Object.assign(rightColWrapper.style, {
                position: 'absolute',
                right: '-36px',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                zIndex: '10000',
                pointerEvents: 'auto'
            });

            const addColRight = document.createElement('button');
            addColRight.type = 'button';
            addColRight.textContent = '+';
            addColRight.title = 'Add column to right';
            styleSmallBtn(addColRight);
            addColRight.onclick = () => {
                state!.cols += 1;
                state!.rows = state!.rows.map(r => {
                    const copy = [...r];
                    while (copy.length < state!.cols) copy.push('');
                    return copy;
                });
                // add default width
                const defaultWidth = Math.max(MIN_COL_PX, Math.floor((state!.colWidths!.reduce((a, b) => a + b, 0) / (state!.cols || 1))));
                state!.colWidths!.push(defaultWidth);
                onChange?.([
                    { key: 'cols', value: state!.cols },
                    { key: 'rows', value: JSON.parse(JSON.stringify(state!.rows)) },
                    { key: 'colWidths', value: JSON.parse(JSON.stringify(state!.colWidths)) }
                ]);
                applyColWidthsToRows();
            };

            const removeColRight = document.createElement('button');
            removeColRight.type = 'button';
            removeColRight.textContent = '−';
            removeColRight.title = 'Remove right column';
            styleSmallBtn(removeColRight);
            removeColRight.onclick = () => {
                if (state!.cols <= 1) return;
                state!.cols -= 1;
                state!.rows = state!.rows.map(r => r.slice(0, state!.cols));
                state!.colWidths!.pop();
                onChange?.([
                    { key: 'cols', value: state!.cols },
                    { key: 'rows', value: JSON.parse(JSON.stringify(state!.rows)) },
                    { key: 'colWidths', value: JSON.parse(JSON.stringify(state!.colWidths)) }
                ]);
                applyColWidthsToRows();
            };

            rightColWrapper.appendChild(addColRight);
            rightColWrapper.appendChild(removeColRight);

            // append the wrappers to rootElement (not mainContainer) to reduce clipping risk.
            rootElement.appendChild(bottomWrapper);
            rootElement.appendChild(leftColWrapper);
            rootElement.appendChild(rightColWrapper);
        }

        // append resizer layer after adding controls so resizers sit above the table but below control buttons
        rootElement.appendChild(resizerLayer);

        // Rebuild resizers when layout changes (simple approach: recreate them)
        const rebuildResizers = () => {
            resizerLayer.innerHTML = '';
            createColResizers();
            createRowResizers();
        };

        // Apply initial sizes and then rebuild resizers after DOM paints
        setTimeout(() => {
            applyColWidthsToRows();
            applyRowHeights();
            rebuildResizers();
            setTimeout(() => focusCellIfNeeded(rootElement), 0);
        }, 0);
    },

    // PDF renderer left mostly untouched; you can extend to use colWidths/rowHeights later if needed
    // pdf: async ({ page, schema }: PDFRenderProps<MyGridSchema>) => {
    //     const { position, rows = [['']], cols = 1, width, height } = schema;
    //     const pageWidth = page.getWidth();
    //     const pageHeight = page.getHeight();
    //     const baseWidth = schema.basePdf?.width ?? 210;
    //     const baseHeight = schema.basePdf?.height ?? 297;

    //     const scaleX = pageWidth / baseWidth;
    //     const scaleY = pageHeight / baseHeight;

    //     const scaledX = (position?.x ?? 0) * scaleX;
    //     const scaledY = (position?.y ?? 0) * scaleY;
    //     const scaledWidth = (width ?? 100) * scaleX;
    //     const scaledHeight = (height ?? 50) * scaleY;
    //     const x = scaledX;
    //     const y = pageHeight - scaledY - scaledHeight;

    //     const cellWidth = scaledWidth / Math.max(1, cols);
    //     const cellHeight = scaledHeight / Math.max(1, rows.length);

    //     const tableBorderWidth = ((typeof schema?.tableBorderWidth === 'number' ? schema.tableBorderWidth : 1));
    //     const colBorderWidth = ((typeof schema?.colBorderWidth === 'number' ? schema.colBorderWidth : 1));

    //     const tableBorderColor = typeof schema?.tableBorderColor === 'string' ? schema.tableBorderColor : '#000000';
    //     const colBorderColor = typeof schema?.colBorderColor === 'string' ? schema.colBorderColor : '#e6e6e6';

    //     const parseColor = (colorStr: string) => {
    //         if (colorStr.startsWith('#')) {
    //             const hex = colorStr.slice(1);
    //             const r = parseInt(hex.slice(0, 2), 16) / 255;
    //             const g = parseInt(hex.slice(2, 4), 16) / 255;
    //             const b = parseInt(hex.slice(4, 6), 16) / 255;
    //             return rgb(r, g, b);
    //         }
    //         return rgb(0, 0, 0);
    //     };

    //     const tableColor = parseColor(tableBorderColor);

    //     page.drawLine({
    //         start: { x, y: y + scaledHeight },
    //         end: { x: x + scaledWidth, y: y + scaledHeight },
    //         thickness: tableBorderWidth,
    //         color: tableColor,
    //     });

    //     page.drawLine({
    //         start: { x, y },
    //         end: { x: x + scaledWidth, y },
    //         thickness: tableBorderWidth,
    //         color: tableColor,
    //     });

    //     page.drawLine({
    //         start: { x, y },
    //         end: { x, y: y + scaledHeight },
    //         thickness: tableBorderWidth,
    //         color: tableColor,
    //     });

    //     page.drawLine({
    //         start: { x: x + scaledWidth, y },
    //         end: { x: x + scaledWidth, y: y + scaledHeight },
    //         thickness: tableBorderWidth,
    //         color: tableColor,
    //     });

    //     const colColor = parseColor(colBorderColor);
    //     for (let i = 1; i < rows.length; i++) {
    //         const lineY = y + i * cellHeight;
    //         page.drawLine({
    //             start: { x, y: lineY },
    //             end: { x: x + scaledWidth, y: lineY },
    //             thickness: colBorderWidth,
    //             color: colColor,
    //         });
    //     }

    //     for (let i = 1; i < cols; i++) {
    //         const lineX = x + i * cellWidth;
    //         page.drawLine({
    //             start: { x: lineX, y },
    //             end: { x: lineX, y: y + scaledHeight },
    //             thickness: colBorderWidth,
    //             color: colColor,
    //         });
    //     }

    //     const padding = 4;
    //     const textSize = ((typeof schema?.textSize === 'number' ? schema.textSize : 9));
    //     const textColorStr = typeof schema?.textColor === 'string' ? schema.textColor : '#000000';
    //     const textColor = parseColor(textColorStr);

    //     rows.forEach((row, rowIndex) => {
    //         row.forEach((cellText, colIndex) => {
    //             if (!cellText) return;
    //             const textX = x + colIndex * cellWidth + padding;
    //             const cellTopY = y + (rows.length - rowIndex) * cellHeight;
    //             const textY = cellTopY - textSize - padding;

    //             page.drawText(String(cellText), {
    //                 x: textX,
    //                 y: textY,
    //                 size: textSize,
    //                 color: textColor,
    //                 maxWidth: cellWidth - padding * 2,
    //             });
    //         });
    //     });
    // },
    pdf: async ({ page, schema }: PDFRenderProps<MyGridSchema>) => {
        const { position, rows = [['']], cols = 1, width, height } = schema;
        const pageWidth = page.getWidth();
        const pageHeight = page.getHeight();
        const baseWidth = schema.basePdf?.width ?? 210;
        const baseHeight = schema.basePdf?.height ?? 297;

        const scaleX = pageWidth / baseWidth;
        const scaleY = pageHeight / baseHeight;

        const scaledX = (position?.x ?? 0) * scaleX;
        const scaledY = (position?.y ?? 0) * scaleY;
        const scaledWidth = (width ?? 100) * scaleX;
        const scaledHeight = (height ?? 50) * scaleY;
        const x = scaledX;
        const y = pageHeight - scaledY - scaledHeight; // bottom-left of table in PDF coord

        // Use persisted colWidths / rowHeights from schema if available, otherwise equal division
        const uiColWidths = Array.isArray(schema.colWidths) && schema.colWidths.length === cols ? schema.colWidths : undefined;
        const uiRowHeights = Array.isArray(schema.rowHeights) && schema.rowHeights.length === rows.length ? schema.rowHeights : undefined;

        // convert UI px sizes to proportional widths/heights in PDF space
        let colWidthsPdf: number[] = [];
        if (uiColWidths && uiColWidths.reduce((a, b) => a + b, 0) > 0) {
            const total = uiColWidths.reduce((a, b) => a + b, 0);
            colWidthsPdf = uiColWidths.map(w => (w / total) * scaledWidth);
        } else {
            // equal division fallback
            const cw = scaledWidth / Math.max(1, cols);
            colWidthsPdf = Array.from({ length: cols }, () => cw);
        }

        let rowHeightsPdf: number[] = [];
        if (uiRowHeights && uiRowHeights.reduce((a, b) => a + b, 0) > 0) {
            const total = uiRowHeights.reduce((a, b) => a + b, 0);
            rowHeightsPdf = uiRowHeights.map(h => (h / total) * scaledHeight);
        } else {
            // equal division fallback
            const rh = scaledHeight / Math.max(1, rows.length);
            rowHeightsPdf = Array.from({ length: rows.length }, () => rh);
        }

        const tableBorderWidth = ((typeof schema?.tableBorderWidth === 'number' ? schema.tableBorderWidth : 1));
        const colBorderWidth = ((typeof schema?.colBorderWidth === 'number' ? schema.colBorderWidth : 1));

        const tableBorderColor = typeof schema?.tableBorderColor === 'string' ? schema.tableBorderColor : '#000000';
        const colBorderColor = typeof schema?.colBorderColor === 'string' ? schema.colBorderColor : '#e6e6e6';

        const parseColor = (colorStr: string) => {
            if (typeof colorStr === 'string' && colorStr.startsWith('#')) {
                const hex = colorStr.slice(1).padEnd(6, '0');
                const r = parseInt(hex.slice(0, 2), 16) / 255;
                const g = parseInt(hex.slice(2, 4), 16) / 255;
                const b = parseInt(hex.slice(4, 6), 16) / 255;
                return rgb(r, g, b);
            }
            return rgb(0, 0, 0);
        };

        const tableColor = parseColor(tableBorderColor);
        const colColor = parseColor(colBorderColor);

        // Outer rectangle borders
        page.drawLine({
            start: { x, y: y + scaledHeight },
            end: { x: x + scaledWidth, y: y + scaledHeight },
            thickness: tableBorderWidth,
            color: tableColor,
        });

        page.drawLine({
            start: { x, y },
            end: { x: x + scaledWidth, y },
            thickness: tableBorderWidth,
            color: tableColor,
        });

        page.drawLine({
            start: { x, y },
            end: { x, y: y + scaledHeight },
            thickness: tableBorderWidth,
            color: tableColor,
        });

        page.drawLine({
            start: { x: x + scaledWidth, y },
            end: { x: x + scaledWidth, y: y + scaledHeight },
            thickness: tableBorderWidth,
            color: tableColor,
        });

        // Draw horizontal lines (row separators) — compute cumulative heights from top
        let cumH = 0;
        for (let i = 0; i < rowHeightsPdf.length - 1; i++) {
            cumH += rowHeightsPdf[i];
            const lineY = y + scaledHeight - cumH;
            page.drawLine({
                start: { x, y: lineY },
                end: { x: x + scaledWidth, y: lineY },
                thickness: colBorderWidth,
                color: colColor,
            });
        }

        // Draw vertical lines (column separators) — compute cumulative x from left
        let cumW = 0;
        for (let i = 0; i < colWidthsPdf.length - 1; i++) {
            cumW += colWidthsPdf[i];
            const lineX = x + cumW;
            page.drawLine({
                start: { x: lineX, y },
                end: { x: lineX, y: y + scaledHeight },
                thickness: colBorderWidth,
                color: colColor,
            });
        }

        // Draw text using actual per-cell widths/heights
        const padding = 4;
        const textSize = ((typeof schema?.textSize === 'number' ? schema.textSize : 9));
        const textColorStr = typeof schema?.textColor === 'string' ? schema.textColor : '#000000';
        const textColor = parseColor(textColorStr);

        // precompute cumulative lefts and cumulative tops
        const colLefts: number[] = [];
        (function () {
            let acc = x;
            for (let i = 0; i < colWidthsPdf.length; i++) {
                colLefts.push(acc);
                acc += colWidthsPdf[i];
            }
        })();

        const rowTops: number[] = [];
        (function () {
            let accFromTop = 0; // amount consumed from top
            for (let i = 0; i < rowHeightsPdf.length; i++) {
                const topY = y + scaledHeight - accFromTop;
                rowTops.push(topY);
                accFromTop += rowHeightsPdf[i];
            }
        })();

        rows.forEach((row, rowIndex) => {
            row.forEach((cellText, colIndex) => {
                if (cellText == null || String(cellText).trim() === '') return;
                const cellLeftX = colLefts[colIndex];
                const cellWidthPdf = colWidthsPdf[colIndex];
                const cellTopY = rowTops[rowIndex];
                // place text starting a bit below top within the cell
                const textX = cellLeftX + padding;
                const textY = cellTopY - padding - textSize;
                page.drawText(String(cellText), {
                    x: textX,
                    y: textY,
                    size: textSize,
                    color: textColor,
                    maxWidth: Math.max(0, cellWidthPdf - padding * 2),
                });
            });
        });
    },



    propPanel: {
        schema: () => ({
            cols: {
                title: 'Columns',
                type: 'number',
                min: 1,
                max: 20
            },
            tableBorderWidth: {
                title: 'Table Border Width',
                type: 'number',
                min: 0,
                max: 10,
                step: 0.5
            },
            tableBorderColor: {
                title: 'Table Border Color',
                type: 'string',
                widget: 'color'
            },
            colBorderWidth: {
                title: 'Cell Border Width',
                type: 'number',
                min: 0,
                max: 5,
                step: 0.5
            },
            colBorderColor: {
                title: 'Cell Border Color',
                type: 'string',
                widget: 'color'
            },
            textSize: {
                title: 'Text Size',
                type: 'number',
                min: 6,
                max: 24
            },
            textColor: {
                title: 'Text Color',
                type: 'string',
                widget: 'color'
            },
            textWeight: {
                title: 'Text Weight',
                type: 'string',
                enum: ['normal', 'bold']
            }
        }),
        defaultSchema: {
            name: 'Grid',
            type: 'myGridType',
            position: { x: 50, y: 500 },
            width: 30,
            height: 20,
            rows: [['', '']],
            cols: 2,
            tableBorderWidth: 1,
            tableBorderColor: '#000000',
            colBorderWidth: 1,
            colBorderColor: '#000000',
            textSize: 20,
            textColor: '#000000',
            textWeight: 'normal'
        }
    }
};

export default myGridPlugin;
