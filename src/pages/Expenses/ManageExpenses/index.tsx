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
  const [isMileage, setIsMileage] = useState(false);
  const [lineItems, setLineItems] = useState([]);
  const [resourceData, setResourceData] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalFare, setTotalFare] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [mileageItems, setMileageItems] = useState([])
  const [currencySymbol, setCurrencySymbol] = useState(null);
  const [isDisabled, setIsDisabled] = useState(false);

  const handleChange = (event) => {
    if(isMileage){
      setTotalFare(parseFloat(event.target.value))
    }else{
    setTotalAmount(parseFloat(event.target.value));
    }
  };

  useEffect(() => {
    fetchPolicy();
  }, [])

  useEffect(() => {
    let total;
    let tDistance = 0;
    
    if (isMileage) {
      total = mileageItems
        .reduce((acc, item) => {
          if (item.fromLocation && item.toLocation && item.rate > 0) {
            const distance = haversineDistance(
              item.fromLocation.lat,
              item.fromLocation.lng,
              item.toLocation.lat,
              item.toLocation.lng
            );
            tDistance += parseFloat(distance.toFixed(2)); 
            return acc + distance * parseFloat(item.rate);
          }
          return acc;
        }, 0)
        .toFixed(2);
      setTotalFare(parseFloat(total));
      setTotalDistance(parseFloat(tDistance.toFixed(2)));
    } else {
      total = lineItems
        .reduce((total, field) => {
          const amount = parseFloat(field.amount) || 0;
          return total + amount;
        }, 0)
        .toFixed(2);
        setTotalAmount(parseFloat(total));
    }
  }, [lineItems, mileageItems]);

  const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (x) => (x * Math.PI) / 180;
    const R_KM = 6371;
    const R_MILE = 3958.8;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    if(resourceData?.policy?.distanceUnit === 'mile'){
      return R_MILE * c;
    }else{
      return R_KM * c;
    }
  };

  useEffect(() => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.expenses}`)
      .then(({ data: { data } }) => {
        const fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
        const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
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
                data.type === 'Mileage' ? setTotalFare(data.totalAmount) : setTotalAmount(data.totalAmount);
                setTotalDistance(data.totalDistance);
                setLineItems(data.lineItems);
                setMileageItems(data.lineItems);
                if (data.status !== EXPENSE_STATUS.unreported) {
                  setIsDisabled(true);
                }
                setCurrencySymbol(getUniqueCurrencies().find((d) => d.currencyCode === data.currency)?.symbolNative);
                setTitle(`Edit - ${data.expenseNumber}`);
                setInitialData({
                  fields: fieldsDataForUpdate,
                  values: { ...getObjKeysWithValues(data, fieldsDataForUpdate) }
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
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, []);

    const fetchPolicy = async () => {
      try {
        const {
          data: { data }
        } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.expenses}`);
        if (data) {
          setResourceData(data);
        }
      } catch (error) {
        toastConfig.setToastConfig(error);
      }
    };

  const handleSubmit = (values: any) => {
    setIsSubmitting(true);
    if(isMileage){
      values.totalAmount = totalFare;
      values.totalDistance = totalDistance;
      values.lineItems = mileageItems?.map((e) => {
        return { ...e, amount: parseFloat(e?.amount), distance: parseFloat(e?.distance), rate: parseFloat(e?.rate) };
      });
    }else{
      values.totalAmount = totalAmount;
      values.lineItems = lineItems?.map((e) => {
        return { ...e, amount: parseFloat(e?.amount)};
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
        <Formik initialValues={initialData.values} validationSchema={yupSchema(initialData.fields)} validateOnMount onSubmit={handleSubmit}>
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
                    resource={sidebarResource.expenses}
                    referenceId={expenseId || null}
                  />
                  <Grid container spacing={2} sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Grid size={{ xs: 6, sm: 6, md: 6, lg: 6 }}>
                      <ThemeButton
                        startIcon={<AddIcon fontSize="small" />}
                        disabled={isDisabled}
                        onClick={() => {
                          if (values['type'] === 'Mileage') {
                            setShowMileageDialog(true);
                            setIsMileage(true);
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
                        required
                        type="number"
                        size="small"
                        disabled={lineItems.length > 0 || mileageItems.length>0 || isDisabled}
                        value={values['type'] === 'Mileage' ? totalFare : totalAmount}
                        onChange={handleChange}
                        fullWidth
                        slotProps={{
                          input: {
                            startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment>
                          }
                        }}
                      />
                    </Grid>
                    {values['type'] === 'Mileage' && <Grid size={{ xs: 6, sm: 6, md: 6, lg: 6 }}>
                      <TextField
                        id="outlined-required"
                        label="Total Distance"
                        required
                        type="number"
                        size="small"
                        disabled={mileageItems.length>0 || isDisabled}
                        value={totalDistance}
                        onChange={handleChange}
                        fullWidth
                      />
                    </Grid>}
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
                  setLineItems={setLineItems}
                  lineItems={lineItems}
                  currency={values?.currency}
                  currencySymbol={currencySymbol}
                  isSubmitting={isSubmitting}
                  totalAmount={totalAmount}
                />
              )}
              {showMileageDialog && (
                <ItemizeMileage
                  onClose={() => setShowMileageDialog(false)}
                  setLineItems={setMileageItems}
                  lineItems={mileageItems}
                  currency={values?.currency}
                  currencySymbol={currencySymbol}
                  isSubmitting={isSubmitting}
                  totalAmount={totalFare}
                  policyData={resourceData?.policy}
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
