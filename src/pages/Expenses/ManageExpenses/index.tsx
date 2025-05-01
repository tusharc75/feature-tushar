import { useState, useEffect, useContext } from 'react';
import { Formik, Form } from 'formik';
import { Box, InputAdornment, TextField } from '@mui/material';
import Grid from '@mui/material/Grid2';
import Dialog from '@mui/material/Dialog';
import { useHistory } from 'react-router-dom';
import { isEqual } from 'lodash';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../../StateProvider/Provider';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import InputField from 'src/components/Helpers/InputField';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { isMobile, isTablet } from 'react-device-detect';
import {
  CustomDialogTransition,
  getObjKeysWithValues,
  expenses,
  yupSchema,
  sidebarResource,
  getObjKeys,
  GenerateResourceLineNumber,
  getUniqueCurrencies,
  EXPENSE_STATUS
} from '../../../constants/helpers';
import routes from '../../../components/Helpers/Routes';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import ItemizeExpenses from 'src/pages/Expenses/ItemizeExpenses';
import ItemizeMileage from 'src/pages/Expenses/ItemizeMileage';
import AddIcon from '@mui/icons-material/Add';
import { fetch_resource_fields } from 'src/components/ResourceFields';

const ManageExpenses = ({ isClone = false, expenseId = null, isRedirectToDetailPage = true, onClose, onSuccess }) => {
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, resources }
  }: any = useData();

  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showItemizeDialog, setShowItemizeDialog] = useState(false);
  const [showMileageDialog, setShowMileageDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [title, setTitle] = useState('');
  const [resourceData, setResourceData] = useState(null);

  const [totalAmount, setTotalAmount] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [lineItems, setLineItems] = useState([]);

  const [currencySymbol, setCurrencySymbol] = useState(null);
  const [distanceUnit, setDistanceUnit] = useState('mile');

  const [isDisabled, setIsDisabled] = useState(false);

  useEffect(() => {
    fetchPolicy();
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      let { fieldsDataAll, fieldsDataForCreate, fieldsDataForUpdate } = await fetch_resource_fields(sidebarResource?.expenses);
      if (expenseId) {
        axiosInstance()
          .get(`${expenses.api}/` + expenseId)
          .then(({ data: { data } }) => {
            if (isClone) {
              const { _id, brand, createdBy, history, expenseNumber, updatedBy, ...rest } = data;
              setTitle(`Clone - ${expenseNumber}`);
              rest.expenseNumber = GenerateResourceLineNumber(fieldsDataForCreate);
              rest.status = EXPENSE_STATUS.unreported;
              setInitialData({
                fields: fieldsDataForCreate,
                values: { ...getObjKeysWithValues(rest, fieldsDataForCreate, true, user) }
              });
            } else {
              setTotalAmount(data.totalAmount);
              setTotalDistance(data.totalDistance);
              setLineItems(data.lineItems);
              if (data.status !== EXPENSE_STATUS.unreported) {
                setIsDisabled(true);
                fieldsDataForUpdate?.forEach((e) => {
                  if (['expenseDate', 'type', 'currency']?.includes(e?.fieldName)) {
                    e.isUneditable = true;
                  }
                })
              }
              setCurrencySymbol(getUniqueCurrencies().find((d) => d.currencyCode === data.currency)?.symbolNative);
              setTitle(`Edit - ${data.expenseNumber}`);
              setInitialData({
                fields: fieldsDataForUpdate,
                values: { ...getObjKeysWithValues(data, fieldsDataAll) }
              });
            }
          })
          .catch((error) => {
            toastConfig.setToastConfig(error);
          });
      } else {
        setTitle(`Create ${resources?.expenses?.titleSingular}`);
        let initialData = getObjKeys('', fieldsDataForCreate);
        initialData['expenseNumber'] = GenerateResourceLineNumber(fieldsDataForCreate);
        if (fieldsDataForCreate?.some((e) => e.fieldName === 'currency')) {
          initialData['currency'] = user.user?.brandCurrency;
        }
        initialData['users'] = [user?.user?._id];
        setCurrencySymbol(getUniqueCurrencies().find((d) => d.currencyCode === initialData['currency'])?.symbolNative);
        setInitialData({
          fields: fieldsDataForCreate,
          values: initialData
        });
      }
    }
    catch (error) {
      toastConfig.setToastConfig(error);
    }
  }

  const fetchPolicy = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.expenses}`);
      if (data) {
        setResourceData(data);
        if (data?.distanceUnit) {
          setDistanceUnit(data?.distanceUnit)
        }
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleSubmit = (values: any) => {
    setIsSubmitting(true);
    if (values?.type === 'Mileage') {
      values.totalAmount = totalAmount;
      values.totalDistance = totalDistance;
      values.distanceUnit = distanceUnit;
      values.lineItems = lineItems?.map((e) => {
        return { ...e, amount: parseFloat(e?.amount), distance: parseFloat(e?.distance), rate: parseFloat(e?.rate) };
      });
    } else {
      values.totalAmount = totalAmount;
      values.lineItems = lineItems?.map((e) => {
        return { ...e, amount: parseFloat(e?.amount) };
      });
    }
    if (expenseId && isClone === false) {
      values._id = expenseId;
      axiosInstance()
        .put(`${expenses.api}`, values)
        .then(({ data }) => {
          setIsSubmitting(false);
          onSuccess();
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
        })
        .catch((error) => {
          setIsSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      axiosInstance()
        .post(`${expenses.api}`, values)
        .then(({ data: { data, message } }) => {
          if (isRedirectToDetailPage) {
            history.push(`${routes.expensesDetail.path}/${data._id}`);
          }
          setIsSubmitting(false);
          onSuccess(data);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: message
          });
        })
        .catch((error) => {
          setIsSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleSaveLineItems = (rows) => {
    setLineItems(rows);
    const total = rows
      .reduce((total, field) => {
        const amount = parseFloat(field.amount) || 0;
        return total + amount;
      }, 0)
      .toFixed(2);
    const distance = rows
      .reduce((total, field) => {
        const distance = parseFloat(field.distance) || 0;
        return total + distance;
      }, 0)
      .toFixed(2);
    setTotalAmount(parseFloat(total));
    setTotalDistance(parseFloat(distance));
  };

  const handleScroll = (errors) => {
    const err = Object.keys(errors);
    if (err.length) {
      const input = document.querySelector(`input[name=${err[0]}]`);
      input.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'start'
      });
    }
  };

  function validate() {
    const errors = {};
    if (!totalAmount) {
      errors['totalAmount'] = 'Please enter amount';
    }
    return errors;
  }

  return (
    <Dialog
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true);
        }
      }}
      open={true}
    >
      {initialData && initialData?.fields?.length ? (
        <Formik validate={validate} initialValues={{ ...initialData.values, totalAmount: totalAmount }} validationSchema={yupSchema(initialData.fields)} validateOnMount onSubmit={handleSubmit}>
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <>
              <CustomDialogHeader
                title={title}
                onClose={() => {
                  if (isEqual(values, initialData.values)) {
                    onClose();
                  } else {
                    setShowConfirmDialog(true);
                  }
                }}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              />
              <CustomDialogContent>
                <Form>
                  <InputField
                    errors={errors}
                    values={values}
                    setFieldValue={setFieldValue}
                    onChange={setCurrencySymbol(getUniqueCurrencies().find((d) => d.currencyCode === values.currency)?.symbolNative)}
                    touched={touched}
                    fieldsData={initialData.fields}
                    size="small"
                    fullWidth
                  />
                  <Grid container spacing={2} sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Grid size={{ xs: 6, sm: 6, md: 6, lg: 6 }}>
                      <ThemeButton
                        startIcon={<AddIcon fontSize="small" />}
                        disabled={isDisabled}
                        onClick={() => {
                          if (values['type'] === 'Mileage') {
                            setShowMileageDialog(true);
                          } else {
                            setShowItemizeDialog(true);
                          }
                        }}
                      >
                        {values['type'] === 'Mileage' ? 'Add Mileage' : 'Itemize Expense'}
                      </ThemeButton>
                    </Grid>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6, sm: 6, md: 6, lg: 6 }}>
                        <TextField
                          id="outlined-required"
                          label="Total Amount"
                          name="totalAmount"
                          required
                          type="number"
                          size="small"
                          disabled={lineItems.length > 0 || isDisabled}
                          value={totalAmount}
                          onChange={(event) => {
                            setTotalAmount(parseFloat(event.target.value));
                          }}
                          fullWidth
                          slotProps={{
                            input: {
                              startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment>
                            }
                          }}
                          error={touched['totalAmount'] && Boolean(errors['totalAmount'])}
                          helperText={touched['totalAmount'] && errors['totalAmount']}
                        />
                      </Grid>
                      {values['type'] === 'Mileage' && (
                        <Grid size={{ xs: 6, sm: 6, md: 6, lg: 6 }}>
                          <TextField
                            id="outlined-required"
                            label={`Total Distance (${distanceUnit})`}
                            required
                            type="number"
                            size="small"
                            disabled={lineItems.length > 0 || isDisabled}
                            value={totalDistance}
                            onChange={(event) => {
                              setTotalDistance(parseFloat(event.target.value));
                            }}
                            fullWidth
                          />
                        </Grid>
                      )}
                    </Grid>
                  </Grid>
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <ThemeButton
                  buttonType="transparent"
                  id="dialog-cancel-button"
                  onClick={() => {
                    if (isEqual(values, initialData.values)) {
                      onClose();
                    } else {
                      setShowConfirmDialog(true);
                    }
                  }}
                >
                  Cancel
                </ThemeButton>
                <ThemeButton
                  isLoading={isSubmitting}
                  buttonType="theme"
                  id="dialog-save-button"
                  disabled={isSubmitting}
                  onClick={(e) => {
                    submitForm();
                  }}
                >
                  Save
                </ThemeButton>
              </CustomDialogFooter>
              {showConfirmDialog && (
                <ConfirmCancelDialog
                  open={showConfirmDialog}
                  onSave={() => {
                    setShowConfirmDialog(false);
                    handleScroll(errors);
                    submitForm();
                  }}
                  onClose={() => {
                    setShowConfirmDialog(false);
                    onClose();
                  }}
                />
              )}
              {showItemizeDialog && (
                <ItemizeExpenses
                  onClose={() => setShowItemizeDialog(false)}
                  onSave={handleSaveLineItems}
                  lineItems={lineItems}
                  currency={values?.currency}
                  currencySymbol={currencySymbol}
                  isSubmitting={isSubmitting}
                />
              )}
              {showMileageDialog && (
                <ItemizeMileage
                  onClose={() => setShowMileageDialog(false)}
                  onSave={handleSaveLineItems}
                  lineItems={lineItems}
                  currency={values?.currency}
                  currencySymbol={currencySymbol}
                  isSubmitting={isSubmitting}
                  policyData={resourceData?.policy}
                  distanceUnit={distanceUnit}
                />
              )}
            </>
          )}
        </Formik>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Dialog>
  );
};

export default ManageExpenses;