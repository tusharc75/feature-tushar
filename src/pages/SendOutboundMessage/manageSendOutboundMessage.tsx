import { Box, Button, Dialog, Grid, TextField } from '@material-ui/core';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from 'src/constants/helpers';
import { Form, Formik } from 'formik';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomButton from 'src/components/Helpers/CustomButton';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { Autocomplete } from '@material-ui/lab';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { uniqBy } from 'lodash';
import { useData } from 'src/StateProvider/Provider';

const ManageSendOutboundMessage = ({ assetId, onSuccess, onClose }) => {
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { resources }
  }: any = useData();

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [serializedAssetOptions, setSerializedAssetOptions] = useState([]);
  const [outBoundMessageOptions, setOutBoundMessageOptions] = useState([]);
  const [outBoundMessageTypeOptions, setOutBoundMessageTypeOptions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=Serialized Asset`)
      .then(({ data: { data } }) => {
        setSerializedAssetOptions(data['Serialized Asset']);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, []);

  useEffect(() => {
    axiosInstance()
      .get(`/dynamic-form`, {
        headers: {
          Resource: 'Outbound Message'
        }
      })
      .then(({ data: { data } }) => {
        const aa = uniqBy(data, 'type');
        setOutBoundMessageTypeOptions(uniqBy(data, 'type')?.map((d: any) => d?.type));
        setOutBoundMessageOptions(
          data?.map((d) => ({
            type: d?.type,
            outboundMessageNumber: d?.outboundMessageNumber,
            optionLabel: d?.description,
            optionValue: d?._id
          }))
        );
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, []);

  const handleSubmit = (values) => {
    setIsSubmitting(true);
    axiosInstance()
      .post(`/iot-out-bound-message`, {
        asset: values['serializedAsset'],
        messageId: values['messageId'],
        messageValue: values['messageValue']
      })
      .then(() => {
        setIsSubmitting(false);
        onSuccess();
      })
      .catch((error) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  const validate = (values) => {
    const errors = {};
    if (!values?.serializedAsset) {
      errors['serializedAsset'] = `${resources?.serializedAsset?.titleSingular} is required`;
    }
    if (!values?.messageType) {
      errors['messageType'] = `Type is required`;
    }
    if (!values?.messageId) {
      errors['messageId'] = `Description is required`;
    }
    if (!values?.messageValue) {
      errors['messageValue'] = `Value is required`;
    }
    return errors;
  };

  return (
    <Dialog
      maxWidth="sm"
      fullWidth
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
        }
      }}
      open={true}
    >
      {serializedAssetOptions?.length ? (
        <Formik
          initialValues={{
            serializedAsset: assetId ? assetId : '',
            messageType: '',
            messageId: '',
            messageValue: ''
          }}
          validateOnMount
          validate={validate}
          onSubmit={handleSubmit}
        >
          {({ values, touched, errors, setFieldValue, submitForm, setValues }) => (
            <Fragment>
              <CustomDialogHeader
                title={'Send'}
                onClose={onClose}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              />
              <CustomDialogContent>
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  <Grid container spacing={2}>
                    <Grid item md={12} lg={12} sm={12}>
                      <Autocomplete
                        disabled={assetId ? true : false}
                        options={serializedAssetOptions}
                        getOptionLabel={(option: any) => option?.optionLabel || ''}
                        getOptionSelected={(option: any, val) => option?.optionValue === val}
                        value={
                          serializedAssetOptions?.filter((data) => values['serializedAsset'] === data?.optionValue).length
                            ? serializedAssetOptions?.find((data) => values['serializedAsset'] === data?.optionValue)
                            : ''
                        }
                        onChange={(e, val) => {
                          setFieldValue('serializedAsset', val && val?.optionValue ? val?.optionValue : '');
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            margin="dense"
                            name="serializedAsset"
                            label={resources?.serializedAsset?.titleSingular}
                            variant="outlined"
                            error={touched['serializedAsset'] && Boolean(errors['serializedAsset'])}
                            helperText={touched['serializedAsset'] && errors['serializedAsset']}
                            required={true}
                            fullWidth
                          />
                        )}
                      />
                    </Grid>
                    <Grid item md={12} lg={12} sm={12}>
                      <Autocomplete
                        options={outBoundMessageTypeOptions}
                        getOptionLabel={(option: any) => option || ''}
                        value={
                          outBoundMessageTypeOptions?.filter((data) => values['messageType'] === data)?.length
                            ? outBoundMessageTypeOptions?.find((data) => values['messageType'] === data)
                            : ''
                        }
                        onChange={(e, val) => {
                          const result: any = {};
                          result['messageType'] = val ? val : '';
                          result['messageId'] = '';
                          result['messageValue'] = '';
                          setValues({ ...values, ...result });
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            margin="dense"
                            name="messageType"
                            label="Type"
                            required={true}
                            error={touched['messageType'] && Boolean(errors['messageType'])}
                            helperText={touched['messageType'] && errors['messageType']}
                            variant="outlined"
                            fullWidth
                          />
                        )}
                      />
                    </Grid>
                    <Grid item md={12} lg={12} sm={12}>
                      <Autocomplete
                        options={
                          values?.messageType ? outBoundMessageOptions?.filter((o) => o?.type === values?.messageType) : outBoundMessageOptions
                        }
                        getOptionLabel={(option: any) => option?.optionLabel || ''}
                        getOptionSelected={(option: any, val) => option?.optionValue === val}
                        value={
                          outBoundMessageOptions?.filter((data) => values['messageId'] === data?.optionValue).length
                            ? outBoundMessageOptions?.find((data) => values['messageId'] === data?.optionValue)
                            : ''
                        }
                        onChange={(e, val) => {
                          const result: any = {};
                          result['messageId'] = val && val?.optionValue ? val?.optionValue : '';
                          result['messageValue'] = val?.outboundMessageNumber ? val?.outboundMessageNumber : '';
                          setValues({ ...values, ...result });
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            margin="dense"
                            name="messageId"
                            label="Description"
                            variant="outlined"
                            error={touched['messageId'] && Boolean(errors['messageId'])}
                            helperText={touched['messageId'] && errors['messageId']}
                            required={true}
                            fullWidth
                          />
                        )}
                      />
                    </Grid>
                    {values['messageType'] === 'Set Parameter' && (
                      <Grid item md={12} lg={12} sm={12}>
                        <TextField
                          margin="dense"
                          name="messageValue"
                          label="Value"
                          variant="outlined"
                          error={touched['messageValue'] && Boolean(errors['messageValue'])}
                          helperText={touched['messageValue'] && errors['messageValue']}
                          required={true}
                          type="number"
                          fullWidth
                          onChange={(e) => {
                            setFieldValue('messageValue', e.target.value);
                          }}
                          value={values['messageValue']}
                        />
                      </Grid>
                    )}
                  </Grid>
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button type="button" variant="outlined" color="primary" size="small" onClick={onClose}>
                  Cancel
                </Button>
                <CustomButton
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  variant="contained"
                  color="primary"
                  onClick={(e) => {
                    e.preventDefault();
                    submitForm();
                  }}
                >
                  Send
                </CustomButton>
              </CustomDialogFooter>
            </Fragment>
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

export default ManageSendOutboundMessage;
