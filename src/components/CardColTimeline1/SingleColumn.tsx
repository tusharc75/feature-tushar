import { CheckCircle, CheckCircleOutline, RadioButtonUnchecked } from '@mui/icons-material';
import { Box, Checkbox, CircularProgress, Skeleton } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AiFillCheckCircle, AiFillExclamationCircle } from 'react-icons/ai';
import { VariableSizeList as List, ListChildComponentProps } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { getRandomNumber } from 'src/components/AiChatbox/utils';
import CardColTimelineLoader from 'src/components/CardColTimeline1/CardColTimelineLoader';
import { CardColTimelineProps, ColumnColor } from 'src/components/CardColTimeline1/types';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { cn, WORKORDER_SERVICE_STEP_STATUS } from 'src/constants/helpers';

type CommonProps<D, C extends readonly string[]> = {
  primaryField: any;
  actionField: any;
  defaultDisplay: any[];
  column: C[number];
} & CardColTimelineProps<D, C>;

const SingleColumn = <D, C extends readonly string[]>({ state, getColColors, column, ...rest }: CommonProps<D, C>) => {
  const { data, loading, isAllSelected, handleSelectAll, columnDef, selectedRecordsObj, count } = state;
  const colors = getColColors(column);
  const isDataLoading = loading[column];
  const isInitialLoaded = data && data?.[column] && columnDef?.length > 0;

  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  return (
    <div className="min-w-[min(90%,350px)] max-w-[350px] flex-shrink-0 snap-start ">
      <div className={cn('head mb-2 flex items-center rounded-md px-[11px] py-[5px]', colors.background, colors.color)}>
        <Checkbox
          size="small"
          id={`${column}-select-all`}
          checked={isAllSelected(column)}
          onClick={(e) => {
            e.stopPropagation();
            handleSelectAll(column);
          }}
          indeterminate={!isAllSelected(column) && selectedRecordsObj[column] && Object.keys(selectedRecordsObj[column]).length > 0}
          icon={<RadioButtonUnchecked />}
          indeterminateIcon={<CheckCircleOutline />}
          checkedIcon={<CheckCircle />}
          disabled={isDataLoading || data?.[column]?.length === 0}
        />
        <label htmlFor={`${column}-select-all`} className="flex cursor-pointer text-[15px] font-bold">
          {column} ({count[column] ? count[column] : <Skeleton width={getRandomNumber(20, 50)} />})
        </label>
      </div>
      <div className={cn('h-[calc(100vh-270px)] min-h-[400px] flex-grow ', isInitialLoaded ? '' : 'overflow-hidden')} ref={setContainer}>
        {isInitialLoaded ? (
          <Column column={column} container={container} getColColors={getColColors} state={state} colors={colors} {...rest} />
        ) : (
          <CardColTimelineLoader />
        )}
      </div>
    </div>
  );
};
export default SingleColumn;

const Column = <D, C extends readonly string[]>({
  state,
  column,
  container,
  getColColors,
  colors,
  ...rest
}: { container: HTMLDivElement | null; colors: ColumnColor } & CommonProps<D, C>) => {
  const [initialized, setInitialized] = useState(false);
  const { data, count, handleFetchSingleColumnWrapper, page, loading } = state;
  const listRef = useRef<List>(null);
  const infiniteLoaderRef = useRef<InfiniteLoader>(null);

  useEffect(() => {
    setInitialized(true);
  }, []);

  const sizeMap = useRef({});
  const setSize = useCallback((index, size) => {
    sizeMap.current = { ...sizeMap.current, [index]: size };
    listRef.current?.resetAfterIndex(index);
  }, []);
  const getSize = (index) => sizeMap.current[index] || 50;
  const hasNextPage = !data[column]?.length || !count[column] ? false : data[column]?.length < count[column];
  const isItemLoaded = (index: number) => !hasNextPage || index < data[column].length;
  const itemCount = hasNextPage ? data[column]?.length + 1 || 0 : data[column]?.length || 0;

  const loadMoreItems = useCallback(() => {
    if (!initialized || loading[column] || !hasNextPage) return;
    handleFetchSingleColumnWrapper(column, page[column] + 1);
  }, [initialized, loading, column, hasNextPage, handleFetchSingleColumnWrapper, page]);

  return (
    <InfiniteLoader isItemLoaded={isItemLoaded} ref={infiniteLoaderRef} itemCount={itemCount} loadMoreItems={() => loadMoreItems()}>
      {({ onItemsRendered, ref }) => (
        <List
          onItemsRendered={onItemsRendered}
          style={{ overflowX: 'hidden' }}
          height={container?.getBoundingClientRect().height || 600}
          itemCount={itemCount}
          ref={(elem) => {
            ref(elem);
            listRef.current = elem;
          }}
          className="rounded-md bg-gray-100 dark:bg-gray-700"
          itemData={data[column]}
          itemSize={getSize}
          width={'100%'}
        >
          {({ data, index, style, ...restOfVirutalProps }) => (
            <li style={style} className="list-none">
              {index === data?.length && loading[column] ? (
                <div className="mt-2 flex items-center justify-center text-black/85 dark:text-[white]">
                  <CircularProgress size={25} />
                </div>
              ) : (
                <SingleCard
                  state={state}
                  column={column}
                  colors={colors}
                  data={data}
                  index={index}
                  setSize={setSize}
                  key={index}
                  {...rest}
                  {...restOfVirutalProps}
                />
              )}
            </li>
          )}
        </List>
      )}
    </InfiniteLoader>
  );
};

