import { Checkbox } from '@mui/material';
import React, { Fragment, useEffect, useState } from 'react';
import { UseCardColTimeline } from 'src/components/CardColTimeline1';
import { TColType } from 'src/components/CustomReactTable/TableComponents/TableHelperComponents';
import RippleButton from 'src/components/RippleButton';
import { cn } from 'src/constants/helpers';
import useSelection from './useSelection';

type CustomContentProps = {
  row: any;
  renderedFrom: string;
  columns: TColType[];
  getPreRenderedCell: (col: TColType, data: any) => React.ReactNode;
  renderCellText: (col: TColType, data: any) => any;
  recalculateHeight: () => void;
  state: UseCardColTimeline<any, any>;
  column: string;
  getChildId: (child: any) => string;
};

const CardCustomComponent = React.memo(
  ({ row, columns, getPreRenderedCell, recalculateHeight, renderCellText, state, column, getChildId }: CustomContentProps) => {
    const { expandedSubRows, setExpandedSubRows } = state;
    const [visibleServices, setVisibleServices] = useState(() => (expandedSubRows.has(row._id) ? row.services : [...row.services].slice(0, 2)));
    const { isAllSelected, handleSelect, handleSelectAll, selectedRowMap } = useSelection({
      allData: row.services,
      getId: getChildId,
      state,
      column,
      rowId: row._id,
      row
    });

    const isShowMoreVisible = row.services?.length > 2;
    const isExpanded = expandedSubRows.has(row._id);

    useEffect(() => {
      recalculateHeight();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isExpanded]);

    const toggleExpand = () => {
      if (!isShowMoreVisible) return;
      const newData = new Set(expandedSubRows);

      if (isExpanded) {
        newData.delete(row._id);
        setVisibleServices([...row.services].slice(0, 2));
      } else {
        newData.add(row._id);
        setVisibleServices(row.services);
      }
      setExpandedSubRows(newData);
    };
    const [firstCol, ...restCol] = columns;

    return (
      <div className="border-t px-[--px,12px] pb-[--pb,12px] pt-[--py,12px]">
        <div className="mb-3 flex justify-between gap-2">
          <p className="text-xs font-normal">Services ({row.services.length})</p>
          <RippleButton
            className="text-xs font-semibold text-blue-500"
            onClick={() => {
              handleSelectAll();
            }}
          >
            {isAllSelected ? 'Unselect All' : 'Select All'}
          </RippleButton>
        </div>
        <ul className="list-none space-y-2 p-0">
          {visibleServices?.map((d) => {
            return (
              <li
                key={d._id}
                className={cn(
                  'flex list-none items-start gap-2 rounded-md border p-2 dark:bg-slate-800',
                  'shadow-sm',
                  'data-[selected=true]:border-blue-600 data-[selected=true]:bg-blue-50',
                  'dark:data-[selected=true]:border-slate-600 dark:data-[selected=true]:bg-slate-950'
                )}
                data-selected={selectedRowMap.has(getChildId(d))}
              >
                <Checkbox
                  sx={{ p: '3px' }}
                  size={'small'}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(d);
                  }}
                  checked={selectedRowMap.has(getChildId(d))}
                />
                <div className="space-y-[2px] ">
                  <div key={firstCol.Header} className="[&_*]:!text-sm [&_*]:!font-medium">
                    {renderCellText(firstCol, d)}
                  </div>
                  <div className="flex w-full flex-wrap gap-2 [&_*:has(.no-data-cell)]:hidden ">
                    {restCol.map((c, i) => {
                      return <Fragment key={c.Header}>{getPreRenderedCell(c, d)}</Fragment>;
                    })}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {isShowMoreVisible && (
          <RippleButton onClick={toggleExpand} className="mt-[--py] w-full text-xs font-semibold text-blue-500">
            {isExpanded ? 'Show Less' : 'Show More'}
          </RippleButton>
        )}
      </div>
    );
  },
  (prev, next) => prev.row?._id === next.row?._id
);

export default CardCustomComponent;
