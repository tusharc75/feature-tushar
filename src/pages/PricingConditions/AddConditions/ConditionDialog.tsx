import { useState, useEffect, Fragment, useContext } from 'react';
import Button from '@material-ui/core/Button';
import { Formik, Form } from 'formik';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import Dialog from '@material-ui/core/Dialog';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomButton from '../../../components/Helpers/CustomButton';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition, MATERIAL_TYPE, PRICING_TYPE, getUniqueCurrencies } from './../../../constants/helpers';
import { pricingCondition } from '../../../constants/helpers';
import { Box, Grid, TextField, InputAdornment, Chip, Badge, Select, FormControl, InputLabel, IconButton } from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import { result, find, startCase, isEqual, camelCase, values } from 'lodash';
import { FaDiceOne } from 'react-icons/fa';
import MenuItem from '@material-ui/core/MenuItem';
import { Delete } from '@material-ui/icons';
import MultipleEntry from './MultipleEntry';
import { useData } from '../../../StateProvider/Provider';
import _ from 'lodash';

const ConditionDialog = ({ pricingConditionId, conditionData, handleClose, handleSuccess, detailData, isBulkedit, allowedToEdit }) => {

  const toastConfig = useContext(CustomToastContext);
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
        details = conditionData?.competencyDetail
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
              : details?.competencyName
        )
      );
      currency.forEach((_currency) => {
        if (conditionData.materialType === 'competency') {
          if (conditionData['mrp' + '_' + _currency.toLowerCase()] === undefined)
            conditionData['mrp' + '_' + _currency.toLowerCase()] = 0;
          details?.pricingMethod?.map((_pricingMethod) => {
            if (
              conditionData[
              'rent_' + camelCase(_pricingMethod.toLowerCase()) + '_' + _currency.toLowerCase()] == undefined
            )
              conditionData[
                'rent_' + camelCase(_pricingMethod.toLowerCase()) + '_' + _currency.toLowerCase()] = 0;
          });
        } else {
          details?.unit?.map((_unit) => {
            if (conditionData['mrp' + '_' + _currency.toLowerCase() + '_' + camelCase(_unit.toLowerCase())] === undefined)
              conditionData['mrp' + '_' + _currency.toLowerCase() + '_' + camelCase(_unit.toLowerCase())] = 0;
            details?.pricingMethod?.map((_pricingMethod) => {
              if (
                conditionData[
                'rent_' + camelCase(_pricingMethod.toLowerCase()) + '_' + _currency.toLowerCase() + '_' + camelCase(_unit.toLowerCase())
                ] == undefined
              )
                conditionData[
                  'rent_' + camelCase(_pricingMethod.toLowerCase()) + '_' + _currency.toLowerCase() + '_' + camelCase(_unit.toLowerCase())
                ] = 0;
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
              updatedData['rent_' + camelCase(_pricingMethod.toLowerCase()) + '_' + _currency.toLowerCase() + '_' + camelCase(_unit.toLowerCase())] =
                v['rent_' + camelCase(_pricingMethod.toLowerCase()) + '_' + _currency.toLowerCase() + '_' + camelCase(_unit.toLowerCase())];
            });
        });
      }

    });

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
      errors['conditionType'] = 'Pricing type is required'
    }
    if (conditionData.materialType !== 'competency' && (!Array.isArray(values.unit) || values.unit.length === 0)) {
      errors['unit'] = 'Unit is required'
    }
    currency.forEach((_currency) => {
      if (conditionData?.materialType === 'competency') {
        values.conditionType?.includes('Rent') &&
          values['pricingMethod']?.map((_pricingMethod) => {
            const data =
              values['rent_' + camelCase(_pricingMethod.toLowerCase()) + '_' + _currency.toLowerCase()];
            if (isNaN(data)) {
              errors['rent_' + camelCase(_pricingMethod.toLowerCase()) + '_' + _currency.toLowerCase()] =
                'Price is required';
            }
            if (data === undefined) {
              errors['rent_' + camelCase(_pricingMethod.toLowerCase()) + '_' + _currency.toLowerCase()] =
                'Enter valid price';
            }
            if (parseFloat(data) <= 0) {
              errors['rent_' + camelCase(_pricingMethod.toLowerCase()) + '_' + _currency.toLowerCase()] =
                'Enter valid price';
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
              const data =
                values['rent_' + camelCase(_pricingMethod.toLowerCase()) + '_' + _currency.toLowerCase() + '_' + camelCase(_unit.toLowerCase())];
              if (isNaN(data)) {
                errors['rent_' + camelCase(_pricingMethod.toLowerCase()) + '_' + _currency.toLowerCase() + '_' + camelCase(_unit.toLowerCase())] =
                  'Price is required';
              }
              if (data === undefined) {
                errors['rent_' + camelCase(_pricingMethod.toLowerCase()) + '_' + _currency.toLowerCase() + '_' + camelCase(_unit.toLowerCase())] =
                  'Enter valid price';
              }
              if (parseFloat(data) <= 0) {
                errors['rent_' + camelCase(_pricingMethod.toLowerCase()) + '_' + _currency.toLowerCase() + '_' + camelCase(_unit.toLowerCase())] =
                  'Enter valid price';
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
        <Formik
          enableReinitialize={true}
          initialValues={initialData}
          validateOnMount
          onSubmit={handleSubmit}
          validate={validate}
        >
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
                        <Grid item xs={12} sm={6} md={6}>
                          <Autocomplete
                            multiple
                            id="conditionType"
                            options={conditionData?.materialType === 'competency' ? PRICING_TYPE.filter((ele) => ele.optionValue === 'Rent') : PRICING_TYPE}
                            getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                            getOptionSelected={(option: any, val) => option.optionValue === val}
                            value={PRICING_TYPE.filter((data) => values['conditionType']?.includes(data.optionValue))}
                            onChange={(e, val) => {
                              setFieldValue('conditionType', val?.map((e) => e.optionValue));
                            }}
                            disabled={!allowedToEdit}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                margin="dense"
                                name="conditionType"
                                variant="outlined"
                                label="Pricing Type"
                                required
                                error={touched['conditionType'] && Boolean(errors['conditionType'])}
                                helperText={touched['conditionType'] && errors['conditionType']}
                              />
                            )} />
                        </Grid>
                        {conditionData?.materialType !== 'competency' && (
                          <Grid item xs={12} sm={6} md={6}>
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
                                  <Grid item xs={12} sm={6} md={6} key={i + j + 1}>
                                    <TextField
                                      id="mrp"
                                      name="mrp"
                                      variant="outlined"
                                      margin="dense"
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
                                      InputProps={{
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
                          <Grid item xs={12} sm={6} md={6}>
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
                        <Box marginTop={1} border={1} p={1} borderColor="var(--common-border-color)">
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
                                      currency.map(
                                        (_currency, j) =>
                                          values['unit'] ?
                                            values['unit'].map((_unit, k) => (
                                              <td key={j + k}>
                                                <TextField
                                                  name={
                                                    'rent_' +
                                                    camelCase(_pricingMethod.toLowerCase()) +
                                                    '_' +
                                                    _currency.toLowerCase() +
                                                    '_' +
                                                    camelCase(_unit.toLowerCase())
                                                  }
                                                  disabled={!allowedToEdit}
                                                  variant="outlined"
                                                  margin="dense"
                                                  fullWidth
                                                  type="number"
                                                  onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                                                  style={{ margin: 0 }}
                                                  value={
                                                    values[
                                                    'rent_' +
                                                    camelCase(_pricingMethod.toLowerCase()) +
                                                    '_' +
                                                    _currency.toLowerCase() +
                                                    '_' +
                                                    camelCase(_unit.toLowerCase())
                                                    ]
                                                  }
                                                  onChange={(e) => {
                                                    setFieldValue(
                                                      'rent_' +
                                                      camelCase(_pricingMethod.toLowerCase()) +
                                                      '_' +
                                                      _currency.toLowerCase() +
                                                      '_' +
                                                      camelCase(_unit.toLowerCase()),
                                                      parseFloat(e.target.value)
                                                    );
                                                  }}
                                                  InputProps={{
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
                                                  }}
                                                  error={
                                                    touched[
                                                    'rent_' +
                                                    camelCase(_pricingMethod.toLowerCase()) +
                                                    '_' +
                                                    _currency.toLowerCase() +
                                                    '_' +
                                                    camelCase(_unit.toLowerCase())
                                                    ] &&
                                                    Boolean(
                                                      errors[
                                                      'rent_' +
                                                      camelCase(_pricingMethod.toLowerCase()) +
                                                      '_' +
                                                      _currency.toLowerCase() +
                                                      '_' +
                                                      camelCase(_unit.toLowerCase())
                                                      ]
                                                    )
                                                  }
                                                  helperText={
                                                    touched[
                                                    'rent_' +
                                                    camelCase(_pricingMethod.toLowerCase()) +
                                                    '_' +
                                                    _currency.toLowerCase() +
                                                    '_' +
                                                    camelCase(_unit.toLowerCase())
                                                    ] &&
                                                    errors[
                                                    'rent_' +
                                                    camelCase(_pricingMethod.toLowerCase()) +
                                                    '_' +
                                                    _currency.toLowerCase() +
                                                    '_' +
                                                    camelCase(_unit.toLowerCase())
                                                    ]
                                                  }
                                                />
                                              </td>
                                            ))
                                            : conditionData.materialType === 'competency'
                                              ?
                                              <td key={j}>
                                                <TextField
                                                  name={
                                                    'rent_' +
                                                    camelCase(_pricingMethod.toLowerCase()) +
                                                    '_' +
                                                    _currency.toLowerCase()
                                                  }
                                                  variant="outlined"
                                                  margin="dense"
                                                  fullWidth
                                                  disabled={!allowedToEdit}
                                                  type="number"
                                                  onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                                                  style={{ margin: 0 }}
                                                  value={
                                                    values[
                                                    'rent_' +
                                                    camelCase(_pricingMethod.toLowerCase()) +
                                                    '_' +
                                                    _currency.toLowerCase()
                                                    ]
                                                  }
                                                  onChange={(e) => {
                                                    setFieldValue(
                                                      'rent_' +
                                                      camelCase(_pricingMethod.toLowerCase()) +
                                                      '_' +
                                                      _currency.toLowerCase(),
                                                      parseFloat(e.target.value)
                                                    );
                                                  }}
                                                  InputProps={{
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
                                                  }}
                                                  error={
                                                    touched[
                                                    'rent_' +
                                                    camelCase(_pricingMethod.toLowerCase()) +
                                                    '_' +
                                                    _currency.toLowerCase()
                                                    ] &&
                                                    Boolean(
                                                      errors[
                                                      'rent_' +
                                                      camelCase(_pricingMethod.toLowerCase()) +
                                                      '_' +
                                                      _currency.toLowerCase()
                                                      ]
                                                    )
                                                  }
                                                  helperText={
                                                    touched[
                                                    'rent_' +
                                                    camelCase(_pricingMethod.toLowerCase()) +
                                                    '_' +
                                                    _currency.toLowerCase()
                                                    ] &&
                                                    errors[
                                                    'rent_' +
                                                    camelCase(_pricingMethod.toLowerCase()) +
                                                    '_' +
                                                    _currency.toLowerCase()
                                                    ]
                                                  }
                                                />
                                              </td>
                                              : null
                                      )}
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </Box>
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
                        <Button
                          variant="outlined"
                          color="primary"
                          size="small"
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
                        </Button>
                      </Box>
                      {discount.map((val, index) => (
                        <Box key={index} mb={2}>
                          <Badge badgeContent={index + 1} color="primary"></Badge>
                          <Box p={2} border={1} borderColor="var(--common-border-color)">
                            <Grid spacing={3} container>
                              <Grid item xs={12} sm={2} md={2}>
                                <FormControl fullWidth margin="dense" variant="outlined">
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
                                  <Grid item xs={12} sm={2} md={2}>
                                    <TextField
                                      id="amount"
                                      name="amount"
                                      variant="outlined"
                                      margin="dense"
                                      fullWidth
                                      label={'Discount ' + (val.type === 'Flat' ? ' Amount' : ' Percentage')}
                                      type="number"
                                      onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                                      value={val.amount}
                                      onChange={(e) => handleChangeValue(index, 'amount', parseFloat(e.target.value))}
                                    />
                                  </Grid>
                                  <Grid item xs={12} sm={2} md={2}>
                                    <TextField
                                      id="minTransAmount"
                                      name="minTransAmount"
                                      variant="outlined"
                                      margin="dense"
                                      fullWidth
                                      label="Minimum Trans. Amount"
                                      type="number"
                                      onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                                      value={val.minTransAmount}
                                      onChange={(e) => handleChangeValue(index, 'minTransAmount', parseFloat(e.target.value))}
                                    />
                                  </Grid>
                                  <Grid item xs={12} sm={2} md={2}>
                                    <TextField
                                      id="maxDiscount"
                                      name="maxDiscount"
                                      variant="outlined"
                                      margin="dense"
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
                                justify="flex-end"
                                item
                                xs={12}
                                sm={val.type === 'Flat' || val.type === 'Percentage' ? 4 : 10}
                                md={val.type === 'Flat' || val.type === 'Percentage' ? 4 : 10}
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
                                <Grid item xs={12} sm={6} md={6}>
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
                        <Button
                          variant="outlined"
                          color="primary"
                          size="small"
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
                        </Button>
                      </Box>
                      {charge.map((val, index) => (
                        <Box key={index} mb={2}>
                          <Badge badgeContent={index + 1} color="primary"></Badge>
                          <Box p={2} border={1} borderColor="var(--common-border-color)">
                            <Grid spacing={3} container>
                              <Grid item xs={12} sm={2} md={2}>
                                <TextField
                                  id="label"
                                  name="label"
                                  variant="outlined"
                                  margin="dense"
                                  fullWidth
                                  label={'Charge Name'}
                                  type="text"
                                  value={val.label}
                                  onChange={(e) => handleChangeChargeValue(index, 'label', e.target.value)}
                                />
                              </Grid>
                              <Grid item xs={12} sm={2} md={2}>
                                <FormControl fullWidth margin="dense" variant="outlined">
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
                                  >
                                    <MenuItem value="Flat">Flat</MenuItem>
                                    <MenuItem value="Percentage">Percentage</MenuItem>
                                  </Select>
                                </FormControl>
                              </Grid>
                              <Grid item xs={12} sm={2} md={2}>
                                <TextField
                                  id="amount"
                                  name="amount"
                                  variant="outlined"
                                  margin="dense"
                                  fullWidth
                                  label={'Charge ' + (val.type === 'Flat' ? ' Amount' : ' Percentage')}
                                  type="number"
                                  onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                                  value={val.amount}
                                  onChange={(e) => handleChangeChargeValue(index, 'amount', parseFloat(e.target.value))}
                                />
                              </Grid>
                              <Grid container justify="flex-end" item xs={12} sm={6} md={6}>
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
                        <Button
                          variant="outlined"
                          color="primary"
                          size="small"
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
                        </Button>
                      </Box>
                      {tax.map((val, index) => (
                        <Box key={index} mb={2}>
                          <Badge badgeContent={index + 1} color="primary"></Badge>
                          <Box p={2} border={1} borderColor="var(--common-border-color)">
                            <Grid spacing={3} container>
                              <Grid item xs={12} sm={2} md={2}>
                                <TextField
                                  id="taxCode"
                                  name="taxCode"
                                  variant="outlined"
                                  margin="dense"
                                  fullWidth
                                  label={'Tax Code'}
                                  type="text"
                                  value={val.taxCode}
                                  onChange={(e) => handleChangeTaxValue(index, 'taxCode', e.target.value)}
                                />
                              </Grid>
                              <Grid item xs={12} sm={2} md={2}>
                                <FormControl fullWidth margin="dense" variant="outlined">
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
                              <Grid item xs={12} sm={2} md={2}>
                                <TextField
                                  id="amount"
                                  name="amount"
                                  variant="outlined"
                                  margin="dense"
                                  fullWidth
                                  label={'Tax ' + (val.type === 'Flat' ? ' Amount' : ' Percentage')}
                                  type="number"
                                  onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                                  value={val.amount}
                                  onChange={(e) => handleChangeTaxValue(index, 'amount', parseFloat(e.target.value))}
                                />
                              </Grid>
                              <Grid container justify="flex-end" item xs={12} sm={6} md={6}>
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
                <Button
                  size="small"
                  color="primary"
                  onClick={() => {
                    handleClose();
                  }}
                >
                  {'Close'}
                </Button>
                {allowedToEdit &&
                  <CustomButton
                    loading={loading}
                    variant="contained"
                    color="primary"
                    type="submit"
                    onClick={submitForm}>
                    {' '}
                    Save
                  </CustomButton>
                }
              </CustomDialogFooter>
              {showConfirmDialog ? (
                <ConfirmCancelDialog
                  close={() => setShowConfirmDialog(false)}
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
