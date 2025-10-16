import { useState, useEffect } from 'react';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import CustomDatePicker from '../../../../components/CustomDatePicker';
import dayjs from 'dayjs';
import { durationLabelMap } from 'src/pages/ReportBuilder/utils';

interface DateProps {
  filterValue: any;
  setFilterValue: (filterValue: any) => void;
  operation: string;
}

const Date = ({ filterValue, setFilterValue, operation }: DateProps) => {
  const [duration, setDuration] = useState('custom');

  useEffect(() => {
    if (filterValue?.duration) {
      setDuration(filterValue.duration);
    } else {
      setDuration('custom');
    }
  }, [filterValue]);

  const handleDurationChange = (selectedDuration: string) => {
    setDuration(selectedDuration);

    if (selectedDuration === 'custom') {
      setFilterValue({
        duration: 'custom',
        from: filterValue?.from || null,
        to: filterValue?.to || null
      });
      return;
    }

    let fromDate: any = null;
    let toDate: any = null;

    switch (selectedDuration) {
      case '1-week':
        fromDate = dayjs().subtract(1, 'week').startOf('week').toDate();
        toDate = dayjs().subtract(1, 'week').endOf('week').toDate();
        break;
      case '1-month':
        fromDate = dayjs().subtract(1, 'month').toDate();
        toDate = dayjs().toDate();
        break;
      case '3-months':
        fromDate = dayjs().subtract(3, 'month').toDate();
        toDate = dayjs().toDate();
        break;
      case '6-months':
        fromDate = dayjs().subtract(6, 'month').toDate();
        toDate = dayjs().toDate();
        break;
      case '1-year':
        fromDate = dayjs().subtract(1, 'year').toDate();
        toDate = dayjs().toDate();
        break;
      case 'today':
        fromDate = dayjs().startOf('day').toDate();
        toDate = dayjs().endOf('day').toDate();
        break;
      case 'yesterday':
        fromDate = dayjs().subtract(1, 'day').startOf('day').toDate();
        toDate = dayjs().subtract(1, 'day').endOf('day').toDate();
        break;
      case 'current-week':
        fromDate = dayjs().startOf('week').toDate();
        toDate = dayjs().endOf('week').toDate();
        break;
      case 'current-month':
        fromDate = dayjs().startOf('month').toDate();
        toDate = dayjs().endOf('month').toDate();
        break;
      case 'current-year':
        fromDate = dayjs().startOf('year').toDate();
        toDate = dayjs().endOf('year').toDate();
        break;
    }

    setFilterValue({
      duration: selectedDuration,
      from: fromDate,
      to: toDate
    });
  };

  const handleFromDateChange = (date: any) => {
    setFilterValue({
      ...filterValue,
      duration: 'custom',
      from: dayjs(date).toDate()
    });
  };

  const handleToDateChange = (date: any) => {
    setFilterValue({
      ...filterValue,
      duration: 'custom',
      to: dayjs(date).toDate()
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {operation === 'between' && (
        <FormControl fullWidth size="small" variant="outlined">
          <InputLabel>Select Duration</InputLabel>
          <Select size="small" value={duration} onChange={(e) => handleDurationChange(e.target.value)} label="Select Duration">
            {Object.keys(durationLabelMap).map((key) => (
              <MenuItem key={key} value={key}>
                {durationLabelMap[key]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {operation === 'between' ? (
        <>
          <CustomDatePicker
            disabled={duration !== 'custom'}
            fullWidth
            size="small"
            label="From Date"
            value={filterValue?.from || null}
            onChange={handleFromDateChange}
            required={true}
          />
          <CustomDatePicker
            disabled={duration !== 'custom'}
            fullWidth
            size="small"
            label="To Date"
            value={filterValue?.to || null}
            onChange={handleToDateChange}
            required={true}
          />
        </>
      ) : (
        <CustomDatePicker
          fullWidth
          size="small"
          label={`Select Date`}
          value={filterValue || null}
          onChange={(date: any) => setFilterValue(dayjs(date).toDate())}
          required={true}
        />
      )}
    </div>
  );
};

export default Date;
