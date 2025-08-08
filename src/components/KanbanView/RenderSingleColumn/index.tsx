import { CheckCircle, RadioButtonUnchecked } from '@mui/icons-material';
import { Checkbox, Skeleton } from '@mui/material';
import { useVirtualizer } from '@tanstack/react-virtual';
import axios, { CancelToken } from 'axios';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getRandomNumber } from 'src/components/AiChatbox/utils';
import RenderSingleCard from 'src/components/KanbanView/RenderSingleColumn/RenderSIngleCard';
import useColumns from 'src/components/KanbanView/RenderSingleColumn/useColumns';
import useDragAndDrop from 'src/components/KanbanView/RenderSingleColumn/useDragAndDrop';
import { Column, FetchCanbanData, Option, UseCanbanStore } from 'src/components/KanbanView/types';
import { cn } from 'src/constants/helpers';

const LIMIT = 10;

type RenderSingleColumnProps<D> = {
  onSaveEdit?: (inputField: Record<string, string>, updatedData: any, shouldFetchData?: boolean) => Promise<void>;
  fetchData: FetchCanbanData<D>;
  option: Option;
  dependencyArray?: any[];
  state: UseCanbanStore<D>;
  columns: Column<D>[];
  hideSelection?: boolean;
  setActiveDragItemProps: React.Dispatch<any>;
  pivotColumn: Column<D>;
  refreshSignal: number;
  setLoadingComplte: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
};

const RenderSingleColumn = <D,>({
  fetchData,
  onSaveEdit,
  option,
  dependencyArray = [],
  columns,
  state,
  hideSelection,
  setActiveDragItemProps,
  pivotColumn,
  refreshSignal,
  setLoadingComplte
}: RenderSingleColumnProps<D>) => {
  const { actionColumn, displayedColumns, hiddenColumns, indexColumn, primaryColumn } = useColumns({ columns });
  const parentRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [newDataLoading, setNewDataLoading] = useState(false);
  const [rows, setRows] = useState<D[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);

  const isAllSelected = useMemo(() => {
    if (rows.length === 0) {
      return false;
    }
    return rows.every((d) => state.selectedRrowsMap.has(d['_id']));
  }, [state.selectedRrowsMap, rows]);

  const hasNextPage = rows.length < count;

  const virtualizer = useVirtualizer({
    count: rows.length + (hasNextPage ? 1 : 0),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 145,
    overscan: 1
  });

  const handleFetchData = async ({ page, cancelToken }: { page: number; cancelToken?: CancelToken }) => {
    if (page === 0) {
      setLoading(true);
    } else {
      setNewDataLoading(true);
    }
    try {
      const { data, count } = await fetchData({ column: option.optionValue, limit: LIMIT, page, cancelToken });
      setCount(count);
      if (page === 0) {
        setRows(data);
      } else {
        setRows((prev) => [...prev, ...data]);
      }
      setLoading(false);
      setNewDataLoading(false);
      setPage(page);
      setLoadingComplte((prev) => ({ ...prev, [option.optionValue]: true }));
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveEditWrapper = async ({ inputField, updatedData }: { inputField: Record<string, string>; updatedData: any }) => {
    try {
      await onSaveEdit(inputField, updatedData, false);
      handleFetchData({ page: 0 });
    } catch (error) {
      console.error(error);
    }
  };

  const items = virtualizer.getVirtualItems();

  useEffect(() => {
    const token = axios.CancelToken.source();
    handleFetchData({ page: 0, cancelToken: token.token });
    return () => {
      token.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencyArray, refreshSignal]);

  useEffect(() => {
    if (!hasNextPage) return;
    const lastItem = items[items.length - 1];

    if (!lastItem) return;

    const token = axios.CancelToken.source();
    if (lastItem.index >= rows.length - 1 && hasNextPage && !newDataLoading && !loading) {
      handleFetchData({ page: page + 1, cancelToken: token.token });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasNextPage, rows.length, items, newDataLoading, page, loading]);

  const { setNodeRef, active, over } = useDragAndDrop({
    handleSaveEditWrapper,
    option,
    setActiveDragItemProps,
    pivotColumn,
    handleFetchData,
    disabled: loading
  });

  return (
    <div className={cn('relative isolate rounded-md bg-gray-100 dark:bg-[--dark-secondary]')} ref={setNodeRef}>
      <div className="flex items-center p-2">
        <Checkbox
          icon={<RadioButtonUnchecked />}
          size="small"
          sx={{ p: '5px', ml: '8px' }}
          disabled={rows.length === 0}
          checkedIcon={<CheckCircle />}
          onChange={(event) => {
            if (event.target.checked) {
              state.handleSelectMultiple(rows);
            } else {
              state.handleUnSelectMultiple(rows);
            }
          }}
          checked={isAllSelected}
        />
        <h6 className="line-clamp-1 text-sm font-semibold">{option.optionLabel}</h6>
      </div>

      <div
        className={cn(
          'pointer-events-none absolute bottom-0 left-0 right-0 top-[45px] flex items-center justify-center bg-black/30 transition-opacity [backdrop-filter:blur(4px)] dark:bg-white/30',
          active && over && over.id === option.optionValue && over.id !== active.data.current?.columnId ? 'z-10 opacity-100' : 'z-[-1] opacity-0'
        )}
      >
        <p className="text-[20px] font-semibold text-[white]">Drop Here</p>
      </div>

      <div className="pb-2">
        {!loading ? (
          <div
            ref={parentRef}
            style={{ contain: 'strict' }}
            className="relative h-[calc(100vh-300px)] min-h-[500px] overflow-y-auto overflow-x-hidden"
          >
            <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${items[0]?.start ?? 0}px)`
                }}
              >
                {items.map(({ key, index }) => {
                  const data = rows[index];
                  return (
                    <div key={`${key}`} data-index={index} ref={virtualizer.measureElement} className={cn('')}>
                      <RenderSingleCard
                        columnId={option.optionValue}
                        primaryColumn={primaryColumn}
                        hideSelection={hideSelection}
                        actionColumn={actionColumn}
                        data={data}
                        displayedColumns={displayedColumns}
                        hiddenColumns={hiddenColumns}
                        indexColumn={indexColumn}
                        state={state}
                        onSaveEdit={handleSaveEditWrapper}
                        setActiveDragItemProps={setActiveDragItemProps}
                      />
                    </div>
                  );
                })}
                {newDataLoading && (
                  <div className="mx-2 rounded-md border bg-[var(--dark-primary,white)] p-4">
                    <Skeleton />
                    <Skeleton />
                    <Skeleton />
                    <Skeleton />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[calc(100vh-300px)] min-h-[500px] space-y-2 overflow-y-auto">
            {[...Array(getRandomNumber(2, 8)).keys()].map((d) => (
              <div key={d} className="mx-2 rounded-md border bg-[var(--dark-primary,white)] p-4">
                <Skeleton />
                <Skeleton />
                <Skeleton />
                <Skeleton />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RenderSingleColumn;
