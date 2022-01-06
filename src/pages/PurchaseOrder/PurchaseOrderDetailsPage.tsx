import React, { useState, useEffect, useContext, Fragment, useReducer } from "react";
import { Grid, Box, Button, Paper, Typography, IconButton, Tab, Tabs, ButtonGroup, Container, InputAdornment, TextField } from "@material-ui/core";
import { Autocomplete, Skeleton } from "@material-ui/lab";
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
import {
    purchaseOrder,
    getObjKeysWithValues,
    gridLoadingTimeout,
    product,
    RESOURCE_LABEL,
    getUniqueCurrencies,
    supplierAccount,
    customerAccount,
    dateFormat,
    quoteStepColors
} from "../../constants/helpers";
import ManagePurchaseOrder from "./ManagePurchaseOrder";
import ExpandMore from '@material-ui/icons/ExpandMore';
import MenuItem from "@material-ui/core/MenuItem"
import Menu from "@material-ui/core/Menu"
import Steps from "./Steps";
import { FaCartArrowDown, FaCartPlus, FaSuitcase, FaWpforms } from "react-icons/fa";
import { BiEdit, BiFoodMenu } from "react-icons/bi";
import TabPanel from "../../components/TabPanel";
import queryString from 'query-string';
import { isMobile } from "react-device-detect";
import Product from "./Product";
import Service from "./Service";
import IssuePo from "./IssuePo";
import ReceivingAsset from "./ReceivingAsset";
import { GrStatusGood, GrStatusInfo } from "react-icons/all";
import accountClass from "../Account/account.module.scss";

const storedRoutes = localStorage.getItem("routes") ? JSON.parse(localStorage.getItem("routes")) : null;

const purchaseOrderSteps = ["Add Product", "Ad hoc Charges", "Issue PO", "Receiving Asset", "Ready to Invoice"]

