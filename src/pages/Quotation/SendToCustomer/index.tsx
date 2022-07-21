import React, { useState, useEffect, useContext, Fragment, useReducer, useMemo } from "react";
import { Grid, Box, Button, Paper, Typography, IconButton, CircularProgress, Tab, Tabs, ButtonGroup, Container, InputAdornment, useMediaQuery, Menu, MenuItem, Tooltip, Chip, capitalize } from "@material-ui/core";
import axiosInstance from "../../../axios/axiosInstance";
import routes from "../../../components/Helpers/Routes";
import { useData } from "../../../StateProvider/Provider";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import HtmlTooltip from "../../../components/CustomTooltipTitle";
import { ExpandMore } from "@material-ui/icons";
import { isMobile, isTablet } from "react-device-detect";
import { FiDownloadCloud } from "react-icons/fi";
import { AiFillEdit, AiOutlineEye, AiOutlineFileExcel, AiOutlineFilePdf } from "react-icons/ai";
import { GiVintageRobot } from "react-icons/gi";
import { utils } from "xlsx";
import { fetch_quotation_product_fields, handleViewPdf } from "src/components/Quotation/helper";
import moment from "moment";
import NoDataCell from "src/components/Helpers/NoDataCell";
import { dateFormat, formatAmountWithCurrency, quotation } from "src/constants/helpers";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import CustomReactTable from "src/components/CustomReactTable/CustomReactTable";


