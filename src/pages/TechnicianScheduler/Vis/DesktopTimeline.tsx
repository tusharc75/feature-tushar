import dayjs from 'dayjs';
import moment from 'moment-timezone';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { ItemTemplate } from 'src/pages/TechnicianScheduler/Vis/Templates/ItemTemplate';
import { useData } from 'src/StateProvider/Provider';
import { DataSet, Timeline, TimelineOptions } from 'vis-timeline/standalone';
import ReactDOM from 'react-dom';
import { useTimelineStore } from 'src/pages/TechnicianScheduler/Vis/useTimelineStore';
import GroupTemplate from 'src/pages/TechnicianScheduler/Vis/Templates/GroupTemplate';

type DesktopTimelineProps = {
  timelineData: { groups: DataSet<any, 'id'> | null; items: DataSet<any, 'id'> | null };
};

const DesktopTimeline = ({ timelineData }: DesktopTimelineProps) => {
  const [, setStore] = useTimelineStore((store) => store.startEndDateConfirmationDialog);
  const {
    state: { user }
  }: any = useData();
  const timelineRef = useRef<Timeline>(null);
  const timelineContainer = useRef<HTMLDivElement>(null);
  const [activeItemData] = useTimelineStore((state) => state.activeItemData);
  const [selectedResource] = useTimelineStore((state) => state.selectedResource);

  const options = useMemo(() => {
    const optionsData: TimelineOptions = {
      orientation: {
        item: 'bottom',
        axis: 'top'
      },
      moment: function (date: Date) {
        return moment(date).tz(user?.user?.timezone || 'America/New_York');
      },
      template: (item, element) => {
        if (!item) {
          return;
        }
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
      start: dayjs().subtract(9, 'day').toDate(),
      end: dayjs().add(9, 'day').toDate(),
      height: window.innerHeight - 200,
      maxHeight: window.innerHeight - 200
    };
    return optionsData;
  }, [user?.user?.timezone, setStore]);

  const handleDisplayTimeline = useCallback(() => {
    if (timelineData.groups && timelineData.items) {
      let timeline: Timeline | null = null;
      if (timelineContainer.current) {
        timeline = new Timeline(timelineContainer.current, timelineData.items, timelineData.groups, options);
      }
      timelineRef.current?.destroy();
      timelineRef.current = timeline;
      setTimeout(() => {
        timeline.setWindow(dayjs().subtract(9, 'day').toDate(), dayjs().add(9, 'day').toDate(), { animation: true });
      }, 500);
    }
  }, [timelineData, options]);

  useEffect(() => {
    handleDisplayTimeline();
  }, [handleDisplayTimeline]);

  return <div className="timeline min-h-full flex-grow overflow-auto" ref={timelineContainer}></div>;
};

export default DesktopTimeline;
