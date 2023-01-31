import {
    Checkbox,
    FormControlLabel,
    TextField,
} from '@material-ui/core';
import DateUtils from '@date-io/date-fns';
import { KeyboardDatePicker, KeyboardDateTimePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import { dateFormatForInputControl } from 'src/constants/helpers';
import { Autocomplete } from '@material-ui/lab';

const FormTypes = (props) => {
    const {
        type,
        label,
        name,
        errors,
        values,
        options,
        onChange,
        required,
        fieldData,
        touched,
        ...rest
    } = props;

    return type === 'singleLine' ? (
        <TextField
            {...rest}
            disabled={fieldData?.isUneditable || rest?.disabled}
            variant="outlined"
            type="text"
            label={label}
            required={required}
            name={name}
            value={values[name]}
            error={touched[name] && Boolean(errors[name])}
            helperText={touched[name] && errors[name]}
            onChange={onChange}
        />
    ) : type === 'multiLine' ? (
        <TextField
            {...rest}
            variant="outlined"
            type="text"
            multiline
            label={label}
            name={name}
            required={required}
            rows={3}
            value={values[name]}
            error={touched[name] && Boolean(errors[name])}
            helperText={touched[name] && errors[name]}
            onChange={onChange}
        />
    ) : type === 'percent' ? (
        <TextField
            {...rest}
            type="number"
            variant="outlined"
            label={label}
            required={required}
            name={name}
            value={values[name]}
            error={touched[name] && Boolean(errors[name])}
            helperText={touched[name] && errors[name]}
            InputProps={{
                endAdornment: '%',
                inputProps: { min: 0 },
                readOnly: fieldData && fieldData.isUneditable ? true : false
            }}
            onChange={onChange}
        />
    ) : type === "currencyAmount" ? (
        <TextField
            {...rest}
            type="number"
            variant="outlined"
            label={label}
            required={required}
            name={name}
            value={values[name]}
            InputProps={{
                startAdornment: '%',
            }}
            onChange={onChange}
        />
    ) : type === 'dropDown' ? (
        <Autocomplete
            {...rest}
            size="small"
            fullWidth
            options={options}
            value={values[name]}
            getOptionLabel={(option: any) => option.optionLabel || ''}
            getOptionSelected={(option: any, val) => (option ? option.optionLabel === val.optionLabel : false)}
            onChange={onChange}
            renderInput={(params) => <TextField {...params} label={name} variant="outlined" />}
        />
    ) : type === 'decimal' ? (
        <TextField
            {...rest}
            variant="outlined"
            type="number"
            label={label}
            required={required}
            name={name}
            value={values[name]}
            onChange={onChange}
            InputProps={{
                inputProps: { min: 0 },
                readOnly: fieldData && fieldData.isUneditable ? true : false
            }}
        />
    ) : type === 'checkBox' ? (
        <FormControlLabel
            control={
                <Checkbox
                    {...rest}
                    required={required}
                    name={name}
                    checked={values[name]}
                    onChange={onChange}
                    color="secondary"
                />
            }
            label={label}
        />
    ) : type === 'date' ? (
        <MuiPickersUtilsProvider utils={DateUtils}>
            <KeyboardDatePicker
                {...rest}
                disabled={fieldData?.isUneditable || rest?.disabled}
                clearable
                autoOk
                required={required}
                variant="inline"
                inputVariant="outlined"
                value={values[name]}
                name={name}
                label={label}
                onChange={onChange}
                format={dateFormatForInputControl}
                InputLabelProps={{
                    shrink: true
                }}
            />
        </MuiPickersUtilsProvider>
    ) : type === 'dateTime' ? (
        <MuiPickersUtilsProvider utils={DateUtils}>
            <KeyboardDateTimePicker
                {...rest}
                autoOk
                clearable
                required={required}
                variant="inline"
                inputVariant="outlined"
                ampm={false}
                value={values[name]}
                name={name}
                label={label}
                onChange={onChange}
                onError={console.error}
                disablePast
                format="yyyy/MM/dd HH:mm"
                InputLabelProps={{
                    shrink: true
                }}
            />
        </MuiPickersUtilsProvider>
    ) : null;
};

export default FormTypes;
