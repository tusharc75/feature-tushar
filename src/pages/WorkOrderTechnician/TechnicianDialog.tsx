import { Box, Dialog, Typography } from '@material-ui/core';
import routes from 'src/components/Helpers/Routes';
import Steps from '../WorkOrder/Service/Steps';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { useData } from 'src/StateProvider/Provider';
import { CustomDialogTransition, WORKORDER_TECHNICIAN_SERVICE_STATUS, workOrder } from 'src/constants/helpers';
import axiosInstance from 'src/axios/axiosInstance';
import { useEffect, useState } from 'react';


const TechnicianDialog = ({ handleClose, selectedService }) => {

    const {
        state: { permissions, user }
    }: any = useData();

    const [stepSubmitedData, setStepSubmitedData] = useState([]);

    useEffect(() => {
        fetchService();
    }, [selectedService]);

    const fetchService = async () => {
        const stepDataResponse = await axiosInstance().get(`${workOrder.api}/${selectedService?.workOrderId}/steps-data`);
        setStepSubmitedData(stepDataResponse?.data?.data || []);
    }

    return (<Dialog
        fullScreen={true}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        open={true}>
        <CustomDialogHeader
            showRequiredLabel={false}
            title={`${selectedService?.serviceName} Steps`}
            onClose={handleClose}
            additionalTitle={
                <Box ml={2}>
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
            <Steps
                workOrderId={selectedService?.workOrderId}
                warehouse={selectedService?.warehouse}
                selectedService={{ ...selectedService, stepSubmitedData: stepSubmitedData }}
                allowedToEdit={selectedService?.status === WORKORDER_TECHNICIAN_SERVICE_STATUS[0] ? false : true}
                setDisableCompleteFail={() => { }}
                fetchService={fetchService}
                referencType={'workOrderTechnician'}
                handelClose={handleClose}
                stepSubmitedData={stepSubmitedData}
            />
        </Box>
    </Dialog>
    );
};
export default TechnicianDialog;

