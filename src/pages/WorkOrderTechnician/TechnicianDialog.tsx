import { Box, Dialog, Typography, Grid } from '@material-ui/core';
import routes from 'src/components/Helpers/Routes';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { useData } from 'src/StateProvider/Provider';
import { CustomDialogTransition, WORKORDER_SERVICE_STATUS, WORK_ORDER_STATUS, repairJob, sidebarResource } from 'src/constants/helpers';
import axiosInstance from 'src/axios/axiosInstance';
import { useContext, useEffect, useState } from 'react';
import Service from '../WorkOrder/Service';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ManageRepairJob from '../RepairJob/ManageRepairJob';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';

const TechnicianDialog = ({ handleClose, workOrderId, uniqueId, canPerform }) => {
  const {
    state: { permissions, user }
  }: any = useData();

  const toastConfig = useContext(CustomToastContext);

  const [completed, setCompleted] = useState(false);
  const [workOrderData, setWorkOrderData] = useState(null);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [defaultUniqueId, setDefaultUniqueId] = useState(uniqueId);
  const [showManageRepairJobDialog, setShowManageRepairJobDialog] = useState(false);
  const [repairJobReceiveConfirmation, setRepairJobReceiveConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchWorkOrderData();
  }, [workOrderId]);

  const fetchWorkOrderData = () => {
    axiosInstance()
      .get(`${routes.workOrder.path}/${workOrderId}`)
      .then(({ data: { data } }) => {
        var isAllowedToEdit = [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id);
        if (user?.role?.selectedEntity?.superAdminAccess) {
          isAllowedToEdit = true;
        }
        setAllowedToEdit(isAllowedToEdit && permissions?.workOrder?.isUpdate ? true : false);
        setCompleted(data?.status === WORK_ORDER_STATUS.completed || data?.deleted ? true : false);
        setWorkOrderData({ ...data });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleAddAssetInRepairJob = (data) => {
    axiosInstance()
      .put(`${repairJob.api}/add-assets-create-ticket`, {
        repairJob: data?._id,
        assets: workOrderData?.serializedAsset ? [workOrderData?.serializedAsset?.optionValue] : []
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setShowManageRepairJobDialog(false);
        fetchWorkOrderData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleReceiveAssetInRepairJob = () => {
    setIsSubmitting(true);
    axiosInstance()
      .put(`${repairJob.api}/receive-assets-complete`, { repairJob: workOrderData?.currentRepairJob?.optionValue || workOrderData?.currentRepairJob })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setRepairJobReceiveConfirmation(false);
        setIsSubmitting(false);
        fetchWorkOrderData();
      })
      .catch((error) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <>
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
              {workOrderData ? (
                <Service
                  workOrderData={workOrderData}
                  workOrderId={workOrderId}
                  allowedToEdit={allowedToEdit}
                  completed={completed}
                  fetchWorkOrderData={fetchWorkOrderData}
                  resource={sidebarResource.workOrderTechnician}
                  defaultSelectedService={defaultUniqueId}
                  setDefaultSelectedService={setDefaultUniqueId}
                  minHeightClass={'md:h-[calc(100vh-150px)]'}
                  setShowManageRepairJobDialog={setShowManageRepairJobDialog}
                  setRepairJobReceiveConfirmation={setRepairJobReceiveConfirmation}
                />
              ) : (
                <Grid container spacing={2}>
                  <CommonSkeleton lenArray={[...Array(10).keys()]} />
                </Grid>
              )}
            </Box>
          </>
        ) : (
          <Grid container spacing={2}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Grid>
        )}
      </Dialog>
      {showManageRepairJobDialog && (
        <ManageRepairJob
          onClose={() => setShowManageRepairJobDialog(false)}
          onSuccess={(data) => {
            handleAddAssetInRepairJob(data);
          }}
          referenceType={sidebarResource.workOrderTechnician}
          referenceData={{
            warehouse: workOrderData?.warehouse?.optionValue,
            workOrder: workOrderData?._id
          }}
        />
      )}
      {repairJobReceiveConfirmation && (
        <ConfirmationDialog
          open={repairJobReceiveConfirmation}
          message={`Are you sure you want to receive asset?`}
          onClose={() => {
            setRepairJobReceiveConfirmation(false);
          }}
          onOk={handleReceiveAssetInRepairJob}
          okBtnLoading={isSubmitting}
        />
      )}
    </>
  );
};
export default TechnicianDialog;
