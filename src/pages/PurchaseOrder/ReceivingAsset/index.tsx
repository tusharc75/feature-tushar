
import Box from "@material-ui/core/Box/Box";
import { useState, useEffect, useContext } from "react";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import { Button, Chip, Dialog, Grid } from "@material-ui/core";
import axiosInstance from "src/axios/axiosInstance";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import {
    dateFormat, purchaseOrder, PURCHASE_ORDER_STATUS, prepareDataForGrid, formatAmountWithCurrency
} from "src/constants/helpers";
import { useData } from "src/StateProvider/Provider";
import CreateSerializedAsset from "./CreateSerializedAsset";
import { isMobile, isTablet } from "react-device-detect";
import routes from "src/components/Helpers/Routes";
import { Link } from "react-router-dom";
import { fetch_po_product_fields } from '../../../components/PurchaseOrder/helper';
import CustomReactTable from '../../../components/CustomReactTable/CustomReactTable';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import moment from 'moment';
import SendEmail from './../SendEmail';


const ReceivingAsset = ({ purchaseOrderData, setCurrentStep, updateStatus, statusOptions,
    stepFullScreen, isSmallScreen, isTabletScreen, showActivity, renderedFrom }) => {

    const toastConfig = useContext(CustomToastContext);
    const { state: { user, permissions } }: any = useData();

    const [showCreateAssetDialog, setShowCreateAssetDialog] = useState(false)
    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
    const [disableCreateAsset, setDisableCreateAsset] = useState(false);

    const [rowsData, setRowsData] = useState(null);
    const [columns, setColumns] = useState(null)
    const [selectedRecords, setSelectedRecords] = useState([]);

    useEffect(() => {
        fetchColumns()
        fetchProduct()
    }, []);

    const fetchColumns = async () => {
        const column = [];
        const productResult = await axiosInstance().get('/field?resource=Product&view=true')
        const productFields = productResult?.data?.data?.filter((e) => ["productName", "productNumber", "serializedProduct"].includes(e?.fieldData?.fieldName));
        productFields?.forEach((e) => {
            if (e?.fieldData?.fieldName === "productName") {
                column.push({
                    accessor: 'productName',
                    Header: "Detail",
                    width: 300,
                    Cell: ({ row }) => (
                        <p className="text-truncate"  >
                            {row.original.type === "Product" ?
                                <Link
                                    className="link"
                                    title={row.original.productId}
                                    to={`${routes.productDetail.path}/${row.original.productId}`}
                                >
                                    {row.original.productName}
                                </Link>
                                :
                                <Link
                                    className="link"
                                    title={row.original.productId}
                                    to={`${routes.serializedAssetDetail.path}/${row.original.assetId}`}
                                >
                                    {row.original.productName}
                                </Link>}
                        </p>),
                })
            }
            if (e?.fieldData?.fieldName === "productNumber") {
                column.push({
                    accessor: 'productNumber',
                    Header: e?.fieldData?.fieldLabel,
                    width: 300,
                    Cell: ({ row }) => (
                        row.original.productNumber ?
                            <p className="text-truncate"  >
                                {row.original.productNumber}
                            </p> : <NoDataCell />),
                })
            }
            if (e?.fieldData?.fieldName === "serializedProduct") {
                column.push({
                    accessor: 'serializedProduct',
                    Header: e?.fieldData?.fieldLabel,
                    width: 150,
                    Cell: ({ row }) => (
                        row.original.type === "Product" ?
                            <p className="text-truncate"  >
                                {row.original.serializedProduct ? "Yes" : "No"}
                            </p> : <NoDataCell />),
                })
            }
        })
        let fields = await fetch_po_product_fields(purchaseOrderData?.currency);
        fields.forEach((element) => {
            if (element.type === 'date') {
                column.push({
                    accessor: element.fieldName,
                    Header: element.fieldLabel,
                    disableFilters: true,
                    width: 300,
                    Cell: ({ row }) =>
                        row.original[element.fieldName] ? <p>{moment(row.original[element.fieldName].slice(0, 10)).format(dateFormat)}</p> : <NoDataCell />
                });
            } else if (element.type === 'converter' || element.type === 'currencyAmount' || element.isConverter === true) {
                if (element.type !== 'currencyAmount' && (element.type === 'converter' || element.isConverter === true)) {
                    element.displayUnits.forEach((_unit) => {
                        let fieldName = element.fieldName + '_' + _unit.toLowerCase();
                        let fieldLabel = element.fieldLabel + ' ' + _unit;
                        column.push({
                            accessor: fieldName,
                            Header: fieldLabel,
                            width: 300,
                            Cell: ({ row }) => (row.original[fieldName] ? <p>{row.original[fieldName]}</p> : <NoDataCell />)
                        });
                    });
                } else if (element.type === 'currencyAmount' && (element.type === 'converter' || element.isConverter === true)) {
                    element.displayUnits.forEach((_unit) => {
                        element.displayCurrency.forEach((_currency) => {
                            let fieldName = element.fieldName + '_' + _currency.toLowerCase() + '_' + _unit.toLowerCase();
                            let fieldLabel = element.fieldLabel + ' ' + _unit + '/' + _currency;
                            column.push({
                                accessor: fieldName,
                                Header: fieldLabel,
                                width: 300,
                                Cell: ({ row }) =>
                                    row.original[fieldName] ? (
                                        <p>{formatAmountWithCurrency(purchaseOrderData?.currency, row.original[fieldName])?.amountWithouCurrencyCode}</p>
                                    ) : (
                                        <NoDataCell />
                                    )
                            });
                        });
                    });
                } else if (element.type === 'currencyAmount') {
                    element.displayCurrency.forEach((_currency) => {
                        let fieldName = element.fieldName + '_' + _currency.toLowerCase();
                        let fieldLabel = element.fieldLabel + ' ' + _currency;
                        column.push({
                            accessor: fieldName,
                            Header: fieldLabel,
                            width: 300,
                            Cell: ({ row }) =>
                                row.original[fieldName] ? (
                                    <p>{formatAmountWithCurrency(purchaseOrderData?.currency, row.original[fieldName])?.amountWithouCurrencyCode}</p>
                                ) : (
                                    <NoDataCell />
                                ),
                            Footer: (info) => {
                                const total = info?.rows
                                    ?.filter((f) => f.values.hasOwnProperty(fieldName) && !isNaN(f.values[fieldName]))
                                    .reduce((sum, row) => row.values[fieldName] + sum, 0);
                                return (
                                    <>
                                        {formatAmountWithCurrency(purchaseOrderData?.currency, total)?.amountWithouCurrencyCode ?? total}
                                    </>
                                );
                            }
                        });
                    });
                }
            } else {
                if (element.fieldName === 'qty' || element.fieldName === 'actualReceived') {
                    column.push({
                        accessor: element.fieldName,
                        Header: element.fieldLabel,
                        width: 300,
                        Cell: ({ row }) => (row.original[element.fieldName] ? <p>{row.original[element.fieldName]}</p> : <NoDataCell />),
                        Footer: (info) => {
                            return (info?.rows?.filter((f) => f.values.hasOwnProperty(element.fieldName) && !isNaN(f.values[element.fieldName]))
                                .reduce((sum, row) => row.values[element.fieldName] + sum, 0)
                            );
                        }
                    });
                }
                else {
                    column.push({
                        accessor: element.fieldName,
                        Header: element.fieldLabel,
                        width: 300,
                        Cell: ({ row }) => (row.original[element.fieldName] ? <p>{row.original[element.fieldName]}</p> : <NoDataCell />)
                    });
                }
            }
        });
        setColumns([...column])
    }

    const fetchProduct = async () => {
        try {
            const result = await axiosInstance().get(`${purchaseOrder.api}/product/${purchaseOrderData._id}`)
            var assets: any = await axiosInstance().get(`${purchaseOrder.api}/${purchaseOrderData._id}/assets`)
            assets = assets?.data?.data;

            let rows = result?.data?.data?.map((item) => {
                let finalObject = prepareDataForGrid(item);
                finalObject["isChecked"] = selectedRecords.some(s => s._id === item._id);
                finalObject["allowedToEdit"] = true
                let res: any = {
                    ...finalObject,
                    type: "Product",
                    productName: item?.productDetail?.productName,
                    productNumber: item?.productDetail?.productNumber,
                    productDescription: item?.productDetail?.productDescription,
                    serializedProduct: item?.productDetail?.serializedProduct,
                    productId: item?.productDetail?._id,
                };
                if (item.qty === item.actualReceived) {
                    res["hideSelection"] = true
                }
                res.subRows = []
                const subRows = assets?.filter((e) => e?.product?.optionValue === res?.productId)
                if (subRows?.length) {
                    let actualReceived = item.actualReceived;
                    subRows?.forEach((e: any) => {
                        if (actualReceived && !e.isUsed) {
                            res.subRows.push({ productName: e.assetNumber, type: "Asset", assetId: e?._id, hideSelection: true })
                            actualReceived = actualReceived - 1;
                            e.isUsed = true;
                        }
                    })
                }
                return res;
            });
            if (rows.every(d => d.qty === d.actualReceived)) {
                setDisableCreateAsset(true)
            }
            setRowsData(rows);
            setSelectedRecords([]);
        }
        catch (error) {
            toastConfig.setToastConfig(error)
        }
    }

    return (<>
        <Box display="flex" justifyContent="space-between" m={1}>
            <Box display="flex">
                <Button
                    variant={"contained"}
                    color="primary"
                    size="small"
                    style={isMobile && !isTablet ? { color: "var(--secondary)" } : {}}
                    disabled={selectedRecords.length === 0 || disableCreateAsset}
                    onClick={() => { setShowCreateAssetDialog(true) }}
                >
                    {`Receive`}
                </Button>
            </Box>
            <div className="d-flex gap-2">
                <SendEmail
                    purchaseOrderData={purchaseOrderData}
                />
            </div>
        </Box>
        <Grid item xs={12} md={12} sm={12}>
            {columns && rowsData ? (
                <Box
                    zIndex={5}
                    width={stepFullScreen ? '100%' : isTabletScreen ? 'calc(100vw)' : isSmallScreen ? 'calc(100vw)' : showActivity ? '100%' : 'calc(100vw - 103px)'}
                >
                    <CustomReactTable
                        height={stepFullScreen ? "calc(100vh - 150px)" : "calc(100vh - 345px)"}
                        columns={columns}
                        data={rowsData}
                        onSelect={setSelectedRecords}
                        childrenProperty="subRows"
                        uniqueKey="_id"
                        hideSelection={[PURCHASE_ORDER_STATUS.invoiced, PURCHASE_ORDER_STATUS.closed]?.includes(purchaseOrderData?.status) ? true : false}
                        renderedFrom={renderedFrom}
                        isClientSideGrid={true}
                    />
                </Box>
            ) : (
                <Box p={2} height={500} bgcolor="white">
                    <CommonSkeleton lenArray={[...Array(10).keys()]} />
                </Box>
            )}
        </Grid>
        {showCreateAssetDialog &&
            <CreateSerializedAsset
                purchaseOrderID={purchaseOrderData._id}
                onClose={() => setShowCreateAssetDialog(false)}
                onSuccess={() => {
                    setShowCreateAssetDialog(false)
                    fetchProduct()
                }}
                title="Receiving"
                productList={selectedRecords.filter(d => (d.qty !== d.actualReceived))}
                purchaseOrderData={purchaseOrderData}
                updateStatus={updateStatus}
            />
        }
    </>
    );
}

export default ReceivingAsset;