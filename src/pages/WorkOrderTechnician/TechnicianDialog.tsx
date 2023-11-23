import { Box, Dialog, Typography, Grid } from '@material-ui/core';
import routes from 'src/components/Helpers/Routes';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { useData } from 'src/StateProvider/Provider';
import { CustomDialogTransition, WORKORDER_SERVICE_STATUS, WORK_ORDER_STATUS, sidebarResource } from 'src/constants/helpers';
import axiosInstance from 'src/axios/axiosInstance';
import { useContext, useEffect, useState } from 'react';
import Service from '../WorkOrder/Service';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';


const TechnicianDialog = ({ handleClose, selectedService }) => {

    const {
        state: { permissions, user }
    }: any = useData();

    const toastConfig = useContext(CustomToastContext);

    const [completed, setCompleted] = useState(false);
    const [workOrderData, setWorkOrderData] = useState(null);

    useEffect(() => {
        fetchWorkOrderData();
    }, [selectedService]);

    const fetchWorkOrderData = () => {
        axiosInstance()
            .get(`${routes.workOrder.path}/${selectedService?.workOrderId}`)
            .then(({ data: { data } }) => {
                setCompleted(data?.status === WORK_ORDER_STATUS.completed || data?.deleted ? true : false);
                setWorkOrderData({ ...data });
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
            });
    };

    return (<Dialog
        fullScreen={true}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        open={true}>
        <CustomDialogHeader
            showRequiredLabel={false}
            title={`${selectedService?.workOrderNumber}`}
            onClose={handleClose}
            additionalTitle={
                selectedService?.assetNumber &&
                <Box ml={2} title={selectedService?.assetNumber} >
                    <Typography variant="h6" className={`title-layout text-truncate`}>
                        {`Asset : `}
                        {permissions?.serializedAsset?.isRead ? (
                            <a
                                target="_blank"
                                style={{ textDecoration: 'underline', textUnderlineOffset: '5px' }}
                                href={`${routes.serializedAssetDetail.path}/${selectedService?.assetId}`}
                            >
                                {selectedService?.assetNumber}
                            </a>
                        ) : (
                            selectedService?.assetNumber
                        )}
                    </Typography>
                </Box>
            }
        ></CustomDialogHeader>
        <Box p={2}>
            {workOrderData ?
                <Service
                    workOrderData={workOrderData}
                    workOrderId={selectedService?.workOrderId}
                    allowedToEdit={[WORKORDER_SERVICE_STATUS.backlog, WORKORDER_SERVICE_STATUS.inProgressByOther]?.includes(selectedService?.status) ? false : true}
                    completed={completed}
                    fetchWorkOrderData={fetchWorkOrderData}
                    resource={sidebarResource.workOrderTechnician}
                    technicianSelectedService={selectedService.uniqueId}
                /> :
                <Grid container spacing={2} >
                    <CommonSkeleton lenArray={[...Array(10).keys()]} />
                </Grid>
            }
        </Box>
    </Dialog>
    );
};
export default TechnicianDialog;

