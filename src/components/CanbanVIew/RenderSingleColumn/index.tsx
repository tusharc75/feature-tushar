import { CheckCircle, RadioButtonUnchecked } from '@mui/icons-material';
import { Checkbox, Skeleton } from '@mui/material';
import { useVirtualizer } from '@tanstack/react-virtual';
import axios, { CancelToken } from 'axios';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getRandomNumber } from 'src/components/AiChatbox/utils';
import RenderSingleCard from 'src/components/CanbanView/RenderSingleColumn/RenderSIngleCard';
import { Column, FetchCanbanData, Option, UseCanbanStore } from 'src/components/CanbanView/types';
import { cn } from 'src/constants/helpers';

type RenderSingleColumnProps<D> = {
  onSaveEdit?: (inputField: Record<string, string>, updatedData: any) => void;
  fetchData: FetchCanbanData<D>;
  option: Option;
  dependencyArray?: any[];
  state: UseCanbanStore<D>;
  columns: Column<D>[];
  hideSelection?: boolean;
};

const DEFAUTL_VISIBLE_COLUMNS = 5;
const LIMIT = 7;
const actionColumnNames = ['actions', 'action'];

const RenderSingleColumn = <D,>({
  fetchData,
  onSaveEdit,
  option,
  dependencyArray = [],
  columns,
  state,
  hideSelection
}: RenderSingleColumnProps<D>) => {
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

  const visibleColumns = useMemo(() => {
    if (!columns) return [];
    return columns.filter((c, index) => {
      if (['index', ...actionColumnNames].includes(c.id || c.accessor)) return false;
      return true;
    });
  }, [columns]);

  const { actionColumn, indexColumn } = useMemo(() => {
    let actionColumn: Column<D> | undefined = undefined,
      indexColumn: Column<D> | undefined = undefined;
    for (const column of columns) {
      if (actionColumnNames.includes(column.id || column.accessor)) {
        actionColumn = column;
        continue;
      }
      if (['index'].includes(column.id || column.accessor)) {
        indexColumn = column;
        continue;
      }
    }
    return { actionColumn, indexColumn };
  }, [columns]);

  const { displayedColumns, hiddenColumns } = useMemo(() => {
    const displayedColumns = [...(visibleColumns || [])].slice(0, DEFAUTL_VISIBLE_COLUMNS);
    const hiddenColumns = [...(visibleColumns || [])].slice(DEFAUTL_VISIBLE_COLUMNS, visibleColumns?.length || 0);
    return { displayedColumns: displayedColumns, hiddenColumns } as const;
  }, [visibleColumns]);

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
  }, [...dependencyArray]);

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

  return (
    <div className="rounded-md bg-gray-100 dark:bg-[--dark-secondary]">
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
      {!loading ? (
        <div ref={parentRef} style={{ contain: 'strict' }} className="h-[calc(100vh-250px)] overflow-y-auto overflow-x-hidden">
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
                      hideSelection={hideSelection}
                      actionColumn={actionColumn}
                      data={data}
                      displayedColumns={displayedColumns}
                      hiddenColumns={hiddenColumns}
                      indexColumn={indexColumn}
                      state={state}
                      onSaveEdit={onSaveEdit}
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
        <div className="h-[calc(100vh-250px)] space-y-2 overflow-y-auto">
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
  );
};

export default RenderSingleColumn;
