import {
    Checkbox,
    FormControlLabel,
    TextField,
} from '@material-ui/core';
import DateUtils from '@date-io/date-fns';
import { KeyboardDatePicker, KeyboardDateTimePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import { dateFormatForInputControl, getUniqueCurrencies } from 'src/constants/helpers';
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
        currency,
        ...rest
    } = props;
    console.log(values)
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
            onChange={(e) => onChange(name, e.target.value.trimStart())}
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
            onChange={(e) => onChange(name, e.target.value)}
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
            onChange={(e) => onChange(name, parseFloat(e.target.value))}
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
                startAdornment: getUniqueCurrencies().find((d) => d.currencyCode === currency)?.symbolNative,
            }}
            onChange={(e) => onChange(name, parseFloat(e.target.value))}
        />
    ) : type === 'dropDown' ? (
        <Autocomplete
            {...rest}
            size="small"
            fullWidth
            options={options}
            value={
                options.find((data) => data.optionValue === values[name]) ? options.find((data) => data.optionValue === values[name]) : ''
            }
            getOptionLabel={(option: any) => option.optionLabel || ''}
            getOptionSelected={(option: any, val) => (option ? option.optionValue == val : false)}
            onChange={(e,val) => onChange(name, val)}
            renderInput={(params) => <TextField {...params} label={label} variant="outlined" />}
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
            onChange={(e) => onChange(name, parseFloat(e.target.value))}
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
                    onChange={(e) => onChange(name, e.target.value)}
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
                onChange={(date) => onChange(name, date)}
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
                onChange={(date) => onChange(name, date)}
                onError={console.error}
                format="yyyy/MM/dd HH:mm"
                InputLabelProps={{
                    shrink: true
                }}
            />
        </MuiPickersUtilsProvider>
    ) : null;
};

export default FormTypes;
