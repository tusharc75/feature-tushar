
import Box from "@material-ui/core/Box/Box";
import { useState, useEffect, useReducer, useContext } from "react";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import CustomAgGrid, { intialState, reducer } from "../../components/AgGridComponents/CustomAgGrid";
import { CommonRenderer, DateRenderer, } from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import Grid from "@material-ui/core/Grid/Grid";
import { Button, Dialog, IconButton } from "@material-ui/core";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { CustomDialogTransition, customerContact, gridLoadingTimeout, purchaseOrder, rentalManagement, sidebarResource } from "../../constants/helpers";
import { useData } from "../../StateProvider/Provider";
import axiosInstance from "../../axios/axiosInstance";
import { CreateEmail } from "../../components/Activity/Email/CreateEmail";
import { isMobile, isTablet } from "react-device-detect";
import { AiFillFilePdf } from "react-icons/ai";


const IssuPO = ({ purchaseOrderProduct, purchaseOrderData, handleViewPdf, handleUpdateData, pdfFileBase64, downlodingFile, setCurrentStep, currentStep, handleAttachments }) => {
    const toastConfig = useContext(CustomToastContext);
    const {
        state: { user, permissions }
    }: any = useData();
    const [sendEmail, setSendEmail] = useState(false);
    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
    const [userEmails, setUserEmails] = useState({ to: [], cc: [] });
    const [generatingPdfFile, setGeneratingFile] = useState(false);


    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;
    const [columns, setColumns] = useState([
        { field: "type", headerName: "Type", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "description", headerName: "Description", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "expectedDelivery", headerName: "Expected Delivery", show: true, disabled: true, cellRenderer: "dateRenderer" },
        { field: "quantity", headerName: "Quantity", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "uom", headerName: "Base UOM", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "price", headerName: "Price", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "tax", headerName: "Tax Percent", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "taxPerUnit", headerName: "Tax Per Unit", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "totalTax", headerName: "Total Tax", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "finalPrice", headerName: "Final Price", show: true, disabled: true, cellRenderer: "commonRenderer" },
    ])


    const frameworkComponents = {
        dateRenderer: DateRenderer,
        commonRenderer: CommonRenderer,
    };

    useEffect(() => {
        fetchEmailsData()
        let tempCombinedData = JSON.parse(JSON.stringify(purchaseOrderProduct))
        dispatch({ type: "loading", loading: true });
        axiosInstance().get(`${purchaseOrder.api}/${purchaseOrderData._id}/service-details`)
            .then(({ data }) => {
                data?.data?.map((u) => tempCombinedData.push({
                    ...u,
                    quantity: u.qty,
                    type: "Service"
                }));
                dispatch({
                    type: "initialize", data: tempCombinedData, count: tempCombinedData.length
                });
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
                    <>
                        <Button
                            variant="outlined"
                            color="primary"
                            type="button"
                            size="small"
                            startIcon={<AiFillFilePdf />}
                            disabled={downlodingFile}
                            onClick={() => { handleViewPdf(false) }}
                        >
                            {downlodingFile ? "Please wait..." : "Preview"}
                        </Button>
                    </>
                )}
                <Box mx={1} />
                {permissions?.purchaseOrder?.isRead && (
                    <>
                        <Button
                            variant="outlined"
                            color="primary"
                            type="button"
                            size="small"
                            startIcon={<AiFillFilePdf />}
                            disabled={downlodingFile}
                            onClick={() => { handleViewPdf(true) }}
                        >
                            {downlodingFile ? "Please wait..." : "Download"}
                        </Button>
                    </>
                )}
                <Box mx={1} />
                {permissions?.purchaseOrder?.isRead && <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => {
                        setSendEmail(true)
                    }
                    }
                >
                    {`Send Email`}
                </Button>
                }
            </Box>
            <Box display="flex" justifyContent="flex-end" p="4px">
                <Box mx={1} />
                <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => {
                        setCurrentStep(currentStep + 1)
                        handleUpdateData({ "status": "Issued" })
                    }
                    }
                >
                    {`Issue PO`}
                </Button>
            </Box>
        </Box>

        <Grid item xs={12} md={12} sm={12} className="mt-3">

            {columns ?
                <CustomAgGrid
                    columns={columns}
                    dataRows={dataRows}
                    frameworkComponents={frameworkComponents}
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