import { useState, useEffect, useContext } from 'react';
import { Formik, Form } from 'formik';
import { Box } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import { useHistory } from 'react-router-dom';
import { isEqual } from 'lodash';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import InputField from 'src/components/Helpers/InputField';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { isMobile, isTablet } from 'react-device-detect';
import {
  CustomDialogTransition,
  getObjKeysWithValues,
  costBooks,
  yupSchema,
  sidebarResource,
  getObjKeys,
  GenerateResourceLineNumber
} from '../../constants/helpers';
import routes from '../../components/Helpers/Routes';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { fetch_resource_fields } from 'src/components/ResourceFields';

const ManageCostBooks = ({
  isClone = false,
  costBookId = null,
  isRedirectToDetailPage = true,
  onClose,
  onSuccess,
}) => {
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

  useEffect(() => {
    fetchFields();
  }, [costBookId]);

  const fetchFields = async () => {
    try {
      let { fieldsDataAll, fieldsDataForCreate, fieldsDataForUpdate } = await fetch_resource_fields(sidebarResource?.costBooks);
      if (costBookId) {
        axiosInstance()
          .get(`${costBooks.api}/` + costBookId)
          .then(({ data: { data } }) => {
            if (isClone) {
              const { costBookName, ...rest } = data;
              setTitle(`Clone - ${costBookName}`);
              setInitialData({
                fields: fieldsDataForCreate,
                values: { ...getObjKeysWithValues(rest, fieldsDataForCreate, true, user) }
              });
            } else {
              setTitle(`Edit - ${data.costBookName}`);
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
        setTitle(`Create ${resources?.costBooks?.titleSingular}`);
        let initialData = getObjKeys('', fieldsDataForCreate);
        setInitialData({
          fields: fieldsDataForCreate,
          values: initialData
        });
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleSubmit = (values: any) => {
    setIsSubmitting(true);
    if (costBookId && isClone === false) {
      values._id = costBookId;
      axiosInstance()
        .put(`${costBooks.api}`, values)
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
        .post(`${costBooks.api}`, values)
        .then(({ data: { data, message } }) => {
          if (isRedirectToDetailPage) {
            history.push(`${routes.costBooksDetail.path}/${data._id}`);
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
                    touched={touched}
                    fieldsData={initialData.fields}
                    size="small"
                    fullWidth
                  />
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
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Dialog>
  );
};

export default ManageCostBooks;
