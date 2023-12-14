import DateFnsUtils from '@date-io/date-fns';
import { Box, TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { KeyboardDateTimePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import { INTERVALS, dateFormatForInputControl } from '../../../constants/helpers';
import { useEffect, useState } from 'react';

export default function FilterModel({ dateFilters, setDateFilters }) {
  const [intervals, setIntervals] = useState(INTERVALS);

  useEffect(() => {
    const difference = (dateFilters?.to?.getTime() - dateFilters?.from?.getTime()) / (1000 * 60 * 60);
    let optionValue = '';
    const interval = intervals?.map((d) => {
      let disabled = true;
      if (difference <= 2 && ['1second'].includes(d?.optionValue)) {
        disabled = false;
        optionValue = d?.optionValue;
      } else if (difference <= 4 && ['5seconds'].includes(d?.optionValue)) {
        disabled = false;
        optionValue = d?.optionValue;
      } else if (difference <= 6 && ['10seconds'].includes(d?.optionValue)) {
        disabled = false;
        optionValue = d?.optionValue;
      } else if (difference <= 18 && ['30seconds'].includes(d?.optionValue)) {
        disabled = false;
        optionValue = d?.optionValue;
      } else if (difference <= 36 && ['1minute'].includes(d?.optionValue)) {
        disabled = false;
        optionValue = d?.optionValue;
      } else if (difference <= 240 && ['5minutes'].includes(d?.optionValue)) {
        disabled = false;
        optionValue = d?.optionValue;
      } else if (difference <= 720 && ['15minutes'].includes(d?.optionValue)) {
        disabled = false;
        optionValue = d?.optionValue;
      } else if (difference <= 1440 && ['1hour'].includes(d?.optionValue)) {
        disabled = false;
        optionValue = d?.optionValue;
      } else if (difference <= 2880 && ['6hours'].includes(d?.optionValue)) {
        disabled = false;
        optionValue = d?.optionValue;
      } else if (difference <= 8760 && ['1day'].includes(d?.optionValue)) {
        disabled = false;
        optionValue = d?.optionValue;
      }
      return {
        ...d,
        disabled
      };
    });
    setDateFilters((preVal) => ({
      ...preVal,
      intervals: optionValue
    }));
    setIntervals(interval);
  }, [dateFilters.from, dateFilters.to]);

  return (
    <Box display="flex" justifyContent="end">
      <MuiPickersUtilsProvider utils={DateFnsUtils}>
        <div className="grid grid-cols-1 justify-end sm:grid-cols-[1fr_1fr] md:grid-cols-[1fr_1fr_1fr] lg:grid-cols-[1fr_1fr_1fr] gap-2 flex-grow max-w-[850px] ">
          <KeyboardDateTimePicker
            inputVariant="outlined"
            variant="inline"
            fullWidth
            size="small"
            margin="none"
            autoOk
            maxDate={dateFilters.to}
            format={dateFormatForInputControl + ' HH:mm'}
            label="From"
            views={['year', 'month', 'date', 'hours', 'minutes']}
            value={dateFilters.from}
            onChange={(date) => {
              setDateFilters({ ...dateFilters, from: date });
            }}
          />
          <KeyboardDateTimePicker
            inputVariant="outlined"
            variant="inline"
            fullWidth
            size="small"
            margin="none"
            autoOk
            minDate={dateFilters.from}
            format={dateFormatForInputControl + ' HH:mm'}
            label="To"
            views={['year', 'month', 'date', 'hours', 'minutes']}
            value={dateFilters.to}
            onChange={(date) => {
              setDateFilters({ ...dateFilters, to: date });
            }}
          />
          <Autocomplete
            id={`interval`}
            style={{ minWidth: '260px' }}
            options={intervals}
            autoHighlight
            getOptionLabel={(option: any) => option?.optionLabel}
            getOptionDisabled={(option) => option?.disabled || false}
            renderOption={(option) => option?.optionLabel}
            onChange={(event, value) => {
              setDateFilters({
                ...dateFilters,
                intervals: value?.optionValue || null
              });
            }}
            value={intervals.find((v) => v.optionValue === dateFilters.intervals) || {}}
            renderInput={(params) => <TextField {...params} name={`interval`} label="Interval" size="small" margin="none" variant="outlined" />}
          />
        </div>
      </MuiPickersUtilsProvider>
    </Box>
  );
}
