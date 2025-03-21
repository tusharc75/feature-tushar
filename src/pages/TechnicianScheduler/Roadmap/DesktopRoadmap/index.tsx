import dayjs from 'dayjs';
import { memo, useState } from 'react';
import { cn } from 'src/constants/helpers';
import { HandleSelect } from 'src/pages/TechnicianScheduler/Roadmap';
import Calendar from 'src/pages/TechnicianScheduler/Roadmap/DesktopRoadmap/Calendar';
import LeftSidebar from 'src/pages/TechnicianScheduler/Roadmap/DesktopRoadmap/LeftSidebar';
import MapImpl from 'src/pages/TechnicianScheduler/Roadmap/DesktopRoadmap/MapImpl';
import Sidebar from 'src/pages/TechnicianScheduler/Roadmap/DesktopRoadmap/Sidebar';
import { TActivity } from 'src/pages/TechnicianScheduler/Roadmap/types';

const dayPixel = 75;
const startDate = dayjs('2023-01-01');
const endDate = dayjs('2025-12-31');
const totalDay = endDate.diff(startDate, 'day');

type DesktopRoadmapProps = {
  activity: TActivity[] | null;
  selected: string | null;
  handleSelect: HandleSelect;
  setSelected: React.Dispatch<React.SetStateAction<string>>;
  leftSidebar?: React.ReactNode;
  leftSidebarTitle?: React.ReactNode;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isSidebarOpen: boolean;
  loading: boolean;
};

const DesktopRoadmapImpl = ({
  activity,
  handleSelect,
  selected,
  setSelected,
  leftSidebar = null,
  leftSidebarTitle = null,
  isSidebarOpen,
  setIsSidebarOpen,
  loading
}: DesktopRoadmapProps) => {
  const [container, setContainer] = useState<HTMLDivElement>(null);

  return (
    <div
      ref={setContainer}
      className={cn(
        'grid h-[--container-h] grid-cols-[auto_1fr_300px] overflow-auto border  [--container-h:calc(100vh-200px)] [--data-h:90px] [--header-h:50px] ',
        selected ? 'overflow-hidden' : 'overflow-auto scroll-smooth'
      )}
    >
      {leftSidebar ? (
        <LeftSidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} title={leftSidebarTitle}>
          {leftSidebar}
        </LeftSidebar>
      ) : null}
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
        <div className="">
          <MapImpl selected={selected} setSelected={setSelected} />
        </div>
      )}
      <Sidebar activity={activity} loading={loading} handleSelect={handleSelect} />
    </div>
  );
};

const DesktopRoadmap = memo(DesktopRoadmapImpl) as typeof DesktopRoadmapImpl;

export default DesktopRoadmap;
