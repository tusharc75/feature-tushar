import { Fragment, useContext, useEffect, useState } from 'react';
import { ASSET_STATUS, CustomDialogTransition, serializedAsset, sidebarResource, workOrder, workOrderSupervisor } from '../../constants/helpers';
import { Dialog, TextField, Box, FormControlLabel, Checkbox } from '@mui/material';
import Grid from '@mui/material/Grid2';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import Autocomplete from '@mui/material/Autocomplete';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { isMobile, isTablet } from 'react-device-detect';
import { Formik, Form } from 'formik';
import { useData } from 'src/StateProvider/Provider';
import CustomDatePicker from 'src/components/CustomDatePicker';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import dayjs from 'dayjs';

export default function WorkOrderSchedulerDialog({ onClose, onSuccess }) {
  const toastConfig = useContext(CustomToastContext);
  const [productOptions, setProductOptions] = useState([]);
  const [assetOptions, setAssetOptions] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [options, setOptions] = useState([]);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [assetLoading, setAssetLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    state: { resources, permissions }
  }: any = useData();

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
    setAssetLoading(true);
    const deepFilter = [
      {
        field: 'status',
        term: {
          $in: [ASSET_STATUS.new, ASSET_STATUS.available, ASSET_STATUS.underReview, ASSET_STATUS.needRepair, ASSET_STATUS.needRecert]
        }
      }
    ];
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=${serializedAsset.resource}&deepFilter=${JSON.stringify(deepFilter)}`)
      .then(({ data: { data: lookupSerializedAssets } }) => {
        let serializedAssets = lookupSerializedAssets['Serialized Asset'] || [];
        const filteredAssets = serializedAssets?.filter((asset) => asset?.product === selectedProduct);
        setAssetOptions(filteredAssets || []);
        setAssetLoading(false);
      })
      .catch((err) => {
        setAssetLoading(false);
        toastConfig.setToastConfig(err);
      });
  }, [selectedProduct]);

  useEffect(() => {
    axiosInstance().get(`/sa-formbuilder/lookup?lookupResource=${sidebarResource.serviceMaster},${sidebarResource.employeeMaster},${sidebarResource.workStations}`)
      .then(({ data: { data } }) => {
        setOptions(data);
      });
  }, []);

  const handleSubmit = (values) => {
    setLoading(true);
    axiosInstance()
      .post(`${workOrderSupervisor.api}/work-order-scheduler`, values)
      .then(({ data }) => {
        setLoading(false);
        onSuccess();
        toastConfig.setToastConfig({ open: true, type: 'success', message: data.message });
      })
      .catch((error) => {
        setLoading(false);
        toastConfig.setToastConfig(error);
      });
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
    if (!values.date || !dayjs(values.date).isValid()) {
      errors['date'] = 'Please select date';
    } else if (dayjs(values.date).isBefore(dayjs(), 'day')) {
      errors['date'] = 'Date cannot be in the past';
    }
    return errors;
  }

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
              technician: [],
              workStation: [],
              date: new Date(),
              autoCreateWorkOrder: false
            }}
            validateOnMount
            validate={validate}
            onSubmit={handleSubmit}
          >
            {({ touched, errors, values, setFieldValue, submitForm }) => (
              <Form autoComplete="off" autoCorrect="off" noValidate style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <CustomDialogHeader
                  isMinimized={!fullScreen}
                  onMinimizeMaximize={() => setFullScreen((prevState) => !prevState)}
                  showManimizeMaximize={true}
                  onClose={onClose}
                  title={`${resources?.workOrder?.titleSingular} Scheduler`}
                />
                <CustomDialogContent style={{ flex: 1, overflowY: 'auto' }}>
                  <div className="flex flex-col p-3">
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12 }}>
                        <Autocomplete
                          size="small"
                          options={productOptions}
                          value={productOptions.find((data) => data.optionValue === values.product) || null}
                          getOptionLabel={(option) => option?.optionLabel || ''}
                          onChange={(e, val) => {
                            setFieldValue('product', val?.optionValue || '');
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
                      <Grid size={{ xs: 12 }}>
                        <Autocomplete
                          size="small"
                          options={assetOptions}
                          loading={assetLoading}
                          value={assetOptions.find((data) => data.optionValue === values.asset) || null}
                          getOptionLabel={(option) => option?.optionLabel || ''}
                          onChange={(e, val) => setFieldValue('asset', val?.optionValue || '')}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Asset"
                              variant="outlined"
                              required
                              error={Boolean(errors.asset && touched.asset)}
                              helperText={touched.asset && errors.asset}
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Autocomplete
                          multiple
                          size="small"
                          options={options[sidebarResource.serviceMaster] || []}
                          value={(options[sidebarResource.serviceMaster] || [])?.filter((option) => values.service.includes(option.optionValue))}
                          getOptionLabel={(option) => option?.optionLabel || ''}
                          onChange={(e, val) =>
                            setFieldValue(
                              'service',
                              val.map((item) => item.optionValue)
                            )
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Service"
                              variant="outlined"
                              required
                              error={Boolean(errors.service && touched.service)}
                              helperText={touched.service && errors.service}
                            />
                          )}
                        />
                      </Grid>
                      {permissions?.employeeMaster?.isRead &&
                        <Grid size={{ xs: 12 }}>
                          <Autocomplete
                            multiple
                            size="small"
                            options={options[sidebarResource.employeeMaster] || []}
                            value={(options[sidebarResource.employeeMaster] || []).filter((option) => values.technician.includes(option.optionValue))}
                            getOptionLabel={(option) => option?.optionLabel || ''}
                            onChange={(e, val) =>
                              setFieldValue(
                                'technician',
                                val.map((item) => item.optionValue)
                              )
                            }
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Technician"
                                variant="outlined"
                                error={Boolean(errors.technician && touched.technician)}
                                helperText={touched.technician && errors.technician}
                              />
                            )}
                          />
                        </Grid>
                      }
                      {permissions?.workStations?.isRead &&
                        <Grid size={{ xs: 12 }}>
                          <Autocomplete
                            multiple
                            size="small"
                            options={options[sidebarResource.workStations] || []}
                            value={(options[sidebarResource.workStations] || []).filter((option) => values.workStation.includes(option.optionValue))}
                            getOptionLabel={(option) => option?.optionLabel || ''}
                            onChange={(e, val) =>
                              setFieldValue(
                                'workStation',
                                val.map((item) => item.optionValue)
                              )
                            }
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label={resources?.workStations?.titlePlural}
                                variant="outlined"
                                error={Boolean(errors.workStation && touched.workStation)}
                                helperText={touched.workStation && errors.workStation}
                              />
                            )}
                          />
                        </Grid>}
                      <Grid size={{ xs: 12 }}>
                        <CustomDatePicker
                          fullWidth
                          size="small"
                          margin="dense"
                          required={true}
                          value={values.date}
                          name="Date"
                          label="Date"
                          minDate={new Date()}
                          error={touched['date'] && Boolean(errors['date'])}
                          helperText={touched['date'] && errors['date']}
                          onChange={(date) => setFieldValue('date', date)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              name={'autoCreateWorkOrder'}
                              checked={values?.autoCreateWorkOrder}
                              onChange={(e) => setFieldValue('autoCreateWorkOrder', e?.target?.checked)}
                              size="small"
                            />
                          }
                          label={'Auto Create Work Order'}
                        />
                      </Grid>
                    </Grid>
                  </div>
                </CustomDialogContent>
                <CustomDialogFooter>
                  <ThemeButton buttonType="transparent" onClick={() => onClose()}>
                    Cancel
                  </ThemeButton>
                  <ThemeButton onClick={submitForm} isLoading={loading} buttonType="theme">
                    Save
                  </ThemeButton>
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
