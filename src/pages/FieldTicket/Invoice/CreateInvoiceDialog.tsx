import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import { Box, Checkbox, Chip, CircularProgress, Dialog, FormControlLabel, FormGroup, IconButton, Menu, MenuItem, Tooltip } from '@material-ui/core';
import { useData } from 'src/StateProvider/Provider';
import { isMobile } from 'react-device-detect';
import routes from 'src/components/Helpers/Routes';
import moment from 'moment';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition, dateFormat, fieldTicket } from 'src/constants/helpers';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { fetch_field_ticket_material_fields } from '../helper';
import { generateCustomTableColumns } from 'src/constants/columns';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import EditIcon from '@material-ui/icons/Edit';
import { startCase } from 'lodash';
import { autoCalculateSpecificFields } from 'src/constants/formulaUtility';
import styles from '../../Leads/Header.module.scss';
import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';




const CreateInvoiceDialog = ({ id, fieldTicketData, renderedFrom, invoiceData, onSuccess, onClose }) => {
    const toastConfig = useContext(CustomToastContext);
    const {
        state: { user, permissions }
    }: any = useData();

    const [columns, setColumns] = useState(null);
    const [rowsData, setRowsData] = useState(null);
    const [selectedRecords, setSelectedRecords] = useState([]);
    const [isUpdating, setUpdating] = useState(false);
    const [allFields, setAllFields] = useState([]);
    const [material, setMaterial] = useState([]);
    const [orginalMaterial, setOrginalMaterial] = useState([]);
    const [appliedDate, setAppliedDate] = useState(false);
    const [rowsApplied, setRowsApplied] = useState([]);
    const [endDate, setEndDate] = useState(null);


    useEffect(() => {
        fetchFields();
    }, []);

    useEffect(() => {
        if (columns) {
            fetchData();
        }
    }, [columns]);

    const fetchFields = async () => {
        setColumns(null);
        var { fields: data, allFields } = await fetch_field_ticket_material_fields(fieldTicketData?.currency);

        const newColumns = generateCustomTableColumns(data, fieldTicketData?.currency, renderedFrom);
        let qtyIndex = newColumns.findIndex((d) => d.accessor === 'qty');
        if (qtyIndex > -1) {
            newColumns[qtyIndex].accessor = 'qtyDisplay';
        }
        setAllFields(JSON.parse(JSON.stringify(allFields)));
        let column: any = [
            {
                accessor: 'srno',
                Header: 'Index',
                width: 70,
                sticky: isMobile ? 'none' : 'left',
                Cell: ({ row }) => <p className="text-truncate">{row.original.srno}</p>,
                Footer: () => {
                    return <>Total</>;
                }
            },
            {
                accessor: 'type',
                Header: 'Type',
                sticky: isMobile ? 'none' : 'left',
                width: 150,
                disableFilters: true,
                Cell: ({ row }) =>
                    row.original['type'] ? (
                        <p> {`${startCase(row.original?.type)} `} </p>
                    ) : (
                        <NoDataCell />
                    )
            },
            {
                accessor: 'detail',
                Header: 'Details',
                minWidth: 300,
                width: 300,
                sticky: isMobile ? 'none' : 'left',
                Cell: ({ row }) => (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <p> {row.original.detail}</p>
                        {row.original['type'] !== 'additionalCost' && (
                            <Box ml={1}>
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        if (row?.original?.type === 'product' || row?.original?.type === 'service') {
                                            let path = routes.serviceMasterDetail.path;
                                            if (row?.original?.type === 'product') {
                                                path = routes.productDetail.path;
                                            }
                                            window.open(`${path}/${row.original.materialId}`);
                                        }
                                    }}
                                >
                                    <OpenInNewIcon fontSize="small" color="primary" />
                                </IconButton>
                            </Box>
                        )}
                    </div>
                )
            },
            {
                accessor: 'description',
                Header: 'Description',
                width: 200,
                Cell: ({ row }) => {
                    return row.original['description'] ? <p className="text-truncate">{row.original.description}</p> : <NoDataCell />;
                }
            }
        ];
        column = [...column, ...newColumns];
        setColumns(column);
    };

    const fetchData = async () => {
        let data = [];

        let additionalCost: any = [];
        let invoicedProducts: any = [];


        const response = await axiosInstance().get(`/field-ticket/${id}/material`);
        const material = response?.data?.data?.material?.filter((d) => d?.type === 'service')

        const invoiceResponse = await axiosInstance().get(`/field-ticket/${id}/invoice/material-end-date-qty`);
        additionalCost = invoiceResponse?.data?.data?.additionalCost;
        invoicedProducts = invoiceResponse?.data?.data?.material;

        const responseAdditionalCostData = await axiosInstance().get(`/field-ticket/${id}/cost`);
        let additionalCostData = responseAdditionalCostData?.data?.data || [];

        if (additionalCost?.length > 0) {
            additionalCostData = additionalCostData.filter((d) => !additionalCost?.some((obj) => obj._id === d._id));
        }

        material?.forEach((parent, i) => {
            parent.srno = i + 1;
            parent.detail =
                parent?.type === 'service' ?
                    parent?.serviceDetail?.serviceName
                    :
                    parent?.type === 'product' ?
                        parent?.productDetail?.productName
                        :
                        ''
            parent.description =
                parent?.type === 'service' ?
                    parent?.serviceDetail?.serviceDescription || ''
                    :
                    parent?.type === 'product' ?
                        parent?.productDetail?.productDescription
                        :
                        '- - -'
            parent.qtyDisplay = parent.qty;
            parent.type = parent.type;
            if (parent?.estimateStartDate || parent?.estimateEndDate) {
                parent['actualStartDate'] = parent?.estimateStartDate;
                parent['actualEndDate'] = parent?.estimateEndDate;
            }
        });

        if (additionalCostData?.length > 0) {
            additionalCostData.forEach((element, i) => {
                element.srno = material?.length + i + 1;
                element.type = 'additionalCost';
                element.qtyDisplay = element.qty;
                element.detail = '';
                element.materialId = element?._id;
            });
        }
        data = [...material, ...additionalCostData]

        if (invoiceData) {
            data = data?.map((e) => {
                let materialData: any = { ...e };

                let pMethod = materialData?.pricingMethod?.split(',') || [];
                pMethod = pMethod.map((m) => m?.trim()).find((m) => !['Per Day', 'Per Week', 'Per Month'].includes(m));
                if (!['Per Day', 'Per Week', 'Per Month'].includes(materialData?.pricingMethod) || materialData?.pricingMethod === pMethod) {
                    let tempTotalPrevQty = invoiceData
                        ?.map((obj) => {
                            let tempQty = obj.material?.find((ele) => ele._id === materialData._id)?.qty;
                            if (tempQty) return tempQty;
                        })
                        .filter((d) => d);

                    tempTotalPrevQty = tempTotalPrevQty.reduce((a, b) => a + b, 0);
                    let values = { qty: materialData.qty - tempTotalPrevQty };
                    const calValues = autoCalculateSpecificFields(values, { ...materialData, ...values }, allFields);

                    materialData = { ...materialData, ...calValues };

                }
                const product = invoicedProducts?.find((p) => p._id === e._id);
                if (product) {
                    const estimateStartDate = new Date(product?.endDate)?.setDate(new Date(product?.endDate)?.getDate() + 1);
                    materialData.actualStartDate = estimateStartDate;
                    materialData.estimateStartDate = estimateStartDate;
                }

                const row: any = invoiceData[0]?.material.find((m) => m._id === e._id);
                if (row) {
                    const estimateEndDate
                        = new Date(product?.endDate
                        )?.setDate(new Date(product?.endDate
                        )?.getDate() + 1);
                    materialData.actualEndDate = estimateEndDate;
                    materialData.estimateEndDate = estimateEndDate;
                    setEndDate(estimateEndDate
                    );
                }
                return materialData;
            })
                .filter((d) => d.qty > 0);
        }

        setRowsData(data);
        setMaterial(data);
        setOrginalMaterial(data);
        setSelectedRecords([]);
    }

    const handleApplyDate = async () => {
        let tempValues: any = { actualEndDate: endDate, estimateEndDate: endDate };

        const invoiceResponse = await axiosInstance().get(`/field-ticket/${id}/invoice/material-end-date-qty`);
        const invoicedProducts = invoiceResponse?.data?.data?.material;

        let rows: any = [];
        selectedRecords.forEach((element) => {
            if (element.type === 'additionalCost') {
                element.isAppliedBill = true;
                rows.push(element);
            } else {
                element.invalidDate = false;

                const product = invoicedProducts?.find((p) => p._id === element._id);

                const productStartDateTime = new Date(new Date(element.estimateStartDate).toLocaleDateString()).getTime();
                const selectedEndDate = new Date(endDate?.format('MM/DD/YYYY')).getTime();

                if (selectedEndDate < productStartDateTime) {
                    element.invalidDate = true;
                } else if (product) {
                    element.invalidDate = false;

                }

                let priceFieldName = Object.keys(element).find((d) => d.includes('price_'));

                let calValues: any;
                let values = JSON.parse(JSON.stringify(tempValues));
                if (element.pricingMethod === 'Per Week') {
                    values['pricingMethod'] = 'Per Day';
                    if (priceFieldName) {
                        values[priceFieldName] = orginalMaterial.find((d) => d._id === element._id)[priceFieldName] / 7;
                    }
                    calValues = autoCalculateSpecificFields(values, { ...element, ...values }, allFields);
                    calValues['pricingMethod'] = 'Per Week';
                } else if (element.pricingMethod === 'Per Month') {
                    values['pricingMethod'] = 'Per Day';
                    if (priceFieldName) {
                        values[priceFieldName] = orginalMaterial.find((d) => d._id === element._id)[priceFieldName] / 30;
                    }
                    calValues = autoCalculateSpecificFields(values, { ...element, ...values }, allFields);
                    calValues['pricingMethod'] = 'Per Month';
                } else {
                    calValues = autoCalculateSpecificFields(values, { ...element, ...values }, allFields);
                }
                element.isAppliedBill = true;
                rows.push({ ...element, ...calValues });
            }
        });

        let tempRows = material?.map((obj) => rows.find((o) => o._id === obj._id) || obj);

        setMaterial(tempRows);
        setRowsData(tempRows);
        setRowsApplied((prevState) => {
            let prevRowsApplied = prevState.filter((obj) => !rows.map((d) => d._id).includes(obj._id));
            return [...prevRowsApplied, ...rows];
        });
        setAppliedDate(true);
    };

    const handleCreateInvoice = () => {
        rowsApplied?.forEach((element) => {
            delete element?.srno;
            delete element?.detail;
            delete element?.qtyDisplay;
            delete element?.productDetail;
            delete element?.serviceDetail;
            delete element?.service;
            delete element?.description;
        });
        setUpdating(true);
        axiosInstance()
            .post(`/field-ticket/${id}/invoice`, {
                material: rowsApplied.filter((d) => d.type !== 'additionalCost'),
                additionalCost: rowsApplied.filter((d) => d.type === 'additionalCost')
            })
            .then(() => {
                setUpdating(false);
                onSuccess();
            })
            .catch((error) => {
                setUpdating(false);
                toastConfig.setToastConfig(error);
            });
    };

    return (
        <>
            <Dialog fullScreen={true} TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true}>
                <CustomDialogHeader title={`Create Invoice `} onClose={onClose} showRequiredLabel={false}></CustomDialogHeader>
                <CustomDialogContent>
                    <>
                        <MuiPickersUtilsProvider utils={MomentUtils}>
                            <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">
                                <Grid md={4} style={{ display: 'flex', flex: 1, gap: '5px', alignItems: 'center' }} className={isMobile ? styles.content_box : ''}>
                                    <KeyboardDatePicker
                                        autoOk
                                        fullWidth
                                        size="small"
                                        variant="inline"
                                        inputVariant="outlined"
                                        // minDate={endDate || new Date()}
                                        value={endDate}
                                        name="endDate"
                                        label="End Date"
                                        onChange={(date: any) => {
                                            setEndDate(date ? date : null);
                                        }}
                                        format={dateFormat}
                                        InputLabelProps={{
                                            shrink: true
                                        }}
                                        margin="dense"
                                    />
                                    <Box style={{ display: 'flex', gap: '5px' }}>
                                        <HtmlTooltip
                                            title={
                                                !Boolean(
                                                    selectedRecords && selectedRecords.length && (selectedRecords.every((d) => d.type === 'additionalCost'))
                                                )
                                                    ? 'Please select product to apply'
                                                    : ''
                                            }
                                        >
                                            <span>
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    disabled={
                                                        !Boolean(
                                                            selectedRecords &&
                                                            selectedRecords.length)
                                                    }
                                                    size="small"
                                                    onClick={() => {
                                                        handleApplyDate();
                                                    }}
                                                >
                                                    Apply
                                                </Button>
                                            </span>
                                        </HtmlTooltip>
                                    </Box>
                                </Grid>
                            </Box>
                            {columns && rowsData ? (
                                <Box zIndex={5} width={'100%'} height={'calc(100vh - 285px)'} p={1}>
                                    <CustomReactTable
                                        height={'calc(100vh - 285px)'}
                                        columns={columns}
                                        data={rowsData}
                                        setWholeRowsCellColor={(rowData) => {
                                            if (rowData?.invalidDate) return 'error';
                                            if (rowData?.isAppliedInvoice) return 'isAppliedBill';
                                        }}
                                        onSelect={setSelectedRecords}
                                        childrenProperty="subRows"
                                        uniqueKey="_id"
                                        renderedFrom="field_ticket_create_invoice"
                                        isClientSideGrid={true}
                                        hideExpander={true}
                                    />
                                </Box>
                            ) : (
                                <Box p={2} height={500}>
                                    <CommonSkeleton lenArray={[...Array(10).keys()]} />
                                </Box>
                            )}
                        </MuiPickersUtilsProvider>
                    </>
                </CustomDialogContent>
                <CustomDialogFooter>
                    <Button
                        type="button"
                        variant="outlined"
                        color="primary"
                        size="small"
                        onClick={() => {
                            onClose();
                        }}
                    >
                        Cancel
                    </Button>
                    <HtmlTooltip
                        title={
                            !appliedDate
                                ? 'Please select items and apply'
                                : rowsApplied?.some((d) => d.invalidDate === true)
                                    ? 'Please select an appropriate date !'
                                    : 'Create Invoice'
                        }
                    >
                        <span>
                            <Button
                                type="button"
                                variant="contained"
                                color="primary"
                                size="small"
                                disabled={isUpdating || !appliedDate || rowsApplied.some((d) => d.invalidDate === true)}
                                onClick={() => {
                                    handleCreateInvoice();
                                }}
                            >
                                Create Invoice
                            </Button>
                        </span>
                    </HtmlTooltip>
                </CustomDialogFooter>
            </Dialog>
        </>
    );
};

export default CreateInvoiceDialog;
