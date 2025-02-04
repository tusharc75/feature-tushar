import {
  Box,
  ButtonGroup,
  Container,
  Dialog,
  DialogContent,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Switch,
  TextField,
  Theme
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { makeStyles } from '@mui/styles';
import { Add, Delete } from '@mui/icons-material';
import { Autocomplete, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { FieldArray, Form, Formik, FormikProps } from 'formik';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import { cn, CustomDialogTransition, getUniqueCurrencies, removeEmptyKeys } from '../../../constants/helpers';
import CurrencyAutocomplete from 'src/components/Helpers/CurrencyAutocomplete';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const DoaApproveType = [
  {
    key: 'User',
    value: 0
  },
  {
    key: 'Role',
    value: 1
  }
];

const DOAType = [
  {
    key: 'Sequence',
    value: 1
  },
  {
    key: 'Amount',
    value: 2
  }
];

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    margin: 0,
    padding: theme.spacing(1.5, 1.5, 1.5, 2)
    // borderBottom: `1px solid #daf5ff`
  },
  dialogTitle: {
    fontSize: '1.2rem'
  },
  doaBox: {
    background: '#eeeeee',
    borderBottom: '2px solid var(--common-border-color)',
    padding: '10px'
  }
}));

const DoaDialog = ({
  selectedEntity,
  onSuccess,
  userList,
  doa,
  doaCurrency,
  doaMinLimit = 0,
  doaType = null,
  open,
  onClose,
  from = 'EntityDetailPage',
  isRenderedFromUserSetUp = false,
  doaApproveType = 'User'
}) => {
  const toastConfig = useContext(CustomToastContext);
  const classes = useStyles();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [roleList, setRoleList] = useState<any[]>([]);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const [check, setCheck] = useState(false);
  const [doaLowerLimit, setDoaLowerLimit] = useState(doaMinLimit);
  const [currency, setCurrency] = useState(doaCurrency ? doaCurrency : '');
  const [currencySymbol, setCurrencySymbol] = useState(
    getUniqueCurrencies().some((data) => data?.currencyCode === currency)
      ? getUniqueCurrencies().find((data) => data?.currencyCode === currency).symbolNative
      : null
  );

  const tempUserList = from === 'EntityDetailPage' ? userList?.filter((v) => v?.id !== selectedEntity[0]) : userList?.filter((v) => v?.id !== 'self');
  const fetchDoa = useCallback(() => {
    doa?.length > 0
      ? setUsers(
          doa.map((d) => ({
            ...d,
            user: doaApproveType === 'User' ? d?.user?.map((e) => e?._id)?.toString() : d?.role?.map((e) => e?._id)?.toString()
          }))
        )
      : setUsers([{ user: tempUserList ? tempUserList[0]?.name : '', amount: 0, disable: false }]);
  }, []);

  useEffect(() => {
    fetchDoa();
  }, [fetchDoa]);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    axiosInstance()
      .get(`/role`)
      .then(({ data: { data, count } }) => {
        const rows = data.length
          ? data.map((role: any) => ({
              id: role._id,
              name: role.name
            }))
          : [];

        setRoleList(rows);
      });
  };

  const handleSubmit = async (values) => {
    let doaArray;
    if (doaApprove === 0) {
      if (selectedType === 2) {
        doaArray = values
          .sort((a, b) => a.amount - b.amount)
          .filter((item) => item.user !== '' && item.user !== undefined)
          .map((item) => {
            return {
              user: item.user.split(','),
              amount: item.amount ? Number(item.amount) : 0,
              disable: item.disable
            };
          });
        let self_index = doaArray.findIndex((x) => x.user === selectedEntity[0] || x.user === 'self');
        if (self_index > 0) {
          var element = doaArray[self_index];
          doaArray.splice(self_index, 1);
          doaArray.splice(0, 0, element);
        }
      } else {
        doaArray = values
          .filter((item) => item.user !== '' && item.user !== undefined)
          .map((item) => {
            return {
              user: item.user.split(',')
            };
          });
      }
    } else {
      if (selectedType === 2) {
        doaArray = values
          .sort((a, b) => a.amount - b.amount)
          .filter((item) => item.user !== '' && item.user !== undefined)
          .map((item) => {
            return {
              role: item.user.split(','),
              amount: item.amount ? Number(item.amount) : 0,
              disable: item.disable
            };
          });
        let self_index = doaArray.findIndex((x) => x.user === selectedEntity[0] || x.user === 'self');
        if (self_index > 0) {
          var element = doaArray[self_index];
          doaArray.splice(self_index, 1);
          doaArray.splice(0, 0, element);
        }
      } else {
        doaArray = values
          .filter((item) => item.user !== '' && item.user !== undefined)
          .map((item) => {
            return {
              role: item.user.split(',')
            };
          });
      }
    }

    const userDoa = {
      _ids: selectedEntity,
      doaCurrency: selectedType === 2 ? currency : '',
      doa: doaArray,
      doaType: selectedType,
      doaMinLimit: selectedType === 2 ? doaLowerLimit : 0,
      doaApproveType: DoaApproveType.find((d) => d.value === doaApprove)?.key
    };
    setLoading(true);
    axiosInstance()
      .put('/doa/setups', removeEmptyKeys(userDoa))
      .then(({ data }) => {
        toastConfig.setToastConfig({ open: true, type: 'success', message: data.message });
        setLoading(false);
        onSuccess();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setLoading(false);
      });
  };

  const [filter, setFilter] = useState(doaType ? DOAType.find((d) => d.value === doaType).key : 'Sequence');
  const [selectedType, setSelectedType] = useState(doaType ? doaType : DOAType.find((d) => d.key === 'Sequence').value);
  const formikRef = useRef<FormikProps<{ users: any[] }>>();

  const handleFilter = (event, newFilter) => {
    if (newFilter !== null) {
      setFilter(newFilter);
      setSelectedType(DOAType.find((d) => d.key === newFilter).value);
      if (newFilter === 'Sequence') {
        doa.length > 0
          ? setUsers(
              doa.map((d) => ({
                ...d,
                user: doaApproveType === 'User' ? d?.user.map((e) => e?._id).toString() : d?.role.map((e) => e?._id).toString()
              }))
            )
          : setUsers([{ user: tempUserList ? tempUserList[0]?.id : '', amount: 0, disable: false }]);
      } else {
        doa.length > 0
          ? setUsers(
              doa.map((d) => ({
                ...d,
                user: doaApproveType === 'User' ? d?.user.map((e) => e?._id).toString() : d?.role.map((e) => e?._id).toString()
              }))
            )
          : setUsers([{ user: tempUserList ? tempUserList[0]?.id : '', amount: 0, disable: false }]);
      }
      formikRef.current?.resetForm();
    }
  };

  const [doaApprove, setDoaApprove] = useState(doaApproveType ? DoaApproveType.find((d) => d.key === doaApproveType)?.value : 0);
  const [selectedDoaApprove, setSelectedDoaApprove] = useState(doaApproveType ? doaApproveType : 'User');
  const handleDOAAproveTypeFilter = (event, newFilter) => {
    if (newFilter !== null) {
      setSelectedDoaApprove(newFilter);
      setDoaApprove(DoaApproveType.find((d) => d.key === newFilter).value);
    }
    formikRef.current?.resetForm();
  };

  const validate = (values) => {
    let errors = null;

    if (values?.users?.length > 0) {
      let minTemp = values?.users?.reduce(function (previous, current) {
        return previous?.amount < current?.amount ? previous : current;
      });
      let tempUser = values.users.find((item) => item.id === selectedEntity[0] || item.id === 'self');
      if (tempUser && tempUser.amount !== minTemp.amount) {
        errors = 'Too many characters!';
      }
      if (doaLowerLimit > minTemp.amount) {
        errors = 'Too many characters!';
      }
    }

    return errors;
  };

  return (
    <Dialog TransitionComponent={CustomDialogTransition} open={open} onClose={onClose} scroll="body" maxWidth="md" fullWidth fullScreen={fullScreen}>
      {!loading && (
        <>
          {!isRenderedFromUserSetUp && (
            <CustomDialogHeader
              title={doa?.length > 0 ? 'Edit DOA' : 'Add DOA'}
              onClose={onClose}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
            />
          )}

          <Formik initialValues={{ users: users }} enableReinitialize={true} innerRef={formikRef} onSubmit={() => {}}>
            {({ values }) => (
              <>
                <DialogContent style={{ height: fullScreen ? 'calc(100dvh - 102px)' : '' }}>
                  <div className="flex flex-wrap items-start gap-4 py-4">
                    <div className="flex w-full flex-wrap gap-2 md:w-[calc(50%-8px)]">
                      <ToggleButtonGroup size="small" value={filter} exclusive onChange={handleFilter}>
                        {DOAType.map((k, index) => {
                          return (
                            <ToggleButton style={{ width: 80 }} value={k.key} key={index}>
                              {k.key}
                            </ToggleButton>
                          );
                        })}
                      </ToggleButtonGroup>
                      <ToggleButtonGroup size="small" value={selectedDoaApprove} exclusive onChange={handleDOAAproveTypeFilter}>
                        {DoaApproveType.map((k, index) => {
                          return (
                            <ToggleButton style={{ width: 80 }} value={k.key} key={index}>
                              {k.key}
                            </ToggleButton>
                          );
                        })}
                      </ToggleButtonGroup>
                    </div>
                    <div className="grid w-full gap-2 sm:grid-cols-2 md:w-[calc(50%-8px)]">
                      {selectedType === 2 && (
                        <>
                          <TextField
                            slotProps={{
                              input: {
                                startAdornment: <InputAdornment position="start">{currencySymbol ? currencySymbol : ''}</InputAdornment>
                              }
                            }}
                            variant="outlined"
                            type="text"
                            size="small"
                            fullWidth
                            name="amount"
                            placeholder="Enter minimum DOA amount"
                            label={isMobile && !isTablet ? 'DOA amount' : 'Enter minimum DOA amount'}
                            value={doaLowerLimit}
                            onChange={(e) => {
                              setDoaLowerLimit(Number(e.target.value.replace(/[^0-9]/g, '')));
                            }}
                            required
                            error={formikRef?.current?.values ? validate(formikRef?.current?.values) : false}
                            helperText={formikRef?.current?.values ? (validate(formikRef?.current?.values) ? 'should have minimum amount' : '') : ''}
                          />
                        </>
                      )}
                      {selectedType === 2 && (
                        <CurrencyAutocomplete
                          limitTags={2}
                          value={currency}
                          label={'Currency'}
                          name={currency}
                          fullWidth={true}
                          onChange={(e, val) => {
                            setCurrency(val?.currencyCode ? val?.currencyCode : '');
                            setCurrencySymbol(val?.symbolNative);
                          }}
                          size="small"
                        />
                      )}
                    </div>
                  </div>
                  <Form>
                    <div className={cn('overflow-auto border', fullScreen ? 'max-h-[calc(calc(100dvh-220px))]' : 'max-h-[50dvh]')}>
                      <table className="w-full table-auto border-collapse text-sm">
                        {values.users && values.users.length > 0 && (
                          <thead>
                            <tr className="sticky top-0 z-10 bg-[var(--dark-secondary,#f1f5ff)]">
                              <td className="w-[100px] max-w-[100px] border-b p-[16px_16px_16px_24px] text-center font-bold">Index</td>
                              <td className="border-b p-[16px_16px_16px_24px] font-bold">{doaApprove === 0 ? 'User' : 'Role'}</td>
                              {selectedType === 2 && <td className="border-b p-[16px_16px_16px_24px] font-bold">Amount</td>}
                              <td className="sticky right-0 w-[140px] max-w-[140px] border-b bg-[var(--dark-secondary,#f1f5ff)] p-[16px_16px_16px_24px] font-bold">
                                <span className="sr-only">Action</span>
                              </td>
                            </tr>
                          </thead>
                        )}
                        <FieldArray
                          name="users"
                          render={(arrayHelpers) => (
                            <tbody>
                              {values.users && values.users.length > 0 ? (
                                values.users.map((userVal, index) => (
                                  <tr key={index}>
                                    <td
                                      className={cn(
                                        ' w-[100px]  min-w-[50px] max-w-[100px] p-4 pl-8 text-gray-500 dark:text-gray-400',
                                        values.users.length - 1 === index ? 'border-b-0' : 'border-b'
                                      )}
                                    >
                                      <span className="block px-2 text-center">{index + 1}</span>
                                    </td>
                                    <td
                                      className={cn(
                                        'min-w-[200px] p-4 pl-8 text-gray-500 dark:text-gray-400',
                                        values.users.length - 1 === index ? 'border-b-0' : 'border-b'
                                      )}
                                    >
                                      <Autocomplete
                                        id="combo-box-demo"
                                        limitTags={2}
                                        size="small"
                                        style={{ minWidth: 200 }}
                                        // options={userList}
                                        options={
                                          doaApprove == 0
                                            ? selectedType === 2
                                              ? userList?.filter(
                                                  (element) => !values?.users?.some((e) => e?.user?.split(',').some((d) => d === element.id))
                                                )
                                              : tempUserList?.filter(
                                                  (element) => !values?.users?.some((e) => e?.user?.split(',').some((d) => d === element.id))
                                                )
                                            : selectedType === 2
                                              ? roleList?.filter(
                                                  (element) => !values?.users?.some((e) => e?.user?.split(',').some((d) => d === element.id))
                                                )
                                              : roleList?.filter(
                                                  (element) => !values?.users?.some((e) => e?.user?.split(',').some((d) => d === element.id))
                                                )
                                        }
                                        getOptionLabel={(option: any) => (option?.name ? option?.name : '')}
                                        onChange={(event, newValue) => {
                                          arrayHelpers.replace(index, {
                                            ...values.users[index],
                                            ['user']: newValue?.map((d) => d.id).toString()
                                          });
                                        }}
                                        multiple
                                        value={
                                          doaApprove == 0
                                            ? userList?.filter((element) => userVal?.user?.split(',')?.some((d) => d === element?.id))
                                            : roleList?.filter((element) => userVal?.user?.split(',')?.some((d) => d === element?.id))
                                        }
                                        renderOption={(props, option) => {
                                          const { key, ...optionProps } = props;
                                          return (
                                            <Box key={key} component="li" {...optionProps}>
                                              {option?.name}
                                            </Box>
                                          );
                                        }}
                                        renderInput={(params) => (
                                          <TextField
                                            {...params}
                                            variant="outlined"
                                            name="userField"
                                            error={userVal?.user?.length <= 0}
                                            helperText={userVal?.user?.length <= 0 ? `${doaApprove == 0 ? 'User' : 'Role'}  is Required` : ''}
                                            required
                                          />
                                        )}
                                      />
                                    </td>
                                    {selectedType === 2 && (
                                      <td
                                        className={cn(
                                          'min-w-[200px] p-4 pl-8 text-gray-500 dark:text-gray-400',
                                          values.users.length - 1 === index ? 'border-b-0' : 'border-b'
                                        )}
                                      >
                                        <TextField
                                          fullWidth
                                          slotProps={{
                                            input: {
                                              startAdornment: <InputAdornment position="start">{currencySymbol ? currencySymbol : ''}</InputAdornment>
                                            }
                                          }}
                                          variant="outlined"
                                          type="text"
                                          size="small"
                                          name="amount"
                                          placeholder="Enter Amount"
                                          label="Enter Amount"
                                          value={userVal.amount}
                                          onChange={(e) => {
                                            arrayHelpers.replace(index, {
                                              ...values.users[index],
                                              ['amount']: e.target.value.replace(/[^0-9]/g, '')
                                            });
                                          }}
                                          required
                                        />
                                        {validate(values) && check && (userVal.id === selectedEntity[0] || userVal.id === 'self') && (
                                          <span style={{ color: 'red' }}>{`${userVal.name} should have minimum amount`}</span>
                                        )}
                                      </td>
                                    )}
                                    <td
                                      className={cn(
                                        'sticky right-0 z-[1] w-[140px] max-w-[140px] bg-[--dark-primary,white] px-2 py-4 text-right text-gray-500 dark:text-gray-400',
                                        values.users.length - 1 === index ? 'border-b-0' : 'border-b'
                                      )}
                                    >
                                      <div className="absolute bottom-0 left-0 top-0 w-[1px] bg-[--common-border-color]" />
                                      <ButtonGroup size="medium" aria-label="small outlined button group">
                                        <IconButton
                                          size="small"
                                          aria-label="add"
                                          disabled={values.users.length === userList.length}
                                          onClick={() => {
                                            arrayHelpers.insert(index + 1, { user: '', amount: 0, disable: false });
                                          }}
                                        >
                                          <Add />
                                        </IconButton>
                                        <IconButton
                                          size="small"
                                          aria-label="delete"
                                          style={{ color: '#f44336' }}
                                          onClick={() => arrayHelpers.remove(index)}
                                        >
                                          <Delete />
                                        </IconButton>
                                        <HtmlTooltip title={userVal.disable ? 'User Disabled' : 'User Enabled'}>
                                          <Switch
                                            color={userVal.disable ? 'primary' : 'secondary'}
                                            checked={userVal.disable}
                                            name="disable"
                                            onChange={(e) => {
                                              arrayHelpers.replace(index, {
                                                ...values.users[index],
                                                ['disable']: !userVal.disable
                                              });
                                            }}
                                          />
                                        </HtmlTooltip>
                                      </ButtonGroup>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <Grid size={{ md: 1 }} className="d-flex  align-items-center justify-content-center">
                                  <ThemeButton
                                    buttonType="theme"
                                    onClick={() => {
                                      arrayHelpers.push({ user: '', amount: 0, disable: false });
                                    }}
                                  >
                                    Add Users
                                  </ThemeButton>
                                </Grid>
                              )}
                            </tbody>
                          )}
                        />
                      </table>
                    </div>
                  </Form>
                </DialogContent>
                <CustomDialogFooter>
                  {!isRenderedFromUserSetUp && (
                    <ThemeButton buttonType="transparent" onClick={onClose}>
                      Cancel
                    </ThemeButton>
                  )}
                  <ThemeButton
                    buttonType="theme"
                    disabled={currency === '' && selectedType === 2}
                    onClick={() => {
                      if (values.users.length === 0) {
                        handleSubmit(values.users);
                      } else {
                        validate(values) ? setCheck(true) : handleSubmit(values.users);
                      }
                    }}
                  >
                    {isRenderedFromUserSetUp ? 'Save & Continue' : 'Save'}
                  </ThemeButton>
                </CustomDialogFooter>
              </>
            )}
          </Formik>
        </>
      )}
    </Dialog>
  );
};

export { DoaDialog as default };
