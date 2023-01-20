import React, { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, Paper, useMediaQuery, Tab, Tabs } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import { useParams, useHistory } from 'react-router-dom';
import axiosInstance from '../../axios/axiosInstance';
import routes from '../../components/Helpers/Routes';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import DetailsPageHeader from '../../components/DetailsPageHeader';
import DetailsPage from '../../components/Shared/DetailsPage';
import { useData } from '../../StateProvider/Provider';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import {
    serviceOrder,
    defaultActivityShow,
    ACTIVITY_RESOURCE,
    getUniqueCurrencies,
} from '../../constants/helpers';
import { IoIosArrowDropright, IoIosArrowDropleft } from 'react-icons/io';
import Activity from '../../components/Activity';
import HideWhenOffline from '../../components/HideWhenOffline';
import queryString from 'query-string';
import { FaWpforms } from 'react-icons/fa';
import { BiEdit, BiFoodMenu } from 'react-icons/bi';
import { RiFlowChart } from 'react-icons/ri';
import TabPanel from '../../components/TabPanel';
import { isMobile } from 'react-device-detect';
import { camelCase } from 'lodash';
import ManageServiceOrderDialog from './ManageServiceOrder';
import Steps from '../RentalManagement/Steps';
import ContentFullScreen from 'src/components/ContentFullScreen';
import Services from './Services';
import Technician from './Technician';
import TechnicianDispatch from './TechnicianDispatch';

