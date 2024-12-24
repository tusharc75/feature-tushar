import { Box, Button, Dialog, Grid, TextField, Typography } from '@mui/material';
import { isEqual } from 'lodash';
import { useContext, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import ConfirmCancelDialog from 'src/components/ConfirmCancelDialog';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomButton from 'src/components/Helpers/CustomButton';
import { CustomDialogTransition, productInventory, serializedAsset } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';

const NonSerializedAssetProductInventory = ({ onSuccess, onClose, productId, productInventoryData }) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { resources }
  }: any = useData();

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [isSubmitting, setSubmitting] = useState(false);
  const [inventoryData, setInventoryData] = useState(JSON.parse(JSON.stringify(productInventoryData)));

  const handleChange = (event, index) => {
    inventoryData[index].inventory = parseInt(event.target.value);
    setInventoryData([...inventoryData]);
  };

  const handleSubmit = () => {
    setSubmitting(true);
    let tempInventory = {
      inventories: inventoryData.map((d) => {
        const { warehouse, _id, ...rest } = d;
        return {
          warehouse: warehouse._id,
          ...rest
        };
      })
    };
    if (productId) {
      axiosInstance()
        .put(`${productInventory.api}/product/${productId}`, tempInventory)
        .then(({ data: { data } }) => {
          setSubmitting(false);
          onSuccess();
        })
        .catch((error) => {
          setSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    }
  };
  return (
    <Dialog
      maxWidth="xs"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      onClose={onClose}
      fullWidth
    >
      <CustomDialogHeader
        title={'Assign Plants'}
        onClose={onClose}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
      ></CustomDialogHeader>
      <CustomDialogContent>
        <Box marginY={2}>
          <Grid spacing={3} container>
            <>
              <Grid item xs={6} sm={6} md={6}>
                <Typography className="m-2 text-center" variant="subtitle2">
                  {resources?.warehouse?.titleSingular}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={6} md={6}>
                <Typography className="m-2 text-center" variant="subtitle2">
                  Quantity
                </Typography>
              </Grid>
              {inventoryData &&
                inventoryData.map((_element, index) => (
                  <>
                    <Grid key={index} item xs={6} sm={6} md={6}>
                      <Typography className="m-2 text-center">{_element?.warehouse?.name}</Typography>
                    </Grid>
                    <Grid key={index} item xs={6} sm={6} md={6}>
                      <TextField
                        key={index}
                        id="outlined-multiline-static"
                        size="small"
                        fullWidth
                        value={_element.inventory}
                        type="number"
                        onChange={(e) => handleChange(e, index)}
                        variant="outlined"
                        required
                        label="Quantity"
                      />
                    </Grid>
                  </>
                ))}
            </>
          </Grid>
        </Box>
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button disabled={isSubmitting} size="small" color="primary" onClick={onClose}>
          Cancel
        </Button>
        <CustomButton
          disabled={isSubmitting || isEqual(productInventoryData, inventoryData)}
          loading={isSubmitting}
          variant="contained"
          color="primary"
          type="submit"
          onClick={() => handleSubmit()}
        >
          Save
        </CustomButton>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default NonSerializedAssetProductInventory;
