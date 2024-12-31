import React from 'react';
import { Grid, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import CustomDatePicker from 'src/components/CustomDatePicker';
import dayjs from 'dayjs';

const DurationFilter = ({ label, duration, setDuration, defaultTimeFrame, showAll = false }) => {
  const [timeFrame, setTimeFrame] = React.useState<any>(defaultTimeFrame);

  React.useEffect(() => {
    switch (timeFrame) {
      case '1-month':
        setDuration({
          from: new Date(dayjs().subtract(1, 'month').toDate()),
          to: new Date()
        });
        break;
      case '3-months':
        setDuration({
          from: new Date(dayjs().subtract(3, 'month').toDate()),
          to: new Date()
        });
        break;
      case '6-months':
        setDuration({
          from: new Date(dayjs().subtract(6, 'month').toDate()),
          to: new Date()
        });
        break;
      case '1-year':
        setDuration({
          from: new Date(dayjs().subtract(1, 'year').toDate()),
          to: new Date()
        });
        break;
      case 'current-year':
        setDuration({
          from: new Date(dayjs().startOf('year').toDate()),
          to: new Date(dayjs().endOf('year').toDate())
        });
        break;
      case 'all':
        setDuration({
          from: null,
          to: null
        });
        break;
      default:
        break;
    }
  }, [timeFrame]);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={12} md={4}>
        <FormControl style={{ minWidth: '200px' }} fullWidth size="small" variant="outlined">
          <InputLabel id="duration">Select Duration</InputLabel>
          <Select
            size="small"
            labelId="duration"
            id="time-duration"
            value={timeFrame}
            onChange={(e) => setTimeFrame(e.target.value)}
            label="Select Duration"
          >
            {showAll && <MenuItem value={'all'}>All</MenuItem>}
            <MenuItem value={'1-year'}>Last 1 Year</MenuItem>
            <MenuItem value={'6-months'}>Last 6 Months</MenuItem>
            <MenuItem value={'3-months'}>Last 3 Months</MenuItem>
            <MenuItem value={'1-month'}>Last 1 Month</MenuItem>
            <MenuItem value={'current-year'}>Current Year</MenuItem>
            <MenuItem value={'custom'}>Custom</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        {timeFrame !== 'all' && (
          <CustomDatePicker
            disabled={timeFrame !== 'custom'}
            fullWidth
            size="small"
            maxDate={duration.to}
            label={`From ${label}`}
            value={duration.from}
            onChange={(date) => {
              setDuration({ ...duration, from: date });
            }}
          />
        )}
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        {timeFrame !== 'all' && (
          <CustomDatePicker
            disabled={timeFrame !== 'custom'}
            fullWidth
            size="small"
            minDate={duration.from}
            label={`To ${label}`}
            value={duration.to}
            onChange={(date) => {
              setDuration({ ...duration, to: date });
            }}
          />
        )}
      </Grid>
    </Grid>
  );
};

export default DurationFilter;
