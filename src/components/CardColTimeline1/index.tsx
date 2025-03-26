import { useMemo } from 'react';
import SingleColumn from 'src/components/CardColTimeline1/SingleColumn';
import { CardColTimelineProps } from 'src/components/CardColTimeline1/types';
import { TColType } from 'src/components/CustomReactTable/TableComponents/TableHelperComponents';

export * from 'src/components/CardColTimeline1/types';
export * from 'src/components/CardColTimeline1/useCardColTimeline';

const DEFAULT_DATA_ROWS_VISIBLE = 3;

const CardColTimeline = <D, C extends readonly string[]>({ state, getColColors, cardOnClick, ...rest }: CardColTimelineProps<D, C>) => {
  const { columns, visibleColumns, columnDef } = state;

  const primaryField: TColType | null = useMemo(
    () => columnDef?.find((item) => item.primaryField || item.lockPosition || item.disabled) || columnDef?.[2],
    [columnDef]
  );
  const actionField: TColType | null = useMemo(
    () => columnDef?.find((item) => item.id === 'action' && item.isVisible !== false) || null,
    [columnDef]
  );

  const otherFields: TColType[] | null = useMemo(
    () =>
      columnDef?.filter((item) => {
        const itemId = item.id || item.accessor;
        const primaryFieldId = primaryField.id || primaryField.accessor;
        if (itemId === primaryFieldId || ['selection', 'action', 'expander'].includes(itemId) || item.isVisible === false) {
          return false;
        }
        return true;
      }) || [],
    [columnDef, primaryField]
  );
  const defaultDisplay: TColType[] = useMemo(() => {
    return otherFields?.slice(0, DEFAULT_DATA_ROWS_VISIBLE) || [];
  }, [otherFields]);

  return (
    <div className="flex snap-x snap-mandatory gap-[10px] overflow-auto pb-4 md:scroll-px-[24px]">
      {columns.map((c) => {
        if (!visibleColumns.includes(c)) return null;
        return (
          <SingleColumn
            key={c}
            state={state}
            column={c}
            getColColors={getColColors}
            cardOnClick={cardOnClick}
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

export default CardColTimeline;
