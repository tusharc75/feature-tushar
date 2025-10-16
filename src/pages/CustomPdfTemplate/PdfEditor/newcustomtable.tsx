import type { Plugin, PDFRenderProps, Schema, UIRenderProps } from '@pdfme/common';
import { rgb, scale } from '@pdfme/pdf-lib';
import { PLUGIN } from 'src/constants/helpers';

interface MyGridSchema extends Schema {
    type: 'myGridType';
    content: string; // JSON stringified 2D array
    cols: number;
    basePdf?: { width: number; height: number };
    colWidths?: number[];
    rowHeights?: number[];
}

const stateMap = new WeakMap<HTMLElement, {
    rows: string[][];
    cols: number;
    focusedId?: string | null;
    colWidths?: number[];
    rowHeights?: number[];
}>();

const parseContent = (content: string | undefined): string[][] => {
    if (!content || content.trim() === '') return [['']];
    try {
        const parsed = JSON.parse(content);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : [['']];
    } catch {
        return [['']];
    }
};

const ensureArrayLen = (arr: number[] | undefined, len: number, fill: number) => {
    const out = arr ? [...arr] : [];
    while (out.length < len) out.push(fill);
    if (out.length > len) out.length = len;
    return out;
};

const MIN_COL_PX = 30;
const MIN_ROW_PX = 24;

