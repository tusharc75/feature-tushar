import { Box, Grid, IconButton, ListSubheader, TextField, useMediaQuery } from '@material-ui/core';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import { Autocomplete } from '@material-ui/lab';
import { camelCase, has, isEmpty } from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { ListChildComponentProps, VariableSizeList } from 'react-window';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import ManageAddressDialog from 'src/components/Address/ManageAddressDialog';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import routes from 'src/components/Helpers/Routes';
import {
  customerAccount,
  customerContact,
  getNestedlookupDependentOn,
  sidebarResource,
  supplierAccount,
  supplierContact
} from 'src/constants/helpers';
import ManageAccount from 'src/pages/Account/ManageAccount';
import ManageCompetencies from 'src/pages/Competencies/ManageCompetencies';
import ManageCompetencyType from 'src/pages/CompetencyType/ManageCompetencyType';
import ManageContactDialog from 'src/pages/Contact/ManageContact';
import ManageDynamicForm from 'src/pages/DynamicForm/ManageDynamicForm';
import ManageMarketSegmentDialog from 'src/pages/MarketSegment/ManageMarketSegmentDialog';
import ManageStorageLocation from 'src/pages/StorageLocation/ManageStorageLocation';
import ManageWarehouse from 'src/pages/Warehouse/ManageWarehouse';
import ManagePadMaster from 'src/pages/PadMaster/ManagePadMaster';
import ManageWellMaster from 'src/pages/WellMaster/ManageWellMaster';
import ManageWellNumber from 'src/pages/WellNumber/ManageWellNumber';
import { NewAddressOptionList } from '../../../StateProvider/AddressProvider';
import AddMultiple from '../../../pages/DynamicForm/AddMultiple';

type renderRowProps = {
  setSize: (index: number, height: number) => void;
  containerWidth: number;
  minHeight?: number;
} & ListChildComponentProps;

function RenderRow(props: renderRowProps) {
  const { data, index, setSize, containerWidth, minHeight = 36 } = props;
  const rowRef = useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    setSize(index, Math.max(Math.ceil(rowRef?.current.getBoundingClientRect().height), minHeight));
  }, [setSize, index, containerWidth, minHeight]);

  return React.cloneElement(data[index], {
    ref: rowRef
  });
}

const OuterElementContext = React.createContext({});

const OuterElementType = React.forwardRef<HTMLDivElement>((props, ref) => {
  const outerProps = React.useContext(OuterElementContext);
  return <div ref={ref} {...props} {...outerProps} />;
});

function useResetCache(data: any) {
  const ref = React.useRef<VariableSizeList>(null);
  useEffect(() => {
    if (ref.current != null) {
      ref.current.resetAfterIndex(0, true);
    }
  }, [data]);
  return ref;
}

const ListboxComponent = React.forwardRef<HTMLDivElement>(function ListboxComponent(props, ref) {
  const { children, ...other } = props;
  const itemData = React.Children.toArray(children);
  const containerWidth = useRef<number>(1);
  const isMobile = useMediaQuery('(max-width:600px)', { noSsr: true });
  const itemSize = isMobile ? 37 : 38;

  const sizeMap = useRef<{ [key: number]: number }>({});
  const setSize = useCallback((index, size) => {
    sizeMap.current = { ...sizeMap.current, [index]: size };
    gridRef.current.resetAfterIndex(index);
  }, []);

  const itemCount = itemData.length;

  const getChildSize = (child: React.ReactNode) => {
    if (React.isValidElement(child) && child.type === ListSubheader) {
      return 48;
    }

    return itemSize;
  };

  const getHeight = () => {
    if (itemCount > 8) {
      return 8 * itemSize;
    }
    return itemData.map(getChildSize).reduce((a, b) => a + b, 0);
  };

  const getSize = (index) => sizeMap.current[index] || 50;

  const gridRef = useResetCache(itemData?.length);

  return (
    <div ref={ref}>
      <OuterElementContext.Provider value={other}>
        <div ref={(ref) => (ref?.offsetWidth ? (containerWidth.current = ref?.offsetWidth) : null)}>
          <VariableSizeList
            itemData={itemData}
            height={getHeight() + 2 * 6}
            width="100%"
            ref={gridRef}
            outerElementType={OuterElementType}
            innerElementType="ul"
            itemSize={getSize}
            overscanCount={5}
            itemCount={itemData?.length}
          >
            {({ data, index, style }) => (
              <li
                title={React.isValidElement(data[index]) ? data[index]?.props?.children : ''}
                style={style}
                tabIndex={-1}
                role="option"
                aria-selected={false}
                key={React.isValidElement(data[index]) ? data[index]?.props?.children : index}
                id={`mui-option-${index}`}
                data-option-index="77"
                aria-disabled="false"
              >
                <RenderRow
                  data={data}
                  minHeight={isMobile ? 35 : 36}
                  index={index}
                  setSize={setSize}
                  containerWidth={containerWidth.current}
                  style={style}
                  key={index}
                />
              </li>
            )}
          </VariableSizeList>
        </div>
      </OuterElementContext.Provider>
    </div>
  );
});

