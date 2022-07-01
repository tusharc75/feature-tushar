import React, { useState, useEffect, useContext, Fragment, useReducer, useMemo } from "react";
import { Grid, Box, Button, Paper, Typography, IconButton, CircularProgress, Tab, Tabs, ButtonGroup, Container, InputAdornment, useMediaQuery } from "@material-ui/core";
import axiosInstance from "../../../axios/axiosInstance";
import routes from "../../../components/Helpers/Routes";
import { useData } from "../../../StateProvider/Provider";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import HtmlTooltip from "../../../components/CustomTooltipTitle";
import AddExistingProductInventory from "./AddExistingProductInventory";
import CustomReactTable from "../../../components/CustomReactTable/CustomReactTable";
import NoDataCell from "../../../components/Helpers/NoDataCell";
import Add from "@material-ui/icons/Add";
import moment from "moment";
import { salesOrder, dateFormat, pricingCondition, formatAmountWithCurrency } from "../../../constants/helpers";
import ConfirmationDialog from "../../../components/Helpers/ConfirmationDialog";
import SalesOrderQtyDialog from './SalesOrderQtyDialog'
import { autoCalculateSpecificFields } from "../../../constants/formulaUtility";
import InfoIcon from "@material-ui/icons/Info";
import { fetch_salesOrder_product_fields } from '../../../components/SalesOrder/helper';
import DeleteIcon from '@material-ui/icons/Delete';
import { isMobile } from "react-device-detect";

