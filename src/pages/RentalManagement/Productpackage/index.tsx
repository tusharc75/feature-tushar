import React, { useState, useEffect, useContext, Fragment, useReducer, useMemo } from "react";
import { Grid, Box, Button, Paper, Typography, IconButton, CircularProgress, Tab, Tabs, ButtonGroup, Container, InputAdornment, useMediaQuery } from "@material-ui/core";
import { Autocomplete, Skeleton } from "@material-ui/lab";
import { useParams, useHistory } from "react-router-dom";
import axiosInstance from "../../../axios/axiosInstance";
import routes from "../../../components/Helpers/Routes";
import { useData } from "../../../StateProvider/Provider";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import HtmlTooltip from "../../../components/CustomTooltipTitle";
import { CURReplaceByCurrencySingle } from "../../../constants/formulaUtility";
import AddExistingProductInventory from "./AddExistingProductInventory";
import CustomReactTable from "../../../components/CustomReactTable/CustomReactTable";
import { camelCase, startCase, orderBy, sum } from "lodash";
import NoDataCell from "../../../components/Helpers/NoDataCell";
import Add from "@material-ui/icons/Add";
import moment from "moment";
import {
    getUniqueCurrencies, gridLoadingTimeout, rentalManagement, defaultActivityShow,
    dateFormat, pricingCondition, generateUniqueId, treeToFlatArray, formatAmountWithCurrency
} from "../../../constants/helpers";
import ConfirmationDialog from "../../../components/Helpers/ConfirmationDialog";
import RentalJobQtyDialog from './RentalJobQtyDialog'
import { autoCalculateSpecificFields } from "../../../constants/formulaUtility";
const { pricingConditionApi } = pricingCondition

