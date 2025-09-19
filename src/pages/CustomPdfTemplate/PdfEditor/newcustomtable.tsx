import type { Plugin, PDFRenderProps, Schema, UIRenderProps } from '@pdfme/common';
import { rgb } from '@pdfme/pdf-lib';
import { PLUGIN } from 'src/constants/helpers';

interface MyGridSchema extends Schema {
    type: 'table';
    rows: string[][];
    cols: number;
    head?: string[];
    showHeader?: boolean;
    basePdf?: { width: number; height: number };
    colWidths?: number[];
}
const stateMap = new WeakMap<HTMLElement, {
    rows: string[][];
    cols: number;
    head?: string[];
    colWidths?: number[];
    debounce?: number | null;
    focusedId?: string | null;
}>();

const MIN_COL_PERCENT = 5;
const stopPropagationFor = (el: HTMLElement | HTMLTextAreaElement) => {
    const stop = (e: Event) => e.stopPropagation();
    el.addEventListener('mousedown', stop);
    el.addEventListener('click', stop);
    el.addEventListener('dblclick', stop);
    el.addEventListener('touchstart', stop);
    el.addEventListener('focus', stop, true as any);
    el.addEventListener('keydown', (e) => (e as Event).stopPropagation());
};
const persistState = (root: HTMLElement, onChange: UIRenderProps<MyGridSchema>['onChange']) => {
    const s = stateMap.get(root);
    if (!s || !onChange) return;
    const changes: Array<{ key: string; value: any }> = [
        { key: 'rows', value: JSON.parse(JSON.stringify(s.rows)) }
    ];
    if (typeof s.head !== 'undefined') changes.push({ key: 'head', value: JSON.parse(JSON.stringify(s.head)) });
    if (typeof s.colWidths !== 'undefined') changes.push({ key: 'colWidths', value: JSON.parse(JSON.stringify(s.colWidths)) });
    onChange(changes.length === 1 ? (changes[0] as any) : (changes as any));
};

