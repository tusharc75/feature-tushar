import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { dateFormatForInputControl } from 'src/constants/helpers';
import dayjs from 'dayjs';

const CustomDateTimePicker = (props) => {

  const {
    value,
    name,
    label,
    handleChange,
    required,
    fieldData,
    maxDateTime,
    minDateTime,
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
    ...rest
  } = props;

  return (
    <DateTimePicker
      {...rest}
      disablePast={disablePast}
      required={required}
      ampm={false}
      value={dayjs.tz(value) || null}
      name={name}
      label={label}
      {...(maxDateTime ? { maxDateTime: dayjs.tz(new Date(maxDateTime)) } : {})}
      {...(minDateTime ? { minDateTime: dayjs.tz(new Date(minDateTime)) } : {})}
      onChange={(date) => handleChange(date)}
      onError={onError ? onError : console.error}
      slotProps={{
        textField: {
          helperText: helperText,
          error: error,
          variant: 'outlined',
          fullWidth: fullWidth ? true : false,
          ...(margin ? { margin: margin } : {}),
          ...(size ? { size: size } : {}),
          ...(placeholder ? { placeholder: placeholder } : {}),
          ...(onInput ? { onInput: onInput } : {})
        }
      }}
      format={inputFormat ? inputFormat : (dateFormatForInputControl + ' HH:mm')}
    />
  );
}

export default CustomDateTimePicker;