const Productpackage = ({ rentalManagementData, setNextStep, currencySymbol }) => {

    const toastConfig = useContext(CustomToastContext);
    const { state: { user, permissions } }: any = useData();

    const isSmallScreen = useMediaQuery('(max-width:1300px)');
    const isTabletScreen = useMediaQuery('(max-width:960px)');
    const [showActivity, setActivityShow] = useState(defaultActivityShow);
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

    useEffect(() => {
        axiosInstance().get("/field/child?resource=Rental Management Product").then(({ data: { data } }) => {
            data = CURReplaceByCurrencySingle(data, rentalManagementData.currency)
            setAllFields(JSON.parse(JSON.stringify(data)))
            const coloum: any = [{
                accessor: 'detail',
                Header: 'Detail',
                minWidth: 300,
                width: 300,
                Cell: ({ row }) => (
                    <div style={{ display: "flex", alignItems: 'center' }}>
                        <p
                            onClick={() => {
                                handleOpen(row.original)
                            }}
                            className="link text-truncate"
                            title={row.original.detail}
                        >
                            {row.original.detail}
                        </p>
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
                    </div>
                )
            }]
            data.forEach(element => {
                if (element.type === "date") {
                    coloum.push({
                        accessor: element.fieldName,
                        Header: element.fieldLabel,
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
                                        row.original[fieldName] ? <p>{row.original[fieldName]}</p> : <NoDataCell />
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
                                    row.original[fieldName] ? <p>{row.original[fieldName]}</p> : <NoDataCell />
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
            coloum.forEach(element => {
                if (element.accessor.includes("finalPrice")) {
                    element["Footer"] = (info) => {
                        const total = info.rows.filter(f => f.original.parentId === null && f.values.hasOwnProperty(element.accessor) && !isNaN(f.values[element.accessor])).reduce((sum, row) => row.values[element.accessor] + sum, 0)
                        return <>{currencySymbol} {formatAmountWithCurrency(rentalManagementData?.currency, total)?.amountWithouCurrencyCode ?? total}</>
                    }
                }
            });
            setColumns(coloum)
            fetchProductInventory();
        })
    }, []);

    const fetchProductInventory = () => {
        axiosInstance().get(`${rentalManagement.rentalManagementApi}/productpackage/${rentalManagementData._id}`).then(({ data: { data } }) => {
            setMaterial(JSON.parse(JSON.stringify(data.material)))
            const rows = data.material.filter((e) => e.parentId === null)
            rows.forEach((_row, i) => {
                _row.detail = `${(i + 1)} - ${_row.type === "product" ? _row.productDetail?.productName : _row.packageDetail?.packageDescription}`
                _row.qtyDisplay = _row.qty;
                _row.isValid = _row["finalPrice_" + rentalManagementData?.currency?.toLowerCase()] ? true : false;
                if (_row.type === "package") {
                    const subRows: any = data.material.filter((e) => e.parentId === _row._id);
                    subRows.forEach((_subRow, j) => {
                        _subRow.detail = (i + 1) + "." + (j + 1) + " - " + _subRow.productDetail?.productName
                        _subRow.qtyDisplay = `${_row.qty} x ${_subRow.qty} = ${_row.qty * _subRow.qty}`
                        _subRow.isValid = _subRow["finalPrice_" + rentalManagementData?.currency?.toLowerCase()] ? true : false;
                    })
                    _row.subRows = subRows
                }
            });
            if (rows.filter(_rows => _rows.isValid === false).length > 0 || rows.length === 0) {
                setNextStep(false)
            } else {
                setNextStep(true)
            }
            setRowsData(rows);
            setSelectedProducts([])
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    };

    const handleAdd = (rows) => {
        setAddingProducts(true)
        const material: any = []
        rows.forEach(d => {
            const element: any = {};
            element.materialId = d.id;
            element.type = d.type.toLowerCase();
            element.unit = d.unit && d.unit.length ? d.unit[0] : "";
            element.pricingMethod = d.pricingMethod && d.pricingMethod.length ? d.pricingMethod[0] : "";
            element.qty = d.qty ? d.qty : 1;
            element.startDate = rentalManagementData ? rentalManagementData?.rentalStartDate : new Date();
            element.endDate = rentalManagementData ? rentalManagementData?.rentalEndDate : new Date();
            element.parentId = addExistingProductDialog.parentId;
            const calValues = autoCalculateSpecificFields({ pricingMethod: element.pricingMethod }, element, allFields)
            element.tenure = 1;
            if (calValues && calValues["tenure"]) {
                element.tenure = calValues["tenure"];
            }
            material.push(element);
        });

        axiosInstance().post(`${rentalManagement.rentalManagementApi}/productpackage/${rentalManagementData._id}`, { material })
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
            delete element.detail
            delete element.qtyDisplay
            delete element.isValid
            delete element.productDetail
            delete element.packageDetail
            delete element.subRows
        });
        setUpdating(true);
        axiosInstance().put(`${rentalManagement.rentalManagementApi}/productpackage/${rentalManagementData._id}`, { material: rows }).then(() => {
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
        axiosInstance().put(`${rentalManagement.rentalManagementApi}/productpackage/${rentalManagementData?._id}/delete`, { ids: rows })
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

    const calculatePricing = (arr: any[]) => {
        //materialType can be =["product","packages","productCategory"]
        //conditionType can be =["Price","Rent","Discount","Charge","Tax"]
        if (rentalManagementData) {
            const data: any = {}
            data.conditionType = ["Rent"]
            data.material = arr.map(ele => ({
                materialId: ele?.id,
                materialType: ele?.type.includes("roduct") ? "product" : "packages",
                qty: ele?.qty,
                pricingMethod: ele?.pricingMethod,
                unit: ele?.UOM,
                currency: rentalManagementData?.currency
            }))
            data.supplier = [];
            data.customer = [rentalManagementData?.customerAccount.optionValue];
            data.warehouse = [];
            return new Promise((resolve, reject) => {
                axiosInstance().post(pricingConditionApi + `/calculatePrice`, data)
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
                <Box mx={1} />
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
            </Box>
            <Box display="flex">
                <HtmlTooltip title={Boolean(selectedProducts && selectedProducts.length) ? "Buld edit selected records" : "Select records to edit"}>
                    <span>
                        <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            disabled={!Boolean(selectedProducts && selectedProducts.length)}
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
                        disabled={!Boolean(selectedProducts && selectedProducts.length) || isDeleting}
                        onClick={() => {
                            const dataToDelete = selectedProducts && selectedProducts.map((rec: any) => {
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
                            ? "calc(100vw - 20px)"
                            : isSmallScreen
                                ? "calc(100vw - 78px)"
                                : showActivity ? "100%" : "calc(100vw - 100px)"
                    }
                    height="calc(100vh - 330px)"
                >
                    <CustomReactTable
                        height="calc(100vh - 345px)"
                        columns={columns}
                        data={rowsData}
                        isInValidCheck={(rowData) => !rowData.isValid}
                        onSelect={setSelectedProducts}
                        childrenProperty="subRows"
                        uniqueKey="_id"
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
            <RentalJobQtyDialog
                calculatePrice={calculatePricing}
                onClose={() => {
                    setIsProductEdit({ open: false, isBulkedit: false })
                    setRecordToUpdate(null)
                }}
                isBulkedit={isProductEdit.isBulkedit}
                handleSaveData={handleSaveData}
                rentalManagementData={rentalManagementData}
                rowData={recordToUpdate}
                material={material}
                selectedProducts={selectedProducts}
            />
        }
        {addExistingProductDialog.open &&
            <AddExistingProductInventory
                isAddingProducts={isAddingProducts}
                addProductInventory={handleAdd}
                handleProductInventoryClose={() => { setAddExistingProductDialog({ open: false, type: "", parentId: null }) }}
                productInventory={[]}
                type={addExistingProductDialog.type}
            />
        }
    </Fragment>
    );
};

export default Productpackage;
