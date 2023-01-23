import React, { memo, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Typography, Box, Button, ButtonGroup, IconButton } from '@material-ui/core';
import { Close, Map } from '@material-ui/icons';
import moment from 'moment';
import { isMobile, isTablet } from 'react-device-detect';
import Loader from 'src/components/Loader';
import axiosInstance from 'src/axios/axiosInstance';
import ActivityList from './ActivityList';
import Calander from './Calander';
import CalanderList from './CalanderList';
import MapView from '../Map';

function Roadmap({ filter }) {
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
  }, [filter.view]);

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
      .then(({ data }) => {
        setActivity(data?.data);
        setTreeList(data?.data);
        setLoadingRoadmap(false);
        executeScroll();
      })
      .catch((err) => {
        setLoadingRoadmap(false);
      });
  };

  let height = window.innerHeight - 220;
  const today = new Date();
  let startDate = moment(today).subtract(365, 'days');
  let endDate = moment(today).add(365, 'days');
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

  const handleSelect = (event, nodeIds) => {
    setSelected(nodeIds);
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
                  activity={activity}
                  treeList={treeList}
                  expanded={expanded}
                  selected={selected}
                  handleToggle={handleToggle}
                  handleSelect={handleSelect}
                />
                <Box height={20}></Box>
              </Box>
            </div>
          </Box>
          {!selected ? (
            <Box id="scrollDayLiner" onScroll={onscroll} border={1} borderColor="grey.300" style={{ position: 'relative', overflow: 'auto' }}>
              <Calander calendarType={calendarType} dayPixel={dayPixel} startDate={startDate} endDate={endDate} />
              <Box width="100%" height="100%" style={{ position: 'absolute', zIndex: 1 }}>
                <Box style={{ position: 'absolute', width: totalDay * dayPixel }}>
                  <CalanderList
                    fetchRoadmap={fetchRoadmap}
                    activity={activity}
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
              <MapView technician={selected} onClose={() => setSelected(null)} />
              <IconButton
                onClick={() => setSelected(null)}
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
      </Box>
    </Box>
  ) : (
    <Loader text="" />
  );
}

export default Roadmap;
