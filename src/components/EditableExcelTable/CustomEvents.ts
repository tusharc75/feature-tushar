import { CellPosition } from 'src/components/EditableExcelTable/types';

export const CELL_EDIT_EVENT = 'cellEdit';
export type CellEditEvent = {
  accessor: string;
  rowIndex: number;
  value: string | number | string[] | number[];
};
export function dispatchCellEditEvent(element: HTMLElement, details: CellEditEvent) {
  const cellEditEvent = new CustomEvent(CELL_EDIT_EVENT, {
    detail: details,
    bubbles: true,
    cancelable: true
  });
  element.dispatchEvent(cellEditEvent);
}

export const MOVE_SELECTED_CELL = 'moveSelectedCell';
export type TMoveCellEvent = {
  direction: 'up' | 'down' | 'left' | 'right';
  prev: {
    rowIndex: number;
    colIndex: number;
  };
};
export function dispatchMoveCellEvent(element: HTMLElement, details: TMoveCellEvent) {
  const moveCellEvent = new CustomEvent(MOVE_SELECTED_CELL, {
    detail: details,
    bubbles: true,
    cancelable: true
  });
  element.dispatchEvent(moveCellEvent);
}

export type SelectedRange = {
  startCell: CellPosition;
  endCell: CellPosition;
  selectedRange: CellPosition[];
};
export const SELECTED_RANGE = 'selectedRange';
export function dispatchSelectionEvent(element: HTMLElement, details: SelectedRange | null) {
  const selectedRangeEvent = new CustomEvent(SELECTED_RANGE, {
    detail: details,
    bubbles: true,
    cancelable: true
  });
  element.dispatchEvent(selectedRangeEvent);
}

export type PastedRange = {
  startCell: CellPosition;
  endCell: CellPosition;
};
export const PASTED_RANGE = 'pastedRange';
export function dispatchPastedRangeEvent(element: HTMLElement, details: PastedRange) {
  const pastedRangeEvent = new CustomEvent(PASTED_RANGE, {
    detail: details,
    bubbles: true,
    cancelable: true
  });
  element.dispatchEvent(pastedRangeEvent);
}
