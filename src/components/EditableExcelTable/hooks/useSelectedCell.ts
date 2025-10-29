import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useEditableTableStore } from 'src/components/EditableExcelTable/hooks/useEditableExcelTable';
import { dispatchMoveCellEvent, dispatchSelectionEvent, TMoveCellEvent } from 'src/components/EditableExcelTable/CustomEvents';

const directionMap: Record<string, TMoveCellEvent['direction']> = {
  ArrowRight: 'right',
  ArrowLeft: 'left',
  ArrowDown: 'down',
  ArrowUp: 'up',
  Enter: 'down',
  Tab: 'right'
};

type CellPosition = { rowIndex: number; colIndex: number };

const getNextSelectedCell = ({
  direction,
  totalRows,
  totalColumns,
  prev
}: {
  prev: CellPosition;
  direction: TMoveCellEvent['direction'];
  totalRows: number;
  totalColumns: number;
}): CellPosition => {
  let newData = { ...prev };
  switch (direction) {
    case 'up': {
      newData.rowIndex = Math.max(prev.rowIndex - 1, 0);
      break;
    }
    case 'down': {
      newData.rowIndex = Math.min(prev.rowIndex + 1, totalRows - 1);
      break;
    }
    case 'left': {
      newData.colIndex = Math.max(prev.colIndex - 1, 0);
      break;
    }
    case 'right': {
      newData.colIndex = Math.min(prev.colIndex + 1, totalColumns - 1);
      break;
    }
  }

  return newData;
};

const useSelectedCell = ({
  colIndex,
  rowIndex,
  totalColumns,
  totalRows
}: {
  colIndex: number;
  rowIndex: number;
  totalRows: number;
  totalColumns: number;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const cellRef = useRef<HTMLTableDataCellElement>(null);
  const [moveEventData] = useEditableTableStore((state) => state.moveEventData);
  const [, setStore] = useEditableTableStore((store) => store.pasteKey);

  useEffect(() => {
    if (!moveEventData) return;
    setIsEditing(false);
    setIsSelected(false);
    const cellPos = getNextSelectedCell({ direction: moveEventData.direction, prev: moveEventData.prev, totalColumns, totalRows });
    if (cellPos.colIndex === colIndex && cellPos.rowIndex === rowIndex) {
      setIsSelected(true);
      cellRef.current?.focus();
    }
  }, [moveEventData, colIndex, rowIndex, totalColumns, totalRows]);

  const handleClick = useCallback(() => {
    dispatchSelectionEvent(document.body, {
      startCell: { row: rowIndex, col: colIndex },
      endCell: { row: rowIndex, col: colIndex },
      selectedRange: [{ row: rowIndex, col: colIndex }]
    });

    setIsSelected(true);
  }, [colIndex, rowIndex]);

  // set touchede rows
  useEffect(() => {
    if (!isSelected) return;
    setStore((prev) => {
      const touchedRows = new Map(prev.touchedRows);
      touchedRows.set(rowIndex, isSelected);
      return { touchedRows };
    });
  }, [isSelected, rowIndex, setStore]);

  const exitEditMode = useCallback(() => {
    setIsSelected(false);
    setIsEditing(false);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Escape') {
      exitEditMode();
    }
    if (!e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey && e.key.length === 1) {
      setIsEditing(true);
    }
    const direction = directionMap[e.key];
    if (!direction || !cellRef.current) return;
    // e.preventDefault();
    // e.stopPropagation();
    const payload: TMoveCellEvent = {
      prev: {
        colIndex,
        rowIndex
      },
      direction
    };
    dispatchMoveCellEvent(cellRef.current, payload);
  };

  return {
    isEditing,
    isSelected,
    setIsEditing,
    setIsSelected,
    handleKeyDown,
    exitEditMode,
    handleClick,
    cellRef
  };
};

export default useSelectedCell;
