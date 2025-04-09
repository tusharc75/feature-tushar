import dayjs from 'dayjs';
import { memo, useMemo, useState } from 'react';
import { cn } from 'src/constants/helpers';
import { useTechnicianContext } from 'src/pages/TechnicianScheduler/Context';
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
  selected: string[] | [];
  handleSelect: HandleSelect;
  setSelected: React.Dispatch<React.SetStateAction<string[]>>;
  leftSidebar?: (isMobile: boolean) => React.ReactNode;
  selectedResource?: any | null;
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
  selectedResource = null,
  isSidebarOpen,
  setIsSidebarOpen,
  loading
}: DesktopRoadmapProps) => {
  const { technicianSearchValue } = useTechnicianContext();
  const filteredActivity = useMemo(() => {
    const searchFor = (technicianSearchValue || '').trim().toLowerCase();
    if (searchFor) {
      const data = activity.filter((d) => `${d.firstName} ${d.lastName} ${d.employeeNumber}`.toLowerCase().includes(searchFor)) || [];
      return data;
    }
    return activity;
  }, [activity, technicianSearchValue]);

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
        <LeftSidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} title={selectedResource?.title}>
          {leftSidebar(false)}
        </LeftSidebar>
      ) : null}
      {!selected?.length ? (
        <Calendar
          dayPixel={dayPixel}
          endDate={endDate}
          startDate={startDate}
          activity={filteredActivity}
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
      <Sidebar selectedResource={selectedResource} activity={filteredActivity} loading={loading} handleSelect={handleSelect} />
    </div>
  );
};

const DesktopRoadmap = memo(DesktopRoadmapImpl) as typeof DesktopRoadmapImpl;

export default DesktopRoadmap;
