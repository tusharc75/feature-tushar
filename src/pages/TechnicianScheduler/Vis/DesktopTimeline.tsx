import dayjs from 'dayjs';
import moment from 'moment-timezone';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import useLocalStorage from 'src/hooks/useLocalStore';
import Map from 'src/pages/TechnicianScheduler/Vis/Map';
import ShowDragMessage from 'src/pages/TechnicianScheduler/Vis/ShowDragMessage';
import TechnicianHeader from 'src/pages/TechnicianScheduler/Vis/TechnicianHeader';
import GroupTemplate from 'src/pages/TechnicianScheduler/Vis/Templates/GroupTemplate';
import { ItemTemplate } from 'src/pages/TechnicianScheduler/Vis/Templates/ItemTemplate';
import { Activity, DNDData, Service } from 'src/pages/TechnicianScheduler/Vis/types';
import { useTimelineStore } from 'src/pages/TechnicianScheduler/Vis/useTimelineStore';
import { GROUP_HIGHLIGHT_CLASSES } from 'src/pages/TechnicianScheduler/Vis/utils';
import { useData } from 'src/StateProvider/Provider';
import { DataSet, Timeline, TimelineOptions } from 'vis-timeline/standalone';

type DesktopTimelineProps = {
  timelineData: { groups: DataSet<any, 'id'> | null; items: DataSet<any, 'id'> | null };
  loading: boolean;
  onDragEnd: ({ service, technician }: { service: Service; technician: Activity }) => void;
};

export const techSchlocalStoreKey = 'technician-scheduler-active-item';
// 'vis-timeline'

