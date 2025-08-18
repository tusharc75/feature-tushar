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
import { buildOneItem, getWindow, handleTimelineCLick, RawDay, RawGroup, TimeRange } from 'src/pages/PlanningView/GanttView/utils';
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

const today = dayjs.tz();

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
  const hasMoreRef = useRef<boolean>(true);

  const pagerRef = useRef(new VisibleWindowPager(LIMIT));
  const currentWindowKeyRef = useRef<string | null>(null);

  const scrollThrottleRef = useRef<number | null>(null);

  const buildFromRows = useCallback(
    (rows: RawGroup[]) => {
      const groups = rows.map((g) => ({
        productName: g.productName,
        _id: g._id,
        id: g._id,
        productDescription: g.productDescription
      }));

      const items = rows.flatMap((rawGroup) => {
        const groupId = rawGroup._id;
        return rawGroup.data.flatMap((d: RawDay, i: number) => {
          const baseId = d._id ?? `item-${i}_${groupId}`;

          // local date boundaries for the band
          const localDate = dayjs(d.date);
          const start = localDate.startOf('day').toDate();
          const end = localDate.endOf('day').toDate();

          // ledger comparisons against "today"
          const ledgerDate = dayjs(d.date);
          const isPast = ledgerDate.isBefore(today, 'day');
          const isFuture = ledgerDate.isAfter(today, 'day');

          const base = {
            group: groupId,
            groupName: rawGroup.productName,
            originalDate: d.date,
            start,
            end,
            allDay: true,
            resource: selectedResource?.resource
          };

          const one = buildOneItem({ baseId, d, base, isPast, isFuture, resourcePolicy });
          return one ? [one] : [];
        });
      });

      return { groups, items };
    },
    [resourcePolicy, selectedResource?.resource]
  );

  const fetchVisible = useCallback(
    async (params: Params) => {
      const pager = pagerRef.current;

      if (!params) return;
      const range = { end: dayjs(params.date.to, 'MM/DD/YYYY').toDate(), start: dayjs(params.date.from, 'MM/DD/YYYY').toDate() };

      const windowKey = pager.key(range);
      currentWindowKeyRef.current = windowKey;

      const inflightKey = `${windowKey}__skip:${params.skip}`;
      if (inflightRef.current.has(inflightKey)) return;

      const source = axios.CancelToken.source();
      inflightRef.current.set(inflightKey, source);
      setMoreDataLoading(true);

      try {
        const resp = await axiosInstance().get('/planning-view/products-planning', {
          cancelToken: source.token,
          params
        });
        pager.setTotalGroups(resp.data.count);

        const rows: RawGroup[] = resp?.data?.data ?? [];
        pager.markResult(range, params.skip, rows.length);
        hasMoreRef.current = rows.length >= LIMIT;

        const { groups, items } = buildFromRows(rows);
        if (groups.length) groupsDSRef.current.update(groups);
        if (items.length) itemsDSRef.current.update(items);
        timelineRef.current?.redraw();
        setLoading(false);
        setMoreDataLoading(false);
      } catch (error) {
        if (!axios.isCancel(error)) {
          setLoading(false);
          setMoreDataLoading(false);
          toastConfig.setToastConfig(error);
        }
      } finally {
        queueMicrotask(() => {
          inflightRef.current.get(inflightKey)?.cancel?.();
          inflightRef.current.delete(inflightKey);
        });
        setMoreDataLoading(false);
      }
    },
    [buildFromRows]
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

  useEffect(() => {
    setTimeout(() => {
      const target = getVerticalScrollTarget();
      if (!target) return;

      const onScroll = () => {
        if (scrollThrottleRef.current) return;
        scrollThrottleRef.current = window.setTimeout(() => {
          scrollThrottleRef.current = null;

          const target = getVerticalScrollTarget();
          if (!target) return;

          // Optional: comment out height writes unless you map to absolute indices
          const groups = [...timelineContainer.current?.querySelectorAll('.vis-left .vis-label.vis-group-level-0')];
          groups.forEach((g, i) => {
            const height = g.getBoundingClientRect().height;
            pagerRef.current.setGroupItemHeight(i, height);
          });

          pagerRef.current.setScrollData({
            scrollTop: target.scrollTop,
            clientHeight: target.clientHeight,
            scrollHeight: target.scrollHeight
          });

          const nearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 200;
          const win = currentRangeRef.current ?? timelineRef.current?.getWindow();
          if (!win) return;

          const params = pagerRef.current.getParamsForVisible(
            { start: win.start, end: win.end },
            { prefetchPx: nearBottom ? target.clientHeight * 1.5 : 0, skipLimit: true } // prefetch below the fold
          );

          if (params && !moreDataLoading && hasMoreRef.current) {
            fetchVisible(params);
          }
        }, 120);
      };

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
      minHeight: 62,
      maxHeight: window.innerHeight - 200,
      selectable: false,
      groupHeightMode: 'auto',
      dataAttributes: ['id'],
      zoomMax: 31556952000, // ~1 year
      zoomMin: 60000, // 1 minute
      editable: { updateGroup: false },
      orientation: { item: 'top', axis: 'top' },
      moment(date: Date) {
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
        if (initialDrawn.current) return;
        initialDrawn.current = true;

        const win = timelineRef.current?.getWindow();
        if (win) {
          const initial: TimeRange = { start: win.start, end: win.end };
          currentRangeRef.current = initial;

          setLoading(false);
          setMoreDataLoading(false);
          // only fetch the visible window, first page
          fetchVisible(pagerRef.current.getParamsForVisible(initial));

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
        const newKey = pagerRef.current.key(visible);
        if (newKey !== currentWindowKeyRef.current) {
          // cancel inflight
          inflightRef.current.forEach((src) => src.cancel?.('window changed'));
          inflightRef.current.clear();

          pagerRef.current.reset(visible); // resets skip for this window
          hasMoreRef.current = true;

          // // keep memory tight: only visible window in datasets
          // groupsDSRef.current.clear();
          // itemsDSRef.current.clear();
          const params = pagerRef.current.getParamsForVisible(visible);

          fetchVisible(params);
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

  useEffect(() => {
    inflightRef.current.forEach((src) => src.cancel?.('resource switched'));
    inflightRef.current.clear();
    pagerRef.current.reset();
    hasMoreRef.current = true;
    groupsDSRef.current.clear();
    itemsDSRef.current.clear();
    setLoading(true);
    const win = timelineRef.current?.getWindow();
    if (win) {
      const visible: TimeRange = { start: win.start, end: win.end };
      currentRangeRef.current = visible;
      fetchVisible(pagerRef.current.getParamsForVisible(visible));
    }
  }, [selectedResource]);

  useImperativeHandle(ref, () => ({
    fetchData: async () => {
      setLoading(true);
      const win = timelineRef.current?.getWindow();
      if (!win) return;
      pagerRef.current.reset();
      hasMoreRef.current = true;
      groupsDSRef.current.clear();
      itemsDSRef.current.clear();
      await fetchVisible(pagerRef.current.getParamsForVisible({ start: win.start, end: win.end }));
    }
  }));

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
          <div className="absolute inset-0 flex min-h-[calc(100vh-200px)] items-center justify-center  bg-gray-200 dark:bg-gray-600">
            <h3 className="animate-pulse text-[20px] font-semibold">Loading...</h3>
          </div>
        )}
        {moreDataLoading && (
          <div className="absolute left-4 top-[19px] flex items-center gap-2">
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
