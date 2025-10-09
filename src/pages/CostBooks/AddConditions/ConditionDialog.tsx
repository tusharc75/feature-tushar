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
import { CustomDialogTransition, MATERIAL_TYPE, costBooks, getUniqueCurrencies } from './../../../constants/helpers';
import { Box, TextField, InputAdornment, Chip, FormControlLabel, Checkbox } from '@mui/material';
import Grid from '@mui/material/Grid2';
import Autocomplete from '@mui/material/Autocomplete';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import { result, find, startCase, camelCase } from 'lodash';
import { FaDiceOne } from 'react-icons/fa';
import _ from 'lodash';
import { useData } from 'src/StateProvider/Provider';

const ConditionDialog = ({ id, conditionData, handleClose, handleSuccess, detailData, isBulkedit, allowedToEdit, subStatusOptions }) => {
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
      setInitialData({ conditionType: ['Rent'] });
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
          (conditionData?.materialType === MATERIAL_TYPE.product
            ? details?.productName
            : conditionData?.materialType === MATERIAL_TYPE.service
              ? details?.serviceName
              : conditionData?.materialType === MATERIAL_TYPE.package
                ? details?.packageName
                : details?.competencyName)
      );

      currency.forEach((_currency) => {
        details?.unit?.map((_unit) => {
          if (conditionData['mrp' + '_' + _currency.toLowerCase() + '_' + camelCase(_unit.toLowerCase())] === undefined)
            conditionData['mrp' + '_' + _currency.toLowerCase() + '_' + camelCase(_unit.toLowerCase())] = 0;
          details?.pricingMethod?.map((_pricingMethod) => {
            const _fieldName = `rent_${camelCase(_pricingMethod.toLowerCase())}`;
            const __fieldName = `${_fieldName}_${_currency.toLowerCase()}_${camelCase(_unit.toLowerCase())}`;
            if (conditionData[__fieldName] == undefined) {
              conditionData[__fieldName] = 0;
            }
            if (conditionData?.minimumDuration?.[_fieldName] == undefined) {
              if (!conditionData?.minimumDuration) {
                conditionData.minimumDuration = {};
              }
              conditionData.minimumDuration[_fieldName] = 0;
            }
          });
        });
      });
      setInitialData(conditionData);
    }
  }, [conditionData]);

  const handleSubmit = (v) => {
    setLoading(true);
    const updatedData = {};
    currency.forEach((_currency) => {
      v['unit']?.map((_unit) => {
        if (v.conditionType?.includes('Price')) {
          const data = v['mrp' + '_' + _currency.toLowerCase() + '_' + camelCase(_unit.toLowerCase())];
          updatedData['mrp' + '_' + _currency.toLowerCase() + '_' + camelCase(_unit.toLowerCase())] =
            v['mrp' + '_' + _currency.toLowerCase() + '_' + camelCase(_unit.toLowerCase())];
        }
        v.conditionType?.includes('Rent') &&
          v['pricingMethod']?.map((_pricingMethod) => {
            const __fieldName = `rent_${camelCase(_pricingMethod.toLowerCase())}_${_currency.toLowerCase()}_${camelCase(_unit.toLowerCase())}`;
            updatedData[__fieldName] = v[__fieldName];
            if (v?.enableMinimumDuration) {
              if (!updatedData['minimumDuration']) {
                updatedData['minimumDuration'] = {};
              }
              updatedData['minimumDuration'][camelCase(_pricingMethod.toLowerCase())] = v?.minimumDuration?.[camelCase(_pricingMethod.toLowerCase())];
            }
          });
      });
    });

    delete v?.minimumDuration;

    Object.keys(v).forEach((key) => {
      if (!(key.indexOf('_') !== -1 && key !== '_id' && key?.split('_')?.length)) {
        updatedData[key] = v[key];
      }
    });
    const values: any = updatedData;

    let data = [];

    delete values.discount;
    delete values.charge;
    delete values.tax;
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
      .put(`${costBooks.api}/condition/${id}`, { condition: data })
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

  const valueTouch = {};
  const validate = (values) => {
    const errors: any = {};
    if (!Array.isArray(values?.conditionType) || values.conditionType.length === 0) {
      errors['conditionType'] = 'Pricing type is required';
    }
    if (!Array.isArray(values.unit) || values.unit.length === 0) {
      errors['unit'] = 'Unit is required';
    }
    currency.forEach((_currency) => {
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
          if (parseFloat(data) < 0) {
            errors['mrp' + '_' + _currency.toLowerCase() + '_' + camelCase(_unit.toLowerCase())] = 'Enter valid price';
          }
        }
        values.conditionType?.includes('Rent') &&
          values['pricingMethod']?.map((_pricingMethod) => {
            const _fieldName = `rent_${camelCase(_pricingMethod.toLowerCase())}_${_currency.toLowerCase()}_${camelCase(_unit.toLowerCase())}`;
            if (isNaN(values[_fieldName])) {
              errors[_fieldName] = 'Price is required';
            }
            if (values[_fieldName] === undefined) {
              errors[_fieldName] = 'Enter valid price';
            }
            if (parseFloat(values[_fieldName]) < 0) {
              errors[_fieldName] = 'Enter valid price';
            }
          });
      });
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
                    </Box>
                  </Fragment>

                  {values.conditionType?.includes('Rent') && (
                    <Fragment>
                      <Box marginTop={1} marginBottom={1}>
                        <div className="mt-2 border p-2">
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
                        {values['materialType'] === 'competency' && (
                          <div className="mt-2 border p-2">
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={values['enableSubStatusWiseCosting']}
                                  onChange={(e) => {
                                    setFieldValue('enableSubStatusWiseCosting', e?.target?.checked);
                                    if (!e?.target?.checked) {
                                      setFieldValue('subStatusWiseCosting', []);
                                    }
                                  }}
                                  name="enableSubStatusWiseCosting"
                                  color="primary"
                                />
                              }
                              label="Enable Sub Status Wise Costing"
                            />
                            {values['enableSubStatusWiseCosting'] && (
                              <div className="mt-2">
                                <Autocomplete
                                  multiple
                                  id="status"
                                  options={subStatusOptions || []}
                                  getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
                                  isOptionEqualToValue={(option: any, val) => option?.optionValue === val}
                                  value={[...(subStatusOptions || [])]?.filter((o) =>
                                    [...(values['subStatusWiseCosting'] || [])]?.map((a) => a?.status)?.includes(o?.optionValue)
                                  )}
                                  onChange={(e, val) => {
                                    const newObj: any = {};
                                    currency.forEach((_currency) => {
                                      values['unit']?.map((_unit) => {
                                        values['pricingMethod']?.map((_pricingMethod) => {
                                          newObj[
                                            `rent_${camelCase(_pricingMethod.toLowerCase())}_${_currency.toLowerCase()}_${camelCase(_unit.toLowerCase())}`
                                          ] = 0;
                                        });
                                      });
                                    });
                                    setFieldValue(
                                      'subStatusWiseCosting',
                                      val?.map((v) => {
                                        const _v = values['subStatusWiseCosting']?.find((a) => a?.status === v?.optionValue);
                                        return {
                                          ...newObj,
                                          ..._v,
                                          status: v?.optionValue
                                        };
                                      })
                                    );
                                  }}
                                  renderInput={(params) => (
                                    <TextField {...params} margin="dense" size="small" name="status" variant="outlined" label="Status" />
                                  )}
                                />
                                {values['pricingMethod']?.length > 0 &&
                                  values['unit']?.length > 0 &&
                                  values['subStatusWiseCosting'] &&
                                  values['subStatusWiseCosting']?.length > 0 &&
                                  values['subStatusWiseCosting']?.map((value) => (
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

const RentPriceBox = ({ conditionData, values, setFieldValue, currency, allowedToEdit, touched = null, errors = null, status = '' }) => {
  const value = status ? values['subStatusWiseCosting']?.find((a) => a?.status === status) || {} : values;
  return (
    <div className={`mt-2 p-2 ${status ? 'border' : ''}`}>
      {status && <div>{status}</div>}
      <table>
        <thead>
          <tr>
            <th></th>
            {currency &&
              currency.map((_currency, i) => values['unit'] && values['unit'].map((_unit, j) => <th key={j}>{_unit + ' ' + _currency}</th>))}
          </tr>
        </thead>
        <tbody>
          {values['pricingMethod'] &&
            values['pricingMethod'].map((_pricingMethod, i) => (
              <tr key={i}>
                <th style={{ paddingRight: 10, minWidth: 50 }}>{startCase(_pricingMethod)}</th>
                {currency &&
                  currency.map((_currency, j) => {
                    const _fieldName = `rent_${camelCase(_pricingMethod.toLowerCase())}_${_currency.toLowerCase()}`;
                    return values['unit']
                      ? values['unit'].map((_unit, k) => {
                          const __fieldName = `${_fieldName}_${camelCase(_unit.toLowerCase())}`;
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
                                    const subStatusWiseCosting = [...values['subStatusWiseCosting']];
                                    subStatusWiseCosting?.forEach((a) => {
                                      if (a?.status === status) {
                                        a[__fieldName] = parseFloat(e.target.value);
                                      }
                                    });
                                    setFieldValue('subStatusWiseCosting', subStatusWiseCosting);
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
                          );
                        })
                      : null;
                  })}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};
