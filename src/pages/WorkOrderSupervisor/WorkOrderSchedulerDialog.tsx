import { Fragment, useContext, useEffect, useState } from 'react';
import {
  ASSET_STATUS,
  CustomDialogTransition,
  serializedAsset,
  sidebarResource,
  workOrder
} from '../../constants/helpers';
import { Dialog, TextField, Box, Grid, Button } from '@material-ui/core';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { Autocomplete } from '@material-ui/lab';
import { KeyboardDatePicker } from '@material-ui/pickers';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomButton from 'src/components/Helpers/CustomButton';
import { isMobile, isTablet } from 'react-device-detect';
import { Formik, Form, Field } from 'formik';

export default function ProductFrequencyDialog({ onClose, onSuccess }) {
  const toastConfig = useContext(CustomToastContext);
  const [productOptions, setProductOptions] = useState([]);
  const [assetOptions, setAssetOptions] = useState([]);
  const [servicesOptions, setServicesOptions] = useState([]);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const deepFilter = [{ field: 'serializedProduct', term: { $in: [true] } }];
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=${sidebarResource.product}&deepFilter=${JSON.stringify(deepFilter)}`)
      .then(({ data: { data: lookupResource } }) => {
        setProductOptions(lookupResource['Product'] || []);
      })
      .catch((err) => toastConfig.setToastConfig(err));
  }, []);

  useEffect(() => {
    setLoading(true);
    const deepFilter = [
      { field: 'status', term: { $in: Object.values(ASSET_STATUS) } }
    ];
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=${serializedAsset.resource}&deepFilter=${JSON.stringify(deepFilter)}`)
      .then(({ data: { data: lookupSerializedAssets } }) => {
        setAssetOptions(lookupSerializedAssets['Serialized Asset'] || []);
        setLoading(false);
      })
      .catch((err) => toastConfig.setToastConfig(err));
  }, []);

  useEffect(() => {
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=Service Master`)
      .then(({ data: { data } }) => {
        setServicesOptions(data['Service Master'] || []);
      });
  }, []);

  const handleSubmit = (values) => {
    axiosInstance()
      .post(`${workOrder.api}/work-order-scheduler/scheduler`, values)
      .then(({ data }) => {
        onSuccess();
        toastConfig.setToastConfig({ open: true, type: 'success', message: data.message });
      })
      .catch((error) => toastConfig.setToastConfig(error));
  };

  return (
    <Dialog
      TransitionComponent={CustomDialogTransition}
      open={true}
      fullScreen={fullScreen || isMobile || isTablet}
      maxWidth={'sm'}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') onClose();
      }}
    >
      {productOptions.length > 0 ? (
        <Fragment>
          <Formik
            initialValues={{
              product: '',
              asset: '',
              service: [],
              date: null
            }}
            onSubmit={handleSubmit}
          >
            {({ values, setFieldValue }) => (
              <Form style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <CustomDialogHeader
                  isMinimized={!fullScreen}
                  onMinimizeMaximize={() => setFullScreen((prevState) => !prevState)}
                  showManimizeMaximize={true}
                  onClose={onClose}
                  title={`Work Order Scheduler`}
                />
                <CustomDialogContent style={{ flex: 1, overflowY: 'auto' }}>
                  <div className="flex flex-col p-3">
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <Autocomplete
                          size="small"
                          options={productOptions}
                          value={productOptions.find((data) => data.optionValue === values.product) || null}
                          getOptionLabel={(option) => option?.optionLabel || ''}
                          onChange={(e, val) => setFieldValue('product', val?.optionValue || '')}
                          renderInput={(params) => (
                            <TextField {...params} label="Select Product" variant="outlined" required />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Autocomplete
                          size="small"
                          options={assetOptions}
                          loading={loading}
                          value={assetOptions.find((data) => data.optionValue === values.asset) || null}
                          getOptionLabel={(option) => option?.optionLabel || ''}
                          onChange={(e, val) => setFieldValue('asset', val?.optionValue || '')}
                          renderInput={(params) => (
                            <TextField {...params} label="Select Serialized Asset" variant="outlined" required />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Autocomplete
                          multiple
                          size="small"
                          options={servicesOptions}
                          value={servicesOptions.filter((option) =>
                            values.service.includes(option.optionValue)
                          )}
                          getOptionLabel={(option) => option?.optionLabel || ''}
                          onChange={(e, val) => setFieldValue('service', val.map((item) => item.optionValue))}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Select Service"
                              variant="outlined"
                            />
                          )}
                        />

                      </Grid>
                      <Grid item xs={12}>
                        <KeyboardDatePicker
                          required
                          fullWidth
                          autoOk
                          clearable
                          size="small"
                          inputVariant="outlined"
                          value={values.date}
                          label="Select Date"
                          minDate={new Date()}
                          onChange={(date) => setFieldValue('date', date)}
                          format="MM/dd/yyyy"
                        />
                      </Grid>
                    </Grid>
                  </div>
                </CustomDialogContent>
                <CustomDialogFooter>
                  <Button
                    size="small"
                    color="primary"
                    onClick={() => onClose()}
                  >
                    Cancel
                  </Button>
                  <CustomButton
                    variant="contained"
                    color="primary"
                    type="submit"
                  >
                    Save
                  </CustomButton>
                </CustomDialogFooter>
              </Form>
            )}
          </Formik>
        </Fragment>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Dialog>
  );
}