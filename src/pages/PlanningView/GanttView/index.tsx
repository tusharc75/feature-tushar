import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import axios, { CancelTokenSource } from 'axios';
import dayjs from 'dayjs';
import moment from 'moment-timezone';
import React, { useCallback, useContext, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import axiosInstance from 'src/axios/axiosInstance';
import { DEFAULT_TIME_ZONE, sidebarResource } from 'src/constants/helpers';
import ResourcePopover from 'src/pages/PlanningView/Calendar/ResourcePopover';
import PlanningGroupTemplate from 'src/pages/PlanningView/GanttView/Templates/PlanningGroupTemplate';
import { PlanningItemTemplate } from 'src/pages/PlanningView/GanttView/Templates/PlanningItemTemplate';
import { buildFromRows, getWindow, handleTimelineCLick, RawGroup, TimeRange } from 'src/pages/PlanningView/GanttView/utils';
import { Params, VisibleWindowPager } from 'src/pages/PlanningView/GanttView/VisibleWindowPager';
import { PlanningResource } from 'src/pages/PlanningView/usePlanningResource';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import { DataSet, Timeline, TimelineOptions } from 'vis-timeline/standalone';

export type GantttViewRef = { fetchData: () => void };

type GanttViewProps = {
  resourceList: PlanningResource[];
  selectedResource: PlanningResource | null;
  setSelectedResource: React.Dispatch<React.SetStateAction<PlanningResource>>;
  topRightSlot?: React.ReactNode;
};

const LIMIT = 15;

const GanttView = React.forwardRef<GantttViewRef, GanttViewProps>(({ resourceList, selectedResource, setSelectedResource, topRightSlot }, ref) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, resources }
  }: any = useData();

  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [isOpen, setOpen] = useState<{ open: boolean; data: any[]; eventData: any }>({
    open: false,
    data: [],
    eventData: null
  });

  const [resourcePolicy, setResourcePolicy] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [moreDataLoading, setMoreDataLoading] = useState<boolean>(false);
  const groupsDSRef = useRef<DataSet<any, 'id'>>(new DataSet([]));
  const itemsDSRef = useRef<DataSet<any, 'id'>>(new DataSet([]));
  const timelineRef = useRef<Timeline | null>(null);
  const timelineContainer = useRef<HTMLDivElement>(null);
  const inflightRef = useRef<Map<string, CancelTokenSource>>(new Map());
  const currentRangeRef = useRef<TimeRange | null>(null);
  const initialDrawn = useRef(false);
  const scrollElement = useRef<HTMLDivElement>();
  const hasMoreVerticalRef = useRef<boolean>(true);
  const pagerRef = useRef(new VisibleWindowPager({ limit: LIMIT }));
  const currentWindowKeyRef = useRef<string | null>(null);

  const scrollThrottleRef = useRef<number | null>(null);

  const fetchVisible = useCallback(
    async ({ params, initial = false, hasMore }: { params: Params; initial?: boolean; hasMore?: boolean }) => {
      if (initial) {
        setLoading(true);
      } else {
        setMoreDataLoading(true);
      }
      const pager = pagerRef.current;

      if (!params || !pager) return;

      const inflightKey = pager.crateKey(params);
      currentWindowKeyRef.current = inflightKey;
      if (inflightRef.current.has(inflightKey)) return;

      const source = axios.CancelToken.source();
      inflightRef.current.set(inflightKey, source);

      try {
        const resp = await axiosInstance().get('/planning-view/products-planning', {
          cancelToken: source.token,
          params: {
            ...params,
            date: {
              from: dayjs(params.date.from).format('MM/DD/YYYY'),
              to: dayjs(params.date.to).format('MM/DD/YYYY')
            }
          }
        });
        const rows: RawGroup[] = resp?.data?.data ?? [];

        hasMoreVerticalRef.current = groupsDSRef.current.length < resp?.data?.count;

        if (hasMore === true) {
          hasMoreVerticalRef.current = hasMore;
        }
        pager.setHasMoreData(hasMoreVerticalRef.current);

        const { groups, items } = buildFromRows({ rows, resourcePolicy, selectedResource });
        if (groups.length) groupsDSRef.current.update(groups);
        if (items.length) itemsDSRef.current.update(items);
        timelineRef.current?.redraw();
        setLoading(false);
        setMoreDataLoading(false);
        pager.onRequestResult({ date: params.date, skip: params.skip, limit: params.limit, ok: true });
      } catch (error) {
        if (!axios.isCancel(error)) {
          toastConfig.setToastConfig(error);
        }
        pager.onRequestResult({ date: params.date, skip: params.skip, limit: params.limit, ok: false });
      } finally {
        queueMicrotask(() => {
          inflightRef.current.get(inflightKey)?.cancel?.();
          inflightRef.current.delete(inflightKey);
        });
      }
    },
    [buildFromRows, resourcePolicy, selectedResource]
  );

  // Infinite vertical scroll within the visible window: uses skip/limit
  const getVerticalScrollTarget = useCallback(() => {
    const container = timelineContainer.current;
    if (!container) return null;
    return (
      (container.querySelector('.vis-left') as HTMLDivElement | null) ||
      (container.querySelector('.vis-panel.vis-center') as HTMLDivElement | null) ||
      container
    );
  }, []);

  const setGroupHeights = () => {
    const groups = [...timelineContainer.current?.querySelectorAll('.vis-left .vis-label.vis-group-level-0')];
    if (groups.length === 0) return;
    const heights: number[] = [];
    groups.forEach((g, i) => {
      const height = g.getBoundingClientRect().height;
      heights.push(height);
    });
    pagerRef.current.setGroupHeights(heights);
  };

  const handleTimelineCLickWrapper = useCallback((e: MouseEvent) => {
    handleTimelineCLick(e, timelineRef.current, timelineContainer.current);
  }, []);

  const options = useMemo(() => {
    const optionsData: TimelineOptions = {
      groupEditable: false,
      verticalScroll: true,
      stack: false,
      margin: { item: 10 },
      zoomKey: 'ctrlKey',
      ...getWindow(timelineContainer.current),
      minHeight: 400,
      maxHeight: Math.min(window.innerHeight - 200, 720),
      selectable: false,
      groupHeightMode: 'auto',
      dataAttributes: ['id'],
      zoomMax: 31556952000, // ~1 year
      zoomMin: 60000, // 1 minute
      editable: { updateGroup: false },
      orientation: { item: 'top', axis: 'top' },
      moment: function (date: Date) {
        return moment(date).tz(user?.user?.timezone || DEFAULT_TIME_ZONE);
      },
      template: (item, element, data) => {
        if (!item?.id || !data?.id) return null as unknown as string;
        ReactDOM.unmountComponentAtNode(element);
        return ReactDOM.createPortal(
          ReactDOM.render(
            <PlanningItemTemplate setAnchor={setAnchor} setOpen={setOpen} resources={resources} data={item} />,
            element
          ) as unknown as React.ReactNode,
          element
        ) as unknown as string;
      },
      groupTemplate: (item, element) => {
        if (!item) return null as unknown as string;
        return ReactDOM.createPortal(
          ReactDOM.render(<PlanningGroupTemplate data={item} />, element) as unknown as React.ReactNode,
          element
        ) as unknown as string;
      },
      onInitialDrawComplete() {
        scrollElement.current = document.querySelector('.vis-left') as HTMLDivElement | undefined;
        setGroupHeights();
        if (initialDrawn.current) return;
        initialDrawn.current = true;

        const win = timelineRef.current?.getWindow();
        if (win) {
          const initial: TimeRange = { start: win.start, end: win.end };
          currentRangeRef.current = initial;
          // only fetch the visible window, first page
          fetchVisible({ params: pagerRef.current.getParamsForVisible(initial), initial: true });

          const { start, end } = getWindow(timelineContainer.current);
          timelineRef.current?.setWindow(start, end);
          timelineRef.current?.redraw();
        }
      }
    };
    return optionsData;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.user?.timezone]);

  // Create/destroy the timeline on dataset/options changes
  const handleDisplayTimeline = useCallback(() => {
    timelineRef.current?.destroy();
    timelineRef.current = null;

    if (timelineContainer.current) {
      timelineRef.current = new Timeline(timelineContainer.current, itemsDSRef.current, groupsDSRef.current, options);

      let minors = document.querySelectorAll<HTMLDivElement>('.vis-panel.vis-top .vis-text.vis-minor');
      let majors = document.querySelectorAll<HTMLDivElement>('.vis-panel.vis-top .vis-text.vis-major');

      const onRangeChanged = (props: { start: Date; end: Date }) => {
        const visible: TimeRange = { start: props.start, end: props.end };
        currentRangeRef.current = visible;

        // when window changes, reset pager and keep data to only this window
        const params = pagerRef.current.getParamsForVisible(visible);
        const newKey = pagerRef.current.crateKey(params);
        if (newKey !== currentWindowKeyRef.current && params) {
          // cancel inflight
          inflightRef.current.forEach((src) => src.cancel?.('window changed'));
          inflightRef.current.clear();

          // pagerRef.current.reset(visible); // resets skip for this window
          hasMoreVerticalRef.current = true;
          fetchVisible({ params, hasMore: true });
        }

        // re-bind header click handlers
        minors?.forEach((e) => e?.removeEventListener('click', handleTimelineCLickWrapper));
        majors?.forEach((e) => e?.removeEventListener('click', handleTimelineCLickWrapper));

        minors = document.querySelectorAll<HTMLDivElement>('.vis-panel.vis-top .vis-text.vis-minor');
        majors = document.querySelectorAll<HTMLDivElement>('.vis-panel.vis-top .vis-text.vis-major');

        minors.forEach((e) => e.addEventListener('click', handleTimelineCLickWrapper));
        majors.forEach((e) => e.addEventListener('click', handleTimelineCLickWrapper));
      };

      timelineRef.current.on('rangechanged', onRangeChanged);

      return () => {
        timelineRef.current?.off('rangechanged', onRangeChanged);
        timelineRef.current?.destroy();
        timelineRef.current = null;
        pagerRef.current.reset({ clearLoaded: true, clearPending: true, resetScroll: true });
        hasMoreVerticalRef.current = true;
        groupsDSRef.current.clear();
        itemsDSRef.current.clear();
        inflightRef.current.forEach((src) => src.cancel?.('Resource switched'));
        inflightRef.current.clear();
      };
    }

    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

  useEffect(() => {
    const cleanup = handleDisplayTimeline();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setTimeout(() => {
      const target = getVerticalScrollTarget();
      if (!target) return;

      const onScroll = () => {
        if (scrollThrottleRef.current) return;
        scrollThrottleRef.current = window.setTimeout(() => {
          if (!initialDrawn.current) return;
          scrollThrottleRef.current = null;
          const target = getVerticalScrollTarget();
          if (!target) return;
          setGroupHeights();

          pagerRef.current.setScrollMetrics({
            scrollTop: target.scrollTop,
            clientHeight: target.clientHeight,
            scrollHeight: target.scrollHeight
          });
          const win = currentRangeRef.current ?? timelineRef.current?.getWindow();
          if (!win) return;

          const fromBottom = target.scrollHeight - target.scrollTop - target.clientHeight;

          if (fromBottom > 45) {
            const params = pagerRef.current.getParamsForVisible({ start: win.start, end: win.end });
            if (params && !moreDataLoading && hasMoreVerticalRef.current) {
              fetchVisible({ params });
            }
          } else {
            const params = pagerRef.current.getParamsForNextPage({ start: win.start, end: win.end });
            if (params && !moreDataLoading && hasMoreVerticalRef.current) {
              fetchVisible({ params, hasMore: true });
            }
          }
        }, 120);
      };

      setGroupHeights();

      target.addEventListener('scroll', onScroll);
      return () => {
        target.removeEventListener('scroll', onScroll);
        if (scrollThrottleRef.current) {
          clearTimeout(scrollThrottleRef.current);
          scrollThrottleRef.current = null;
        }
      };
    }, 1000);
  }, [moreDataLoading]);

  useImperativeHandle(ref, () => ({
    fetchData: async () => {
      const win = timelineRef.current?.getWindow();
      if (!win) return;
      pagerRef.current.reset({ clearLoaded: true, clearPending: true, resetScroll: true });
      hasMoreVerticalRef.current = true;
      groupsDSRef.current.clear();
      itemsDSRef.current.clear();
      await fetchVisible({ params: pagerRef.current.getParamsForVisible({ start: win.start, end: win.end }), initial: true });
    }
  }));

  // Fetch resource policy
  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const {
          data: { data }
        } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.planningView}`);
        if (data) {
          setResourcePolicy(data?.policy);
        }
      } catch (error) {
        toastConfig.setToastConfig(error);
      }
    };
    fetchPolicy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="flex items-center justify-between gap-2 max-md:flex-wrap">
        <div className="flex gap-2">
          <Autocomplete
            options={resourceList}
            getOptionLabel={(option) => (option && option?.title) || ''}
            style={{ width: '350px' }}
            value={selectedResource}
            onChange={(event, newValue) => {
              setSelectedResource(newValue as any);
            }}
            size="small"
            renderInput={(params) => <TextField {...params} label="Select Resource" size="small" variant="outlined" />}
          />
        </div>
        {topRightSlot}
      </div>

      <div className="relative [&_.vis-panel.vis-left]:![border:1px_solid_var(--common-border-color)]">
        <div
          className="timeline mt-4 min-h-full flex-grow overflow-auto [&>*]:bg-[var(--dark-primary,white)] [&_.vis-text]:dark:!text-[white]"
          ref={timelineContainer}
        ></div>

        {loading && (
          <div className="absolute inset-0 z-10 flex h-[min(calc(100vh-200px),720px)] min-h-[400px] items-center justify-center  bg-gray-200 dark:bg-gray-600">
            <h3 className="animate-pulse text-[20px] font-semibold">Loading...</h3>
          </div>
        )}
        {moreDataLoading && (
          <div className="absolute left-4 top-[19px] flex items-center gap-2 ">
            <CircularProgress size={25} />
            <p className="text-[12px] font-semibold text-gray-500">loading...</p>
          </div>
        )}
      </div>
      {isOpen.open && (
        <>
          <ResourcePopover
            anchorEl={anchor}
            data={isOpen.data}
            eventData={isOpen.eventData}
            onClose={() => setOpen({ open: false, data: [], eventData: null })}
            open={true}
            resourceList={resourceList}
          />
        </>
      )}
    </>
  );
});

export default GanttView;