const PurchaseOrderDetailsPage = () => {
    const toastConfig = useContext(CustomToastContext);
    const { id } = useParams();
    const history = useHistory();
    const parsed = queryString.parse(history.location.search);
    const { openEdit } = parsed;
    const {
        state: { user, permissions }
    }: any = useData();
    const [headingLbl, setHeadingLbl] = useState("");
    const [loadingPurchaseOrder, setLoadingPurchaseOrder] = useState(false);
    const [purchaseOrderData, setPurchaseOrderData] = useState(null);
    const [showConfirmBox, setShowConfirmBox] = useState(false);
    const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
    const [purchaseOrderFields, setPurchaseOrderFields] = useState([]);
    const [mainPoints, setMainPoints] = useState(null);
    const [customizedRoutes, setCustomizedRoutes] = useState([]);
    const [currencySymbol, setCurrencySymbol] = useState(null);
    const [updateLoading, setUpdateLoading] = useState(false)
    const [statusOptions, setStatusOptions] = useState([])
    const [purchaseOrderProduct, setPurchaseOrderProduct] = useState([])
    const [allowedToEdit, setAllowedToEdit] = useState(false);
    const [currentStepDisable, setCurrentStepDisable] = useState(false)
    const [currentStep, setCurrentStep] = useState(0);
    const [downlodingFile, setDownlodingFile] = useState(false)
    const [anchorEl, setAnchorEl] = useState(null);

    const [tabValue, setTabValue] = useState(Number(parsed?.tab || 0));

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
        if (parsed) {
            history.replace(`?tab=${tabValue}`);
        }
    }, []);

    useEffect(() => {
        if (id) {
            getPurchaseOrderFields();
            fetchPurchaseOrderData();
        }
    }, [id]);

    useEffect(() => {
        if (currentStep > -1 && purchaseOrderData && purchaseOrderData?.processStatus !== purchaseOrderSteps[currentStep]) {
            axiosInstance().put(`${purchaseOrder.api}/${id}/process-status`, { "processStatus": purchaseOrderSteps[currentStep] }).then(({ data }) => {
                fetchPurchaseOrderData()
            }).catch((error) => {
                toastConfig.setToastConfig(error);
            });
        }
        if (currentStep === 1 || currentStep === 2) { handleUpdateData({ "status": "In Process" }) }
        if (currentStep === 3) { handleUpdateData({ "status": "Issued" }) }

    }, [currentStep]);

    const handleMainPoints = (data) => {
        let mainPoint = {};
        // mainPoint['Account Name'] = data?.accountName?.optionLabel || '';
        setMainPoints(mainPoint);
    };

    const fetchPurchaseOrderData = async () => {
        setLoadingPurchaseOrder(true);
        try {
            const {
                data: { data },
            } = await axiosInstance().get(`${purchaseOrder.api}/${id}`);

            const isAllowedToEdit = [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id);
            setAllowedToEdit(isAllowedToEdit);

            handleMainPoints(data);
            setHeadingLbl(`${data?.purchaseOrderNumber ?? ''} ${data?.product?.optionLabel ? '-' + data?.product?.optionLabel : ""}`);
            setCustomizedRoutes([routes.purchaseOrder,
            { title: `${data?.purchaseOrderNumber ?? ''} ${data?.product?.optionLabel ? '-' + data?.product?.optionLabel : ""}` }]);
            setPurchaseOrderData(data);
            setCurrentStep(purchaseOrderSteps.indexOf(data?.processStatus) !== -1 ? purchaseOrderSteps.indexOf(data?.processStatus) : 0)
            if (data?.status === "Ready to Invoice" || data?.status === "Invoiced" || data?.status === "Closed") {
                setCurrentStepDisable(true)
            }
            setCurrencySymbol(
                getUniqueCurrencies().find(
                    (d) => d.currencyCode === data["currency"]
                )?.symbolNative
            );

            if (isAllowedToEdit && openEdit === 'true') {
                setOpenUpdateDialog(true);
                const params = new URLSearchParams();
                params.delete('openEdit');
                history.push({ search: params.toString() });
            }

            setLoadingPurchaseOrder(false);
        } catch (error) {
            toastConfig.setToastConfig(error);
        }
    };

    const getPurchaseOrderFields = () => {
        axiosInstance()
            .get("/field?resource=Purchase Order")
            .then(({ data }) => {
                setPurchaseOrderFields(data.data);
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

    const handleOpenUpdateDialog = () => {
        setOpenUpdateDialog(true);
    };

    const handleDelete = () => {
        axiosInstance().put(`${purchaseOrder.api}/remove`, { "ids": [] }).then(() => {
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

    const handleStatusChange = o => {
        handleUpdateData({ status: o.optionValue })
    }

    const handleUpdateData = (obj) => {
        if (obj.status && purchaseOrderData?.status !== obj.status && purchaseOrderFields.length > 0) {
            const fieldsDataForUpdate = purchaseOrderFields.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
            let values = getObjKeysWithValues(purchaseOrderData, fieldsDataForUpdate)
            values["status"] = obj.status
            // if (obj.reason) values["scrapingReason"] = obj.reason
            values["_id"] = id
            axiosInstance().put(`${purchaseOrder.api}`, values).then(({ data: { data } }) => {
                getPurchaseOrderFields();
                fetchPurchaseOrderData();
                toastConfig.setToastConfig({
                    open: true,
                    type: 'success',
                    message: `Status changed to ${obj.status}`
                });
            }).catch((error) => {
                toastConfig.setToastConfig(error);
            });
        }
    }

    const handleViewPdf = (download) => {
        axiosInstance().get(`${purchaseOrder.api}/${id}/pdf`)
            .then(({ data }) => {
                axiosInstance()
                    .get(`user/download?fileName=${data.data.fileName}`, {
                        responseType: "blob",
                    })
                    .then(({ data }) => {
                        if (download) {
                            const url = window.URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
                            const link = document.createElement('a');
                            link.href = url;
                            link.setAttribute('download', `PurchaseOrder-${purchaseOrderData.purchaseOrderNumber}.pdf`);
                            document.body.appendChild(link);
                            link.click();
                        }
                        else {
                            const file = new Blob([data], { type: "application/pdf" });
                            const fileURL = URL.createObjectURL(file);
                            const pdfWindow = window.open();
                            pdfWindow.location.href = fileURL;
                            toastConfig.setToastConfig({ open: true, type: "success", message: "Preview file downloaded successfully." })

                        }
                        setDownlodingFile(false);
                    })
                    .catch((err) => {
                        toastConfig.setToastConfig(err);
                        setDownlodingFile(false);
                    });
            }).catch((err) => {
                toastConfig.setToastConfig(err);
                setDownlodingFile(false);
            })
    }



    const handleAttachments = () => {
        let request;

        request = {
            name: 'Purchase Order',
            fileUrl: '',
            relatedTo: [
                {
                    type: purchaseOrder.resource,
                    referenceId: purchaseOrderData?._id,
                    access: true
                },
                {
                    type: purchaseOrderData?.customerAccountName ? customerAccount?.accountResource : supplierAccount?.accountResource,
                    referenceId: purchaseOrderData?.customerAccountName ? purchaseOrderData?.customerAccountName?.optionValue : purchaseOrderData?.supplierAccountName?.optionValue,
                    access: false
                },
            ]
        };

    };

    return (
        <>
            <Fragment>
                <Grid container className="headerbox">
                    <CustomBreadCrumbs routes={customizedRoutes} />
                </Grid>
                <Grid container spacing={1} className="detail-container">
                    <Grid item xs={12} sm={12} spacing={2}>
                        <Paper style={{ height: "650px" }}>
                            {!purchaseOrderData ? (
                                <div>
                                    <Skeleton variant="text" width="150px" height="40px" />
                                    <Box display="flex">
                                        <Skeleton
                                            style={{ borderRadius: 6 }}
                                            width="120px"
                                            height="80px"
                                        />
                                        <Box marginX={1} />
                                        <Skeleton
                                            style={{ borderRadius: 6 }}
                                            width="120px"
                                            height="80px"
                                        />
                                    </Box>
                                </div>
                            ) : (
                                <DetailsPageHeader
                                    heading={headingLbl}
                                    mainPoints={mainPoints}
                                    showHeading={true}
                                >
                                    {permissions?.purchaseOrder?.isUpdate && (purchaseOrderData?.status !== "Ready to Invoice" && purchaseOrderData?.status !== "Invoiced" && purchaseOrderData?.status !== "Closed") && (
                                        <>
                                            <Button
                                                variant={isMobile ? "text" : "contained"}
                                                color="primary"
                                                size="small"
                                                onClick={handleOpenUpdateDialog}
                                                className={isMobile ? accountClass.mobile_button_layout : ""}
                                                style={isMobile ? { color: "#43aeaa" } : {}}
                                            >
                                                {isMobile ? <BiEdit size={20} /> : "Edit"}
                                            </Button>
                                        </>
                                    )}
                                    {permissions?.purchaseOrder?.isUpdate && (purchaseOrderData?.status === "Ready to Invoice" || purchaseOrderData?.status === "Invoiced" || purchaseOrderData?.status === "Closed") && (
                                        <>
                                            <Button
                                                variant={isMobile ? "text" : "contained"}
                                                color="default"
                                                size="small"
                                                onClick={openActions}
                                                disabled={updateLoading}
                                                aria-controls="action-menu"
                                                endIcon={isMobile ? <ExpandMore style={{ width: "12px", height: "12px" }} /> : <ExpandMore />}
                                            >
                                                {isMobile ? <GrStatusGood size={18} style={{ color: "var(--warning-darken)" }} /> : "Change Status"}
                                            </Button>
                                            <Menu
                                                anchorEl={anchorEl}
                                                keepMounted
                                                getContentAnchorEl={null}
                                                anchorOrigin={{
                                                    vertical: 'bottom',
                                                    horizontal: 'left'
                                                }}
                                                id="action-menu"
                                                open={Boolean(anchorEl)}
                                                onClose={closeActions}>
                                                {
                                                    statusOptions.map((o, index) => {
                                                        return <MenuItem
                                                            disabled={index <= statusOptions.findIndex(d => d.optionLabel === "Ready to Invoice")}
                                                            onClick={() => {
                                                                closeActions()
                                                                handleStatusChange(o)
                                                            }}
                                                            value={o}>{o?.optionLabel}</MenuItem>
                                                    })
                                                }
                                            </Menu>
                                        </>
                                    )}

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
                                {/* <Tab
                        className={"tabLayout"}
                      style={{
                        background: tabValue === 0 ? "white" : "",
                        color: tabValue === 0 ? "blue" : "#163340",
                      }}
                      label={
                        <div className="d-flex align-items-center tab-font ">
                          <InfoIcon className="mr-1" fontSize="inherit" /> All
                          Version Status
                        </div>
                      }
                      {...a11yProps(0)}
                    /> */}
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
                                        color: tabValue === 2 ? 'blue' : '#163340'
                                    }}
                                    label={
                                        <div className="d-flex align-items-center tab-font">
                                            <BiFoodMenu className="mr-1" fontSize="inherit" /> Details
                                        </div>
                                    }
                                    {...a11yProps(1)}
                                />
                                <div className={'uio'}> </div>
                            </Tabs>

                            <TabPanel value={tabValue} index={0}>
                                <Box>
                                    {loadingPurchaseOrder || !purchaseOrderFields.length ? (
                                        <Grid container spacing={2} style={{ padding: "8px" }}>
                                            <CommonSkeleton lenArray={[...Array(7).keys()]} />
                                        </Grid>
                                    ) : (
                                        <>
                                            <DetailsPage data={purchaseOrderData}
                                                fields={purchaseOrderFields} />
                                        </>
                                    )}
                                </Box>
                                <Grid container spacing={2}>
                                </Grid>
                            </TabPanel>
                            <TabPanel value={tabValue} index={1}>
                                <Grid item xs={12} sm={12} md={12} lg={12} >
                                    {!purchaseOrderData || !purchaseOrderFields.length ? (
                                        <Grid container spacing={2} style={{ padding: "8px" }}>
                                            <CommonSkeleton lenArray={[...Array(7).keys()]} />
                                        </Grid>
                                    ) : (
                                        <Grid item xs={12} sm={12} md={12} lg={12}>
                                            <>
                                                <Paper>
                                                    <Steps
                                                        // className={styles.steps_box}
                                                        currentStepDisable={currentStepDisable}
                                                        steps={purchaseOrderSteps.slice(0, 4)}
                                                        currentStep={currentStep}
                                                        setCurrentStep={setCurrentStep}
                                                    />
                                                    {currentStep === 0 &&
                                                        <Product
                                                            purchaseOrderData={purchaseOrderData}
                                                            currentStepDisable={currentStepDisable}
                                                            setCurrentStepDisable={setCurrentStepDisable}
                                                            id={id}
                                                            setPurchaseOrderProduct={setPurchaseOrderProduct}
                                                        />
                                                    }
                                                    {(currentStep === 1) && (
                                                        <Service
                                                            purchaseOrderData={purchaseOrderData}
                                                            id={id}
                                                        />
                                                    )}
                                                    {currentStep === 2 &&
                                                        <IssuePo
                                                            purchaseOrderData={purchaseOrderData}
                                                            handleViewPdf={handleViewPdf}
                                                            handleUpdateData={handleUpdateData}
                                                            setCurrentStep={setCurrentStep}
                                                            currentStep={currentStep}
                                                            handleAttachments={handleAttachments}
                                                        />
                                                    }
                                                    {(currentStep === 3 || currentStep === 4) &&
                                                        <ReceivingAsset
                                                            currencySymbol={currencySymbol}
                                                            purchaseOrderData={purchaseOrderData}
                                                            setCurrentStep={setCurrentStep}
                                                            handleUpdateData={handleUpdateData}
                                                            statusOptions={statusOptions}
                                                            handleViewPdf={handleViewPdf}
                                                            handleAttachments={handleAttachments}
                                                        />
                                                    }
                                                </Paper>
                                            </>
                                        </Grid>
                                    )}

                                </Grid>
                            </TabPanel>
                        </Paper>
                    </Grid>
                    <Box my={1} />
                </Grid>
            </Fragment>
            {showConfirmBox && (
                <ConfirmationDialog
                    open={showConfirmBox}
                    message={`Are you sure you want to delete this ${storedRoutes ? storedRoutes.purchaseOrder?.title : RESOURCE_LABEL.purchaseOrder} ?`
                    }
                    onClose={() => {
                        setShowConfirmBox(false);
                    }}
                    onOk={handleDelete}
                />
            )}
            {openUpdateDialog &&
                <ManagePurchaseOrder
                    isClone={false}
                    purchaseOrderId={id}
                    onClose={() => setOpenUpdateDialog(false)}
                    onSuccess={() => {
                        setOpenUpdateDialog(false);
                        fetchPurchaseOrderData()
                    }}
                    currencyDisable={Boolean(purchaseOrderProduct.length > 0) || Boolean(currentStep > 0)}
                />
            }
        </>
    );
};

export default PurchaseOrderDetailsPage;
