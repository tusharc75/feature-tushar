import { useCallback, useEffect, useRef, useState } from 'react';
import { TColType } from 'src/components/CustomReactTable/TableComponents/TableHelperComponents';
import { dispatchSelectionEvent, PASTED_RANGE, PastedRange } from 'src/components/EditableExcelTable/CustomEvents';
import { CellPosition } from 'src/components/EditableExcelTable/types';
import { copyRangeToClipboard, getCellFormattedValue, getRange } from 'src/components/EditableExcelTable/utils';
import { useEffectEvent } from 'src/hooks/useEffectEvent';

const DASHED_BORDER = ['outline-1', 'outline-blue-500', 'outline-dashed', 'outline-offset-[-2px]'];

export const useTableRange = ({
  columns,
  containerRef,
  data,
  rangeRef,
  tableBodyRef
}: {
  tableBodyRef: React.MutableRefObject<HTMLTableSectionElement>;
  columns: TColType[];
  data: any[];
  containerRef: React.MutableRefObject<HTMLDivElement>;
  rangeRef: React.MutableRefObject<HTMLDivElement>;
}) => {
  const [selectedRange, setSelectedRange] = useState<{ row: number; col: number }[] | null>(null);
  const [selectedRagneMap, setSelectedRangeMap] = useState<Map<string, boolean>>(null);
  const [copied, setCopied] = useState(false);
  const selectedrange2dArray = useRef<number[][]>(null);
  const startCellRect = useRef<DOMRect>(null);
  const endCellRect = useRef<DOMRect>(null);
  const prevPositions = useRef<{ top: number; left: number }>({ top: Infinity, left: Infinity });

  // Refs to avoid stale closures inside event listeners
  const startCellRef = useRef<CellPosition | null>(null);
  const endCellRef = useRef<CellPosition | null>(null);

  const updateRangeBox = useEffectEvent(() => {
    if (!startCellRect.current || !endCellRect.current) return;

    const borderElement = rangeRef.current;
    borderElement.classList.remove('hidden');

    const rect1 = startCellRect.current!;
    const rect2 = endCellRect.current!;
    const container = containerRef.current!;
    const containerRect = container.getBoundingClientRect();
    // document.body.style.overflow = 'hidden';

    let top = Math.min(rect1.top, rect2.top) - containerRect.top + container.scrollTop;
    let left = Math.min(rect1.left, rect2.left) - containerRect.left + container.scrollLeft;

    if (prevPositions.current.top < top) {
      top = prevPositions.current.top;
    } else {
      prevPositions.current.top = top;
    }

    if (prevPositions.current.left < left) {
      left = prevPositions.current.left;
    } else {
      prevPositions.current.left = left;
    }

    const bottom = Math.max(rect1.bottom, rect2.bottom) - containerRect.top + container.scrollTop;
    const right = Math.max(rect1.right, rect2.right) - containerRect.left + container.scrollLeft;

    borderElement.style.top = `${top}px`;
    borderElement.style.left = `${left}px`;
    borderElement.style.height = `${bottom - top - 2}px`;
    borderElement.style.width = `${right - left - 2}px`;
  });

  useEffect(() => {
    const showPastedRange = (e: CustomEvent<PastedRange>) => {
      const { endCell, startCell } = e.detail;
      startCellRect.current = tableBodyRef.current
        ?.querySelector?.(`td[data-row="${startCell.row}"][data-col="${startCell.col}"]`)
        ?.getBoundingClientRect?.();
      endCellRect.current = tableBodyRef.current
        ?.querySelector?.(`td[data-row="${endCell.row}"][data-col="${endCell.col}"]`)
        ?.getBoundingClientRect?.();
      if (startCellRect.current && endCellRect.current) {
        updateRangeBox();
      }
    };
    window.addEventListener(PASTED_RANGE, showPastedRange);
    return () => {
      window.removeEventListener(PASTED_RANGE, showPastedRange);
    };
  }, [tableBodyRef, updateRangeBox]);

  const onMouseOver = useCallback(
    (e: MouseEvent) => {
      const cell = (e.target as HTMLElement).closest('td');
      if (!cell || !startCellRef.current) return;
      endCellRect.current = cell.getBoundingClientRect();
      endCellRef.current = {
        row: Number(cell.getAttribute('data-row')),
        col: Number(cell.getAttribute('data-col'))
      };
      updateRangeBox();
    },
    [updateRangeBox]
  );

  const onMouseUp = useCallback(() => {
    document.body.removeEventListener('mouseover', onMouseOver);
    document.body.removeEventListener('mouseup', onMouseUp);
    prevPositions.current = { top: Infinity, left: Infinity };
    // document.body.style.overflow = '';
    if (startCellRef.current && endCellRef.current) {
      const { cells, map, twoDimentionalArray } = getRange(startCellRef.current, endCellRef.current);

      dispatchSelectionEvent(tableBodyRef.current, {
        endCell: endCellRef.current,
        startCell: startCellRef.current,
        selectedRange: cells
      });
      setSelectedRange(cells);
      setSelectedRangeMap(map);
      selectedrange2dArray.current = twoDimentionalArray;
    }

    startCellRef.current = null;
    endCellRef.current = null;
  }, [onMouseOver, tableBodyRef]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLTableDataCellElement, MouseEvent>) => {
      const cell = (e.target as HTMLElement).closest('td');
      if (!cell) return;
      prevPositions.current = { top: Infinity, left: Infinity };
      setCopied(false);

      const start = {
        row: Number(cell.getAttribute('data-row')),
        col: Number(cell.getAttribute('data-col'))
      };
      startCellRect.current = cell.getBoundingClientRect();

      startCellRef.current = start;
      endCellRef.current = start;
      rangeRef.current.classList.add('hidden');
      rangeRef.current.classList.remove(...DASHED_BORDER);

      document.body.addEventListener('mouseover', onMouseOver);
      document.body.addEventListener('mouseup', onMouseUp);
    },
    [onMouseOver, onMouseUp, rangeRef]
  );

  // click outside table unselect everything
  useEffect(() => {
    function listener(event: MouseEvent | TouchEvent) {
      // Do nothing if clicking inside the ref element
      if (!tableBodyRef.current || tableBodyRef.current.contains(event.target as Node)) {
        return;
      }
      setSelectedRange(null);
      setSelectedRangeMap(null);
      selectedrange2dArray.current = null;
      rangeRef.current.classList.add('hidden');
    }

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [tableBodyRef, rangeRef]);

  // copy range
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (!selectedrange2dArray.current) return;
      if ((e.metaKey || e.ctrlKey) && ['C', 'c'].includes(e.key)) {
        const cellValues: string[][] = [];
        selectedrange2dArray.current.forEach((row, i) => {
          const tempData = [];
          if (row) {
            row.forEach((col) => {
              tempData.push(getCellFormattedValue(columns[col], data[i]));
            });
            cellValues.push(tempData);
          }
        });
        try {
          await copyRangeToClipboard(cellValues);
          setCopied(true);
          rangeRef.current.classList.add(...DASHED_BORDER);
        } catch (error) {
          console.log(error);
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [data, columns, rangeRef]);

  return {
    onMouseDown,
    selectedRange,
    selectedRagneMap,
    copied
  };
};
