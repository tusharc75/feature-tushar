import { 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormHelperText,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface Field {
  _id: string;
  fieldName: string;
  fieldLabel: string;
  type: string;
  required: boolean;
  option?: any[];
  sectionName?: string;
  isTooltip?: boolean;
  tooltipMessage?: string;
}

interface RenderFieldProps {
  field: Field;
  value: any;
  onChange: (fieldName: string, value: any) => void;
  error?: boolean;
  helperText?: string;
}

const RenderField = ({ field, value, onChange, error = false, helperText }: RenderFieldProps) => {
  const handleChange = (newValue: any) => {
    onChange(field.fieldName, newValue);
  };

  const commonProps = {
    fullWidth: true,
    label: field.fieldLabel,
    value: value || '',
    error,
    helperText,
    required: field.required,
    size: 'small' as const,
  };

  switch (field.type) {
    case 'date':
      return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            {...commonProps}
            value={value ? new Date(value) : null}
            onChange={(date) => handleChange(date?.toISOString())}
            slotProps={{
              textField: {
                ...commonProps,
                InputLabelProps: { shrink: true }
              }
            }}
          />
        </LocalizationProvider>
      );

    case 'fileUpload':
      return (
        <TextField
          {...commonProps}
          type="file"
          InputLabelProps={{ shrink: true }}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
            handleChange(e.target.files?.[0])
          }
        />
      );

    case 'multiLine':
      return (
        <TextField
          {...commonProps}
          multiline
          rows={3}
          onChange={(e) => handleChange(e.target.value)}
        />
      );

    case 'dropdown':
      return (
        <FormControl fullWidth error={error} size="small">
          <InputLabel>{field.fieldLabel}</InputLabel>
          <Select
            value={value || ''}
            label={field.fieldLabel}
            onChange={(e) => handleChange(e.target.value)}
          >
            {field.option?.map((option: any) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {helperText && <FormHelperText>{helperText}</FormHelperText>}
        </FormControl>
      );

    case 'radio':
      return (
        <FormControl component="fieldset" error={error}>
          <FormLabel component="legend">{field.fieldLabel}</FormLabel>
          <RadioGroup
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
          >
            {field.option?.map((option: any) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio />}
                label={option.label}
              />
            ))}
          </RadioGroup>
          {helperText && <FormHelperText>{helperText}</FormHelperText>}
        </FormControl>
      );

    case 'checkbox':
      return (
        <FormControlLabel
          control={
            <Checkbox
              checked={Boolean(value)}
              onChange={(e) => handleChange(e.target.checked)}
            />
          }
          label={field.fieldLabel}
        />
      );

    case 'singleLine':
    default:
      return (
        <TextField
          {...commonProps}
          onChange={(e) => handleChange(e.target.value)}
        />
      );
  }
};

export default RenderField;