function dropdownOptions(options, values, fields, fieldData, newAddressOptionList = []) {
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
      // const optionDatas = options?.filter((o) => {
      //   if (has(o, fieldData?.fieldName)) {
      //     return isEmpty(o[fieldData?.fieldName]);
      //   } else return true;
      // });
      //oData = optionDatas;
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
        if (dependentFieldOption) {
          const dependentIds = dependentFieldOption[lookupDependentOnField] || [];
          let option = options;
          if (fieldData?.lookupResource === 'Address' && newAddressOptionList?.length) {
            newAddressOptionList?.forEach((ele: any) => {
              if (!option?.find((e) => e.optionValue === ele.optionValue)) {
                option.push(ele);
              }
            });
          }
          const newOptions = option?.filter((option: any) => dependentIds?.includes(option.optionValue)) || [];
          optionsToShow.push(...newOptions);
        }
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

  if (values[fieldData?.fieldName]) {
    if (Array.isArray(values[fieldData?.fieldName])) {
      values[fieldData?.fieldName]?.forEach((ele) => {
        if (!optionsToShow?.find((e) => e.optionValue === ele)) {
          const newAdd = options?.find((e) => e.optionValue === ele);
          if (newAdd) {
            optionsToShow.push(newAdd);
          }
        }
      });
    } else {
      if (!optionsToShow?.find((e) => e.optionValue === values[fieldData?.fieldName])) {
        const newAdd = options?.find((e) => e.optionValue === values[fieldData?.fieldName]);
        if (newAdd) {
          optionsToShow.push(newAdd);
        }
      }
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
  const { newAddressOptionList, setNewAddressOptionList } = React.useContext(NewAddressOptionList);

  const addFieldOption = async (_id: null) => {
    if (fieldData?.lookupDependentOn && fieldData?.lookupDependentOnField && _id) {
      const lookupResource = fields?.find((e) => e.fieldName === fieldData?.lookupDependentOn)?.lookupResource;
      const data = {
        lookupDependentOn: fieldData?.lookupDependentOn,
        lookupDependentOnValue: values[fieldData?.lookupDependentOn] || '',
        lookupDependentOnField: fieldData?.lookupDependentOnField,
        lookupDependentOnFieldValue: _id,
        resource: lookupResource
      };
      axiosInstance().put('/field/add-field-lookup', data);
    }
  };

  // const [extraOptions, setExtraOptions] = useState([]);
  // const [loading, setLoading] = useState(false);
  // const [inputValue, setInputValue] = useState('');

  // const fetchOptions = React.useCallback(debounce(async (searchKey: string = '') => {
  //   try {
  //     const lookupResourceName = fieldData?.lookupResource || lookupResource;
  //     let query = `sa-field/options?resource=${lookupResourceName}&limit=10&search=${searchKey}`;
  //     if(fieldData?.lookupDependentOn) {
  //       const key = fieldData?.lookupDependentOn;
  //       const val = values[fieldData?.lookupDependentOn];

  //       if(val !== undefined && val!=='') {
  //         query += `&lookupDependentOn=${key}&lookupDependentOnValue=${val}`;
  //         if(fieldData.lookupDependentOnField !== undefined && fieldData.lookupDependentOnField !== '') {
  //           query += `&lookupDependentOnField=${fieldData.lookupDependentOnField}`;
  //         }
  //       } else {
  //         setExtraOptions([]);
  //         setLoading(false);
  //         return;
  //       }
  //     }
  //     const response = await axiosInstance().get(query);
  //     const currentSelection = values[name] ? [...extraOptions].filter((data: any) => values[name].includes(data.optionValue)) : [];
  //     const newOptions = [...response.data.data];

  //     currentSelection.forEach(selectedOption => {
  //       const alreadyIncluded = newOptions.some(option => option.optionValue === selectedOption.optionValue);
  //       if (!alreadyIncluded) {
  //         newOptions.push(selectedOption);
  //       }
  //     });

  //     setExtraOptions(newOptions);
  //   } catch (error) {
  //     console.error(error);
  //   }
  //   setLoading(false);
  // }, 1000), [fieldData?.lookupResource, fieldData?.lookupDependentOn, values]);

  // const handleInputChangeMulti = (event, value, reason) => {
  //   if (reason === 'input') {
  //     setInputValue(event.target.value);
  //     fetchOptions(event.target.value);
  //   }
  // };

  const fieldDependentOn = fieldData?.lookupDependentOn ? fields?.find((d) => d.fieldName === fieldData?.lookupDependentOn) : null;
  const isDisabled = fieldData?.lookupDependentOn && fieldData?.lookupDependentOn !== '' && fieldDependentOn && !!!values[fieldDependentOn.fieldName];

  return (
    <Box key={fieldData?.lookupResource}>
      <Grid container spacing={1} style={{ flexWrap: 'nowrap' }}>
        <Grid item style={{ flexGrow: 1 }}>
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
                limitTags={2}
                multiple
                disabled={fieldData?.isUneditable || rest?.disabled || isDisabled}
                disableCloseOnSelect={true}
                options={[
                  ...(dropdownOptions(option, values, fields, fieldData).length > 0 ? [{ optionValue: 'selectAll', optionLabel: 'Select All' }] : []),
                  ...dropdownOptions(option, values, fields, fieldData)
                ]}
                getOptionLabel={(option: any) => {
                  return option ? option.optionLabel : '';
                }}
                ListboxComponent={ListboxComponent as React.ComponentType<React.HTMLAttributes<HTMLElement>>}
                value={
                  values[name]
                    ? [...dropdownOptions(option, values, fields, fieldData)].filter((data: any) => values[name].includes(data.optionValue))
                    : []
                }
                getOptionSelected={(option: any, val: any) => option.optionValue === val.optionValue}
                onChange={
                  onChange
                    ? (e, value: any, reason) => {
                        const isSelectedAll = value.some((val) => val.optionValue === 'selectAll');
                        if (isSelectedAll) {
                          onChange(e, dropdownOptions(option, values, fields, fieldData), reason);
                        } else {
                          onChange(e, value, reason);
                        }
                      }
                    : (e, value: any, reason) => {
                        if (setFieldValue) {
                          const isSelectedAll = value.some((val) => val.optionValue === 'selectAll');

                          if (isSelectedAll) {
                            // If "Select All" is selected, set all other options as values
                            setFieldValue(
                              name,
                              dropdownOptions(option, values, fields, fieldData).map((item) => item.optionValue)
                            );
                          } else {
                            // Remove "Select All" if it was selected and set the values accordingly
                            setFieldValue(
                              name,
                              value.map((val) => val.optionValue)
                            );
                          }
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
              <>
                <Autocomplete
                  {...rest}
                  limitTags={2}
                  disabled={fieldData?.isUneditable || rest?.disabled || isDisabled}
                  options={dropdownOptions(option, values, fields, fieldData, newAddressOptionList) || []}
                  getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
                  getOptionSelected={(option: any, val) => option.optionValue === val}
                  ListboxComponent={ListboxComponent as React.ComponentType<React.HTMLAttributes<HTMLElement>>}
                  value={
                    [...dropdownOptions(option, values, fields, fieldData, newAddressOptionList)].find(
                      (data: any) => data.optionValue === values[name]
                    ) || ''
                  }
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
                            const filterFields: any = fields.filter((d) => d.lookupDependentOn === name);
                            if (filterFields?.length) {
                              filterFields?.forEach((ele: any) => {
                                if (ele?.lookupDependentOnField && ele?.type === 'dropDown' && val && val[ele?.lookupDependentOnField]) {
                                  if (Array.isArray(val[ele?.lookupDependentOnField]) && val[ele?.lookupDependentOnField]?.length === 1) {
                                    setFieldValue(ele?.fieldName, val[ele?.lookupDependentOnField][0]);
                                  } else {
                                    setFieldValue(ele?.fieldName, val[ele?.lookupDependentOnField]);
                                  }
                                }
                              });
                            }
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
                {isDisabled && (
                  <span className="requiredStar px-1 text-[12px] text-green-500">{`Please select ${fieldDependentOn?.fieldLabel} first`}</span>
                )}
              </>
            )}
          </InfoLabel>
        </Grid>
        <div className="mt-2">
          {rest?.hidelookupAddButton ? null : fieldData?.addBulkOptions ? (
            <>
              <HtmlTooltip title={`Add ${fieldData.fieldLabel}`} className="formActionButton">
                <IconButton
                  disabled={fieldData?.isUneditable || rest?.disabled || isDisabled}
                  onClick={() => setLookupDialog(true)}
                  size="small"
                  color="primary"
                  style={{ marginBottom: touched[name] && Boolean(errors[name]) ? 25 : 0 }}
                >
                  <AddCircleIcon />
                </IconButton>
              </HtmlTooltip>
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
          ) : (
            <>
              {fieldData?.lookup && fieldData?.lookupResource === sidebarResource.padMaster && permissions?.padMaster?.isCreate && (
                <>
                  <>
                    <HtmlTooltip title={`Add ${fieldData.fieldLabel}`} className="formActionButton">
                      <IconButton
                        disabled={fieldData?.isUneditable || rest?.disabled || isDisabled}
                        onClick={() => setLookupDialog(true)}
                        size="small"
                        color="primary"
                        style={{ marginBottom: touched[name] && Boolean(errors[name]) ? 25 : 0 }}
                      >
                        <AddCircleIcon />
                      </IconButton>
                    </HtmlTooltip>
                    {lookupDialog && (
                      <ManagePadMaster
                        referenceData={
                          fieldData?.lookupDependentOn && values[fieldData?.lookupDependentOn]
                            ? { [fieldData?.lookupDependentOn]: values[fieldData?.lookupDependentOn] }
                            : null
                        }
                        isRedirectToDetailPage={false}
                        onClose={() => setLookupDialog(false)}
                        onSuccess={(data) => {
                          setLookupDialog(false);
                          if (data.padName && data._id) {
                            let tempNewOption = {
                              default: false,
                              optionLabel: data.padName,
                              optionValue: data._id,
                              order: option.length,
                              customerAccount: data?.customerAccount,
                              address: data?.address
                            };
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
              {fieldData?.lookup && fieldData?.lookupResource === sidebarResource.wellMaster && permissions?.wellMaster?.isCreate && (
                <>
                  <>
                    <HtmlTooltip title={`Add ${fieldData.fieldLabel}`} className="formActionButton">
                      <IconButton
                        disabled={fieldData?.isUneditable || rest?.disabled || isDisabled}
                        onClick={() => setLookupDialog(true)}
                        size="small"
                        color="primary"
                        style={{ marginBottom: touched[name] && Boolean(errors[name]) ? 25 : 0 }}
                      >
                        <AddCircleIcon />
                      </IconButton>
                    </HtmlTooltip>
                    {lookupDialog && (
                      <ManageWellMaster
                        referenceData={
                          fieldData?.lookupDependentOn && values[fieldData?.lookupDependentOn]
                            ? { [fieldData?.lookupDependentOn]: values[fieldData?.lookupDependentOn] }
                            : null
                        }
                        isRedirectToDetailPage={false}
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
                              customerAccount: data?.customerAccount,
                              padName: data?.padName,
                              address: data?.address
                            };
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

                            const filterFields: any = fields.filter((d) => d.lookupDependentOn === name);
                            if (filterFields?.length) {
                              filterFields?.forEach((ele: any) => {
                                if (ele?.lookupDependentOnField && ele?.type === 'dropDown' && tempNewOption[ele?.lookupDependentOnField]) {
                                  if (
                                    Array.isArray(tempNewOption[ele?.lookupDependentOnField]) &&
                                    tempNewOption[ele?.lookupDependentOnField]?.length === 1
                                  ) {
                                    setFieldValue(ele?.fieldName, tempNewOption[ele?.lookupDependentOnField][0]);
                                  } else {
                                    setFieldValue(ele?.fieldName, tempNewOption[ele?.lookupDependentOnField]);
                                  }
                                }
                              });
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
                    <HtmlTooltip title={`Add ${fieldData.fieldLabel}`} className="formActionButton">
                      <IconButton
                        disabled={fieldData?.isUneditable || rest?.disabled || isDisabled}
                        onClick={() => setLookupDialog(true)}
                        size="small"
                        color="primary"
                        style={{ marginBottom: touched[name] && Boolean(errors[name]) ? 25 : 0 }}
                      >
                        <AddCircleIcon />
                      </IconButton>
                    </HtmlTooltip>
                    {lookupDialog && (
                      <ManageWellNumber
                        referenceData={
                          fieldData?.lookupDependentOn && values[fieldData?.lookupDependentOn]
                            ? { [fieldData?.lookupDependentOn]: values[fieldData?.lookupDependentOn] }
                            : null
                        }
                        isRedirectToDetailPage={false}
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
                              wellMaster: data?.wellName,
                              customerAccount: data?.customerAccount,
                              address: data?.address
                            };
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

                            const filterFields: any = fields.filter((d) => d.lookupDependentOn === name);
                            if (filterFields?.length) {
                              filterFields?.forEach((ele: any) => {
                                if (ele?.lookupDependentOnField && ele?.type === 'dropDown' && tempNewOption[ele?.lookupDependentOnField]) {
                                  if (
                                    Array.isArray(tempNewOption[ele?.lookupDependentOnField]) &&
                                    tempNewOption[ele?.lookupDependentOnField]?.length === 1
                                  ) {
                                    setFieldValue(ele?.fieldName, tempNewOption[ele?.lookupDependentOnField][0]);
                                  } else {
                                    setFieldValue(ele?.fieldName, tempNewOption[ele?.lookupDependentOnField]);
                                  }
                                }
                              });
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
                    <HtmlTooltip title={`Add ${fieldData.fieldLabel}`} className="formActionButton">
                      <IconButton
                        disabled={fieldData?.isUneditable || rest?.disabled || isDisabled}
                        onClick={() => setLookupDialog(true)}
                        size="small"
                        color="primary"
                        style={{ marginBottom: touched[name] && Boolean(errors[name]) ? 25 : 0 }}
                      >
                        <AddCircleIcon />
                      </IconButton>
                    </HtmlTooltip>
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
                            setOptionsList([tempNewOption, ...option]);
                            if (type === 'multiSelect') {
                              handleChange(
                                name,
                                tempNewOption && tempNewOption.optionValue ? [...[...(values[name] || [])], tempNewOption.optionValue] : []
                              );
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
              {fieldData?.lookup && fieldData?.lookupResource === sidebarResource.storageLocation && permissions?.warehouse?.isCreate && (
                <>
                  <>
                    <HtmlTooltip title={`Add ${fieldData.fieldLabel}`} className="formActionButton">
                      <IconButton
                        disabled={fieldData?.isUneditable || rest?.disabled || isDisabled}
                        onClick={() => setLookupDialog(true)}
                        size="small"
                        color="primary"
                        style={{ marginBottom: touched[name] && Boolean(errors[name]) ? 25 : 0 }}
                      >
                        <AddCircleIcon />
                      </IconButton>
                    </HtmlTooltip>
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
                    <HtmlTooltip title={`Add ${fieldData.fieldLabel}`} className="formActionButton">
                      <IconButton
                        disabled={fieldData?.isUneditable || rest?.disabled || isDisabled}
                        onClick={() => setLookupDialog(true)}
                        size="small"
                        color="primary"
                        style={{ marginBottom: touched[name] && Boolean(errors[name]) ? 25 : 0 }}
                      >
                        <AddCircleIcon />
                      </IconButton>
                    </HtmlTooltip>
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
                    <HtmlTooltip title={`Add ${fieldData.fieldLabel}`} className="formActionButton">
                      <IconButton
                        disabled={fieldData?.isUneditable || rest?.disabled || isDisabled}
                        onClick={() => setLookupDialog(true)}
                        size="small"
                        color="primary"
                        style={{ marginBottom: touched[name] && Boolean(errors[name]) ? 25 : 0 }}
                      >
                        <AddCircleIcon />
                      </IconButton>
                    </HtmlTooltip>
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
                    <HtmlTooltip title={`Add ${fieldData.fieldLabel}`} className="formActionButton">
                      <IconButton
                        disabled={fieldData?.isUneditable || rest?.disabled || isDisabled}
                        onClick={() => setLookupDialog(true)}
                        size="small"
                        color="primary"
                        style={{ marginBottom: touched[name] && Boolean(errors[name]) ? 25 : 0 }}
                      >
                        <AddCircleIcon />
                      </IconButton>
                    </HtmlTooltip>
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
                              order: option.length,
                              billingAddress: data?.billingAddress || [],
                              shippingAddress: data?.shippingAddress || []
                            };
                            setOptionsList([tempNewOption, ...option]);
                            if (type === 'multiSelect') {
                              handleChange(
                                name,
                                tempNewOption && tempNewOption.optionValue ? [...[...(values[name] || [])], tempNewOption.optionValue] : []
                              );
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
              {fieldData?.lookup && fieldData?.lookupResource === sidebarResource.supplierAccount && permissions?.supplierAccount?.isCreate && (
                <>
                  <HtmlTooltip title={`Add ${fieldData.fieldLabel}`} className="formActionButton">
                    <IconButton
                      disabled={fieldData?.isUneditable || rest?.disabled || isDisabled}
                      onClick={() => setLookupDialog(true)}
                      size="small"
                      color="primary"
                      style={{ marginBottom: touched[name] && Boolean(errors[name]) ? 25 : 0 }}
                    >
                      <AddCircleIcon />
                    </IconButton>
                  </HtmlTooltip>
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
                            order: option.length,
                            billingAddress: data?.billingAddress || [],
                            shippingAddress: data?.shippingAddress || []
                          };
                          setOptionsList([tempNewOption, ...option]);
                          if (type === 'multiSelect') {
                            handleChange(
                              name,
                              tempNewOption && tempNewOption.optionValue ? [...[...(values[name] || [])], tempNewOption.optionValue] : []
                            );
                          } else {
                            handleChange(name, tempNewOption && tempNewOption.optionValue ? tempNewOption.optionValue : '');
                          }
                        }
                      }}
                    />
                  )}
                </>
              )}
              {fieldData?.lookup && fieldData?.lookupResource === sidebarResource.customerContact && permissions?.customerContact?.isCreate && (
                <>
                  <>
                    <HtmlTooltip title={`Add ${fieldData.fieldLabel}`} className="formActionButton">
                      <IconButton
                        disabled={fieldData?.isUneditable || rest?.disabled || isDisabled}
                        onClick={() => setLookupDialog(true)}
                        size="small"
                        color="primary"
                        style={{ marginBottom: touched[name] && Boolean(errors[name]) ? 25 : 0 }}
                      >
                        <AddCircleIcon />
                      </IconButton>
                    </HtmlTooltip>
                    {lookupDialog && (
                      <ManageContactDialog
                        contactApi={customerContact.contactApi}
                        contactResource={'customerContact'}
                        isClone={false}
                        contactId={null}
                        onClose={() => setLookupDialog(false)}
                        isRedirectToDetailPage={false}
                        referenceData={{ accountName: values[fieldData.lookupDependentOn] }}
                        onSuccess={(data) => {
                          setLookupDialog(false);
                          if (data?._id) {
                            let tempNewOption = {
                              default: true,
                              email: data?.email,
                              optionLabel: [data?.firstName, data?.middleName, data?.lastName].filter((d) => d).join(' '),
                              optionValue: data?._id,
                              order: option.length,
                              [fieldData.lookupDependentOn]: values[fieldData.lookupDependentOn]
                            };
                            setOptionsList([tempNewOption, ...option]);
                            if (type === 'multiSelect') {
                              handleChange(
                                name,
                                tempNewOption && tempNewOption.optionValue ? [...[...(values[name] || [])], tempNewOption.optionValue] : []
                              );
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
              {fieldData?.lookup && fieldData?.lookupResource === sidebarResource.supplierContact && permissions?.supplierContact?.isCreate && (
                <Box>
                  <>
                    <HtmlTooltip title={`Add ${fieldData.fieldLabel}`} className="formActionButton">
                      <IconButton
                        disabled={fieldData?.isUneditable || rest?.disabled || isDisabled}
                        onClick={() => setLookupDialog(true)}
                        size="small"
                        color="primary"
                        style={{ marginBottom: touched[name] && Boolean(errors[name]) ? 25 : 0 }}
                      >
                        <AddCircleIcon />
                      </IconButton>
                    </HtmlTooltip>
                    {lookupDialog && (
                      <ManageContactDialog
                        onClose={() => setLookupDialog(false)}
                        contactResource={'supplierContact'}
                        contactApi={supplierContact.contactApi}
                        isRedirectToDetailPage={false}
                        isClone={false}
                        contactId={null}
                        referenceData={{ accountName: values[fieldData.lookupDependentOn] }}
                        onSuccess={(data) => {
                          setLookupDialog(false);
                          if (data?._id) {
                            let tempNewOption = {
                              default: true,
                              email: data?.email,
                              optionLabel: data?.concatedName || data?.firstName + ' ' + data?.middleName + ' ' + data?.lastName,
                              optionValue: data?._id,
                              parentAccount: data?.accountName,
                              order: option.length,
                              [fieldData.lookupDependentOn]: values[fieldData.lookupDependentOn]
                            };
                            setOptionsList([tempNewOption, ...option]);
                            if (type === 'multiSelect') {
                              handleChange(
                                name,
                                tempNewOption && tempNewOption.optionValue ? [...[...(values[name] || [])], tempNewOption.optionValue] : []
                              );
                            } else {
                              handleChange(name, tempNewOption && tempNewOption.optionValue ? tempNewOption.optionValue : '');
                            }
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
                    <HtmlTooltip title={`Add ${fieldData.fieldLabel}`} className="formActionButton">
                      <IconButton
                        disabled={fieldData?.isUneditable || rest?.disabled || isDisabled}
                        onClick={() => setLookupDialog(true)}
                        size="small"
                        color="primary"
                        style={{ marginBottom: touched[name] && Boolean(errors[name]) ? 25 : 0 }}
                      >
                        <AddCircleIcon />
                      </IconButton>
                    </HtmlTooltip>
                    {lookupDialog && (
                      <ManageAddressDialog
                        onClose={() => setLookupDialog(false)}
                        onSuccess={(data) => {
                          setLookupDialog(false);
                          if (data?._id) {
                            let tempNewOption = {
                              optionLabel: data?.fullAddress,
                              optionValue: data?._id,
                              order: option.length,
                              ...(fieldData.lookupDependentOn && {
                                [fieldData.lookupDependentOn]: values[fieldData?.lookupDependentOn] || ''
                              })
                            };
                            addFieldOption(data?._id);
                            setOptionsList([tempNewOption, ...option]);
                            setNewAddressOptionList([...newAddressOptionList, tempNewOption]);
                            if (type === 'multiSelect') {
                              handleChange(
                                name,
                                tempNewOption && tempNewOption.optionValue ? [...[...(values[name] || [])], tempNewOption.optionValue] : []
                              );
                            } else {
                              handleChange(name, tempNewOption && tempNewOption.optionValue ? tempNewOption.optionValue : '');
                            }
                          }
                        }}
                        referenceData={{ region: values['region'] }}
                      />
                    )}
                  </>
                </>
              )}
              {fieldData?.lookup && fieldData?.lookupResource === sidebarResource.marketSegment && permissions?.marketSegment?.isCreate && (
                <>
                  <>
                    <HtmlTooltip title={`Add ${fieldData.fieldLabel}`} className="formActionButton">
                      <IconButton
                        disabled={fieldData?.isUneditable || rest?.disabled || isDisabled}
                        onClick={() => setLookupDialog(true)}
                        size="small"
                        color="primary"
                        style={{ marginBottom: touched[name] && Boolean(errors[name]) ? 25 : 0 }}
                      >
                        <AddCircleIcon />
                      </IconButton>
                    </HtmlTooltip>
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
                            setOptionsList([tempNewOption, ...option]);
                            if (type === 'multiSelect') {
                              handleChange(
                                name,
                                tempNewOption && tempNewOption.optionValue ? [...[...(values[name] || [])], tempNewOption.optionValue] : []
                              );
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
              {fieldData?.lookup &&
                !(camelCase(fieldData?.lookupResource) in routes) &&
                permissions[camelCase(fieldData?.lookupResource)]?.isCreate && (
                  <>
                    <>
                      <HtmlTooltip title={`Add ${fieldData.fieldLabel}`} className="formActionButton">
                        <IconButton
                          disabled={fieldData?.isUneditable || rest?.disabled || isDisabled}
                          onClick={() => setLookupDialog(true)}
                          size="small"
                          color="primary"
                          style={{ marginBottom: touched[name] && Boolean(errors[name]) ? 25 : 0 }}
                        >
                          <AddCircleIcon />
                        </IconButton>
                      </HtmlTooltip>
                      {lookupDialog && (
                        <ManageDynamicForm
                          resource={fieldData?.lookupResource}
                          id={null}
                          isClone={false}
                          onClose={() => setLookupDialog(false)}
                          redirected={false}
                          onSuccess={(data, primaryField) => {
                            setLookupDialog(false);
                            if (data?._id) {
                              let tempNewOption = {
                                default: true,
                                optionLabel: primaryField ? data?.[primaryField?.fieldName] : '',
                                optionValue: data?._id,
                                order: option.length,
                                ...(fieldData.lookupDependentOn && {
                                  [fieldData.lookupDependentOn]: data?.parentCategory || values[fieldData?.lookupDependentOn] || ''
                                })
                              };
                              setOptionsList([tempNewOption, ...option]);
                              if (type === 'multiSelect') {
                                handleChange(
                                  name,
                                  tempNewOption && tempNewOption.optionValue ? [...[...(values[name] || [])], tempNewOption.optionValue] : []
                                );
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
            </>
          )}
        </div>
      </Grid>
    </Box>
  );
}

export default Dropdown;
