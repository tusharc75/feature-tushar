
import Box from "@material-ui/core/Box/Box";
import React, { useState, useEffect, useReducer, useContext } from "react";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import CustomAgGrid, { intialState, reducer } from "../../../components/AgGridComponents/CustomAgGrid";
import { CommonRenderer, DateRenderer, } from "../../../components/AgGridComponents/CustomAgGridCellRenderers";
import Grid from "@material-ui/core/Grid/Grid";
import { Button, Dialog, IconButton } from "@material-ui/core";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import { CustomDialogTransition, customerContact, gridLoadingTimeout, purchaseOrder, rentalManagement, sidebarResource } from "../../../constants/helpers";
import { useData } from "../../../StateProvider/Provider";
import axiosInstance from "../../../axios/axiosInstance";
import { CreateEmail } from "../../../components/Activity/Email/CreateEmail";
import { isMobile, isTablet } from "react-device-detect";
import { AiFillFilePdf } from "react-icons/ai";
import routes from "../../../components/Helpers/Routes";
import CustomSwipableList from "../../../components/SwipableListComponents/CustomSwipableList";
import { BiPurchaseTagAlt, MdEmail } from "react-icons/all";
import { CURReplaceByCurrencySingle } from "../../../constants/formulaUtility";
import { getColumnData, getStaticFields, getFrameworkComponents, genrateColoum } from "../../../constants/columns"
import { prepareDataForGrid } from "../../../constants/helpers";


