import { Fragment, useContext, useEffect, useState } from 'react';
import {
  ASSET_STATUS,
  CustomDialogTransition,
  dateFormat,
  dateFormatForInputControl,
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
import moment from 'moment';

export default function WorkOrderSchedulerDialog({ onClose, onSuccess }) {

  const [initialData, setInitialData] = useState({
    product: '',
    asset: '',
    service: [],
    date: new Date()
  });
  const toastConfig = useContext(CustomToastContext);
  const [productOptions, setProductOptions] = useState([]);
  const [assetOptions, setAssetOptions] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
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
      {
        field: 'status',
        term: {
          $in: [
            ASSET_STATUS.new,
            ASSET_STATUS.available,
            ASSET_STATUS.underReview,
            ASSET_STATUS.needRepair,
            ASSET_STATUS.needRecert
          ]
        }
      }
    ];
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=${serializedAsset.resource}&deepFilter=${JSON.stringify(deepFilter)}`)
      .then(({ data: { data: lookupSerializedAssets } }) => {
        let serializedAssets = lookupSerializedAssets['Serialized Asset'] || [];
        const filteredAssets = serializedAssets?.filter(asset => asset?.product === selectedProduct);
        setAssetOptions(filteredAssets || []);
        setLoading(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  }, [selectedProduct]);

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

  function validate(values) {
    const errors = {};

    if (!values.product) {
      errors['product'] = 'Please select product';
    }
    if (!values.asset) {
      errors['asset'] = 'Please select asset';
    }
    if (values.service.length === 0) {
      errors['service'] = 'Please select service';
    }
    if (!values.date || !moment(values.date).isValid()) {
      errors['date'] = 'Please select date';
    } else if (moment(values.date).isBefore(moment(), 'day')) {
      errors['date'] = 'Date cannot be in the past';
    }

    return errors;
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
            initialValues={initialData}
            validateOnMount
            validate={validate}
            onSubmit={handleSubmit}
          >

            {({ touched, errors, values, setFieldValue }) => (
              <Form autoComplete="off" autoCorrect="off" noValidate style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
                          onChange={(e, val) => {
                            setFieldValue('product', val?.optionValue || '')
                            setSelectedProduct(val?.optionValue);
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Product"
                              variant="outlined"
                              required
                              error={Boolean(errors.product && touched.product)}
                              helperText={touched.product && errors.product}
                            />

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
                            <TextField
                              {...params}
                              label="Serialized Asset"
                              variant="outlined"
                              required
                              error={Boolean(errors.asset && touched.asset)}
                              helperText={touched.asset && errors.asset}
                            />

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
                              label="Service *"
                              variant="outlined"
                              error={Boolean(errors.service && touched.service)}
                              helperText={touched.service && errors.service}
                            />
                          )}
                        />

                      </Grid>
                      <Grid item xs={12}>
                        <KeyboardDatePicker
                          variant="inline" // Ensures the calendar is displayed inside the text field (no footer).
                          fullWidth
                          size="small"
                          margin="dense"
                          autoOk
                          required
                          inputVariant="outlined"
                          value={values.customDate}
                          name="Date"
                          label="Date"
                          format={dateFormatForInputControl}
                          minDate={new Date()}
                          error={touched['customDate'] && Boolean(errors['customDate'])}
                          helperText={touched['customDate'] && errors['customDate']}
                          onChange={(date) => setFieldValue('date', date)}
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