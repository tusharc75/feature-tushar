import { Box, Dialog, Grid, Typography } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import { CustomDialogTransition } from 'src/constants/helpers';
import WorkOrderDetailContent from 'src/pages/WorkOrder/WorkOrderDetailContent';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';

const WorkOrderDetailDialog = ({ workOrderId, handleClose }) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions }
  }: any = useData();

  const [workOrderData, setWorkOrderData] = useState(null);

  useEffect(() => {
    fetchWorkOrderData();
  }, [workOrderId]);

  const fetchWorkOrderData = () => {
    axiosInstance()
      .get(`${routes.workOrder.path}/${workOrderId}`)
      .then(({ data: { data } }) => {
        setWorkOrderData({ ...data });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  return (
    <Dialog fullScreen={true} TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true}>
      {workOrderData ? (
        <>
          <CustomDialogHeader
            showRequiredLabel={false}
            title={`${workOrderData?.workOrderNumber}`}
            onClose={handleClose}
            additionalTitle={
              workOrderData?.serializedAsset?.optionLabel && (
                <Box ml={2} title={workOrderData?.serializedAsset?.optionLabel}>
                  <Typography variant="h6" className={`title-layout text-truncate`}>
                    {`Asset : `}
                    {permissions?.serializedAsset?.isRead ? (
                      <a
                        rel="noreferrer"
                        target="_blank"
                        style={{ textDecoration: 'underline', textUnderlineOffset: '5px' }}
                        href={`${routes.serializedAssetDetail.path}/${workOrderData?.serializedAsset?.optionValue}`}
                      >
                        {workOrderData?.serializedAsset?.optionLabel}
                      </a>
                    ) : (
                      workOrderData?.serializedAsset?.optionLabel
                    )}
                  </Typography>
                </Box>
              )
            }
          ></CustomDialogHeader>
          <Box p={2}>
            <WorkOrderDetailContent id={workOrderId} tab={1} />
          </Box>
        </>
      ) : (
        <Grid container spacing={2}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Grid>
      )}
    </Dialog>
  );
};

export default WorkOrderDetailDialog;
