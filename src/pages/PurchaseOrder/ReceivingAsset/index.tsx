
import Box from "@material-ui/core/Box/Box";
import { useState, useEffect, useReducer, useContext } from "react";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import CustomAgGrid, { intialState, reducer } from "src/components/AgGridComponents/CustomAgGrid";
import { Button, Chip, Dialog, IconButton, makeStyles, useMediaQuery } from "@material-ui/core";
import axiosInstance from "src/axios/axiosInstance";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import {
    CustomDialogTransition, dateFormat, defaultActivityShow, gridLoadingTimeout, serializedAsset,
    purchaseOrder, PURCHASE_ORDER_STATUS, CHILD_RESOURCE, prepareDataForGrid
} from "src/constants/helpers";
import { useData } from "src/StateProvider/Provider";
import CreateSerializedAsset from "./CreateSerializedAsset";
import { isMobile, isTablet } from "react-device-detect";
import CustomSwipableList from "src/components/SwipableListComponents/CustomSwipableList";
import routes from "src/components/Helpers/Routes";
import { Link } from "react-router-dom";
import { CreateEmail } from "src/components/Activity/Email/CreateEmail";
import { AiFillFilePdf } from "react-icons/ai";
import { MdAdd, MdEmail } from "react-icons/md";
import CustomAgGridEditable from "src/components/AgGridComponents/CustomAgGridEditable";
import { genrateColoum, getFrameworkComponents } from "src/constants/columns";
import { useHistory } from "react-router-dom";
import HtmlTooltip from "src/components/CustomTooltipTitle";
import { IoMdDownload } from "react-icons/io";
import { fetch_po_product_fields } from '../../../components/PurchaseOrder/helper';
import { CheckboxRenderer } from '../../../components/AgGridComponents/CustomAgGridCellRenderers';

