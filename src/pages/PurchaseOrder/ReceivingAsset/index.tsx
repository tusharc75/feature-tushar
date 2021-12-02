
import Box from "@material-ui/core/Box/Box";
import { useState, useEffect, useReducer, useContext } from "react";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import CustomAgGrid, { intialState, reducer } from "../../../components/AgGridComponents/CustomAgGrid";
import { Button, Chip, IconButton, makeStyles, useMediaQuery } from "@material-ui/core";
import axiosInstance from "../../../axios/axiosInstance";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import NoDataCell from "../../../components/Helpers/NoDataCell";
import { dateFormat, defaultActivityShow, gridLoadingTimeout, productInventory, purchaseOrder, rentalManagement, translateDataToTree } from "../../../constants/helpers";
import { useData } from "../../../StateProvider/Provider";
import moment from "moment";
import { startCase } from "lodash";
import CreateSeriaizedAsset from "./CreateSerializedAsset";
import CustomReactTable from "../../../components/CustomReactTable/CustomReactTable";
import { isMobile } from "react-device-detect";
import CustomSwipableList from "../../../components/SwipableListComponents/CustomSwipableList";
import routes from "../../../components/Helpers/Routes";
import { CURReplaceByCurrencySingle } from "../../../constants/formulaUtility";

const useStyles = makeStyles(() => ({
    equal: {
        color: "green",
    },
    later: {
        color: "yellow",
    },
    muchLater: {
        color: "red",
    },

}));

