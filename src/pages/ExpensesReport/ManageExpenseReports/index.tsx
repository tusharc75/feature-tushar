import { useState, useEffect, useContext } from 'react';
import { Formik, Form } from 'formik';
import Grid from '@mui/material/Grid2';
import { Box } from '@mui/material';
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
  expenseReport,
  yupSchema,
  sidebarResource,
  expenses,
  EXPENSE_STATUS,
  getObjKeys
} from '../../../constants/helpers';
import routes from '../../../components/Helpers/Routes';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import AddIcon from '@mui/icons-material/Add';
import AddExpenses from 'src/pages/ExpensesReport/AddExpenses';
import ExpenseTable from 'src/pages/ExpensesReport/ExpenseTable';

const ManageExpenseReports = ({ isClone = false, expenseReportId = null, onClose, onSuccess }) => {
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, resources }
  }: any = useData();

  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [title, setTitle] = useState('');
  const [selectedExpense, setSelectedExpense] = useState([]);

  useEffect(() => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.expenseReport}`)
      .then(({ data: { data } }) => {
        const fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
        const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
        if (expenseReportId) {
          axiosInstance()
            .get(`${expenseReport.api}/` + expenseReportId)
            .then(({ data: { data } }) => {
              if (isClone) {
                const { _id, brand, createdBy, history, reportTitle, updatedBy, ...rest } = data;
                setTitle(`Clone - ${reportTitle}`);
                setInitialData({
                  fields: fieldsDataForCreate,
                  values: { ...getObjKeysWithValues(rest, fieldsDataForCreate, true, user) }
                });
              } else {
                setTitle(`Edit - ${data.reportTitle}`);
                setSelectedExpense(data.selectedExpenses);
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
          setTitle(`Create ${resources?.expenseReport?.titleSingular}`);
          let initialData = getObjKeys('', fieldsDataForCreate);
          initialData['status'] = EXPENSE_STATUS.draft;
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

  const handleSubmit = (value) => {
    setIsSubmitting(true);
    const { fields, values, ...data } = value;
    data.selectedExpenses = selectedExpense;
    if (expenseReportId && isClone === false) {
      data._id = expenseReportId;
      axiosInstance()
        .put(`${expenseReport.api}`, data)
        .then(({ data }) => {
          handleStatusChange(data?.data?.selectedExpenses);
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
        .post(`${expenseReport.api}`, data)
        .then(({ data: { data, message } }) => {
          handleStatusChange(data?.data?.selectedExpenses);
          history.push(`${routes?.expenseReportDetail?.path}/${data._id}`);
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

  const handleSaveExpenses = async (newExpenses) => {
    const updatedExpenses = [...selectedExpense, ...newExpenses];
    setSelectedExpense(updatedExpenses);
  };

  const handleStatusChange = async (expenseInfo) => {
    const newExpensesIds = expenseInfo.map((obj) => obj._id);

    axiosInstance()
      .patch(`${expenses.api}/status/${newExpensesIds}`, { status: EXPENSE_STATUS.unSubmitted })
      .then(({ data }) => {})
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const removeExpenseField = (id) => {
    const removedExpense = selectedExpense.find((field) => field._id === id);
    setSelectedExpense(selectedExpense.filter((field) => field._id !== id));
    if (removedExpense) {
      axiosInstance()
        .patch(`${expenses.api}/status/${removedExpense._id}`, { status: EXPENSE_STATUS.unreported })
        .then(({ data }) => {})
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  return (
    <Dialog
      maxWidth="md"
      fullWidth
      fullScreen
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
                    resource={sidebarResource.expenseReport}
                    referenceId={expenseReportId || null}
                  />
                  <Grid container spacing={2} sx={{ marginTop: 2 }}>
                    <Grid size={{ xs: 8 }} sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <ThemeButton
                        onClick={() => {
                          setShowExpenseDialog(true);
                        }}
                        buttonType="themeBorder"
                        sx={{ marginRight: 0.5 }}
                        aria-label="add"
                      >
                        <AddIcon fontSize="small" />
                        Add Expense
                      </ThemeButton>
                    </Grid>
                  </Grid>
                  {selectedExpense.length > 0 && (
                    <div className="mt-2">
                      <ExpenseTable removeExpenseField={removeExpenseField} selectedExpenses={selectedExpense} />
                    </div>
                  )}
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
                  disabled={isSubmitting || selectedExpense.length === 0}
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
              {showExpenseDialog && (
                <AddExpenses
                  open={showExpenseDialog}
                  onClose={() => setShowExpenseDialog(false)}
                  fullScreen
                  selectedExpense={selectedExpense}
                  setFullScreen={setFullScreen}
                  isSubmitting={isSubmitting}
                  onSave={handleSaveExpenses}
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

export default ManageExpenseReports;
