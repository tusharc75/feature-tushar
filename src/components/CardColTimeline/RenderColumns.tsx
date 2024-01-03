import { Button } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import React, { useEffect, useMemo } from 'react';
import { VariableSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import CommonSkeleton from '../Helpers/CommonSkeleton';
import ColCard from './ColCard';
import { TActios, TInitialState, datarowInterface } from './index';
import { Skeleton } from '@material-ui/lab';

export interface colDataInterface extends React.HTMLAttributes<HTMLDivElement> {
  cardOnClick?: (e: React.MouseEvent, data: any) => void | null;
  passFailStatus?: boolean;
  passFailAccessor?: string;
  cardHeight?: number;
  createNew?: () => void;
  createNewText?: string;
  isCreateNew?: boolean;
  containerHeight: number;
  state: TInitialState;
  dispatch: React.Dispatch<TActios>;
  column: string;
  fetchSingleColumn: (column: string, page: number, appendData?: boolean, filterQuery?: string) => void;
}

const HEADER_HEIGHT = 90;
const ROW_HEIGHT = 20;

const calcCardHeight = (rowDef: datarowInterface[], data, loading: boolean = false) => {
  const head = rowDef?.find((c) => c.type === 'title' || c.type === 'linkTitle');
  let timeout;
  clearTimeout(timeout);
  if (loading || !data) {
    timeout = setTimeout(() => {
      calcCardHeight(rowDef, data, loading);
    }, 1000);
  }
  const rowsWithHeight = rowDef.filter((r) => {
    if (!data) return !['title', 'linkTitle', 'tooltip'].includes(r.type);
    if (r.accessor)
      return !['title', 'linkTitle', 'tooltip'].includes(r.type) && Boolean(r.accessor ? (data[r.accessor] ? data[r.accessor] : false) : false);
    else return !['title', 'linkTitle', 'tooltip'].includes(r.type);
  });
  if (!head) return ROW_HEIGHT * rowsWithHeight.length;
  return HEADER_HEIGHT + rowsWithHeight.length * ROW_HEIGHT;
};

const RenderColumns: React.FC<colDataInterface> = ({
  cardOnClick,
  passFailStatus,
  passFailAccessor,
  cardHeight = 130,
  createNew,
  isCreateNew,
  createNewText,
  containerHeight,
  state,
  dispatch,
  fetchSingleColumn,
  column
}) => {
  const { data, count, loading, page, columnOrder, visibleColumns, filterQuery, rowDef, limit, refreshDataCount } = state;

  const isInitialLoading = loading[column] === undefined || data[column] === undefined;

  const hasNextPage = !data[column]?.length || !count[column] ? false : data[column]?.length < count[column];
  const isItemLoaded = (index) => !hasNextPage || index < data[column].length;
  const itemCount = hasNextPage ? data[column]?.length + 1 || 0 : data[column]?.length || 0;

  const Row = ({ index, style }) => {
    const colData = data[column][index];

    let content = (
      <ColCard
        key={index}
        data={colData}
        cardOnClick={cardOnClick}
        rowDef={rowDef}
        passFailStatus={passFailStatus}
        passFailAccessor={passFailAccessor}
      />
    );

    if (!isItemLoaded(index)) {
      content = (
        <div className="loader-skeleton overflow-hidden rounded-[8px] shadow-[0px_4px_40px_rgba(0,0,0,0.08)] [border:1px_solid_var(--common-border-color)] ">
          <CommonSkeleton lenArray={Array.from(Array(2).keys())} lg={12} sm={12} xs={12} md={12} />
        </div>
      );
    }

    return <div style={style}>{content}</div>;
  };

  useEffect(() => {
    dispatch({ type: 'page', setPage: (prev) => ({ ...prev, [column]: 0 }) });
    fetchSingleColumn(column, 0, false, filterQuery);
  }, [filterQuery, column, refreshDataCount, dispatch]);

  const loadMoreItems = () => {
    fetchSingleColumn(column, page[column] + 1, true, filterQuery);
  };

  return (
    <>
      <div className="col group" key={refreshDataCount}>
        {isInitialLoading ? (
          <div className="grid gap-2 overflow-hidden" style={{ maxHeight: containerHeight || 600 }}>
            {Array.from(Array(10).keys()).map((item) => (
              <div
                key={item}
                style={{ maxHeight: cardHeight, height: cardHeight }}
                className="loader-skeleton bg-[var(--dark-primary,_white)] overflow-hidden rounded-[8px] shadow-[0px_4px_40px_rgba(0,0,0,0.08)] [border:1px_solid_var(--common-border-color)]"
              >
                <div className="overflow-hidden p-2" style={{ maxHeight: cardHeight - 16, height: cardHeight - 16 }}>
                  <Skeleton variant="text" width="100px" height="16px" />
                  <Skeleton width="100%" height="50px" />
                  <Skeleton variant="text" width="100px" height="16px" />
                  <Skeleton width="100%" height="50px" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <InfiniteLoader isItemLoaded={isItemLoaded} itemCount={itemCount} loadMoreItems={() => loadMoreItems()}>
            {({ onItemsRendered, ref }) => (
              <List
                onItemsRendered={onItemsRendered}
                style={{ overflowX: 'hidden' }}
                height={containerHeight || 600}
                itemCount={itemCount}
                itemSize={(index) => {
                  return calcCardHeight(rowDef, data[column][index], loading[column] || true);
                }}
                width={'100%'}
                ref={ref}
              >
                {Row}
              </List>
            )}
          </InfiniteLoader>
        )}
        {createNew && isCreateNew && (
          <Button
            onClick={createNew}
            style={{ marginTop: '10px' }}
            startIcon={<AddIcon />}
            fullWidth
            className="group-hover:opacity-1 opacity-0 transition-opacity"
          >
            {createNewText || 'Create Task'}
          </Button>
        )}
      </div>
    </>
  );
};

export default RenderColumns;
