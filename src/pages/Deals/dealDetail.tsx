import { Box, Button, Grid, Tab, Tabs } from '@material-ui/core';
import React, { useContext, useEffect, useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { isMobile, isTablet } from 'react-device-detect';
import { BiEdit, BiFoodMenu } from 'react-icons/bi';
import { DeleteButton } from 'src/components/Helpers/Buttons';
import { useData } from 'src/StateProvider/Provider';
import { useParams, useHistory } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import DetailsPage from '../../components/Shared/DetailsPage';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import TabPanel from '../../components/TabPanel';
import { camelCase } from 'lodash';
import { FaWpforms } from 'react-icons/fa';
import { TbFileInvoice } from 'react-icons/tb';
import ContentFullScreen from 'src/components/ContentFullScreen';
import { ACTIVITY_RESOURCE, jobProcessSteps } from 'src/constants/helpers';

import ActivityButton from 'src/components/Activity/ActivityButton';
import Steps, { getIndex } from 'src/components/Steps';
import { Edit } from '@material-ui/icons';
import Material from './Material';

const DealDetail = () => {
    const { id } = useParams();
    const history = useHistory();
    const toastConfig = useContext(CustomToastContext);
    const [customizedRoutes, setCustomizedRoutes] = useState<any>([routes.deals]);
    const [dealData, setDealData] = useState(null)
    const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
    const [fields, setFields] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showConfirmBox, setShowConfirmBox] = useState(false);
    const [allowedToEdit, setAllowedToEdit] = useState(false);
    const [allowedToDelete, setAllowedToDelete] = useState(false);
    const [tabValue, setTabValue] = useState(0);
    const [currentStep, setCurrentStep] = useState(null);
    const [nextStep, setNextStep] = useState(true);
    const [stepFullScreen, setStepFullScreen] = useState(false);

    const jobProcessStepsNames = React.useMemo(() => {
        return jobProcessSteps.map((item) => item.name);
    }, [jobProcessSteps]);

    const {
        state: { permissions, user }
    }: any = useData();

    useEffect(() => {
        if (id) {
            fetchFields();
            fetchData();
        }
    }, [id]);

    const fetchFields = async () => {
        axiosInstance()
            .get('/field?resource=Deals')
            .then(({ data }) => {
                setFields(data.data?.filter((field) => field.isRead));
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
            });
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const {
                data: { data }
            } = await axiosInstance().get(`${routes.deals.path}/${id}`);
            setDealData(data);
            setLoading(false);
        } catch (error) {
            toastConfig.setToastConfig(error);
        }
    };

    const handleOpenUpdateDialog = () => {
        setOpenUpdateDialog(true);
    };

    const closeUpdateDialog = () => {
        setOpenUpdateDialog(false);
    };

    const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
        setTabValue(newValue);
    };

    const updateProcessStatus = (processStatus) => {
        axiosInstance()
            .put(`${routes.job.path}/${id}/process-status`, { processStatus: processStatus })
            .then(({ data }) => { })
            .catch((error) => { });
    };

    useEffect(() => {
        if (currentStep !== null && currentStep >= 0 && currentStep <= jobProcessStepsNames.length) {
            updateProcessStatus(jobProcessStepsNames[currentStep]);
        }
    }, [currentStep]);

    return (
        <Box className="main-container-v1">
            <Box className="headerbox-v1">
                <Box className="nav-v1">
                    <CustomBreadCrumbs routes={customizedRoutes} />
                </Box>
            </Box>
            <Box className="detail-container-v1">
                <Tabs
                    className="new-tab-container-v1"
                    value={tabValue}
                    onChange={handleMainTabChange}
                    textColor="primary"
                    TabIndicatorProps={{
                        style: {
                            height: 0
                        }
                    }}
                >
                    <Tab
                        className={'tabLayout'}
                        label={
                            <div className="d-flex align-items-center tab-font">
                                <FaWpforms className="mr-1" fontSize="inherit" /> Header
                            </div>
                        }
                        value={0}
                        aria-controls="a11y-tabpanel-0"
                        id="a11y-tab-0"
                    />
                    <Tab
                        className={'tabLayout'}
                        label={
                            <div className="d-flex align-items-center tab-font">
                                <BiFoodMenu className="mr-1" fontSize="inherit" /> Material
                            </div>
                        }
                        value={1}
                        aria-controls="a11y-tabpanel-1"
                        id="a11y-tab-1"
                    />
                </Tabs>
                <TabPanel value={tabValue} index={0}>
                    <Box>
                        {loading || !fields?.length ? (
                            <Grid container spacing={2} style={{ padding: '8px' }}>
                                <CommonSkeleton lenArray={[...Array(7).keys()]} />
                            </Grid>
                        ) : (
                            <DetailsPage data={dealData} fields={fields} />
                        )}
                    </Box>
                </TabPanel>
                <TabPanel value={tabValue} index={1}>
                    <Material dealId={id} />
                </TabPanel>
            </Box>
        </Box>
    );
};

export default DealDetail;
