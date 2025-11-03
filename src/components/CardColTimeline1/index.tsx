import { useCallback, useMemo } from 'react';
import ArrangeView from 'src/components/CustomReactTable/ArrangeView';
import { TColType } from 'src/components/CustomReactTable/TableComponents/TableHelperComponents';
import ColumnWrapper from './components/ColumnWrapper';
import { CardColTimelineProps } from './types';
import ModernBulkAction from 'src/components/CustomReactTable/GridHeader/ModernBulkAction';
export * from './types';
export * from './useCardColTimeline';

export const DEFAULT_DATA_ROWS_VISIBLE = 4;

const CardColTimeline = <D, C extends readonly string[]>({
  state,
  getColColors,
  cardOnClick,
  headerSlot,
  renderedFrom,
  customContent,
  getChildId = (data) => data._id,
  bulkActionItems,
  ...rest
}: { headerSlot?: React.ReactElement; renderedFrom: string } & CardColTimelineProps<D, C>) => {
  const { columns, visibleColumns, columnDef, visible, order, setOrderAndVisibility, selectedView, setSelectedView } = state;

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

  const isBulkVisible = state.selectedRecords.length > 0 || state.selectedSubRows.length > 0;

  const stateAdapter = {
    selectedRecords: state.selectedRecords,
    selectedCustomSubRows: state.selectedSubRows
  } as any;

  const dispatchAdapter = useCallback(
    (payload: { type: 'selection'; selectedRecords: any[] }) => {
      state.setSelectedSubItemsMap(new Map());
      state.setSelectedRecordMap(new Map());
    },
    [state]
  );

  return (
    <>
      <div className="mb-2 flex items-center justify-between gap-2">
        {isBulkVisible ? (
          <>
            <ModernBulkAction
              state={stateAdapter}
              dispatch={dispatchAdapter}
              bulkActionItems={bulkActionItems}
              onClose={() => state?.setSelectedSubItemsMap?.(new Map())}
            />
          </>
        ) : (
          <>
            <div className="flex-grow">{headerSlot}</div>
            {columnDef && (
              <ArrangeView
                columns={columnDef}
                expander={false}
                hideSelection={true}
                renderedFrom={renderedFrom}
                setOrderAndVisibility={setOrderAndVisibility}
                setCardSelectedView={setSelectedView}
              />
            )}
          </>
        )}
      </div>
      <div className="flex snap-x snap-mandatory gap-[10px] overflow-auto pb-4 md:scroll-px-[24px] [&_.show-in-export]:!hidden">
        {columns.map((c) => {
          if (!visibleColumns.includes(c)) return null;
          return (
            <ColumnWrapper
              customContent={customContent}
              key={c}
              state={state}
              column={c}
              getColColors={getColColors}
              cardOnClick={cardOnClick}
              primaryField={primaryField}
              actionField={actionField}
              defaultDisplay={defaultDisplay}
              getChildId={getChildId}
              {...rest}
            />
          );
        })}
      </div>
    </>
  );
};

export default CardColTimeline;