type SingleCardProps<D, C extends readonly string[]> = {
  setSize: (index: any, size: any) => void;
  colors: ColumnColor;
  column: C[number];
} & Omit<ListChildComponentProps<any>, 'style'> &
  Omit<CommonProps<D, C>, 'getColColors'>;

const SingleCard = <D, C extends readonly string[]>({
  data,
  index,
  setSize,
  state,
  cardOnClick,
  passFailAccessor,
  colors,
  column,

  passFailStatus,
  actionField,
  defaultDisplay,
  primaryField
}: SingleCardProps<D, C>) => {
  const { selectedRecordsObj, keyGetter, handleSelect } = state;
  const rowRef = useRef<HTMLDivElement>(null);
  const rowData = data[index];

  useEffect(() => {
    setSize(index, rowRef.current?.getBoundingClientRect().height);
  }, [setSize, index]);

  if (!rowData) return null;

  return (
    <div ref={rowRef} className="p-[8px] pb-1">
      <button
        className={cn(
          `relative flex w-full flex-col rounded-md bg-[--dark-primary,white] px-3 py-2 text-left shadow-md outline-none [--left-gutter:20px] dark:bg-[var(--dark-secondary)] dark:text-white`,
          typeof cardOnClick === 'function'
            ? 'cursor-pointer outline-0 outline-[--new-theme-color] focus-visible:shadow-lg focus-visible:outline-2'
            : '',
          selectedRecordsObj?.[column]?.[keyGetter(rowData)] ? `${colors.background} ${colors.color}` : ''
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
        <div className="flex w-full items-center justify-between border-b">
          <div className="flex items-center">
            <Checkbox
              sx={{ ml: '-8px' }}
              size="small"
              checked={selectedRecordsObj?.[column]?.[keyGetter(rowData)] || false}
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(keyGetter(rowData), column);
              }}
              icon={<RadioButtonUnchecked />}
              indeterminateIcon={<CheckCircleOutline />}
              checkedIcon={<CheckCircle />}
            />
            {primaryField && (
              <div className="line-clamp-1">
                <h4 className="quote-name line-clamp-1 [&>*]:![font-weight:700] [&>div>*+*]:flex-shrink-0 [&>div]:!flex [&>div]:min-w-0 [&>div]:items-center [&_*:not(.flex)]:line-clamp-1 [&_*]:![font-size:15px] [&_*]:[white-space:unset_!important]">
                  {renderCell(primaryField, rowData)}
                </h4>
              </div>
            )}
          </div>
          {passFailStatus ? <RenderStatusIcon stepStatus={rowData[passFailAccessor]} /> : null}
        </div>
        <div className="w-full p-[8px] pb-0">
          {defaultDisplay?.map((d) => {
            const cell = renderCell(d, rowData);
            return (
              <div className="mb-[2px] flex items-center justify-between gap-2 [&:has(.no-data-cell)]:hidden">
                <h6
                  className="line-clamp-1 max-w-[14ch] flex-shrink-0 text-[13px] font-semibold !text-[rgba(0,0,0,0.87)] dark:!text-[white] "
                  title={d.Header}
                >
                  {d.Header}
                </h6>
                <div className="quote-name line-clamp-1 [&>*]:![font-weight:400] [&_*:not(.flex)]:line-clamp-1 [&_*]:!text-[rgba(0,0,0,0.87)] [&_*]:![font-size:13px] [&_*]:![white-space:unset] dark:[&_*]:!text-[white] [&_h5]:![font-weight:400]">
                  {cell}
                </div>
              </div>
            );
          })}
        </div>
      </button>
    </div>
  );
};

const RenderStatusIcon = ({ stepStatus }: { stepStatus: string }) => {
  return (
    <>
      {stepStatus === WORKORDER_SERVICE_STEP_STATUS.passed && (
        <HtmlTooltip title={stepStatus} placement="top" arrow enterTouchDelay={0}>
          <Box style={{ color: '#4BAE4F', fontSize: '25px', width: 25 }}>
            <AiFillCheckCircle style={{ display: 'block' }} />
          </Box>
        </HtmlTooltip>
      )}
      {stepStatus === WORKORDER_SERVICE_STEP_STATUS.failed && (
        <HtmlTooltip title={stepStatus} placement="top" arrow enterTouchDelay={0}>
          <Box style={{ color: '#F25F54', fontSize: '25px', width: 25 }}>
            <AiFillExclamationCircle style={{ display: 'block' }} />
          </Box>
        </HtmlTooltip>
      )}
    </>
  );
};

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
