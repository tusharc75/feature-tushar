import { CheckCircle, CheckCircleOutline, RadioButtonUnchecked } from '@mui/icons-material';
import { Checkbox, Skeleton } from '@mui/material';
import axios, { CancelToken } from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { getRandomNumber } from 'src/components/AiChatbox/utils';
import CardColTimelineLoader from 'src/components/CardColTimeline/CardColTimelineLoader';
import useHandleSelection from 'src/components/CardColTimeline/components/useHandleSelection';
import { cn } from 'src/constants/helpers';
import Column from './Column';
import { CommonProps } from './types';

const ColumnWrapper = <D, C extends readonly string[]>({
  state,
  getColColors,
  column,
  subItemAccessor,
  getChildId,
  groupByApiKey,
  group,
  ...rest
}: CommonProps<D, C>) => {
  const [data, setData] = useState<D[] | null>(null);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const { fetchSingleColumn, resource, refreshSignal, limit, filterQuery, columnDef, resetSelectionSignal, selectedRecordMap, setSelectedRecordMap } =
    state;

  const { handleSelectAll, handleSelectSingle, isAllSelected } = useHandleSelection({ column, data, getChildId, state, subItemAccessor });

  const colors = getColColors(column);
  const isDataLoading = loading;
  const isInitialLoading = initialLoading || columnDef?.length === 0;

  const handleFetchSingleColumnWrapper = useCallback(
    async (page = 0, pushData = false, cancelToken?: CancelToken, resource?: string) => {
      try {
        setLoading(true);
        const extraParams = {
          [groupByApiKey]: group?.optionValue
        };
        const { count, data } = await fetchSingleColumn({
          column,
          filterQuery,
          limit,
          page,
          resource,
          cancelToken,
          extraParams: group ? extraParams : undefined
        });
        if (pushData) {
          setData((prev) => [...prev, ...data]);
        } else {
          setData(data);
        }
        setCount(count);
        setPage(page);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    },
    [column, fetchSingleColumn, filterQuery, limit, groupByApiKey, group]
  );
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const cancelToken = axios.CancelToken.source();
    let isMounted = true;
    const fetchInitialData = async () => {
      setInitialLoading(true);
      try {
        await handleFetchSingleColumnWrapper(0, false, cancelToken.token, resource);
        if (isMounted) {
          setTimeout(() => {
            if (isMounted) {
              setInitialLoading(false);
            }
          }, 500);
        }
      } catch (error) {
        if (axios.isCancel(error)) {
        } else {
          console.error(error);
          if (isMounted) setInitialLoading(false);
        }
      }
    };

    fetchInitialData();

    return () => {
      isMounted = false;
      setInitialLoading(true);
      cancelToken.cancel('Component unmounted');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSignal, filterQuery, resource]);

  useEffect(() => {
    setSelectedRecordMap(new Map());
  }, [resetSelectionSignal]);

  return (
    <div className="min-w-[min(90%,400px)] max-w-[400px] flex-shrink-0 snap-start ">
      <div className={cn('head mb-2 flex items-center rounded-md px-[11px] py-[5px]', colors.background, colors.color)}>
        <Checkbox
          size="small"
          id={`${column}-select-all`}
          checked={isAllSelected && data?.length > 0}
          onClick={(e) => {
            e.stopPropagation();
            handleSelectAll();
          }}
          indeterminate={!isAllSelected && Object.keys(selectedRecordMap).length > 0}
          icon={<RadioButtonUnchecked />}
          indeterminateIcon={<CheckCircleOutline />}
          checkedIcon={<CheckCircle />}
          disabled={isDataLoading || data?.length === 0}
        />
        <label htmlFor={`${column}-select-all`} className="flex cursor-pointer text-[15px] font-bold">
          {column} ({count || count === 0 ? count : <Skeleton width={getRandomNumber(20, 50)} />})
        </label>
      </div>
      <div className={cn('h-[calc(100vh-270px)] min-h-[400px] flex-grow ', !isInitialLoading ? '' : 'overflow-hidden')} ref={setContainer}>
        {!isInitialLoading ? (
          <Column
            page={page}
            count={count}
            data={data}
            handleFetchSingleColumnWrapper={handleFetchSingleColumnWrapper}
            loading={loading}
            column={column}
            container={container}
            getColColors={getColColors}
            state={state}
            handleSelectSingle={handleSelectSingle}
            colors={colors}
            subItemAccessor={subItemAccessor}
            getChildId={getChildId}
            {...rest}
          />
        ) : (
          <CardColTimelineLoader />
        )}
      </div>
    </div>
  );
};
export default ColumnWrapper;
