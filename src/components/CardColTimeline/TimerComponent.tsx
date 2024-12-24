import { Box } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { WORKORDER_SERVICE_STEP_STATUS, convertMsToTime } from 'src/constants/helpers';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import styles from './index.module.scss';

export const getFieldsWithOtherDetails = (steps: any) => {
  const stepTimes = [];
  steps.forEach((item) => {
    let obj: any = {};
    obj.startDate = item?.startDate;
    obj.endDate = item?.endDate;
    obj.pauseDate = item?.pauseDate;
    obj.duration = item?.duration || 0;
    obj.status = item?.status;
    stepTimes.push(obj);
  });
  return stepTimes;
};

export const getTotalTime = (stepTimes: any) => {
  let totalTimes = 0;
  let shouldTimerRun = stepTimes?.filter((e) => e.status === WORKORDER_SERVICE_STEP_STATUS.start)?.length ? true : false;
  stepTimes.forEach((item) => {
    totalTimes += item?.duration || 0;
    if (item.startDate && item.status === WORKORDER_SERVICE_STEP_STATUS.start) {
      totalTimes += new Date().getTime() - new Date(item?.pauseDate || item?.startDate).getTime();
    }
  });
  stepTimes.forEach((item) => {});
  return { shouldTimerRun, totalTimes };
};

const TimerComponent = ({ stepTimes }: any) => {
  const [time, setTime] = useState(null);
  useEffect(() => {
    const { shouldTimerRun, totalTimes } = getTotalTime(stepTimes);
    let interval;
    if (shouldTimerRun) {
      let currentDifference = totalTimes;
      interval = setInterval(() => {
        currentDifference += 1000;
        setTime(convertMsToTime(currentDifference));
      }, 1000);
    } else {
      setTime(convertMsToTime(totalTimes));
    }
    return () => {
      clearInterval(interval);
    };
  }, [stepTimes]);

  if (stepTimes.length === 0) return <></>;
  return (
    <Box className={styles.timer}>
      <AccessTimeIcon />({time})
    </Box>
  );
};

export default TimerComponent;
