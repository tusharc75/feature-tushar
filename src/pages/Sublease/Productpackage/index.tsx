import { useState, useEffect, useContext, Fragment } from "react";
import { Grid, Box, Button, IconButton, CircularProgress } from "@material-ui/core";
import axiosInstance from "../../../axios/axiosInstance";
import routes from "../../../components/Helpers/Routes";
import { useData } from "../../../StateProvider/Provider";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import HtmlTooltip from "../../../components/CustomTooltipTitle";
import { CURReplaceByCurrencySingle } from "../../../constants/formulaUtility";
import AddExistingProductInventory from "./AddExistingProductInventory";
import CustomReactTable from "../../../components/CustomReactTable/CustomReactTable";
import NoDataCell from "../../../components/Helpers/NoDataCell";
import Add from "@material-ui/icons/Add";
import DeleteIcon from "@material-ui/icons/Delete";
import moment from "moment";
import { sublease, dateFormat, pricingCondition, formatAmountWithCurrency, CHILD_RESOURCE, SUBLEASE_STATUS } from "../../../constants/helpers";
import ConfirmationDialog from "../../../components/Helpers/ConfirmationDialog";
import QtyDialog from './QtyDialog'
import { autoCalculateSpecificFields } from "../../../constants/formulaUtility";
import InfoIcon from "@material-ui/icons/Info";
import { CustomOfflineContext } from "../../../StateProvider/OfflineContext/OfflineContext";
import { objectStore, findOne } from '../../../constants/indexdbhelper';
import { isMobile, isTablet } from "react-device-detect";
import { MdAdd, MdDelete } from "react-icons/md";
import { FiPackage } from "react-icons/fi";
import { RiEditCircleLine } from "react-icons/ri";
import { fetch_sublease_product_fields } from "../../../components/Sublease/helper";

