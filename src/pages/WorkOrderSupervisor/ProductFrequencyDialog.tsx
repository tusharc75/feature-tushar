import { Fragment, useContext, useEffect, useState } from 'react';
import { CustomDialogTransition, sidebarResource } from '../../constants/helpers';
import { Dialog, Button, TextField, TableBody, TableCell, TableHead, TableRow, TableContainer, Table, Box, Paper } from '@material-ui/core';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import routes from 'src/components/Helpers/Routes';
import CustomButton from 'src/components/Helpers/CustomButton';
import { Autocomplete } from '@material-ui/lab';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import ServiceCondition from 'src/pages/Product/ServiceMaster/ServiceCondition';
import ServiceMaster from 'src/pages/Product/ServiceMaster';

export default function ProductFrequencyDialog({ onClose, onSuccess }) {
  const toastConfig = useContext(CustomToastContext);
  const [productOptions, setProductOptions] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productServices, setProductServices] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=${sidebarResource.product}`)
      .then(({ data: { data: lookupResource } }) => {
        setProductOptions(lookupResource['Product']);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  }, []);

  useEffect(() => {
    fetchServices();
  }, [selectedProduct]);

  const fetchServices = () => {
    if (selectedProduct) {
      setLoading(true);
      axiosInstance()
        .get(`${routes.product.path}/${selectedProduct}/service-master`)
        .then(({ data: { data } }) => {
          const services = data?.map((d) => {
            return {
              _id: d._id,
              name: d.serviceName,
              frequency: d.frequency || ''
            };
          });
          setProductServices(services);
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setProductServices(null);
    }
  };

  const handleSubmit = () => {
    setSubmitting(true);
    const values = productServices?.map((p) => ({ _id: p._id, frequency: p.frequency }));
    axiosInstance()
      .put(`${routes.product.path}/${selectedProduct}/service-master/update-service-data`, values)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setSubmitting(false);
        onSuccess();
      })
      .catch((err) => {
        setSubmitting(false);
        toastConfig.setToastConfig(err);
      });
  };

  const handleMainTabChange = (event: any, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Dialog
      TransitionComponent={CustomDialogTransition}
      open={true}
      aria-labelledby="customized-dialog-title"
      fullWidth
      fullScreen={true}
      maxWidth={'md'}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
        }
      }}
    >
      {productOptions?.length > 0 ? (
        <Fragment>
          <CustomDialogHeader
            onClose={() => {
              onClose();
            }}
            showRequiredLabel={false}
            title={`${routes.workOrder.title} Scheduling`}
          />
          <CustomDialogContent>
            <div className="flex flex-col p-3">
              {productOptions && (
                <Autocomplete
                  size="small"
                  style={{ width: '300px' }}
                  options={productOptions}
                  value={
                    productOptions && productOptions.find((data) => data.optionValue === selectedProduct)
                      ? productOptions.find((data) => data.optionValue === selectedProduct)
                      : {}
                  }
                  getOptionLabel={(option: any) => option?.optionLabel || ''}
                  getOptionSelected={(option: any, val) => (option ? option?.optionValue == val?.optionValue : false)}
                  onChange={(e, val) => {
                    setSelectedProduct(val?.optionValue);
                  }}
                  renderInput={(params) => <TextField {...params} label="Select Product" variant="outlined" />}
                />
              )}
              {selectedProduct ? (
                <div className="mt-4">
                  <ServiceMaster renderedFrom={routes.workOrderSupervisor.title} id={selectedProduct} key={selectedProduct} />
                </div>
              ) : null}
            </div>
          </CustomDialogContent>
          {/* <CustomDialogFooter>
            <Button
              size="small"
              color="primary"
              disabled={false}
              onClick={() => {
                onClose();
              }}
            >
              Cancel
            </Button>
            <CustomButton
              disabled={!productServices?.length || submitting}
              loading={false}
              variant="contained"
              color="primary"
              type="submit"
              onClick={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
            >
              {' '}
              Save
            </CustomButton>
          </CustomDialogFooter> */}
        </Fragment>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Dialog>
  );
}
