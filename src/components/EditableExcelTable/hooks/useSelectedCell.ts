import React, { useEffect, useRef, useState } from 'react';
import { useEditableTableStore } from 'src/components/EditableExcelTable/hooks/useEditableExcelTable';
import { dispatchMoveCellEvent, TMoveCellEvent } from 'src/components/EditableExcelTable/TableComponents/CustomEvents';

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

  useEffect(() => {
    if (!moveEventData) return;
    setIsEditing(false);
    setIsSelected(false);
    const cellPos = getNextSelectedCell({ direction: moveEventData.direction, prev: moveEventData.prev, totalColumns, totalRows });
    if (cellPos.colIndex === colIndex && cellPos.rowIndex === rowIndex) {
      setIsSelected(true);
    }
  }, [moveEventData, colIndex, rowIndex, totalColumns, totalRows]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    const direction = directionMap[e.key];
    if (!direction || !cellRef.current) return;
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
    cellRef
  };
};

export default useSelectedCell;
