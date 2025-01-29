import { useState, useEffect, useContext } from 'react';
import { Formik, Form } from 'formik';
import { Box, MenuItem } from '@mui/material';
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
import AddExpenses from 'src/pages/ExpensesReport/AddExpenses';
import Expenses from 'src/pages/ExpensesReport/Expenses';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { useTableReducer } from 'src/components/CustomReactTable';
import ManageExpenses from 'src/pages/Expenses/ManageExpenses';

const ManageExpenseReports = ({ isClone = false, fetchReportData, expenseReportId = null, onClose, onSuccess }) => {
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, resources }
  }: any = useData();

  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [title, setTitle] = useState('');
  const [selectedExpense, setSelectedExpense] = useState([]);
  const [selectedRow, setSelectedRow] = useState([])
  const { state, dispatch } = useTableReducer();
  const { selectedRecords } = state;
  const [showAddExistingExpenseModal, setShowAddExistingExpenseModal] = useState(false);
  const [showManageExpensesDialog, setShowManageExpensesDialog] = useState({ open: false, isClone: false, idToClone: null });

  useEffect(() => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.expenseReport}`)
      .then(({ data: { data } }) => {
        const fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
        var fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
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
                // const excludedFields = ['reportTitle', 'fromDate', 'toDate', 'status'];
                // fieldsDataForUpdate = fieldsDataForUpdate.filter((field) => !['reportTitle','status']?.includes(field?.fieldName));
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

    const status = EXPENSE_STATUS.unSubmitted;

    if (expenseReportId && !isClone) {
      data._id = expenseReportId;

      axiosInstance()
        .put(`${expenseReport.api}`, data)
        .then(({ data }) => {
          selectedExpense.forEach((expense) => {
            axiosInstance()
              .patch(`${expenses.api}/status/${expense._id}`, { status })
              .catch((error) => {
                toastConfig.setToastConfig(error);
              });
          });

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
          selectedExpense.forEach((expense) => {
            axiosInstance()
              .patch(`${expenses.api}/status/${expense._id}`, { status })
              .catch((error) => {
                toastConfig.setToastConfig(error);
              });
          });

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
    const updatedExpenses = [...newExpenses, ...selectedExpense];
    setSelectedExpense(updatedExpenses);
  };

  const addButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          onClick={() => {
            setShowAddExistingExpenseModal(true);
          }}
        >
          {`Add Existing ${resources?.expenses?.titlePlural}`}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setShowManageExpensesDialog({ open: true, isClone: false, idToClone: null });
          }}
        >
          {`Create New ${resources?.expenses?.titlePlural}`}
        </MenuItem>
      </>
    );
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
                  <DetailsPageHeader
                    isAddButtonVisible={true}
                    addButtonMenuItems={addButtonMenuItems()}
                    isActionButtonVisible={false}
                    actionButtonProps={{ disabled: selectedRecords.length === 0 }}
                    hasXpadding
                  />
                  {selectedExpense.length>0 && (
                    <div className="mt-2">
                      <Expenses selectedExpenseData={selectedExpense} />
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
              {showAddExistingExpenseModal && (
                <AddExpenses
                  open={showAddExistingExpenseModal}
                  onClose={() => setShowAddExistingExpenseModal(false)}
                  fullScreen
                  selectedExpense={selectedExpense}
                  setFullScreen={setFullScreen}
                  isSubmitting={isSubmitting}
                  onSave={handleSaveExpenses}
                  fetchReportData={fetchReportData}
                />
              )}
              {showManageExpensesDialog.open && (
                <ManageExpenses
                  isClone={showManageExpensesDialog.isClone}
                  expenseId={showManageExpensesDialog.idToClone}
                  onClose={() => setShowManageExpensesDialog({ open: false, isClone: false, idToClone: null })}
                  onSuccess={(data) => {
                    setShowManageExpensesDialog({ open: false, isClone: false, idToClone: null });
                    setSelectedExpense((prevExpenses) => {
                      const updatedExpenses = prevExpenses.filter((exp) => exp._id !== data._id);
                      return [...updatedExpenses, data];
                    });
                    fetchReportData();
                  }}
                  isRedirectToDetailPage={false}
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
