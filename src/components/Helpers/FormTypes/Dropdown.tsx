import { Grid, IconButton, TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import React from 'react';
import ManageWellMaster from 'src/pages/WellMaster/ManageWellMaster';

function Dropdown({ 
    InfoLabel,
    fieldData,
    addAdditionalOption,
    rest,
    option,
    values,
    type,
    onChange,
    label,
    lookup,
    name,
    addFieldOption,
    setOptionsList,
    handleChange,
    filter,
    getLabel,
    touched,
    errors,
    required,
    optionSaveDialog,
    setOptionSaveDialog,
    AddOptionDialog,
    setFieldValue }) {

    const [lookupDialog, setLookupDialog] = React.useState(false);


    return (
        <>
            <InfoLabel info={fieldData?.tooltipMessage} isTooltip={fieldData?.isTooltip} warningTooltip={fieldData?.isWarningTooltip} warningMessage={fieldData?.warningTooltipMessage} doNotShowInfoTooltip={fieldData?.doNotShowInfoTooltip}>
                <Grid container spacing={1} alignItems="center">
                    <Grid item xs={(!lookup && (addAdditionalOption || fieldData?.addAdditionalOption)) || (lookup && name === "wellName") ? 10 : 12}>
                        <Autocomplete
                            {...rest}
                            disabled={fieldData?.isUneditable || rest?.disabled}
                            options={fieldData && fieldData.isDependentDropdown ?
                                option.filter((_f) => _f[fieldData.dropdowDependentOn] === values[fieldData.dropdowDependentOn]) :
                                option.filter(f => f.optionLabel)}
                            freeSolo={type === 'dropDown' && !lookup}
                            getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                            getOptionSelected={(option: any, val) => option.optionValue === val}
                            value={
                                option.filter((data) => data.optionValue === values[name]).length ? option.filter((data) => data.optionValue === values[name])[0] : ''
                            }
                            onChange={
                                onChange
                                    ? onChange
                                    : (e, val) => {
                                        if (setFieldValue) {
                                            if (!lookup) {
                                                if (typeof val === 'string' && /^[a-zA-Z ]*$/.test(val)) {
                                                    const newOption = {
                                                        order: option.length,
                                                        default: false,
                                                        optionLabel: val,
                                                        optionValue: val
                                                    };

                                                    if (!option?.find((o) => o?.optionValue.includes(val)) && (addAdditionalOption || fieldData?.addAdditionalOption)) {
                                                        addFieldOption(newOption);
                                                        setOptionsList([...option, newOption]);
                                                    }
                                                    if (addAdditionalOption || fieldData?.addAdditionalOption) {
                                                        handleChange(name, val);
                                                    }
                                                } else if (val && val.inputValue && /^[a-zA-Z ]*$/.test(val.inputValue)) {
                                                    const newOption = {
                                                        order: option.length,
                                                        default: false,
                                                        optionLabel: val.inputValue,
                                                        optionValue: val.inputValue
                                                    };
                                                    if (
                                                        !option?.find((o) => o?.optionValue.includes(val.inputValue)) &&
                                                        (addAdditionalOption || fieldData?.addAdditionalOption)
                                                    ) {
                                                        setOptionsList([...option, newOption]);
                                                        addFieldOption(newOption);
                                                    }
                                                    if (addAdditionalOption || fieldData?.addAdditionalOption) {
                                                        handleChange(name, val.inputValue);
                                                    }
                                                } else {
                                                    if (val) {
                                                        const newOption = {
                                                            ...val,
                                                            optionLabel: val.optionValue
                                                        };
                                                        if (
                                                            !option?.find((o) => o?.optionValue.includes(val.optionValue)) &&
                                                            (addAdditionalOption || fieldData?.addAdditionalOption)
                                                        ) {
                                                            addFieldOption(newOption);
                                                            setOptionsList([newOption, ...option]);
                                                        }
                                                        handleChange(name, val && val.optionValue ? val.optionValue : '');
                                                    }
                                                    //  This else was not there, so In budget create dialog if I was removing the selected dropdown value, the value did not get clear
                                                    else {
                                                        handleChange(name, val && val.optionValue ? val.optionValue : '');
                                                    }
                                                }
                                            } else {
                                                handleChange(name, val && val.optionValue ? val.optionValue : '');
                                            }
                                        }
                                    }
                            }
                            filterOptions={(options, params) => {
                                const filtered = filter(options, params);

                                if (
                                    params.inputValue !== '' &&
                                    !option.find((o) => o?.optionValue.includes(params.inputValue)) &&
                                    !lookup &&
                                    (addAdditionalOption || fieldData?.addAdditionalOption)
                                ) {
                                    filtered.push({
                                        order: option.length,
                                        default: false,
                                        optionLabel: `Add "${params.inputValue}"`,
                                        optionValue: params.inputValue
                                    });
                                }

                                return filtered;
                            }}
                            selectOnFocus
                            clearOnBlur
                            handleHomeEndKeys
                            forcePopupIcon={true}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    name={name}
                                    label={getLabel(label)}
                                    variant="outlined"
                                    style={{ outline: "1px solid white" }}
                                    error={touched[name] && Boolean(errors[name])}
                                    helperText={touched[name] && errors[name]}
                                    required={required}
                                />
                            )}
                        />
                    </Grid>
                    {!lookup && (addAdditionalOption || fieldData?.addAdditionalOption) && (
                        <Grid item xs={2}>
                            <IconButton onClick={() => setOptionSaveDialog(true)} size="small" color="primary">
                                <AddCircleIcon />
                            </IconButton>

                            {optionSaveDialog && <AddOptionDialog values={values} handleChange={handleChange} name={name} label={label} addFieldOption={addFieldOption} options={option} setOptions={setOptionsList} setOpen={setOptionSaveDialog} />}
                        </Grid>
                    )}
                    {lookup && fieldData?.lookupResource === "Well Master" && (
                        <Grid item xs={2}>
                            <IconButton onClick={() => setLookupDialog(true)} size="small" color="primary">
                                <AddCircleIcon />
                            </IconButton>

                            {lookupDialog && <ManageWellMaster
                                isClone={false}
                                wellMasterId={null}
                                onClose={() => setLookupDialog(false)}
                                onSuccess={(data) => {
                                    setLookupDialog(false)
                                    if (data.wellName && data._id) {
                                        let tempNewOption = {
                                            default: false,
                                            optionLabel: data.wellName,
                                            optionValue: data._id,
                                            order: option.length
                                        }
                                        addFieldOption(tempNewOption);
                                        setOptionsList([tempNewOption, ...option]);
                                        handleChange(name, tempNewOption && tempNewOption.optionValue ? tempNewOption.optionValue : '');

                                    }
                                }}
                            />}
                        </Grid>
                    )}
                </Grid>
            </InfoLabel>


        </>
    )
}

export default Dropdown;
