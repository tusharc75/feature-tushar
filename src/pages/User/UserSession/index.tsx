import { useState, useEffect, useContext } from 'react';
import { Box, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Line } from 'react-chartjs-2';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import axiosInstance from 'src/axios/axiosInstance';
import dayjs from 'dayjs';
import DurationFilter from 'src/components/DurationFilter';

const UserSession = ({ id }) => {
  const toastConfig = useContext(CustomToastContext);
  const [trackingTime, setTrackingTime] = useState({
    from: new Date(dayjs().subtract(1, 'year').toDate()),
    to: new Date()
  });
  const [userTrackingData, setUserTrackingData] = useState({
    labels: [],
    datasets: []
  });
  const [userTrackingDataLoading, setUserTrackingDataLoading] = useState(true);

  useEffect(() => {
    userTimeTracker();
  }, [trackingTime]);

  const convertDate = (str) => {
    let date = new Date(str),
      month = ('0' + (date.getMonth() + 1)).slice(-2),
      day = ('0' + date.getDate()).slice(-2);
    return [month, day, date.getFullYear()].join('-');
  };

  const userTimeTracker = async () => {
    setUserTrackingDataLoading(true);
    const parsedFromTime = convertDate(trackingTime.from);
    const parsedToTime = convertDate(trackingTime.to);
    const { from, to } = trackingTime;

    const hour = 1000 * 60 * 60;
    const day = 1000 * 60 * 60 * 24;
    // const month = 1000 * 60 * 60 * 24 * 30
    // const year = 1000 * 60 * 60 * 24 * 30 * 12
    const dateDiff = dayjs(to).diff(dayjs(from), 'day');
    const time = dateDiff > 90 ? day : hour;
    axiosInstance()
      .get(`/user-activity/${id}/${parsedFromTime}/${parsedToTime}`)
      .then(({ data: { data } }) => {
        const labels = [];
        const dataSets = [];

        data = data.sort((a, b) => {
          const aDate = new Date(a.date).getTime();
          const bDate = new Date(b.date).getTime();

          return aDate - bDate;
        });

        data.forEach((obj) => {
          labels.push(dayjs(obj?.date).tz().format('DD/MMM'));
          dataSets.push(obj?.totalDuration / time);
        });
        setUserTrackingData({
          labels: labels,
          datasets: [
            {
              label: `Total Duration (${dateDiff > 90 ? 'In Days' : 'In Hours'})`,
              data: dataSets,
              borderColor: 'rgba(75,192,192,1)'
            }
          ]
        });
        setUserTrackingDataLoading(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };
  return (
    <>
      <div className="relative flex justify-between rounded-t bg-[var(--dark-secondary,var(--accordion-expanded-summary-bg,#EFFBF9))] px-7 py-4">
        <h6 className="text-sm font-semibold leading-[1.05] ">User Time Track</h6>
      </div>
      <div className="rounded-b border p-[20px_28px_32px]">
        <DurationFilter label={''} defaultTimeFrame="1-year" duration={trackingTime} setDuration={setTrackingTime} showAll={true} />
        <Typography className="subtitle1 m-2">
          {userTrackingDataLoading ? (
            <div className="p-2">
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </div>
          ) : userTrackingData.labels.length === 0 ? (
            <h3>No activity found in the selected date range</h3>
          ) : (
            <Line type="line" data={userTrackingData} />
          )}
        </Typography>
      </div>
    </>
  );
};

export default UserSession;
