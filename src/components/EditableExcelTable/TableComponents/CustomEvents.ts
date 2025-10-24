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
