import { Box, IconButton } from '@mui/material';
import dayjs from 'dayjs';
import RemoveIcon from '@mui/icons-material/Remove';
import { dateTimeFormat } from 'src/constants/helpers';
import { useEffect, useState } from 'react';
import CustomDateTimePicker from 'src/components/CustomDateTimePicker';
import { camelCase } from 'lodash';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ThemeButton } from 'src/components/Helpers/Buttons';

export interface DateTimeRange {
  startDateTime: Date | null;
  endDateTime: Date | null;
}

export interface DateValidationError {
  index: number;
  field: 'startDateTime' | 'endDateTime';
  message: string;
}

//Pass value as array of DateTimeRange to allow multiple ranges with multipleRanges prop as true or single DateTimeRange
interface CustomDateTimeRangePickerProps {
  value: any
  onChange: (value: DateTimeRange[] | DateTimeRange) => void;
  required?: boolean;
  fullWidth?: boolean;
  minDateTime?: Date;
  maxDateTime?: Date;
  disablePast?: boolean;
  size?: 'small' | 'medium';
  margin?: 'dense' | 'normal' | 'none';
  startPlaceholder?: string;
  endPlaceholder?: string;
  multipleRanges?: boolean;
  setValidationErrors?: (errors: DateValidationError[]) => void;
}