const DesktopTimeline = ({ timelineData, loading, onDragEnd }: DesktopTimelineProps) => {
  const {
    state: { user }
  }: any = useData();
  const [, setLocalStore] = useLocalStorage(techSchlocalStoreKey); // to send data to group template without re-render
  const timelineRef = useRef<Timeline>(null);
  // const [timeline, setTimeline] = useState<Timeline>(null);
  const timelineContainer = useRef<HTMLDivElement>(null);
  const [activeItemData] = useTimelineStore((state) => state.activeItemData);
  const [selectedResource, setStore] = useTimelineStore((state) => state.selectedResource);
  const currentRange = useRef<{ start: Date; end: Date; firstTarget: HTMLElement }>(null);
  const prevOverGroup = useRef<HTMLElement>(null);
  const technicianHeaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalStore(activeItemData);
  }, [setLocalStore, activeItemData]);

  const options = useMemo(() => {
    const optionsData: TimelineOptions = {
      groupEditable: true,
      verticalScroll: true,
      zoomKey: 'ctrlKey',
      start: currentRange.current?.start ? currentRange.current.start : dayjs().subtract(10, 'day').toDate(),
      end: currentRange.current?.end ? currentRange.current.end : dayjs().add(10, 'day').toDate(),
      minHeight: 62,
      maxHeight: window.innerHeight - 200,
      selectable: false,
      groupHeightMode: 'auto',
      dataAttributes: ['id'],
      zoomMax: 31556952000, // 1 year in milliseconds
      zoomMin: 60000, // 1 minuite in milliseconds
      editable: {
        updateGroup: true
      },
      orientation: {
        item: 'top',
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
            <GroupTemplate data={item} setStore={setStore} selectedResource={selectedResource} />,
            element
          ) as unknown as React.ReactNode,
          element
        ) as unknown as string;
      },
      onInitialDrawComplete() {
        // to calculate item positions correctly
        timelineRef.current?.redraw();
        timelineRef.current?.zoomIn(1);
        setTimeout(() => {
          const sidebar = document.querySelector<HTMLDivElement>('.vis-panel.vis-left');
          const container = technicianHeaderRef.current;
          if (container && sidebar) {
            container.style.width = `${sidebar.offsetWidth}px`;
          }
        }, 200);
      },
      onDropObjectOnItem: function (objectData, item, callback) {
        alert('dropped object with content: "' + objectData + '" to item: "' + item + '"');
      }
    };
    return optionsData;
  }, [user?.user?.timezone, setStore, selectedResource]);

  const handleDisplayTimeline = useCallback(() => {
    if (!timelineData.groups || !timelineData.items || loading) return;
    let timeline: Timeline | null = null;
    if (timelineContainer.current) {
      timeline = new Timeline(timelineContainer.current, timelineData.items, timelineData.groups, options);
    }
    timelineRef.current?.destroy();
    timelineRef.current = timeline;

    const handleTimelineCLick = (event: MouseEvent) => {
      const target = event.currentTarget as HTMLDivElement;
      const zoom = target.classList.contains('vis-minor') ? 1 : -1;
      const data = timeline.getEventProperties(event);

      const time = data.time;
      let start = dayjs(time).startOf('day').toDate();
      let end = dayjs(time).endOf('day').toDate();
      if (zoom < 0) {
        start = dayjs(time).startOf('month').toDate();
        end = dayjs(time).endOf('month').toDate();
      }
      timeline.setWindow(start, end);
    };

    let minors = document.querySelectorAll<HTMLDivElement>('.vis-panel.vis-top .vis-text.vis-minor');
    let majors = document.querySelectorAll<HTMLDivElement>('.vis-panel.vis-top .vis-text.vis-major');

    const handleRangeChange = (e: { start: Date; end: Date; event: { firstTarget: HTMLElement } }) => {
      currentRange.current = { end: e.end, start: e.start, firstTarget: e.event?.firstTarget };

      // Remove all previous listeners to prevent memory leak
      minors?.forEach((e) => e?.removeEventListener('click', handleTimelineCLick));
      majors?.forEach((e) => e?.removeEventListener('click', handleTimelineCLick));

      minors = document.querySelectorAll<HTMLDivElement>('.vis-panel.vis-top .vis-text.vis-minor');
      majors = document.querySelectorAll<HTMLDivElement>('.vis-panel.vis-top .vis-text.vis-major');

      minors.forEach((e) => e.addEventListener('click', handleTimelineCLick));
      majors.forEach((e) => e.addEventListener('click', handleTimelineCLick));
    };

    const handleChanged = () => {
      const groups = document.querySelectorAll('.vis-foreground .vis-group');
      const panels = document.querySelectorAll('.vis-panel.vis-left .vis-label');
      for (let i = 0; i < groups.length; i++) {
        const item = groups[i] as HTMLDivElement;
        const panel = panels[i] as HTMLDivElement;
        const setMaxHeight = (height: number) => {
          item.style.maxHeight = `${height}px`;
          panel.style.maxHeight = `${height}px`;
        };
        const setMinHeight = (height: number | '') => {
          item.style.minHeight = !height ? '' : `${height}px`;
          panel.style.minHeight = !height ? '' : `${height}px`;
        };

        item.setAttribute('data-original-height', `${parseInt((item.computedStyleMap().get('height') as string) || '0px', 10)}`);
        if (+item.dataset.originalHeight > 115 && !item.dataset.expanded) {
          setMaxHeight(142);

          item.style.overflow = 'hidden';
          if (!item.dataset.buttonInserted) {
            const collapseButton = document.createElement('button');
            collapseButton.innerText = 'Collapse';
            collapseButton.classList.add('timeline-collapse-button');
            collapseButton.onclick = (e) => {
              item.removeAttribute('data-expanded');
              item.appendChild(button);
              setMaxHeight(142);
              setMinHeight('');
              try {
                item.removeChild(collapseButton);
              } catch {}
            };

            const button = document.createElement('button');
            button.innerText = 'Show All';
            button.onclick = (e) => {
              setMaxHeight(Number(item.dataset.originalHeight) + 40);
              setTimeout(() => {
                setMinHeight(Number(item.dataset.originalHeight) + 40);
              }, 300);
              item.setAttribute('data-expanded', 'true');
              panel.setAttribute('data-expanded', 'true');
              item.appendChild(collapseButton);

              try {
                item.removeChild(button);
              } catch (error) {}
            };
            button.classList.add('timeline-show-all-button');
            item.appendChild(button);
            item.setAttribute('data-button-inserted', 'true');
          }
        }
      }
    };

    timelineRef.current.on('changed', handleChanged);
    timelineRef.current.on('rangechanged', handleRangeChange);

    const timeLineContainerElement = document.querySelector('.vis-panel.vis-center .vis-content') as HTMLDivElement;
    const technicianContainerElement = document.querySelector('.vis-panel.vis-left .vis-content') as HTMLDivElement;
    function handleDrop(e: DragEvent) {
      setStore({ activeItemData: null });
      const eData = timeline.getEventProperties(e);
      const dndData = JSON.parse(e.dataTransfer.getData('text/plain') || '') as DNDData;
      let service: Service, technician: Activity;
      if (dndData.from === 'sidebar') {
        service = dndData.data;
        technician = timelineData.groups.get(eData.group);
      }
      prevOverGroup.current?.classList.remove(...GROUP_HIGHLIGHT_CLASSES);
      if (service && technician) onDragEnd({ service, technician });
    }

    function handleDragOver(e: DragEvent) {
      const target = e.target as HTMLElement;
      if (!target.classList.contains('vis-group')) return;
      if (!prevOverGroup.current) {
        prevOverGroup.current = target;
        prevOverGroup.current.classList.add(...GROUP_HIGHLIGHT_CLASSES);
      }
      if (prevOverGroup.current !== target || !target.classList.contains(GROUP_HIGHLIGHT_CLASSES[0])) {
        prevOverGroup.current.classList.remove(...GROUP_HIGHLIGHT_CLASSES);
        prevOverGroup.current = target;
        prevOverGroup.current.classList.add(...GROUP_HIGHLIGHT_CLASSES);
      }
    }

    timeLineContainerElement.addEventListener('dragover', handleDragOver.bind(this), false);
    timeLineContainerElement.addEventListener('drop', handleDrop.bind(this), false);
    technicianContainerElement.addEventListener('drop', handleDrop.bind(this), false);

    return () => {
      timeLineContainerElement.removeEventListener('drop', handleDrop.bind(this), false);
      technicianContainerElement.removeEventListener('drop', handleDrop.bind(this), false);
      timeLineContainerElement.removeEventListener('dragover', handleDragOver.bind(this), false);
      timelineRef.current.off('rangechanged', handleRangeChange);
      timelineRef.current.off('changed', handleChanged);
      timeline?.destroy();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timelineData, options, loading]);

  useEffect(() => {
    handleDisplayTimeline();
  }, [handleDisplayTimeline]);

  if (loading) {
    return (
      <div className="relative isolate w-full">
        <div className="absolute inset-0 animate-pulse rounded-md bg-gray-200 dark:bg-gray-800"></div>
      </div>
    );
  }

  return (
    <div className="relative isolate w-full">
      <div className="absolute inset-0 -z-[1] flex animate-pulse items-center justify-center rounded-md bg-gray-200 dark:bg-gray-800"></div>
      <Map />
      <div className="relative">
        <div
          className="timeline min-h-full flex-grow overflow-auto [&>*]:bg-[var(--dark-primary,white)] [&_.vis-text]:dark:!text-[white]"
          ref={timelineContainer}
        ></div>
        <div ref={technicianHeaderRef} className="absolute right-0 top-0 flex h-[62px] w-[300px] border bg-[var(--dark-primary,white)]">
          <TechnicianHeader timelineData={timelineData} />
        </div>
        <ShowDragMessage containerRef={timelineContainer} />
      </div>
    </div>
  );
};

export default DesktopTimeline;
