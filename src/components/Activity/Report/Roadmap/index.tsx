import { Box, Button, ButtonGroup, Typography } from '@material-ui/core';
import { Map } from '@material-ui/icons';
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
  const scrollRef = React.useRef(null);
  const executeScroll = () => {
    var pageElement = document.getElementById('dayLiner');
    var LeftPos = pageElement.offsetLeft;
    document.getElementById('scrollDayLiner').scrollLeft = LeftPos - 200;
    // if (scrollRef.current) {
    //     scrollRef.current.scrollIntoView({ inline: "center" })
    // }
  };

  const [calendarType, setCalendarType] = useState('week');
  const [activity, setActivity] = useState(null);
  const [treeList, setTreeList] = useState(null);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchRoadmap(cancelTokenSource);
    return () => cancelTokenSource.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchRoadmap = async (cancelTokenSource?: CancelTokenSource) => {
    axiosInstance()
      .get(`/activity/roadmap?type=${type}&filter=${JSON.stringify(filter)}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data } }) => {
        setActivity(data.activity);
        setTreeList(data.treeList);
        executeScroll();
      })
      .catch((err) => {});
  };

  let height = window.innerHeight - 250;
  let startDate = moment('2023-01-01', 'YYYY-MM-DD');
  let endDate = moment('2025-12-31', 'YYYY-MM-DD');
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
          <Box
            minWidth={isMobile && !isTablet ? 110 : 300}
            border={1}
            borderColor="var(--common-border-color)"
            style={{ position: 'relative', overflow: 'hidden' }}
          >
            <Box height={60} display="flex" style={{ borderBottom: '1px solid var(--common-border-color)' }} className=" sticky top-0 z-[1]">
              <Box p={2} display="flex" alignItems="center">
                <Map />
                <Box mr={1} />
                <Typography variant="body1" display="block">
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
          <Box id="scrollDayLiner" onScroll={onscroll} border={1} borderColor="var(--common-border-color)" className="relative overflow-auto">
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
                  <Box style={{ margin: 'auto' }} width={2} border={2} className="!border-green-500" height={'100%'}></Box>
                </Box>
              </div>
            </Box>
          </Box>
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
