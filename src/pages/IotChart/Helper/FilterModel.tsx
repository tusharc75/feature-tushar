import { Box, TextField } from '@mui/material';
import { Autocomplete } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { INTERVALS, dateFormatForInputControl } from '../../../constants/helpers';
import { useEffect, useState } from 'react';
import { isValid } from 'date-fns';

export default function FilterModel({ dateFilters, setDateFilters }) {
  const [intervals, setIntervals] = useState(INTERVALS);
  const [dateFilter, setDateFilter] = useState({
    from: dateFilters?.from,
    to: dateFilters?.to
  });
  const [inputFormKeyBoard, setInputFromKeyBoard] = useState(false);

  useEffect(() => {
    const difference = (dateFilters?.to?.getTime() - dateFilters?.from?.getTime()) / (1000 * 60 * 60);
    const interval = intervals?.map((d) => {
      let disabled = true;
      if (d?.optionValue === 'perCycle') {
        disabled = false;
      } else if (difference <= 2 && ['1second'].includes(d?.optionValue)) {
        disabled = false;
      } else if (difference <= 4 && ['5seconds'].includes(d?.optionValue)) {
        disabled = false;
      } else if (difference <= 6 && ['10seconds'].includes(d?.optionValue)) {
        disabled = false;
      } else if (difference <= 18 && ['30seconds'].includes(d?.optionValue)) {
        disabled = false;
      } else if (difference <= 36 && ['1minute'].includes(d?.optionValue)) {
        disabled = false;
      } else if (difference <= 240 && ['5minutes'].includes(d?.optionValue)) {
        disabled = false;
      } else if (difference <= 720 && ['15minutes'].includes(d?.optionValue)) {
        disabled = false;
      } else if (difference <= 1440 && ['1hour'].includes(d?.optionValue)) {
        disabled = false;
      } else if (difference <= 2880 && ['6hours'].includes(d?.optionValue)) {
        disabled = false;
      } else if (difference <= 8760 && ['1day'].includes(d?.optionValue)) {
        disabled = false;
      }
      return {
        ...d,
        disabled
      };
    });
    setIntervals(interval);
  }, [dateFilters.from, dateFilters.to]);

  useEffect(() => {
    if (inputFormKeyBoard && isValid(dateFilter.from) && isValid(dateFilter.to)) {
      setDateFilters({ ...dateFilters, from: dateFilter?.from, to: dateFilter.to });
    }
  }, [dateFilter, inputFormKeyBoard]);

  return (
    <Box display="flex" justifyContent="end">
      <div className="grid max-w-[850px] flex-grow grid-cols-1 justify-end gap-2 sm:grid-cols-[1fr_1fr] md:grid-cols-[1fr_1fr_1fr] lg:grid-cols-[1fr_1fr_1fr] ">
        <DateTimePicker
          inputVariant="outlined"
          variant="inline"
          fullWidth
          size="small"
          margin="none"
          autoOk
          maxDate={dateFilter.to}
          format={dateFormatForInputControl + ' HH:mm'}
          label="From"
          views={['year', 'month', 'date', 'hours', 'minutes']}
          value={dateFilter.from}
          onChange={(date) => {
            setInputFromKeyBoard(false);
            setDateFilter({ ...dateFilter, from: date });
          }}
          onClose={() => {
            setDateFilters({ ...dateFilters, from: dateFilter?.from });
          }}
          onInput={() => {
            setTimeout(() => {
              setInputFromKeyBoard(true);
            }, 1000);
          }}
        />
        <DateTimePicker
          inputVariant="outlined"
          variant="inline"
          fullWidth
          size="small"
          margin="none"
          autoOk
          minDate={dateFilter.from}
          format={dateFormatForInputControl + ' HH:mm'}
          label="To"
          views={['year', 'month', 'date', 'hours', 'minutes']}
          value={dateFilter.to}
          onChange={(date) => {
            setInputFromKeyBoard(false);
            setDateFilter({ ...dateFilter, to: date });
          }}
          onClose={() => {
            setDateFilters({ ...dateFilters, to: dateFilter?.to });
          }}
          onInput={() => {
            setTimeout(() => {
              setInputFromKeyBoard(true);
            }, 1000);
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
    </Box>
  );
}
