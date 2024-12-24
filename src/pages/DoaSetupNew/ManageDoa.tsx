import { Box, Button, Dialog, Grid, IconButton, InputAdornment, TextField } from '@mui/material';
import { Add, Delete } from '@material-ui/icons';
import { Autocomplete, ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import { FieldArray, Form, Formik, FormikProps } from 'formik';
import { isEmpty } from 'lodash';
import { useContext, useEffect, useRef, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { DOAType, DoaApproveType, getUniqueCurrencies } from 'src/constants/helpers';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme) => ({
  root: {
    margin: 0,
    padding: theme.spacing(1.5, 1.5, 1.5, 2)
  },
  doaHeader: {
    background: 'var(--dark-secondary, #f1f5ff)',
    padding: '8px 14px',
    fontWeight: 'bold'
  },
  contentBox: {
    margin: '10px',
    border: '1px solid var(--common-border-color)',
    borderRadius: '4px',
    padding: '4px !important'
  }
}));

const ManageDoa = ({ onClose, onSuccess, resource, entity, data }) => {
  const toastConfig = useContext(CustomToastContext);
  const classes = useStyles();

  const formikRef = useRef<FormikProps<{ data: any[] }>>();

  const [initialValues, setInitialValues] = useState({ users: [], roles: [] });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [checkType, setCheckType] = useState(data?.checkType || DOAType.sequence);
  const [approveType, setApproveType] = useState(data?.approveType || DoaApproveType.user);
  const [currencyOptions, setCurrencyOptions] = useState([]);
  const [currency, setCurrency] = useState(data?.currency || '');
  const [currencySymbol, setCurrencySymbol] = useState(
    getUniqueCurrencies().some((data) => data?.currencyCode === currency)
      ? getUniqueCurrencies().find((data) => data?.currencyCode === currency).symbolNative
      : null
  );
  const [minAmount, setMinAmount] = useState(data?.minAmount || 0);
  const [userList, setUserList] = useState([]);
  const [roleList, setRoleList] = useState([]);

  useEffect(() => {
    if (data) {
      setInitialValues({
        users: data?.users?.map((u) => ({
          amount: u?.amount,
          _id: u?.user?.map((u) => u?._id)
        })),
        roles: data?.roles?.map((r) => ({
          amount: r?.amount,
          _id: r?.role?.map((u) => u?._id)
        }))
      });
    }
  }, [data]);

  useEffect(() => {
    if (entity) {
      fetchEntityUser();
    }
    fetchRoles();
  }, [entity]);

  useEffect(() => {
    const sortedArr = getUniqueCurrencies().sort((a, b) =>
      a.name.toUpperCase() < b.name.toUpperCase() ? -1 : a.name.toUpperCase() > b.name.toUpperCase() ? 1 : 0
    );
    setCurrencyOptions(sortedArr);
  }, []);

  const handleCheckType = (event, newFilter) => {
    if (newFilter !== null) {
      setCheckType(newFilter);
    }
    formikRef.current?.resetForm();
    if (newFilter === DOAType.sequence) {
      if (minAmount) {
        setMinAmount(0);
      }
      if (currency) {
        setCurrency('');
      }
    }
  };

  const handleApproveType = (event, newFilter) => {
    if (newFilter !== null) {
      setApproveType(newFilter);
    }
    formikRef.current?.resetForm();
  };

  const fetchEntityUser = () => {
    axiosInstance()
      .get(`/user?filterById=[{"field": "entities.entity", "term": "${entity}"}]`)
      .then(({ data: { data } }) => {
        setUserList(
          data.length
            ? data.map((user: any) => ({
                id: user._id,
                name: `${user.firstName} ${user.lastName}`
              }))
            : []
        );
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchRoles = async () => {
    axiosInstance()
      .get(`/role`)
      .then(({ data: { data } }) => {
        setRoleList(
          data.length
            ? data.map((role: any) => ({
                id: role._id,
                name: role.name
              }))
            : []
        );
      });
  };

  const handleSubmit = (values) => {
    if (isEmpty(validation())) {
      if (data) {
        axiosInstance()
          .put('/doa-setup', {
            _id: data?._id,
            resource,
            entity,
            minAmount,
            currency,
            checkType,
            approveType,
            users: approveType === DoaApproveType.user ? values?.users : [],
            roles: approveType === DoaApproveType.role ? values?.roles : []
          })
          .then((res) => {
            onSuccess();
          })
          .catch((err) => {
            toastConfig.setToastConfig(err);
          });
      } else {
        axiosInstance()
          .post('/doa-setup', {
            resource,
            entity,
            minAmount,
            currency,
            checkType,
            approveType,
            users: approveType === DoaApproveType.user ? values?.users : [],
            roles: approveType === DoaApproveType.role ? values?.roles : []
          })
          .then((res) => {
            onSuccess();
          })
          .catch((err) => {
            toastConfig.setToastConfig(err);
          });
      }
    }
  };

  const RenderField = ({ data, options, arrayHelpers, approveType, touched, errors, name }) => {
    return data && data?.length > 0 ? (
      data?.map((_data, i) => (
        <Grid container spacing={1} key={i} alignItems="center">
          <Grid item className="!flex-shrink-0">
            <span className="block min-w-[26px] px-2">{i + 1}.</span>
          </Grid>
          <Grid item xs={6} md={5} lg={5}>
            <Autocomplete
              fullWidth
              limitTags={1}
              multiple
              size="small"
              options={options?.filter((user) => !data?.some((e) => e?._id?.some((d) => d === user?.id)))}
              getOptionLabel={(option: any) => (option?.name ? option?.name : '')}
              value={options?.filter((element) => _data?._id?.some((d) => d === element?.id))}
              onChange={(event, newValue) => {
                arrayHelpers.replace(i, {
                  ...data[i],
                  ['_id']: newValue?.map((d) => d.id)
                });
              }}
              renderOption={(option) => <>{option?.name}</>}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  name="_id"
                  required
                  error={touched[name] && touched[name][i]?._id && errors && Boolean(errors[i]?._id)}
                  helperText={touched[name] && touched[name][i]?._id && errors && errors[i]?._id}
                />
              )}
            />
          </Grid>
          {checkType === DOAType.amount && (
            <Grid item xs={3} md={4} lg={4}>
              <TextField
                fullWidth
                InputProps={{
                  startAdornment: <InputAdornment position="start">{currencySymbol ? currencySymbol : ''}</InputAdornment>
                }}
                variant="outlined"
                type="text"
                size="small"
                name="amount"
                value={_data?.amount}
                onChange={(e) => {
                  arrayHelpers.replace(i, {
                    ...data[i],
                    ['amount']: e.target.value ? parseInt(e.target.value) : 0
                  });
                }}
                required
                error={touched[name] && touched[name][i]?.amount && errors && Boolean(errors[i]?.amount)}
                helperText={touched[name] && touched[name][i]?.amount && errors && errors[i]?.amount}
              />
            </Grid>
          )}
          <Grid item md={2} lg={2} className="max-[768px]:!ml-auto max-[768px]:max-w-fit">
            <Box mt={0.7}>
              <IconButton
                size="small"
                aria-label="add"
                disabled={options?.length === data?.length || options?.length === data?.reduce((len, curr) => len + curr?._id?.length, 0)}
                onClick={() => {
                  arrayHelpers.insert(i + 1, { _id: [], amount: 0 });
                }}
              >
                <Add fontSize="small" />
              </IconButton>
              <IconButton size="small" aria-label="delete" onClick={() => arrayHelpers.remove(i)}>
                <Delete fontSize="small" color="error" />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      ))
    ) : (
      <Grid item md={12} lg={12} className="d-flex align-items-center justify-content-center">
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={() => {
            arrayHelpers.push({ _id: [], amount: 0 });
          }}
        >
          Add {approveType}
        </Button>
      </Grid>
    );
  };

  const validation = () => {
    const error: any = {};
    if (checkType === DOAType.amount) {
      if (!minAmount) {
        error['minAmount'] = 'Required field';
      }
      if (!currency) {
        error['currency'] = 'Required field';
      }
    }
    return error;
  };

  const validate = (values) => {
    const errors: any = {};
    if (approveType === DoaApproveType.user && values?.users?.length > 0) {
      values?.users?.forEach((d, i) => {
        if (!d._id?.length) {
          errors[i] = { _id: `User is required` };
        }
        if (checkType === DOAType.amount) {
          if (d?.amount < minAmount) {
            errors[i] = { ...errors[i], amount: `Amount should be equal or greater than Min Amount` };
          }
        }
      });
    }

    if (approveType === DoaApproveType.role && values?.roles?.length > 0) {
      values?.roles?.forEach((d, i) => {
        if (!d._id?.length) {
          errors[i] = { _id: `Role is required` };
        }
        if (checkType === DOAType.amount) {
          if (d?.amount < minAmount) {
            errors[i] = { ...errors[i], amount: `Amount should be equal or greater than Min Amount` };
          }
        }
      });
    }
    return errors;
  };

  return (
    <Dialog
      TransitionComponent={CustomDialogTransition}
      open={true}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          onClose();
        }
      }}
      scroll="body"
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen}
    >
      <>
        <CustomDialogHeader
          title={data ? 'Edit DOA' : 'Add DOA'}
          onClose={onClose}
          isMinimized={!fullScreen}
          onMinimizeMaximize={() => {
            setFullScreen((prevState) => !prevState);
          }}
          showManimizeMaximize={true}
        />
        <>
          <Box>
            <Formik initialValues={initialValues} enableReinitialize={true} innerRef={formikRef} validate={validate} onSubmit={handleSubmit}>
              {({ values, errors, touched, submitForm }) => (
                <>
                  <div style={{ minHeight: fullScreen || isMobile || isTablet ? 'calc(100vh - 110px)' : '' }}>
                    <Box padding={2} className={classes.contentBox}>
                      <Box padding={1}>
                        <Grid container spacing={2}>
                          <Grid item md={5} lg={5} sm={12} xs={12}>
                            <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'}>
                              <ToggleButtonGroup size="small" value={checkType} exclusive onChange={handleCheckType}>
                                {Object.keys(DOAType)?.map((k, index) => {
                                  return (
                                    <ToggleButton style={{ width: 80 }} value={DOAType[k]} key={index}>
                                      {DOAType[k]}
                                    </ToggleButton>
                                  );
                                })}
                              </ToggleButtonGroup>
                              <ToggleButtonGroup size="small" value={approveType} exclusive onChange={handleApproveType}>
                                {Object.keys(DoaApproveType)?.map((k, index) => {
                                  return (
                                    <ToggleButton style={{ width: 80 }} value={DoaApproveType[k]} key={index}>
                                      {DoaApproveType[k]}
                                    </ToggleButton>
                                  );
                                })}
                              </ToggleButtonGroup>
                            </Box>
                          </Grid>
                          <Grid item md={7} lg={7} sm={12} xs={12}>
                            {checkType === DOAType.amount && (
                              <Grid container spacing={2}>
                                <Grid item md={6} lg={6} sm={6} xs={6}>
                                  <TextField
                                    InputProps={{
                                      startAdornment: <InputAdornment position="start">{currencySymbol ? currencySymbol : ''}</InputAdornment>
                                    }}
                                    variant="outlined"
                                    type="text"
                                    size="small"
                                    fullWidth
                                    name="minAmount"
                                    placeholder="Enter minimum DOA amount"
                                    label={isMobile && !isTablet ? 'DOA amount' : 'Enter minimum DOA amount'}
                                    value={minAmount}
                                    onChange={(e) => {
                                      setMinAmount(Number(e.target.value.replace(/[^0-9]/g, '')));
                                    }}
                                    error={validation()?.minAmount}
                                    helperText={validation()?.minAmount}
                                  />
                                </Grid>
                                <Grid item md={6} lg={6} sm={6} xs={6}>
                                  <Autocomplete
                                    fullWidth
                                    className={`max-w-full`}
                                    size="small"
                                    value={
                                      currencyOptions.filter((data) => data?.currencyCode === currency).length
                                        ? currencyOptions.filter((data) => data?.currencyCode === currency)[0]
                                        : ''
                                    }
                                    options={currencyOptions}
                                    getOptionLabel={(option: any) =>
                                      option ? `${option.currencyCode} - ${option.currencyName} - (${option.symbolNative})` : ''
                                    }
                                    getOptionSelected={(option: any, val) => option?.currencyCode === val}
                                    onChange={(e, val) => {
                                      setCurrency(val?.currencyCode ? val?.currencyCode : '');
                                      setCurrencySymbol(val?.symbolNative);
                                    }}
                                    renderInput={(params) => (
                                      <TextField
                                        {...params}
                                        fullWidth
                                        variant="outlined"
                                        name={'currency'}
                                        label={'Currency'}
                                        error={validation()?.currency}
                                        helperText={validation()?.currency}
                                      />
                                    )}
                                    renderOption={(option) => {
                                      const { currencyCode, currencyName, symbolNative } = option;
                                      return `${currencyCode} - ${currencyName} - (${symbolNative})`;
                                    }}
                                  />
                                </Grid>
                              </Grid>
                            )}
                          </Grid>
                        </Grid>
                      </Box>
                    </Box>
                    <CustomDialogContent className={classes.contentBox}>
                      <Form>
                        <Grid container direction="column">
                          <Grid item md={12} lg={12}>
                            {values?.data && values?.data?.length > 0 && (
                              <Box className={`${classes.doaHeader} max-[600px]:hidden`}>
                                <Grid container spacing={2}>
                                  <Grid item md={1} lg={1}>
                                    Index
                                  </Grid>
                                  <Grid item md={5} lg={5}>
                                    {approveType}
                                  </Grid>
                                  {checkType === DOAType.amount && (
                                    <Grid item md={4} lg={4}>
                                      Amount
                                    </Grid>
                                  )}
                                  <Grid item md={2} lg={2}></Grid>
                                </Grid>
                              </Box>
                            )}
                          </Grid>
                          <Grid item md={12} lg={12}>
                            <Box p={1}>
                              {approveType === DoaApproveType.user ? (
                                <FieldArray
                                  name="users"
                                  render={(arrayHelpers) => (
                                    <RenderField
                                      data={values?.users}
                                      options={userList}
                                      arrayHelpers={arrayHelpers}
                                      approveType={DoaApproveType.user}
                                      touched={touched}
                                      errors={errors}
                                      name={'users'}
                                    />
                                  )}
                                />
                              ) : (
                                <FieldArray
                                  name="roles"
                                  render={(arrayHelpers) => (
                                    <RenderField
                                      data={values?.roles}
                                      options={roleList}
                                      arrayHelpers={arrayHelpers}
                                      approveType={DoaApproveType.role}
                                      touched={touched}
                                      errors={errors}
                                      name={'roles'}
                                    />
                                  )}
                                />
                              )}
                            </Box>
                          </Grid>
                        </Grid>
                      </Form>
                    </CustomDialogContent>
                  </div>
                  <CustomDialogFooter>
                    <Button variant="outlined" color="primary" size="small" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button variant="contained" color="primary" type="submit" size="small" onClick={submitForm}>
                      Save
                    </Button>
                  </CustomDialogFooter>
                </>
              )}
            </Formik>
          </Box>
        </>
      </>
    </Dialog>
  );
};

export default ManageDoa;
