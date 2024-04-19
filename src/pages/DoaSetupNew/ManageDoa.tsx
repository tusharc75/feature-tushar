import { Box, Button, Dialog, Grid, IconButton, InputAdornment, TextField, makeStyles } from '@material-ui/core';
import { Add, Delete } from '@material-ui/icons';
import { Autocomplete, ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import { FieldArray, Form, Formik, FormikProps } from 'formik';
import { useContext, useEffect, useRef, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { DOAType, DoaApproveType, getUniqueCurrencies } from 'src/constants/helpers';

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

  const [initialValues, setInitialValues] = useState({ data: [] });
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
        data:
          data?.approveType === DoaApproveType.user
            ? data?.users?.map((d) => ({ amount: d?.amount, _id: d?.user?.map((u) => u?._id)?.join(',') }))
            : data?.roles?.map((d) => ({ amount: d?.amount, _id: d?.role?.map((r) => r?._id)?.join(',') }))
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
          users: approveType === DoaApproveType.user ? values?.data?.map((d) => ({ amount: parseInt(d?.amount), _id: d?._id?.split(',') })) : [],
          roles: approveType === DoaApproveType.role ? values?.data?.map((d) => ({ amount: parseInt(d?.amount), _id: d?._id?.split(',') })) : []
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
          users: approveType === DoaApproveType.user ? values?.data?.map((d) => ({ amount: parseInt(d?.amount), _id: d?._id?.split(',') })) : [],
          roles: approveType === DoaApproveType.role ? values?.data?.map((d) => ({ amount: parseInt(d?.amount), _id: d?._id?.split(',') })) : []
        })
        .then((res) => {
          onSuccess();
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
        });
    }
  };

  return (
    <Dialog
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
                          name="amount"
                          placeholder="Enter minimum DOA amount"
                          label={isMobile && !isTablet ? 'DOA amount' : 'Enter minimum DOA amount'}
                          value={minAmount}
                          onChange={(e) => {
                            setMinAmount(Number(e.target.value.replace(/[^0-9]/g, '')));
                          }}
                          required
                          //   error={formikRef?.current?.values ? validate(formikRef?.current?.values) : false}
                          //   helperText={formikRef?.current?.values ? (validate(formikRef?.current?.values) ? 'should have minimum amount' : '') : ''}
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
                          renderInput={(params) => <TextField {...params} fullWidth variant="outlined" name={'currency'} label={'Currency'} />}
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
          <Box>
            <Formik initialValues={initialValues} enableReinitialize={true} innerRef={formikRef} onSubmit={() => {}}>
              {({ values }) => (
                <>
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
                            <FieldArray
                              name="data"
                              render={(arrayHelpers) =>
                                values?.data && values?.data?.length > 0 ? (
                                  values?.data?.map((data, i) => (
                                    <Grid container spacing={2} key={i} alignItems="center">
                                      <Grid item md={1} lg={1}>
                                        {i + 1}
                                      </Grid>
                                      <Grid item md={5} lg={5}>
                                        <Autocomplete
                                          fullWidth
                                          multiple
                                          size="small"
                                          options={
                                            approveType === DoaApproveType.user
                                              ? userList?.filter((user) => !values?.data?.some((e) => e?._id?.split(',').some((d) => d === user?.id)))
                                              : roleList?.filter((role) => !values?.data?.some((e) => e?._id?.split(',').some((d) => d === role?.id)))
                                          }
                                          getOptionLabel={(option: any) => (option?.name ? option?.name : '')}
                                          value={
                                            approveType === DoaApproveType.user
                                              ? userList?.filter((element) => data?._id?.split(',')?.some((d) => d === element?.id))
                                              : roleList?.filter((element) => data?._id?.split(',')?.some((d) => d === element?.id))
                                          }
                                          onChange={(event, newValue) => {
                                            arrayHelpers.replace(i, {
                                              ...values.data[i],
                                              ['_id']: newValue?.map((d) => d.id).toString()
                                            });
                                          }}
                                          renderOption={(option) => <>{option?.name}</>}
                                          renderInput={(params) => <TextField {...params} variant="outlined" name="_id" required />}
                                        />
                                      </Grid>
                                      {checkType === DOAType.amount && (
                                        <Grid item md={4} lg={4}>
                                          <TextField
                                            fullWidth
                                            InputProps={{
                                              startAdornment: <InputAdornment position="start">{currencySymbol ? currencySymbol : ''}</InputAdornment>
                                            }}
                                            variant="outlined"
                                            type="text"
                                            size="small"
                                            name="amount"
                                            value={data?.amount}
                                            onChange={(e) => {
                                              arrayHelpers.replace(i, {
                                                ...values.data[i],
                                                ['amount']: e.target.value.replace(/[^0-9]/g, '')
                                              });
                                            }}
                                            required
                                          />
                                        </Grid>
                                      )}
                                      <Grid item md={2} lg={2}>
                                        <IconButton
                                          size="small"
                                          aria-label="add"
                                          onClick={() => {
                                            arrayHelpers.insert(i + 1, { _id: '', amount: 0 });
                                          }}
                                        >
                                          <Add fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" aria-label="delete" onClick={() => arrayHelpers.remove(i)}>
                                          <Delete fontSize="small" color="error" />
                                        </IconButton>
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
                                        arrayHelpers.push({ _id: '', amount: 0 });
                                      }}
                                    >
                                      Add {approveType}
                                    </Button>
                                  </Grid>
                                )
                              }
                            />
                          </Box>
                        </Grid>
                      </Grid>
                    </Form>
                  </CustomDialogContent>
                  <CustomDialogFooter>
                    <Button variant="outlined" color="primary" size="small" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      type="submit"
                      size="small"
                      onClick={() => {
                        handleSubmit(values);
                      }}
                    >
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
