import { Box, Chip, Grid, IconButton, TextField, Tooltip } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import React, { Fragment } from 'react';

import { useData } from 'src/StateProvider/Provider';
import ManageWarehouse from 'src/pages/Warehouse/ManageWarehouse';
import {
  customerAccount,
  customerContact,
  getNestedlookupDependentOn,
  sidebarResource,
  supplierAccount,
  supplierContact
} from 'src/constants/helpers';
import ManageWellMaster from 'src/pages/WellMaster/ManageWellMaster';
import ManageWellNumber from 'src/pages/WellNumber/ManageWellNumber';
import ManageStorageLocation from 'src/pages/StorageLocation/ManageStorageLocation';
import ManageCompetencyType from 'src/pages/CompetencyType/ManageCompetencyType';
import ManageCompetencies from 'src/pages/Competencies/ManageCompetencies';
import ManageAccount from 'src/pages/Account/ManageAccount';
import ManageContact from 'src/pages/Contact/ManageContact';
import ManageAddressDialog from 'src/components/Address/ManageAddressDialog';
import ManageMarketSegmentDialog from 'src/pages/MarketSegment/ManageMarketSegmentDialog';
import { camelCase, has, isEmpty } from 'lodash';
import PlaylistAddIcon from '@material-ui/icons/PlaylistAdd';
import AddMultiple from '../../../pages/DynamicForm/AddMultiple';

function dropdownOptions(options, values, fields, fieldData) {
  const lookupDependentOn = fieldData?.lookupDependentOn;
  const lookupDependentOnField = fieldData?.lookupDependentOnField;

  if (!lookupDependentOn || isEmpty(lookupDependentOn)) {
    let oData = options;
    if (fieldData?.fieldName === 'owner') {
      const optionDatas = options?.filter((option: any) => ![...values['collaborator']]?.includes(option?.optionValue)) || [];
      oData = optionDatas || [];
    } else if (fieldData?.fieldName === 'collaborator') {
      const optionDatas = options?.filter((option: any) => option?.optionValue !== values['owner']) || [];
      oData = optionDatas || [];
    } else {
      // for market segment kind of situation
      const optionDatas = options?.filter((o) => {
        if (has(o, fieldData?.fieldName)) {
          return isEmpty(o[fieldData?.fieldName]);
        } else return true;
      });
      oData = optionDatas;
    }
    return oData || [];
  }

  const optionsToShow = [];

  if (lookupDependentOn && lookupDependentOnField && !isEmpty(lookupDependentOn) && !isEmpty(lookupDependentOnField)) {
    const dependentOnField = fields.find((e) => e?.fieldName === lookupDependentOn);
    if (dependentOnField) {
      const dependentOnFieldValue = values[dependentOnField?.fieldName];
      if (dependentOnFieldValue) {
        const dependentFieldOption = dependentOnField?.option?.find((e) => e.optionValue === dependentOnFieldValue);
        const dependentIds = dependentFieldOption[lookupDependentOnField] || [];
        const newOptions = options?.filter((option: any) => dependentIds.includes(option.optionValue)) || [];
        optionsToShow.push(...newOptions);
      }
    }
  }

  if (lookupDependentOn && !isEmpty(lookupDependentOn)) {
    const lookupResource = fields?.find((e) => e.fieldName === lookupDependentOn)?.lookupResource;
    const value = values[lookupDependentOn] || values[camelCase(lookupResource)];
    if (value) {
      const newOptions =
        options?.filter((option: any) => option[lookupDependentOn]?.includes(value) || option[camelCase(lookupResource)]?.includes(value)) || [];
      optionsToShow.push(...newOptions);
    }
  }

  return optionsToShow;
}

