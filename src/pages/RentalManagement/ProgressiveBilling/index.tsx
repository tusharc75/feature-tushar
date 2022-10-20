import { Box, Button, Chip, Grid } from "@material-ui/core";
import moment from "moment";
import { useContext, useEffect, useReducer, useState } from "react";
import { isMobile } from "react-device-detect";
import axiosInstance from "src/axios/axiosInstance";
import CustomReactTable from "src/components/CustomReactTable/CustomReactTable";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import NoDataCell from "src/components/Helpers/NoDataCell";
import routes from "src/components/Helpers/Routes";
import { fetch_rental_product_fields } from "src/components/RentalManagment/helper";
import { dateFormat, formatAmountWithCurrency, gridLoadingTimeout, prepareDataForGrid, rentalManagement } from "src/constants/helpers";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import CreateBillingDialog from "./CreateBillingDialog";

const ProgressiveBilling = ({ rentalId, rentalManagementData, currencySymbol }) => {

    const toastConfig = useContext(CustomToastContext);
    const [createBillDialog, setCreateBillDialog] = useState(false);
    const [columns, setColumns] = useState(null);
    const [rowsData, setRowsData] = useState(null);

    useEffect(() => {
        fetchBilling();
        fetchFields();
    }, []);

    const fetchFields = async () => {
        var { fields: data, allFields } = await fetch_rental_product_fields(rentalManagementData?.currency, false);
        const coloum: any = [
            {
                accessor: 'srno',
                Header: '#',
                width: 70,
                sticky: isMobile ? "none" : "left",
                Cell: ({ row }) => (
                    <p className="text-truncate"  >
                        {row.original.srno}
                    </p>),
            },
            {
                accessor: 'detail',
                Header: 'Detail',
                minWidth: 300,
                width: 300,
                sticky: isMobile ? 'none' : 'left',
                Cell: ({ row }) => (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {(
                            <p>
                                {row.original.detail}
                            </p>
                        )}
                        {<Box ml={1} className="d-flex align-items-center">
                            <span title={`There are ${row.original?.subRows?.length} product(s) in this ${row.original?.type}`}>
                                {row.original?.subRows?.length ? `(${row.original?.subRows?.length})` : null}
                            </span>

                        </Box>}
                        {(
                            <Chip
                                className="ml-1"
                                label={`${row.original.type === 'bill' ? "Bill" :
                                    row.original.type === 'product' ?
                                        !row.original.serializedProduct ? "Non-Serialized Product" : "Product" : "Package"}`}
                                size="small"
                                color="primary"
                                onClick={() => {
                                    if (row.original.type !== 'bill') {
                                        window.open(
                                            `${row.original.type === 'product' ? routes.productDetail.path : routes.packagesDetail.path}/${row.original.materialId}`
                                        );
                                    }
                                }}
                            />
                        )}
                    </div>
                ),
                Footer: () => {
                    return <>Total</>;
                }
            }
        ];
        data.forEach((element) => {
            if (element.type === 'date') {
                coloum.push({
                    accessor: element.fieldName,
                    Header: element.fieldLabel,
                    disableFilters: true,
                    Cell: ({ row }) =>
                        row.original[element.fieldName] ? <p>{moment(row.original[element.fieldName]).format(dateFormat)}</p> : <NoDataCell />
                });
            } else if (element.type === 'converter' || element.type === 'currencyAmount' || element.isConverter === true) {
                if (element.type !== 'currencyAmount' && (element.type === 'converter' || element.isConverter === true)) {
                    element.displayUnits.forEach((_unit) => {
                        let fieldName = element.fieldName + '_' + _unit.toLowerCase();
                        let fieldLabel = element.fieldLabel + ' ' + _unit;
                        coloum.push({
                            accessor: fieldName,
                            Header: fieldLabel,
                            Cell: ({ row }) => (row.original[fieldName] ? <p>{row.original[fieldName]}</p> : <NoDataCell />)
                        });
                    });
                } else if (element.type === 'currencyAmount' && (element.type === 'converter' || element.isConverter === true)) {
                    element.displayUnits.forEach((_unit) => {
                        element.displayCurrency.forEach((_currency) => {
                            let fieldName = element.fieldName + '_' + _currency.toLowerCase() + '_' + _unit.toLowerCase();
                            let fieldLabel = element.fieldLabel + ' ' + _unit + '/' + _currency;
                            coloum.push({
                                accessor: fieldName,
                                Header: fieldLabel,
                                Cell: ({ row }) =>
                                    row.original[fieldName] ? (
                                        <p>{formatAmountWithCurrency(rentalManagementData?.currency, row.original[fieldName])?.amountWithouCurrencyCode}</p>
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
                        coloum.push({
                            accessor: fieldName,
                            Header: fieldLabel,
                            Cell: ({ row }) =>
                                row.original[fieldName] ? (
                                    <p>{formatAmountWithCurrency(rentalManagementData?.currency, row.original[fieldName])?.amountWithouCurrencyCode}</p>
                                ) : (
                                    <NoDataCell />
                                ),
                            Footer: (info) => {
                                const total = info?.rows
                                    ?.filter((f) => f.original.parentId === null && f.values.hasOwnProperty(fieldName) && !isNaN(f.values[fieldName]))
                                    .reduce((sum, row) => row.values[fieldName] + sum, 0);
                                return (
                                    <>
                                        {currencySymbol} {formatAmountWithCurrency(rentalManagementData?.currency, total)?.amountWithouCurrencyCode ?? total}
                                    </>
                                );
                            }
                        });
                    });
                }
            } else {
                if (element.fieldName === 'qty') {
                    element.fieldName = 'qtyDisplay';
                }
                coloum.push({
                    accessor: element.fieldName,
                    Header: element.fieldLabel,
                    Cell: ({ row }) => (row.original[element.fieldName] ? <p>{row.original[element.fieldName]}</p> : <NoDataCell />)
                });
            }
        });
        coloum.forEach((element) => {
            if (element.accessor === 'qtyDisplay') {
                element['Footer'] = (info) => {
                    const qtyTotal = info.rows
                        .filter((f) => f.original.parentId === null && f.values.hasOwnProperty(element.accessor) && !isNaN(f.values[element.accessor]))
                        .reduce((sum, row) => row.values[element.accessor] + sum, 0);
                    return <>{qtyTotal}</>;
                };
            }
        });
        setColumns(coloum);
    };

    const fetchBilling = async () => {
        var data: any = [];
        var inventory: any = [];
        var nonSerializeAsset: any = [];

        const response = await axiosInstance().get(`${rentalManagement.api}/${rentalId}/progressive-billing`);
        data = response?.data?.data;
        const rows = data.progressiveBilling;
        const material = []
        rows.forEach(d => {
            d.material.forEach(obj => {
                if (obj.parentId === null) {
                    obj["parentId"] = d._id
                }
                material.push(obj)
            })
        })
        rows.forEach((parent, i) => {
            parent.srno = (i + 1);
            parent.detail = `${parent.billNumber}`;
            parent.type = "bill"
            parent.serializedProduct = false;
            parent.materialId = parent._id
            parent.qtyDisplay = parent.qty;
            parent.isValid = true;
            parent.subRows = generateNestedData(material, inventory, nonSerializeAsset, parent);
        });
        setRowsData(rows);
    };

    const generateNestedData = (material, inventory, nonSerializeAsset, parent) => {
        const subRows: any = material.filter((e) => e.parentId === parent._id);
        subRows.forEach((_subRow, j) => {
            _subRow.srno = parent.srno + '.' + (j + 1);
            _subRow.detail = _subRow?.productDetail?.productName;
            _subRow.serializedProduct = _subRow?.productDetail?.serializedProduct;
            _subRow.qtyDisplay = `${_subRow.qty}`;
            _subRow.isValid = true;
            _subRow.assetQty = _subRow.serializedProduct ? inventory?.filter((e) => e._id === _subRow._id).length : nonSerializeAsset?.filter((e) => e._id === _subRow._id).length;
            _subRow.hideSelection = _subRow.assetQty > 0 ? true : _subRow?.status ? true : false;;
            _subRow.subRows = generateNestedData(material, inventory, nonSerializeAsset, _subRow);
        });
        if (subRows.length === 0 && parent.type === "package") {
            parent.isValid = false;
        }
        if (parent.type === "package") {
            parent.hideSelection = subRows.filter((e) => e.hideSelection).length ? true : false;
        }
        return subRows;
    }

    const getNestedSubRows = (obj, original) => {
        if (original?.subRows?.length) {
            original?.subRows.forEach((element) => {
                obj.push({ id: element._id, type: element.type, materialId: element.materialId });
                getNestedSubRows(obj, element);
            });
        }
    }

    return (
        <>
            <Box display="flex" justifyContent="flex-end" >
                <Box display="flex" alignItems="center" pt={2} pr={2}>
                    <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => setCreateBillDialog(true)}
                        aria-controls="action-menu"
                    >
                        Create Billing
                    </Button>
                </Box>
            </Box>
            <Grid item xs={12} md={12} sm={12} className="mt-3">
                {columns && rowsData ? (
                    <Box
                        zIndex={5}
                        width={'100%'}
                        height={"calc(100vh - 285px)"}
                        p={2}
                    >
                        <CustomReactTable
                            height={"calc(100vh - 285px)"}
                            columns={columns}
                            data={rowsData}
                            onSelect={() => { }}
                            childrenProperty="subRows"
                            uniqueKey="_id"
                            hideSelection={true}
                            renderedFrom="rental_management_create_billing"
                            isClientSideGrid={true}
                        />
                    </Box>
                ) : (
                    <Box p={2} height={500} bgcolor="white">
                        <CommonSkeleton lenArray={[...Array(10).keys()]} />
                    </Box>
                )}
            </Grid>
            {createBillDialog && <CreateBillingDialog
                rentalManagementData={rentalManagementData}
                currencySymbol={currencySymbol}
                onClose={() => { setCreateBillDialog(false) }}
                onSuccess={() => {
                    fetchBilling()
                    setCreateBillDialog(false)
                }} />}
        </>
    );
}
export default ProgressiveBilling;