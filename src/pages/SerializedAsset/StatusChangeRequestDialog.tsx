import { Box, Dialog, Grid } from '@mui/material';
import { Form, Formik } from 'formik';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { FaDiceOne } from 'react-icons/fa';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import FormTypes from 'src/components/Helpers/FormTypes';
import {
  ASSET_STATUS,
  CustomDialogTransition,
  getObjKeys,
  serializedAsset,
  setFieldsInAscendingOrder,
  sidebarResource,
  yupSchema
} from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';

const StatusChangeRequestDialog = ({ onClose, assetData, status, onSuccess }) => {

  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, resources }
  }: any = useData();

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.serializedAssetStatusChangeRequest}`)
      .then(({ data: { data } }) => {
        data = data.filter((d) => !['asset', 'assetStatus', 'status', 'requestedBy', 'requestedDate', 'responsedBy', 'responsedDate'].includes(d.fieldData.fieldName))?.map((d) => d?.fieldData);
        setInitialData({
          fields: setFieldsInAscendingOrder(data),
          values: getObjKeys('', data)
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, []);

  const handleSubmit = (values) => {
    setIsSubmitting(true);
    axiosInstance().post(`${serializedAsset.api}/status-approval-process`, {
      ...values,
      assetStatus: ASSET_STATUS.scrap,
      assets: assetData?.map((e) => { return { _id: e._id, currentStatus: e.status } })
    }).then(({ data }) => {
      setIsSubmitting(false);
      onSuccess();
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: data?.message
      });
    }).catch((error) => {
      setIsSubmitting(false);
      toastConfig.setToastConfig(error);
    });
  };

  return (
    <Dialog
      maxWidth="md"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
    >
      {initialData && initialData.fields.length ? (
        <Formik initialValues={initialData.values} validationSchema={yupSchema(initialData?.fields)} onSubmit={handleSubmit}>
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <>
              <CustomDialogHeader
                title={`Status Change Request - ${status} ${assetData?.length === 1 ? `(${assetData[0].assetNumber})` : ''}`}
                onClose={onClose}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              ></CustomDialogHeader>
              <CustomDialogContent>
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  {initialData.fields.length > 0 &&
                    initialData.fields.map((form, i) => (
                      <div key={i}>
                        <div className={'detail-box-content'}>
                          <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                          <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>{form.name}</h2>
                        </div>
                        <Box marginY={2}>
                          <Grid spacing={3} container>
                            {form.sectionFields.map((field) => (
                              <Grid item md={6} sm={6} xs={12}>
                                <Box display="flex">
                                  <Box flexGrow={1}>
                                    <FormTypes
                                      {...field}
                                      fieldData={field}
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
                                      isTooltip={field.isTooltip}
                                      tooltipMessage={field.tooltipMessage}
                                      size="small"
                                      fields={initialData.fields}
                                    />
                                  </Box>
                                </Box>
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      </div>
                    ))}
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <ThemeButton disabled={isSubmitting} buttonType="transparent" onClick={onClose}>
                  Cancel
                </ThemeButton>
                <ThemeButton disabled={isSubmitting} isLoading={isSubmitting} buttonType="theme" onClick={submitForm} id="dialog-save-button">
                  Save
                </ThemeButton>
              </CustomDialogFooter>
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

export default StatusChangeRequestDialog;