function Dropdown({
  InfoLabel,
  fieldData,
  rest,
  option,
  values,
  type,
  onChange,
  label,
  name,
  addFieldOption,
  setOptionsList,
  handleChange,
  getLabel,
  touched,
  errors,
  required,
  setFieldValue,
  fields = []
}) {
  const {
    state: { permissions }
  }: any = useData();
  const [lookupDialog, setLookupDialog] = React.useState(false);

  return (
    <Box key={fieldData?.lookupResource}>
      <Grid container spacing={1} style={{ alignItems: 'center' }}>
        <Grid item style={{ flexGrow: 1, maxWidth: 419 }}>
          <InfoLabel
            info={fieldData?.tooltipMessage}
            isTooltip={fieldData?.isTooltip}
            warningTooltip={fieldData?.isWarningTooltip}
            warningMessage={fieldData?.warningTooltipMessage}
            doNotShowInfoTooltip={fieldData?.doNotShowInfoTooltip}
          >
            {type === 'multiSelect' ? (
              <Autocomplete
                {...rest}
                multiple
                disableCloseOnSelect={true}
                options={dropdownOptions(option, values, fields, fieldData)}
                getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                value={
                  values[name]
                    ? [...dropdownOptions(option, values, fields, fieldData)].filter((data: any) => values[name].includes(data.optionValue))
                    : []
                }
                getOptionSelected={(option: any, val: any) => option.optionValue === val.optionValue}
                onChange={
                  onChange
                    ? onChange
                    : (e, value: any, reason) => {
                        if (setFieldValue) {
                          setFieldValue(
                            name,
                            value.map((val) => val.optionValue)
                          );
                        }
                      }
                }
                forcePopupIcon={true}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label={getLabel(label)}
                    name={name}
                    error={touched[name] && Boolean(errors[name])}
                    helperText={touched[name] && errors[name]}
                    required={required}
                    style={{ whiteSpace: 'nowrap' }}
                  />
                )}
              />
            ) : (
              <Autocomplete
                {...rest}
                disabled={fieldData?.isUneditable || rest?.disabled}
                options={dropdownOptions(option, values, fields, fieldData) || []}
                getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
                getOptionSelected={(option: any, val) => option.optionValue === val}
                value={[...dropdownOptions(option, values, fields, fieldData)].find((data: any) => data.optionValue === values[name]) || ''}
                onChange={
                  onChange
                    ? onChange
                    : (e, val) => {
                        if (setFieldValue) {
                          handleChange(name, val && val.optionValue ? val.optionValue : '');
                          const fieldChange: any = getNestedlookupDependentOn(fields, name);
                          fieldChange?.forEach((val: any) => {
                            setFieldValue(val.fieldName, val.value);
                          });
                        }
                      }
                }
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
                    style={{ outline: '1px solid white' }}
                    error={touched[name] && Boolean(errors[name])}
                    helperText={touched[name] && errors[name]}
                    required={required}
                  />
                )}
              />
            )}
          </InfoLabel>
        </Grid>
        {rest?.hidelookupAddButton ? null : fieldData?.addBulkOptions ? (
          <>
            <>
              <Tooltip title={`Add ${fieldData.fieldLabel}`} className="formActionButton">
                <IconButton disabled={fieldData?.isUneditable || rest?.disabled} onClick={() => setLookupDialog(true)} size="small" color="primary">
                  <AddCircleIcon />
                </IconButton>
              </Tooltip>
              {lookupDialog && (
                <AddMultiple
                  resource={fieldData?.lookupResource}
                  referenceData={
                    fieldData?.lookupDependentOn && values[fieldData?.lookupDependentOn]
                      ? { [fieldData?.lookupDependentOn]: values[fieldData?.lookupDependentOn] }
                      : null
                  }
                  onClose={() => setLookupDialog(false)}
                  onSuccess={(data) => {
                    setLookupDialog(false);
                    if (data?.length) {
                      const tempOptions = data?.map((item: any) => {
                        let tempNewOption = {
                          ...item,
                          order: option.length
                        };
                        return tempNewOption;
                      });
                      addFieldOption([...tempOptions]);
                      setOptionsList([...tempOptions, ...option]);
                      if (type === 'multiSelect') {
                        handleChange(name, tempOptions?.length ? [...tempOptions?.map((item: any) => item?.optionValue || ''), ...values[name]] : []);
                      } else {
                        handleChange(name, tempOptions?.length && tempOptions[0].optionValue ? tempOptions[0].optionValue : '');
                      }
                    }
                  }}
                />
              )}
            </>
          </>
        ) : (
          <>
            {fieldData?.lookup && fieldData?.lookupResource === sidebarResource.wellMaster && permissions?.wellMaster?.isCreate && (
              <>
                <>
                  <Tooltip title={`Add ${fieldData.fieldLabel}`} className="formActionButton">
                    <IconButton
                      disabled={fieldData?.isUneditable || rest?.disabled}
                      onClick={() => setLookupDialog(true)}
                      size="small"
                      color="primary"
                    >
                      <AddCircleIcon />
                    </IconButton>
                  </Tooltip>
                  {lookupDialog && (
                    <ManageWellMaster
                      refrenceData={{ customerAccount: values[fieldData.lookupDependentOn] }}
                      isClone={false}
                      wellMasterId={null}
                      onClose={() => setLookupDialog(false)}
                      onSuccess={(data) => {
                        setLookupDialog(false);
                        if (data.wellName && data._id) {
                          let tempNewOption = {
                            default: false,
                            optionLabel: data.wellName,
                            optionValue: data._id,
                            order: option.length,
                            customerAccount: data?.customerAccount
                          };
                          addFieldOption(tempNewOption);
                          setOptionsList([tempNewOption, ...option]);
                          if (fieldData.lookupDependentOn) {
                            if (
                              data[fieldData.lookupDependentOn] === values[fieldData.lookupDependentOn] ||
                              data[fieldData.lookupDependentOn]?.includes(values[fieldData.lookupDependentOn])
                            ) {
                              handleChange(name, tempNewOption && tempNewOption.optionValue ? tempNewOption.optionValue : '');
                            }
                          } else {
                            handleChange(name, tempNewOption && tempNewOption.optionValue ? tempNewOption.optionValue : '');
                          }
                        }
                      }}
                    />
                  )}
                </>
              </>
            )}
            {fieldData?.lookup && fieldData?.lookupResource === sidebarResource.wellNumber && permissions?.wellNumber?.isCreate && (
              <>
                <>
                  <Tooltip title={`Add ${fieldData.fieldLabel}`} className="formActionButton">
                    <IconButton
                      disabled={fieldData?.isUneditable || rest?.disabled}
                      onClick={() => setLookupDialog(true)}
                      size="small"
                      color="primary"
                    >
                      <AddCircleIcon />
                    </IconButton>
                  </Tooltip>
                  {lookupDialog && (
                    <ManageWellNumber
                      refrenceData={{ wellName: values[fieldData.lookupDependentOn] }}
                      isClone={false}
                      onClose={() => setLookupDialog(false)}
                      onSuccess={(data) => {
                        setLookupDialog(false);
                        if (data.wellNumber && data._id) {
                          let tempNewOption = {
                            default: false,
                            optionLabel: data.wellNumber,
                            optionValue: data._id,
                            order: option.length,
                            wellMaster: data.wellName
                          };
                          addFieldOption(tempNewOption);
                          setOptionsList([tempNewOption, ...option]);
                          if (fieldData.lookupDependentOn) {
                            if (data[fieldData.lookupDependentOn] === values[fieldData.lookupDependentOn]) {
                              if (type === 'multiSelect') {
                                handleChange(
                                  name,
                                  tempNewOption && tempNewOption.optionValue ? [...[...(values[name] || [])], tempNewOption.optionValue] : []
                                );
                              } else {
                                handleChange(name, tempNewOption && tempNewOption.optionValue ? tempNewOption.optionValue : '');
                              }
                            }
                          } else {
                            handleChange(name, tempNewOption && tempNewOption.optionValue ? tempNewOption.optionValue : '');
                          }
                        }
                      }}
                    />
                  )}
                </>
              </>
            )}
            {fieldData?.lookup && fieldData?.lookupResource === sidebarResource.warehouse && permissions?.warehouse?.isCreate && (
              <>
                <>
                  <Tooltip title={`Add ${fieldData.fieldLabel}`} className="formActionButton">
                    <IconButton
                      disabled={fieldData?.isUneditable || rest?.disabled}
                      onClick={() => setLookupDialog(true)}
                      size="small"
                      color="primary"
                    >
                      <AddCircleIcon />
                    </IconButton>
                  </Tooltip>
                  {lookupDialog && (
                    <ManageWarehouse
                      open={lookupDialog}
                      warehouseId={null}
                      close={() => setLookupDialog(false)}
                      isClone={false}
                      onSuccess={({ data }) => {
                        setLookupDialog(false);
                        if (data.warehouseName && data._id) {
                          let tempNewOption = {
                            default: false,
                            optionLabel: data.warehouseName,
                            optionValue: data._id,
                            order: option.length
                          };
                          addFieldOption(tempNewOption);
                          setOptionsList([tempNewOption, ...option]);
                          handleChange(name, tempNewOption && tempNewOption.optionValue ? tempNewOption.optionValue : '');
                        }
                      }}
                    />
                  )}
                </>
              </>
            )}
            {fieldData?.lookup && fieldData?.lookupResource === sidebarResource.storageLocation && permissions?.warehouse?.isCreate && (
              <>
                <>
                  <Tooltip title={`Add ${fieldData.fieldLabel}`} className="formActionButton">
                    <IconButton
                      disabled={fieldData?.isUneditable || rest?.disabled}
                      onClick={() => setLookupDialog(true)}
                      size="small"
                      color="primary"
                    >
                      <AddCircleIcon />
                    </IconButton>
                  </Tooltip>
                  {lookupDialog && (
                    <ManageStorageLocation
                      referenceData={{ warehouse: values[fieldData.lookupDependentOn] }}
                      storageLocationId={null}
                      onClose={() => setLookupDialog(false)}
                      isClone={false}
                      onSuccess={({ data }) => {
                        setLookupDialog(false);
                        if (data.storageLocationName && data._id) {
                          let tempNewOption = {
                            default: false,
                            optionLabel: data.storageLocationName,
                            optionValue: data._id,
                            order: option.length,
                            warehouse: data.warehouse
                          };
                          addFieldOption(tempNewOption);
                          setOptionsList([tempNewOption, ...option]);
                          handleChange(name, tempNewOption && tempNewOption.optionValue ? tempNewOption.optionValue : '');
                        }
                      }}
                    />
                  )}
                </>
              </>
            )}
            {fieldData?.lookup && fieldData?.lookupResource === sidebarResource.competencyType && permissions?.competencyType?.isCreate && (
              <>
                <>
                  <Tooltip title={`Add ${fieldData.fieldLabel}`} className="formActionButton">
                    <IconButton
                      disabled={fieldData?.isUneditable || rest?.disabled}
                      onClick={() => setLookupDialog(true)}
                      size="small"
                      color="primary"
                    >
                      <AddCircleIcon />
                    </IconButton>
                  </Tooltip>
                  {lookupDialog && (
                    <ManageCompetencyType
                      id={null}
                      onClose={() => setLookupDialog(false)}
                      isClone={false}
                      onSuccess={(data) => {
                        setLookupDialog(false);
                        if (data.competencyType && data._id) {
                          let tempNewOption = {
                            default: false,
                            optionLabel: data.competencyType,
                            optionValue: data._id,
                            order: option.length
                          };
                          addFieldOption(tempNewOption);
                          setOptionsList([tempNewOption, ...option]);
                          handleChange(name, tempNewOption && tempNewOption.optionValue ? tempNewOption.optionValue : '');
                        }
                      }}
                    />
                  )}
                </>
              </>
            )}
            {fieldData?.lookup && fieldData?.lookupResource === sidebarResource.competencies && permissions?.competencies?.isCreate && (
              <>
                <>
                  <Tooltip title={`Add ${fieldData.fieldLabel}`} className="formActionButton">
                    <IconButton
                      disabled={fieldData?.isUneditable || rest?.disabled}
                      onClick={() => setLookupDialog(true)}
                      size="small"
                      color="primary"
                    >
                      <AddCircleIcon />
                    </IconButton>
                  </Tooltip>
                  {lookupDialog && (
                    <ManageCompetencies
                      referenceData={{ competencyType: values[fieldData.lookupDependentOn] }}
                      isClone={false}
                      onClose={() => setLookupDialog(false)}
                      onSuccess={(data) => {
                        setLookupDialog(false);
                        if (data.competencyName && data._id) {
                          let tempNewOption = {
                            default: false,
                            optionLabel: data.competencyName,
                            optionValue: data._id,
                            order: option.length,
                            competencyType: data.competencyType
                          };
                          addFieldOption(tempNewOption);
                          setOptionsList([tempNewOption, ...option]);
                          if (fieldData.lookupDependentOn) {
                            if (data[fieldData.lookupDependentOn] === values[fieldData.lookupDependentOn]) {
                              if (type === 'multiSelect') {
                                handleChange(name, tempNewOption && tempNewOption.optionValue ? [tempNewOption.optionValue] : []);
                              } else {
                                handleChange(name, tempNewOption && tempNewOption.optionValue ? tempNewOption.optionValue : '');
                              }
                            }
                          } else {
                            handleChange(name, tempNewOption && tempNewOption.optionValue ? tempNewOption.optionValue : '');
                          }
                        }
                      }}
                    />
                  )}
                </>
              </>
            )}
            {fieldData?.lookup && fieldData?.lookupResource === sidebarResource.customerAccount && permissions?.customerAccount?.isCreate && (
              <>
                <>
                  <Tooltip title={`Add ${fieldData.fieldLabel}`} className="formActionButton">
                    <IconButton
                      disabled={fieldData?.isUneditable || rest?.disabled}
                      onClick={() => setLookupDialog(true)}
                      size="small"
                      color="primary"
                    >
                      <AddCircleIcon />
                    </IconButton>
                  </Tooltip>
                  {lookupDialog && (
                    <ManageAccount
                      open={lookupDialog}
                      onClose={() => setLookupDialog(false)}
                      accountResource={'customerAccount'}
                      accountApi={customerAccount.accountApi}
                      isClone={false}
                      isRedirectToDetailPage={false}
                      onSuccess={({ data }) => {
                        setLookupDialog(false);
                        if (data._id) {
                          let tempNewOption = {
                            default: true,
                            optionLabel: data.accountName,
                            optionValue: data._id,
                            order: option.length
                          };
                          addFieldOption(tempNewOption);
                          setOptionsList([tempNewOption, ...option]);
                          handleChange(name, tempNewOption && tempNewOption.optionValue ? tempNewOption.optionValue : '');
                        }
                      }}
                    />
                  )}
                </>
              </>
            )}
            {fieldData?.lookup && fieldData?.lookupResource === sidebarResource.supplierAccount && permissions?.supplierAccount?.isCreate && (
              <>
                <Tooltip title={`Add ${fieldData.fieldLabel}`} className="formActionButton">
                  <IconButton disabled={fieldData?.isUneditable || rest?.disabled} onClick={() => setLookupDialog(true)} size="small" color="primary">
                    <AddCircleIcon />
                  </IconButton>
                </Tooltip>
                {lookupDialog && (
                  <ManageAccount
                    open={lookupDialog}
                    onClose={() => setLookupDialog(false)}
                    accountResource={`supplierAccount`}
                    accountApi={supplierAccount.accountApi}
                    isClone={false}
                    isRedirectToDetailPage={false}
                    onSuccess={({ data }) => {
                      setLookupDialog(false);
                      if (data._id) {
                        let tempNewOption = {
                          default: true,
                          optionLabel: data.accountName,
                          optionValue: data._id,
                          order: option.length
                        };
                        addFieldOption(tempNewOption);
                        setOptionsList([tempNewOption, ...option]);
                        handleChange(name, tempNewOption && tempNewOption.optionValue ? tempNewOption.optionValue : '');
                      }
                    }}
                  />
                )}
              </>
            )}
            {fieldData?.lookup && fieldData?.lookupResource === sidebarResource.customerContact && permissions?.customerContact?.isCreate && (
              <>
                <>
                  <Tooltip title={`Add ${fieldData.fieldLabel}`} className="formActionButton">
                    <IconButton
                      disabled={fieldData?.isUneditable || rest?.disabled}
                      onClick={() => setLookupDialog(true)}
                      size="small"
                      color="primary"
                    >
                      <AddCircleIcon />
                    </IconButton>
                  </Tooltip>
                  {lookupDialog && (
                    <ManageContact
                      open={lookupDialog}
                      onClose={() => setLookupDialog(false)}
                      contactResource={'customerContact'}
                      contactApi={customerContact.contactApi}
                      isRedirectToDetailPage={false}
                      account={{
                        accountResource: 'customerAccount',
                        accountApi: customerAccount.accountApi
                      }}
                      onSuccess={({ data }) => {
                        setLookupDialog(false);
                        if (data?.data?._id) {
                          let tempNewOption = {
                            default: true,
                            email: data?.data?.email,
                            optionLabel: ` ${data?.data?.salutation} ${data?.data?.firstName} ${data?.data?.lastName}`,
                            optionValue: data?.data?._id,
                            order: option.length,
                            [fieldData.lookupDependentOn]: values[fieldData.lookupDependentOn]
                          };
                          addFieldOption(tempNewOption);
                          setOptionsList([tempNewOption, ...option]);
                          handleChange(name, tempNewOption && tempNewOption.optionValue ? tempNewOption.optionValue : '');
                        }
                      }}
                    />
                  )}
                </>
              </>
            )}
            {fieldData?.lookup && fieldData?.lookupResource === sidebarResource.supplierContact && permissions?.supplierContact?.isCreate && (
              <Box>
                <>
                  <Tooltip title={`Add ${fieldData.fieldLabel}`} className="formActionButton">
                    <IconButton
                      disabled={fieldData?.isUneditable || rest?.disabled}
                      onClick={() => setLookupDialog(true)}
                      size="small"
                      color="primary"
                    >
                      <AddCircleIcon />
                    </IconButton>
                  </Tooltip>
                  {lookupDialog && (
                    <ManageContact
                      open={lookupDialog}
                      onClose={() => setLookupDialog(false)}
                      contactResource={'supplierContact'}
                      contactApi={supplierContact.contactApi}
                      isRedirectToDetailPage={false}
                      account={{
                        accountResource: `supplierAccount`,
                        accountApi: supplierAccount.accountApi
                      }}
                      onSuccess={({ data }) => {
                        setLookupDialog(false);
                        if (data?.data?._id) {
                          let tempNewOption = {
                            default: true,
                            email: data?.data?.data?.email,
                            optionLabel: data?.data?.data?.concatedName,
                            optionValue: data?.data?._id,
                            parentAccount: data?.data?.accountName,
                            order: option.length,
                            [fieldData.lookupDependentOn]: values[fieldData.lookupDependentOn]
                          };
                          addFieldOption(tempNewOption);
                          setOptionsList([tempNewOption, ...option]);
                          handleChange(name, tempNewOption && tempNewOption.optionValue ? tempNewOption.optionValue : '');
                        }
                      }}
                    />
                  )}
                </>
              </Box>
            )}
            {fieldData?.lookup && fieldData?.lookupResource === sidebarResource.address && permissions?.address?.isCreate && (
              <>
                <>
                  <Tooltip title={`Add ${fieldData.fieldLabel}`} className="formActionButton">
                    <IconButton
                      disabled={fieldData?.isUneditable || rest?.disabled}
                      onClick={() => setLookupDialog(true)}
                      size="small"
                      color="primary"
                    >
                      <AddCircleIcon />
                    </IconButton>
                  </Tooltip>
                  {lookupDialog && (
                    <ManageAddressDialog
                      onClose={() => setLookupDialog(false)}
                      onSuccess={(data) => {
                        setLookupDialog(false);
                        if (data?._id) {
                          let tempNewOption = {
                            email: data?.email,
                            optionLabel: data?.fullAddress,
                            optionValue: data?._id,
                            order: option.length,
                            [fieldData.lookupDependentOn]: values[fieldData.lookupDependentOn]
                          };
                          addFieldOption(tempNewOption);
                          setOptionsList([tempNewOption, ...option]);
                          handleChange(name, tempNewOption && tempNewOption.optionValue ? tempNewOption.optionValue : '');
                        }
                      }}
                    />
                  )}
                </>
              </>
            )}
            {fieldData?.lookup && fieldData?.lookupResource === sidebarResource.marketSegment && permissions?.marketSegment?.isCreate && (
              <>
                <>
                  <Tooltip title={`Add ${fieldData.fieldLabel}`} className="formActionButton">
                    <IconButton
                      disabled={fieldData?.isUneditable || rest?.disabled}
                      onClick={() => setLookupDialog(true)}
                      size="small"
                      color="primary"
                    >
                      <AddCircleIcon />
                    </IconButton>
                  </Tooltip>
                  {lookupDialog && (
                    <ManageMarketSegmentDialog
                      marketSegmentId={null}
                      onClose={() => setLookupDialog(false)}
                      onSuccess={(data) => {
                        setLookupDialog(false);
                        if (data?._id) {
                          let tempNewOption = {
                            default: true,
                            optionLabel: data?.name,
                            optionValue: data?._id,
                            order: option.length,
                            ...(fieldData.lookupDependentOn && {
                              [fieldData.lookupDependentOn]: data?.parentMarketSegment || values[fieldData?.lookupDependentOn] || ''
                            })
                          };
                          addFieldOption(tempNewOption);
                          setOptionsList([tempNewOption, ...option]);
                          handleChange(name, tempNewOption && tempNewOption.optionValue ? tempNewOption.optionValue : '');
                        }
                      }}
                    />
                  )}
                </>
              </>
            )}
          </>
        )}
      </Grid>
    </Box>
  );
}

export default Dropdown;
