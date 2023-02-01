
import Box from "@material-ui/core/Box/Box";
import React, { useState, useEffect, useReducer, useContext } from "react";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import CustomAgGrid, { intialState, reducer } from "src/components/AgGridComponents/CustomAgGrid";
import { CommonRenderer, } from "src/components/AgGridComponents/CustomAgGridCellRenderers";
import Grid from "@material-ui/core/Grid/Grid";
import { Button, Dialog } from "@material-ui/core";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import { CustomDialogTransition, gridLoadingTimeout, purchaseOrder, PURCHASE_ORDER_STATUS } from "src/constants/helpers";
import { useData } from "src/StateProvider/Provider";
import axiosInstance from "src/axios/axiosInstance";
import { CreateEmail } from "src/components/Activity/Email/CreateEmail";
import { isMobile, isTablet } from "react-device-detect";
import routes from "src/components/Helpers/Routes";
import CustomSwipableList from "src/components/SwipableListComponents/CustomSwipableList";
import { getFrameworkComponents, genrateColoum } from "src/constants/columns"
import { prepareDataForGrid } from "src/constants/helpers";
import CustomAgGridEditable from "src/components/AgGridComponents/CustomAgGridEditable";
import { Link } from "react-router-dom";
import { fetch_po_product_fields, fetch_po_cost_fields } from '../../../components/PurchaseOrder/helper';


const IssuPO = ({ purchaseOrderData, handleViewPdf, updateStatus, setCurrentStep, currentStep, handleAttachments, statusOptions, renderedFrom }) => {

    const toastConfig = useContext(CustomToastContext);
    const { state: { user, permissions } }: any = useData();

    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;
    const [columns, setColumns] = useState([
        { field: "type", headerName: "Type", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "productName", headerName: "Product Type", show: true, disabled: true, cellRenderer: "nameRenderer" },
        { field: "productNumber", headerName: "Product Number", show: true, cellRenderer: "commonRenderer" },
        { field: "description", headerName: "Description", show: true, disabled: true, cellRenderer: "commonRenderer" }
    ])

    const [frameWorkComponent, setFrameWorkComponent] = useState(null)

    const NameRenderer = (params) => (
        <Link
            className="link"
            title={params.value}
            to={`${routes.productDetail.path}/${params.data.productId}`}
        >
            {params.value}
        </Link>
    );

    useEffect(() => {
        fetchFields()
    }, []);

    const fetchFields = async () => {
        let fields_product = await fetch_po_product_fields(purchaseOrderData?.currency);
        let fields_service = await fetch_po_cost_fields(purchaseOrderData?.currency);
        const fields = [...fields_product, ...fields_service]
        let rendererNames = [];
        genrateColoum(fields, columns, rendererNames, false, renderedFrom);
        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true)
        tempFrameworkComponent = {
            commonRenderer: CommonRenderer,
            nameRenderer: NameRenderer,
            ...tempFrameworkComponent,
        }
        setFrameWorkComponent({ ...tempFrameworkComponent })
        setColumns([...columns])
    }

    useEffect(() => {
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
                let finalObject = prepareDataForGrid(item);
                let res: any = {
                    ...finalObject,
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
                let finalObject = prepareDataForGrid(item);
                let res: any = {
                    ...finalObject,
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

    return (<>
        {/* <Box display="flex" justifyContent="flex-end" m={1}>
            {statusOptions?.findIndex(d => d.optionLabel === PURCHASE_ORDER_STATUS.issued) >
                statusOptions.findIndex(d => d.optionLabel === purchaseOrderData?.status) &&
                <Box display="flex" justifyContent="flex-end" p="4px">
                    <Box mx={1} />
                    <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => {
                            setCurrentStep(currentStep + 1)
                            updateStatus("Issued")
                        }}
                    >
                        Issue
                    </Button>
                </Box>
            }
        </Box> */}
        <Grid item xs={12} md={12} sm={12} className="mt-3">
            {columns && frameWorkComponent ?
                isMobile && !isTablet && !isTablet ? <CustomSwipableList
                    allowSelection={false}
                    allowSwipe={true}
                    permissions={permissions}
                    primaryField={columns?.find(d => d.field === "type")}
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
                        },
                        {
                            label: `Description: `,
                            field: "description",
                            forceShow: true
                        },
                        {
                            label: `Quantity: `,
                            field: "qty",
                            forceShow: true
                        }]
                    }
                    onCreate={null}
                    showClone={false}
                    fullHeight={true}
                    renderedFrom={renderedFrom}
                    onClone={() => { }}
                /> :
                    <CustomAgGridEditable
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
                        isClientSideGrid={true}
                        renderedFrom={renderedFrom}
                        onCellValueChanged={(row) => {
                        }}
                        fromPurchaseOrderGrid={true}
                        currency={purchaseOrderData?.currency?.toLowerCase()}
                    />
                : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>
            }
        </Grid>
    </>
    );
}

export default IssuPO;