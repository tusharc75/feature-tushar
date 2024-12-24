import Box from '@mui/material/Box';
import axios, { CancelTokenSource } from 'axios';
import { useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import Loader from '../../../../components/Loader';
import BigCalendar from './BigCalendar';

export default function Calender({ type, filter, activityId }) {
  const [activity, setActivity] = useState(null);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchBoard(cancelTokenSource);
    return () => cancelTokenSource.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, activityId]);

  const fetchBoard = async (cancelTokenSource?: CancelTokenSource) => {
    axiosInstance()
      .get(`/activity/board?type=${type}&filter=${JSON.stringify(filter)}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data } }) => {
        setActivity(data);
      })
      .catch((err) => {});
  };

  return activity ? (
    <Box>
      <BigCalendar activity={activity} type={type} />
    </Box>
  ) : (
    <Loader text="" />
  );
}
