import dayjs from 'dayjs';
import moment from 'moment-timezone';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import Map from 'src/pages/TechnicianScheduler/Vis/Map';
import GroupTemplate from 'src/pages/TechnicianScheduler/Vis/Templates/GroupTemplate';
import { ItemTemplate } from 'src/pages/TechnicianScheduler/Vis/Templates/ItemTemplate';
import { Activity, DNDData, Service } from 'src/pages/TechnicianScheduler/Vis/types';
import { useTimelineStore } from 'src/pages/TechnicianScheduler/Vis/useTimelineStore';
import { useData } from 'src/StateProvider/Provider';
import { DataSet, Timeline, TimelineOptions } from 'vis-timeline/standalone';

type DesktopTimelineProps = {
  timelineData: { groups: DataSet<any, 'id'> | null; items: DataSet<any, 'id'> | null };
  loading: boolean;
  onDragEnd: ({ service, technician }: { service: Service; technician: Activity }) => void;
};

const DesktopTimeline = ({ timelineData, loading, onDragEnd }: DesktopTimelineProps) => {
  const {
    state: { user }
  }: any = useData();
  const timelineRef = useRef<Timeline>(null);
  // const [timeline, setTimeline] = useState<Timeline>(null);
  const timelineContainer = useRef<HTMLDivElement>(null);
  const [activeItemData] = useTimelineStore((state) => state.activeItemData);
  const [selectedResource, setStore] = useTimelineStore((state) => state.selectedResource);
  const currentRange = useRef<{ start: Date; end: Date; firstTarget: HTMLElement }>(null);

  const options = useMemo(() => {
    const optionsData: TimelineOptions = {
      rollingMode: {
        follow: true
      },
      orientation: {
        item: 'bottom',
        axis: 'top'
      },
      moment: function (date: Date) {
        return moment(date).tz(user?.user?.timezone || 'America/New_York');
      },
      template: (item, element, data) => {
        if (!item?.id || !data?.id) return null;
        ReactDOM.unmountComponentAtNode(element);
        return ReactDOM.createPortal(
          ReactDOM.render(<ItemTemplate service={item} setStore={setStore} />, element) as unknown as React.ReactNode,
          element
        ) as unknown as string;
      },
      groupTemplate: (item, element) => {
        if (!item) {
          return;
        }
        return ReactDOM.createPortal(
          ReactDOM.render(
            <GroupTemplate data={item} setStore={setStore} activeItemData={activeItemData} selectedResource={selectedResource} />,
            element
          ) as unknown as React.ReactNode,
          element
        ) as unknown as string;
      },
      onInitialDrawComplete() {
        // to calculate item positions correctly
        timelineRef.current?.redraw();
      },
      onDropObjectOnItem: function (objectData, item, callback) {
        alert('dropped object with content: "' + objectData + '" to item: "' + item + '"');
      },

      start: currentRange.current?.start ? currentRange.current.start : dayjs().subtract(9, 'day').toDate(),
      end: currentRange.current?.end ? currentRange.current.end : dayjs().add(9, 'day').toDate(),
      height: window.innerHeight - 200,
      maxHeight: window.innerHeight - 200,
      selectable: false,
      groupHeightMode: 'auto'
    };
    return optionsData;
  }, [user?.user?.timezone, setStore, activeItemData, selectedResource]);

  const handleDisplayTimeline = useCallback(() => {
    if (!timelineData.groups || !timelineData.items || loading) return;
    let timeline: Timeline | null = null;
    if (timelineContainer.current) {
      timeline = new Timeline(timelineContainer.current, timelineData.items, timelineData.groups, options);
    }
    timelineRef.current?.destroy();
    timelineRef.current = timeline;

    const handleRangeChange = (e: { start: Date; end: Date; event: { firstTarget: HTMLElement } }) => {
      currentRange.current = { end: e.end, start: e.start, firstTarget: e.event?.firstTarget };
    };
    timelineRef.current.on('rangechanged', handleRangeChange);

    const timeLineContainerElement = document.querySelector('.vis-content') as HTMLDivElement;
    function handleDrop(e: DragEvent) {
      const eData = timeline.getEventProperties(e);

      const dndData = JSON.parse(e.dataTransfer.getData('text/plain') || '') as DNDData;
      const service = dndData.data;
      const technician = timelineData.groups.get(eData.group);
      onDragEnd({ service, technician });
    }
    timeLineContainerElement.addEventListener('drop', handleDrop.bind(this), false);

    return () => {
      timeLineContainerElement.removeEventListener('drop', handleDrop.bind(this), false);
      timelineRef.current.off('rangechanged', handleRangeChange);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timelineData, options, loading]);

  useEffect(() => {
    handleDisplayTimeline();
  }, [handleDisplayTimeline]);

  if (loading) {
    return (
      <div className="relative">
        <div className="absolute inset-0 animate-pulse rounded-md bg-gray-200 dark:bg-gray-800"></div>
      </div>
    );
  }

  return (
    <div className="relative isolate">
      <div className="absolute inset-0 -z-[1] flex animate-pulse items-center justify-center rounded-md bg-gray-200 dark:bg-gray-800"></div>
      <Map />
      <div
        className="timeline min-h-full flex-grow overflow-auto [&>*]:bg-[var(--dark-primary,white)] [&_.vis-text]:dark:!text-[white]"
        ref={timelineContainer}
      ></div>
    </div>
  );
};

export default DesktopTimeline;
