import { AccessTime } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { WORKORDER_SERVICE_STEP_STATUS, convertMsToTime } from 'src/constants/helpers';

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

const RenderTotalTime = ({ stepTimes }: any) => {
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
    <div className="flex flex-wrap items-center font-medium text-[14px] leading-[10px] text-[#8B8B8B]">
      <AccessTime style={{ marginRight: '3px', color: 'gray', fontSize: '1rem' }} />({time})
    </div>
  );
};

export default RenderTotalTime;
