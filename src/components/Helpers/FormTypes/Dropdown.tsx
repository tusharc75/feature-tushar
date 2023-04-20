import { Box, Grid, IconButton, TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import React, { Fragment } from 'react';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { useData } from 'src/StateProvider/Provider';
import ManageWarehouse from 'src/pages/Warehouse/ManageWarehouse';
import { getNestedlookupDependentOn, sidebarResource } from 'src/constants/helpers';
import ManageWellMaster from 'src/pages/WellMaster/ManageWellMaster';
import ManageWellNumber from 'src/pages/WellNumber/ManageWellNumber';
import ManageStorageLocation from 'src/pages/StorageLocation/ManageStorageLocation';

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
    setFieldValue,
    allFields = [] }) {

    const { state: { permissions } }: any = useData();

    const [lookupDialog, setLookupDialog] = React.useState(false);

    return (<Grid key={fieldData?.lookupResource} item xs={12} sm={12} md={12}>
        <Box display="flex">
            <Box flexGrow={1}>
                <InfoLabel info={fieldData?.tooltipMessage} isTooltip={fieldData?.isTooltip} warningTooltip={fieldData?.isWarningTooltip} warningMessage={fieldData?.warningTooltipMessage} doNotShowInfoTooltip={fieldData?.doNotShowInfoTooltip}>
                    <Autocomplete
                        {...rest}
                        disabled={fieldData?.isUneditable || rest?.disabled}
                        options={(fieldData && fieldData?.isDependentDropdown) ?
                            option?.filter((_f) => _f[fieldData?.dropdowDependentOn] === values[fieldData?.dropdowDependentOn]) :
                            (fieldData && fieldData?.lookupDependentOn) ?
                                option?.filter((_f) => _f[fieldData?.lookupDependentOn] === values[fieldData?.lookupDependentOn]) :
                                option?.filter(f => f?.optionLabel)}
                        freeSolo={type === 'dropDown' && !lookup}
                        getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                        getOptionSelected={(option: any, val) => option.optionValue === val}
                        value={option.filter((data) => data.optionValue === values[name]).length ? option.filter((data) => data.optionValue === values[name])[0] : ''}
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
                                            const fieldChange: any = getNestedlookupDependentOn(allFields, name);
                                            fieldChange?.forEach((val: any) => {
                                                setFieldValue(val.fieldName, val.value);
                                            })
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
                </InfoLabel>

            </Box>
            {!lookup && (addAdditionalOption || fieldData?.addAdditionalOption) && (
                <Box>
                    <HtmlTooltip title={`Add ${fieldData?.lookupResource}`} className="formActionButton">
                        <>
                            <IconButton onClick={() => setOptionSaveDialog(true)} size="small" color="primary">
                                <AddCircleIcon />
                            </IconButton>
                            {optionSaveDialog && <AddOptionDialog values={values} handleChange={handleChange} name={name} label={label} addFieldOption={addFieldOption} options={option} setOptions={setOptionsList} setOpen={setOptionSaveDialog} />}
                        </>
                    </HtmlTooltip>
                </Box>
            )}
            {rest?.hidelookupAddButton ? null :
                <Fragment>
                    {lookup && fieldData?.lookupResource === sidebarResource.wellMaster && permissions?.wellMaster?.isCreate && (
                        <Box>
                            <HtmlTooltip title={`Add ${name}`} className="formActionButton">
                                <>
                                    <IconButton disabled={fieldData?.isUneditable || rest?.disabled} onClick={() => setLookupDialog(true)} size="small" color="primary">
                                        <AddCircleIcon />
                                    </IconButton>
                                    {lookupDialog && <ManageWellMaster
                                        refrenceData={{ customerAccount: values[fieldData.lookupDependentOn] }}
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
                                                    order: option.length,
                                                    customerAccount: data?.customerAccount,
                                                }
                                                addFieldOption(tempNewOption);
                                                setOptionsList([tempNewOption, ...option]);
                                                if (fieldData.lookupDependentOn) {
                                                    if (data[fieldData.lookupDependentOn] === values[fieldData.lookupDependentOn]) {
                                                        handleChange(name, tempNewOption && tempNewOption.optionValue ? tempNewOption.optionValue : '');
                                                    }
                                                }
                                                else {
                                                    handleChange(name, tempNewOption && tempNewOption.optionValue ? tempNewOption.optionValue : '');
                                                }
                                            }
                                        }}
                                    />}
                                </>
                            </HtmlTooltip>
                        </Box>)}
                    {lookup && fieldData?.lookupResource === sidebarResource.wellNumber && permissions?.wellNumber?.isCreate && (
                        <Box>
                            <HtmlTooltip title={`Add ${name}`} className="formActionButton">
                                <>
                                    <IconButton disabled={fieldData?.isUneditable || rest?.disabled} onClick={() => setLookupDialog(true)} size="small" color="primary">
                                        <AddCircleIcon />
                                    </IconButton>
                                    {lookupDialog &&
                                        <ManageWellNumber
                                            refrenceData={{ wellName: values[fieldData.lookupDependentOn] }}
                                            isClone={false}
                                            onClose={() => setLookupDialog(false)}
                                            onSuccess={(data) => {
                                                setLookupDialog(false)
                                                if (data.wellNumber && data._id) {
                                                    let tempNewOption = {
                                                        default: false,
                                                        optionLabel: data.wellNumber,
                                                        optionValue: data._id,
                                                        order: option.length,
                                                        wellName: data.wellName
                                                    }
                                                    addFieldOption(tempNewOption);
                                                    setOptionsList([tempNewOption, ...option]);
                                                    if (fieldData.lookupDependentOn) {
                                                        if (data[fieldData.lookupDependentOn] === values[fieldData.lookupDependentOn]) {
                                                            handleChange(name, tempNewOption && tempNewOption.optionValue ? tempNewOption.optionValue : '');
                                                        }
                                                    }
                                                    else {
                                                        handleChange(name, tempNewOption && tempNewOption.optionValue ? tempNewOption.optionValue : '');
                                                    }
                                                }
                                            }}
                                        />}
                                </>
                            </HtmlTooltip>
                        </Box>)}
                    {lookup && fieldData?.lookupResource === sidebarResource.warehouse && permissions?.warehouse?.isCreate && (
                        <Box>
                            <HtmlTooltip title={`Add ${name}`} className="formActionButton">
                                <>
                                    <IconButton disabled={fieldData?.isUneditable || rest?.disabled} onClick={() => setLookupDialog(true)} size="small" color="primary">
                                        <AddCircleIcon />
                                    </IconButton>
                                    {lookupDialog &&
                                        <ManageWarehouse
                                            open={lookupDialog}
                                            close={() => setLookupDialog(false)}
                                            isClone={false}
                                            onSuccess={({ data }) => {
                                                setLookupDialog(false)
                                                if (data.warehouseName && data._id) {
                                                    let tempNewOption = {
                                                        default: false,
                                                        optionLabel: data.warehouseName,
                                                        optionValue: data._id,
                                                        order: option.length
                                                    }
                                                    addFieldOption(tempNewOption);
                                                    setOptionsList([tempNewOption, ...option]);
                                                    handleChange(name, tempNewOption && tempNewOption.optionValue ? tempNewOption.optionValue : '');
                                                }
                                            }}
                                        />}
                                </>
                            </HtmlTooltip>
                        </Box>)}
                    {lookup && fieldData?.lookupResource === sidebarResource.storageLocation && permissions?.warehouse?.isCreate && (
                        <Box>
                            <HtmlTooltip title={`Add ${name}`} className="formActionButton">
                                <>
                                    <IconButton disabled={fieldData?.isUneditable || rest?.disabled} onClick={() => setLookupDialog(true)} size="small" color="primary">
                                        <AddCircleIcon />
                                    </IconButton>
                                    {lookupDialog && <ManageStorageLocation
                                        storageLocationId={null}
                                        onClose={() => setLookupDialog(false)}
                                        isClone={false}
                                        onSuccess={({ data }) => {
                                            setLookupDialog(false)
                                            if (data.storageLocationName && data._id) {
                                                let tempNewOption = {
                                                    default: false,
                                                    optionLabel: data.storageLocationName,
                                                    optionValue: data._id,
                                                    order: option.length,
                                                    warehouse: data.warehouse
                                                }
                                                addFieldOption(tempNewOption);
                                                setOptionsList([tempNewOption, ...option]);
                                                handleChange(name, tempNewOption && tempNewOption.optionValue ? tempNewOption.optionValue : '');
                                            }
                                        }}
                                    />}
                                </>
                            </HtmlTooltip>
                        </Box>)}
                </Fragment>
            }
        </Box>
    </Grid>

    )
}

export default Dropdown;
