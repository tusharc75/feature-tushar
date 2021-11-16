
import Box from "@material-ui/core/Box/Box";
import { useState, useEffect, useReducer, useContext } from "react";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import CustomAgGrid, { intialState, reducer } from "../../components/AgGridComponents/CustomAgGrid";
import { CommonRenderer, DateRenderer, } from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import { Link } from 'react-router-dom'
import routes from "../../components/Helpers/Routes";
import Grid from "@material-ui/core/Grid/Grid";
import { Button, IconButton, useMediaQuery } from "@material-ui/core";
import { AiFillFilePdf } from "react-icons/ai";
import axiosInstance from "../../axios/axiosInstance";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import NoDataCell from "../../components/Helpers/NoDataCell";
import { dateFormat, defaultActivityShow, gridLoadingTimeout, purchaseOrder, rentalManagement } from "../../constants/helpers";
import BulkEditDialog from "./BulkEditDialog";
import GridDeleteIcon from "../../components/Helpers/GridDeleteIcon";
import HtmlTooltip from "../../components/CustomTooltipTitle";
import EditIcon from "@material-ui/icons/Edit";
import { useData } from "../../StateProvider/Provider";
import moment from "moment";
import { startCase } from "lodash";
import CreateSeriaizedAsset from "./CreateSerializedAsset";
import CustomReactTable from "../../components/CustomReactTable/CustomReactTable";

const ReceivingAsset = ({ currencySymbol, purchaseOrderData, purchaseOrderProduct, handleUpdateData }) => {
    const toastConfig = useContext(CustomToastContext);
    const {
        state: { user, permissions }
    }: any = useData();

    const [showCreateAssetDialog, setShowCreateAssetDialog] = useState(false)
    const isSmallScreen = useMediaQuery('(max-width:1300px)');
    const isTabletScreen = useMediaQuery('(max-width:960px)');
    const [showActivity, setActivityShow] = useState(defaultActivityShow);
    const [selectedProducts, setSelectedProducts] = useState([])

    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;

    const columns = [
        {
            accessor: 'productName',
            Header: 'Product Description',
            Cell: ({ row }) => (
                row.original.productName ? <p className="text-truncate">
                    {/* {rowData.type === "productInPackage"
              ? rowData.pkgQty !== 0 ? `${rowData.pkgQty} * ${rowData.qty} = ${rowData.totalQty}` : rowData.qty
              : rowData.qty} */}
                    {row.original.productName}
                </p> : <NoDataCell />
            )
        },
        {
            accessor: 'productNumber',
            Header: 'Product Description',
            Cell: ({ row }) => (
                row.original.productNumber ? <p className="text-truncate">
                    {/* {rowData.type === "productInPackage"
                ? rowData.pkgQty !== 0 ? `${rowData.pkgQty} * ${rowData.qty} = ${rowData.totalQty}` : rowData.qty
                : rowData.qty} */}
                    {row.original.productNumber}
                </p> : <NoDataCell />
            )
        },
        {
            accessor: 'expectedDelivery',
            Header: 'Expected Delivery',
            Cell: ({ row }) => (
                row.original.expectedDelivery ? <h5 className="createBy text-truncate" title={`${moment(row.original.expectedDelivery.slice(0, 10)).format(dateFormat)}`}>
                    <span className="">{moment(row.original.expectedDelivery.slice(0, 10)).format("MM/DD/YYYY")}</span>
                </h5> : <NoDataCell />
            )
        },
        {
            accessor: 'quantity',
            Header: 'Quantity',
            Cell: ({ row }) => (
                row.original.quantity ? <p className="text-truncate">
                    {row.original.quantity}
                </p> : <NoDataCell />
            )
        },
        {
            accessor: 'actualReceived',
            Header: 'Actual Received',
            Cell: ({ row }) => (
                row.original.actualReceived ? <p className="text-truncate">
                    {row.original.actualReceived}
                </p> : <NoDataCell />
            )
        },

        {
            accessor: 'baseUOM',
            Header: 'Base UOM',
            Cell: ({ row }) => (
                row.original.baseUOM ? <p>{startCase(row.original.baseUOM)}</p> : <NoDataCell />
            )
        },
        {
            accessor: 'price',
            Header: `Price (${currencySymbol})`,
            Cell: ({ row }) => (
                <p>{row.original.price ? row.original.price : "0"} </p>
            )
        },
        {
            accessor: 'tax',
            Header: 'Tax (%)',
            Cell: ({ row }) => (
                <p>{row.original.tax === 0 ? "0" : row.original.tax}</p>
            )
        },
        {
            accessor: 'taxPerUnit',
            Header: 'Tax Per Unit',
            Cell: ({ row }) => (
                <p>{row.original.taxPerUnit === 0 ? "0" : row.original.taxPerUnit}</p>
            )
        },
        {
            accessor: 'totalTax',
            Header: 'Total Tax',
            Cell: ({ row }) => (
                <p>{row.original.totalTax === 0 ? "0" : row.original.totalTax}</p>
            )
        },
        {
            accessor: 'finalPrice',
            Header: `Final Price (${currencySymbol})`,
            Cell: ({ row }) => (
                <p>{row.original.finalPrice}</p>
            )
        }
    ]

    useEffect(() => {
        dispatch({ type: "loading", loading: true });
        axiosInstance().get(`${purchaseOrder.api}/${purchaseOrderData._id}/service-details`)
            .then(({ data }) => {
                // data.data = data.data.map((u) => tempCombinedData.push({
                //     ...u,
                //     quantity: u.qty,
                //     type: "service"
                // }));
                dispatch({
                    type: "initialize", data: data.data, count: data.data.length
                });
                setTimeout(() => {
                    dispatch({ type: "loading", loading: false });
                }, gridLoadingTimeout);
            }).catch((error) => {
                dispatch({ type: "loading", loading: false });
                toastConfig.setToastConfig(error)
            });
    }, []);



    return (<>
        <Box display="flex" justifyContent="space-between" m={1}>
            <Box display="flex">
                <Box mx={1} />
                <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    disabled={selectedRecords.length === 0}
                    onClick={() => { setShowCreateAssetDialog(true) }}
                >
                    {`Create Asset`}
                </Button>
            </Box>
        </Box>
        {columns ?
            <>
                <Box
                    p="6px"
                    zIndex={5}
                    width={
                        isTabletScreen
                            ? "calc(100vw - 20px)"
                            : isSmallScreen
                                ? "calc(100vw - 78px)"
                                : showActivity ? "100%" : "calc(100vw - 100px)"
                    }
                    height={"calc(100vh - 330px)"}
                >
                    <CustomReactTable
                        columns={columns}
                        data={dataRows}
                        rowStyle={(rowData) => ({
                            color: "black",
                            backgroundColor: rowData?.type?.includes("roduct") && (isNaN(rowData?.finalPrice) || rowData?.finalPrice === 0) ? "#EFCCCC" : "white"
                        })}
                        onSelect={setSelectedProducts}
                        childrenProperty="subRows"
                        uniqueKey="_id"
                    />
                </Box>

            </>
            : <Box
                p={2}
                height={500}
                bgcolor="white">
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
        }
        {showCreateAssetDialog &&
            <CreateSeriaizedAsset
                purchaseOrderID={purchaseOrderData._id}
                onClose={() => setShowCreateAssetDialog(false)}
                onSuccess={() => {
                    setShowCreateAssetDialog(false)
                    handleUpdateData({ status: "Received" })
                }}
                title="Create Asset"
                productList={selectedRecords}
            />
        }
    </>
    );
}

export default ReceivingAsset;