const CustomDateTimeRangePicker = (props: CustomDateTimeRangePickerProps) => {

  const {
    value,
    onChange,
    fullWidth = true,
    minDateTime,
    maxDateTime,
    disablePast = false,
    size = 'small',
    margin = 'normal',
    startPlaceholder = 'Start Date & Time',
    endPlaceholder = 'End Date & Time',
    multipleRanges = false,
    setValidationErrors
  } = props;

  const update = (index: number, field: 'startDateTime' | 'endDateTime', date: any) => {
    if (Array.isArray(value)) {
      onChange(value.map((range, i) => (i === index ? { ...range, [field]: date } : range)));
    } else {
      onChange({ ...value, [field]: date ? dayjs.tz(new Date(date)) : null });
    }
  };

  const [errors, setErrors] = useState<DateValidationError[]>([]);

  const validateDates = () => {
    const errors: DateValidationError[] = [];
    const ranges = Array.isArray(value) ? value : [value];

    ranges.forEach((range, index) => {
      if (!range.startDateTime) {
        errors.push({
          index,
          field: 'startDateTime',
          message: `${startPlaceholder} is required`
        });
      }
      if (!range.endDateTime) {
        errors.push({
          index,
          field: 'endDateTime',
          message: `${endPlaceholder} is required`
        });
      }

      if (range.startDateTime && range.endDateTime) {
        const start = dayjs.tz(new Date(range.startDateTime));
        const end = dayjs.tz(new Date(range.endDateTime));

        if (start.isAfter(end)) {
          errors.push({
            index,
            field: 'endDateTime',
            message: `${endPlaceholder} must be after ${startPlaceholder}`
          });
        }
      }

      if (index === 0 && minDateTime && range.startDateTime) {
        const start = dayjs.tz(new Date(range.startDateTime));
        const min = dayjs.tz(new Date(minDateTime));

        if (start.isBefore(min)) {
          errors.push({
            index,
            field: 'startDateTime',
            message: `${startPlaceholder} cannot be before ${min.format(dateTimeFormat)}`
          });
        }
      }

      if (index === ranges.length - 1 && maxDateTime && range.endDateTime) {
        const end = dayjs.tz(new Date(range.endDateTime));
        const max = dayjs.tz(new Date(maxDateTime));

        if (end.isAfter(max)) {
          errors.push({
            index,
            field: 'endDateTime',
            message: `${endPlaceholder} cannot be after ${max.format(dateTimeFormat)}`
          });
        }
      }

      if (index > 0 && range?.startDateTime && ranges[index - 1]?.endDateTime) {
        const currentStart = dayjs.tz(new Date(range.startDateTime));
        const prevEnd = dayjs.tz(new Date(ranges[index - 1].endDateTime));

        if (currentStart.isBefore(prevEnd)) {
          errors.push({
            index,
            field: 'startDateTime',
            message: `${startPlaceholder} overlaps with the previous range`
          });
        }
      }
    });
    setErrors(errors);
    setValidationErrors(errors);
    return errors;
  };

  useEffect(() => {
    const errors = validateDates();
    if (setValidationErrors && errors.length > 0) {
      setValidationErrors(errors);
    }
  }, [value, minDateTime, maxDateTime]);

  const renderDateTimeRange = (
    index: number,
    range: DateTimeRange,
    prevRange: DateTimeRange | null = null,
    nextRange: DateTimeRange | null = null,
    removeRows: any = null
  ) => {
    const startValue = range.startDateTime ? dayjs.tz(new Date(range.startDateTime)) : null;
    const endValue = range.endDateTime ? dayjs.tz(new Date(range.endDateTime)) : null;

    const minStartDateTime = prevRange?.endDateTime
      ? dayjs.tz(new Date(prevRange.endDateTime)).add(1, 'minute')
      : minDateTime
        ? dayjs.tz(new Date(minDateTime))
        : undefined;

    const maxEndDateTime = nextRange?.startDateTime
      ? dayjs.tz(new Date(nextRange.startDateTime)).subtract(1, 'minute')
      : maxDateTime
        ? dayjs.tz(new Date(maxDateTime))
        : undefined;

    const startError = errors.find((error) => error.index === index && error.field === 'startDateTime');
    const endError = errors.find((error) => error.index === index && error.field === 'endDateTime');

    return (
      <Box key={index} mb={2} display="flex" gap={2} width={fullWidth ? '100%' : 'auto'}>
        <CustomDateTimePicker
          fullWidth={fullWidth}
          required={true}
          disablePast={disablePast}
          value={startValue}
          name={`${camelCase(startPlaceholder)}`}
          label={startPlaceholder}
          onChange={(date) => update(index, 'startDateTime', date)}
          size={size}
          margin={margin}
          placeholder={startPlaceholder}
          {...(minStartDateTime ? { minDateTime: minStartDateTime } : {})}
          error={startError ? true : false}
          helperText={startError ? startError?.message : ''}
        />
        <CustomDateTimePicker
          fullWidth={fullWidth}
          required={true}
          disablePast={disablePast}
          value={endValue}
          name={`${camelCase(endPlaceholder)}`}
          label={endPlaceholder}
          onChange={(date) => update(index, 'endDateTime', date)}
          size={size}
          margin={margin}
          placeholder={endPlaceholder}
          {...(range.startDateTime ? { minDateTime: dayjs.tz(new Date(range.startDateTime)) } : {})}
          {...(maxEndDateTime ? { maxDateTime: maxEndDateTime } : {})}
          error={endError ? true : false}
          helperText={endError ? endError?.message : ''}
        />
        <Box pt={2}>
          <HtmlTooltip title='Remove'>
            <IconButton
              size="small"
              onClick={() => {
                removeRows(index)
              }}
              disabled={index === 0}
              aria-label="Remove range"
            >
              <RemoveIcon fontSize="small" color={index === 0 ? 'disabled' : 'error'} />
            </IconButton>
          </HtmlTooltip>
        </Box>
      </Box>

    );
  };

  const removeRows = (index) => {
    const newData = [
      ...value.slice(0, index),
      ...value.slice(index + 1)
    ]
    onChange(newData);
  }

  return (
    <Box width={fullWidth ? '100%' : 'auto'}>
      {Array.isArray(value)
        ? value?.map((range, index) =>
          renderDateTimeRange(index, range, index !== 0 ? value[index - 1] : null, index !== value.length - 1 ? value[index + 1] : null, removeRows)
        )
        : renderDateTimeRange(0, value)}
      {multipleRanges && Array.isArray(value) && (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'flex-end',
        }}>
          <ThemeButton
            buttonType="themeBorder"
            onClick={() => {
              onChange([
                ...value,
                {
                  startDateTime: null,
                  endDateTime: null
                }
              ]);
            }}
          >
            Add More Dates
          </ThemeButton>
        </Box>
      )}

    </Box>
  );
};

export default CustomDateTimeRangePicker;
