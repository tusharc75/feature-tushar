import { Box, Dialog, Typography } from '@mui/material';
import routes from 'src/components/Helpers/Routes';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { useData } from 'src/StateProvider/Provider';
import { CustomDialogTransition, sidebarResource } from 'src/constants/helpers';
import { useState } from 'react';
import WorkOrderDetailContent from 'src/pages/WorkOrder/WorkOrderDetailContent';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';

const TechnicianDialog = ({ handleClose, workOrderId, uniqueId, canPerform }) => {
  const {
    state: { permissions }
  }: any = useData();

  const [workOrderData, setWorkOrderData] = useState(null);
  const [defaultUniqueId, setDefaultUniqueId] = useState(uniqueId);

  return (
    <Dialog fullScreen={true} TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true}>
      <>
        <CustomDialogHeader
          showRequiredLabel={false}
          title={`${workOrderData?.workOrderNumber || ''}`}
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
        <CustomDialogContent style={{ padding: 0 }}>
          <WorkOrderDetailContent
            id={workOrderId}
            tab={1}
            resource={sidebarResource?.workOrderTechnician}
            defaultSelectedService={defaultUniqueId}
            setDefaultSelectedService={setDefaultUniqueId}
            sendWorkOrderData={setWorkOrderData}
          />
        </CustomDialogContent>
      </>
    </Dialog >
  );
};
export default TechnicianDialog;
