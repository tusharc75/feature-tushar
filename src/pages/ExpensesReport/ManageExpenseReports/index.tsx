import { useState, useEffect, useContext } from 'react';
import { Formik, Form } from 'formik';
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
  EXPENSE_STATUS,
  getObjKeys
} from '../../../constants/helpers';
import routes from '../../../components/Helpers/Routes';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import Expenses from 'src/pages/ExpensesReport/Expenses';
import dayjs from 'dayjs';
import { fetch_resource_fields } from 'src/components/ResourceFields';

const ManageExpenseReports = ({ expenseReportId = null, onClose, onSuccess }) => {
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
  const [expenses, setExpences] = useState([]);
  const [editing, setEditing] = useState(false);

  const fetchFields = async () => {
    try {
      let { fieldsDataAll, fieldsDataForCreate, fieldsDataForUpdate } = await fetch_resource_fields(sidebarResource?.expenseReport);
      if (expenseReportId) {
        axiosInstance()
          .get(`${expenseReport.api}/` + expenseReportId)
          .then(({ data: { data } }) => {
            setTitle(`Edit - ${data.reportTitle}`);
            setEditing(true);
            setInitialData({
              fields: fieldsDataForUpdate,
              values: { ...getObjKeysWithValues(data, fieldsDataAll) }
            });
          })
          .catch((error) => {
            toastConfig.setToastConfig(error);
          });
      } else {
        axiosInstance().get(`${expenseReport.api}/last-expense-report-date`).then(({ data }) => {

          let fromDate: any = dayjs.tz().subtract(1, 'month').startOf('month')?.toDate();
          let toDate: any = dayjs.tz().subtract(1, 'month').endOf('month')?.toDate();

          if (data?.data) {
            const endDate = dayjs(data?.data?.toDate);
            fromDate = endDate.tz().add(1, 'month').startOf('month')?.toDate();
            toDate = endDate.tz().add(1, 'month').endOf('month')?.toDate();
          }

          setTitle(`Create ${resources?.expenseReport?.titleSingular}`);
          let initialData = getObjKeys('', fieldsDataForCreate);
          initialData['status'] = EXPENSE_STATUS.draft;
          initialData['users'] = [user?.user?._id];
          initialData['fromDate'] = fromDate;
          initialData['toDate'] = toDate;
          setInitialData({
            fields: fieldsDataForCreate,
            values: initialData
          });
        }).catch((error) => {
          toastConfig.setToastConfig(error);
        });
      }
    }
    catch (error) {
      toastConfig.setToastConfig(error);
    };
  }

  useEffect(() => {
    fetchFields();
  }, [expenseReportId]);

  const handleSubmit = (value) => {
    setIsSubmitting(true);
    const { fields, values, ...data } = value;
    if (expenseReportId) {
      data._id = expenseReportId;
      axiosInstance().put(`${expenseReport.api}`, data).then(({ data }) => {
        setIsSubmitting(false);
        onSuccess();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      }).catch((error) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig(error);
      });
    } else {
      data.expenses = expenses;
      axiosInstance().post(`${expenseReport.api}`, data).then(({ data: { data, message } }) => {
        history.push(`${routes?.expenseReportDetail?.path}/${data._id}`);
        setIsSubmitting(false);
        onSuccess(data);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: message
        });
      }).catch((error) => {
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
      fullScreen={editing ? fullScreen || isMobile || isTablet : true}
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
                  />
                  {!expenseReportId && (
                    <Expenses
                      expenseIds={expenses}
                      expenseReportData={values}
                      allowedToEdit={true}
                      setExpences={(rows) => {
                        setExpences(rows)
                      }}
                    />
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
            </>
          )}
        </Formik>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...(editing ? Array(6) : Array(10)).keys()]} />
        </Box>
      )}
    </Dialog>
  );
};

export default ManageExpenseReports;