const ReceivingAsset = ({ purchaseOrderData, setCurrentStep, handleUpdateData, statusOptions, handleViewPdf, handleAttachments, renderedFrom }) => {

    const toastConfig = useContext(CustomToastContext);
    const {
        state: { user, permissions }
    }: any = useData();

    const history = useHistory();

    const [showCreateAssetDialog, setShowCreateAssetDialog] = useState(false)
    const [loadingColumns, setLoadingColumns] = useState(false)

    const [sendEmail, setSendEmail] = useState(false);
    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
    const [userEmails, setUserEmails] = useState({ to: [], cc: [] });
    const [generatingPdfFile, setGeneratingFile] = useState(false);
    const [disableCreateAsset, setDisableCreateAsset] = useState(false);
    const [emailButtonLoading, setEmailButtonLoading] = useState(false)
    const [downlodingFile, setDownlodingFile] = useState(false)
    const [pdfFileBase64, setPdfFileBase64] = useState(null);

    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;
    const [gridApi, setGridApi] = useState(null);
    const [frameWorkComponent, setFrameWorkComponent] = useState(null)

    const [columns, setColumns] = useState([])

    const NameRenderer = (params) => (
        <>
            <Link
                className="link"
                title={params.value}
                to={`${routes.productDetail.path}/${params.data.productId}`}
            >
                {params.value}
            </Link>
            <Box padding={1}></Box>
            {(params.data.serializedProduct && params.data.actualReceived !== 0 && params.data.actualReceived !== undefined) &&
                <HtmlTooltip title="Serialized Asset">
                    <span className="d-flex align-items-center gap-2">
                        <Chip label="Asset"
                            size="small"
                            color="primary"
                            onClick={() => history.push(`${routes.serializedAsset.path}`, {
                                productId: params.data?.productId,
                                productName: params.data?.productDescription,
                                pOId: purchaseOrderData?._id,
                                pOName: purchaseOrderData?.purchaseOrderNumber,
                            })}
                        />
                    </span>
                </HtmlTooltip>
            }
        </>
    );

    useEffect(() => {
        fetchColumns()
        fetchProduct()
        fetchEmailsData()
    }, []);

    const fetchColumns = async () => {
        setLoadingColumns(true)
        const productResult = await axiosInstance().get('/field?resource=Product&view=true')
        const productFields = productResult?.data?.data?.filter((e) => ["productName", "productNumber", "serializedProduct"].includes(e?.fieldData?.fieldName));
        productFields?.forEach((e) => {
            if (e?.fieldData?.fieldName === "productName") {
                columns.push({ field: "productName", headerName: e?.fieldData?.fieldLabel, show: true, disabled: true, cellRenderer: "nameRenderer" })
            }
            if (e?.fieldData?.fieldName === "productNumber") {
                columns.push({ field: "productNumber", headerName: e?.fieldData?.fieldLabel, show: true, cellRenderer: "commonRenderer" })
            }
            if (e?.fieldData?.fieldName === "serializedProduct") {
                columns.push({ field: "serializedProduct", headerName: e?.fieldData?.fieldLabel, show: true, cellRenderer: "checkboxRenderer" })
            }
        })
        let fields = await fetch_po_product_fields(purchaseOrderData?.currency);
        let rendererNames = [];
        genrateColoum(fields, columns, rendererNames, false, renderedFrom);
        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true)
        tempFrameworkComponent = {
            nameRenderer: NameRenderer,
            checkboxRenderer: CheckboxRenderer,
            ...tempFrameworkComponent,
        }
        setFrameWorkComponent({ ...tempFrameworkComponent })
        setColumns([...columns])
        setLoadingColumns(false)
    }

    const fetchProduct = () => {
        dispatch({ type: "loading", loading: true });
        axiosInstance().get(`${purchaseOrder.api}/product/${purchaseOrderData._id}`).then(({ data: { data } }) => {
            let rows = data?.map((item) => {
                let finalObject = prepareDataForGrid(item);
                finalObject["isChecked"] = selectedRecords.some(s => s._id === item._id);
                finalObject["allowedToEdit"] = true
                let res: any = {
                    ...finalObject,
                    productDescription: item?.productDetail?.productName,
                    productId: item?.productDetail?._id,
                };
                if (item.qty === item.actualReceived) {
                    res["hideSelection"] = true
                }
                return res;
            });
            if (rows.every(d => d.qty === d.actualReceived)) {
                setDisableCreateAsset(true)
                if (statusOptions.findIndex(d => d.optionLabel === PURCHASE_ORDER_STATUS.readyToInvoice) > statusOptions.findIndex(d => d.optionLabel === purchaseOrderData?.status)) {
                    handleUpdateData({ "status": PURCHASE_ORDER_STATUS.readyToInvoice })
                    setCurrentStep(3)
                }
            }
            dispatch({ type: "initialize", data: rows, count: rows.length });
            setTimeout(() => {
                dispatch({ type: "loading", loading: false });
            }, gridLoadingTimeout);
        }).catch((error) => {
            dispatch({ type: "loading", loading: false });
            toastConfig.setToastConfig(error)
        });

    }

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

    const fetchEmailAttachment = () => {
        axiosInstance().get(`${purchaseOrder.api}/${purchaseOrderData._id}/pdf`)
            .then(({ data }) => {
                axiosInstance()
                    .get(`user/download?fileName=${data.data.fileName}`, {
                        responseType: "blob",
                    })
                    .then(({ data }) => {
                        const file = new Blob([data], { type: 'application/pdf' });
                        generateBase64forFile(file, 'pdf');
                    })
                    .catch((err) => {
                        toastConfig.setToastConfig({
                            open: true,
                            type: 'error',
                            message: 'PDF generating error'
                        });
                    });
            }).catch((err) => {
                toastConfig.setToastConfig(err);
                setDownlodingFile(false);
            })
    }

    const generateBase64forFile = (blobData, type) => {
        let reader = new FileReader();
        reader.readAsDataURL(blobData);
        reader.onloadend = function () {
            let base64data = reader.result;
            if (type === 'pdf') {
                setPdfFileBase64(base64data);
                setSendEmail(true)
                setEmailButtonLoading(false)
            }
        };
    };

    const onSendEmailSuccess = () => {
        setSendEmail(false);
        handleAttachments();
    };

    return (<>
        <Box display="flex" justifyContent="space-between" m={1}>
            <Box display="flex" alignItems="center">
                <Box display="flex">
                    <Button
                        variant={"contained"}
                        color="primary"
                        size="small"
                        style={isMobile && !isTablet ? { color: "var(--secondary)" } : {}}
                        disabled={selectedRecords.length === 0 || disableCreateAsset}
                        onClick={() => { setShowCreateAssetDialog(true) }}
                    >
                        {`Create Asset`}
                    </Button>
                    <Box mx={1} />
                    {permissions?.purchaseOrder?.isRead && !isMobile && (
                        <Button
                            variant={isMobile && !isTablet ? "text" : "outlined"}
                            color="primary"
                            type="button"
                            size="small"
                            style={isMobile && !isTablet ? { color: "var(--info-dark)" } : {}}
                            startIcon={isMobile && !isTablet ? '' : <AiFillFilePdf />}
                            disabled={downlodingFile}
                            onClick={() => { handleViewPdf(false) }}
                        >
                            {isMobile && !isTablet ? <AiFillFilePdf size={18} /> : downlodingFile ? "Please wait..." : "Preview"}
                        </Button>
                    )}
                    <Box mx={1} />
                    {permissions?.purchaseOrder?.isRead && (
                        <Button
                            variant={isMobile && !isTablet ? "text" : "outlined"}
                            color="primary"
                            type="button"
                            size="small"
                            style={isMobile && !isTablet ? { color: "var(--warning-darken)" } : {}}
                            startIcon={isMobile && !isTablet ? '' : <IoMdDownload />}
                            disabled={downlodingFile}
                            onClick={() => { handleViewPdf(true) }}
                        >
                            {isMobile && !isTablet ? <IoMdDownload size={20} /> : downlodingFile ? "Please wait..." : "Download"}
                        </Button>
                    )}
                    <Box mx={1} />
                    {permissions?.purchaseOrder?.isRead && <Button
                        variant={isMobile && !isTablet ? "text" : "outlined"}
                        color="primary"
                        size="small"
                        style={isMobile && !isTablet ? { color: "var(--danger-light)" } : {}}
                        disabled={emailButtonLoading}
                        startIcon={isMobile ? '' : <MdEmail />}
                        onClick={() => {
                            setEmailButtonLoading(true)
                            fetchEmailAttachment()
                        }}
                    >
                        {isMobile && !isTablet ? <MdEmail size={20} /> : `Send Email`}
                    </Button>}
                </Box>
                <Box mx={1} />
            </Box>
        </Box>
        {columns && !loadingColumns ?
            <>
                {columns && frameWorkComponent ?
                    isMobile && !isTablet ? <CustomSwipableList
                        allowSelection={true}
                        allowSwipe={true}
                        permissions={permissions}
                        primaryField={columns?.find(d => d.field === "productDescription")}
                        onClick={(data) => {
                            history.push(`${routes.purchaseOrderDetail.path}/${data.productId}`)
                        }}
                        dataRows={dataRows}
                        selectedRecords={selectedRecords}
                        dispatch={dispatch}
                        onEdit={() => {
                        }}
                        extraParamsToCheckDelete={true}
                        onDelete={() => {
                        }}
                        rowCount={rowCount}
                        page={page}
                        loading={loading}
                        chips={
                            [{
                                label: `Quantity: `,
                                field: "qty",
                                forceShow: true,
                                onClick: (data) => history.push(`${routes.serializedAsset.path}`, {
                                    productId: data?.productId,
                                    productName: data?.productDescription,
                                    pOId: purchaseOrderData?._id,
                                    pOName: purchaseOrderData?.purchaseOrderNumber
                                })
                            }]
                        }
                        onCreate={null}
                        showClone={false}
                        fullHeight={true}
                        renderedFrom={renderedFrom}
                        onClone={() => { }}

                    /> : <CustomAgGridEditable
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
                        allowSelection={true}
                        isClientSideGrid={true}
                        renderedFrom={renderedFrom}
                        onCellValueChanged={(row) => {
                        }}
                        currency={purchaseOrderData?.currency?.toLowerCase()}
                        isFooter={true}
                    />
                    : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>
                }
            </>
            : <Box
                p={2}
                height={500}
                bgcolor="white">
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
        }
        {showCreateAssetDialog &&
            <CreateSerializedAsset
                purchaseOrderID={purchaseOrderData._id}
                onClose={() => setShowCreateAssetDialog(false)}
                onSuccess={() => {
                    setShowCreateAssetDialog(false)
                    dispatch({ type: "initialize", data: [], count: 0 });
                    fetchProduct()
                }}
                title="Create Asset"
                productList={selectedRecords.filter(d => (d.qty !== d.actualReceived))}
                purchaseOrderData={purchaseOrderData}
                handleUpdateData={handleUpdateData}
            />
        }
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
                    refrenceType="purchaseOrder"
                />
            </Dialog>
        )}
    </>
    );
}

export default ReceivingAsset;