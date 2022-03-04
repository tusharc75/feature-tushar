import React, { useState, useEffect, useContext, Fragment } from "react";
import { Grid, Box, Button, Paper, Tab, Tabs, useMediaQuery } from "@material-ui/core";
import { useParams, useHistory } from "react-router-dom";
import axiosInstance from "../../axios/axiosInstance";
import routes from "../../components/Helpers/Routes";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import DetailsPageHeader from "../../components/DetailsPageHeader";
import DetailsPage from "../../components/Shared/DetailsPage";
import { useData } from "../../StateProvider/Provider";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { sublease, SUBLEASE_STATUS, subleaseSteps, defaultActivityShow, ACTIVITY_RESOURCE } from "../../constants/helpers";
import ManageSublease from "./ManageSublease";
import Steps from "../RentalManagement/Steps";
import { FaWpforms } from "react-icons/fa";
import { BiEdit, BiFoodMenu } from "react-icons/bi";
import TabPanel from "../../components/TabPanel";
import queryString from 'query-string';
import { isMobile, isTablet } from "react-device-detect";
import accountClass from "../Account/account.module.scss";
import Productpackage from './Productpackage';
import SerializedAsset from './SerializedAsset';
import Tickets from './Tickets';
import { GiAbstract055 } from 'react-icons/gi';
import { camelCase } from "lodash";
import HideWhenOffline from "src/components/HideWhenOffline";
import Activity from '../../components/Activity';
import { IoIosArrowDropright, IoIosArrowDropleft } from 'react-icons/io';