const SendToCustomer = ({ quotationData, setNextStep, currencySymbol, showActivity, }) => {

    const toastConfig = useContext(CustomToastContext);
    const { state: { user, permissions } }: any = useData();
    const [viewDownloadLoading, setViewDownloadLoading] = useState(false);
    const [isRateRequired, setIsRateRequired] = useState(false);
    const [columns, setColumns] = useState(null);
    const [rowsData, setRowsData] = useState(null);
    const isSmallScreen = useMediaQuery('(max-width:1300px)');
    const isTabletScreen = useMediaQuery('(max-width:960px)');


    useEffect(() => {
        fetchFields()
    }, []);

    const fetchFields = async () => {
        var data = await fetch_quotation_product_fields(quotationData?.currency)
        const coloum: any = [{
            accessor: 'detail',
            Header: 'Detail',
            minWidth: 300,
            width: 300,
            Cell: ({ row }) => (
                <div style={{ display: "flex", alignItems: 'center' }}>
                    {<p
                        onClick={() => {
                        }}
                        className="link text-truncate"
                        title={row.original.detail}
                    >
                        {row.original.detail}
                    </p>}
                    {row.original?.parentId === null &&
                        <Box ml={1} className="d-flex align-items-center">
                            <span title={`There are ${row.original?.subRows?.length} product(s) in this package`}>({row.original?.subRows?.length})</span>
                        </Box>
                    }
                    <Chip
                        className="ml-1"
                        label={`${capitalize(row.original.type)}`}
                        size="small"
                        color="primary"
                    />
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
            else if (element.fieldName === "supplierAccount") {
                coloum.push({
                    accessor: element.fieldName,
                    Header: element.fieldLabel,
                    Cell: ({ row }) => (
                        row.original[element.fieldName] ? <p className="text-truncate">{row.original[element.fieldName].map(d => d?.optionLabel).toString()}</p> : <NoDataCell />
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
                                    row.original[fieldName] ? <p>{formatAmountWithCurrency(quotationData?.currency, row.original[fieldName])?.amountWithouCurrencyCode}</p> : <NoDataCell />
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
                                row.original[fieldName] ? <p>{formatAmountWithCurrency(quotationData?.currency, row.original[fieldName])?.amountWithouCurrencyCode}</p> : <NoDataCell />
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
                    return <>{currencySymbol} {formatAmountWithCurrency(quotationData?.currency, total)?.amountWithouCurrencyCode ?? total}</>
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
        const response = await axiosInstance().get(`${quotation.api}/productpackage/${quotationData._id}`)
        data = response?.data?.data
        inventory = data?.inventory ? data?.inventory : [];
        const rows = data.material.filter((e) => e.parentId === null)
        rows.forEach((parent, i) => {
            parent.detail = `${parent.type === "product" ? parent.productDetail?.productName : parent.packageDetail?.packageName}`
            parent.qtyDisplay = parent.qty;
            parent.isValid = parent["finalPrice_" + quotationData?.currency?.toLowerCase()] ? true : !isRateRequired;
            parent.hideSelection = inventory.filter((e) => e._id === parent._id).length ? true : false;
            parent.assetQty = inventory.filter((e) => e._id === parent._id).length;

            const subRows: any = data.material.filter((e) => e.parentId === parent._id);
            subRows.forEach((_subRow, j) => {
                _subRow.detail = `${_subRow.type === "product" ? _subRow.productDetail?.productName : _subRow.serviceDetail?.serviceName}`
                _subRow.qtyDisplay = `${parent.qty * _subRow.qty}`
                _subRow.isValid = _subRow["finalPrice_" + quotationData?.currency?.toLowerCase()] ? true : !isRateRequired;
                _subRow.hideSelection = inventory.filter((e) => e._id === _subRow._id).length ? true : false;
                _subRow.assetQty = inventory.filter((e) => e._id === _subRow._id).length;
            })
            // if (subRows.length === 0) {
            //     parent.isValid = false
            // }
            parent.hideSelection = subRows.filter((e) => e.hideSelection).length ? true : false;
            parent.subRows = subRows
        });
        if (rows.filter(_rows => _rows.isValid === false).length > 0 || rows.length === 0) {
            setNextStep(false)
        } else {
            setNextStep(true)
        }
        setRowsData(rows);
    };

    return (<Fragment>
        <Box display="flex" justifyContent="space-between" m={1}>
            <Box display="flex" alignItems="center">
                <span className="d-flex align-items-center justify-content-end ml-3">
                    <Tooltip title="View">
                        <Button
                            onClick={() => {
                                handleViewPdf(true, false, quotationData);
                            }}
                            variant="outlined"
                            disabled={viewDownloadLoading}
                            size="small"
                            className="mr-1 setIconForMobile"
                            startIcon={isMobile && !isTablet ? '' : <AiOutlineEye />}
                            color="primary"
                        >
                            {isMobile && !isTablet ? <AiOutlineEye size={20} /> : ''}
                            {isMobile && !isTablet ? '' : 'View'}
                        </Button>
                    </Tooltip>
                    <Tooltip title="Download">
                        <Button
                            disabled={viewDownloadLoading}
                            onClick={() => {
                                handleViewPdf(false, true, quotationData);
                            }}
                            variant="outlined"
                            size="small"
                            className="mr-1 setIconForMobile"
                            startIcon={isMobile && !isTablet ? '' : <FiDownloadCloud />}
                            color="primary"
                        >
                            {isMobile && !isTablet ? <FiDownloadCloud size={20} /> : ''}
                            {isMobile && !isTablet ? '' : 'Download'}
                        </Button>
                    </Tooltip>
                </span>
            </Box>
            <Box display="flex" >
                {/* <HtmlTooltip title={"Send Email "}>
                        <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={() => setOpenEmailDialog(true)}
                        >
                            Send Email
                        </Button>
                </HtmlTooltip> */}
                <HtmlTooltip title={"Send to customer"}>
                    <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => {
                            axiosInstance().put(`${quotation.api}/${quotationData?._id}/send-to-customer `)
                                .then(({ data }) => {
                                    toastConfig.setToastConfig({
                                        open: true,
                                        type: "success",
                                        message: data.message,
                                    });
                                }).catch((error) => {
                                    toastConfig.setToastConfig(error)
                                });
                        }}
                    >
                        Send to customer
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
                        onSelect={() => { }}
                        hideSelection={true}
                        childrenProperty="subRows"
                        uniqueKey="_id"
                        renderedFrom="quotation_product_package"
                        isClientSideGrid={true}
                    />
                </Box>
            </>
            : <Box p={2} height={500} bgcolor="white">
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
        }
    </Fragment>
    );
};

export default SendToCustomer;