const ServiceOrderDetailsPage = () => {
    const toastConfig = useContext(CustomToastContext);
    const renderedFrom = camelCase(routes?.serviceOrder.title);

    const { id } = useParams();
    const history = useHistory();
    const parsed = queryString.parse(history.location.search);
    const { openEdit, tab }: any = parsed;

    const {
        state: { user, permissions }
    }: any = useData();
    const isSmallScreen = useMediaQuery('(max-width:1300px)');
    const isTabletScreen = useMediaQuery('(max-width:960px)');
    const [loadingDetails, setLoadingDetails] = useState(true);
    const [serviceOrderData, setServiceOrderData] = useState(null);

    const [showConfirmBox, setShowConfirmBox] = useState(false);
    const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
    const [serviceOrderFields, setServiceOrderFields] = useState([]);
    const [mainPoints, setMainPoints] = useState(null);
    const [showActivity, setActivityShow] = useState(defaultActivityShow);
    const [allowedToEdit, setAllowedToEdit] = useState(false);

    const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
    const [locationKeys, setLocationKeys] = useState([]);
    const [allowedToDelete, setAllowedToDelete] = useState(false);
    const [stepFullScreen, setStepFullScreen] = useState(false);
    const [nextStep, setNextStep] = useState(false);
    const [serviceSteps, setServiceSteps] = useState(['Add Services', 'Assign Technician', 'Technician Dispatch', 'Invoice']);
    const [currencySymbol, setCurrencySymbol] = useState(null);
    const [currentStep, setCurrentStep] = useState(null);

    useEffect(() => {
        return history.listen((location) => {
            const { tab }: any = queryString.parse(history.location.search);
            if (history.action === 'PUSH') {
                setLocationKeys([location.key]);
            }
            if (history.action === 'POP') {
                if (locationKeys[1] === location.key) {
                    setLocationKeys(([_, ...keys]) => keys);
                    // Handle forward event
                    setTabValue(tab ? parseInt(tab) : 0);
                } else {
                    setLocationKeys((keys) => [location.key, ...keys]);
                    // Handle back event
                    setTabValue(tab ? parseInt(tab) : 0);
                }
            }
        });
    }, [locationKeys]);

    const handleActivityHideShow = () => {
        setActivityShow(!showActivity);
    };

    const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
        setTabValue(newValue);
        history.push(`?tab=${newValue}`);
    };

    function a11yProps(index: any) {
        return {
            id: `main-tab-${index}`,
            'aria-controls': `main-tabpanel-${index}`
        };
    }

    useEffect(() => {
        if (isSmallScreen && tabValue === 0) {
            setActivityShow(true);
        } else {
            setActivityShow(false);
        }
    }, [isSmallScreen, tabValue]);

    useEffect(() => {
        if (id) {
            getServiceOrderFields();
            fetchServiceOrderData();
        }
    }, [id]);


    const handleMainPoints = (data) => {
        let mainPoint = {};
        setMainPoints(mainPoint);
    };

    const fetchServiceOrderData = async () => {
        try {
            let data;
            const response: any = await axiosInstance().get(`${serviceOrder.api}/${id}`);
            data = response?.data?.data;
            handleMainPoints(data);
            setLoadingDetails(false);
            const isAllowedToEdit = [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id);
            setAllowedToEdit(isAllowedToEdit);
            setAllowedToDelete(data.owner.optionValue === user?.user?._id);
            setServiceOrderData(data);
            setCurrencySymbol(getUniqueCurrencies().find((d) => d.currencyCode === data['currency'])?.symbolNative);
            setCurrentStep(serviceSteps.indexOf(data?.processStatus) !== -1 ? serviceSteps.indexOf(data?.processStatus) : 0);
            if (isAllowedToEdit && openEdit === 'true') {
                setOpenUpdateDialog(true);
                const params = new URLSearchParams();
                params.delete('openEdit');
                history.push({ search: params.toString() });
            }
        } catch (error) {
            setLoadingDetails(false);
            toastConfig.setToastConfig(error);
        }
    };

    const getServiceOrderFields = async () => {
        try {
            const response: any = await axiosInstance().get('/field?resource=Service Order');
            setServiceOrderFields(response?.data?.data);

        } catch (error) {
            toastConfig.setToastConfig(error);
        }
    };

    const handleOpenUpdateDialog = () => {
        setOpenUpdateDialog(true);
    };

    const handleDelete = () => {
        axiosInstance()
            .put(`${serviceOrder.api}/remove`, { ids: [serviceOrderData._id] })
            .then(() => {
                setShowConfirmBox(false);
                history.goBack();
            })
            .catch((error) => {
                toastConfig.setToastConfig(error);
                setShowConfirmBox(false);
            });
    };


    let style = {};
    if (isSmallScreen) {
        style = { overflowX: 'hidden', gridTemplateColumns: '100%' };
    } else {
        style = { overflowX: 'hidden' };
    }

    return (
        <>
            <Grid container className="headerbox">
                <CustomBreadCrumbs routes={[routes.serviceOrder, { title: `${serviceOrderData ? serviceOrderData?.serviceOrderNumber : ''}` }]} />
            </Grid>
            <div className={`detail-container ${showActivity ? 'grid-with-activity' : 'grid-without-activity'}`} style={style}>
                <div>
                    <div>
                        <Paper>
                            {!serviceOrderData ? (
                                <div>
                                    <Skeleton variant="text" width="150px" height="40px" />
                                    <Box display="flex">
                                        <Skeleton style={{ borderRadius: 6 }} width="120px" height="80px" />
                                        <Box marginX={1} />
                                        <Skeleton style={{ borderRadius: 6 }} width="120px" height="80px" />
                                    </Box>
                                </div>
                            ) : (
                                <DetailsPageHeader heading={serviceOrderData?.serviceOrderNumber} mainPoints={mainPoints} showHeading={true}>
                                    <Fragment>
                                        {permissions?.serviceOrder?.isUpdate &&
                                            allowedToEdit && (
                                                <Fragment>
                                                    <Button className="buttonStyleBigScreen" variant="contained" color="primary" size="small" onClick={handleOpenUpdateDialog}>
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        className="buttonStyleSmallScreen"
                                                        variant="text"
                                                        color="primary"
                                                        size="small"
                                                        onClick={handleOpenUpdateDialog}
                                                        style={isMobile ? { color: '#43aeaa' } : {}}
                                                    >
                                                        <BiEdit size={20} />
                                                    </Button>
                                                </Fragment>
                                            )}
                                    </Fragment>
                                </DetailsPageHeader>
                            )}
                            <Tabs
                                className="quote-tab"
                                value={tabValue}
                                onChange={handleMainTabChange}
                                textColor="primary"
                                TabIndicatorProps={{
                                    style: {
                                        display: 'none'
                                    }
                                }}
                            >
                                <Tab
                                    className={'tabLayout'}
                                    style={{
                                        background: tabValue === 1 ? 'white' : '',
                                        color: tabValue === 1 ? '#163340' : '#163340'
                                    }}
                                    label={
                                        <div className="d-flex align-items-center tab-font">
                                            <FaWpforms className="mr-1" fontSize="inherit" /> Header
                                        </div>
                                    }
                                    {...a11yProps(0)}
                                />
                                <Tab
                                    className={'tabLayout'}
                                    style={{
                                        background: tabValue === 2 ? 'white' : '',
                                        color: '#163340'
                                    }}
                                    label={
                                        <div className="d-flex align-items-center tab-font">
                                            <BiFoodMenu className="mr-1" fontSize="inherit" /> Details
                                        </div>
                                    }
                                    {...a11yProps(1)}
                                />
                                <Tab
                                    className={'tabLayout'}
                                    style={{
                                        background: tabValue === 3 ? 'white' : '',
                                        color: '#163340'
                                    }}
                                    label={
                                        <div className="d-flex align-items-center tab-font">
                                            <RiFlowChart className="mr-1" fontSize="inherit" />
                                            Views
                                        </div>
                                    }
                                    {...a11yProps(2)}
                                />
                                <div className={'uio'}></div>
                            </Tabs>
                            <TabPanel value={tabValue} index={0}>
                                <Box>
                                    {!loadingDetails && serviceOrderData && serviceOrderFields.length > 0 ? (
                                        <DetailsPage data={serviceOrderData} fields={serviceOrderFields} />
                                    ) : null}
                                </Box>
                            </TabPanel>
                            <TabPanel value={tabValue} index={1}>
                                <Paper>
                                    <Steps
                                        isNextStep={false}
                                        nextStep={nextStep}
                                        steps={serviceSteps}
                                        currentStep={currentStep}
                                        setCurrentStep={setCurrentStep}
                                        isStepEnded={false}
                                        setStepFullScreen={() => setStepFullScreen(true)}
                                    />
                                    <ContentFullScreen title={serviceSteps[currentStep]} fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
                                        {serviceSteps[currentStep] === 'Add Services' && serviceOrderData && (
                                            <Services
                                                serviceOrderData={serviceOrderData}
                                                setNextStep={setNextStep}
                                                currencySymbol={currencySymbol}
                                                isSmallScreen={isSmallScreen}
                                                isTabletScreen={isTabletScreen}
                                                showActivity={showActivity}
                                                renderedFrom={`${renderedFrom}_grid-1`}
                                                stepFullScreen={stepFullScreen}
                                                allowedToEdit={true}
                                            />
                                        )}
                                        {serviceSteps[currentStep] === 'Assign Technician' && serviceOrderData && (
                                            <Technician
                                                serviceOrderData={serviceOrderData}
                                                setNextStep={setNextStep}
                                                currencySymbol={currencySymbol}
                                                isSmallScreen={isSmallScreen}
                                                isTabletScreen={isTabletScreen}
                                                showActivity={showActivity}
                                                renderedFrom={`${renderedFrom}_grid-2`}
                                                stepFullScreen={stepFullScreen}
                                                allowedToEdit={true}
                                            />
                                        )}
                                        {serviceSteps[currentStep] === 'Technician Dispatch' && serviceOrderData && (
                                            <TechnicianDispatch
                                                serviceOrderData={serviceOrderData}
                                                setNextStep={setNextStep}
                                                currencySymbol={currencySymbol}
                                                isSmallScreen={isSmallScreen}
                                                isTabletScreen={isTabletScreen}
                                                showActivity={showActivity}
                                                renderedFrom={`${renderedFrom}_grid-3`}
                                                stepFullScreen={stepFullScreen}
                                                allowedToEdit={serviceSteps[currentStep] === 'Invoice' ? false : true}
                                            />
                                        )}
                                        {serviceSteps[currentStep] === 'Invoice' && serviceOrderData && (
                                            <TechnicianDispatch
                                                serviceOrderData={serviceOrderData}
                                                setNextStep={setNextStep}
                                                currencySymbol={currencySymbol}
                                                isSmallScreen={isSmallScreen}
                                                isTabletScreen={isTabletScreen}
                                                showActivity={showActivity}
                                                renderedFrom={`${renderedFrom}_grid-4`}
                                                stepFullScreen={stepFullScreen}
                                                allowedToEdit={false}
                                            />
                                        )}
                                    </ContentFullScreen>
                                </Paper>
                            </TabPanel>
                            <TabPanel value={tabValue} index={2}>
                                <Box>
                                </Box>
                            </TabPanel>
                        </Paper>
                    </div>
                    <Box my={1} />
                </div>
                <div className="position-relative">
                    <HideWhenOffline>
                        <Paper>
                            {!isSmallScreen && (
                                <span className={`${showActivity ? 'activityHide' : 'activityShow'} cursor-pointer`} onClick={handleActivityHideShow}>
                                    {showActivity ? <IoIosArrowDropright className="icon" /> : <IoIosArrowDropleft className="icon" />}
                                </span>
                            )}
                            <div style={{ display: showActivity ? 'block' : 'none' }}>
                                <Grid container>
                                    <Grid item xs={12}>
                                        {serviceOrderData && (
                                            <div>
                                                <Activity
                                                    resourceId={serviceOrderData._id}
                                                    resource={ACTIVITY_RESOURCE.serviceOrder}
                                                    restrictedAddActivities={
                                                        permissions &&
                                                            permissions[`${ACTIVITY_RESOURCE.serviceOrder}`] &&
                                                            permissions[`${ACTIVITY_RESOURCE.serviceOrder}`].isUpdate
                                                            ? []
                                                            : ['Attachment', 'Case']
                                                    }
                                                    relatedTo={[
                                                        {
                                                            type: `${ACTIVITY_RESOURCE.serviceOrder}`,
                                                            referenceId: serviceOrderData._id,
                                                            access: true
                                                        }
                                                    ]}
                                                    handleActivityRefresh={() => { }}
                                                    emails={[]}
                                                />
                                            </div>
                                        )}
                                    </Grid>
                                </Grid>
                            </div>
                        </Paper>
                    </HideWhenOffline>
                </div>
            </div>
            {showConfirmBox && (
                <ConfirmationDialog
                    open={showConfirmBox}
                    message={`Are you sure you want to delete this ${routes.serviceOrder.title.toLowerCase()} ?`}
                    onClose={() => {
                        setShowConfirmBox(false);
                    }}
                    onOk={handleDelete}
                />
            )}
            {openUpdateDialog && (
                <ManageServiceOrderDialog
                    isClone={false}
                    open={openUpdateDialog}
                    serviceOrderId={id}
                    serviceOrderData={serviceOrderData}
                    onClose={() => setOpenUpdateDialog(false)}
                    onSuccess={() => {
                        setOpenUpdateDialog(false);
                        fetchServiceOrderData();
                    }}
                />
            )}
        </>
    );
};

export default ServiceOrderDetailsPage;
