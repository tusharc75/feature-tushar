import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import moment from 'moment';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { dateFormat } from 'src/constants/helpers';
import CustomDatePicker from 'src/components/CustomDatePicker';

const DateTime = ({ fieldData, deepFilters, setDeepFilters, resource, required = false, sidebarIcon = null }) => {
  const [timeFrame, setTimeFrame] = useState<any>('custom');

  const handleDuration = useCallback(
    (timeFrame) => {
      let fromDate: any = '';
      let toDate: any = '';
      if (timeFrame === '1-month') {
        fromDate = new Date(moment().subtract('1', 'month').calendar());
        toDate = new Date();
      } else if (timeFrame === '3-months') {
        fromDate = new Date(moment().subtract('3', 'months').calendar());
        toDate = new Date();
      } else if (timeFrame === '6-months') {
        fromDate = new Date(moment().subtract('6', 'months').calendar());
        toDate = new Date();
      } else if (timeFrame === '1-year') {
        fromDate = new Date(moment().subtract('1', 'year').calendar());
        toDate = new Date();
      }
      setDeepFilters([
        ...deepFilters?.filter((d) => d?.field !== `from_${fieldData?.fieldName}` && d?.field !== `to_${fieldData?.fieldName}`),
        ...[
          { field: `from_${fieldData?.fieldName}`, term: moment(fromDate).format('MM/DD/YYYY') },
          { field: `to_${fieldData?.fieldName}`, term: moment(toDate).format('MM/DD/YYYY') }
        ]
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
    const found = deepFilters.find((d) => {
      if (d?.field === `from_${fieldData?.fieldName}`) {
        return Boolean(d.term);
      }
      if (d?.field === `to_${fieldData?.fieldName}`) {
        return Boolean(d.term);
      }
      return true;
    });
    return Boolean(found);
  }, [deepFilters, fieldData?.fieldName]);

  useEffect(() => {
    const fromDate = moment(deepFilters?.find((item) => item.field === `from_${fieldData?.fieldName}`)?.term, 'MM/DD/YYYY');
    const toDate = moment(deepFilters?.find((item) => item.field === `to_${fieldData?.fieldName}`)?.term, 'MM/DD/YYYY');
    if (fromDate && toDate) {
      const differenceInMonths = toDate.diff(fromDate, 'months');
      const differenceInDays = toDate.diff(fromDate, 'days');
      if (differenceInMonths === 1 && [28, 29, 30, 31]?.includes(differenceInDays)) {
        setTimeFrame('1-month');
      } else if (differenceInMonths === 3 && [88, 89, 90, 91, 92]?.includes(differenceInDays)) {
        setTimeFrame('3-months');
      } else if (differenceInMonths === 6 && [178, 179, 180, 181, 182, 183]?.includes(differenceInDays)) {
        setTimeFrame('6-months');
      } else if (differenceInMonths === 12 && [365, 366]?.includes(differenceInDays)) {
        setTimeFrame('1-year');
      } else {
        setTimeFrame('custom');
      }
    }
  }, []);

  return (
    <>
      <div className="sticky top-0 z-10 flex min-h-[64px] items-center justify-between bg-[var(--dark-primary,white)] py-[--py,_16px]">
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
              deepFilters?.find((d) => d?.field === `from_${fieldData?.fieldName}`)?.term
                ? deepFilters?.find((d) => d?.field === `from_${fieldData?.fieldName}`)?.term
                : null
            }
            onChange={(date: any) => {
              setDeepFilters([
                ...deepFilters?.filter((d) => d?.field !== `from_${fieldData?.fieldName}`),
                { field: `from_${fieldData?.fieldName}`, term: moment(date).format('MM/DD/YYYY') }
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
              deepFilters?.find((d) => d?.field === `to_${fieldData?.fieldName}`)?.term
                ? deepFilters?.find((d) => d?.field === `to_${fieldData?.fieldName}`)?.term
                : null
            }
            onChange={(date: any) => {
              setDeepFilters([
                ...deepFilters?.filter((d) => d?.field !== `to_${fieldData?.fieldName}`),
                { field: `to_${fieldData?.fieldName}`, term: moment(date).format('MM/DD/YYYY') }
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
