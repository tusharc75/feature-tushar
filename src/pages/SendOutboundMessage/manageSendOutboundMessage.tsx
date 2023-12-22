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

const ManageSendOutboundMessage = ({ assetId, onSuccess, onClose }) => {
  const toastConfig = useContext(CustomToastContext);

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [serializedAssetOptions, setSerializedAssetOptions] = useState([]);
  const [outBoundMessageOptions, setOutBoundMessageOptions] = useState([]);

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
        setOutBoundMessageOptions(data?.map((d) => ({ optionLabel: `${d?.outboundMessageNumber} - ${d?.description}`, optionValue: d?._id })));
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, []);

  const handleSubmit = (values) => {
    axiosInstance()
      .post(`/iot-out-bound-message`, {
        asset: values['serializedAsset'],
        message: values['messageValue']
      })
      .then(() => {
        onSuccess();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const validate = (values) => {
    const error: any = {};
    if (!values['serializedAsset']) {
      error.serializedAsset = 'Serialized Asset is required';
    }
    if (!values['messageValue']) {
      error.messageValue = 'Message Value is required';
    }
    return error;
  };
  return (
    <Dialog
      maxWidth="xs"
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
            serializedAsset: assetId
          }}
          validate={validate}
          onSubmit={handleSubmit}
        >
          {({ values, errors, setFieldValue, submitForm }) => (
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
                <Form>
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
                            : null
                        }
                        onChange={(e, val) => {
                          setFieldValue('serializedAsset', val && val?.optionValue);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            margin="dense"
                            name="serializedAsset"
                            label="Serialized Asset"
                            variant="outlined"
                            error={Boolean(errors['serializedAsset'])}
                            helperText={errors && errors['serializedAsset']}
                            required={true}
                            fullWidth
                          />
                        )}
                      />
                    </Grid>
                    <Grid item md={12} lg={12} sm={12}>
                      <Autocomplete
                        options={outBoundMessageOptions}
                        getOptionLabel={(option: any) => option?.optionLabel || ''}
                        getOptionSelected={(option: any, val) => option?.optionValue === val}
                        value={
                          outBoundMessageOptions?.filter((data) => values['messageValue'] === data?.optionValue).length
                            ? outBoundMessageOptions?.find((data) => values['messageValue'] === data?.optionValue)
                            : null
                        }
                        onChange={(e, val) => {
                          setFieldValue('messageValue', val && val?.optionValue);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            margin="dense"
                            name="messageValue"
                            label="Message Value"
                            variant="outlined"
                            error={Boolean(errors['messageValue'])}
                            helperText={errors && errors['messageValue']}
                            required={true}
                            fullWidth
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button type="button" variant="outlined" color="primary" size="small" onClick={onClose}>
                  Cancel
                </Button>
                <CustomButton
                  loading={false}
                  variant="contained"
                  color="primary"
                  disabled={false}
                  onClick={(e) => {
                    e.preventDefault();
                    submitForm();
                  }}
                >
                  Save
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
