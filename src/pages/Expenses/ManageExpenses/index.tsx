import { useState, useEffect, useContext } from 'react';
import { Formik, Form } from 'formik';
import Grid from '@mui/material/Grid2';
import { Box, IconButton, Typography } from '@mui/material';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import { isMobile, isTablet } from 'react-device-detect';
import {
  CustomDialogTransition,
  getObjKeysWithValues,
  expenses,
  yupSchema,
  sidebarResource,
  getObjKeys,
  GenerateResourceLineNumber
} from '../../../constants/helpers';
import axiosInstance from '../../../axios/axiosInstance';
import Dialog from '@mui/material/Dialog';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import { useHistory } from 'react-router-dom';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import { isEqual } from 'lodash';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import InputField from 'src/components/Helpers/InputField';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import TextField from '@mui/material/TextField';
import DeleteIcon from '@mui/icons-material/Delete';

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

  const addTextField = () => {
    setTextFields([...textFields, { description: '', amount: '' }]);
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
                console.log(data.totalAmount);
                setTitle(`Edit - ${data.expenseNumber}`);
                setInitialData({
                  fields: fieldsDataForUpdate,
                  values: {...getObjKeysWithValues(data, fieldsDataForUpdate)}
                });
                console.log(initialData)
              }
            })
            .catch((error) => {
              toastConfig.setToastConfig(error);
            });
        } else {
          setTitle(`Create ${resources?.expenses?.titleSingular}`);
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
    payload._id = expenseId;
    if (expenseId && isClone === false) {
      axiosInstance()
        .put(`${expenses.api}`, payload)
        .then(({ data }) => {
          console.log(data);
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
                  <TextField
                    id="outlined-required"
                    label="Total Amount"
                    required
                    type="singleLine"
                    value={showItemizeDialog ? calculateTotal() : value}
                    onChange={handleChange}
                  />
                  <ThemeButton
                    className="m-5"
                    buttonType="transparent"
                    onClick={() => {
                      setShowItemizeDialog(true);
                    }}
                  >
                    Itemize
                  </ThemeButton>
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
                <Dialog
                  maxWidth="md"
                  fullWidth
                  fullScreen={fullScreen || isMobile || isTablet}
                  TransitionComponent={CustomDialogTransition}
                  aria-labelledby="customized-dialog-title"
                  onClose={(e, reason) => {
                    if (reason !== 'backdropClick') {
                      setShowItemizeDialog(true);
                    }
                  }}
                  open={true}
                >
                  <CustomDialogHeader
                    title="Itemize your Expense"
                    onClose={() => {
                      setShowItemizeDialog(false);
                    }}
                    isMinimized={!fullScreen}
                    onMinimizeMaximize={() => {
                      setFullScreen((prevState) => !prevState);
                    }}
                    showManimizeMaximize={true}
                  />
                  <CustomDialogContent>
                    <div>
                      {textFields.map((field, index) => (
                        <Grid container spacing={2} key={field.id} sx={{ alignItems: 'center', marginBottom: 2 }}>
                          <Grid size={{ xs: 5 }}>
                            <TextField
                              label="Description"
                              value={field.description}
                              onChange={(event) => handleInputChange(index, 'description', event)}
                              fullWidth
                            />
                          </Grid>
                          <Grid size={{ xs: 5 }}>
                            <TextField
                              label="Amount"
                              value={field.amount}
                              onChange={(event) => handleInputChange(index, 'amount', event)}
                              fullWidth
                            />
                          </Grid>
                          <Grid size={{ xs: 2 }}>
                            <IconButton onClick={() => removeTextField(field.id)} aria-label="delete">
                              <DeleteIcon color="error" />
                            </IconButton>
                          </Grid>
                        </Grid>
                      ))}
                      <Typography variant="h6" sx={{ marginTop: 2 }}>
                        Total Amount: ${value}
                      </Typography>
                      <ThemeButton buttonType="theme" onClick={addTextField}>
                        Add Expense
                      </ThemeButton>
                    </div>
                  </CustomDialogContent>
                  <CustomDialogFooter>
                    <ThemeButton buttonType="transparent" id="dialog-cancel-button" onClick={() => setShowItemizeDialog(false)}>
                      Cancel
                    </ThemeButton>
                    <ThemeButton
                      isLoading={isSubmitting}
                      buttonType="theme"
                      id="dialog-save-button"
                      disabled={isSubmitting}
                      onClick={(e) => {
                        setShowItemizeDialog(false)
                      }}
                    >
                      Save
                    </ThemeButton>
                  </CustomDialogFooter>
                </Dialog>
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
