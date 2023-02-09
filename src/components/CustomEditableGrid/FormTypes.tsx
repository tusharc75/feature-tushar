import {
    Checkbox,
    FormControlLabel,
    InputAdornment,
    TextField,
} from '@material-ui/core';
import DateUtils from '@date-io/date-fns';
import { KeyboardDatePicker, KeyboardDateTimePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import { arrayToDropwdownOption, dateFormatForInputControl, getUniqueCurrencies } from 'src/constants/helpers';
import { Autocomplete } from '@material-ui/lab';
import { useEffect, useState } from 'react';

const FormTypes = (props) => {
    const {
        values,
        onChange,
        fieldData,
        currency,
        touched,
        errors
    } = props;

    const [options, setOptions] = useState([]);

    useEffect(() => {
        if (fieldData?.fieldName === 'unit') {
            setOptions(arrayToDropwdownOption(values?.[`${values.type}Detail`].unit))
        }
        else if (fieldData?.fieldName === 'pricingMethod') {
            setOptions(arrayToDropwdownOption(values?.[`${values.type}Detail`].pricingMethod))
        }
        else {
            setOptions(fieldData?.option)
        }

    }, [fieldData?.fieldName]);


    return fieldData?.type === 'singleLine' ? (
        <TextField
            disabled={fieldData?.isUneditable}
            variant="outlined"
            type="text"
            label={fieldData?.fieldLabel}
            required={fieldData?.required}
            name={`${values._id}_${fieldData?.fieldName}`}
            value={values[fieldData?.fieldName]}
            error={touched[`${values._id}_${fieldData?.fieldName}`] && Boolean(errors[`${values._id}_${fieldData?.fieldName}`])}
            helperText={touched[`${values._id}_${fieldData?.fieldName}`] && errors[`${values._id}_${fieldData?.fieldName}`]}
            margin="dense"
            onChange={(e) => onChange(fieldData?.fieldName, e.target.value.trimStart())}
        />
    ) : fieldData?.type === 'multiLine' ? (
        <TextField
            variant="outlined"
            type="text"
            multiline
            label={fieldData?.label}
            name={`${values._id}_${fieldData?.fieldName}`}
            required={fieldData?.required}
            rows={3}
            value={values[fieldData?.fieldName]}
            margin="dense"
            error={touched[`${values._id}_${fieldData?.fieldName}`] && Boolean(errors[`${values._id}_${fieldData?.fieldName}`])}
            helperText={touched[`${values._id}_${fieldData?.fieldName}`] && errors[`${values._id}_${fieldData?.fieldName}`]}
            onChange={(e) => onChange(fieldData?.fieldName, e.target.value)}
        />
    ) : fieldData?.type === 'percent' ? (
        <TextField
            type="number"
            variant="outlined"
            label={fieldData?.label}
            required={fieldData?.required}
            name={`${values._id}_${fieldData?.fieldName}`}
            value={values[fieldData?.fieldName]}
            InputProps={{
                endAdornment: '% ',
                inputProps: { min: 0 },
                readOnly: fieldData && fieldData?.isUneditable ? true : false
            }}
            margin="dense"
            error={touched[`${values._id}_${fieldData?.fieldName}`] && Boolean(errors[`${values._id}_${fieldData?.fieldName}`])}
            helperText={touched[`${values._id}_${fieldData?.fieldName}`] && errors[`${values._id}_${fieldData?.fieldName}`]}
            onChange={(e) => onChange(fieldData?.fieldName, parseFloat(e.target.value))}
        />
    ) : fieldData?.type === "currencyAmount" ? (
        <TextField
            type="number"
            variant="outlined"
            label={fieldData?.label}
            required={fieldData?.required}
            name={`${values._id}_${fieldData?.fieldName}`}
            value={values[fieldData?.fieldName]}
            InputProps={{
                startAdornment: <InputAdornment position="start">
                    {getUniqueCurrencies().find((d) => d.currencyCode === currency)?.symbolNative}
                </InputAdornment>,
            }}
            margin="dense"
            error={touched[`${values._id}_${fieldData?.fieldName}`] && Boolean(errors[`${values._id}_${fieldData?.fieldName}`])}
            helperText={touched[`${values._id}_${fieldData?.fieldName}`] && errors[`${values._id}_${fieldData?.fieldName}`]}
            onChange={(e) => onChange(fieldData?.fieldName, parseFloat(e.target.value))}
        />
    ) : fieldData?.type === 'dropDown' ? (
        <Autocomplete
            size="small"
            fullWidth
            options={options}
            value={
                options.find((data) => data.optionValue === values[fieldData?.fieldName]) ? options.find((data) => data.optionValue === values[fieldData?.fieldName]) : ''
            }
            getOptionLabel={(option: any) => option?.optionLabel || ''}
            getOptionSelected={(option: any, val) => (option ? option?.optionValue == val?.optionValue : false)}
            onChange={(e, val) => onChange(fieldData?.fieldName, val?.optionValue)}
            renderInput={(params) => <TextField
                {...params}
                error={touched[`${values._id}_${fieldData?.fieldName}`] && Boolean(errors[`${values._id}_${fieldData?.fieldName}`])}
                helperText={touched[`${values._id}_${fieldData?.fieldName}`] && errors[`${values._id}_${fieldData?.fieldName}`]}
                margin="dense"
                label={fieldData?.label}
                variant="outlined" />}
        />
    ) : fieldData?.type === 'decimal' ? (
        <TextField
            variant="outlined"
            type="number"
            label={fieldData?.label}
            required={fieldData?.required}
            name={`${values._id}_${fieldData?.fieldName}`}
            value={values[fieldData?.fieldName]}
            margin="dense"
            error={touched[`${values._id}_${fieldData?.fieldName}`] && Boolean(errors[`${values._id}_${fieldData?.fieldName}`])}
            helperText={touched[`${values._id}_${fieldData?.fieldName}`] && errors[`${values._id}_${fieldData?.fieldName}`]}
            onChange={(e) => onChange(fieldData?.fieldName, parseFloat(e.target.value))}
            InputProps={{
                inputProps: { min: 0 },
                readOnly: fieldData && fieldData?.isUneditable ? true : false
            }}
        />
    ) : fieldData?.type === 'checkBox' ? (
        <FormControlLabel
            control={
                <Checkbox
                    required={fieldData?.required}
                    name={`${values._id}_${fieldData?.fieldName}`}
                    checked={values[fieldData?.fieldName]}
                    onChange={(e) => onChange(fieldData?.fieldName, e.target.value)}
                    color="secondary"
                />
            }

            label={fieldData?.label}
        />
    ) : fieldData?.type === 'date' ? (
        <MuiPickersUtilsProvider utils={DateUtils}>
            <KeyboardDatePicker
                disabled={fieldData?.isUneditable}
                clearable
                autoOk
                required={fieldData?.required}
                variant="inline"
                inputVariant="outlined"
                value={values[fieldData?.fieldName]}
                name={`${values._id}_${fieldData?.fieldName}`}
                label={fieldData?.label}
                onChange={(date) => onChange(fieldData?.fieldName, date)}
                format={dateFormatForInputControl}
                InputLabelProps={{
                    shrink: true
                }}
                margin="dense"
                error={touched[`${values._id}_${fieldData?.fieldName}`] && Boolean(errors[`${values._id}_${fieldData?.fieldName}`])}
                helperText={touched[`${values._id}_${fieldData?.fieldName}`] && errors[`${values._id}_${fieldData?.fieldName}`]}
            />
        </MuiPickersUtilsProvider>
    ) : fieldData?.type === 'dateTime' ? (
        <MuiPickersUtilsProvider utils={DateUtils}>
            <KeyboardDateTimePicker
                autoOk
                clearable
                required={fieldData?.required}
                variant="inline"
                inputVariant="outlined"
                ampm={false}
                value={values[fieldData?.fieldName]}
                name={`${values._id}_${fieldData?.fieldName}`}
                label={fieldData?.label}
                onChange={(date) => onChange(fieldData?.fieldName, date)}
                onError={console.error}
                format="yyyy/MM/dd HH:mm"
                InputLabelProps={{
                    shrink: true
                }}
                margin="dense"
                error={touched[`${values._id}_${fieldData?.fieldName}`] && Boolean(errors[`${values._id}_${fieldData?.fieldName}`])}
                helperText={touched[`${values._id}_${fieldData?.fieldName}`] && errors[`${values._id}_${fieldData?.fieldName}`]}
            />
        </MuiPickersUtilsProvider>
    ) : null;
};

export default FormTypes;

