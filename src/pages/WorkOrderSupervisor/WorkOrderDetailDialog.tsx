import { Box, Dialog, Typography } from '@mui/material';
import { useContext, useState } from 'react';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import routes from 'src/components/Helpers/Routes';
import { CustomDialogTransition, sidebarResource } from 'src/constants/helpers';
import WorkOrderDetailContent from 'src/pages/WorkOrder/WorkOrderDetailContent';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';

const WorkOrderDetailDialog = ({ workOrderId, handleClose }) => {
  const {
    state: { permissions }
  }: any = useData();

  const [workOrderData, setWorkOrderData] = useState(null);

  return (
    <Dialog fullScreen={true} TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true}>
      <CustomDialogHeader
        showRequiredLabel={false}
        title={`${workOrderData?.workOrderNumber || ''}`}
        onClose={handleClose}
        additionalTitle={
          workOrderData?.serializedAsset?.optionLabel && (
            <Box title={workOrderData?.serializedAsset?.optionLabel}>
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
      <CustomDialogContent style={{ padding: 0 }}>
        <WorkOrderDetailContent
          id={workOrderId}
          tab={1}
          resource={sidebarResource.workOrderSupervisor}
          sendWorkOrderData={setWorkOrderData}
        />
      </CustomDialogContent>
    </Dialog>
  );
};

export default WorkOrderDetailDialog;
