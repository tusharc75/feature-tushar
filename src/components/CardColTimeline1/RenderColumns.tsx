import React, { useEffect } from 'react';
import ColCard from './ColCard';
import { TActios, TInitialState } from './index';
import { FixedSizeList as List } from 'react-window';
import { Button } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import CommonSkeleton from '../Helpers/CommonSkeleton';
import InfiniteLoader from 'react-window-infinite-loader';

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
        <div className="loader-skeleton overflow-hidden rounded-[8px] pr-1 shadow-[0px_4px_40px_rgba(0,0,0,0.08)] [border:1px_solid_var(--common-border-color)] p-2">
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
        <InfiniteLoader isItemLoaded={isItemLoaded} itemCount={itemCount} loadMoreItems={() => loadMoreItems()}>
          {({ onItemsRendered, ref }) => (
            <List
              onItemsRendered={onItemsRendered}
              style={{ overflowX: 'hidden' }}
              height={containerHeight || 600}
              itemCount={itemCount}
              itemSize={cardHeight}
              width={'100%'}
              ref={ref}
            >
              {Row}
            </List>
          )}
        </InfiniteLoader>
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
