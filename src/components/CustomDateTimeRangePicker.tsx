import { Delete } from '@mui/icons-material';
import { Box, IconButton } from '@mui/material';
import dayjs from 'dayjs';
import { camelCase } from 'lodash';
import { useEffect, useState } from 'react';
import CustomDateTimePicker from 'src/components/CustomDateTimePicker';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { dateTimeFormat } from 'src/constants/helpers';

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
  value: any;
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
    margin = 'none',
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

  const removeRows = (index) => {
    const newData = [...value.slice(0, index), ...value.slice(index + 1)];
    onChange(newData);
  };

  return (
    <Box width={fullWidth ? '100%' : 'auto'}>
      <div className="my-4 space-y-4">
        {Array.isArray(value) ? (
          value?.map((range, index) => (
            <RenderDateTimeRange
              index={index}
              range={range}
              prevRange={index !== 0 ? value[index - 1] : null}
              nextRange={index !== value.length - 1 ? value[index + 1] : null}
              removeRows={removeRows}
              errors={errors}
              minDateTime={minDateTime}
              fullWidth={fullWidth}
              maxDateTime={maxDateTime}
              disablePast={disablePast}
              startPlaceholder={startPlaceholder}
              update={update}
              endPlaceholder={endPlaceholder}
              margin={margin}
              size={size}
            />
          ))
        ) : (
          <RenderDateTimeRange
            index={0}
            range={value}
            removeRows={removeRows}
            errors={errors}
            minDateTime={minDateTime}
            fullWidth={fullWidth}
            maxDateTime={maxDateTime}
            disablePast={disablePast}
            startPlaceholder={startPlaceholder}
            update={update}
            endPlaceholder={endPlaceholder}
            margin={margin}
            size={size}
          />
        )}
      </div>
      {multipleRanges && Array.isArray(value) && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            alignItems: 'flex-end'
          }}
        >
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

const RenderDateTimeRange = ({
  index,
  range,
  prevRange,
  nextRange,
  removeRows,
  errors,
  minDateTime,
  fullWidth,
  maxDateTime,
  disablePast,
  startPlaceholder,
  update,
  endPlaceholder,
  margin,
  size
}: {
  index: number;
  range: DateTimeRange;
  prevRange?: DateTimeRange | null;
  nextRange?: DateTimeRange | null;
  removeRows?: any;
  minDateTime?: any;
  errors?: any;
  fullWidth?: boolean;
  maxDateTime?: any;
  disablePast?: boolean;
  startPlaceholder?: string;
  update?: any;
  size?: string;
  margin?: string;
  endPlaceholder?: string;
}) => {
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
    <div
      className="grid grid-cols-[1fr_30px] flex-wrap gap-2 rounded-md border bg-gray-50 p-4 dark:bg-gray-800 sm:grid-cols-[1fr_1fr_30px]"
      key={index}
    >
      <div className="max-sm:col-start-1">
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
      </div>
      <div className="max-sm:col-start-1">
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
      </div>
      <div className="mt-1 max-sm:col-start-2 max-sm:row-start-1">
        <HtmlTooltip title="Remove">
          <IconButton
            size="small"
            onClick={() => {
              removeRows(index);
            }}
            disabled={index === 0}
            color="error"
            aria-label="Remove range"
          >
            <Delete fontSize="small" />
          </IconButton>
        </HtmlTooltip>
      </div>
    </div>
  );
};