const Productpackage = ({ salesOrderData, setNextStep, currencySymbol, showActivity, renderedFrom }) => {

    const toastConfig = useContext(CustomToastContext);
    const { state: { user, permissions } }: any = useData();

    const isSmallScreen = useMediaQuery('(max-width:1300px)');
    const isTabletScreen = useMediaQuery('(max-width:960px)');
    const [isUpdating, setUpdating] = useState(false);

    const [selectedProducts, setSelectedProducts] = useState([])
    const [isProductEdit, setIsProductEdit] = useState({ open: false, isBulkedit: false });
    const [isAddingProducts, setAddingProducts] = useState(false);

    const [recordToUpdate, setRecordToUpdate] = useState(null)

    const [deleteData, setDeleteData] = useState(null);
    const [isDeleting, setDeleting] = useState(false);

    const [material, setMaterial] = useState([]);
    const [addExistingProductDialog, setAddExistingProductDialog] = useState({ open: false, type: "", parentId: null });
    const [columns, setColumns] = useState(null);
    const [rowsData, setRowsData] = useState(null);
    const [allFields, setAllFields] = useState([]);
    const [isRateRequired, setIsRateRequired] = useState(false);


    useEffect(() => {
        fetchFields()
    }, []);

    const fetchFields = async () => {
        var data = await fetch_salesOrder_product_fields(salesOrderData?.currency)
        setAllFields(JSON.parse(JSON.stringify(data)))
        const coloum: any = [{
            accessor: 'detail',
            Header: 'Detail',
            minWidth: 300,
            width: 300,
            Cell: ({ row }) => (
                <div style={{ display: "flex", alignItems: 'center' }}>
                    {<p
                        onClick={() => {
                            handleOpen(row.original)
                        }}
                        className="link text-truncate"
                        title={row.original.detail}
                    >
                        {row.original.detail}
                    </p>}
                    {row.original?.type === 'package' &&
                        <Box ml={1} className="d-flex align-items-center">
                            <span title={`There are ${row.original?.subRows?.length} product(s) in this package`}>({row.original?.subRows?.length})</span>
                            <HtmlTooltip title="Add Product">
                                <IconButton onClick={() => setAddExistingProductDialog({ open: true, type: 'product', parentId: row.original?._id })} size="small" color="primary">
                                    <Add color='disabled' fontSize="small" />
                                </IconButton>
                            </HtmlTooltip>
                        </Box>
                    }
                    <HtmlTooltip title="Details">
                        <IconButton
                            size="small"
                            aria-label="Details"
                            onClick={() => {
                                window.open(`${row.original.type === "product" ? routes.productDetail.path : routes.packagesDetail.path}/${row.original.materialId}`);
                            }}
                        >
                            <InfoIcon fontSize="small" />
                        </IconButton>
                    </HtmlTooltip>
                </div>
            )
        }]
        data.forEach(element => {
            if (element.fieldName === "price" && element.required) {
                setIsRateRequired(true);
            }
            if (element.type === "date") {
                coloum.push({
                    accessor: element.fieldName,
                    Header: element.fieldLabel,
                    disableFilters: true,
                    Cell: ({ row }) => (
                        row.original[element.fieldName] ? <p>{moment(row.original[element.fieldName].slice(0, 10)).format(dateFormat)}</p> : <NoDataCell />
                    )
                })
            }
            else if (element.type === "converter" || element.type === "currencyAmount" || element.isConverter === true) {
                if (element.type !== "currencyAmount" && (element.type === "converter" || element.isConverter === true)) {
                    element.displayUnits.forEach((_unit) => {
                        let fieldName = element.fieldName + "_" + _unit.toLowerCase()
                        let fieldLabel = element.fieldLabel + " " + _unit
                        coloum.push({
                            accessor: fieldName,
                            Header: fieldLabel,
                            Cell: ({ row }) => (
                                row.original[fieldName] ? <p>{row.original[fieldName]}</p> : <NoDataCell />
                            )
                        })
                    })
                }
                else if (element.type === "currencyAmount" && (element.type === "converter" || element.isConverter === true)) {
                    element.displayUnits.forEach((_unit) => {
                        element.displayCurrency.forEach((_currency) => {
                            let fieldName = element.fieldName + "_" + _currency.toLowerCase() + "_" + _unit.toLowerCase()
                            let fieldLabel = element.fieldLabel + " " + _unit + "/" + _currency
                            coloum.push({
                                accessor: fieldName,
                                Header: fieldLabel,
                                Cell: ({ row }) => (
                                    row.original[fieldName] ? <p>{formatAmountWithCurrency(salesOrderData?.currency, row.original[fieldName])?.amountWithouCurrencyCode}</p> : <NoDataCell />
                                )
                            })
                        })
                    })
                }
                else if (element.type === "currencyAmount") {
                    element.displayCurrency.forEach((_currency) => {
                        let fieldName = element.fieldName + "_" + _currency.toLowerCase()
                        let fieldLabel = element.fieldLabel + " " + _currency
                        coloum.push({
                            accessor: fieldName,
                            Header: fieldLabel,
                            Cell: ({ row }) => (
                                row.original[fieldName] ? <p>{formatAmountWithCurrency(salesOrderData?.currency, row.original[fieldName])?.amountWithouCurrencyCode}</p> : <NoDataCell />
                            )
                        })
                    })
                }
            }
            else {
                if (element.fieldName === "qty") {
                    element.fieldName = "qtyDisplay"
                }
                coloum.push({
                    accessor: element.fieldName,
                    Header: element.fieldLabel,
                    Cell: ({ row }) => (
                        row.original[element.fieldName] ? <p>{row.original[element.fieldName]}</p> : <NoDataCell />
                    )
                })
            }
        });
        {
            isMobile ? <Box display={"none"} /> : coloum.push({
                accessor: 'action',
                Header: '',
                minWidth: 50,
                width: 50,
                sticky: 'right',
                disableFilters: true,
                canDrag: false,
                Cell: ({ row }) =>
                    !row.original.hideSelection && (
                        <IconButton
                            size="small"
                            aria-label="Details"
                            onClick={() => {
                                const obj: any = [{ id: row.original._id, type: row.original?.type, materialId: row.original?.materialId }];
                                setDeleteData(obj);
                            }}
                        >
                            <DeleteIcon fontSize="small" color="error" />
                        </IconButton>
                    )
            });
        }
        coloum.forEach(element => {
            if (element.accessor.includes("detail")) {
                element["Footer"] = () => {
                    return <>Total</>
                }
            }
            else if (element.accessor === "qtyDisplay") {
                element["Footer"] = (info) => {
                    const qtyTotal = info.rows.filter(f => f.original.parentId === null && f.values.hasOwnProperty(element.accessor) && !isNaN(f.values[element.accessor])).reduce((sum, row) => row.values[element.accessor] + sum, 0)
                    return <>{qtyTotal}</>
                }
            }
            else if (element.accessor.includes("finalPrice")) {
                element["Footer"] = (info) => {
                    const total = info.rows.filter(f => f.original.parentId === null && f.values.hasOwnProperty(element.accessor) && !isNaN(f.values[element.accessor])).reduce((sum, row) => row.values[element.accessor] + sum, 0)
                    return <>{currencySymbol} {formatAmountWithCurrency(salesOrderData?.currency, total)?.amountWithouCurrencyCode ?? total}</>
                }
            }
        });
        setColumns(coloum)
        fetchProductInventory();
    }

    const fetchProductInventory = async () => {
        setNextStep(false)
        var data: any = []
        var inventory: any = []
        const response = await axiosInstance().get(`${salesOrder.api}/productpackage/${salesOrderData._id}`)
        data = response?.data?.data
        setMaterial(JSON.parse(JSON.stringify(data.material)))
        inventory = data.inventory;
        const rows = data.material.filter((e) => e.parentId === null)
        rows.forEach((parent, i) => {
            parent.detail = `${parent.type === "product" ? parent.productDetail?.productName : parent.packageDetail?.packageName}`
            parent.qtyDisplay = parent.qty;
            parent.isValid = parent["finalPrice_" + salesOrderData?.currency?.toLowerCase()] ? true : !isRateRequired;
            parent.hideSelection = inventory.filter((e) => e._id === parent._id).length ? true : false;
            parent.assetQty = inventory.filter((e) => e._id === parent._id).length;
            if (parent.type === "package") {
                const subRows: any = data.material.filter((e) => e.parentId === parent._id);
                subRows.forEach((_subRow, j) => {
                    _subRow.detail = _subRow.productDetail?.productName
                    _subRow.qtyDisplay = `${parent.qty} x ${_subRow.qty} = ${parent.qty * _subRow.qty}`
                    _subRow.isValid = _subRow["finalPrice_" + salesOrderData?.currency?.toLowerCase()] ? true : !isRateRequired;
                    _subRow.hideSelection = inventory.filter((e) => e._id === _subRow._id).length ? true : false;
                    _subRow.assetQty = inventory.filter((e) => e._id === _subRow._id).length;
                })
                if (subRows.length === 0) {
                    parent.isValid = false
                }
                parent.hideSelection = subRows.filter((e) => e.hideSelection).length ? true : false;
                parent.subRows = subRows
            }
        });
        if (rows.filter(_rows => _rows.isValid === false).length > 0 || rows.length === 0) {
            setNextStep(false)
        } else {
            setNextStep(true)
        }
        setRowsData(rows);
        setSelectedProducts([])
    };

    const handleAdd = async (rows) => {
        setAddingProducts(true)
        const material: any = []
        rows.forEach(d => {
            const element: any = {};
            element.materialId = d._id;
            element.type = addExistingProductDialog.type;
            element.unit = d?.unit && d?.unitMain?.length ? d?.unitMain[0] : "";
            element.qty = d.qty ? parseFloat(d.qty) : 1;
            element.parentId = addExistingProductDialog.parentId;
            material.push(element);
        });

        const priceData: any = await calculatePrice(material);
        material.forEach(element => {
            const rateResult = priceData?.filter((e) => e.materialId === element.materialId &&
                e.materialType === element.type && e.unit === element.unit && e.pricingMethod === element.pricingMethod)
            if (rateResult.length && rateResult[0].mrp) {
                const priceFieldName = `price_${salesOrderData?.currency?.toLowerCase()}`
                element[priceFieldName] = rateResult[0].mrp;
                const calValues = autoCalculateSpecificFields({ [priceFieldName]: rateResult[0].mrp }, element, allFields)
                Object.assign(element, calValues);
            }
        })

        axiosInstance().post(`${salesOrder.api}/productpackage/${salesOrderData._id}`, { material })
            .then(() => {
                setAddExistingProductDialog({ open: false, type: "", parentId: null })
                fetchProductInventory()
                setAddingProducts(false)
            }).catch((error) => {
                setAddExistingProductDialog({ open: false, type: "", parentId: null })
                toastConfig.setToastConfig(error)
                setAddingProducts(false)
            });
    }

    const handleSaveData = async (rows: any) => {
        rows.forEach(element => {
            delete element.srno
            delete element.detail
            delete element.qtyDisplay
            delete element.isValid
            delete element.hideSelection
            delete element.assetQty
            delete element.productDetail
            delete element.packageDetail
            delete element.subRows
        });
        setUpdating(true);
        axiosInstance().put(`${salesOrder.api}/productpackage/${salesOrderData._id}`, { material: rows }).then(() => {
            setUpdating(false)
            setIsProductEdit({ open: false, isBulkedit: false })
            fetchProductInventory()
        }).catch((error) => {
            setUpdating(false)
            toastConfig.setToastConfig(error)
        });
    }

    const handleDelete = (rows) => {
        setDeleting(true)
        axiosInstance().put(`${salesOrder.api}/productpackage/${salesOrderData?._id}/delete`, { ids: rows })
            .then(() => {
                setDeleting(false)
                fetchProductInventory()
                setDeleteData(null)
            }).catch((error) => {
                setDeleting(false)
                toastConfig.setToastConfig(error)
                setDeleteData(null)
            });
    }

    const handleOpen = (rowData) => {
        setIsProductEdit({ open: true, isBulkedit: false })
        setRecordToUpdate(rowData)
    }

    const calculatePrice = (arr: any[]) => {
        if (salesOrderData) {
            const data: any = {}
            data.conditionType = ["Rent"]
            data.material = arr.map(ele => ({
                materialId: ele?.materialId,
                materialType: ele?.type,
                qty: ele?.qty,
                pricingMethod: ele?.pricingMethod,
                unit: ele?.unit,
                currency: salesOrderData?.currency
            }))
            data.supplier = [];
            data.customer = [salesOrderData?.customerAccount?.optionValue];
            data.warehouse = [salesOrderData?.warehouse?.optionValue];
            return new Promise((resolve, reject) => {
                axiosInstance().post(pricingCondition.api + `/calculatePrice`, data)
                    .then(({ data: { data } }) => {
                        resolve(data)
                    }).catch(err => {
                        reject(err)
                    })
            })
        }
    };

    return (<Fragment>
        <Box display="flex" justifyContent="space-between" m={1}>
            <Box display="flex" alignItems="center">
                {permissions?.product?.isRead &&
                    <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => {
                            setAddExistingProductDialog({ open: true, type: "product", parentId: null });
                        }}
                    >
                        {`Add ${routes.product.title}`}
                    </Button>
                }
                <Box mx={1} />
                {permissions?.packages?.isRead &&
                    <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => {
                            setAddExistingProductDialog({ open: true, type: "package", parentId: null });
                        }}
                    >
                        {`Add ${routes.packages.title}`}
                    </Button>
                }
            </Box>
            <Box display="flex">
                <HtmlTooltip title={Boolean(selectedProducts && selectedProducts.length) ? "Bulk edit selected records" : "Select records to edit"}>
                    <span>
                        <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            disabled={!Boolean(selectedProducts && selectedProducts.filter((e) => !e.hideSelection).length)}
                            onClick={() => setIsProductEdit({ open: true, isBulkedit: true })}
                        >
                            Bulk Edit
                        </Button>
                    </span>
                </HtmlTooltip>
                <Box mx={1} />
                <HtmlTooltip title={Boolean(selectedProducts && selectedProducts.length) ? "Delete selected records" : "Select records to delete"}>
                    <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        disabled={!Boolean(selectedProducts && selectedProducts.filter((e) => !e.hideSelection).length) || isDeleting}
                        onClick={() => {
                            const dataToDelete = selectedProducts && selectedProducts.filter((e) => !e.hideSelection).map((rec: any) => {
                                const obj: any = {};
                                obj.id = rec._id;
                                obj.type = rec?.type;
                                obj.materialId = rec?.materialId;
                                return obj
                            })
                            setDeleteData(dataToDelete)
                        }}
                        endIcon={isDeleting && <CircularProgress size={20} color="primary" />}
                    >
                        Delete
                    </Button>
                </HtmlTooltip>
            </Box>
        </Box>
        {columns && rowsData ?
            <>
                <Box
                    p="6px"
                    zIndex={5}
                    width={
                        isTabletScreen
                            ? "calc(100vw)"
                            : isSmallScreen
                                ? "calc(100vw)"
                                : showActivity ? "100%" : "calc(100vw - 100px)"
                    }
                    height="calc(100vh - 330px)"
                >
                    <CustomReactTable
                        height="calc(100vh - 345px)"
                        columns={columns}
                        data={rowsData}
                        setWholeRowsCellColor={(rowData) => !rowData.isValid ? "error" : ""}
                        onSelect={setSelectedProducts}
                        childrenProperty="subRows"
                        uniqueKey="_id"
                        renderedFrom="sales_order_product_package"
                        isClientSideGrid={true}
                    />
                </Box>
            </>
            : <Box p={2} height={500} bgcolor="white">
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
        }
        {deleteData && <ConfirmationDialog
            open={true}
            message={`Are you sure you want to delete the record(s)?`}
            onClose={() => setDeleteData(null)}
            onOk={() => handleDelete(deleteData)}
            okBtnLoading={isDeleting}
        />}
        {isProductEdit.open &&
            <SalesOrderQtyDialog
                calculatePrice={calculatePrice}
                onClose={() => {
                    setIsProductEdit({ open: false, isBulkedit: false })
                    setRecordToUpdate(null)
                }}
                isBulkedit={isProductEdit.isBulkedit}
                handleSaveData={handleSaveData}
                salesOrderData={salesOrderData}
                rowData={recordToUpdate}
                material={material}
                selectedProducts={selectedProducts}
            />
        }
        {addExistingProductDialog.open &&
            <AddExistingProductInventory
                renderedFrom={addExistingProductDialog.type === 'product' ? `${renderedFrom}-product` : `${renderedFrom}-package`}
                isAddingProducts={isAddingProducts}
                addProductInventory={handleAdd}
                handleProductInventoryClose={() => { setAddExistingProductDialog({ open: false, type: "", parentId: null }) }}
                type={addExistingProductDialog.type}
                salesOrderData={salesOrderData}
                ignoreIds={rowsData?.map((e) => e?.materialId)}
            />
        }
    </Fragment>
    );
};

export default Productpackage;
