import dayjs from 'dayjs';
import moment from 'moment-timezone';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import Map from 'src/pages/TechnicianScheduler/Vis/Map';
import GroupTemplate from 'src/pages/TechnicianScheduler/Vis/Templates/GroupTemplate';
import { ItemTemplate } from 'src/pages/TechnicianScheduler/Vis/Templates/ItemTemplate';
import { useTimelineStore } from 'src/pages/TechnicianScheduler/Vis/useTimelineStore';
import { useData } from 'src/StateProvider/Provider';
import { DataSet, Timeline, TimelineOptions } from 'vis-timeline/standalone';
import * as ReactDOMServer from 'react-dom/server';

type DesktopTimelineProps = {
  timelineData: { groups: DataSet<any, 'id'> | null; items: DataSet<any, 'id'> | null };
  loading: boolean;
};

const DesktopTimeline = ({ timelineData, loading }: DesktopTimelineProps) => {
  const [, setStore] = useTimelineStore((store) => store.startEndDateConfirmationDialog);
  const {
    state: { user }
  }: any = useData();
  const timelineRef = useRef<Timeline>(null);
  const timelineContainer = useRef<HTMLDivElement>(null);
  const [activeItemData] = useTimelineStore((state) => state.activeItemData);
  const [selectedResource] = useTimelineStore((state) => state.selectedResource);

  const options = useMemo(() => {
    const optionsData: TimelineOptions & { loadingScreenTemplate: () => void } = {
      orientation: {
        item: 'bottom',
        axis: 'top'
      },
      moment: function (date: Date) {
        return moment(date).tz(user?.user?.timezone || 'America/New_York');
      },

      // visibleFrameTemplate: () => {
      //   return `<div >&nbsp;</div>`;
      // },
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
        console.log(objectData, item);
        alert('dropped object with content: "' + objectData + '" to item: "' + item + '"');
      },
      loadingScreenTemplate: function () {
        return `<div className="relative">
        <h2 className="text-xs">Loading....</h2>
                  <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-800"></div>
                </div>`;
      },
      start: dayjs().subtract(9, 'day').toDate(),
      end: dayjs().add(9, 'day').toDate(),
      height: window.innerHeight - 200,
      maxHeight: window.innerHeight - 200
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
    timeline.on('dragend', (event) => {
      const properties = timeline.getEventProperties(event);
      console.log({ event, properties });
    });
    timeline.on('drop', (event) => {
      const properties = timeline.getEventProperties(event);
      let itemData = JSON.parse(event.dataTransfer.getData('text'));

      console.log({ event, properties, itemData });
    });
  }, [timelineData, options, loading]);

  useEffect(() => {
    handleDisplayTimeline();
  }, [handleDisplayTimeline]);

  if (loading) {
    return (
      <div className="relative">
        <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-800"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      <Map />
      <div className="timeline min-h-full flex-grow overflow-auto" ref={timelineContainer}></div>
    </div>
  );
};

export default DesktopTimeline;