const debouncePersist = (root: HTMLElement, onChange: UIRenderProps<MyGridSchema>['onChange'], delay = 400) => {
    const s = stateMap.get(root);
    if (!s) return;
    if (s.debounce) window.clearTimeout(s.debounce);
    s.debounce = window.setTimeout(() => {
        persistState(root, onChange);
        s.debounce = null;
    }, delay) as unknown as number;
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

const distributeEqual = (cols: number) => {
    const base = Math.floor((10000 / cols)) / 100;
    const arr = Array(cols).fill(base);
    const sum = arr.reduce((a, b) => a + b, 0);
    arr[arr.length - 1] += (100 - sum);
    return arr;
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

const myGridPlugin: Plugin<MyGridSchema> = {
    ui: async (props: UIRenderProps<MyGridSchema>) => {
        const { rootElement, onChange, mode, schema } = props;
        const incomingRows = (schema?.rows as string[][]) ?? [['']];
        const incomingCols = (schema?.cols as number) ?? 1;
        const incomingHead = (schema?.head as string[] | undefined) ?? Array(incomingCols).fill('');
        const incomingShowHeader = !!schema?.showHeader;
        const incomingColWidths = (schema?.colWidths as number[] | undefined) ?? distributeEqual(incomingCols);

        let state = stateMap.get(rootElement);
        if (!state) {
            state = {
                rows: JSON.parse(JSON.stringify(incomingRows)),
                cols: incomingCols,
                head: JSON.parse(JSON.stringify(incomingHead)),
                colWidths: JSON.parse(JSON.stringify(incomingColWidths)),
                focusedId: null
            };
            stateMap.set(rootElement, state);
        } else {
            if (incomingCols !== state.cols) {
                state.cols = incomingCols;
                state.rows = state.rows.map(r => {
                    const copy = [...r];
                    while (copy.length < state!.cols) copy.push('');
                    if (copy.length > state!.cols) copy.length = state!.cols;
                    return copy;
                });
                state.head = state.head ?? [];
                while (state.head.length < state.cols) state.head.push('');
                if (state.head.length > state.cols) state.head.length = state.cols;
                state.colWidths = (schema?.colWidths && Array.isArray(schema.colWidths)) ? JSON.parse(JSON.stringify(schema.colWidths)) : distributeEqual(state.cols);
            }
            if (incomingRows.length !== state.rows.length || incomingRows.some((r, i) => !state!.rows[i] || state!.rows[i].length !== r.length)) {
                state.rows = JSON.parse(JSON.stringify(incomingRows));
            }
            if (Array.isArray(schema?.head)) {
                const incomingH = JSON.parse(JSON.stringify(schema!.head));
                if (JSON.stringify(incomingH) !== JSON.stringify(state.head)) {
                    state.head = incomingH;
                }
            }
            if (Array.isArray(schema?.colWidths)) {
                const incomingW = JSON.parse(JSON.stringify(schema!.colWidths));
                if (JSON.stringify(incomingW) !== JSON.stringify(state.colWidths)) {
                    state.colWidths = incomingW;
                }
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
        const visualRows = rowsCount + (schema?.showHeader ? 1 : 0);
        const rowMinHeightPx = (typeof schema?.height === 'number' && schema.height > 0)
            ? Math.max(28, Math.floor((schema.height as number) / Math.max(1, visualRows)))
            : 34;

        const mainContainer = document.createElement('div');
        Object.assign(mainContainer.style, {
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'visible'
        });

        const tableContainer = document.createElement('div');
        Object.assign(tableContainer.style, {
            flex: '1',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative'
        });

        const colTemplate = (state.colWidths && state.colWidths.length === state.cols)
            ? state.colWidths.map(w => `${w}%`).join(' ')
            : `repeat(${state.cols}, 1fr)`;

        // RENDER HEADER
        if (schema?.showHeader) {
            const headerWrapper = document.createElement('div');
            Object.assign(headerWrapper.style, {
                display: 'grid',
                gridTemplateColumns: colTemplate,
                borderBottom: `${typeof schema?.colBorderWidth === 'number' ? schema.colBorderWidth : 1}px solid ${typeof schema?.colBorderColor === 'string' ? schema.colBorderColor : '#e6eefc'}`,
                minHeight: `${rowMinHeightPx}px`,
                alignItems: 'stretch',
                boxSizing: 'border-box',
                width: '100%',
                background: 'transparent',
                position: 'relative'
            });

            state.head = state.head ?? [];
            while (state.head.length < state.cols) state.head.push('');
            if (state.head.length > state.cols) state.head.length = state.cols;

            for (let colIndex = 0; colIndex < state.cols; colIndex++) {
                const label = state.head[colIndex] ?? '';
                const cell = document.createElement('div');
                Object.assign(cell.style, {
                    borderRight: colIndex < state.cols - 1 ? `${typeof schema?.colBorderWidth === 'number' ? schema.colBorderWidth : 1}px solid ${typeof schema?.colBorderColor === 'string' ? schema.colBorderColor : '#e6eefc'}` : 'none',
                    display: 'flex',
                    alignItems: 'stretch',
                    padding: '4px',
                    boxSizing: 'border-box',
                    width: '100%',
                    position: 'relative'
                });

                const input = document.createElement('textarea');
                input.value = label;
                input.setAttribute('data-cell-id', `header-${colIndex}`);
                Object.assign(input.style, {
                    width: '100%',
                    height: '100%',
                    minHeight: `${Math.max(24, rowMinHeightPx - 8)}px`,
                    resize: 'none',
                    border: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontSize: `${(typeof schema?.textSize === 'number' ? schema.textSize : 20)}px`,
                    fontFamily: 'Roboto, Roboto-bold',
                    fontWeight: 'bold',
                    color: typeof schema?.textColor === 'string' ? schema.textColor : '#000000',
                    background: 'transparent',
                    padding: '4px',
                    overflow: 'auto',
                    pointerEvents: 'auto',
                    userSelect: 'text',
                    caretColor: 'auto',
                });
                input.tabIndex = 0;
                input.autocomplete = 'off';
                input.spellcheck = false;
                stopPropagationFor(input);

                input.addEventListener('input', (e: Event) => {
                    const val = (e.target as HTMLTextAreaElement).value;
                    state!.head![colIndex] = val;
                    debouncePersist(rootElement, onChange!, 300);
                });

                input.addEventListener('blur', () => {
                    persistState(rootElement, onChange!);
                });

                cell.appendChild(input);

                if (colIndex < state.cols - 1) {
                    const res = document.createElement('div');
                    Object.assign(res.style, {
                        position: 'absolute',
                        top: '0',
                        right: '0',
                        width: '8px',
                        height: '100%',
                        cursor: 'col-resize',
                        zIndex: '10001',
                        transform: 'translateX(50%)',
                        background: 'transparent'
                    });
                    initializeResizer(res, rootElement, state, colIndex, onChange, tableContainer);
                    cell.appendChild(res);
                }
                headerWrapper.appendChild(cell);
            }

            tableContainer.appendChild(headerWrapper);
        }

        // RENDER BODY ROWS
        state.rows.forEach((row, rowIndex) => {
            const rowWrapper = document.createElement('div');
            Object.assign(rowWrapper.style, {
                display: 'grid',
                gridTemplateColumns: colTemplate,
                borderBottom: `${typeof schema?.colBorderWidth === 'number' ? schema.colBorderWidth : 1}px solid ${typeof schema?.colBorderColor === 'string' ? schema.colBorderColor : '#e6eefc'}`,
                minHeight: `${rowMinHeightPx}px`,
                alignItems: 'stretch',
                boxSizing: 'border-box',
                width: '100%',
                position: 'relative'
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
                    width: '100%',
                    position: 'relative'
                });

                const input = document.createElement('textarea');
                input.value = cellContent;
                input.setAttribute('data-cell-id', `${rowIndex}-${colIndex}`);
                Object.assign(input.style, {
                    width: '100%',
                    height: '100%',
                    minHeight: `${Math.max(24, rowMinHeightPx - 8)}px`,
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
                    debouncePersist(rootElement, onChange!, 300);
                };

                const onBlur = () => {
                    persistState(rootElement, onChange!);
                };

                input.addEventListener('input', onInput);
                input.addEventListener('blur', onBlur);

                // VARIABLE insertion event preserved
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
                    debouncePersist(rootElement, onChange!, 100);
                });

                if (schema?.readOnly) input.readOnly = true;

                cell.appendChild(input);

                if (colIndex < state.cols - 1) {
                    const res = document.createElement('div');
                    Object.assign(res.style, {
                        position: 'absolute',
                        top: '0',
                        right: '0',
                        width: '8px',
                        height: '100%',
                        cursor: 'col-resize',
                        zIndex: '10001',
                        transform: 'translateX(50%)',
                        background: 'transparent'
                    });
                    initializeResizer(res, rootElement, state, colIndex, onChange, tableContainer);
                    cell.appendChild(res);
                }

                rowWrapper.appendChild(cell);
            }

            tableContainer.appendChild(rowWrapper);
        });

        mainContainer.appendChild(tableContainer);

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
                onChange?.([
                    { key: 'rows', value: JSON.parse(JSON.stringify(state!.rows)) },
                    { key: 'cols', value: state!.cols },
                    { key: 'colWidths', value: JSON.parse(JSON.stringify(state!.colWidths)) }
                ]);
                setTimeout(() => focusCellIfNeeded(rootElement), 0);
            };

            const removeRowBtn = document.createElement('button');
            removeRowBtn.type = 'button';
            removeRowBtn.textContent = '−';
            removeRowBtn.title = 'Remove last row';
            styleSmallBtn(removeRowBtn);
            removeRowBtn.onclick = () => {
                if (state!.rows.length <= 1) return;
                state!.rows.pop();
                onChange?.([
                    { key: 'rows', value: JSON.parse(JSON.stringify(state!.rows)) },
                    { key: 'cols', value: state!.cols },
                    { key: 'colWidths', value: JSON.parse(JSON.stringify(state!.colWidths)) }
                ]);
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
                state!.head = state!.head ?? [];
                state!.head.unshift('');
                state!.colWidths = state!.colWidths ?? distributeEqual(state!.cols);
                const insertAt = 0;
                const newWidth = state!.colWidths[insertAt] ? state!.colWidths[insertAt] / 2 : (100 / state!.cols);
                state!.colWidths[insertAt] = newWidth;
                state!.colWidths.splice(insertAt, 0, newWidth);
                const sum = state!.colWidths.reduce((a, b) => a + b, 0);
                state!.colWidths = state!.colWidths.map(w => (w / sum) * 100);
                onChange?.([
                    { key: 'cols', value: state!.cols },
                    { key: 'rows', value: JSON.parse(JSON.stringify(state!.rows)) },
                    { key: 'head', value: JSON.parse(JSON.stringify(state!.head)) },
                    { key: 'colWidths', value: JSON.parse(JSON.stringify(state!.colWidths)) },
                ]);
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
                state!.head = (state!.head ?? []).slice(1);
                state!.colWidths = (state!.colWidths ?? []).slice(1);
                const sum = state!.colWidths.reduce((a, b) => a + b, 0) || 1;
                state!.colWidths = state!.colWidths.map(w => (w / sum) * 100);
                onChange?.([
                    { key: 'cols', value: state!.cols },
                    { key: 'rows', value: JSON.parse(JSON.stringify(state!.rows)) },
                    { key: 'head', value: JSON.parse(JSON.stringify(state!.head)) },
                    { key: 'colWidths', value: JSON.parse(JSON.stringify(state!.colWidths)) },
                ]);
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
                state!.head = state!.head ?? [];
                while (state!.head.length < state!.cols) state!.head.push('');
                state!.colWidths = state!.colWidths ?? distributeEqual(state!.cols);
                const newW = 100 / state!.cols;
                state!.colWidths = state!.colWidths.map(w => (w / 100) * (100 - newW));
                state!.colWidths.push(newW);
                const sum = state!.colWidths.reduce((a, b) => a + b, 0);
                state!.colWidths = state!.colWidths.map(w => (w / sum) * 100);
                onChange?.([
                    { key: 'cols', value: state!.cols },
                    { key: 'rows', value: JSON.parse(JSON.stringify(state!.rows)) },
                    { key: 'head', value: JSON.parse(JSON.stringify(state!.head)) },
                    { key: 'colWidths', value: JSON.parse(JSON.stringify(state!.colWidths)) },
                ]);
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
                state!.head = (state!.head ?? []).slice(0, state!.cols);
                state!.colWidths = (state!.colWidths ?? []).slice(0, state!.cols);
                const sum = state!.colWidths.reduce((a, b) => a + b, 0) || 1;
                state!.colWidths = state!.colWidths.map(w => (w / sum) * 100);
                onChange?.([
                    { key: 'cols', value: state!.cols },
                    { key: 'rows', value: JSON.parse(JSON.stringify(state!.rows)) },
                    { key: 'head', value: JSON.parse(JSON.stringify(state!.head)) },
                    { key: 'colWidths', value: JSON.parse(JSON.stringify(state!.colWidths)) },
                ]);
            };

            rightColWrapper.appendChild(addColRight);
            rightColWrapper.appendChild(removeColRight);

            rootElement.appendChild(bottomWrapper);
            rootElement.appendChild(leftColWrapper);
            rootElement.appendChild(rightColWrapper);

            setTimeout(() => focusCellIfNeeded(rootElement), 0);
        }

        rootElement.appendChild(mainContainer);
        setTimeout(() => focusCellIfNeeded(rootElement), 0);
    },

    pdf: async ({ page, schema }: PDFRenderProps<MyGridSchema>) => {
        const { position, rows = [['']], cols = 1, width, height, head = [], showHeader = false, colWidths = undefined } = schema;
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

        const visualRows = rows.length + (showHeader ? 1 : 0);
        const cellHeight = scaledHeight / Math.max(1, visualRows);

        const widths = (Array.isArray(colWidths) && colWidths.length === cols) ? colWidths : distributeEqual(cols);
        const cellWidthsPx = widths.map(w => (w / 100) * scaledWidth);

        const tableBorderWidth = (typeof schema?.tableBorderWidth === 'number' ? schema.tableBorderWidth : 1);
        const colBorderWidth = (typeof schema?.colBorderWidth === 'number' ? schema.colBorderWidth : 1);

        const tableBorderColor = typeof schema?.tableBorderColor === 'string' ? schema.tableBorderColor : '#000000';
        const colBorderColor = typeof schema?.colBorderColor === 'string' ? schema.colBorderColor : '#e6e6e6';

        const parseColor = (colorStr: string) => {
            if (!colorStr || !colorStr.startsWith('#')) return rgb(0, 0, 0);
            const hex = colorStr.slice(1);
            const r = parseInt(hex.slice(0, 2), 16) / 255;
            const g = parseInt(hex.slice(2, 4), 16) / 255;
            const b = parseInt(hex.slice(4, 6), 16) / 255;
            return rgb(r, g, b);
        };

        const tableColor = parseColor(tableBorderColor);
        const colColor = parseColor(colBorderColor);

        // outer rect
        page.drawLine({ start: { x, y: y + scaledHeight }, end: { x: x + scaledWidth, y: y + scaledHeight }, thickness: tableBorderWidth, color: tableColor });
        page.drawLine({ start: { x, y }, end: { x: x + scaledWidth, y: y }, thickness: tableBorderWidth, color: tableColor });
        page.drawLine({ start: { x, y }, end: { x: x, y: y + scaledHeight }, thickness: tableBorderWidth, color: tableColor });
        page.drawLine({ start: { x: x + scaledWidth, y }, end: { x: x + scaledWidth, y: y + scaledHeight }, thickness: tableBorderWidth, color: tableColor });

        for (let i = 1; i < visualRows; i++) {
            const lineY = y + scaledHeight - i * cellHeight;
            page.drawLine({ start: { x, y: lineY }, end: { x: x + scaledWidth, y: lineY }, thickness: colBorderWidth, color: colColor });
        }

        let accX = x;
        for (let i = 0; i < cols - 1; i++) {
            accX += cellWidthsPx[i];
            page.drawLine({ start: { x: accX, y }, end: { x: accX, y: y + scaledHeight }, thickness: colBorderWidth, color: colColor });
        }

        const padding = 4;
        const textSize = (typeof schema?.textSize === 'number' ? schema.textSize : 9);
        const textColorStr = typeof schema?.textColor === 'string' ? schema.textColor : '#000000';
        const textColor = parseColor(textColorStr);

        if (showHeader && Array.isArray(head)) {
            let acc = x;
            for (let colIndex = 0; colIndex < cols; colIndex++) {
                const cw = cellWidthsPx[colIndex];
                const label = head[colIndex];
                if (label) {
                    const textX = acc + padding;
                    const topY = y + scaledHeight - 0 * cellHeight;
                    const textY = topY - padding - textSize;
                    page.drawText(String(label), { x: textX, y: textY, size: textSize, color: textColor, maxWidth: cw - padding * 2 });
                }
                acc += cw;
            }
        }

        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
            const row = rows[rowIndex];
            const visualRowIndex = rowIndex + (showHeader ? 1 : 0);
            let acc = x;
            for (let colIndex = 0; colIndex < cols; colIndex++) {
                const cw = cellWidthsPx[colIndex];
                const cellText = row[colIndex];
                if (cellText) {
                    const textX = acc + padding;
                    const topY = y + scaledHeight - visualRowIndex * cellHeight;
                    const textY = topY - padding - textSize;
                    page.drawText(String(cellText), { x: textX, y: textY, size: textSize, color: textColor, maxWidth: cw - padding * 2 });
                }
                acc += cw;
            }
        }
    },

    propPanel: {
        schema: () => ({
            showHeader: {
                title: 'Show Header',
                type: 'boolean',
                widget: 'switch',
                default: false
            },
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
            type: 'table',
            position: { x: 50, y: 500 },
            width: 30,
            height: 20,
            rows: [['', '']],
            cols: 2,
            head: ['', ''],
            showHeader: false,
            colWidths: [50, 50],
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

function initializeResizer(
    resEl: HTMLElement,
    rootEl: HTMLElement,
    state: { colWidths?: number[]; cols: number; rows: string[][]; head?: string[] },
    colIndex: number,
    onChange: UIRenderProps<MyGridSchema>['onChange'],
    containerEl: HTMLElement
) {
    let startX = 0;
    let startWidths: number[] = [];
    let containerRect: DOMRect | null = null;
    const onMouseMove = (ev: MouseEvent) => {
        if (!containerRect) return;
        const deltaPx = ev.clientX - startX;
        const containerWidth = containerRect.width || 1;
        const deltaPercent = (deltaPx / containerWidth) * 100;
        const wLeft = clamp(startWidths[colIndex] + deltaPercent, MIN_COL_PERCENT, 100 - MIN_COL_PERCENT * (state.cols - 1));
        const wRight = clamp(startWidths[colIndex + 1] - deltaPercent, MIN_COL_PERCENT, 100 - MIN_COL_PERCENT * (state.cols - 1));
        const newWidths = [...startWidths];
        newWidths[colIndex] = wLeft;
        newWidths[colIndex + 1] = wRight;
        const sum = newWidths.reduce((a, b) => a + b, 0);
        if (sum !== 100) {
            const factor = 100 / sum;
            for (let i = 0; i < newWidths.length; i++) newWidths[i] = newWidths[i] * factor;
        }
        state.colWidths = newWidths.map(n => Math.round(n * 100) / 100);
        const gridWrappers = rootEl.querySelectorAll<HTMLElement>('[style*="display: grid"]');
        const template = state.colWidths.map(w => `${w}%`).join(' ');
        gridWrappers.forEach(g => {
            g.style.gridTemplateColumns = template;
        });
    };
    const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        persistState(rootEl, onChange!);
    };

    resEl.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        e.preventDefault();
        startX = (e as MouseEvent).clientX;
        startWidths = (state.colWidths && state.colWidths.length === state.cols) ? [...state.colWidths] : distributeEqual(state.cols);
        containerRect = containerEl.getBoundingClientRect();
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}
