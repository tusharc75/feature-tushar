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
    ...rest
  } = props;


  return (
    <DatePicker
      {...rest}
      {...(views ? { views: views } : {})}
      {...(openTo ? { openTo: openTo } : {})}
      disablePast={disablePast}
      required={required}
      value={dayjs.tz(new Date(value) || null) || null}
      name={name}
      emptyLabel={label}
      label={label}
      {...(maxDate ? { maxDate: dayjs.tz(new Date(maxDate)) } : {})}
      {...(minDate ? { minDate: dayjs.tz(new Date(minDate)) } : {})}
      onChange={(date) => onChange(date)}
      onError={onError ? onError : console.error}
      slotProps={{
        textField: {
          helperText: helperText,
          error: error ? error : false,
          variant: 'outlined',
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
}

export default CustomDatePicker;