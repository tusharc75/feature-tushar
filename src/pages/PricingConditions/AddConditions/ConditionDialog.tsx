import { useState, useEffect, Fragment, useContext } from 'react';
import { Formik, Form } from 'formik';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import Dialog from '@mui/material/Dialog';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition, MATERIAL_TYPE, PRICING_TYPE, getUniqueCurrencies } from './../../../constants/helpers';
import { pricingCondition } from '../../../constants/helpers';
import { Box, TextField, InputAdornment, Chip, Badge, Select, FormControl, InputLabel, IconButton, FormControlLabel, Checkbox } from '@mui/material';
import Grid from '@mui/material/Grid2';
import Autocomplete from '@mui/material/Autocomplete';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import { result, find, startCase, isEqual, camelCase, values, sortBy } from 'lodash';
import { FaDiceOne } from 'react-icons/fa';
import MenuItem from '@mui/material/MenuItem';
import { Delete } from '@mui/icons-material';
import MultipleEntry from './MultipleEntry';
import _ from 'lodash';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { useData } from 'src/StateProvider/Provider';

const ConditionDialog = ({ pricingConditionId, conditionData, handleClose, handleSuccess, detailData, isBulkedit, allowedToEdit, assetStatusField }) => {
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { permissions }
  }: any = useData();

  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [headerLabel, setHeaderLabel] = useState('');

  const [currency, setCurrency] = useState([detailData.currency]);
  const [unit, setUnits] = useState([]);
  const [pricingMethod, setPricingMethod] = useState([]);

  const [discount, setDiscount] = useState([]);
  const [tax, setTax] = useState([]);
  const [charge, setCharge] = useState([]);

  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    if (isBulkedit) {
      let unitArray: any = [];
      let pricingMethodArray: any = [];
      conditionData?.forEach((element) => {
        if (element?.[`${element.materialType}Detail`]?.unit) {
          unitArray.push([...element?.[`${element.materialType}Detail`].unit]);
        }
        if (element?.[`${element.materialType}Detail`]?.pricingMethod) {
          pricingMethodArray.push([...element?.[`${element.materialType}Detail`].pricingMethod]);
        }
      });
      let unit: any = unitArray?.shift().filter(function (v) {
        return unitArray?.every(function (a) {
          return a.indexOf(v) !== -1;
        });
      });
      let pricingMethod: any = pricingMethodArray?.shift()?.filter(function (v) {
        return pricingMethodArray?.every(function (a) {
          return a.indexOf(v) !== -1;
        });
      });
      setUnits(unit);
      setPricingMethod(pricingMethod);
      setHeaderLabel('Bulk Edit');
      setInitialData({});
    } else {
      if (!conditionData?.conditionType) {
        conditionData['conditionType'] = ['Rent'];
      }

      let details: any = {};
      if (conditionData?.materialType === MATERIAL_TYPE.product) {
        details = conditionData?.productDetail;
      } else if (conditionData?.materialType === MATERIAL_TYPE.service) {
        details = conditionData?.serviceDetail;
      } else if (conditionData?.materialType === MATERIAL_TYPE.package) {
        details = conditionData?.packageDetail;
      } else {
        details = conditionData?.competencyDetail;
      }
      if (details?.unit) {
        setUnits(details.unit);
      }
      if (details?.pricingMethod) {
        setPricingMethod(details.pricingMethod);
      }
      setHeaderLabel(
        startCase(conditionData?.materialType) +
        ' - ' +
        (conditionData?.materialType === 'product'
          ? details?.productName
          : conditionData?.materialType === 'service'
            ? details?.serviceName
            : conditionData?.materialType === 'package'
              ? details?.packageName
              : details?.competencyName)
      );
      currency.forEach((_currency) => {
        if (conditionData.materialType === 'competency') {
          if (conditionData['mrp' + '_' + _currency.toLowerCase()] === undefined) conditionData['mrp' + '_' + _currency.toLowerCase()] = 0;
          details?.pricingMethod?.map((_pricingMethod) => {
            if (conditionData['rent_' + camelCase(_pricingMethod.toLowerCase()) + '_' + _currency.toLowerCase()] == undefined)
              conditionData['rent_' + camelCase(_pricingMethod.toLowerCase()) + '_' + _currency.toLowerCase()] = 0;
          });
        } else {
          details?.unit?.map((_unit) => {
            if (conditionData['mrp' + '_' + _currency.toLowerCase() + '_' + camelCase(_unit.toLowerCase())] === undefined)
              conditionData['mrp' + '_' + _currency.toLowerCase() + '_' + camelCase(_unit.toLowerCase())] = 0;
            details?.pricingMethod?.map((_pricingMethod) => {
              const _fieldName = `rent_${camelCase(_pricingMethod.toLowerCase())}_${_currency.toLowerCase()}_${camelCase(_unit.toLowerCase())}`
              if (conditionData[_fieldName] == undefined) {
                conditionData[_fieldName] = 0;
              }

              if (conditionData?.minimumPrice?.[_fieldName] == undefined) {
                if (!conditionData?.minimumPrice) {
                  conditionData.minimumPrice = {}
                }
                conditionData.minimumPrice[_fieldName] = 0
              }

            });
          });
        }
      });
      setInitialData(conditionData);
    }
  }, [conditionData]);

  const handleSubmit = (v) => {
    setLoading(true);
    const updatedData = {};
    currency.forEach((_currency) => {
      if (conditionData.materialType === 'competency') {
        v.conditionType?.includes('Rent') &&
          v['pricingMethod']?.map((_pricingMethod) => {
            updatedData['rent_' + camelCase(_pricingMethod.toLowerCase()) + '_' + _currency.toLowerCase()] =
              v['rent_' + camelCase(_pricingMethod.toLowerCase()) + '_' + _currency.toLowerCase()];
          });
      } else {
        v['unit']?.map((_unit) => {
          if (v.conditionType?.includes('Price')) {
            const data = v['mrp' + '_' + _currency.toLowerCase() + '_' + camelCase(_unit.toLowerCase())];
            updatedData['mrp' + '_' + _currency.toLowerCase() + '_' + camelCase(_unit.toLowerCase())] =
              v['mrp' + '_' + _currency.toLowerCase() + '_' + camelCase(_unit.toLowerCase())];
          }
          v.conditionType?.includes('Rent') &&
            v['pricingMethod']?.map((_pricingMethod) => {
              const _fieldName = `rent_${camelCase(_pricingMethod.toLowerCase())}_${_currency.toLowerCase()}_${camelCase(_unit.toLowerCase())}`
              updatedData[_fieldName] = v[_fieldName];
              if (v?.enableMinimumPrice) {
                if (!updatedData['minimumPrice']) {
                  updatedData['minimumPrice'] = {}
                }
                updatedData['minimumPrice'][_fieldName] = v?.minimumPrice?.[_fieldName]
              }
            });
        });
      }
    });

    delete v?.minimumPrice

    Object.keys(v).forEach((key) => {
      if (!(key.indexOf('_') !== -1 && key !== '_id' && key?.split('_')?.length)) {
        updatedData[key] = v[key];
      }
    });
    const values: any = updatedData;

    let data = [];

    if (values.conditionType.includes('Discount')) {
      values.discount = discount;
    } else {
      delete values.discount;
    }
    if (values.conditionType.includes('Charge')) {
      values.charge = charge;
    } else {
      delete values.charge;
    }
    if (values.conditionType.includes('Tax')) {
      values.tax = tax;
    } else {
      delete values.tax;
    }
    delete values.productDetail;
    delete values.packageDetail;
    if (isBulkedit) {
      conditionData.forEach((element) => {
        data.push({ ...element, ...values });
      });
    } else {
      data = [values];
    }


    axiosInstance()
      .put(`${pricingCondition.api}/condition/${pricingConditionId}`, { condition: data })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setLoading(false);
        handleSuccess();
      })
      .catch((error) => {
        setLoading(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleChangeValue = (index, fieldName, value) => {
    const _list = [...discount];
    _list[index][fieldName] = value;
    setDiscount(_list);
  };

  const handleChangeChargeValue = (index, fieldName, value) => {
    const _charge = [...charge];
    _charge[index][fieldName] = value;
    setCharge(_charge);
  };

  const handleChangeTaxValue = (index, fieldName, value) => {
    const _tax = [...tax];
    _tax[index][fieldName] = value;
    setTax(_tax);
  };

  const valueTouch = {};
  const validate = (values) => {
    const errors: any = {};
    if (!Array.isArray(values?.conditionType) || values.conditionType.length === 0) {
      errors['conditionType'] = 'Pricing type is required';
    }
    if (conditionData.materialType !== 'competency' && (!Array.isArray(values.unit) || values.unit.length === 0)) {
      errors['unit'] = 'Unit is required';
    }
    currency.forEach((_currency) => {
      if (conditionData?.materialType === 'competency') {
        values.conditionType?.includes('Rent') &&
          values['pricingMethod']?.map((_pricingMethod) => {
            const data = values['rent_' + camelCase(_pricingMethod.toLowerCase()) + '_' + _currency.toLowerCase()];
            if (isNaN(data)) {
              errors['rent_' + camelCase(_pricingMethod.toLowerCase()) + '_' + _currency.toLowerCase()] = 'Price is required';
            }
            if (data === undefined) {
              errors['rent_' + camelCase(_pricingMethod.toLowerCase()) + '_' + _currency.toLowerCase()] = 'Enter valid price';
            }
            if (parseFloat(data) <= 0) {
              errors['rent_' + camelCase(_pricingMethod.toLowerCase()) + '_' + _currency.toLowerCase()] = 'Enter valid price';
            }
          });
      } else {
        values['unit']?.map((_unit) => {
          if (values.conditionType?.includes('Price')) {
            const data = values['mrp' + '_' + _currency.toLowerCase() + '_' + camelCase(_unit.toLowerCase())];
            if (isNaN(data)) {
              valueTouch['mrp' + '_' + _currency.toLowerCase() + '_' + camelCase(_unit.toLowerCase())] = true;
              errors['mrp' + '_' + _currency.toLowerCase() + '_' + camelCase(_unit.toLowerCase())] = 'Price is required';
            }
            if (data === undefined) {
              errors['mrp' + '_' + _currency.toLowerCase() + '_' + camelCase(_unit.toLowerCase())] = 'Enter valid price';
            }
            if (parseFloat(data) <= 0) {
              errors['mrp' + '_' + _currency.toLowerCase() + '_' + camelCase(_unit.toLowerCase())] = 'Enter valid price';
            }
          }
          values.conditionType?.includes('Rent') &&
            values['pricingMethod']?.map((_pricingMethod) => {
              const _fieldName = `rent_${camelCase(_pricingMethod.toLowerCase())}_${_currency.toLowerCase()}_${camelCase(_unit.toLowerCase())}`
              if (isNaN(values[_fieldName])) {
                errors[_fieldName] = 'Price is required';
              }
              if (values[_fieldName] === undefined) {
                errors[_fieldName] = 'Enter valid price';
              }
              if (parseFloat(values[_fieldName]) <= 0) {
                errors[_fieldName] = 'Enter valid price';
              }

            });
        });
      }
    });
    return errors;
  };

  return (
    <Dialog
      maxWidth="md"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true);
        }
      }}
      fullWidth
    >
      {initialData ? (
        <Formik enableReinitialize={true} initialValues={initialData} validateOnMount onSubmit={handleSubmit} validate={validate}>
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                title={headerLabel}
                onClose={() => {
                  handleClose();
                }}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              ></CustomDialogHeader>
              <CustomDialogContent>
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  <Fragment>
                    <div className={'detail-box-content'}>
                      <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                      <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>Pricing</h2>
                    </div>
                    <Box marginTop={1} marginBottom={1}>
                      <Grid spacing={3} container>
                        <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                          <Autocomplete
                            multiple
                            id="conditionType"
                            options={
                              conditionData?.materialType === 'competency' ? PRICING_TYPE.filter((ele) => ele.optionValue === 'Rent') : PRICING_TYPE
                            }
                            getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                            isOptionEqualToValue={(option: any, val) => option.optionValue === val}
                            value={PRICING_TYPE.filter((data) => values['conditionType']?.includes(data.optionValue))}
                            onChange={(e, val) => {
                              setFieldValue(
                                'conditionType',
                                val?.map((e) => e.optionValue)
                              );
                            }}
                            disabled={!allowedToEdit}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                margin="dense"
                                size="small"
                                name="conditionType"
                                variant="outlined"
                                label="Pricing Type"
                                required
                                error={touched['conditionType'] && Boolean(errors['conditionType'])}
                                helperText={touched['conditionType'] && errors['conditionType']}
                              />
                            )}
                          />
                        </Grid>
                        {conditionData?.materialType !== 'competency' && (
                          <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                            <Autocomplete
                              multiple
                              disableCloseOnSelect={true}
                              id="autocompleteunits"
                              options={unit}
                              value={values['unit'] ? values['unit'] : []}
                              renderTags={(value: string[], getTagProps) =>
                                value.map((option: string, index: number) => <Chip variant="outlined" label={option} {...getTagProps({ index })} />)
                              }
                              onChange={(e, value) => {
                                setFieldValue('unit', value);
                              }}
                              disabled={!allowedToEdit}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  margin="dense"
                                  size="small"
                                  name="unit"
                                  variant="outlined"
                                  label="Unit"
                                  required
                                  error={touched['unit'] && Boolean(errors['unit'])}
                                  helperText={touched['unit'] && errors['unit']}
                                />
                              )}
                            />
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                  </Fragment>

                  {values.conditionType?.includes('Price') && (
                    <Fragment>
                      <div className={'detail-box-content'}>
                        <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                        <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>Sell</h2>
                      </div>
                      <Box marginTop={1} marginBottom={1}>
                        <Grid spacing={3} container>
                          {currency &&
                            currency.map(
                              (_currency, i) =>
                                values['unit'] &&
                                values['unit'].map((_unit, j) => (
                                  <Grid size={{ xs: 12, sm: 6, md: 6 }} key={i + j + 1}>
                                    <TextField
                                      id="mrp"
                                      name="mrp"
                                      variant="outlined"
                                      margin="dense"
                                      size="small"
                                      fullWidth
                                      disabled={!allowedToEdit}
                                      label={'Rate ' + _unit + ' ' + _currency}
                                      type="number"
                                      onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                                      value={values['mrp' + '_' + _currency.toLowerCase() + '_' + camelCase(_unit.toLowerCase())]}
                                      onChange={(e) => {
                                        setFieldValue(
                                          'mrp' + '_' + _currency.toLowerCase() + '_' + camelCase(_unit.toLowerCase()),
                                          parseFloat(e.target.value)
                                        );
                                      }}
                                      slotProps={{
                                        input: {
                                          startAdornment: (
                                            <InputAdornment position="start">
                                              {result(
                                                find(getUniqueCurrencies(), function (obj) {
                                                  return obj.currencyCode === _currency;
                                                }),
                                                'symbolNative'
                                              )}
                                            </InputAdornment>
                                          ),
                                          inputProps: { min: 0, max: 9999999999 }
                                        }
                                      }}
                                      error={
                                        touched['mrp' + '_' + _currency.toLowerCase() + '_' + camelCase(_unit.toLowerCase())] &&
                                        Boolean(errors['mrp' + '_' + _currency.toLowerCase() + '_' + camelCase(_unit.toLowerCase())])
                                      }
                                      helperText={
                                        touched['mrp' + '_' + _currency.toLowerCase() + '_' + camelCase(_unit.toLowerCase())] &&
                                        errors['mrp' + '_' + _currency.toLowerCase() + '_' + camelCase(_unit.toLowerCase())]
                                      }
                                    />
                                  </Grid>
                                ))
                            )}
                        </Grid>
                      </Box>
                    </Fragment>
                  )}

                  {values.conditionType?.includes('Rent') && (
                    <Fragment>
                      <div className={'detail-box-content'}>
                        <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                        <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>Rent</h2>
                      </div>
                      <Box marginTop={1} marginBottom={1}>
                        <Grid spacing={3} container>
                          <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                            <Autocomplete
                              multiple
                              id="tags-filled"
                              disableCloseOnSelect={true}
                              options={pricingMethod}
                              getOptionLabel={(option: any) => option}
                              renderTags={(value: string[], getTagProps) =>
                                value.map((option: string, index: number) => <Chip variant="outlined" label={option} {...getTagProps({ index })} />)
                              }
                              disabled={!allowedToEdit}
                              value={values['pricingMethod']}
                              onChange={(e, value) => {
                                setFieldValue('pricingMethod', value);
                              }}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  margin="dense"
                                  size="small"
                                  variant="outlined"
                                  name="pricingMethod"
                                  label="Pricing Method"
                                  error={touched['pricingMethod'] && Boolean(errors['pricingMethod'])}
                                  helperText={touched['pricingMethod'] && errors['pricingMethod']}
                                />
                              )}
                            />
                          </Grid>
                        </Grid>
                        <div className='mt-2 border p-2'>
                          <RentPriceBox
                            conditionData={conditionData}
                            values={values}
                            setFieldValue={setFieldValue}
                            currency={currency}
                            allowedToEdit={allowedToEdit}
                            touched={touched}
                            errors={errors}
                          />
                        </div>
                        <div className='mt-2 border p-2'>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={values['enableMinimumPrice']}
                                onChange={(e) => {
                                  setFieldValue('enableMinimumPrice', e?.target?.checked);
                                  if (!e?.target?.checked) {
                                    setFieldValue('minimumPrice', {})
                                  }
                                }}
                                name="enableMinimumPrice"
                                color="primary"
                              />
                            }
                            label="Enable Minimum Price"
                          />
                          {values['enableMinimumPrice'] && values['pricingMethod']?.length > 0 && values['unit']?.length > 0 && (
                            <RentPriceBox
                              conditionData={conditionData}
                              values={values}
                              setFieldValue={setFieldValue}
                              currency={currency}
                              allowedToEdit={allowedToEdit}
                              minimumPrice={true}
                            />
                          )}
                        </div>
                        <div className='mt-2 border p-2'>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={values['enableDurationBasedPricing']}
                                onChange={(e) => {
                                  setFieldValue('enableDurationBasedPricing', e?.target?.checked);
                                  if (!e?.target?.checked) {
                                    setFieldValue('durationBasedPricing', [])
                                  }
                                }}
                                name="enableDurationBasedPricing"
                                color="primary"
                              />
                            }
                            label="Enable Duration Based Pricing"
                          />
                          {values['enableDurationBasedPricing'] && values['pricingMethod']?.length > 0 && values['unit']?.length > 0 && (
                            <DurationBasedPricing
                              values={values}
                              setFieldValue={setFieldValue}
                              currency={currency}

                            />
                          )}
                        </div>
                        {permissions?.serializedAsset?.isRead && (
                          <div className='mt-2 border p-2'>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={values['enableAssetStatusWisePricing']}
                                  onChange={(e) => {
                                    setFieldValue('enableAssetStatusWisePricing', e?.target?.checked);
                                    if (!e?.target?.checked) {
                                      setFieldValue('assetStatusWisePricing', [])
                                    }
                                  }}
                                  name="enableAssetStatusWisePricing"
                                  color="primary"
                                />
                              }
                              label="Enable Asset Status Wise Pricing"
                            />
                            {values['enableAssetStatusWisePricing'] && (
                              <div className='mt-2'>
                                <Autocomplete
                                  multiple
                                  id="status"
                                  options={assetStatusField?.option || []}
                                  getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
                                  isOptionEqualToValue={(option: any, val) => option?.optionValue === val}
                                  value={[...assetStatusField?.option || []]?.filter(o => [...values['assetStatusWisePricing'] || []]?.map(a => a?.status)?.includes(o?.optionValue))}
                                  onChange={(e, val) => {
                                    const newObj: any = {};
                                    currency.forEach((_currency) => {
                                      values['unit']?.map((_unit) => {
                                        values['pricingMethod']?.map((_pricingMethod) => {
                                          newObj[`rent_${camelCase(_pricingMethod.toLowerCase())}_${_currency.toLowerCase()}_${camelCase(_unit.toLowerCase())}`] = 0
                                        });
                                      });
                                    }
                                    );
                                    setFieldValue('assetStatusWisePricing', val?.map(v => {
                                      const _v = values['assetStatusWisePricing']?.find(a => a?.status === v?.optionValue)
                                      return ({
                                        ...newObj,
                                        ..._v,
                                        status: v?.optionValue
                                      })
                                    }))
                                  }}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      margin="dense"
                                      size="small"
                                      name="status"
                                      variant="outlined"
                                      label="Status"
                                    />
                                  )}
                                />
                                {values['pricingMethod']?.length > 0 && values['unit']?.length > 0 && values['assetStatusWisePricing'] && values['assetStatusWisePricing']?.length > 0 && values['assetStatusWisePricing']?.map(value => (
                                  <RentPriceBox
                                    conditionData={conditionData}
                                    values={values}
                                    setFieldValue={setFieldValue}
                                    currency={currency}
                                    allowedToEdit={true}
                                    status={value?.status}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </Box>
                    </Fragment>
                  )}

                  {values.conditionType?.includes('Discount') && (
                    <Fragment>
                      <div className={'detail-box-content'}>
                        <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                        <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>Discount</h2>
                      </div>
                      <Box marginTop={2} marginBottom={1}>
                        <ThemeButton
                          buttonType="transparent"
                          onClick={() => {
                            setDiscount([
                              ...discount,
                              {
                                type: 'Flat',
                                amount: 0,
                                minTransAmount: 0,
                                maxDiscount: 0,
                                group: []
                              }
                            ]);
                          }}
                        >
                          Add Discount
                        </ThemeButton>
                      </Box>
                      {discount.map((val, index) => (
                        <Box key={index} mb={2}>
                          <Badge badgeContent={index + 1} color="primary"></Badge>
                          <Box p={2} border={1} borderColor="var(--common-border-color)">
                            <Grid spacing={3} container>
                              <Grid size={{ xs: 12, sm: 2, md: 2 }}>
                                <FormControl fullWidth margin="dense" size="small" variant="outlined">
                                  <InputLabel id="demo-simple-select-outlined-label">Discount Type</InputLabel>
                                  <Select
                                    labelId="demo-simple-select-outlined-label"
                                    id="demo-simple-select-outlined"
                                    value={val.type}
                                    onChange={(e) => {
                                      handleChangeValue(index, 'type', e.target.value);
                                    }}
                                    label="Type"
                                    name={'type_' + index}
                                    size="small"
                                  >
                                    <MenuItem value="Flat">Flat</MenuItem>
                                    <MenuItem value="Percentage">Percentage</MenuItem>
                                    <MenuItem value="Group Flat">Group Flat</MenuItem>
                                    <MenuItem value="Group Percentage">Group Percentage</MenuItem>
                                  </Select>
                                </FormControl>
                              </Grid>
                              {(val.type === 'Flat' || val.type === 'Percentage') && (
                                <Fragment>
                                  <Grid size={{ xs: 12, sm: 2, md: 2 }}>
                                    <TextField
                                      id="amount"
                                      name="amount"
                                      variant="outlined"
                                      margin="dense"
                                      size="small"
                                      fullWidth
                                      label={'Discount ' + (val.type === 'Flat' ? ' Amount' : ' Percentage')}
                                      type="number"
                                      onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                                      value={val.amount}
                                      onChange={(e) => handleChangeValue(index, 'amount', parseFloat(e.target.value))}
                                    />
                                  </Grid>
                                  <Grid size={{ xs: 12, sm: 2, md: 2 }}>
                                    <TextField
                                      id="minTransAmount"
                                      name="minTransAmount"
                                      variant="outlined"
                                      margin="dense"
                                      size="small"
                                      fullWidth
                                      label="Minimum Trans. Amount"
                                      type="number"
                                      onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                                      value={val.minTransAmount}
                                      onChange={(e) => handleChangeValue(index, 'minTransAmount', parseFloat(e.target.value))}
                                    />
                                  </Grid>
                                  <Grid size={{ xs: 12, sm: 2, md: 2 }}>
                                    <TextField
                                      id="maxDiscount"
                                      name="maxDiscount"
                                      variant="outlined"
                                      margin="dense"
                                      size="small"
                                      fullWidth
                                      label="Maximum Discount"
                                      type="number"
                                      onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                                      value={val.maxDiscount}
                                      onChange={(e) => handleChangeValue(index, 'maxDiscount', parseFloat(e.target.value))}
                                    />
                                  </Grid>
                                </Fragment>
                              )}
                              <Grid
                                container
                                justifyContent="flex-end"
                                size={{
                                  xs: 12,
                                  sm: val.type === 'Flat' || val.type === 'Percentage' ? 4 : 10,
                                  md: val.type === 'Flat' || val.type === 'Percentage' ? 4 : 10
                                }}
                              >
                                <IconButton
                                  size="small"
                                  aria-label="delete"
                                  onClick={() => {
                                    const _list = [...discount];
                                    _list.splice(index, 1);
                                    setDiscount(_list);
                                  }}
                                >
                                  <Delete color="error" />
                                </IconButton>
                              </Grid>
                            </Grid>
                            {(val.type === 'Group Flat' || val.type === 'Group Percentage') && (
                              <Grid container>
                                <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                                  <MultipleEntry
                                    discount={discount}
                                    index={index}
                                    setDiscount={setDiscount}
                                    fieldNames={['qty', 'amount']}
                                    fieldLabels={val.type === 'Group Flat' ? ['Quantity', 'Discount Amount'] : ['Quantity', 'Discount Percentage']}
                                    label="Group Discount"
                                  />
                                </Grid>
                              </Grid>
                            )}
                          </Box>
                        </Box>
                      ))}
                    </Fragment>
                  )}

                  {values.conditionType?.includes('Charge') && (
                    <Fragment>
                      <div className={'detail-box-content'}>
                        <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                        <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>Charge</h2>
                      </div>
                      <Box marginTop={2} marginBottom={1}>
                        <ThemeButton
                          buttonType="transparent"
                          onClick={() => {
                            setCharge([
                              ...charge,
                              {
                                type: 'Flat',
                                label: '',
                                amount: 0
                              }
                            ]);
                          }}
                        >
                          Add Charge
                        </ThemeButton>
                      </Box>
                      {charge.map((val, index) => (
                        <Box key={index} mb={2}>
                          <Badge badgeContent={index + 1} color="primary"></Badge>
                          <Box p={2} border={1} borderColor="var(--common-border-color)">
                            <Grid spacing={3} container>
                              <Grid size={{ xs: 12, sm: 2, md: 2 }}>
                                <TextField
                                  id="label"
                                  name="label"
                                  variant="outlined"
                                  margin="dense"
                                  size="small"
                                  fullWidth
                                  label={'Charge Name'}
                                  type="text"
                                  value={val.label}
                                  onChange={(e) => handleChangeChargeValue(index, 'label', e.target.value)}
                                />
                              </Grid>
                              <Grid size={{ xs: 12, sm: 2, md: 2 }}>
                                <FormControl fullWidth margin="dense" size="small" variant="outlined">
                                  <InputLabel id="demo-simple-select-outlined-label">Charge Type</InputLabel>
                                  <Select
                                    labelId="demo-simple-select-outlined-label"
                                    id="demo-simple-select-outlined"
                                    value={val.type}
                                    onChange={(e) => {
                                      handleChangeChargeValue(index, 'type', e.target.value);
                                    }}
                                    label="Type"
                                    name={'type_' + index}
                                    size="small"
                                  >
                                    <MenuItem value="Flat">Flat</MenuItem>
                                    <MenuItem value="Percentage">Percentage</MenuItem>
                                  </Select>
                                </FormControl>
                              </Grid>
                              <Grid size={{ xs: 12, sm: 2, md: 2 }}>
                                <TextField
                                  id="amount"
                                  name="amount"
                                  variant="outlined"
                                  margin="dense"
                                  size="small"
                                  fullWidth
                                  label={'Charge ' + (val.type === 'Flat' ? ' Amount' : ' Percentage')}
                                  type="number"
                                  onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                                  value={val.amount}
                                  onChange={(e) => handleChangeChargeValue(index, 'amount', parseFloat(e.target.value))}
                                />
                              </Grid>
                              <Grid container justifyContent="flex-end" size={{ xs: 12, sm: 6, md: 6 }}>
                                <IconButton
                                  size="small"
                                  aria-label="delete"
                                  onClick={() => {
                                    const _charge = [...charge];
                                    _charge.splice(index, 1);
                                    setCharge(_charge);
                                  }}
                                >
                                  <Delete color="error" />
                                </IconButton>
                              </Grid>
                            </Grid>
                          </Box>
                        </Box>
                      ))}
                    </Fragment>
                  )}

                  {values.conditionType?.includes('Tax') && (
                    <Fragment>
                      <div className={'detail-box-content'}>
                        <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                        <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>Tax</h2>
                      </div>
                      <Box marginTop={2} marginBottom={1}>
                        <ThemeButton
                          buttonType="transparent"
                          onClick={() => {
                            setTax([
                              ...tax,
                              {
                                type: 'Flat',
                                taxCode: '',
                                amount: 0
                              }
                            ]);
                          }}
                        >
                          Add Tax
                        </ThemeButton>
                      </Box>
                      {tax.map((val, index) => (
                        <Box key={index} mb={2}>
                          <Badge badgeContent={index + 1} color="primary"></Badge>
                          <Box p={2} border={1} borderColor="var(--common-border-color)">
                            <Grid spacing={3} container>
                              <Grid size={{ xs: 12, sm: 2, md: 2 }}>
                                <TextField
                                  id="taxCode"
                                  name="taxCode"
                                  variant="outlined"
                                  margin="dense"
                                  size="small"
                                  fullWidth
                                  label={'Tax Code'}
                                  type="text"
                                  value={val.taxCode}
                                  onChange={(e) => handleChangeTaxValue(index, 'taxCode', e.target.value)}
                                />
                              </Grid>
                              <Grid size={{ xs: 12, sm: 2, md: 2 }}>
                                <FormControl fullWidth margin="dense" size="small" variant="outlined">
                                  <InputLabel id="demo-simple-select-outlined-label">Tax Type</InputLabel>
                                  <Select
                                    labelId="demo-simple-select-outlined-label"
                                    id="demo-simple-select-outlined"
                                    value={val.type}
                                    onChange={(e) => {
                                      handleChangeTaxValue(index, 'type', e.target.value);
                                    }}
                                    label="Type"
                                    name={'type_' + index}
                                  >
                                    <MenuItem value="Flat">Flat</MenuItem>
                                    <MenuItem value="Percentage">Percentage</MenuItem>
                                  </Select>
                                </FormControl>
                              </Grid>
                              <Grid size={{ xs: 12, sm: 2, md: 2 }}>
                                <TextField
                                  id="amount"
                                  name="amount"
                                  variant="outlined"
                                  margin="dense"
                                  size="small"
                                  fullWidth
                                  label={'Tax ' + (val.type === 'Flat' ? ' Amount' : ' Percentage')}
                                  type="number"
                                  onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                                  value={val.amount}
                                  onChange={(e) => handleChangeTaxValue(index, 'amount', parseFloat(e.target.value))}
                                />
                              </Grid>
                              <Grid container justifyContent="flex-end" size={{ xs: 12, sm: 6, md: 6 }}>
                                <IconButton
                                  size="small"
                                  aria-label="delete"
                                  onClick={() => {
                                    const _tax = [...tax];
                                    _tax.splice(index, 1);
                                    setTax(_tax);
                                  }}
                                >
                                  <Delete color="error" />
                                </IconButton>
                              </Grid>
                            </Grid>
                          </Box>
                        </Box>
                      ))}
                    </Fragment>
                  )}
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <ThemeButton
                  buttonType="transparent"
                  onClick={() => {
                    handleClose();
                  }}
                >
                  {'Close'}
                </ThemeButton>
                {allowedToEdit && (
                  <ThemeButton isLoading={loading} buttonType="theme" onClick={submitForm}>
                    {' '}
                    Save
                  </ThemeButton>
                )}
              </CustomDialogFooter>
              {showConfirmDialog ? (
                <ConfirmCancelDialog
                  open={showConfirmDialog}
                  onSave={() => {
                    setShowConfirmDialog(false);
                    submitForm();
                  }}
                  onClose={() => {
                    setShowConfirmDialog(false);
                    handleClose();
                  }}
                />
              ) : null}
            </Fragment>
          )}
        </Formik>
      ) : null}
    </Dialog>
  );
};

