import React, { memo, useEffect, useState } from 'react';
import { Typography, Box, Button, ButtonGroup, IconButton, Dialog, DialogTitle } from '@material-ui/core';
import { Close, Map } from '@material-ui/icons';
import moment from 'moment';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import ActivityList from './ActivityList';
import Calendar from './Calendar';
import CalendarList from './CalendarList';
import MapView from '../Map';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

function Roadmap({ filter, selectedRecords, refresh, handleAssignTechnician }) {

  const scrollRef = React.useRef(null);
  const executeScroll = () => {
    var pageElement = document.getElementById('dayLiner');
    var LeftPos = pageElement.offsetLeft;
    document.getElementById('scrollDayLiner').scrollLeft = LeftPos - 200;
  };

  const [calendarType, setCalendarType] = useState('week');
  const [activity, setActivity] = useState([]);
  const [treeList, setTreeList] = useState([]);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  
 
  useEffect(() => {
    filter.view === 'Technician View' && fetchRoadmap();
  }, [filter.view, refresh]);

  useEffect(() => {
    filter.serviceOrder !== '' && fetchServiceOrders(filter.serviceOrder);
  }, [filter.serviceOrder]);

  const fetchServiceOrders = async (orderId) => {
    setLoadingRoadmap(true);
    await axiosInstance()
      .get(`/technician-scheduler/service-order?serviceOrders=${orderId}`)
      .then(({ data }) => {
        setActivity(data?.data);
        
        setTreeList(data?.data);
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
        executeScroll();
      })
      .catch((err) => {
        setLoadingRoadmap(false);
      });
  };


  let height = window.innerHeight / 2;
  const today = new Date();
  let startDate = moment('2021-01-01');
  let endDate = moment('2023-12-31');
  let totalDay = endDate.diff(startDate, 'days');

  var dayPixel = 0;
  if (calendarType === 'month') {
    dayPixel = 8.5;
  } else if (calendarType === 'week') {
    dayPixel = 35;
  } else {
    dayPixel = 3;
  }

  const handelChangeCalendarType = async (type) => {
    setCalendarType(type);
    setTimeout(() => executeScroll(), 500);
  };

  const taskScroolRef = React.useRef(null);
  const onscroll = (event) => {
    var target = event.nativeEvent.target;
    taskScroolRef.current.scrollTop = target.scrollTop;
  };

  const [expanded, setExpanded] = React.useState([]);
  const [selected, setSelected] = React.useState(null);

  const handleToggle = (event, nodeIds) => {
    setExpanded(nodeIds);
  };

  const handleSelect = (event, data, type) => {
    if (type === "map") {
      setSelected(data?._id);
    }
    else if (selectedRecords?.length === 1) {
      handleAssignTechnician(data)
    }
  };

  return !loadingRoadmap ? (
    <Box bgcolor="white">
      <Box border={1} borderColor="grey.300" display="flex" height={height} style={{ position: 'relative' }}>
        <Box display="flex" width="100%" height="100%" style={{ position: 'absolute' }}>
          <Box minWidth={isMobile && !isTablet ? 110 : 300} border={1} borderColor="grey.300" style={{ position: 'relative', overflow: 'hidden' }}>
            <Box height={60} bgcolor="grey.200" display="flex" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <Box p={2} display="flex" alignItems="center">
                <Map />
                <Box mr={1} />
                <Typography variant="body1" display="block">
                  Technician
                </Typography>
              </Box>
            </Box>
            <div
              ref={taskScroolRef}
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                overflow: 'hidden'
              }}
            >
              <Box>
                <ActivityList
                  fetchRoadmap={fetchRoadmap}
                  activity={selectedRecords?.length === 1? activity.filter((item)=>{
                    return selectedRecords[0]?.competency.includes(item?.competency[0]?.optionLabel)
                  }):activity}
                  treeList={treeList}
                  expanded={expanded}
                  selected={selected}
                  handleToggle={handleToggle}
                  handleSelect={handleSelect}
                />
                <Box height={70}></Box>
              </Box>
            </div>
          </Box>
          {!selected ? (
            <Box id="scrollDayLiner" onScroll={onscroll} border={1} borderColor="grey.300" style={{ position: 'relative', overflow: 'auto' }}>
              <Calendar calendarType={calendarType} dayPixel={dayPixel} startDate={startDate} endDate={endDate} />
              <Box width="100%" height="100%" style={{ position: 'absolute', zIndex: 1 }}>
                <Box style={{ position: 'absolute', width: totalDay * dayPixel }}>
                  <CalendarList
                    fetchRoadmap={fetchRoadmap}
                    activity={selectedRecords?.length === 1? activity.filter((item)=>{
                      return selectedRecords[0]?.competency.includes(item?.competency[0]?.optionLabel)
                    }):activity}
                    expanded={expanded}
                    selected={selected}
                    handleSelect={handleSelect}
                    startDate={startDate}
                    endDate={endDate}
                    totalDay={totalDay}
                    calendarType={calendarType}
                  />
                </Box>
              </Box>
              <Box width={totalDay * dayPixel} height={'100%'} style={{ position: 'sticky', top: 0, bottom: 0 }}>
                <div ref={scrollRef}>
                  <Box
                    id="dayLiner"
                    height={'100%'}
                    style={{
                      position: 'absolute',
                      left: (100 * moment().diff(startDate, 'days')) / totalDay + '%',
                      width: dayPixel
                    }}
                  >
                    <Box style={{ margin: 'auto' }} width={2} border={2} borderColor="secondary.main" height={'100%'}></Box>
                  </Box>
                </div>
              </Box>
            </Box>
          ) : (
            <Box border={1} width={'100%'} height={'100%'} borderColor="grey.300" style={{ position: 'relative', overflow: 'auto' }}>
              <MapView technician={selected} />
              <IconButton
                onClick={() => {
                  setSelected(null);
                  setTimeout(() => executeScroll(), 500);
                }}
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  zIndex: 1
                }}
              >
                <Close />
              </IconButton>
            </Box>
          )}
        </Box>
      </Box>
      {/* {!selected &&
        <Box display="flex" justifyContent="flex-end" className="mt-2">
          <ButtonGroup disableElevation color="primary">
            <Button size="small" variant={calendarType === 'week' ? 'contained' : 'outlined'} onClick={() => handelChangeCalendarType('week')}>
              Weeks
            </Button>
            <Button size="small" variant={calendarType === 'month' ? 'contained' : 'outlined'} onClick={() => handelChangeCalendarType('month')}>
              Months
            </Button>
            <Button size="small" variant={calendarType === 'quater' ? 'contained' : 'outlined'} onClick={() => handelChangeCalendarType('quater')}>
              Quaters
            </Button>
          </ButtonGroup>
        </Box>} */}
    </Box>
  ) : (
    <Box p={2} height={height} bgcolor="white">
      <CommonSkeleton lenArray={[...Array(10).keys()]} />
    </Box>
  );
}

export default Roadmap;
