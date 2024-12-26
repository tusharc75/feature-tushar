import { useState, useEffect, useContext } from 'react';
import { Box, Grid, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Line } from 'react-chartjs-2';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import DateFnsUtils from '@date-io/date-fns';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import moment from 'moment';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDatePicker from 'src/components/CustomDatePicker';

const UserSession = ({ id }) => {
  const toastConfig = useContext(CustomToastContext);
  const [timeFrame, setTimeFrame] = useState<any>('1-year');
  const [trackingTime, setTrackingTime] = useState({
    between: {
      from: new Date(moment().subtract(1, 'year').calendar()),
      to: new Date()
    }
  });
  const [userTrackingData, setUserTrackingData] = useState({
    labels: [],
    datasets: []
  });
  const [userTrackingDataLoading, setUserTrackingDataLoading] = useState(true);

  useEffect(() => {
    userTimeTracker();
  }, [trackingTime]);

  useEffect(() => {
    switch (timeFrame) {
      case '1-month':
        setTrackingTime({
          between: {
            from: new Date(moment().subtract('1', 'month').calendar()),
            to: new Date()
          }
        });
        break;

      case '3-months':
        setTrackingTime({
          between: {
            from: new Date(moment().subtract('3', 'months').calendar()),
            to: new Date()
          }
        });
        break;

      case '6-months':
        setTrackingTime({
          between: {
            from: new Date(moment().subtract('6', 'months').calendar()),
            to: new Date()
          }
        });
        break;

      case '1-year':
        setTrackingTime({
          between: {
            from: new Date(moment().subtract('1', 'year').calendar()),
            to: new Date()
          }
        });
        break;
      default:
        break;
    }
  }, [timeFrame]);

  const convertDate = (str) => {
    let date = new Date(str),
      month = ('0' + (date.getMonth() + 1)).slice(-2),
      day = ('0' + date.getDate()).slice(-2);
    return [month, day, date.getFullYear()].join('-');
  };

  const userTimeTracker = async () => {
    setUserTrackingDataLoading(true);
    const parsedFromTime = convertDate(trackingTime.between.from);
    const parsedToTime = convertDate(trackingTime.between.to);
    const { from, to } = trackingTime.between;

    const hour = 1000 * 60 * 60;
    const day = 1000 * 60 * 60 * 24;
    // const month = 1000 * 60 * 60 * 24 * 30
    // const year = 1000 * 60 * 60 * 24 * 30 * 12
    const dateDiff = moment(to).diff(from, 'days');
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
          labels.push(moment(obj?.date).format('DD/MMM'));
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
      <Box
        width="100%"
        padding={1}
        bgcolor="var(--dark-secondary, var(--accordion-expanded-summary-bg, #EFFBF9))"
        display="flex"
        justifyContent="space-between"
      >
        <Grid container>
          <Grid item xs={8}>
            <Box display="flex">
              <Box padding="5px">
                <Typography variant="subtitle2">User Time Track</Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>
      <Box padding="10px">
        <Grid item xs={12} sm={12} md={12}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small" variant="outlined">
                <InputLabel id="duration">Select Duration</InputLabel>
                <Select
                  labelId="duration"
                  id="time-duration"
                  value={timeFrame}
                  onChange={(e) => setTimeFrame(e.target.value)}
                  label="Select Duration"
                  size="small"
                >
                  <MenuItem value={'1-year'}>Last 1 Year</MenuItem>
                  <MenuItem value={'6-months'}>Last 6 Months</MenuItem>
                  <MenuItem value={'3-months'}>Last 3 Months</MenuItem>
                  <MenuItem value={'1-month'}>Last 1 Month</MenuItem>
                  <MenuItem value={'custom'}>Custom</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={4}>
              <CustomDatePicker
                disabled={timeFrame !== 'custom'}
                fullWidth
                size="small"
                openTo="year"
                maxDate={trackingTime.between.to}
                label="From"
                views={['year', 'month', 'date']}
                value={trackingTime.between.from}
                onChange={(date) => {
                  setTrackingTime({ between: { from: date, to: trackingTime.between.to } });
                }}
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <CustomDatePicker
                disabled={timeFrame !== 'custom'}
                fullWidth
                size="small"
                minDate={trackingTime.between.from}
                openTo="year"
                label="To"
                views={['year', 'month', 'date']}
                value={trackingTime.between.to}
                onChange={(date) => {
                  setTrackingTime({ between: { to: date, from: trackingTime.between.from } });
                }}
              />
            </Grid>
          </Grid>
        </Grid>
      </Box>
      <Typography className="subtitle1 m-2">
        {userTrackingDataLoading ? (
          <Grid container spacing={2} style={{ padding: '8px' }}>
            <CommonSkeleton lenArray={[...Array(7).keys()]} />
          </Grid>
        ) : userTrackingData.labels.length === 0 ? (
          <h3>No activity found in the selected date range</h3>
        ) : (
          <Line type="line" data={userTrackingData} />
        )}
      </Typography>
    </>
  );
};

export default UserSession;
