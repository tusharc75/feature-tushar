import { useState, useEffect, useContext, Fragment, useRef } from 'react';
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
  getObjKeysWithValues,
  setFieldsInAscendingOrder,
  yupSchema,
  demandOrder,
  GenerateResourceLineNumber
} from '../../../constants/helpers';
import axiosInstance from '../../../axios/axiosInstance';
import Dialog from '@material-ui/core/Dialog';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import { useHistory } from 'react-router-dom';
import routes from '../../../components/Helpers/Routes';
import { FaDiceOne } from 'react-icons/fa';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { isEqual } from 'lodash';

const ManageDemandOrderDialog = ({ isClone, demandOrderId, demandOrderData = null, onClose, onSuccess, open }) => {
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const [loading, setLoading] = useState(false);
  const [salesData, setSalesData] = useState({ fields: [], initialValues: {} });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formsData, setFormsData] = useState([]);
  const {
    state: { user, permissions }
  }: any = useData();
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [cloneHeading, setCloneHeading] = useState('');

  const ref = useRef(null);
  useEffect(() => {
    setFormsData(setFieldsInAscendingOrder(salesData.fields));
  }, [salesData.fields]);

  useEffect(() => {
    setLoading(true);
    fetchFields();
  }, [demandOrderId]);

  const fetchFields = async () => {
    try {
      let fieldData;
      const response: any = await axiosInstance().get('/field?resource=Demand Order');
      fieldData = response?.data?.data;

      const fieldsDataForCreate = fieldData?.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
      const fieldsDataForUpdate = fieldData?.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

      if (demandOrderId) {
        try {
          let data;
          const response: any = await axiosInstance().get(`${demandOrder.api}/` + demandOrderId);
          data = response?.data?.data;

          if (isClone) {
            const { _id, brand, createdBy, entity, history, products, status, demandOrderNumber, updatedBy, ...rest } = data;
            rest['demandOrderNumber'] = GenerateResourceLineNumber(fieldsDataForCreate);
            setCloneHeading(demandOrderNumber);
            setSalesData({
              fields: fieldsDataForCreate,
              initialValues: getObjKeysWithValues(rest, fieldsDataForCreate)
            });
            setLoading(false);
          } else {
            setSalesData({
              fields: fieldsDataForUpdate,
              initialValues: getObjKeysWithValues(data, fieldsDataForUpdate)
            });
            setLoading(false);
          }
        } catch (error) {
          toastConfig.setToastConfig(error);
        }
      } else {
        let initialData = { ...getObjKeys('', fieldsDataForCreate) };
        initialData['demandOrderNumber'] = GenerateResourceLineNumber(fieldsDataForCreate);
        setSalesData({
          fields: fieldsDataForCreate,
          initialValues: initialData
        });
        setLoading(false);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleSubmit = (values) => {
    setLoading(true);
    if (demandOrderId && isClone === false) {
      values._id = demandOrderId;
      axiosInstance()
        .put(`${demandOrder.api}`, values)
        .then(({ data }) => {
          setLoading(false);
          onSuccess();
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      axiosInstance()
        .post(`${demandOrder.api}`, values)
        .then(({ data: { data, message } }) => {
          history.push(`${routes.demandOrderDetail.path}/${data._id}`);
          setLoading(false);
          onSuccess(data);
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
        open={open}
      >
        {formsData && formsData.length ? (
          <Formik
            innerRef={ref}
            initialValues={salesData.initialValues}
            validationSchema={yupSchema(salesData.fields)}
            validateOnMount
            onSubmit={handleSubmit}
          >
            {({ values, errors, touched, submitForm, setFieldValue }) => (
              <Fragment>
                <CustomDialogHeader
                  title={
                    !demandOrderId
                      ? `Create ${routes.demandOrder.title}`
                      : `${isClone ? `Clone - ${cloneHeading}` : `Update ${demandOrderData?.demandOrderNumber}`}`
                  }
                  onClose={() => {
                    if (!isEqual(ref.current.values, salesData.initialValues)) {
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
                ></CustomDialogHeader>
                <CustomDialogContent>
                  <Form autoComplete="off" autoCorrect="off" noValidate>
                    {formsData.length > 0 &&
                      formsData.map((form, i) => (
                        <div key={i}>
                          <div className={'detail-box-content'}>
                            <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                            <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>{form.name}</h2>
                          </div>
                          <Box marginY={2}>
                            <Grid spacing={3} container>
                              {form.sectionFields.map((field, index2) => (
                                <Grid key={index2} item xs={12} sm={6} md={6}>
                                  <FormTypes
                                    isNew={Boolean(demandOrderId)}
                                    {...field}
                                    fieldData={field}
                                    disabled={!isClone ? demandOrderId && field.disableOnEdit : false}
                                    values={values}
                                    errors={errors}
                                    touched={touched}
                                    label={field.fieldLabel}
                                    name={field.fieldName}
                                    type={field.type}
                                    options={field.option}
                                    setFieldValue={(name, value) => {
                                      setFieldValue(name, value);
                                    }}
                                    required={field.required}
                                    fullWidth
                                    isTooltip={field?.isTooltip || false}
                                    tooltipMessage={field?.tooltipMessage}
                                    size="small"
                                    fields={salesData?.fields}
                                  />
                                </Grid>
                              ))}
                            </Grid>
                          </Box>
                        </div>
                      ))}
                  </Form>
                </CustomDialogContent>
                <CustomDialogFooter>
                  <Button
                    size="small"
                    color="primary"
                    onClick={() => {
                      if (!isEqual(ref.current.values, salesData.initialValues)) {
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

export default ManageDemandOrderDialog;
