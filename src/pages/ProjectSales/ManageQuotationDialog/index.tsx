import { useState, useEffect, useContext } from 'react';
import { Formik, Form } from 'formik';
import { Box, Button, Grid } from '@material-ui/core';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import FormTypes from '../../../components/Helpers/FormTypes';
import CustomButton from '../../../components/Helpers/CustomButton';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import { useData } from '../../../StateProvider/Provider';
import { isMobile, isTablet } from 'react-device-detect';
import {
  CustomDialogTransition,
  getObjKeys,
  quotation,
  setFieldsInAscendingOrder,
  yupSchema,
  GenerateResourceLineNumber,
  QUOTATION_TYPE
} from '../../../constants/helpers';
import axiosInstance from '../../../axios/axiosInstance';
import Dialog from '@material-ui/core/Dialog';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import routes from '../../../components/Helpers/Routes';
import { FaDiceOne } from 'react-icons/fa';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { isEqual } from 'lodash';
import moment from 'moment';

const ManageQuotationDialog = ({ open, onClose, onSuccess, accountId }) => {
  const toastConfig = useContext(CustomToastContext);

  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formsData, setFormsData] = useState([]);
  const {
    state: { user }
  }: any = useData();
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  useEffect(() => {
    if (initialData.values['type']) {
      handleTypeChange(initialData.values['type']);
    } else {
      setFormsData(setFieldsInAscendingOrder(initialData.fields));
    }
  }, [initialData.fields]);

  useEffect(() => {
    setLoading(true);
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      let fieldData;
      const response: any = await axiosInstance().get('/field?resource=Quotation');
      fieldData = response?.data?.data?.filter((obj) => !['rentalJob', 'repairOrder', 'salesOrder', 'fieldJob']?.includes(obj?.fieldData?.fieldName));

      const fieldsDataForCreate = fieldData?.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);

      let initialData = { ...getObjKeys('', fieldsDataForCreate), currency: user.user?.brandCurrency || '' };
      initialData['quotationNumber'] = GenerateResourceLineNumber(fieldsDataForCreate);
      initialData['customerAccount'] = accountId;
      setInitialData({
        fields: fieldsDataForCreate,
        values: initialData
      });
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleSubmit = (values) => {
    setLoading(true);
    axiosInstance()
      .post(`${quotation.api}`, values)
      .then(({ data: { data, message } }) => {
        setLoading(false);
        onSuccess(data?._id);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: message
        });
      })
      .catch((error) => {
        setLoading(false);
        toastConfig.setToastConfig(error);
      });
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

  const handleTypeChange = (type) => {
    if ([QUOTATION_TYPE.rentalJob, QUOTATION_TYPE.repairOrder, QUOTATION_TYPE.fieldJob]?.includes(type)) {
      setFormsData(
        setFieldsInAscendingOrder(
          initialData.fields.filter((d) => !['expectedCustomerDeliveryDate', 'supplierSuggestedDeliveryDate']?.includes(d.fieldName))
        )
      );
    }
    if (type === QUOTATION_TYPE.salesOrder) {
      setFormsData(setFieldsInAscendingOrder(initialData.fields.filter((d) => !['estimateStartDate', 'estimateEndDate']?.includes(d.fieldName))));
    }
  };

  const validate = (values) => {
    const errors = {};
    let estimateStartDate = moment(values?.estimateStartDate);
    let estimateEndDate = moment(values?.estimateEndDate);
    let supplierSuggestedDeliveryDate = moment(values?.supplierSuggestedDeliveryDate);
    let expectedCustomerDeliveryDate = moment(values?.expectedCustomerDeliveryDate);

    if (estimateEndDate.diff(estimateStartDate, 'days') < 0) {
      errors['estimateEndDate'] = 'Please enter valid estimate end date';
    }

    if (expectedCustomerDeliveryDate.diff(supplierSuggestedDeliveryDate, 'days') < 0) {
      errors['expectedCustomerDeliveryDate'] = 'Please enter valid expected customer delivery date';
    }

    return errors;
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
      open={open}
    >
      {formsData && formsData.length ? (
        <Formik
          initialValues={initialData.values}
          validationSchema={yupSchema(initialData.fields)}
          validateOnMount
          validate={validate}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <>
              <CustomDialogHeader
                title={`Create ${routes.quotation.title}`}
                onClose={(e, reason) => {
                  if (!isEqual(values, initialData.values)) {
                    setShowConfirmDialog(true);
                  } else {
                    onClose();
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
                  {formsData &&
                    formsData.map((form, i) => {
                      return (
                        form.name && (
                          <div key={i}>
                            <div className={'detail-box-content'}>
                              <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                              <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>{form.name}</h2>
                            </div>
                            <Box marginY={2}>
                              <Grid spacing={3} container>
                                {form.sectionFields.map((field) => (
                                  <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                                    {
                                      <FormTypes
                                        {...field}
                                        fieldData={field}
                                        fields={initialData.fields}
                                        disabled={field.fieldName === 'customerAccount' || field.fieldName === 'currency' || field.disableOnEdit}
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        label={field.fieldLabel}
                                        name={field.fieldName}
                                        type={field.type}
                                        options={field.option}
                                        setFieldValue={(name, value) => {
                                          setFieldValue(name, value);
                                          if (field.fieldName === 'type') {
                                            handleTypeChange(value);
                                          }
                                        }}
                                        required={field.required}
                                        fullWidth
                                        isTooltip={field?.isTooltip || false}
                                        tooltipMessage={field?.tooltipMessage}
                                        size="small"
                                      />
                                    }
                                  </Grid>
                                ))}
                              </Grid>
                            </Box>
                          </div>
                        )
                      );
                    })}
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  type="button"
                  variant="outlined"
                  color="primary"
                  size="small"
                  onClick={() => {
                    if (!isEqual(values, initialData.values)) {
                      setShowConfirmDialog(true);
                    } else {
                      onClose();
                    }
                  }}
                >
                  Cancel
                </Button>
                <CustomButton
                  loading={loading}
                  variant="contained"
                  color="primary"
                  type="submit"
                  onClick={(e) => {
                    e.preventDefault();
                    handleScroll(errors);
                    submitForm();
                  }}
                  disabled={loading}
                >
                  {' '}
                  Save
                </CustomButton>
              </CustomDialogFooter>
              {showConfirmDialog ? (
                <ConfirmCancelDialog
                  close={() => setShowConfirmDialog(false)}
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

export default ManageQuotationDialog;
