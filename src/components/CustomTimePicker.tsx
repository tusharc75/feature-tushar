import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs from 'dayjs';

const CustomTimePicker = (props) => {
  const {
    value,
    name,
    label,
    onChange,
    required,
    fieldData,
    maxTime,
    minTime,
    onError,
    error,
    helperText,
    fullWidth,
    margin,
    size,
    disablePast = false,
    placeholder,
    onInput,
    ...rest
  } = props;

  return (
    <TimePicker
      {...rest}
      disablePast={disablePast}
      required={required}
      ampm={true}
      value={value ? dayjs.tz(new Date(value)) : dayjs.tz(new Date(''))}
      name={name}
      label={label}
      {...(maxTime ? { maxTime: dayjs.tz(new Date(maxTime)) } : {})}
      {...(minTime ? { minTime: dayjs.tz(new Date(minTime)) } : {})}
      onChange={(date) => onChange(date)}
      onError={onError ? onError : console.error}
      slotProps={{
        textField: {
          required: required ? true : false,
          helperText: helperText,
          error: error ? error : false,
          variant: 'outlined',
          fullWidth: fullWidth ? true : false,
          ...(margin ? { margin: margin } : {}),
          ...(size ? { size: size } : {}),
          ...(placeholder ? { placeholder: placeholder } : {}),
          ...(onInput ? { onInput: onInput } : {})
        }
      }}
      format={'hh:mm A'}
    />
  );
};

export default CustomTimePicker;
