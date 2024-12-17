import { Fragment, useContext, useEffect, useState } from 'react';
import { ASSET_STATUS, CustomDialogTransition, serializedAsset, sidebarResource, workOrder } from '../../constants/helpers';
import { Dialog, TextField, Box, Grid, Button } from '@material-ui/core';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import routes from 'src/components/Helpers/Routes';
import { Autocomplete } from '@material-ui/lab';
import { KeyboardDatePicker } from '@material-ui/pickers';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomButton from 'src/components/Helpers/CustomButton';
import { isMobile, isTablet } from 'react-device-detect';

export default function ProductFrequencyDialog({ onClose, onSuccess }) {
  const toastConfig = useContext(CustomToastContext);
  const [productOptions, setProductOptions] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [assetOptions, setAssetOptions] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [servicesOptions, setServicesOptions] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const deepFilter = [
      {
        field: 'serializedProduct',
        term: { $in: [true] }
      }
    ];
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=${sidebarResource.product}&deepFilter=${JSON.stringify(deepFilter)}`)
      .then(({ data: { data: lookupResource } }) => {
        setProductOptions(lookupResource['Product'] || []);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
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

  const handleSubmit = async () => {
    let values = {
      "asset": selectedAsset,
      "product": selectedProduct,
      "service": selectedService,
      "date": selectedDate
    }
    axiosInstance()
      .post(`${workOrder.api}/work-order-scheduler/scheduler`, values)
      .then(({ data }) => {
        onSuccess();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Dialog
      TransitionComponent={CustomDialogTransition}
      open={true}
      aria-labelledby="customized-dialog-title"
      fullWidth
      fullScreen={fullScreen || isMobile || isTablet}
      maxWidth={'sm'}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          onClose();
        }
      }}
    >
      {productOptions.length > 0 ? (
        <Fragment>
          <CustomDialogHeader
            isMinimized={!fullScreen}
            onMinimizeMaximize={() => {
              setFullScreen((prevState) => !prevState);
            }}
            showManimizeMaximize={true}
            onClose={() => {
              onClose();
            }}
            showRequiredLabel={false}
            title={`${routes.workOrder.title} Scheduler`}
          />
          <CustomDialogContent>
            <div className="flex flex-col p-3">
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Autocomplete
                    size="small"
                    style={{ width: '100%' }}
                    options={productOptions}
                    value={productOptions?.find((data) => data.optionValue === selectedProduct) || {}}
                    getOptionLabel={(option) => option?.optionLabel || ''}
                    onChange={(e, val) => setSelectedProduct(val?.optionValue)}
                    renderInput={(params) => (
                      <TextField {...params} label="Select Product" variant="outlined" required />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Autocomplete
                    size="small"
                    style={{ width: '100%' }}
                    options={assetOptions}
                    loading={loading} 
                    value={assetOptions?.find((data) => data.optionValue === selectedAsset) || {}}
                    getOptionLabel={(option) => option?.optionLabel || ''}
                    onChange={(e, val) => setSelectedAsset(val?.optionValue)}
                    renderInput={(params) => (
                      <TextField {...params} label="Select Serialized Asset" variant="outlined" required />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Autocomplete
                    multiple
                    size="small"
                    style={{ width: '100%' }}
                    options={servicesOptions}
                    value={servicesOptions.filter((option) =>
                      selectedService?.includes(option.optionValue)
                    )}
                    getOptionLabel={(option) => option?.optionLabel || ''}
                    onChange={(e, val) =>
                      setSelectedService(val.map((item) => item.optionValue))
                    }
                    renderInput={(params) => (
                      <TextField {...params} label="Select Service" variant="outlined" required />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <KeyboardDatePicker
                    required
                    clearable
                    autoOk
                    fullWidth
                    size="small"
                    style={{ height: '40px' }}
                    variant="inline"
                    inputVariant="outlined"
                    value={selectedDate}
                    label="Select Date"
                    minDate={new Date()}
                    onChange={(date) => setSelectedDate(date)}
                    format="MM/dd/yyyy"
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
              </Grid>
            </div>
          </CustomDialogContent>
          <CustomDialogFooter>
            <Button
              size="small"
              color="primary"
              id="dialog-cancel-button"
              onClick={() => {
                onClose();
              }}
            >
              Cancel
            </Button>
            <CustomButton
              variant="contained"
              color="primary"
              type="submit"
              onClick={() => {
                if (selectedAsset && selectedDate && selectedProduct && selectedService) {
                  handleSubmit();
                } else {
                  toastConfig.setToastConfig({
                    open: true,
                    type: 'error',
                    message: 'All fields are required',
                  });
                }
              }}
            >
              Save
            </CustomButton>
          </CustomDialogFooter>
        </Fragment>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Dialog>
  );
}
