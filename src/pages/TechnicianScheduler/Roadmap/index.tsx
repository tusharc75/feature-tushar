import { Box, useMediaQuery } from '@mui/material';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import DesktopRoadmap from 'src/pages/TechnicianScheduler/Roadmap/DesktopRoadmap';
import { TActivity } from 'src/pages/TechnicianScheduler/Roadmap/types';
import MobileRoadmap from './MobileRoadmap';

const dayPixel = 35;
const height = window.innerHeight / 2;
const startDate = dayjs('2023-01-01');
const endDate = dayjs('2025-12-31');
const totalDay = endDate.diff(startDate, 'day');

export type HandleSelect = (event: React.SyntheticEvent, data: TActivity, type: 'technician' | 'map' | '') => void;

function Roadmap({ filter, selectedRecords, refresh, handleAssignTechnician, handleUnAssignTechnician }) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [activity, setActivity] = useState([]);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  const [expanded, setExpanded] = React.useState([]);
  const [selected, setSelected] = React.useState<string | null>(null);

  useEffect(() => {
    filter.view === 'Technician View' && fetchRoadmap();
  }, [filter.view, refresh]);

  useEffect(() => {
    filter.fieldTicket !== '' && fetchServiceOrders(filter.fieldTicket);
  }, [filter.fieldTicket]);

  const fetchServiceOrders = async (orderId) => {
    setLoadingRoadmap(true);
    await axiosInstance()
      .get(`/technician-scheduler/service-order?serviceOrders=${orderId}`)
      .then(({ data }) => {
        setActivity(data?.data);
        setLoadingRoadmap(false);
      })
      .catch((err) => {
        setLoadingRoadmap(false);
      });
  };

  const fetchRoadmap = async () => {
    setLoadingRoadmap(true);
    await axiosInstance()
      .get(`/technician-scheduler/get-schedule`)
      .then(({ data: { data } }) => {
        setActivity(data);
        setLoadingRoadmap(false);
      })
      .catch((err) => {
        setLoadingRoadmap(false);
      });
  };

  const handleToggle = (event, nodeIds) => {
    setExpanded(nodeIds);
  };

  const handleSelect = (event, data, type) => {
    if (type === 'map') {
      setSelected(data?._id);
    } else if (selectedRecords?.length === 1) {
      handleAssignTechnician(data);
    } else if (selectedRecords?.length === 0) {
      handleUnAssignTechnician(data);
    }
  };

  if (loadingRoadmap) {
    return (
      <Box p={2} height={height}>
        <CommonSkeleton lenArray={[...Array(10).keys()]} />
      </Box>
    );
  }

  return (
    <Box bgcolor="var(--dark-secondary, white)">
      {isMobile ? (
        <MobileRoadmap
          activity={
            selectedRecords?.length === 1
              ? activity.filter(
                  (item) => !selectedRecords[0]?.competencyType || selectedRecords[0]?.competencyType === item?.competencyType?.optionLabel
                )
              : activity
          }
          expanded={expanded}
          selected={selected}
          handleToggle={handleToggle}
          handleSelect={handleSelect}
          setSelected={setSelected}
        />
      ) : (
        <DesktopRoadmap activity={activity} handleSelect={handleSelect} selected={selected} setSelected={setSelected} />
      )}
    </Box>
  );
}

export default Roadmap;
