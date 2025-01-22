import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { dateFormatForInputControl } from 'src/constants/helpers';
import dayjs from 'dayjs';
import { isEmpty } from 'lodash';

const CustomDatePicker = (props) => {
  const {
    value,
    name,
    label,
    onChange,
    required,
    fieldData,
    maxDate,
    minDate,
    onError,
    error,
    helperText,
    fullWidth,
    margin,
    size,
    disablePast = false,
    inputFormat,
    placeholder,
    onInput,
    views,
    openTo,
    InputProps,
    id,
    ...rest
  } = props;

  return (
    <DatePicker
      {...rest}
      {...(views ? { views: views } : {})}
      {...(openTo ? { openTo: openTo } : {})}
      disablePast={disablePast}
      required={required}
      value={value ? dayjs.tz(new Date(value)) : dayjs.tz(new Date(''))}
      name={name}
      emptyLabel={label}
      label={label}
      {...(maxDate ? { maxDate: dayjs.tz(new Date(maxDate)) } : {})}
      {...(minDate ? { minDate: dayjs.tz(new Date(minDate)) } : {})}
      onChange={(date) => onChange(date)}
      onError={onError ? onError : console.error}
      slotProps={{
        textField: {
          id: id,
          helperText: helperText,
          error: error ? error : false,
          variant: 'outlined',
          required: required,
          fullWidth: fullWidth ? true : false,
          ...(margin ? { margin: margin } : {}),
          ...(size ? { size: size } : {}),
          ...(placeholder ? { placeholder: placeholder } : {}),
          ...(!isEmpty(InputProps) ? InputProps : {})
        }
      }}
      format={inputFormat ? inputFormat : dateFormatForInputControl}
    />
  );
};

export default CustomDatePicker;