const IssuPO = ({ purchaseOrderData, handleViewPdf, handleUpdateData, pdfFileBase64, downlodingFile, setCurrentStep, currentStep, handleAttachments }) => {

    const toastConfig = useContext(CustomToastContext);
    const { state: { user, permissions } }: any = useData();

    const [sendEmail, setSendEmail] = useState(false);
    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
    const [userEmails, setUserEmails] = useState({ to: [], cc: [] });
    const [generatingPdfFile, setGeneratingFile] = useState(false);

    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;
    const [columns, setColumns] = useState([
        { field: "type", headerName: "Type", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "productName", headerName: "Product Description", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "productNumber", headerName: "Product Number", show: true, cellRenderer: "commonRenderer" },
        { field: "description", headerName: "Description", show: true, disabled: true, cellRenderer: "commonRenderer" }
    ])
    const [frameWorkComponent, setFrameWorkComponent] = useState(null)

    useEffect(() => {
        axiosInstance().get("/field/child?resource=Purchase Order Product").then(({ data: { data } }) => {
            let fields = CURReplaceByCurrencySingle(data, purchaseOrderData.currency)
            axiosInstance().get("/field/child?resource=Purchase Order Service").then(({ data: { data } }) => {
                fields = [...fields, ...CURReplaceByCurrencySingle(data, purchaseOrderData.currency)]
                let rendererNames = [];
                genrateColoum(fields, columns, rendererNames, false);
                let tempFrameworkComponent = getFrameworkComponents(rendererNames, true)
                tempFrameworkComponent = {
                    commonRenderer: CommonRenderer,
                    ...tempFrameworkComponent,
                }
                setFrameWorkComponent({ ...tempFrameworkComponent })
                setColumns([...columns])
            })
        })
    }, []);

    useEffect(() => {
        fetchEmailsData()
        dispatch({ type: "loading", loading: true });
        let productData = []
        let serviceData = []
        let productServiceData = []
        axiosInstance().get(`${purchaseOrder.api}/product/${purchaseOrderData._id}`).then(({ data: { data } }) => {
            productData = data;
            productData.forEach((e) => {
                e.type = "Product";
                e.productName = e.productDetail?.productName
                e.productNumber = e.productDetail?.productNumber
            })
            productServiceData = [...productData, ...serviceData];
            let rows = productServiceData?.map((item) => {
                let res: any = {
                    ...prepareDataForGrid(item),
                };
                return res;
            });
            dispatch({ type: "initialize", data: rows, count: rows.length });
        }).catch((error) => {
            dispatch({ type: "loading", loading: false });
            toastConfig.setToastConfig(error)
        });
        axiosInstance().get(`${purchaseOrder.api}/service/${purchaseOrderData._id}`).then(({ data: { data } }) => {
            data.forEach((e) => {
                if (!e.type) {
                    e.type = "Service";
                }
            })
            serviceData = data
            productServiceData = [...productData, ...serviceData];
            let rows = productServiceData?.map((item) => {
                let res: any = {
                    ...prepareDataForGrid(item),
                };
                return res;
            });
            dispatch({ type: "initialize", data: rows, count: rows.length });
            setTimeout(() => {
                dispatch({ type: "loading", loading: false });
            }, gridLoadingTimeout);
        }).catch((error) => {
            dispatch({ type: "loading", loading: false });
            toastConfig.setToastConfig(error)
        });
    }, []);

    const fetchEmailsData = () => {
        let ownerCollaboratorEmails = [];
        if (purchaseOrderData?.collaborator && purchaseOrderData.collaborator.length) {
            ownerCollaboratorEmails = purchaseOrderData.collaborator.filter((o) => o?.email).map((o) => o?.email);
        }
        if (purchaseOrderData?.owner?.email) {
            ownerCollaboratorEmails.push(purchaseOrderData.owner.email);
        }
        let toEmails = [];
        if (purchaseOrderData?.supplier?.email) {
            toEmails.push(purchaseOrderData.supplier.email);
        }
        setUserEmails({ cc: [...ownerCollaboratorEmails], to: [...toEmails] });
    }

    let attachments = [];
    if (pdfFileBase64) {
        attachments.push({
            base64: pdfFileBase64.substring(parseInt(pdfFileBase64.indexOf(',') + 1)),
            contentType: pdfFileBase64.split(';')[0].split(':')[1],
            name: `Purchase Order-${purchaseOrderData.purchaseOrderNumber}`
        });
    }

    const onSendEmailSuccess = () => {
        setSendEmail(false);
        handleAttachments();
    };

    return (<>
        <Box display="flex" justifyContent="space-between" m={1}>
            <Box display="flex">
                {permissions?.purchaseOrder?.isRead && (
                    <Button
                        variant="outlined"
                        color="primary"
                        type="button"
                        size="small"
                        startIcon={isMobile ? '' : <AiFillFilePdf />}
                        disabled={downlodingFile}
                        onClick={() => { handleViewPdf(false) }}
                    >
                        {isMobile ? <AiFillFilePdf size={22} /> : downlodingFile ? "Please wait..." : "Preview"}
                    </Button>
                )}
                <Box mx={1} />
                {permissions?.purchaseOrder?.isRead && (
                    <Button
                        variant="outlined"
                        color="primary"
                        type="button"
                        size="small"
                        startIcon={isMobile ? '' : <AiFillFilePdf />}
                        disabled={downlodingFile}
                        onClick={() => { handleViewPdf(true) }}
                    >
                        {isMobile ? <AiFillFilePdf size={22} /> : downlodingFile ? "Please wait..." : "Download"}
                    </Button>
                )}
                <Box mx={1} />
                {permissions?.purchaseOrder?.isRead && <Button
                    variant={isMobile ? "outlined" : "contained"}
                    color="primary"
                    size="small"
                    onClick={() => {
                        setSendEmail(true)
                    }}
                >
                    {isMobile ? <MdEmail size={22} /> : `Send Email`}
                </Button>}
            </Box>
            <Box display="flex" justifyContent="flex-end" p="4px">
                <Box mx={1} />
                <Button
                    variant={isMobile ? "outlined" : "contained"}
                    color="primary"
                    size="small"
                    onClick={() => {
                        setCurrentStep(currentStep + 1)
                        handleUpdateData({ "status": "Issued" })
                    }}
                >
                    {isMobile ? <BiPurchaseTagAlt size={22} /> : `Issue PO`}
                </Button>
            </Box>
        </Box>
        <Grid item xs={12} md={12} sm={12} className="mt-3">
            {columns && frameWorkComponent ?
                isMobile ? <CustomSwipableList
                    allowSelection={true}
                    allowSwipe={true}
                    permissions={permissions}
                    primaryField={columns?.find(d => d.field === "description")}
                    onClick={() => {
                    }}
                    dataRows={dataRows}
                    selectedRecords={selectedRecords}
                    dispatch={dispatch}
                    onEdit={() => {
                    }}
                    extraParamsToCheckDelete={true}
                    onDelete={() => { }}
                    rowCount={rowCount}
                    page={page}
                    loading={loading}
                    chips={
                        [{
                            label: `Product Description: `,
                            field: "productName",
                            forceShow: true
                        }]
                    }
                    onCreate={null}
                    showClone={false}
                    fullHeight={true}
                    renderedFrom={routes.purchaseOrderDetail.title}
                    onClone={() => { }}
                /> :
                    <CustomAgGrid
                        columns={columns}
                        dataRows={dataRows}
                        frameworkComponents={frameWorkComponent}
                        setGridApi={setGridApi}
                        dispatch={dispatch}
                        rowCount={rowCount}
                        limit={limit}
                        pageSizes={pageSizes}
                        page={page}
                        allowAction={false}
                        loading={loading}
                        allowSelection={false}
                        renderedFrom="purchaseOrderDetailsPageService"
                    />
                : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>
            }
        </Grid>
        {sendEmail && (
            <Dialog
                open={sendEmail}
                fullScreen={fullScreen || isMobile || isTablet}
                TransitionComponent={CustomDialogTransition}
                aria-labelledby="customized-dialog-title"
                maxWidth="md"
                onClose={() => {
                    setSendEmail(false);
                    setFullScreen(false);
                }}
                fullWidth
            >
                <CreateEmail
                    generatingFile={generatingPdfFile}
                    handleClose={() => {
                        setSendEmail(false);
                        setFullScreen(false);
                    }}
                    fetchData={onSendEmailSuccess}
                    id={purchaseOrderData._id}
                    showESign={true}
                    isQuoteBuilder={true}
                    options={userEmails?.to}
                    cc={userEmails?.cc ?? []}
                    emailId={null}
                    qouteBuilderAttachments={attachments}
                    subject={`${user?.user?.brandName ?? 'Brand'} Offer - ${purchaseOrderData?.purchaseOrderId ?? ''}`}
                    fromQuote={true}
                    isMinimized={!fullScreen}
                    onMinimizeMaximize={() => {
                        setFullScreen((prevState) => !prevState);
                    }}
                    showManimizeMaximize={true}
                    fromPurchaseOrder={true}
                />
            </Dialog>
        )}
    </>
    );
}

export default IssuPO;