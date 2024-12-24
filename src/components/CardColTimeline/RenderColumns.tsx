import { Button } from '@mui/material';
import AddIcon from '@material-ui/icons/Add';
import { Skeleton } from '@mui/material';
import React, { useEffect, useRef } from 'react';
import { VariableSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import CommonSkeleton from '../Helpers/CommonSkeleton';
import ColCard from './ColCard';
import { TActios, TInitialState, datarowInterface } from './index';

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
  assignOptions?: any;
  openAssignHandler?: (option: any, data: any) => void | null;
}

const HEADER_HEIGHT = 90;
const ROW_HEIGHT = 20;
const ROW_EXTERNALliNK_HEIGHT = 22.406;

const calcCardHeight = (rowDef: datarowInterface[], data) => {
  const head = rowDef?.find((c) => c.type === 'title' || c.type === 'linkTitle');
  const rowsWithHeight = [];
  const rowsWithExternalLInk = [];
  for (const row of rowDef) {
    const ignoredRows = ['title', 'linkTitle', 'tooltip'];
    const isRowDataPresent = data ? Boolean(row.accessor ? (data[row.accessor] ? data[row.accessor] : false) : false) : false;
    const isRowExternalLink = row.type === 'link' && Object.hasOwn(row, 'target') && row.target === '_blank';

    switch (true) {
      case ignoredRows.includes(row.type):
        break;
      case !Boolean(data):
        rowsWithHeight.push(row);
        break;
      case Boolean(row.renderer):
        rowsWithHeight.push(row);
        break;
      case isRowExternalLink && isRowDataPresent:
        rowsWithExternalLInk.push(row);
        break;
      case isRowDataPresent:
        rowsWithHeight.push(row);
        break;
      default:
        break;
    }
  }
  if (!head) return ROW_HEIGHT * rowsWithHeight.length;
  return HEADER_HEIGHT + rowsWithHeight.length * ROW_HEIGHT + rowsWithExternalLInk.length * ROW_EXTERNALliNK_HEIGHT;
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
  const { data, count, loading, page, filterQuery, rowDef, selectedRecords, refreshDataCount } = state;

  const isInitialLoading = loading[column] === undefined || data[column] === undefined;

  const hasNextPage = !data[column]?.length || !count[column] ? false : data[column]?.length < count[column];
  const isItemLoaded = (index) => !hasNextPage || index < data[column].length;
  const itemCount = hasNextPage ? data[column]?.length + 1 || 0 : data[column]?.length || 0;
  const resetIndex = useRef(0);
  const listRef = useRef<any>(null);

  const cardOnSelect = (data) => {
    let records: any = [...selectedRecords];
    if (records?.find((r) => r?._id === data?._id)) {
      records = records?.filter((r) => r?._id != data?._id);
    } else {
      records.push({ ...data });
    }

    dispatch({ type: 'selection', selectedRecords: [...records] });
  };

  const Row = ({ index, style }) => {
    const colData = data[column][index];

    let content = (
      <ColCard
        key={index}
        data={colData}
        cardOnClick={cardOnClick}
        cardOnSelect={cardOnSelect}
        selectedRecords={selectedRecords}
        rowDef={rowDef}
        passFailStatus={passFailStatus}
        passFailAccessor={passFailAccessor}
      />
    );

    if (!isItemLoaded(index)) {
      content = (
        <div className="loader-skeleton overflow-hidden rounded-[8px] border shadow-[0px_4px_40px_rgba(0,0,0,0.08)]">
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

  const isLoading = loading[column];

  useEffect(() => {
    if (listRef.current) {
      listRef.current._listRef.resetAfterIndex(resetIndex.current);
    }
  }, [isLoading]);

  return (
    <>
      <div className="col group -mx-[6px]" key={refreshDataCount}>
        {isInitialLoading ? (
          <div className="grid gap-2 overflow-hidden" style={{ maxHeight: containerHeight || 600 }}>
            {Array.from(Array(10).keys()).map((item) => (
              <div
                key={item}
                style={{ maxHeight: cardHeight, height: cardHeight }}
                className="loader-skeleton mx-[6px] overflow-hidden rounded-[8px] border bg-[var(--dark-primary,_white)]"
              >
                <div className=" overflow-hidden p-2" style={{ maxHeight: cardHeight - 16, height: cardHeight - 16 }}>
                  <Skeleton variant="text" width="100px" height="16px" />
                  <Skeleton width="100%" height="50px" />
                  <Skeleton variant="text" width="100px" height="16px" />
                  <Skeleton width="100%" height="50px" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <InfiniteLoader isItemLoaded={isItemLoaded} ref={listRef} itemCount={itemCount} loadMoreItems={() => loadMoreItems()}>
            {({ onItemsRendered, ref }) => (
              <List
                onItemsRendered={onItemsRendered}
                style={{ overflowX: 'hidden' }}
                height={containerHeight || 600}
                itemCount={itemCount}
                ref={ref}
                itemSize={(index) => {
                  const cardData = data[column][index] || null;
                  if (!cardData) resetIndex.current = index - 1;
                  return calcCardHeight(rowDef, cardData);
                }}
                width={'100%'}
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
