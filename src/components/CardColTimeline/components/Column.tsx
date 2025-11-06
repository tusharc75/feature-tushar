import { CircularProgress } from '@mui/material';
import { CancelToken } from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import { VariableSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { ColumnColor } from 'src/components/CardColTimeline/types';
import SingleCard from './SingleCard';
import { CommonProps } from 'src/components/CardColTimeline/components/types';

const DEFAULT_ITEM_SIZE = 591;

const Column = <D, C extends readonly string[]>({
  state,
  column,
  container,
  getColColors,
  colors,
  data,
  count,
  handleFetchSingleColumnWrapper,
  loading,
  page,
  handleSelectSingle,
  estimatedItemSize = DEFAULT_ITEM_SIZE,
  ...rest
}: {
  container: HTMLDivElement | null;
  colors: ColumnColor;
  data: D[];
  count: number;
  handleFetchSingleColumnWrapper: (page: number, pushData: boolean, cancelToken?: CancelToken) => void;
  loading: boolean;
  page: number;
  handleSelectSingle: (data: D) => void;
  estimatedItemSize?: number;
} & CommonProps<D, C>) => {
  const [initialized, setInitialized] = useState(false);

  const listRef = useRef<List>(null);
  const infiniteLoaderRef = useRef<InfiniteLoader>(null);

  useEffect(() => {
    setInitialized(true);
  }, []);

  const sizeMap = useRef<Map<number, number>>(new Map());

  const setSize = useCallback((index: number, size: number, resetAfter = false) => {
    const current = sizeMap.current.get(index);

    if (current !== size || !resetAfter) {
      sizeMap.current.set(index, size);
      listRef.current?.resetAfterIndex(index, resetAfter);
    }
  }, []);

  const getSize = useCallback(
    (index: number) => {
      return sizeMap.current.get(index) ?? estimatedItemSize;
    },
    [estimatedItemSize]
  );

  const hasNextPage = !data?.length || !count ? false : data?.length < count;
  const isItemLoaded = (index: number) => !hasNextPage || index < data.length;
  const itemCount = hasNextPage ? data?.length + 1 || 0 : data?.length || 0;

  const loadMoreItems = useCallback(() => {
    if (!initialized || loading || !hasNextPage) return;
    handleFetchSingleColumnWrapper(page + 1, true);
  }, [initialized, loading, hasNextPage, handleFetchSingleColumnWrapper, page]);

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
          estimatedItemSize={estimatedItemSize}
          className="rounded-md bg-gray-100 dark:bg-gray-700"
          itemData={data}
          itemSize={getSize}
          width={'100%'}
        >
          {({ data, index, style, ...restOfVirutalProps }) => (
            <li style={style} className="list-none">
              {index === data?.length && loading ? (
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
                  handleSelectSingle={handleSelectSingle}
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
export default Column;
