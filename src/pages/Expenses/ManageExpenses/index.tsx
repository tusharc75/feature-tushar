import { useState, useEffect, useContext } from 'react';
import { Formik, Form } from 'formik';
import { Box, InputAdornment, TextField } from '@mui/material';
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
  getUniqueCurrencies
} from '../../../constants/helpers';
import routes from '../../../components/Helpers/Routes';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import ItemizeExpenses from 'src/pages/Expenses/ItemizeExpenses';

const ManageExpenses = ({ isClone = false, expenseId = null, onClose, onSuccess }) => {
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, resources }
  }: any = useData();

  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showItemizeDialog, setShowItemizeDialog] = useState(false);
  const [value, setValue] = useState('');
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [title, setTitle] = useState('');
  const [textFields, setTextFields] = useState([]);
  const [currencySymbol, setCurrencySymbol] = useState(null);

  const addTextField = () => {
    setTextFields([...textFields, { id: textFields.length, description: '', amount: '' }]);
  };

  const handleInputChange = (index, field, event) => {
    const newFields = [...textFields];
    newFields[index][field] = event.target.value;
    setTextFields(newFields);
  };

  const handleChange = (event) => {
    setValue(event.target.value);
  };

  const removeTextField = (id) => {
    setTextFields(textFields.filter((field) => field.id !== id));
  };

  const calculateTotal = () => {
    const newValue = textFields
      .reduce((total, field) => {
        const amount = parseFloat(field.amount) || 0;
        return total + amount;
      }, 0)
      .toFixed(2);
    return setValue(newValue);
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
                setInitialData({
                  fields: fieldsDataForCreate,
                  values: { ...getObjKeysWithValues(rest, fieldsDataForCreate, true, user) }
                });
              } else {
                setValue(data.totalAmount);
                setTextFields(data.lineItems);
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
          setCurrencySymbol(getUniqueCurrencies().find((d) => d.currencyCode === data.currency)?.symbolNative);
          let initialData = getObjKeys('', fieldsDataForCreate);
          initialData['expenseNumber'] = GenerateResourceLineNumber(fieldsDataForCreate);
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

  const handleSubmit = (values) => {
    setIsSubmitting(true);
    const payload = {
      ...values,
      totalAmount: value,
      lineItems: textFields
    };
    if (expenseId && isClone === false) {
      payload._id = expenseId;
      axiosInstance()
        .put(`${expenses.api}`, payload)
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
        .post(`${expenses.api}`, payload)
        .then(({ data: { data, message } }) => {
          history.push(`${routes.expensesDetail.path}/${data._id}`);
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
                    touched={touched}
                    fieldsData={initialData.fields}
                    size="small"
                    fullWidth
                    resource={sidebarResource.expenses}
                    referenceId={expenseId || null}
                  />
                  <Box sx={{ width: '100%', mb: 2 }}>
                    <TextField
                      id="outlined-required"
                      label="Total Amount"
                      required
                      type="number"
                      size="small"
                      disabled={textFields.length > 0}
                      value={showItemizeDialog ? calculateTotal() : value}
                      onChange={handleChange}
                      fullWidth
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment>
                        }
                      }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <ThemeButton buttonType="transparent" onClick={() => setShowItemizeDialog(true)}>
                      Itemize
                    </ThemeButton>
                  </Box>
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
                  open={showItemizeDialog}
                  onClose={() => setShowItemizeDialog(false)}
                  textFields={textFields}
                  value={value}
                  addTextField={addTextField}
                  currencySymbol={currencySymbol}
                  removeTextField={removeTextField}
                  handleInputChange={handleInputChange}
                  fullScreen={fullScreen}
                  setFullScreen={setFullScreen}
                  isSubmitting={isSubmitting}
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
