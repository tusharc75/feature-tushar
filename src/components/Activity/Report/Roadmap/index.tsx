import { Box, Button, ButtonGroup, Typography, useMediaQuery } from '@mui/material';
import { Map } from '@mui/icons-material';
import moment from 'moment';
import PropTypes from 'prop-types';
import React, { memo, useEffect, useState } from 'react';

import axios, { CancelTokenSource } from 'axios';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import Loader from '../../../../components/Loader';
import ActivityList from './ActivityList';
import Calendar from './Calendar';
import CalendarList from './CalendarList';

function Roadmap({ type, filter }) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const scrollDayLinerContainer = React.useRef<HTMLDivElement>(null);
  const dayLiner = React.useRef<HTMLDivElement>(null);
  const isMobileDevices = useMediaQuery('(max-width:768px)');
  const sidebarWidth = isMobileDevices ? 110 : 300;
  const executeScroll = () => {
    const pageElement = dayLiner.current as HTMLDivElement;
    const LeftPos = pageElement?.offsetLeft || 1;
    const centerPos = LeftPos - (scrollDayLinerContainer.current.clientWidth || 1) * 0.5;
    scrollDayLinerContainer.current.scrollLeft = centerPos;
  };

  const [calendarType, setCalendarType] = useState('week');
  const [activity, setActivity] = useState(null);
  const [treeList, setTreeList] = useState(null);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchRoadmap(true, cancelTokenSource);
    return () => cancelTokenSource.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchRoadmap = async (shouldScroll = false, cancelTokenSource?: CancelTokenSource) => {
    axiosInstance()
      .get(`/activity/roadmap?type=${type}&filter=${JSON.stringify(filter)}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data } }) => {
        setActivity(data.activity);
        setTreeList(data.treeList);
        if (shouldScroll) executeScroll();
      })
      .catch((err) => {});
  };

  let height = window.innerHeight - 250;
  let startDate = moment('2023-01-01', 'YYYY-MM-DD');
  let endDate = moment('2025-12-31', 'YYYY-MM-DD');
  let totalDay = endDate.diff(startDate, 'days');

  var dayPixel = 0;
  if (calendarType === 'month') {
    dayPixel = 15;
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
  const [selected, setSelected] = React.useState([]);

  const handleToggle = (event, nodeIds) => {
    setExpanded(nodeIds);
  };

  const handleSelect = (event, nodeIds) => {
    setSelected(nodeIds);
  };

  return activity ? (
    <Box>
      <Box border={1} borderColor="var(--common-border-color)" display="flex" height={height} style={{ position: 'relative' }}>
        <Box display="flex" width="100%" height="100%" style={{ position: 'absolute' }}>
          <Box minWidth={sidebarWidth} border={1} borderColor="var(--common-border-color)" style={{ position: 'relative', overflow: 'hidden' }}>
            <Box height={60} display="flex" style={{ borderBottom: '1px solid var(--common-border-color)' }} className=" sticky top-0 z-[1]">
              <Box className="flex items-center gap-1 p-2 md:gap-2 md:p-4">
                <Map fontSize="small" />
                <Typography variant="body1" display="block" style={isMobileDevices ? { fontSize: 13 } : {}}>
                  Roadmap
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
                  type={type}
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
          <div ref={scrollDayLinerContainer} onScroll={onscroll} className="relative overflow-auto border">
            <Calendar calendarType={calendarType} dayPixel={dayPixel} startDate={startDate} endDate={endDate} />
            <Box width="100%" height="calc(100% - 60px)" className="absolute inset-0 bottom-0 left-0 right-0 top-[60px] z-[1] w-full">
              <Box style={{ position: 'absolute', width: totalDay * dayPixel }}>
                <CalendarList
                  fetchRoadmap={fetchRoadmap}
                  type={type}
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
            <Box width={totalDay * dayPixel} height={'calc(100% - 60px)'} style={{ position: 'sticky', top: 60, bottom: 0 }}>
              <div ref={scrollRef} id={'scrillRef'}>
                <div
                  ref={dayLiner}
                  style={{
                    position: 'absolute',
                    left: (100 * moment().diff(startDate, 'days')) / totalDay + '%',
                    width: dayPixel
                  }}
                  className="h-full"
                >
                  <Box style={{ margin: 'auto' }} width={2} border={2} className="!border-green-500" height={'100%'}></Box>
                </div>
              </div>
            </Box>
          </div>
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

Roadmap.propTypes = {
  type: PropTypes.any,
  filter: PropTypes.any,
  activityId: PropTypes.any
};
export default memo(Roadmap);
