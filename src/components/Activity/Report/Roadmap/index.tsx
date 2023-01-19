import React, { memo, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Typography, Box, Button, ButtonGroup } from '@material-ui/core';
import { Map } from '@material-ui/icons';
import moment from 'moment';

import { GetRoadmap } from '../../../../axios/activity';

import Calander from './Calander';
import ActivityList from './ActivityList';
import CalanderList from './CalanderList';
import Loader from '../../../../components/Loader';
import { isMobile, isTablet } from 'react-device-detect';

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
    fetchRoadmap();
  }, [filter]);

  const fetchRoadmap = async () => {
    await GetRoadmap(type, JSON.stringify(filter))
      .then(({ data }) => {
        setActivity(data.activity);
        setTreeList(data.treeList);
        executeScroll();
      })
      .catch((err) => {});
  };

  let height = window.innerHeight - 250;
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
  const [selected, setSelected] = React.useState([]);

  const handleToggle = (event, nodeIds) => {
    setExpanded(nodeIds);
  };

  const handleSelect = (event, nodeIds) => {
    setSelected(nodeIds);
  };

  return activity ? (
    <Box bgcolor="white">
      <Box border={1} borderColor="grey.300" display="flex" height={height} style={{ position: 'relative' }}>
        <Box display="flex" width="100%" height="100%" style={{ position: 'absolute' }}>
          <Box minWidth={isMobile && !isTablet ? 110 : 300} border={1} borderColor="grey.300" style={{ position: 'relative', overflow: 'hidden' }}>
            <Box height={60} bgcolor="grey.200" display="flex" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
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
          <Box id="scrollDayLiner" onScroll={onscroll} border={1} borderColor="grey.300" style={{ position: 'relative', overflow: 'auto' }}>
            <Calander calendarType={calendarType} dayPixel={dayPixel} startDate={startDate} endDate={endDate} />

            <Box width="100%" height="100%" style={{ position: 'absolute', zIndex: 1 }}>
              <Box style={{ position: 'absolute', width: totalDay * dayPixel }}>
                <CalanderList
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