export default ConditionDialog;

const RentPriceBox = ({ conditionData, values, setFieldValue, currency, allowedToEdit, touched = null, errors = null, minimumPrice = false, status = '' }) => {
  const value = minimumPrice ? values?.minimumPrice || {} : status ? values['assetStatusWisePricing']?.find(a => a?.status === status) || {} : values
  return (
    <div className={`mt-2 p-2 ${status ? 'border' : ''}`}>
      {status && <div>{status}</div>}
      <table>
        <thead>
          <tr>
            <th></th>
            {currency &&
              currency.map(
                (_currency, i) => values['unit'] && values['unit'].map((_unit, j) => <th key={j}>{_unit + ' ' + _currency}</th>)
              )}
          </tr>
        </thead>
        <tbody>
          {values['pricingMethod'] &&
            values['pricingMethod'].map((_pricingMethod, i) => (
              <tr key={i}>
                <th style={{ paddingRight: 10, minWidth: 50 }}>{startCase(_pricingMethod)}</th>
                {currency &&
                  currency.map((_currency, j) => {
                    const _fieldName = `rent_${camelCase(_pricingMethod.toLowerCase())}_${_currency.toLowerCase()}`

                    return values['unit'] ? (
                      values['unit'].map((_unit, k) => {
                        const __fieldName = `${_fieldName}_${camelCase(_unit.toLowerCase())}`
                        return (
                          <td key={j + k}>
                            <TextField
                              name={__fieldName}
                              disabled={!allowedToEdit}
                              variant="outlined"
                              margin="dense"
                              size="small"
                              fullWidth
                              type="number"
                              onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                              style={{ margin: 0 }}
                              value={value[__fieldName]}
                              onChange={(e) => {
                                if (status) {
                                  const assetStatusWisePricing = [...values['assetStatusWisePricing']]
                                  assetStatusWisePricing?.forEach(a => {
                                    if (a?.status === status) {
                                      a[__fieldName] = parseFloat(e.target.value)
                                    }
                                  });
                                  setFieldValue('assetStatusWisePricing', assetStatusWisePricing)
                                } else if (minimumPrice) {
                                  setFieldValue(`minimumPrice.${__fieldName}`, parseFloat(e.target.value));
                                } else {
                                  setFieldValue(__fieldName, parseFloat(e.target.value));
                                }
                              }}
                              slotProps={{
                                input: {
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      {result(
                                        find(getUniqueCurrencies(), function (obj) {
                                          return obj.currencyCode === _currency;
                                        }),
                                        'symbolNative'
                                      )}
                                    </InputAdornment>
                                  ),
                                  inputProps: { min: 0, max: 9999999999 }
                                }
                              }}
                              error={touched && errors && touched[__fieldName] && Boolean(errors[__fieldName])}
                              helperText={touched && errors && touched[__fieldName] && errors[__fieldName]}
                            />
                          </td>
                        )
                      })
                    ) : conditionData.materialType === 'competency' ? (
                      <td key={j}>
                        <TextField
                          name={_fieldName}
                          variant="outlined"
                          margin="dense"
                          size="small"
                          fullWidth
                          disabled={!allowedToEdit}
                          type="number"
                          onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                          style={{ margin: 0 }}
                          value={value[_fieldName]}
                          onChange={(e) => {
                            setFieldValue(_fieldName, parseFloat(e.target.value));
                          }}
                          slotProps={{
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  {result(
                                    find(getUniqueCurrencies(), function (obj) {
                                      return obj.currencyCode === _currency;
                                    }),
                                    'symbolNative'
                                  )}
                                </InputAdornment>
                              ),
                              inputProps: { min: 0, max: 9999999999 }
                            }
                          }}
                          error={touched && errors && touched[_fieldName] && Boolean(errors[_fieldName])}
                          helperText={touched && errors && touched[_fieldName] && errors[_fieldName]}
                        />
                      </td>
                    ) : null
                  })}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}

const DurationBasedPricing = ({ values, setFieldValue, currency }) => {
  return (
    <div className='mt-2 p-2'>
      {currency && currency?.map(_currency => (
        values['unit']?.map(_unit => (
          values['pricingMethod']?.map(_pricingMethod => {
            return (
              <div>
                <div className='flex gap-3'>
                  <p>{`${_unit} ${_currency}/${_pricingMethod}`}</p>
                  <HtmlTooltip title="Add">
                    <IconButton size="small" aria-label="add" onClick={() => {
                      const durationBasedPricing = values['durationBasedPricing'] && values['durationBasedPricing']?.length > 0 ? [...values['durationBasedPricing']] : []
                      setFieldValue('durationBasedPricing', [...durationBasedPricing, { unit: _unit, pricingMethod: _pricingMethod, currency: _currency, duration: 0, price: 0, _id: Date.now() }])
                    }}>
                      <AddCircleOutlineIcon fontSize="small" color="primary" />
                    </IconButton>
                  </HtmlTooltip>
                </div>
                {values['durationBasedPricing'] && values['durationBasedPricing']?.length > 0 && sortBy(values['durationBasedPricing']?.filter(d => d?.unit === _unit && d?.pricingMethod === _pricingMethod && d?.currency === _currency), '_id')?.map(d => {
                  return (
                    <div className='flex gap-5 items-center'>
                      <TextField
                        name={'duration'}
                        variant="outlined"
                        margin="dense"
                        size="small"
                        type="number"
                        fullWidth
                        style={{ maxWidth: '250px' }}
                        value={d?.duration}
                        onChange={(e) => {
                          const durationBasedPricing = [...values['durationBasedPricing']]
                          setFieldValue('durationBasedPricing', durationBasedPricing?.map(_d => {
                            if (_d?._id === d?._id) {
                              return ({
                                ..._d,
                                duration: parseFloat(e.target.value)
                              })
                            }
                            return _d
                          }));
                        }}
                      />
                      <TextField
                        name={'price'}
                        variant="outlined"
                        margin="dense"
                        size="small"
                        fullWidth
                        style={{ maxWidth: '250px' }}
                        type="number"
                        value={d?.price}
                        onChange={(e) => {
                          const durationBasedPricing = [...values['durationBasedPricing']]
                          setFieldValue('durationBasedPricing', durationBasedPricing?.map(_d => {
                            if (_d?._id === d?._id) {
                              return ({
                                ..._d,
                                price: parseFloat(e.target.value)
                              })
                            }
                            return _d
                          }));
                        }}
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                {result(
                                  find(getUniqueCurrencies(), function (obj) {
                                    return obj.currencyCode === _currency;
                                  }),
                                  'symbolNative'
                                )}
                              </InputAdornment>
                            ),
                            inputProps: { min: 0, max: 9999999999 }
                          }
                        }}
                      />
                      <HtmlTooltip title="Remove">
                        <IconButton size="small" aria-label="remove" onClick={() => {
                          const durationBasedPricing = values['durationBasedPricing']?.filter(_d => _d?._id != d?._id)
                          setFieldValue('durationBasedPricing', durationBasedPricing)
                        }}>
                          <RemoveCircleOutlineIcon fontSize="small" color="error" />
                        </IconButton>
                      </HtmlTooltip>
                    </div>
                  )
                })}
              </div>
            )
          })
        ))
      ))}
    </div>
  )
}