import { useState, useEffect, useContext, useReducer, Fragment } from "react";
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../../axios/axiosInstance";
import { Box, Chip, CircularProgress, Dialog, IconButton, Menu, MenuItem } from "@material-ui/core";
import { useData } from "src/StateProvider/Provider";
import { fetch_rental_product_fields } from "src/components/RentalManagment/helper";
import { isMobile } from "react-device-detect";
import routes from "src/components/Helpers/Routes";
import moment from "moment";
import { CustomDialogTransition, dateFormat, formatAmountWithCurrency, pricingCondition, rentalManagement } from "src/constants/helpers";
import NoDataCell from "src/components/Helpers/NoDataCell";
import CustomDialogHeader from "src/components/CustomDialog/CustomDialogHeader";
import CustomReactTable from "src/components/CustomReactTable/CustomReactTable";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import RentalJobQtyDialog from "../Productpackage/RentalJobQtyDialog";
import { Edit, ExpandMore } from "@material-ui/icons";
import CustomDialogFooter from "src/components/CustomDialog/CustomDialogFooter";
import CustomDialogContent from "src/components/CustomDialog/CustomDialogContent";

const CreateBillingDialog = ({ rentalManagementData, currencySymbol, billData, onClose, onSuccess }) => {

    const toastConfig = useContext(CustomToastContext);
    const { state: { user, permissions } }: any = useData();

    const [isUpdating, setUpdating] = useState(false);

    const [selectedProducts, setSelectedProducts] = useState([]);
    const [isProductEdit, setIsProductEdit] = useState({ open: false, isBulkedit: false });

    const [recordToUpdate, setRecordToUpdate] = useState(null);

    const [material, setMaterial] = useState([]);
    const [productData, setProductData] = useState(null);
    const [columns, setColumns] = useState(null);
    const [rowsData, setRowsData] = useState(null);
    const [isRateRequired, setIsRateRequired] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);


    useEffect(() => {
        fetchFields();
    }, []);

    useEffect(() => {
        fetchProductInventory();
    }, [columns]);

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
                        {(billData ? <p>
                            {row.original.detail}
                        </p> :
                            <p
                                onClick={() => {
                                    handleOpen(row.original);
                                }}
                                className="link text-truncate"
                                title={row.original.detail}
                            >
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
                                label={`${row.original.type === 'product' ?
                                    !row.original.serializedProduct ? "Non-Serialized Product" : "Product" : "Package"}`}
                                size="small"
                                color="primary"
                                onClick={() => {
                                    window.open(
                                        `${row.original.type === 'product' ? routes.productDetail.path : routes.packagesDetail.path}/${row.original.materialId}`
                                    );
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
            if (element.fieldName === "price" && element.required) {
                setIsRateRequired(true);
            }
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
        {
            isMobile || billData ? <Box display={"none"} /> : coloum.push({
                accessor: 'action',
                Header: '',
                minWidth: 50,
                width: 50,
                sticky: 'right',
                disableFilters: true,
                canDrag: false,
                Cell: ({ row }) =>
                    <IconButton
                        size="small"
                        aria-label="Details"
                        onClick={() => { handleOpen(row.original); }}
                    >
                        <Edit fontSize="small" />
                    </IconButton>
            });
        }
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

    const fetchProductInventory = async () => {
        var data: any = [];

        if (billData) {
            data = billData
        }
        else {
            const response = await axiosInstance().get(`${rentalManagement.api}/productpackage/${rentalManagementData._id}`);
            data = response?.data?.data;
        }
        setMaterial(JSON.parse(JSON.stringify(data.material)));
        setProductData(data)
        initializeTable(data)
    };

    const initializeTable = (data) => {
        var inventory: any = [];
        var nonSerializeAsset: any = [];
        inventory = data?.inventory;
        nonSerializeAsset = data?.nonSerializeAsset;
        const rows = data.material.filter((e) => e.parentId === null);
        rows.forEach((parent, i) => {
            parent.srno = (i + 1);
            parent.detail = `${parent.type === 'product' ? parent.productDetail?.productName : parent.packageDetail?.packageName}`;
            parent.serializedProduct = parent.type === 'product' ? parent.productDetail?.serializedProduct : false;
            parent.qtyDisplay = parent.qty;
            parent.isValid = parent['finalPrice_' + rentalManagementData?.currency?.toLowerCase()] ? true : !isRateRequired;
            parent.assetQty = parent.serializedProduct ? inventory?.filter((e) => e._id === parent._id).length : nonSerializeAsset?.filter((e) => e._id === parent._id).length;
            parent.subRows = generateNestedData(data.material, inventory, nonSerializeAsset, parent);
        });
        setRowsData(rows);
        setSelectedProducts([]);
    };

    const generateNestedData = (material, inventory, nonSerializeAsset, parent) => {
        const subRows: any = material.filter((e) => e.parentId === parent._id);
        subRows.forEach((_subRow, j) => {
            _subRow.srno = parent.srno + '.' + (j + 1);
            _subRow.detail = _subRow?.productDetail?.productName;
            _subRow.serializedProduct = _subRow?.productDetail?.serializedProduct;
            _subRow.qtyDisplay = `${parent.qtyDisplay * _subRow.qty}`;
            _subRow.isValid = _subRow['finalPrice_' + rentalManagementData?.currency?.toLowerCase()] ? true : !isRateRequired;
            _subRow.assetQty = _subRow.serializedProduct ? inventory?.filter((e) => e._id === _subRow._id).length : nonSerializeAsset?.filter((e) => e._id === _subRow._id).length;
            _subRow.subRows = generateNestedData(material, inventory, nonSerializeAsset, _subRow);
        });
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


    const handleSaveData = (rows: any) => {
        let tempRows = material.filter(d => !rows.map(ele => ele.materialId).includes(d.materialId))
        let tempProduct = productData
        tempProduct["material"] = [...tempRows, ...rows]
        setProductData(tempProduct)
        setMaterial([...tempRows, ...rows]);
        initializeTable(tempProduct)
        setIsProductEdit({ open: false, isBulkedit: false });
    };

    const handleSave = () => {
        rowsData.forEach((element) => {
            delete element.srno
            delete element.detail;
            delete element.serializedProduct;
            delete element.qtyDisplay;
            delete element.isValid;
            delete element.hideSelection;
            delete element.assetQty;
            delete element.productDetail;
            delete element.packageDetail;
            delete element.subRows;
        });
        setUpdating(true);
        axiosInstance()
            .put(`${rentalManagement.api}/${rentalManagementData._id}/progressive-billing`, { material: rowsData })
            .then(() => {
                setUpdating(false);
                setIsProductEdit({ open: false, isBulkedit: false });
            })
            .catch((error) => {
                setUpdating(false);
                toastConfig.setToastConfig(error);
            });
    };
    const handleCreateBill = () => {
        rowsData.forEach((element) => {
            delete element.srno
            delete element.detail;
            delete element.serializedProduct;
            delete element.qtyDisplay;
            delete element.isValid;
            delete element.hideSelection;
            delete element.assetQty;
            delete element.productDetail;
            delete element.packageDetail;
            delete element.subRows;
        });
        setUpdating(true);
        axiosInstance()
            .post(`${rentalManagement.api}/${rentalManagementData._id}/progressive-billing`, { material: rowsData })
            .then(() => {
                onSuccess()
            })
            .catch((error) => {
                setUpdating(false);
                toastConfig.setToastConfig(error);
            });
    };


    const handleOpen = (rowData) => {
        setIsProductEdit({ open: true, isBulkedit: false });
        setRecordToUpdate(rowData);
    };

    const calculatePrice = (arr: any[]) => {
        //materialType can be =["product","packages","productCategory"]
        //conditionType can be =["Price","Rent","Discount","Charge","Tax"]
        if (rentalManagementData) {
            const data: any = {};
            data.conditionType = ['Rent'];
            data.material = arr.map((ele) => ({
                materialId: ele?.materialId,
                materialType: ele?.type,
                qty: ele?.qty,
                pricingMethod: ele?.pricingMethod,
                unit: ele?.unit,
                currency: rentalManagementData?.currency
            }));
            data.supplier = [];
            data.customer = [rentalManagementData?.customerAccount?.optionValue];
            data.warehouse = [rentalManagementData?.warehouse?.optionValue];
            return new Promise((resolve, reject) => {
                axiosInstance()
                    .post(pricingCondition.api + `/calculatePrice`, data)
                    .then(({ data: { data } }) => {
                        resolve(data);
                    })
                    .catch((err) => {
                        reject(err);
                    });
            });
        }
    };

    const openActions = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const closeActions = () => {
        setAnchorEl(null);
    };

    return (<Fragment>
        <Dialog
            fullScreen={true}
            TransitionComponent={CustomDialogTransition}
            aria-labelledby="customized-dialog-title"
            open={true}
        >
            <CustomDialogHeader title={billData ? `Bill Number : ${billData?.billNumber}` : `Create Billing `} onClose={onClose} showRequiredLabel={false}></CustomDialogHeader>
            <CustomDialogContent>
                <Fragment>
                    <Box display="flex" justifyContent="flex-end" mb={1}>
                        {/* <Button
                        variant='contained'
                        color="primary"
                        size="small"
                        onClick={() => { handleSave() }}
                    >
                        Save
                    </Button>
                    <Box mx={1} /> */}
                        {billData === null && <Button
                            variant="outlined"
                            color="default"
                            size="small"
                            onClick={openActions}
                            aria-controls="action-menu"
                            endIcon={isMobile ? <ExpandMore style={{ width: '12px', height: '12px' }} /> : <ExpandMore />}
                        >
                            {'Actions'}
                        </Button>}
                        <Menu
                            anchorEl={anchorEl}
                            keepMounted
                            getContentAnchorEl={null}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'left'
                            }}
                            id="action-menu"
                            open={Boolean(anchorEl)}
                            onClose={closeActions}
                        >
                            <MenuItem
                                disabled={!Boolean(selectedProducts && selectedProducts.length)}
                                onClick={() => { setIsProductEdit({ open: true, isBulkedit: true }) }}
                            >
                                Bulk Edit
                            </MenuItem>
                        </Menu>

                    </Box>
                    {columns && rowsData ? (
                        <Box
                            zIndex={5}
                            width={'100%'}
                            height={"calc(100vh - 285px)"}
                        >
                            <CustomReactTable
                                height={"calc(100vh - 285px)"}
                                columns={columns}
                                data={rowsData}
                                onSelect={setSelectedProducts}
                                childrenProperty="subRows"
                                uniqueKey="_id"
                                hideSelection={billData ? true : false}
                                renderedFrom="rental_management_create_billing"
                                isClientSideGrid={true}
                            />
                        </Box>
                    ) : (
                        <Box p={2} height={500} bgcolor="white">
                            <CommonSkeleton lenArray={[...Array(10).keys()]} />
                        </Box>
                    )}
                </Fragment>
            </CustomDialogContent>
            <CustomDialogFooter>
                <Button
                    type="button"
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={() => { onClose() }}
                >
                    Cancel
                </Button>
                {billData === null && <Button
                    type="button"
                    variant='contained'
                    color="primary"
                    size="small"
                    onClick={() => { handleCreateBill() }}
                >
                    Create Bill
                </Button>}
            </CustomDialogFooter>

            {isProductEdit.open && (
                <RentalJobQtyDialog
                    calculatePrice={calculatePrice}
                    onClose={() => {
                        setIsProductEdit({ open: false, isBulkedit: false });
                        setRecordToUpdate(null);
                    }}
                    isBulkedit={isProductEdit.isBulkedit}
                    handleSaveData={handleSaveData}
                    rentalManagementData={rentalManagementData}
                    rowData={recordToUpdate}
                    material={material}
                    selectedProducts={selectedProducts}
                    loading={isUpdating}
                />
            )}
        </Dialog >

    </Fragment >
    );
}

export default CreateBillingDialog;