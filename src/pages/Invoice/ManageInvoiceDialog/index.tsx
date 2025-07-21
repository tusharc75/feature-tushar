import { useState, useEffect, useContext, Fragment } from 'react';
import { Formik, Form } from 'formik';
import { Box } from '@mui/material';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import { useData } from '../../../StateProvider/Provider';
import { isMobile, isTablet } from 'react-device-detect';
import {
  CustomDialogTransition,
  getObjKeys,
  getObjKeysWithValues,
  invoice,
  yupSchema,
  GenerateResourceLineNumber,
  sidebarResource,
  INVOICE_STATUS
} from '../../../constants/helpers';
import axiosInstance from '../../../axios/axiosInstance';
import Dialog from '@mui/material/Dialog';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import { useHistory } from 'react-router-dom';
import routes from '../../../components/Helpers/Routes';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { isEqual } from 'lodash';
import InputField from 'src/components/Helpers/InputField';
import { fetch_resource_fields } from 'src/components/ResourceFields';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';

const ManageInvoiceDialog = ({ isClone, invoiceId, invoiceData = null, onClose, onSuccess }) => {
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);

  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const {
    state: { user, permissions, resources }
  }: any = useData();
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [cloneHeading, setCloneHeading] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [showConfirmCloneDetailsDialog, setShowConfirmCloneDetailsDialog] = useState(false);
  const [isMaterialAvailable, setIsMaterialAvailable] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchFields();
  }, [invoiceId]);

  const fetchFields = async () => {
    try {
      let { fieldsDataAll, fieldsDataForCreate, fieldsDataForUpdate } = await fetch_resource_fields(sidebarResource?.invoice);
      if (invoiceId) {
        try {
          let data;
          const response: any = await axiosInstance().get(`${invoice.api}/` + invoiceId);
          data = response?.data?.data;
          if (isClone) {
            const { invoiceNumber, rentalJob, fieldTicket, sublease, repairOrder, salesOrder, ...rest } = data;
            rest.status = INVOICE_STATUS.new;
            rest.invoiceNumber = GenerateResourceLineNumber(fieldsDataForCreate);
            setCloneHeading(invoiceNumber);
            setIsMaterialAvailable(!data?.canDelete)
            setInitialData({
              fields: fieldsDataForCreate,
              values: { ...getObjKeysWithValues(rest, fieldsDataForCreate, true, user) }
            });
            setLoading(false);
          } else {
            if (!data?.canDelete) {
              fieldsDataForUpdate?.forEach((f) => {
                if (['parentAccount', 'customerAccount', 'warehouse', 'currency', 'rentalJob', 'fieldTicket'].includes(f.fieldName)) {
                  f.disableOnEdit = true;
                  f.isUneditable = true;
                }
              })
            }
            setInvoiceNumber(data?.invoiceNumber);
            setInitialData({
              fields: fieldsDataForUpdate,
              values: getObjKeysWithValues(data, fieldsDataAll)
            });
            setLoading(false);
          }
        } catch (error) {
          toastConfig.setToastConfig(error);
        }
      } else {
        let initialData = { ...getObjKeys('', fieldsDataForCreate), currency: user.user?.brandCurrency || '' };
        initialData['invoiceNumber'] = GenerateResourceLineNumber(fieldsDataForCreate);
        setInitialData({
          fields: fieldsDataForCreate,
          values: initialData
        });
        setLoading(false);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleSubmit = (values) => {
    setLoading(true);
    if (invoiceId && isClone === false) {
      values._id = invoiceId;
      axiosInstance()
        .put(`${invoice.api}`, values)
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          onSuccess();
          setLoading(false);
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      axiosInstance()
        .post(`${invoice.api}`, values)
        .then(({ data: { data, message } }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: message
          });
          history.push(`${routes.invoiceDetail.path}/${data?._id}`);
          setLoading(false);
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleScroll = (errors) => {
    const err = Object.keys(errors);
    if (err.length) {
      const input = document.querySelector(`input[name=${err[0]}]`);
      input?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'start'
      });
    }
  };

  function validate(values) {
    const errors = {};
    return errors;
  }

  return (
    <>
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
        {initialData?.fields?.length ? (
          <Formik
            initialValues={initialData.values}
            validationSchema={yupSchema(initialData.fields)}
            validateOnMount
            validate={validate}
            onSubmit={(values) => {
              if (invoiceId && isClone && isMaterialAvailable && !showConfirmCloneDetailsDialog) {
                setShowConfirmCloneDetailsDialog(true);
              }
              else {
                handleSubmit(values)
              }
            }}
          >
            {({ values, errors, touched, setFieldValue, submitForm }) => (
              <Fragment>
                <CustomDialogHeader
                  title={
                    !invoiceId
                      ? `Create ${resources?.invoice?.titleSingular}`
                      : `${isClone ? `Clone - ${cloneHeading}` : `Update ${invoiceData?.invoiceNumber || invoiceNumber}`}`
                  }
                  onClose={() => {
                    if (isEqual(initialData.values, values)) {
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
                  <Form autoComplete="off" autoCorrect="off" noValidate>
                    <InputField
                      errors={errors}
                      values={values}
                      setFieldValue={(name, value) => {
                        setFieldValue(name, value);
                        if (name === 'wellNumber') {
                          if (initialData?.fields.find((e) => e?.fieldName === 'numberOfWells')) {
                            if (value) {
                              setFieldValue('numberOfWells', value?.length);
                            } else {
                              setFieldValue('numberOfWells', 0);
                            }
                          }
                        }
                      }}
                      touched={touched}
                      fieldsData={initialData.fields}
                      size="small"
                      fullWidth
                      resource={sidebarResource.invoice}
                      referenceId={invoiceId || null}
                      collaborateTools={true}
                    />
                  </Form>
                </CustomDialogContent>
                <CustomDialogFooter>
                  <ThemeButton
                    buttonType="transparent"
                    onClick={() => {
                      if (isEqual(initialData.values, values)) {
                        onClose();
                      } else {
                        setShowConfirmDialog(true);
                      }
                    }}
                  >
                    Cancel
                  </ThemeButton>
                  <ThemeButton
                    isLoading={loading}
                    buttonType="theme"
                    disabled={loading}
                    onClick={(e) => {
                      e.preventDefault();
                      handleScroll(errors);
                      submitForm();
                    }}
                  >
                    Save
                  </ThemeButton>
                </CustomDialogFooter>
                {showConfirmDialog ? (
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
                ) : null}
                {showConfirmCloneDetailsDialog && (
                  <ConfirmationDialog
                    open={true}
                    message="Please confirm if you'd like to proceed with cloning, including all the line items. If not, click on cancel."
                    onOk={() => {
                      setFieldValue('invoiceId', invoiceId);
                      submitForm();
                    }}
                    onClose={() => {
                      submitForm();
                    }}
                    okBtnLoading={loading}
                  />
                )}
              </Fragment>
            )}
          </Formik>
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Dialog>
    </>
  );
};

export default ManageInvoiceDialog;
