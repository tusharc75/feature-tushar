import { Box, IconButton, useMediaQuery } from '@mui/material';
import React, { memo, useEffect, useState } from 'react';
import { FiSidebar } from 'react-icons/fi';
import axiosInstance from 'src/axios/axiosInstance';
import DesktopRoadmap from 'src/pages/TechnicianScheduler/Roadmap/DesktopRoadmap';
import { TActivity } from 'src/pages/TechnicianScheduler/Roadmap/types';
import MobileRoadmap from './MobileRoadmap';

export type HandleSelect = (event: React.SyntheticEvent, data: TActivity, type: 'technician' | 'map' | '') => void;

function Roadmap({ filter, selectedRecords, handleUnAssignTechnician, leftSidebar = null, leftSidebarTitle = '', headerSlot = null, refresh }) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [activity, setActivity] = useState(null);
  const [expanded, setExpanded] = React.useState([]);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    filter.view === 'Technician View' && fetchRoadmap();
  }, [filter.view, refresh]);

  useEffect(() => {
    filter.fieldTicket !== '' && fetchServiceOrders(filter.fieldTicket);
  }, [filter.fieldTicket]);

  const fetchServiceOrders = async (orderId) => {
    await axiosInstance()
      .get(`/technician-scheduler/service-order?serviceOrders=${orderId}`)
      .then(({ data }) => {
        setActivity(data?.data);
      });
  };

  const fetchRoadmap = async () => {
    await axiosInstance()
      .get(`/technician-scheduler/get-schedule`)
      .then(({ data: { data } }) => {
        setActivity(data);
      });
  };

  const handleToggle = (event, nodeIds) => {
    setExpanded(nodeIds);
  };

  const handleSelect = (event, data, type) => {
    if (type === 'map') {
      setSelected(data?._id);
    } else if (selectedRecords?.length === 0 && data?.technicianHistoryId) {
      handleUnAssignTechnician(data);
    }
  };

  return (
    <>
      {headerSlot && (
        <div className="mb-4 flex items-center gap-2">
          <ToggleSidebar leftSidebar={leftSidebar} setIsSidebarOpen={setIsSidebarOpen} />
          {headerSlot}
        </div>
      )}
      <Box bgcolor="var(--dark-secondary, white)">
        {isMobile ? (
          <MobileRoadmap
            activity={activity}
            expanded={expanded}
            leftSidebar={leftSidebar}
            selected={selected}
            handleToggle={handleToggle}
            handleSelect={handleSelect}
            setSelected={setSelected}
            loading={!activity}
          />
        ) : (
          <DesktopRoadmap
            loading={!activity}
            leftSidebarTitle={leftSidebarTitle}
            activity={activity}
            leftSidebar={leftSidebar}
            handleSelect={handleSelect}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            selected={selected}
            setSelected={setSelected}
          />
        )}
      </Box>
    </>
  );
}

export default Roadmap;

const ToggleSidebar = memo(
  ({ leftSidebar, setIsSidebarOpen }: { leftSidebar: React.ReactNode; setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>> }) => {
    if (!leftSidebar) return null;
    return (
      <IconButton size="small" onClick={() => setIsSidebarOpen((prev) => !prev)}>
        <FiSidebar />
      </IconButton>
    );
  }
);
