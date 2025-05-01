import { Dialog } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { ACTIVITY_RESOURCE, CustomDialogTransition, workOrder } from 'src/constants/helpers';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import Diagram from '.';
import { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

const DiagramDialog = ({
  handleClose,
  referenceId,
  referenceLabel = '',
  uniqueId = null,
  stepId = null,
  resource,
  attachmentType = null,
  showMaterialFilter = false
}) => {
  const toastConfig = useContext(CustomToastContext);
  const [resourceData, setResourceData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (resource === ACTIVITY_RESOURCE.workOrder) {
      setLoading(true);
      axiosInstance()
        .get(`${workOrder.api}/current-version/${referenceId}`)
        .then(({ data: { data } }) => {
          setResourceData(data);
          setLoading(false);
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
          setLoading(false);
        });
    }
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
        title={attachmentType ? `${attachmentType} ${referenceLabel && ` - ${referenceLabel}`}` : `Attachments - ${referenceLabel}`}
      ></CustomDialogHeader>
      <CustomDialogContent isFooterPresent={false}>
        {!loading ? (
          <Diagram
            height={'calc(100vh - 150px)'}
            resource={resource}
            referenceId={referenceId}
            uniqueId={uniqueId}
            stepId={stepId}
            currentVersion={resource === ACTIVITY_RESOURCE.workOrder ? resourceData?.currentVersion : null}
            resourceData={resourceData}
            attachmentType={attachmentType}
            referenceLabel={referenceLabel}
            showMaterialFilter={showMaterialFilter}
            showContainer={false}
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
