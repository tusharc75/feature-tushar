import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { cn } from 'src/constants/helpers';
import { HandleSelect } from 'src/pages/TechnicianScheduler/Roadmap';
import Calendar from 'src/pages/TechnicianScheduler/Roadmap/DesktopRoadmap/Calendar';
import MapImpl from 'src/pages/TechnicianScheduler/Roadmap/DesktopRoadmap/MapImpl';
import Sidebar from 'src/pages/TechnicianScheduler/Roadmap/DesktopRoadmap/Sidebar';
import { TActivity } from 'src/pages/TechnicianScheduler/Roadmap/types';

const dayPixel = 75;
const startDate = dayjs('2023-01-01');
const endDate = dayjs('2025-12-31');
const totalDay = endDate.diff(startDate, 'day');

type DesktopRoadmapProps = {
  activity: TActivity[];
  selected: string | null;
  handleSelect: HandleSelect;
  setSelected: React.Dispatch<React.SetStateAction<string>>;
};

const DesktopRoadmap = ({ activity, handleSelect, selected, setSelected }: DesktopRoadmapProps) => {
  const [container, setContainer] = useState<HTMLDivElement>(null);

  return (
    <div
      ref={setContainer}
      className={cn(
        'grid h-[--container-h] grid-cols-[300px_1fr] overflow-auto border  [--container-h:50vh] [--data-h:90px] [--header-h:50px] ',
        selected ? 'overflow-hidden' : 'overflow-auto scroll-smooth'
      )}
    >
      <Sidebar activity={activity} handleSelect={handleSelect} />
      {!selected ? (
        <Calendar
          dayPixel={dayPixel}
          endDate={endDate}
          startDate={startDate}
          activity={activity}
          handleSelect={handleSelect}
          selected={selected}
          totalDay={totalDay}
          container={container}
        />
      ) : (
        <div className="absolute left-[300px] right-0 top-0">
          <MapImpl selected={selected} setSelected={setSelected} />
        </div>
      )}
    </div>
  );
};

export default DesktopRoadmap;