const Productpackage = ({ subleaseData, setNextStep, fetchData, isIssued, renderedFrom }) => {

    const toastConfig = useContext(CustomToastContext);
    const { state: { user, permissions } }: any = useData();

    const [isUpdating, setUpdating] = useState(false);

    const [selectedProducts, setSelectedProducts] = useState([])
    const [isProductEdit, setIsProductEdit] = useState({ open: false, isBulkedit: false });
    const [isAddingProducts, setAddingProducts] = useState(false);

    const [recordToUpdate, setRecordToUpdate] = useState(null)

    const [deleteData, setDeleteData] = useState(null);
    const [isDeleting, setDeleting] = useState(false);
    const [isIssueing, setIssueing] = useState(false);

    const [material, setMaterial] = useState([]);
    const [addExistingProductDialog, setAddExistingProductDialog] = useState({ open: false, type: "", parentId: null });
    const [columns, setColumns] = useState(null);
    const [rowsData, setRowsData] = useState(null);
    const [allFields, setAllFields] = useState([]);
    const [isRateRequired, setIsRateRequired] = useState(false);

    useEffect(() => {
        fetchFields()
    }, []);

    useEffect(() => {
        fetchProductInventory();
    }, [columns]);

    const fetchFields = async () => {
        var data = await fetch_sublease_product_fields(subleaseData.currency)
        setAllFields(JSON.parse(JSON.stringify(data)))
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
                sticky: isMobile ? "none" : "left",
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
                ),
                Footer: () => {
                    return <>Total</>
                }
            }]
        data.forEach(element => {
            if (element.fieldName === "price" && element.required) {
                setIsRateRequired(true);
            }
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
                                    row.original[fieldName] ? <p>{formatAmountWithCurrency(subleaseData?.currency, row.original[fieldName])?.amountWithouCurrencyCode}</p> : <NoDataCell />
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
                                row.original[fieldName] ? <p>{formatAmountWithCurrency(subleaseData?.currency, row.original[fieldName])?.amountWithouCurrencyCode}</p> : <NoDataCell />
                            ),
                            Footer: (info) => {
                                const total = info?.rows?.filter(f => f.original.parentId === null && f.values.hasOwnProperty(fieldName) && !isNaN(f.values[fieldName])).reduce((sum, row) => row.values[fieldName] + sum, 0)
                                return <>{formatAmountWithCurrency(subleaseData?.currency, total)?.amountWithouCurrencyCode ?? total}</>
                            }
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
        coloum.push({
            accessor: 'action',
            Header: '',
            minWidth: 50,
            width: 50,
            sticky: "right",
            disableFilters: true,
            Cell: ({ row }) => (
                !row.original.hideSelection &&
                <IconButton
                    size="small"
                    aria-label="Details"
                    onClick={() => {
                        const obj: any = [{ id: row.original._id, type: row.original?.type, materialId: row.original?.materialId }];
                        if (row.original?.type === 'package' && row.original?.subRows?.length) {
                            row.original?.subRows.forEach(element => {
                                obj.push({ id: element._id, type: element.type, materialId: element.materialId })
                            });
                        }
                        setDeleteData(obj)
                    }}
                >
                    <DeleteIcon fontSize="small" color="error" />
                </IconButton >
            )
        })
        coloum.forEach(element => {
            if (element.accessor === "qtyDisplay") {
                element["Footer"] = (info) => {
                    const qtyTotal = info.rows.filter(f => f.original.parentId === null && f.values.hasOwnProperty(element.accessor) && !isNaN(f.values[element.accessor])).reduce((sum, row) => row.values[element.accessor] + sum, 0)
                    return <>{qtyTotal}</>
                }
            }
        });
        setColumns(coloum)
    }

    const fetchProductInventory = async () => {
        setNextStep(false)
        var data: any = []
        var inventory: any = []
        const response = await axiosInstance().get(`${sublease.api}/productpackage/${subleaseData._id}`)
        data = response?.data?.data
        setMaterial(JSON.parse(JSON.stringify(data.material)))
        inventory = data.inventory;
        const rows = data.material.filter((e) => e.parentId === null)
        rows.forEach((parent, i) => {
            parent.srno = (i + 1)
            parent.detail = `${parent.type === "product" ? parent.productDetail?.productName : parent.packageDetail?.packageName}`
            parent.qtyDisplay = parent.qty;
            parent.isValid = parent["finalPrice_" + subleaseData?.currency?.toLowerCase()] ? true : !isRateRequired;
            parent.hideSelection = parent.assetQty > 0 ? true : false;
            parent.assetQty = parent.assetQty;
            if (parent.type === "package") {
                const subRows: any = data.material.filter((e) => e.parentId === parent._id);
                var assetQty = 0;
                subRows.forEach((_subRow, j) => {
                    _subRow.srno = (i + 1) + "." + (j + 1)
                    _subRow.detail = _subRow.productDetail?.productName
                    _subRow.qtyDisplay = `${parent.qty * _subRow.qty}`
                    _subRow.isValid = _subRow["finalPrice_" + subleaseData?.currency?.toLowerCase()] ? true : !isRateRequired;
                    _subRow.hideSelection = _subRow.assetQty > 0 ? true : false;
                    _subRow.assetQty = _subRow.assetQty;
                    assetQty += _subRow.assetQty
                })
                if (subRows.length === 0) {
                    parent.isValid = false
                }
                parent.assetQty = assetQty;
                parent.hideSelection = subRows.filter((e) => e.hideSelection).length ? true : false;
                parent.subRows = subRows
            }
        });
        if (rows.filter(_rows => _rows.isValid === false).length > 0 || rows.length === 0 || inventory.length === 0) {
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
            element.unit = d.unitMain && d.unitMain.length ? d.unitMain[0] : "";
            element.pricingMethod = d.pricingMethodMain && d.pricingMethodMain.length ? d.pricingMethodMain[0] : "";
            element.qty = d.qty ? parseFloat(d.qty) : 1;
            element.estimateStartDate = subleaseData ? subleaseData?.estimateStartDate : new Date();
            element.estimateEndDate = subleaseData ? subleaseData?.estimateEndDate : new Date();
            element.actualStartDate = "";
            element.actualEndDate = "";
            element.actualJobDuration = "";
            element.assetQty = 0;
            element.parentId = addExistingProductDialog.parentId;
            const calValues = autoCalculateSpecificFields({ pricingMethod: element.pricingMethod }, element, allFields)
            element.estimateJobDuration = 1;
            if (calValues && calValues['estimateJobDuration']) {
                element.estimateJobDuration = calValues['estimateJobDuration'];
            }
            material.push(element);
        });

        const priceData: any = await calculatePrice(material);
        material.forEach(element => {
            const rateResult = priceData?.filter((e) => e.materialId === element.materialId &&
                e.materialType === element.type && e.unit === element.unit && e.pricingMethod === element.pricingMethod)
            if (rateResult.length && rateResult[0].mrp) {
                const priceFieldName = `price_${subleaseData?.currency?.toLowerCase()}`
                element[priceFieldName] = rateResult[0].mrp;
                const calValues = autoCalculateSpecificFields({ [priceFieldName]: rateResult[0].mrp }, element, allFields)
                Object.assign(element, calValues);
            }
        })

        axiosInstance().post(`${sublease.api}/productpackage/${subleaseData._id}`, { material })
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
            delete element.productDetail
            delete element.packageDetail
            delete element.subRows
        });
        setUpdating(true);
        axiosInstance().put(`${sublease.api}/productpackage/${subleaseData._id}`, { material: rows }).then(() => {
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
        axiosInstance().put(`${sublease.api}/productpackage/${subleaseData?._id}/delete`, { ids: rows })
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

    const issueSublease = () => {
        setIssueing(true);
        axiosInstance().put(`${sublease.api}/${subleaseData._id}/issue-sublease`).then(() => {
            setIssueing(false);
            fetchData()
        }).catch((error) => {
            setUpdating(false)
            toastConfig.setToastConfig(error)
        });
    }

    const calculatePrice = (arr: any[]) => {
        if (subleaseData) {
            const data: any = {}
            data.conditionType = ["Rent"]
            data.material = arr.map(ele => ({
                materialId: ele?.materialId,
                materialType: ele?.type,
                qty: ele?.qty,
                pricingMethod: ele?.pricingMethod,
                unit: ele?.unit,
                currency: subleaseData?.currency
            }))
            data.supplier = [subleaseData?.supplierAccount?.optionValue];
            data.customer = [];
            data.warehouse = [];
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
        <Grid container spacing={2} >
            <Grid item xs={12} md={12} sm={12} >
                <Box display="flex" justifyContent="space-between" m={1}>
                    <Box display="flex">
                        {subleaseData.status === SUBLEASE_STATUS.new &&
                            <Fragment>
                                <Button
                                    variant={isMobile && !isTablet ? "text" : "contained"}
                                    color="primary"
                                    size="small"
                                    style={isMobile && !isTablet ? { color: "var(--secondary)" } : {}}
                                    onClick={() => {
                                        setAddExistingProductDialog({ open: true, type: "product", parentId: null });
                                    }}
                                >
                                    {isMobile && !isTablet ? <MdAdd size={20} /> : `Add ${routes.product.title}`}
                                </Button>
                                <Box mx={1} />
                                <Button
                                    variant={isMobile && !isTablet ? "text" : "contained"}
                                    color="primary"
                                    size="small"
                                    style={isMobile && !isTablet ? { color: "var(--colorOpportunity)" } : {}}
                                    onClick={() => {
                                        setAddExistingProductDialog({ open: true, type: "package", parentId: null });
                                    }}
                                >
                                    {isMobile && !isTablet ? <FiPackage size={18} /> : `Add ${routes.packages.title}`}
                                </Button>
                            </Fragment>
                        }
                    </Box>
                    <Box display="flex">
                        <HtmlTooltip title={Boolean(selectedProducts && selectedProducts.length) ? "Bulk edit selected records" : "Select records to edit"}>
                            <span>
                                <Button
                                    variant={isMobile && !isTablet ? "text" : "contained"}
                                    color="primary"
                                    size="small"
                                    style={isMobile && !isTablet ? { color: "var(--info-dark)" } : {}}
                                    disabled={!Boolean(selectedProducts && selectedProducts.filter((e) => !e.hideSelection).length)}
                                    onClick={() => setIsProductEdit({ open: true, isBulkedit: true })}
                                >
                                    {isMobile && !isTablet ? <RiEditCircleLine size={20} /> : "Bulk Edit"}
                                </Button>
                            </span>
                        </HtmlTooltip>
                        <Box mx={1} />
                        <HtmlTooltip title={Boolean(selectedProducts && selectedProducts.length) ? "Delete selected records" : "Select records to delete"}>
                            <Button
                                variant={isMobile && !isTablet ? "text" : "contained"}
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
                                {isMobile && !isTablet ? <MdDelete size={20} /> : "Delete"}
                            </Button>
                        </HtmlTooltip>
                        <Box mx={1} />
                        {(material.length && !isIssued && !rowsData?.some(f => !f.isValid)) ?
                            <Fragment>
                                <HtmlTooltip title={"Start Sublease"}>
                                    <Button
                                        variant={isMobile && !isTablet ? "text" : "contained"}
                                        color="primary"
                                        size="small"
                                        onClick={() => { issueSublease() }}
                                        disabled={isIssueing}
                                        endIcon={isIssueing && <CircularProgress size={20} color="primary" />}
                                    >
                                        {isMobile && !isTablet ? <MdDelete size={20} /> : "Start Sublease"}
                                    </Button>
                                </HtmlTooltip>
                                <Box mx={1} />
                            </Fragment>
                            : null}
                    </Box>
                </Box>
            </Grid>
            <Grid item xs={12} md={12} sm={12} >
                {columns && rowsData ?
                    <Box
                        zIndex={5}
                        width={"calc(100vw - 103px)"}
                        height="calc(100vh - 350px)"
                    >
                        <CustomReactTable
                            height="calc(100vh - 345px)"
                            columns={columns}
                            data={rowsData}
                            setCellColor={(rowData) => !rowData.isValid ? "error" : ""}
                            onSelect={setSelectedProducts}
                            childrenProperty="subRows"
                            uniqueKey="_id"
                            renderedFrom="sublease_product_package"
                            isClientSideGrid={true}
                        />
                    </Box>
                    : <Box p={2} height={500} bgcolor="white">
                        <CommonSkeleton lenArray={[...Array(10).keys()]} />
                    </Box>
                }
            </Grid>
        </Grid>
        {deleteData && <ConfirmationDialog
            open={true}
            message={`Are you sure you want to delete the record(s)?`}
            onClose={() => setDeleteData(null)}
            onOk={() => handleDelete(deleteData)}
            okBtnLoading={isDeleting}
        />}
        {isProductEdit.open &&
            <QtyDialog
                calculatePrice={calculatePrice}
                onClose={() => {
                    setIsProductEdit({ open: false, isBulkedit: false })
                    setRecordToUpdate(null)
                }}
                isBulkedit={isProductEdit.isBulkedit}
                handleSaveData={handleSaveData}
                rentalManagementData={subleaseData}
                rowData={recordToUpdate}
                material={material}
                selectedProducts={selectedProducts}
                loading={isUpdating}
            />
        }
        {addExistingProductDialog.open &&
            <AddExistingProductInventory
                isAddingProducts={isAddingProducts}
                addProductInventory={handleAdd}
                handleProductInventoryClose={() => { setAddExistingProductDialog({ open: false, type: "", parentId: null }) }}
                type={addExistingProductDialog.type}
                renderedFrom={addExistingProductDialog.type === 'product' ? `${renderedFrom}-product` : `${renderedFrom}-package`}
            />
        }
    </Fragment>
    );
};

export default Productpackage;
