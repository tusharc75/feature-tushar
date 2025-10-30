import { Checkbox } from '@mui/material';
import React, { Fragment, useEffect, useRef, useState } from 'react';
import { TColType } from 'src/components/CustomReactTable/TableComponents/TableHelperComponents';
import RippleButton from 'src/components/RippleButton';
import useSelection from './useSelection';
import { cn } from 'src/constants/helpers';

type CustomContentProps = {
  row: any;
  renderedFrom: string;
  columns: TColType[];
  getPreRenderedCell: (col: TColType, data: any) => React.ReactNode;
  renderCellText: (col: TColType, data: any) => any;
  recalculateHeight: () => void;
  isSelected: boolean;
  handleSelect: (selected: boolean) => void;
};
const getId = (d: any) => d['_id'];

const CardCustomComponent = React.memo(
  ({ row, columns, getPreRenderedCell, recalculateHeight, renderCellText, handleSelect: handleSelectParent, isSelected }: CustomContentProps) => {
    const [visibleServices, setVisibleServices] = useState(() => [...row.services].slice(0, 2));
    const { getIsAllSelected, handleSelect, handleSelectAll, selectedRows, selectedRowMap, handleUnselectAll } = useSelection(getId);

    // const isAllRowSelected = getIsAllSelected(row.services);

    useEffect(() => {
      if (isSelected) {
        handleSelectAll(row.services);
      }
    }, [isSelected]);

    const isShowMoreVisible = row.services?.length > 2;
    const isExpanded = visibleServices.length > 2;

    const showMore = () => {
      setVisibleServices(row.services);
      queueMicrotask(() => {
        recalculateHeight();
      });
    };

    const showLess = () => {
      setVisibleServices([...row.services].slice(0, 2));
      queueMicrotask(() => {
        recalculateHeight();
      });
    };

    const toggleExpand = () => {
      if (!isShowMoreVisible) return;
      if (isExpanded) {
        showLess();
      } else {
        showMore();
      }
    };
    const [firstCol, ...restCol] = columns;

    return (
      <div className="border-t px-[--px,12px] pb-[--pb,12px] pt-[--py,12px]">
        <div className="mb-3 flex justify-between gap-2">
          <p className="text-xs font-normal">Services ({row.services.length})</p>
          <RippleButton
            className="text-xs font-semibold text-blue-500"
            onClick={() => {
              handleSelectAll(row.services);
            }}
          >
            {getIsAllSelected(row.services) ? 'Unselect All' : 'Select All'}
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
                data-selected={selectedRowMap.has(getId(d))}
              >
                <Checkbox
                  sx={{ p: '3px' }}
                  size={'small'}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(d, row.services, handleSelectParent);
                  }}
                  checked={selectedRowMap.has(getId(d))}
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
          <RippleButton onClick={toggleExpand} className="w-full font-semibold text-blue-500">
            {isExpanded ? 'Show Less' : 'Show More'}
          </RippleButton>
        )}
      </div>
    );
  },
  (prev, next) => prev.row?._id === next.row?._id
);

export default CardCustomComponent;