const myGridPlugin: Plugin<MyGridSchema> = {
    ui: async (props: UIRenderProps<MyGridSchema>) => {
        const { rootElement, onChange, mode, schema } = props;
        const incomingRows = parseContent(schema?.content);
        const incomingCols = (schema?.cols as number) ?? 1;
        console.log(props)

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
        const availableWidthPx = Math.max(200, containerRect.width || (schema?.width ? (schema.width as number) * 3 : 400));
        const initialColPx = Math.floor(availableWidthPx / Math.max(1, state.cols));
        const rowMinHeightPx = (typeof schema?.height === 'number' && schema.height > 0)
            ? Math.max(28, Math.floor((schema.height as number) / rowsCount))
            : 34;

        if (!state.colWidths) {
            const persistedFromSchema = schema?.colWidths as number[] | undefined;
            if (persistedFromSchema && persistedFromSchema.length === state.cols) {
                state.colWidths = [...persistedFromSchema];
            } else {
                state.colWidths = Array(state.cols).fill(initialColPx);
            }
        } else {
            state.colWidths = ensureArrayLen(state.colWidths, state.cols, initialColPx);
        }

        const resizeRowsToFitHeight = () => {
            const totalHeight = rootElement.clientHeight;
            const totalFixedHeight = totalHeight - (state!.rows.length - 1) * (typeof schema?.colBorderWidth === 'number' ? schema.colBorderWidth : 1);
            const minHeightSum = state!.rows.length * MIN_ROW_PX;

            let newHeights: number[];

            if (totalFixedHeight > minHeightSum) {
                const currentTotalHeight = state!.rowHeights!.reduce((sum, h) => sum + h, 0);
                if (currentTotalHeight > 0) {
                    const heightRatio = totalFixedHeight / currentTotalHeight;
                    newHeights = state!.rowHeights!.map(h => h * heightRatio);
                } else {
                    newHeights = Array(state!.rows.length).fill(totalFixedHeight / state!.rows.length);
                }
            } else {
                newHeights = Array(state!.rows.length).fill(MIN_ROW_PX);
            }

            state!.rowHeights = newHeights.map(h => Math.max(MIN_ROW_PX, h));
        };

        if (!state.rowHeights) {
            const persistedFromSchema = schema?.rowHeights as number[] | undefined;
            if (persistedFromSchema && persistedFromSchema.length === state.rows.length) {
                state.rowHeights = [...persistedFromSchema];
            } else {
                state.rowHeights = state.rows.map(() => rowMinHeightPx);
            }
        } else {
            state.rowHeights = ensureArrayLen(state.rowHeights, state.rows.length, rowMinHeightPx);
        }

        resizeRowsToFitHeight();

        state.rows.forEach(r => {
            while (r.length < state.cols) r.push('');
            if (r.length > state.cols) r.length = state.cols;
        });

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
            position: 'relative'
        });

        const rowWrappers: HTMLDivElement[] = [];

        const insertTextAtSelection = (text: string) => {
            const sel = document.getSelection();
            if (!sel || !sel.rangeCount) return;
            const range = sel.getRangeAt(0);
            range.deleteContents();
            const node = document.createTextNode(text);
            range.insertNode(node);
            range.setStartAfter(node);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
        };

        state.rows.forEach((row, rowIndex) => {
            const rowWrapper = document.createElement('div');
            Object.assign(rowWrapper.style, {
                display: 'grid',
                borderBottom: `${typeof schema?.colBorderWidth === 'number' ? schema.colBorderWidth : 1}px solid ${typeof schema?.colBorderColor === 'string' ? schema.colBorderColor : '#e6eefc'}`,
                height: `${Math.max(MIN_ROW_PX, Math.round(state.rowHeights![rowIndex]))}px`,
                alignItems: 'stretch',
                width: '100%',
                overflow: 'hidden'
            });

            for (let colIndex = 0; colIndex < state.cols; colIndex++) {
                const cellContent = row[colIndex] ?? '';
                const cell = document.createElement('div');
                Object.assign(cell.style, {
                    borderRight: colIndex < state.cols - 1 ? `${typeof schema?.colBorderWidth === 'number' ? schema.colBorderWidth : 1}px solid ${typeof schema?.colBorderColor === 'string' ? schema.colBorderColor : '#e6eefc'}` : 'none',
                    display: 'flex',
                    alignItems: 'stretch',
                    padding: '4px',
                    width: '100%'
                });

                const editable = document.createElement('div');
                editable.setAttribute('data-cell-id', `${rowIndex}-${colIndex}`);
                editable.setAttribute('role', 'textbox');
                editable.style.width = '100%';
                editable.style.height = '100%';
                editable.style.minHeight = `${Math.max(24, Math.round(state.rowHeights![rowIndex]) - 8)}px`;
                editable.style.border = 'none';
                editable.style.outline = 'none';
                editable.style.boxShadow = 'none';
                (editable as HTMLElement).style.outlineOffset = '0px';
                editable.style.fontSize = `${typeof schema?.textSize === 'number' ? schema.textSize : 10}px`;
                editable.style.fontFamily = 'Roboto, Roboto-bold';
                editable.style.fontWeight = (typeof schema?.textWeight === 'string' ? schema.textWeight : 'normal') as 'normal' | 'bold';
                editable.style.color = typeof schema?.textColor === 'string' ? schema.textColor : '#000000';
                editable.style.background = 'transparent';
                editable.style.padding = '4px';
                editable.style.overflow = 'auto';
                editable.style.pointerEvents = 'auto';
                editable.style.userSelect = 'text';
                editable.style.caretColor = 'auto';
                editable.tabIndex = 0;

                const isEditableMode = (mode === 'designer' || mode === 'form');
                if (isEditableMode) {
                    editable.contentEditable = 'true';
                    editable.innerText = cellContent;
                    editable.style.cursor = 'text';
                    editable.setAttribute('spellcheck', 'false');
                    const stop = (e: Event) => e.stopPropagation();
                    editable.addEventListener('mousedown', stop);
                    editable.addEventListener('click', stop);
                    editable.addEventListener('dblclick', stop);
                    editable.addEventListener('touchstart', stop);
                    editable.addEventListener('keydown', stop);

                    const onInput = (e: Event) => {
                        state!.rows[rowIndex][colIndex] = (e.target as HTMLElement).innerText;
                    };
                    editable.addEventListener('input', onInput);

                    const onBlur = () => {
                        state!.rows[rowIndex][colIndex] = editable.innerText;
                        state!.focusedId = null;
                        persistAll();
                    };
                    editable.addEventListener('blur', onBlur);

                    editable.addEventListener('click', (e) => {
                        e.stopPropagation();
                        editable.focus();
                    });

                    editable.addEventListener('insert-variable', (e: Event) => {
                        e.stopPropagation();
                        const customEvent = e as CustomEvent;
                        const textToInsert = customEvent.detail?.value;
                        if (!textToInsert) return;
                        editable.focus();
                        insertTextAtSelection(String(textToInsert));
                        state!.rows[rowIndex][colIndex] = editable.innerText;
                        persistAll();
                    });
                } else {
                    editable.contentEditable = 'false';
                    editable.innerText = cellContent;
                    editable.style.cursor = 'default';
                }

                cell.appendChild(editable);
                rowWrapper.appendChild(cell);
            }
            tableContainer.appendChild(rowWrapper);
            rowWrappers.push(rowWrapper);
        });

        mainContainer.appendChild(tableContainer);

        const resizerLayer = document.createElement('div');
        Object.assign(resizerLayer.style, {
            position: 'absolute',
            left: '0',
            top: '0',
            right: '0',
            bottom: '0',
            pointerEvents: 'none',
            zIndex: '10001'
        });

        const getColPercentTemplate = () => {
            const total = (state!.colWidths!.reduce((a, b) => a + b, 0) || 1);
            return state!.colWidths!.map(w => `${(w / total) * 100}%`).join(' ');
        };

        const applyColWidthsToRows = () => {
            const tpl = getColPercentTemplate();
            rowWrappers.forEach(rw => {
                (rw.style as any).gridTemplateColumns = tpl;
            });
        };

        const applyRowHeights = () => {
            rowWrappers.forEach((rw, idx) => {
                rw.style.height = `${Math.max(MIN_ROW_PX, Math.round(state!.rowHeights![idx]))}px`;
                const ed = rw.querySelector('[data-cell-id]') as HTMLElement | null;
                if (ed) {
                    ed.style.minHeight = `${Math.max(24, Math.round(state!.rowHeights![idx]) - 8)}px`;
                }
            });
        };

        const persistAll = () => {
            if (!onChange) return;
            onChange([
                { key: 'content', value: JSON.stringify(state!.rows) },
                { key: 'cols', value: state!.cols },
                { key: 'colWidths', value: JSON.parse(JSON.stringify(state!.colWidths)) },
                { key: 'rowHeights', value: JSON.parse(JSON.stringify(state!.rowHeights)) }
            ]);
        };

        const createColResizers = () => {
            const totalWidthPx = state!.colWidths!.reduce((a, b) => a + b, 0) || 1;
            let cumLeftPercent = 0;
            resizerLayer.innerHTML = '';
            for (let ci = 0; ci < state!.cols; ci++) {
                const colPercent = (state!.colWidths![ci] / totalWidthPx) * 100;
                cumLeftPercent += colPercent;

                if (ci < state!.cols - 1) {
                    const handle = document.createElement('div');
                    Object.assign(handle.style, {
                        position: 'absolute',
                        top: '0px',
                        height: '100%',
                        width: '10px',
                        left: `${cumLeftPercent}%`,
                        transform: 'translateX(-5px)',
                        cursor: 'col-resize',
                        zIndex: '10002',
                        pointerEvents: 'auto',
                        background: 'transparent'
                    });
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
                        const total = startLeftWidth + startRightWidth;
                        if (newLeft + newRight < total) {
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
                        persistAll();
                        createColResizers();
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

        const createRowResizers = () => {
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
                        persistAll();
                        createRowResizers();
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

        rootElement.appendChild(mainContainer);

        if (mode == 'designer' || mode == 'form') {
            applyColWidthsToRows();
            applyRowHeights();
            createColResizers();
            createRowResizers();
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
                state!.rowHeights!.push(Math.max(rowMinHeightPx, rowMinHeightPx));
                persistAll();
                applyRowHeights();
            };

            const removeRowBtn = document.createElement('button');
            removeRowBtn.type = 'button';
            removeRowBtn.textContent = '−';
            removeRowBtn.title = 'Remove last row';
            styleSmallBtn(removeRowBtn);
            removeRowBtn.onclick = () => {
                if (state!.rows.length <= 1) return;
                state!.rows.pop();
                state!.rowHeights!.pop();
                persistAll();
                applyRowHeights();
            };

            bottomWrapper.appendChild(addRowBtn);
            bottomWrapper.appendChild(removeRowBtn);

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
                state!.rows = state!.rows.map(r => {
                    const copy = [...r];
                    copy.unshift('');
                    return copy;
                });
                const totalWidth = state!.colWidths!.reduce((a, b) => a + b, 0);
                const defaultWidth = Math.max(MIN_COL_PX, totalWidth / state!.cols);
                state!.colWidths!.unshift(defaultWidth);
                persistAll();
                applyColWidthsToRows();
                createColResizers();
            };

            const removeColLeft = document.createElement('button');
            removeColLeft.type = 'button';
            removeColLeft.textContent = '−';
            removeColLeft.title = 'Remove left column';
            styleSmallBtn(removeColLeft);
            removeColLeft.onclick = () => {
                if (state!.cols <= 1) return;
                state!.cols -= 1;
                state!.rows = state!.rows.map(r => r.slice(1));
                state!.colWidths!.shift();
                persistAll();
                applyColWidthsToRows();
                createColResizers();
            };

            leftColWrapper.appendChild(addColLeft);
            leftColWrapper.appendChild(removeColLeft);

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
                const totalWidth = state!.colWidths!.reduce((a, b) => a + b, 0);
                const defaultWidth = Math.max(MIN_COL_PX, totalWidth / state!.cols);
                state!.colWidths!.push(defaultWidth);
                persistAll();
                applyColWidthsToRows();
                createColResizers();
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
                persistAll();
                applyColWidthsToRows();
                createColResizers();
            };

            rightColWrapper.appendChild(addColRight);
            rightColWrapper.appendChild(removeColRight);

            rootElement.appendChild(bottomWrapper);
            rootElement.appendChild(leftColWrapper);
            rootElement.appendChild(rightColWrapper);
            rootElement.appendChild(resizerLayer);
        }

        const focusCellIfNeededLocal = (root: HTMLElement) => {
            const s = stateMap.get(root);
            if (!s || !s.focusedId) return;
            const el = root.querySelector(`[data-cell-id="${s.focusedId}"]`) as HTMLElement | null;
            if (el) {
                el.focus();
                const range = document.createRange();
                range.selectNodeContents(el);
                range.collapse(false);
                const sel = document.getSelection();
                if (sel) {
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            }
        };

        setTimeout(() => {
            applyColWidthsToRows();
            applyRowHeights();
            createColResizers();
            createRowResizers();
            focusCellIfNeededLocal(rootElement);
        }, 0);
    },

    pdf: async ({ page, schema, value }: PDFRenderProps<MyGridSchema>) => {
        const contentStr = value || schema.content || '[[""]]';
        const usedRows = parseContent(contentStr);

        const { position, cols = 1, width, height } = schema;

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
        const y = pageHeight - scaledY - scaledHeight;

        const uiColWidths = Array.isArray(schema.colWidths) && schema.colWidths.length === cols ? schema.colWidths : undefined;
        const uiRowHeights = Array.isArray(schema.rowHeights) && schema.rowHeights.length === usedRows.length ? schema.rowHeights : undefined;

        let colWidthsPdf: number[] = [];
        if (uiColWidths && uiColWidths.reduce((a, b) => a + b, 0) > 0) {
            const total = uiColWidths.reduce((a, b) => a + b, 0);
            colWidthsPdf = uiColWidths.map(w => (w / total) * scaledWidth);
        } else {
            const cw = scaledWidth / Math.max(1, cols);
            colWidthsPdf = Array.from({ length: cols }, () => cw);
        }

        let rowHeightsPdf: number[] = [];
        if (uiRowHeights && uiRowHeights.reduce((a, b) => a + b, 0) > 0) {
            const total = uiRowHeights.reduce((a, b) => a + b, 0);
            rowHeightsPdf = uiRowHeights.map(h => (h / total) * scaledHeight);
        } else {
            const rh = scaledHeight / Math.max(1, usedRows.length);
            rowHeightsPdf = Array.from({ length: usedRows.length }, () => rh);
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

        page.drawLine({
            start: { x, y: y + scaledHeight },
            end: { x: x + scaledWidth, y: y + scaledHeight },
            thickness: tableBorderWidth,
            color: tableColor,
        });

        page.drawLine({
            start: { x, y },
            end: { x: x + scaledWidth, y: y },
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

        const padding = 4;
        const textSize = (((typeof schema?.textSize === 'number' ? schema.textSize : 9)) * 0.8);
        const textColorStr = typeof schema?.textColor === 'string' ? schema.textColor : '#000000';
        const textColor = parseColor(textColorStr);

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
            let accFromTop = 0;
            for (let i = 0; i < rowHeightsPdf.length; i++) {
                const topY = y + scaledHeight - accFromTop;
                rowTops.push(topY);
                accFromTop += rowHeightsPdf[i];
            }
        })();

        usedRows.forEach((row, rowIndex) => {
            row.forEach((cellText, colIndex) => {
                if (cellText == null || String(cellText).trim() === '') return;
                const cellLeftX = colLefts[colIndex];
                const cellWidthPdf = colWidthsPdf[colIndex];
                const cellTopY = rowTops[rowIndex];
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
            content: JSON.stringify([
                ['', ''],
                ['', '']
            ]),
            cols: 2,
            tableBorderWidth: 1,
            tableBorderColor: '#000000',
            colBorderWidth: 1,
            colBorderColor: '#000000',
            textSize: 20,
            readOnly: true,
            required: false,
            textColor: '#000000',
            textWeight: 'normal'
        }
    }
};

export default myGridPlugin;