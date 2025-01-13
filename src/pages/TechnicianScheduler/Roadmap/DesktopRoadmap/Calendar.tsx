import dayjs from 'dayjs';
import React, { useCallback, useEffect } from 'react';
import { HandleSelect } from 'src/pages/TechnicianScheduler/Roadmap';
import CalendarData from 'src/pages/TechnicianScheduler/Roadmap/DesktopRoadmap/CalendarData';
import CalendarHead from 'src/pages/TechnicianScheduler/Roadmap/DesktopRoadmap/CalendarHead';
import { TActivity } from 'src/pages/TechnicianScheduler/Roadmap/types';

type CalendarProps = {
  dayPixel: number;
  activity: TActivity[];
  endDate: dayjs.Dayjs;
  startDate: dayjs.Dayjs;
  totalDay: number;
  handleSelect: HandleSelect;
  selected: string | null;
  container: HTMLDivElement;
};

const Calendar = ({ dayPixel, endDate, startDate, activity, handleSelect, selected, totalDay, container }: CalendarProps) => {
  const lineRef = React.useRef<HTMLDivElement>(null);

  const executeScroll = useCallback(() => {
    if (lineRef.current && container) {
      const scrollLeft = lineRef.current.offsetLeft - container.offsetLeft - container.clientWidth * 0.5;
      container.scrollLeft = scrollLeft;
    }
  }, [container]);

  useEffect(() => {
    setTimeout(() => {
      executeScroll();
    }, 500);
  }, [activity, executeScroll, selected]);

  return (
    <div className="relative ">
      <CalendarHead dayPixel={dayPixel} endDate={endDate} startDate={startDate} />
      <CalendarData activity={activity} handleSelect={handleSelect} selected={selected} dayPixel={dayPixel} startDate={startDate} />
      <div
        ref={lineRef}
        className="absolute bottom-0 top-0 "
        style={{
          left: (100 * dayjs().diff(startDate, 'day')) / totalDay + '%',
          width: dayPixel
        }}
      >
        <div className="mx-auto h-full w-[2px] border border-[#047d1c]" />
      </div>
    </div>
  );
};

export default Calendar;
