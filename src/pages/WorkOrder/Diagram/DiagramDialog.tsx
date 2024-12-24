import { Dialog, Grid } from '@mui/material';
import { ACTIVITY_RESOURCE, CustomDialogTransition, workOrder } from 'src/constants/helpers';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import Diagram from '.';
import { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

const DiagramDialog = ({ handleClose, referenceId }) => {
  const toastConfig = useContext(CustomToastContext);
  const [workOrderData, setWorkOrderData] = useState(null);

  useEffect(() => {
    axiosInstance()
      .get(`${workOrder.api}/current-version/${referenceId}`)
      .then(({ data: { data } }) => {
        setWorkOrderData(data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  }, [referenceId]);

  return (
    <Dialog
      open
      aria-labelledby="customized-dialog-title"
      maxWidth="md"
      onClose={(e, reason) => {
        handleClose();
      }}
      fullWidth
      fullScreen
      TransitionComponent={CustomDialogTransition}
    >
      <CustomDialogHeader
        onClose={() => {
          handleClose();
        }}
        showRequiredLabel={false}
        title={`Drawings`}
      ></CustomDialogHeader>
      <CustomDialogContent isFooterPresent={false}>
        {workOrderData ? (
          <Diagram
            resource={ACTIVITY_RESOURCE.workOrder}
            referenceId={referenceId}
            currentVersion={workOrderData?.currentVersion}
            workOrderData={workOrderData}
          />
        ) : (
          <Grid container spacing={2}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Grid>
        )}
      </CustomDialogContent>
    </Dialog>
  );
};

export default DiagramDialog;
