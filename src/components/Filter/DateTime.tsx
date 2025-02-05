import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CustomDatePicker from 'src/components/CustomDatePicker';
import dayjs from 'dayjs';

const DateTime = ({ fieldData, deepFilters, setDeepFilters, required = false, sidebarIcon = null, selectedUserFilter = null }) => {
  const [timeFrame, setTimeFrame] = useState<any>('custom');

  const handleDuration = useCallback(
    (timeFrame) => {
      let fromDate: any = '';
      let toDate: any = '';
      if (timeFrame === '1-month') {
        fromDate = dayjs.tz().subtract(1, 'month').toDate();
        toDate = dayjs.tz().toDate();
      } else if (timeFrame === '3-months') {
        fromDate = dayjs.tz().subtract(3, 'month').toDate();
        toDate = dayjs.tz().toDate();
      } else if (timeFrame === '6-months') {
        fromDate = dayjs.tz().subtract(6, 'month').toDate();
        toDate = dayjs.tz().toDate();
      } else if (timeFrame === '1-year') {
        fromDate = dayjs.tz().subtract(1, 'year').toDate();
        toDate = dayjs.tz().toDate();
      } else if (timeFrame === 'current-year') {
        fromDate = dayjs.tz().startOf('year').toDate();
        toDate = dayjs.tz().endOf('year').toDate();
      }
      setDeepFilters([
        ...deepFilters?.filter((d) => d?.field !== fieldData?.fieldName),
        { field: fieldData?.fieldName, type: 'date', duration: timeFrame, term: { from: fromDate, to: toDate } }
      ]);
    },
    [deepFilters, fieldData?.fieldName, setDeepFilters]
  );

  const handleChangeTimeFrame = useCallback(
    (timeFrame) => {
      setTimeFrame(timeFrame);
      handleDuration(timeFrame);
    },
    [handleDuration]
  );

  const clearDate = useCallback(() => {
    handleChangeTimeFrame('custom');
  }, []);

  const isDatePresent = useMemo(() => {
    const found = deepFilters?.find((d) => {
      if (d?.field === fieldData?.fieldName) {
        return Boolean(d?.term?.from) || Boolean(d?.term?.to);
      }
    });
    return Boolean(found);
  }, [deepFilters, fieldData?.fieldName]);

  useEffect(() => {
    const data = deepFilters?.find((d) => d?.field === fieldData?.fieldName);
    setTimeFrame(data?.duration || 'custom');
    if (data) {
      setDeepFilters([
        ...deepFilters?.filter((d) => d?.field !== fieldData?.fieldName),
        { field: fieldData?.fieldName, duration: data?.duration, type: 'date', term: { from: data?.term?.from, to: data?.term?.to } }
      ]);
    }
  }, [selectedUserFilter]);

  return (
    <>
      <div className="sticky top-0 z-10  flex min-h-[64px] items-center justify-between bg-[var(--dark-primary,white)] py-[--py,_16px]">
        <div className="flex items-center gap-2">
          {sidebarIcon}
          <p className="text-[16px] font-medium leading-[19px]">{fieldData?.fieldLabel}</p>
        </div>
      </div>
      <div className="mt-5 w-1/2">
        <div>
          <FormControl fullWidth size="small" variant="outlined">
            <InputLabel id={fieldData?.fieldName}>Select Duration</InputLabel>
            <Select
              size="small"
              labelId={fieldData?.fieldName}
              id={`time-${fieldData?.fieldName}`}
              value={timeFrame}
              onChange={(e) => {
                handleChangeTimeFrame(e.target.value);
              }}
              label="Select Duration"
            >
              <MenuItem value={'1-year'}>Last 1 Year</MenuItem>
              <MenuItem value={'6-months'}>Last 6 Months</MenuItem>
              <MenuItem value={'3-months'}>Last 3 Months</MenuItem>
              <MenuItem value={'1-month'}>Last 1 Month</MenuItem>
              <MenuItem value={'current-year'}>Current Year</MenuItem>
              <MenuItem value={'custom'}>Custom</MenuItem>
            </Select>
          </FormControl>
        </div>
        <div className="mt-5">
          <CustomDatePicker
            disabled={timeFrame !== 'custom'}
            fullWidth
            size="small"
            name={`from_${fieldData?.fieldName}`}
            label={`From ${fieldData?.fieldLabel}`}
            value={
              deepFilters?.find((d) => d?.field === fieldData?.fieldName)?.term?.from
                ? deepFilters?.find((d) => d?.field === fieldData?.fieldName)?.term?.from
                : null
            }
            onChange={(date: any) => {
              const _data = deepFilters?.find((d) => d?.field === fieldData?.fieldName)?.term;
              setDeepFilters([
                ...deepFilters?.filter((d) => d?.field !== fieldData?.fieldName),
                { field: fieldData?.fieldName, type: 'date', duration: 'custom', term: { from: dayjs(date).toDate(), to: _data?.to || '' } }
              ]);
            }}
          />
        </div>
        <div className="mt-5">
          <CustomDatePicker
            disabled={timeFrame !== 'custom'}
            fullWidth
            size="small"
            name={`to_${fieldData?.fieldName}`}
            label={`To ${fieldData?.fieldLabel}`}
            value={
              deepFilters?.find((d) => d?.field === fieldData?.fieldName)?.term?.to
                ? deepFilters?.find((d) => d?.field === fieldData?.fieldName)?.term?.to
                : null
            }
            onChange={(date: any) => {
              const _data = deepFilters?.find((d) => d?.field === fieldData?.fieldName)?.term;
              setDeepFilters([
                ...deepFilters?.filter((d) => d?.field !== fieldData?.fieldName),
                { field: fieldData?.fieldName, type: 'date', duration: 'custom', term: { from: _data?.from || '', to: dayjs(date).toDate() } }
              ]);
            }}
          />
        </div>
        {isDatePresent && (
          <div className="mt-4">
            <ThemeButton onClick={clearDate} iconForMobile={false}>
              Clear Dates
            </ThemeButton>
          </div>
        )}
      </div>
    </>
  );
};

export default DateTime;