const ReceivingAsset = ({ currencySymbol, purchaseOrderData, purchaseOrderProduct, handleUpdateData }) => {
    const toastConfig = useContext(CustomToastContext);
    const {
        state: { user, permissions }
    }: any = useData();

    const classes = useStyles();

    const [showCreateAssetDialog, setShowCreateAssetDialog] = useState(false)
    const [loadingColumns, setLoadingColumns] = useState(false)
    const isSmallScreen = useMediaQuery('(max-width:1300px)');
    const isTabletScreen = useMediaQuery('(max-width:960px)');
    const [showActivity, setActivityShow] = useState(defaultActivityShow);
    const [selectedProducts, setSelectedProducts] = useState([])

    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;

    const [columns, setColumns] = useState([{
        accessor: 'description',
        Header: 'Product Description',
        Cell: ({ row }) => (
            <div className="d-flex gap-2 align-items-center">
                <p
                    className="text-truncate"
                    title={row.original.description}
                // to={rowData.type === 'Product' ? `${routes.productDetail.path}/${rowData.id}` : `${routes.packagesDetail.path}/${rowData.id}`}
                >
                    {row.original.description}
                </p>
                {row.original.hasOwnProperty("assetNumber") &&
                    <span className="d-flex align-items-center gap-2">
                        <Chip label="Asset" size="small" color="primary" />
                    </span>
                }
            </div>
        )
    },
    {
        accessor: 'actualDelivery',
        Header: 'Actual Delivery',
        Cell: ({ row }) => (
            row.original.actualDelivery ? <h5 className="createBy text-truncate" title={`${moment(row.original.actualDelivery.slice(0, 10)).format(dateFormat)}`}>
                <span className="">
                    <Chip
                        label={`${moment(row.original.actualDelivery.slice(0, 10)).format("MM/DD/YYYY")}`}
                        size="small"
                        className={
                            moment(row.original.actualDelivery).diff(moment(row.original.expectedDelivery), 'days') > 0 ?
                                moment(row.original.actualDelivery).diff(moment(row.original.expectedDelivery), 'days') > 7 ?
                                    classes.muchLater
                                    : classes.later
                                : classes.equal}
                    />
                </span>
            </h5> : <NoDataCell />
        )
    },
        // {
        //     accessor: 'expectedDelivery',
        //     Header: 'Expected Delivery',
        //     Cell: ({ row }) => (
        //         row.original.expectedDelivery ? <h5 className="createBy text-truncate" title={`${moment(row.original.expectedDelivery.slice(0, 10)).format(dateFormat)}`}>
        //             <span className="">
        //                 {moment(row.original.expectedDelivery.slice(0, 10)).format("MM/DD/YYYY")}</span>
        //         </h5> : <NoDataCell />
        //     )
        // },
    ])
    // const columns = [

    //     {
    //         accessor: 'expectedDelivery',
    //         Header: 'Expected Delivery',
    //         Cell: ({ row }) => (
    //             row.original.expectedDelivery ? <h5 className="createBy text-truncate" title={`${moment(row.original.expectedDelivery.slice(0, 10)).format(dateFormat)}`}>
    //                 <span className="">
    //                     {moment(row.original.expectedDelivery.slice(0, 10)).format("MM/DD/YYYY")}</span>
    //             </h5> : <NoDataCell />
    //         )
    //     },

    //     {
    //         accessor: 'quantity',
    //         Header: 'Quantity',
    //         Cell: ({ row }) => (
    //             row.original.quantity ? <p className="text-truncate">
    //                 {row.original.quantity}
    //             </p> : <NoDataCell />
    //         )
    //     },
    //     {
    //         accessor: 'actualReceived',
    //         Header: 'Actual Received',
    //         Cell: ({ row }) => (
    //             row.original.actualReceived ? <p className="text-truncate">
    //                 {row.original.actualReceived}
    //             </p> : <NoDataCell />
    //         )
    //     },

    //     {
    //         accessor: 'baseUOM',
    //         Header: 'Base UOM',
    //         Cell: ({ row }) => (
    //             row.original.baseUOM ? <p>{startCase(row.original.baseUOM)}</p> : <NoDataCell />
    //         )
    //     },

    // ]

    useEffect(() => {
        fetchColumns()
        fetchSerializedAsset()
    }, []);

    const fetchColumns = () => {
        setLoadingColumns(true)
        axiosInstance().get("/field/child?resource=Purchase Order Product").then(({ data: { data } }) => {
            const fields = CURReplaceByCurrencySingle(data, purchaseOrderData.currency)
            let tempColumns = [];
            fields.map(fields => {
                if (fields.type === "date") {
                    tempColumns.push({
                        accessor: fields.fieldName,
                        Header: fields.fieldLabel,
                        Cell: ({ row }) => (
                            row.original[`${fields.fieldName}`] ? <h5 className="createBy text-truncate" title={`${moment(row.original[`${fields.fieldName}`].slice(0, 10)).format(dateFormat)}`}>
                                <span className="">
                                    {moment(row.original[`${fields.fieldName}`].slice(0, 10)).format("MM/DD/YYYY")}</span>
                            </h5> : <NoDataCell />
                        )

                    })
                }
                else {
                    tempColumns.push({
                        accessor: fields.fieldName,
                        Header: fields.fieldLabel,
                        Cell: ({ row }) => (
                            row.original[`${fields.fieldName}`] ? <p>{startCase(row.original[`${fields.fieldName}`])}</p> : <NoDataCell />
                        )

                    })
                }
            })
            // genrateColoum(fields, columns, rendererNames, false);
            setColumns(prevState => { return [...prevState, ...tempColumns] })
            setLoadingColumns(false)
        })
    }

    const fetchSerializedAsset = () => {
        dispatch({ type: "loading", loading: true });
        axiosInstance().get(`${purchaseOrder.api}/product/${purchaseOrderData._id}`).then(({ data: { data } }) => {
            let rows = data?.map((item) => {
                let res: any = {
                    ...item,
                    description: item?.productDetail?.productName,
                    treeId: item?.productDetail?._id,
                };
                return res;
            });
            axiosInstance().get(`${productInventory.api}?filterById=[{"field": "pONumber", "term": "${purchaseOrderData._id}"}]`)
                .then(({ data }) => {
                    data.data = data.data.map((u) => {
                        let tempProduct = rows.find(obj => obj.treeId === u.product.optionValue)
                        if (tempProduct) {
                            rows.push({
                                ...u,
                                description: u.assetNumber,
                                treeId: u._id,
                                parent: tempProduct.treeId,
                                actualDelivery: u.createdBy?.date,
                                expectedDelivery: tempProduct.expectedDelivery
                            })
                        }
                    }
                    );
                    const newDataForReactTable = [...translateDataToTree(rows ? [...rows] : [], "parent", "treeId", "subRows")];
                    dispatch({
                        type: "initialize", data: newDataForReactTable, count: newDataForReactTable.length
                    });
                    setTimeout(() => {
                        dispatch({ type: "loading", loading: false });
                    }, gridLoadingTimeout);
                }).catch((error) => {
                    dispatch({ type: "loading", loading: false });
                    toastConfig.setToastConfig(error)
                });
        }).catch((error) => {
            dispatch({ type: "loading", loading: false });
            toastConfig.setToastConfig(error)
        });

    }

    return (<>
        <Box display="flex" justifyContent="space-between" m={1}>
            <Box display="flex">
                <Box mx={1} />
                <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    disabled={selectedProducts.length === 0}
                    onClick={() => { setShowCreateAssetDialog(true) }}
                >
                    {`Create Asset`}
                </Button>
            </Box>
        </Box>
        {columns && !loadingColumns ?
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
                    {isMobile ? <CustomSwipableList
                        allowSelection={true}
                        allowSwipe={true}
                        permissions={permissions}
                        primaryField={columns?.find(d => d.Header === "productDescription")}
                        onClick={() => {
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

                    /> : <CustomReactTable
                        columns={columns}
                        data={dataRows}
                        isInValidCheck={(rowData) => rowData?.type?.includes("roduct") && (isNaN(rowData?.finalPrice) || rowData?.finalPrice === 0)}
                        onSelect={setSelectedProducts}
                        childrenProperty="subRows"
                        uniqueKey="_id"
                    />
                    }

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
                    fetchSerializedAsset()
                }}
                title="Create Asset"
                productList={selectedProducts.filter(d => d.hasOwnProperty("productDetail"))}
            />
        }
    </>
    );
}

export default ReceivingAsset;