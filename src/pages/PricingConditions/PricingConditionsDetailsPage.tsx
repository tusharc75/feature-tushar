import React, { useRef, useEffect, useState, useContext, Fragment } from 'react';
import { Box, Button, Chip, IconButton, InputAdornment } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Formik, Form } from 'formik';
import axiosInstance from '../../axios/axiosInstance';
import { getObjKeys, yupSchema, pricingCondition, setFieldsInAscendingOrder, getUniqueCurrencies } from '../../constants/helpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import FormTypes from '../../components/Helpers/FormTypes';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { useData } from '../../StateProvider/Provider';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import MultipleEntry from './AddConditions/MultipleEntry';
import { useParams, useHistory } from 'react-router-dom';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import routes from '../../components/Helpers/Routes';
import Autocomplete from '@mui/material/Autocomplete';
import { result, find, startCase, isEqual, camelCase } from 'lodash';
import { Delete } from '@mui/icons-material';
import Badge from '@mui/material/Badge';
import { makeStyles } from '@mui/styles';
import { FaDiceOne } from 'react-icons/fa';

const useStyles = makeStyles(() => ({
  screenHeightAuto: {
    height: 'calc(100vh - 195px)',
    overflow: 'auto',
    padding: '12px'
  }
}));

function PricingConditionsDetailsPage() {
  const history = useHistory();
  const { id } = useParams();
  const toastConfig = useContext(CustomToastContext);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const {
    state: { permissions, resources }
  }: any = useData();
  const [formsData, setFormsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isProductMasterUnit, setIsProductMasterUnit] = React.useState(false);

  const [units, setUnits] = React.useState([]);
  const [pricingMethod, setPricingMethod] = React.useState(['perHour', 'perDay', 'perWeek', 'perFortnight', 'perMonth', 'perYear']);

  const [discount, setDiscount] = useState([]);
  const [tax, setTax] = useState([]);
  const [charge, setCharge] = useState([]);

  const [pricingConditionsPermissions, setpriceTemplatePermissions] = useState({
    isCreate: false,
    isUpdate: false,
    isRead: false,
    isDelete: false
  });

  const ref = useRef(null);

  useEffect(() => {
    getPricingConditionsFields();
  }, []);

  useEffect(() => {
    axiosInstance()
      .get(`/field?resource=Product`)
      .then(({ data: { data } }) => {
        const unitField = data.filter((e) => ['unit', 'umo'].includes(e.fieldData.fieldName.toLowerCase()));
        if (unitField.length) {
          setUnits(unitField[0].fieldData.option);
          setIsProductMasterUnit(true);
        }
        const pricingMethodField = data.filter((e) => e.fieldData.fieldName === 'pricingMethod');
        if (pricingMethodField.length) {
          let _pricingMethod = [];
          pricingMethodField[0].fieldData.option.forEach((e) => {
            _pricingMethod.push(e.optionValue);
          });
          setPricingMethod(_pricingMethod);
        }
      });
  }, []);

  useEffect(() => {
    setFormsData(setFieldsInAscendingOrder(initialData.fields));
  }, [initialData.fields]);

  // useEffect(() => {
  //     //materialType can be =["product","packages","productCategory"]
  //     //conditionType can be =["Price","Rent","Discount","Charge","Tax"]
  //     const data: any = {}
  //     data.conditionType = ["Rent", "Discount", "Tax", "Charge"]
  //     data.material = [{
  //         materialId: "6189410150203b247444ff55",
  //         materialType: "product",
  //         qty: 5,
  //         pricingMethod: "perHour",
  //         unit: "well",
  //         currency: "USD"
  //     }, {
  //         materialId: "6189410150203b247444ff55",
  //         materialType: "product",
  //         qty: 50,
  //         pricingMethod: "perDay",
  //         unit: "Two Well Pad",
  //         currency: "USD"
  //     }]
  //     data.supplier = [];
  //     data.customer = [];
  //     data.warehouse = [];
  //     axiosInstance().post(pricingConditionApi + `/calculatePrice`, data).then(({ data: { data } }) => {
  //
  //     })
  // }, []);

  const getPricingConditionsFields = () => {
    axiosInstance()
      .get(`/field?resource=Pricing Condition`)
      .then(({ data: { data } }) => {
        const filterData = id === '0' ? data.filter((d) => d.isCreate) : data.filter((d) => d.isUpdate);
        if (id === '0') {
          setInitialData({
            fields: filterData.map((m) => m.fieldData),
            values: getObjKeys(
              '',
              filterData.map((m) => m.fieldData)
            )
          });
        } else {
          let newFields = [];
          axiosInstance()
            .get(`${pricingCondition.api}/${id}`)
            .then(({ data: { data } }) => {
              filterData.map((_f) => {
                newFields.push(_f.fieldData);
              });
              setDiscount(data.discount ? data.discount : []);
              setCharge(data.charge ? data.charge : []);
              setTax(data.tax ? data.tax : []);
              setInitialData({
                fields: newFields,
                values: data
              });
            })
            .catch((error) => {
              toastConfig.setToastConfig(error);
            });
        }
      });
  };

  const onSubmit = (values) => {
    setLoading(true);
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
    if (id === '0') {
      axiosInstance()
        .post(pricingCondition.api, values)
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setLoading(false);
          history.push({ pathname: routes.pricingCondition.path });
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      values._id = id;
      axiosInstance()
        .put(pricingCondition.api, values)
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setLoading(false);
          history.push({ pathname: routes.pricingCondition.path });
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const convertLabeltoValue = (value) => {
    const result = [];
    value.forEach((_v) => {
      let _data = getUniqueCurrencies().filter(
        (data) => data.currencyCode === _v || data.currencyCode + ' - ' + data.currencyName + ' - (' + data.symbolNative + ')' === _v
      );
      if (_data.length) {
        result.push(_data[0].currencyCode);
      }
    });
    return result;
  };

  const convertValuetoLabel = (value) => {
    const result = [];
    value.forEach((_v) => {
      let _data = getUniqueCurrencies().filter((data) => data.currencyCode === _v);
      if (_data.length) {
        result.push(_data[0].currencyCode + ' - ' + _data[0].currencyName + ' - (' + _data[0].symbolNative + ')');
      }
    });
    return result;
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

  const handleChangeProduct = (product) => {
    if (!isProductMasterUnit) {
    }
  };

  const classes = useStyles();

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid size={{ md: 4, sm: 11, xs: 10 }}>
          <CustomBreadCrumbs
            routes={[
              {
                title: resources?.pricingCondition?.titlePlural,
                path: routes.pricingCondition.path
              },
              {
                title: id === '0' ? 'New' : initialData && initialData.values['conditionName']
              }
            ]}
            onBreadCrumbClick={() => {
              if (!isEqual(ref.current.values, initialData.values)) {
                if ((id === '0' && pricingConditionsPermissions.isCreate) || (id !== '0' && pricingConditionsPermissions.isUpdate)) {
                  setShowConfirmDialog(true);
                } else {
                  history.push({ pathname: routes.pricingCondition.path });
                }
              } else history.push({ pathname: routes.pricingCondition.path });
            }}
          />
        </Grid>
      </Grid>
      <div className="main-container p-2">
        {initialData && initialData.fields && initialData.fields.length > 0 ? (
          <Formik
            initialValues={initialData.values}
            validationSchema={yupSchema(initialData.fields)}
            validateOnMount
            innerRef={ref}
            onSubmit={onSubmit}
          >
            {({ submitForm, values, errors, touched, setFieldValue }) => (
              <Form>
                <Grid container>
                  <Grid size={{ md: 6, sm: 6, xs: 6 }}>
                    <h2 className="form-label-style" style={{ borderBottom: 'none', paddingLeft: '12px' }}>
                      * Required Fields
                    </h2>
                  </Grid>
                  <Grid container justifyContent="flex-end" size={{ md: 6, sm: 6, xs: 6 }}>
                    <Box ml={1}>
                      <ThemeButton
                        isLoading={loading}
                        buttonType="theme"
                        //disabled={loading || isEqual(ref?.current?.values, initialData?.values)}
                        onClick={(e) => {
                          e.preventDefault();
                          submitForm();
                        }}
                      >
                        Save
                      </ThemeButton>
                    </Box>
                    <Box ml={1}>
                      <Button
                        type="button"
                        variant="outlined"
                        color="primary"
                        size="small"
                        onClick={() => {
                          if (!isEqual(ref.current.values, initialData.values)) {
                            setShowConfirmDialog(true);
                          } else {
                            history.push(routes.pricingCondition.path);
                          }
                        }}
                      >
                        Close
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
                <Box className={classes.screenHeightAuto}>
                  {formsData &&
                    formsData.map((form, index) => {
                      return (
                        <div key={index}>
                          <div className={'detail-box-content'}>
                            <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                            <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>{form.name}</h2>
                          </div>
                          <Box marginY={2}>
                            <Grid spacing={3} container>
                              {form.sectionFields.map((field, index2) =>
                                field.fieldName === 'product' ? (
                                  <Grid key={field.fieldName} size={{ xs: 12, sm: 4, md: 4 }}>
                                    <FormTypes
                                      {...field}
                                      multiple
                                      values={values}
                                      errors={errors}
                                      touched={touched}
                                      label={field.fieldLabel}
                                      name={field.fieldName}
                                      type={field.type}
                                      options={field.option}
                                      fullWidth
                                      isTooltip={field?.isTooltip || false}
                                      tooltipMessage={field?.tooltipMessage}
                                      size="small"
                                      onChange={(e, value) => {
                                        setFieldValue(field.fieldName, value ? value.filter((v) => v.optionValue).map((val) => val.optionValue) : []);
                                        handleChangeProduct(value.filter((v) => v.optionValue).map((val) => val.optionValue));
                                      }}
                                    />
                                  </Grid>
                                ) : (
                                  <Grid key={index2} size={{ xs: 12, sm: 4, md: 4 }}>
                                    <FormTypes
                                      // {...rest}
                                      values={values}
                                      errors={errors}
                                      touched={touched}
                                      label={field.fieldLabel}
                                      name={field.fieldName}
                                      type={field.type}
                                      options={field.option}
                                      setFieldValue={(name, value) => {
                                        setFieldValue(name, value);
                                      }}
                                      required={field.required}
                                      fullWidth
                                      isTooltip={field?.isTooltip || false}
                                      tooltipMessage={field?.tooltipMessage}
                                      size="small"
                                      imageOrFileUploadCompletePercentage={null}
                                    />
                                  </Grid>
                                )
                              )}
                              {index === formsData.length - 1 && (
                                <Fragment>
                                  <Grid size={{ xs: 12, sm: 4, md: 4 }} className="pt-1">
                                    <Autocomplete
                                      multiple
                                      freeSolo
                                      disableCloseOnSelect={true}
                                      id="autocompleteunits"
                                      options={units.map((e) => {
                                        return e.optionValue;
                                      })}
                                      value={values['units'] ? values['units'] : []}
                                      renderTags={(value: string[], getTagProps) =>
                                        value.map((option: string, index: number) => (
                                          <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                                        ))
                                      }
                                      onChange={(e, value) => setFieldValue('units', value)}
                                      renderInput={(params) => (
                                        <TextField
                                          {...params}
                                          margin="dense"
                                          size="small"
                                          name="units"
                                          variant="outlined"
                                          label="Units"
                                          placeholder="Units"
                                          error={touched['units'] && Boolean(errors['units'])}
                                          helperText={touched['units'] && errors['units']}
                                        />
                                      )}
                                    />
                                  </Grid>
                                  <Grid size={{ xs: 12, sm: 4, md: 4 }} className="pt-1">
                                    <Autocomplete
                                      multiple
                                      id="tags-filled"
                                      disableCloseOnSelect={true}
                                      options={getUniqueCurrencies().map((_c) => {
                                        return _c.currencyCode + ' - ' + _c.currencyName + ' - (' + _c.symbolNative + ')';
                                      })}
                                      renderTags={(value: string[], getTagProps) =>
                                        value.map((option: string, index: number) => (
                                          <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                                        ))
                                      }
                                      getOptionLabel={(option) => option}
                                      value={convertValuetoLabel(values['currency'] ? values['currency'] : [])}
                                      onChange={(e, value) => setFieldValue('currency', convertLabeltoValue(value))}
                                      renderInput={(params) => (
                                        <TextField
                                          {...params}
                                          margin="dense"
                                          size="small"
                                          variant="outlined"
                                          name="currency"
                                          label="Currency"
                                          placeholder="Currency"
                                          error={touched['currency'] && Boolean(errors['currency'])}
                                          helperText={touched['currency'] && errors['currency']}
                                        />
                                      )}
                                    />
                                  </Grid>
                                </Fragment>
                              )}
                            </Grid>
                          </Box>
                        </div>
                      );
                    })}
                  <Box>
                    {values.conditionType.includes('Price') && (
                      <Fragment>
                        <div className={'detail-box-content'}>
                          <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                          <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>Price</h2>
                        </div>
                        <Box marginTop={1} marginBottom={1}>
                          <Grid spacing={3} container>
                            {values['currency'] &&
                              values['currency'].map(
                                (_currency, i) =>
                                  values['units'] &&
                                  values['units'].map((_unit, j) => (
                                    <Grid size={{ xs: 12, sm: 3, md: 3 }}>
                                      <TextField
                                        id="mrp"
                                        name="mrp"
                                        variant="outlined"
                                        margin="dense"
                                        size="small"
                                        fullWidth
                                        label={'Rate ' + _unit + ' ' + _currency}
                                        type="number"
                                        value={values['mrp' + '_' + _currency.toLowerCase() + '_' + camelCase(_unit.toLowerCase())]}
                                        onChange={(e) =>
                                          setFieldValue(
                                            'mrp' + '_' + _currency.toLowerCase() + '_' + camelCase(_unit.toLowerCase()),
                                            parseFloat(e.target.value)
                                          )
                                        }
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
                                    </Grid>
                                  ))
                              )}
                          </Grid>
                        </Box>
                      </Fragment>
                    )}

                    {values.conditionType.includes('Rent') && (
                      <Fragment>
                        <div className={'detail-box-content'}>
                          <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                          <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>Rent</h2>
                        </div>
                        <Box marginTop={1} marginBottom={1}>
                          <Grid spacing={3} container>
                            <Grid size={{ xs: 12, sm: 4, md: 4 }}>
                              <Autocomplete
                                multiple
                                id="tags-filled"
                                disableCloseOnSelect={true}
                                options={pricingMethod}
                                getOptionLabel={(option: any) => startCase(option)}
                                renderTags={(value: string[], getTagProps) =>
                                  value.map((option: string, index: number) => (
                                    <Chip variant="outlined" label={startCase(option)} {...getTagProps({ index })} />
                                  ))
                                }
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
                                    placeholder="Pricing Method"
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
                                  {values['currency'] &&
                                    values['currency'].map(
                                      (_currency, i) =>
                                        values['units'] && values['units'].map((_unit, j) => <th key={j}>{_unit + ' ' + _currency}</th>)
                                    )}
                                </tr>
                              </thead>
                              <tbody>
                                {values['pricingMethod'] &&
                                  values['pricingMethod'].map((_pricingMethod, i) => (
                                    <tr key={i}>
                                      <th style={{ paddingRight: 10, minWidth: 50 }}>{startCase(_pricingMethod)}</th>
                                      {values['currency'] &&
                                        values['currency'].map(
                                          (_currency, j) =>
                                            values['units'] &&
                                            values['units'].map((_unit, k) => (
                                              <td key={j}>
                                                <TextField
                                                  name={
                                                    'rent_' + _pricingMethod + '_' + _currency.toLowerCase() + '_' + camelCase(_unit.toLowerCase())
                                                  }
                                                  variant="outlined"
                                                  margin="dense"
                                                  size="small"
                                                  fullWidth
                                                  type="number"
                                                  style={{ margin: 0 }}
                                                  value={
                                                    values[
                                                      'rent_' + _pricingMethod + '_' + _currency.toLowerCase() + '_' + camelCase(_unit.toLowerCase())
                                                    ]
                                                  }
                                                  onChange={(e) =>
                                                    setFieldValue(
                                                      'rent_' + _pricingMethod + '_' + _currency.toLowerCase() + '_' + camelCase(_unit.toLowerCase()),
                                                      parseFloat(e.target.value)
                                                    )
                                                  }
                                                />
                                              </td>
                                            ))
                                        )}
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </Box>
                        </Box>
                      </Fragment>
                    )}

                    {values.conditionType.includes('Discount') && (
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
                                <Grid size={{ xs: 12, sm: 2, md: 2 }}>
                                  <FormControl fullWidth margin="dense" variant="outlined" size="small">
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

                    {values.conditionType.includes('Charge') && (
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
                                  <FormControl fullWidth margin="dense" variant="outlined" size="small">
                                    <InputLabel id="demo-simple-select-outlined-label">Charge Type</InputLabel>
                                    <Select
                                      labelId="demo-simple-select-outlined-label"
                                      id="demo-simple-select-outlined"
                                      size="small"
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

                    {values.conditionType.includes('Tax') && (
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
                                  <FormControl fullWidth margin="dense" variant="outlined" size="small">
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
                                    label={'Tax ' + (val.type === 'Flat' ? ' Amount' : ' Percentage')}
                                    type="number"
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
                  </Box>
                </Box>
                {showConfirmDialog && (
                  <ConfirmCancelDialog
                    open={showConfirmDialog}
                    onSave={() => {
                      setShowConfirmDialog(false);
                      submitForm();
                    }}
                    onClose={() => {
                      setShowConfirmDialog(false);
                      history.push(routes.pricingCondition.path);
                    }}
                  />
                )}
              </Form>
            )}
          </Formik>
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </div>
    </Fragment>
  );
}

export default PricingConditionsDetailsPage;
