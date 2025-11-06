import React, { useMemo } from 'react';
import { DEFAULT_DATA_ROWS_VISIBLE } from 'src/components/CardColTimeline';
import ColumnWrapper from 'src/components/CardColTimeline/components/ColumnWrapper';
import { CommonProps } from 'src/components/CardColTimeline/components/types';
import { TColType } from 'src/components/CustomReactTable/TableComponents/TableHelperComponents';

const AllColumns = <D, C extends readonly string[]>({
  state,
  ...rest
}: Omit<CommonProps<D, C>, 'column' | 'primaryField' | 'actionField' | 'defaultDisplay'>) => {
  const { columns, visibleColumns, columnDef, visible, order, selectedView } = state;

  const sortedHidedColumnDef = useMemo(() => {
    return columnDef
      ?.filter((c) => visible[c.id || c.accessor])
      .sort((a, b) => order.findIndex((c) => c === a.id) - order.findIndex((c) => c === b.id));
  }, [columnDef, order, visible]);

  const primaryField: TColType | null = useMemo(
    () => sortedHidedColumnDef?.find((item) => item.primaryField || item.lockPosition || item.disabled) || sortedHidedColumnDef?.[2],
    [sortedHidedColumnDef]
  );

  const actionField: TColType | null = useMemo(
    () => sortedHidedColumnDef?.find((item) => item.id === 'action' && item.isVisible !== false) || null,
    [sortedHidedColumnDef]
  );

  const otherFields: TColType[] | null = useMemo(
    () =>
      sortedHidedColumnDef?.filter((item) => {
        const itemId = item.id || item.accessor;
        const primaryFieldId = primaryField.id || primaryField.accessor;
        if (itemId === primaryFieldId || ['selection', 'action', 'expander'].includes(itemId) || item.isVisible === false) {
          return false;
        }
        return true;
      }) || [],
    [sortedHidedColumnDef, primaryField]
  );

  const defaultDisplay: TColType[] = useMemo(() => {
    if (selectedView) {
      return otherFields;
    } else {
      const defaultVisibleRows = otherFields?.filter((f) => f.defaultVisible === true);
      if (defaultVisibleRows && defaultVisibleRows.length) {
        return defaultVisibleRows;
      }
      return otherFields?.slice(0, DEFAULT_DATA_ROWS_VISIBLE) || [];
    }
  }, [otherFields, selectedView]);

  return (
    <div className="flex snap-x snap-mandatory gap-[10px] overflow-auto pb-4 md:scroll-px-[24px] [&_.show-in-export]:!hidden">
      {columns.map((c) => {
        if (!visibleColumns.includes(c)) return null;
        return (
          <ColumnWrapper
            key={c}
            state={state}
            column={c}
            primaryField={primaryField}
            actionField={actionField}
            defaultDisplay={defaultDisplay}
            {...rest}
          />
        );
      })}
    </div>
  );
};

export default AllColumns;
