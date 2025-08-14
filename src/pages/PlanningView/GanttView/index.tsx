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
import {
  buildOneItem,
  fmt,
  getWindow,
  handleTimelineCLick,
  mergeCoverage,
  normalizeRange,
  RawDay,
  RawGroup,
  subtractCoverage,
  TimeRange
} from 'src/pages/PlanningView/GanttView/utils';
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

  const [anchor, setAnchor] = useState(null);
  const [isOpen, setOpen] = useState({ open: false, data: [], eventData: null });

  // Stable datasets (reused; we append/update instead of replacing)
  const groupsDSRef = useRef<DataSet<any, 'id'>>(new DataSet([]));
  const itemsDSRef = useRef<DataSet<any, 'id'>>(new DataSet([]));

  // Keep state handles for options and timeline
  const [resourcePolicy, setResourcePolicy] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [moreDataLoading, setMoreDataLoading] = useState(false);

  const timelineRef = useRef<Timeline | null>(null);
  const timelineContainer = useRef<HTMLDivElement>(null);

  // Range cache/in-flight management
  const coveredRef = useRef<TimeRange[]>([]);
  const inflightRef = useRef<Map<string, CancelTokenSource>>(new Map());
  const currentRangeRef = useRef<TimeRange | null>(null);
  const initialDrawn = useRef(false);

  const PREFETCH_DAYS = 3;

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
          const localDate = dayjs(d.date).tz();
          const start = localDate.startOf('day').toDate();
          const end = localDate.endOf('day').toDate();

          const ledgerDate = dayjs.utc(d.date).tz();
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

          const one = buildOneItem({
            baseId,
            d,
            base,
            isPast,
            isFuture,
            resourcePolicy
          });

          return one ? [one] : [];
        });
      });

      return { groups, items };
    },
    [resourcePolicy, selectedResource?.resource]
  );

  // Fetch a specific range if not already in-flight; append to datasets on success
  const fetchRange = async (range: TimeRange) => {
    const norm = normalizeRange(range);
    const key = `${fmt(norm.start)}__${fmt(norm.end)}`;

    if (inflightRef.current.has(key)) return; // already fetching

    const source = axios.CancelToken.source();
    inflightRef.current.set(key, source);
    if (coveredRef.current.length === 0) {
      setLoading(true);
    } else {
      setMoreDataLoading(true);
    }
    try {
      const resp = await axiosInstance().get('/planning-view/products-planning', {
        cancelToken: source.token,
        params: {
          limit: LIMIT,
          date: { from: fmt(norm.start), to: fmt(norm.end) }
        }
      });
      coveredRef.current = mergeCoverage(coveredRef.current, norm);

      const rows: RawGroup[] = resp?.data?.data ?? [];
      const { groups, items } = buildFromRows(rows);

      if (!groupsDSRef.current || !itemsDSRef.current) {
        return;
      }

      if (groups.length) {
        groupsDSRef.current.update(groups);
      }
      if (items.length) {
        itemsDSRef.current.update(items);
      }

      timelineRef.current?.redraw();
    } catch (error) {
      if (!axios.isCancel(error)) {
        toastConfig.setToastConfig(error);
      }
    } finally {
      queueMicrotask(() => {
        inflightRef.current.get(key)?.cancel?.();
        inflightRef.current.delete(key);
      });

      setLoading(false);
      setMoreDataLoading(false);
    }
  };

  const ensureRangeCached = async (visible: TimeRange) => {
    const expanded: TimeRange = {
      start: dayjs(visible.start).subtract(PREFETCH_DAYS, 'day').toDate(),
      end: dayjs(visible.end).add(PREFETCH_DAYS, 'day').toDate()
    };
    const norm = normalizeRange(expanded);
    const missing = subtractCoverage(coveredRef.current, norm);
    if (!missing.length) return;
    for (const r of missing) {
      await fetchRange(r);
    }
  };

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
      zoomMax: 31556952000, // 1 year
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
        if (initialDrawn.current) return;
        initialDrawn.current = true;
        // Ensure initial visible window is cached
        const win = timelineRef.current?.getWindow();
        if (win) {
          const initial: TimeRange = { start: win.start, end: win.end };
          currentRangeRef.current = initial;
          ensureRangeCached(initial);
          const { start, end } = getWindow(timelineContainer.current);
          timelineRef.current.setWindow(start, end);
          timelineRef.current?.redraw();
        }
      }
    };
    return optionsData;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.user?.timezone]);

  const handleTimelineCLickWrapper = useCallback((e: MouseEvent) => {
    handleTimelineCLick(e, timelineRef.current, timelineContainer.current);
  }, []);

  // Create/destroy the timeline on dataset/options changes
  const handleDisplayTimeline = useCallback(() => {
    // Destroy existing
    timelineRef.current?.destroy();
    timelineRef.current = null;

    // Create new
    if (timelineContainer.current) {
      timelineRef.current = new Timeline(timelineContainer.current, itemsDSRef.current, groupsDSRef.current, options);
      let minors = document.querySelectorAll<HTMLDivElement>('.vis-panel.vis-top .vis-text.vis-minor');
      let majors = document.querySelectorAll<HTMLDivElement>('.vis-panel.vis-top .vis-text.vis-major');
      // Listen to range changes to dynamically fetch what's missing
      const onRangeChanged = (props: { start: Date; end: Date }) => {
        const visible: TimeRange = { start: props.start, end: props.end };
        currentRangeRef.current = visible;
        ensureRangeCached(visible);

        // Remove all previous listeners to prevent memory leak
        minors?.forEach((e) => e?.removeEventListener('click', handleTimelineCLickWrapper));
        majors?.forEach((e) => e?.removeEventListener('click', handleTimelineCLickWrapper));

        minors = document.querySelectorAll<HTMLDivElement>('.vis-panel.vis-top .vis-text.vis-minor');
        majors = document.querySelectorAll<HTMLDivElement>('.vis-panel.vis-top .vis-text.vis-major');

        minors.forEach((e) => e.addEventListener('click', handleTimelineCLickWrapper));
        majors.forEach((e) => e.addEventListener('click', handleTimelineCLickWrapper));
      };

      timelineRef.current.on('rangechanged', onRangeChanged);

      // Clean up event on re-init or unmount
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
    // Cancel in-flight
    inflightRef.current.forEach((src) => src.cancel?.('resource switched'));
    inflightRef.current.clear();

    // Clear coverage
    coveredRef.current = [];

    // Clear datasets
    groupsDSRef.current.clear();
    itemsDSRef.current.clear();

    // Re-fetch for the current window
    const win = timelineRef.current?.getWindow();
    if (win) {
      const visible: TimeRange = { start: win.start, end: win.end };
      currentRangeRef.current = visible;
      ensureRangeCached(visible);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedResource]);

  // Expose an imperative ref to force-fetch the current range
  useImperativeHandle(ref, () => ({
    fetchData: async () => {
      const win = timelineRef.current?.getWindow();
      if (win) {
        // Clear coverage
        coveredRef.current = [];

        // Clear datasets
        groupsDSRef.current.clear();
        itemsDSRef.current.clear();
        await ensureRangeCached({ start: win.start, end: win.end });
      }
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
