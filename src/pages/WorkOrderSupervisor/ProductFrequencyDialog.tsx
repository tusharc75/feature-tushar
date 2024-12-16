import { Fragment, useContext, useEffect, useState } from 'react';
import { CustomDialogTransition, sidebarResource } from '../../constants/helpers';
import { Dialog, TextField, Box } from '@material-ui/core';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import routes from 'src/components/Helpers/Routes';
import { Autocomplete } from '@material-ui/lab';
import ServiceMaster from 'src/pages/Product/ServiceMaster';
import { useData } from 'src/StateProvider/Provider';

export default function ProductFrequencyDialog({ onClose, onSuccess }) {
  const toastConfig = useContext(CustomToastContext);
  const [productOptions, setProductOptions] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { state: { resources } }: any = useData();

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
            title={`${resources?.workOrder?.titleSingular} Scheduling`}
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
                  <ServiceMaster renderedFrom={sidebarResource.workOrderSupervisor} id={selectedProduct} key={selectedProduct} />
                </div>
              ) : null}
            </div>
          </CustomDialogContent>
        </Fragment>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Dialog>
  );
}