const SubleaseDetailsPage = () => {
    const renderedFrom = camelCase(routes?.sublease.title)
    const toastConfig = useContext(CustomToastContext);
    const isSmallScreen = useMediaQuery('(max-width:1300px)');
    const [showActivity, setActivityShow] = useState(defaultActivityShow);

    const { id } = useParams();
    const history = useHistory();
    const parsed = queryString.parse(history.location.search);
    const { state: { user, permissions } }: any = useData();

    const [subleaseData, setSubleaseData] = useState(null);
    const [showConfirmBox, setShowConfirmBox] = useState(false);
    const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
    const [fields, setFields] = useState([]);
    const [statusOptions, setStatusOptions] = useState([])
    const [allowedToEdit, setAllowedToEdit] = useState(false);
    const [currentStep, setCurrentStep] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [nextStep, setNextStep] = useState(true);

    const [tabValue, setTabValue] = useState(Number(parsed?.tab || 0));
    const [isIssued, setIsIssued] = useState(false);

    function a11yProps(index: any) {
        return {
            id: `main-tab-${index}`,
            'aria-controls': `main-tabpanel-${index}`
        };
    }

    const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
        setTabValue(newValue);
        history.replace(`?tab=${newValue}`);
    };

    useEffect(() => {
        if (currentStep >= 0 && currentStep <= 2) {
            updateProcessStatus(subleaseSteps[currentStep])
        }
    }, [currentStep]);

    const updateProcessStatus = (processStatus) => {
        axiosInstance().put(`${sublease.api}/${id}/process-status`, { processStatus: processStatus }).then(({ data }) => { })
            .catch((error) => {
                toastConfig.setToastConfig(error);
            });
    }

    useEffect(() => {
        if (parsed) {
            history.replace(`?tab=${tabValue}`);
        }
    }, []);

    useEffect(() => {
        getFields();
        fetchData();
    }, [id]);

    const getFields = () => {
        axiosInstance().get("/field?resource=Sublease")
            .then(({ data }) => {
                setFields(data.data);
                if (data.data && data.data.length) {
                    data.data.some(o => {
                        if (o?.fieldData?.fieldName === "status") {
                            setStatusOptions([...o.fieldData.option])
                            return true
                        }
                    })
                }
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
            });
    };

    const fetchData = async () => {
        try {
            const { data: { data } } = await axiosInstance().get(`${sublease.api}/${id}`);
            setCurrentStep(subleaseSteps.indexOf(data?.processStatus) !== -1 ? subleaseSteps.indexOf(data?.processStatus) : 0);
            const isAllowedToEdit = [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id);
            if (data?.productInventory?.length) {
                setIsIssued(true)
            }
            setAllowedToEdit(isAllowedToEdit);
            setSubleaseData(data);
        } catch (error) {
            toastConfig.setToastConfig(error);
        }
    };

    const handleDelete = () => {
        axiosInstance().put(`${sublease.api}/remove`, { "ids": [] }).then(() => {
            setShowConfirmBox(false);
            history.goBack();
        }).catch((error) => {
            toastConfig.setToastConfig(error)
            setShowConfirmBox(false);
        });
    }

    const openActions = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const closeActions = () => {
        setAnchorEl(null);
    };

    const handleActivityHideShow = () => {
        setActivityShow(!showActivity);
    };

    return (
        <>
            <Fragment>
                <Grid container className="headerbox">
                    <CustomBreadCrumbs routes={[routes.sublease, { title: subleaseData?.subleaseName }]} />
                </Grid>
                <div className={`detail-container ${showActivity ? 'grid-with-activity' : 'grid-without-activity'}`}>
                    <div>
                        <Grid container spacing={1} className="detail-container">
                            <Grid item xs={12} sm={12} spacing={2}>
                                <Paper style={{ height: "650px" }}>
                                    <DetailsPageHeader
                                        heading={subleaseData?.subleaseName}
                                        mainPoints={null}
                                        showHeading={true}
                                    >
                                        {(permissions?.sublease?.isUpdate && subleaseData?.status !== SUBLEASE_STATUS.completed) && (
                                            <>
                                                <Button
                                                    variant={isMobile && !isTablet ? "text" : "contained"}
                                                    color="primary"
                                                    size="small"
                                                    onClick={() => { setOpenUpdateDialog(true); }}
                                                    className={isMobile && !isTablet ? accountClass.mobile_button_layout : ""}
                                                    style={isMobile && !isTablet ? { color: "#43aeaa" } : {}}
                                                >
                                                    {isMobile && !isTablet ? <BiEdit size={20} /> : "Edit"}
                                                </Button>
                                            </>
                                        )}
                                    </DetailsPageHeader>
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
                                                color: tabValue === 2 ? '#163340' : '#163340'
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
                                                color: tabValue === 3 ? '#163340' : '#163340'
                                            }}
                                            label={
                                                <div className="d-flex align-items-center tab-font">
                                                    <GiAbstract055 className="mr-1" fontSize="inherit" />Delivery Tickets
                                                </div>
                                            }
                                            {...a11yProps(1)}
                                        />
                                        <div className={'uio'}> </div>
                                    </Tabs>
                                    <TabPanel value={tabValue} index={0}>
                                        <Box>
                                            {subleaseData && fields.length ? (
                                                <DetailsPage data={subleaseData} fields={fields} />
                                            ) : (
                                                <Grid container spacing={2} style={{ padding: "8px" }}>
                                                    <CommonSkeleton lenArray={[...Array(7).keys()]} />
                                                </Grid>
                                            )}
                                        </Box>
                                        <Grid container spacing={2}>
                                        </Grid>
                                    </TabPanel>
                                    <TabPanel value={tabValue} index={1}>
                                        <Grid item xs={12} sm={12} md={12} lg={12} >
                                            {subleaseData ? (
                                                <Grid item xs={12} sm={12} md={12} lg={12}>
                                                    <>
                                                        <Paper>
                                                            <Steps
                                                                isNextStep={false}
                                                                nextStep={nextStep}
                                                                steps={subleaseSteps}
                                                                currentStep={currentStep}
                                                                setCurrentStep={setCurrentStep}
                                                                isStepEnded={[SUBLEASE_STATUS.completed].includes(subleaseData?.status)}
                                                            />
                                                            {currentStep === 0 && subleaseData && (
                                                                <Productpackage
                                                                    subleaseData={subleaseData}
                                                                    setNextStep={setNextStep}
                                                                    fetchData={fetchData}
                                                                    isIssued={isIssued}
                                                                    renderedFrom={`${renderedFrom}_grid-1`}
                                                                />
                                                            )}
                                                            {(currentStep === 1 || currentStep === 2) && subleaseData && (
                                                                <SerializedAsset
                                                                    fetchData={fetchData}
                                                                    subleaseData={subleaseData}
                                                                    setNextStep={setNextStep}
                                                                    currentStep={currentStep}
                                                                    renderedFrom={`${renderedFrom}_grid-2`}
                                                                />
                                                            )}
                                                        </Paper>
                                                    </>
                                                </Grid>
                                            ) : (
                                                <Grid container spacing={2} style={{ padding: "8px" }}>
                                                    <CommonSkeleton lenArray={[...Array(7).keys()]} />
                                                </Grid>
                                            )}
                                        </Grid>
                                    </TabPanel>
                                    <TabPanel value={tabValue} index={2}>
                                        <Grid item xs={12} sm={12} md={12} lg={12} >
                                            {subleaseData ?
                                                <Tickets
                                                    subleaseId={id}
                                                    renderedFrom={`${renderedFrom}_grid-3`}
                                                />
                                                : (
                                                    <Grid container spacing={2} style={{ padding: "8px" }}>
                                                        <CommonSkeleton lenArray={[...Array(7).keys()]} />
                                                    </Grid>
                                                )
                                            }
                                        </Grid>
                                    </TabPanel>
                                </Paper>
                            </Grid>
                            <Box my={1} />
                        </Grid>
                    </div>
                    <div className="position-relative">
                        <HideWhenOffline>
                            <Paper>
                                {!isSmallScreen && (
                                    <span className={`${showActivity ? 'activityHide' : 'activityShow'} cursor-pointer`} onClick={handleActivityHideShow}>
                                        {showActivity ? <IoIosArrowDropright className="icon" /> : <IoIosArrowDropleft className="icon" />}
                                    </span>
                                )}
                                <div style={{ display: showActivity || (isSmallScreen && tabValue === 0) ? 'block' : 'none' }}>
                                    <Grid container>
                                        <Grid item xs={12}>
                                            {subleaseData && (
                                                <div>
                                                    <Activity
                                                        resourceId={subleaseData._id}
                                                        resource={ACTIVITY_RESOURCE.sublease}
                                                        restrictedAddActivities={
                                                            permissions && permissions[`${ACTIVITY_RESOURCE.sublease}`] && permissions[`${ACTIVITY_RESOURCE.sublease}`].isUpdate ? [] : ['Attachment', 'Case']
                                                        }
                                                        relatedTo={[
                                                            {
                                                                type: ACTIVITY_RESOURCE.sublease,
                                                                referenceId: subleaseData._id,
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
            </Fragment>

            {showConfirmBox && (
                <ConfirmationDialog
                    open={showConfirmBox}
                    message={`Are you sure you want to delete this ${routes.sublease?.title} ?`
                    }
                    onClose={() => {
                        setShowConfirmBox(false);
                    }}
                    onOk={handleDelete}
                />
            )}
            {openUpdateDialog &&
                <ManageSublease
                    isClone={false}
                    subleaseId={id}
                    onClose={() => setOpenUpdateDialog(false)}
                    onSuccess={() => {
                        setOpenUpdateDialog(false);
                        fetchData()
                    }}
                />
            }
        </>
    );
};

export default SubleaseDetailsPage;
