import { useMemo } from 'react';
import { Column } from 'src/components/CanbanView/types';

const actionColumnNames = ['actions', 'action'];
const DEFAUTL_VISIBLE_COLUMNS = 3;

const useColumns = <D>({ columns }: { columns: Column<D>[] }) => {
  const primaryColumn = useMemo(() => columns?.find((item) => item.primaryField || item.lockPosition) || columns[0], [columns]);

  const visibleColumns = useMemo(() => {
    if (!columns) return [];
    return columns.filter((c, index) => {
      if (['index', ...actionColumnNames, primaryColumn.id || primaryColumn.accessor].includes(c.id || c.accessor)) return false;
      return true;
    });
  }, [columns, primaryColumn]);

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

  return { primaryColumn, actionColumn, indexColumn, displayedColumns, hiddenColumns };
};

export default useColumns;
