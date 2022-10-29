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
import {
    MuiPickersUtilsProvider,
    KeyboardDatePicker,
    KeyboardTimePicker,
} from "@material-ui/pickers";
import MomentUtils from "@date-io/moment";
import { autoCalculateSpecificFields } from "src/constants/formulaUtility";
import styles from '../../Leads/Header.module.scss';
import HtmlTooltip from "src/components/CustomTooltipTitle";

const CreateBillingDialog = ({ rentalManagementData, currencySymbol, billData, estimateStartDate, onClose, onSuccess }) => {

    const toastConfig = useContext(CustomToastContext);
    const { state: { user, permissions } }: any = useData();

    const [isUpdating, setUpdating] = useState(false);

    const [selectedProducts, setSelectedProducts] = useState([]);
    const [material, setMaterial] = useState([]);
    const [productData, setProductData] = useState(null);
    const [columns, setColumns] = useState(null);
    const [rowsData, setRowsData] = useState(null);
    const [isRateRequired, setIsRateRequired] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);

    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [allFields, setAllFields] = useState([]);


    useEffect(() => {
        fetchFields();
    }, []);

    useEffect(() => {
        fetchProductInventory();
    }, [columns]);

    const fetchFields = async () => {
        var { fields: data, allFields } = await fetch_rental_product_fields(rentalManagementData?.currency, false);
        setAllFields(allFields)
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
        if (estimateStartDate || data?.material[0]?.estimateStartDate) {
            estimateStartDate ? setStartDate(estimateStartDate) : setStartDate(data?.material[0]?.estimateStartDate)
        }
        if (data?.material[0]?.estimateEndDate) {
            setEndDate(data?.material[0]?.estimateEndDate)
        }
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

    const handleApplyDate = async () => {
        let values = {
            "actualStartDate": startDate,
            "estimateStartDate": startDate,
            "actualEndDate": endDate,
            "estimateEndDate": endDate,
        }

        let rows: any = []
        selectedProducts.forEach(element => {
            const calValues = autoCalculateSpecificFields(values, { ...element, ...values }, allFields)
            if (element.type === "product") {
                rows.push({ ...element, ...calValues })
            }
            else if (element.type === "package") {
                rows.push({ ...element, ...calValues })
                const product = material.filter((e) => e.parentId === element._id)
                resetValueZero(product)
                rows = [...rows, ...product]
            }
        });
        let tempRows = material.map(obj => rows.find(o => o.materialId === obj.materialId) || obj);
        let tempProduct = productData
        tempProduct["material"] = tempRows
        setProductData(tempProduct)
        setMaterial(tempRows);
        initializeTable(tempProduct)
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
                    {billData === null && <>

                        <MuiPickersUtilsProvider utils={MomentUtils}>
                            <Grid container className={styles.rental_header_layout}>
                                <Grid item xs={12} md={6} sm={12} className="d-flex align-items-center gap-1 layout-for-tablet">
                                </Grid>
                                <Grid item xs={12} sm={12} md={6} className={styles.filter_side}>
                                    <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">
                                        <Grid style={{ display: 'flex', flex: 1, gap: '5px' }} className={isMobile ? styles.content_box : ''}>
                                            <KeyboardDatePicker
                                                autoOk
                                                fullWidth
                                                size="small"
                                                disablePast
                                                variant="inline"
                                                inputVariant="outlined"
                                                value={startDate}
                                                name="startDate"
                                                label="Start Date"
                                                onChange={(date: any) => {
                                                    setStartDate(date ? date : null);
                                                }}
                                                format={dateFormat}
                                                InputLabelProps={{
                                                    shrink: true,
                                                }}
                                                margin="dense"
                                            />
                                            <KeyboardDatePicker
                                                autoOk
                                                fullWidth
                                                size="small"
                                                disablePast
                                                variant="inline"
                                                inputVariant="outlined"
                                                minDate={startDate}
                                                value={endDate}
                                                name="endDate"
                                                label="End Date"
                                                onChange={(date: any) => {
                                                    setEndDate(date ? date : null);
                                                }}
                                                format={dateFormat}
                                                InputLabelProps={{
                                                    shrink: true,
                                                }}
                                                margin="dense"
                                            />
                                            <Grid style={{ display: 'flex', gap: '5px', marginTop: '15px' }}>
                                                <HtmlTooltip title={!Boolean(selectedProducts && selectedProducts.length) ? "Please select product to apply" : ""}>
                                                    <span>
                                                        <Button
                                                            variant='contained'
                                                            color="primary"
                                                            disabled={!Boolean(selectedProducts && selectedProducts.length)}
                                                            size="small"
                                                            onClick={() => { handleApplyDate() }}
                                                        >
                                                            Apply
                                                        </Button>
                                                    </span>
                                                </HtmlTooltip>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                </Grid>
                            </Grid>
                        </MuiPickersUtilsProvider>
                    </>}
                    {columns && rowsData ? (
                        <Box
                            zIndex={5}
                            width={'100%'}
                            height={"calc(100vh - 285px)"}
                            p={1}
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
        </Dialog >

    </Fragment >
    );
}

export default CreateBillingDialog;

function resetValueZero(product: any[]) {
    throw new Error("Function not implemented.");
}
