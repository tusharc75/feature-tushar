import { CheckCircle, CheckCircleOutline, RadioButtonUnchecked } from '@mui/icons-material';
import { Checkbox } from '@mui/material';
import { useCallback, useEffect, useRef } from 'react';
import { ListChildComponentProps } from 'react-window';
import RenderStatusIcon from './RenderStatusIcon';
import { CommonProps } from './types';
import { ColumnColor } from 'src/components/CardColTimeline1/types';
import { cn } from 'src/constants/helpers';
import usePrevious from 'src/hooks/usePrevious';

type SingleCardProps<D, C extends readonly string[]> = {
  setSize: (index: any, size: any, reset?: boolean) => void;
  colors: ColumnColor;
  column: C[number];
} & Omit<ListChildComponentProps<any>, 'style'> &
  Omit<CommonProps<D, C>, 'getColColors'>;

const renderCell = (col, data) => {
  switch (true) {
    case typeof col.Cell === 'function':
      return col.Cell({ row: { original: data } });
    case typeof col.Cell === 'string':
      return col.Cell;
    case typeof col.cell === 'function':
      return col.cell({ row: { original: data } });
    case typeof col.cell === 'string':
      return col.cell;
    default:
      return null;
  }
};

const SingleCard = <D, C extends readonly string[]>({
  data,
  index,
  setSize,
  state,
  cardOnClick,
  passFailAccessor,
  colors,
  column,
  handleSelectSingle,
  passFailStatus,
  actionField,
  defaultDisplay,
  primaryField,
  customContent,
  getChildId
}: SingleCardProps<D, C> & {
  handleSelectSingle: (data: D) => void;
}) => {
  const previousDefaultDisplay = usePrevious(defaultDisplay.length);
  const { keyGetter, selectedRecordMap } = state;
  const rowRef = useRef<HTMLDivElement>(null);
  const rowData = data[index];

  useEffect(() => {
    setSize(index, rowRef.current?.getBoundingClientRect().height, previousDefaultDisplay !== defaultDisplay.length);
  }, [setSize, index, previousDefaultDisplay, defaultDisplay.length]);

  const recalculateHeight = useCallback(() => {
    setSize(index, rowRef.current?.getBoundingClientRect().height, true);
  }, [index, setSize]);

  if (!rowData) return null;

  return (
    <div ref={rowRef} className="p-[8px] pb-1">
      <button
        className={cn(
          `relative flex w-full flex-col rounded-md bg-[--dark-primary,white] text-left shadow-md outline-none dark:bg-[var(--dark-secondary)] dark:text-white`,
          typeof cardOnClick === 'function'
            ? 'cursor-pointer outline-0 outline-[--new-theme-color] focus-visible:shadow-lg focus-visible:outline-2'
            : '',
          selectedRecordMap.get(column)?.has(keyGetter(rowData)) ? `${colors.background} ${colors.color}` : '',
          '[--px:16px] [--py:12px]'
        )}
        onClick={(e) => {
          e.stopPropagation();
          const target = e.target as HTMLElement;
          const isInsideButton = target?.closest?.('button');
          if (isInsideButton !== e.currentTarget) {
            return;
          }
          const isInsideAnchor = target?.closest?.('a');
          if (isInsideAnchor) {
            return;
          }
          if (typeof cardOnClick === 'function') {
            cardOnClick(rowData);
          }
        }}
        tabIndex={typeof cardOnClick === 'function' ? 0 : undefined}
      >
        <div className="mb-4 flex w-full items-start justify-between px-[--px] pt-[--py]">
          <div className="flex flex-grow items-center">
            <Checkbox
              sx={{ ml: '-8px' }}
              size="small"
              checked={selectedRecordMap.get(column)?.has(keyGetter(rowData)) || false}
              onClick={(e) => {
                e.stopPropagation();
                handleSelectSingle(rowData);
              }}
              icon={<RadioButtonUnchecked />}
              indeterminateIcon={<CheckCircleOutline />}
              checkedIcon={<CheckCircle />}
            />
            {primaryField && (
              <div className="line-clamp-1 flex-grow ">
                <h6 className="text-xs font-[300] leading-[1] text-gray-400 dark:text-gray-300">{primaryField.Header}</h6>
                <h4 className="quote-name line-clamp-1 min-h-[25px] [&>*]:![font-weight:500] [&>div>*+*]:flex-shrink-0 [&>div]:!flex [&>div]:min-w-0 [&>div]:items-center [&_*:not(.flex)]:line-clamp-1 [&_*]:!text-sm [&_*]:[white-space:unset_!important]">
                  {renderCell(primaryField, rowData)}
                </h4>
              </div>
            )}
          </div>
          {passFailStatus ? <RenderStatusIcon stepStatus={rowData[passFailAccessor]} /> : null}
        </div>
        <div className="flex w-full flex-wrap gap-2 px-[--px] pb-[--py]">
          {defaultDisplay?.map((d) => {
            const cell = renderCell(d, rowData);
            return (
              <div className="mb-[2px] min-w-[calc(50%-4px)] flex-shrink flex-grow [&:has(.no-data-cell)]:hidden [&_*>*:has(.md\:sr-only)]:flex">
                <h6 className="line-clamp-1 flex-shrink-0 text-xs font-normal leading-[1.5] text-gray-400 dark:text-gray-400 " title={d.Header}>
                  {d.Header}
                </h6>
                <div className="quote-name line-clamp-1 [&_*:not(.flex)]:line-clamp-1 [&_*]:!font-medium [&_*]:!text-[rgba(0,0,0,0.87)] [&_*]:![font-size:13px] [&_*]:![white-space:unset] dark:[&_*]:!text-[white] ">
                  {cell}
                </div>
              </div>
            );
          })}
        </div>
        {customContent && typeof customContent === 'function' ? (
          <>
            {customContent({
              row: rowData,
              renderCellText: renderCell,
              recalculateHeight,
              state,
              column,
              getChildId,
              getPreRenderedCell: (c, data) => {
                const cell = renderCell(c, data);
                return (
                  <div className="mb-[2px] min-w-[calc(50%-8px)] flex-shrink flex-grow [&_*>*:has(.md\:sr-only)]:flex">
                    <h6
                      className="line-clamp-1 max-w-[14ch] flex-shrink-0 text-xs font-normal leading-[1.5] text-gray-500 dark:text-gray-400 "
                      title={c.Header}
                    >
                      {c.Header}
                    </h6>
                    <div className="quote-name line-clamp-1 [&_*:not(.flex)]:line-clamp-1 [&_*]:!font-medium [&_*]:!text-[rgba(0,0,0,0.87)] [&_*]:![font-size:13px] [&_*]:![white-space:unset] dark:[&_*]:!text-[white] ">
                      {cell}
                    </div>
                  </div>
                );
              }
            })}
          </>
        ) : null}
      </button>
    </div>
  );
};

export default SingleCard;
