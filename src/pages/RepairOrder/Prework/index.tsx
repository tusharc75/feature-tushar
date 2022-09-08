import React from 'react';
import { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, IconButton, CircularProgress, Menu, MenuItem, Chip, MenuList, ListItemIcon, ListItemText } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import CustomReactTable from '../../../components/CustomReactTable/CustomReactTable';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import moment from 'moment';
import { repairOrder, dateFormat } from '../../../constants/helpers';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { CustomOfflineContext } from '../../../StateProvider/OfflineContext/OfflineContext';
import { isMobile, isTablet } from 'react-device-detect';
import { MdAdd, MdDelete, MdEdit } from 'react-icons/md';
import { RiEditCircleLine, RiAddCircleLine } from 'react-icons/ri';
import { BiChevronDown } from 'react-icons/bi';
import { fetch_repair_order_product_fields } from 'src/components/RepairOrder/helper';
import ManageWorkOrder from 'src/pages/WorkOrder/ManageWorkOrder';
import RepairOrderQtyDialog from '../Productpackage/RepairOrderQtyDialog';
import AddExistingProductInventory from '../Productpackage/AddExistingProductInventory';

const Prework = ({ repairOrderData, setNextStep, currencySymbol, isTabletScreen, isSmallScreen, showActivity, renderedFrom, stepFullScreen, allowedToEdit, isPrework }) => {

    const toastConfig = useContext(CustomToastContext);
    const { state: { user, permissions } }: any = useData();
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [material, setMaterial] = useState([]);
    const [columns, setColumns] = useState(null);
    const [rowsData, setRowsData] = useState(null);

    const { isOffline } = useContext(CustomOfflineContext);

    useEffect(() => {
        fetchFields();
    }, []);

    useEffect(() => {
        fetchProductInventory();
    }, [columns]);

    const fetchFields = async () => {
        var data = await fetch_repair_order_product_fields(repairOrderData?.currency);
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
                        <p> {row.original.detail}</p>
                        {<Box ml={1} className="d-flex align-items-center">
                            <span title={`There are ${row.original?.subRows?.length} product(s) in this ${row.original?.type}`}>
                                {row.original?.subRows?.length ? `(${row.original?.subRows?.length})` : null}
                            </span>
                        </Box>}
                        {!isOffline && (
                            <Chip
                                className="ml-1"
                                label={`${row.original.type === 'service' ? "Service"
                                    : row.original.type === 'product' ? "Product" : "Package"}`}
                                size="small"
                                color="primary"
                                onClick={() => {
                                    window.open(
                                        `${row.original.type === 'service' ? routes.serviceMasterDetail.path : row.original.type === 'product' ? routes.productDetail.path : routes.packagesDetail.path}/${row.original.materialId}`
                                    );
                                }}
                            />
                        )}
                    </div>
                ),
                Footer: () => {
                    return <>Total</>;
                }
            },
            {
                accessor: 'status',
                Header: 'Status',
                Cell: ({ row }) => (
                    row.original['status'] ?
                        <p> {row.original.status}</p>
                        : <NoDataCell />
                )
            },
            {
                accessor: 'workOrder',
                Header: 'Work Order',
                Cell: ({ row }) => (
                    row.original['workOrder'] ?
                        <a className="link text-truncate" href={`${routes.workOrderDetail.path}/${row.original['workOrder']._id}`} target="_blank">{row.original['workOrder'].workOrderNumber}</a>
                        : <NoDataCell />
                )
            }
        ];
        data.forEach((element) => {

            if (element.type === 'date') {
                coloum.push({
                    accessor: element.fieldName,
                    Header: element.fieldLabel,
                    disableFilters: true,
                    Cell: ({ row }) =>
                        row.original[element.fieldName] ? <p>{moment(row.original[element.fieldName].slice(0, 10)).format(dateFormat)}</p> : <NoDataCell />
                });
            }
            else {
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
        setNextStep(false);
        var data: any = [];
        var inventory: any = [];
        var nonSerializeAsset: any = [];
        const response = await axiosInstance().get(`${repairOrder.api}/${repairOrderData._id}/service/${isPrework ? "pre-work" : "post-work"}`);
        data = response?.data?.data;
        setMaterial(JSON.parse(JSON.stringify(data.material)));
        inventory = data.inventory;
        nonSerializeAsset = data.nonSerializeAsset;
        const rows = data.material.filter((e) => e.parentId === null);
        rows.forEach((parent, i) => {
            parent.srno = (i + 1);
            parent.detail = `${parent.type === 'product' ? parent.productDetail?.productName : parent.packageDetail?.packageName}`;
            parent.serializedProduct = parent.type === 'product' ? parent.productDetail?.serializedProduct : false;
            parent.qtyDisplay = parent.qty;
            parent.isValid = true;
            parent.status = parent?.workOrder?.status
            parent.assetQty = parent.serializedProduct ? inventory?.filter((e) => e._id === parent._id).length : nonSerializeAsset?.filter((e) => e._id === parent._id).length;
            parent.hideSelection = parent.assetQty > 0 ? true : parent?.status ? true : false;
            parent.subRows = generateNestedData(data.material, inventory, nonSerializeAsset, parent);
        });

        if (rows.filter((_rows) => _rows.isValid === false).length > 0 || rows.length === 0) {
            setNextStep(false);
        } else {
            setNextStep(true);
        }

        setRowsData(rows);
        setSelectedProducts([]);
    };

    const generateNestedData = (material, inventory, nonSerializeAsset, parent) => {
        const subRows = material.filter((e) => e.parentId === parent._id);
        const services = parent?.services?.map(d => {
            return {
                ...d,
                materialId: d._id,
                parentId: parent._id,
                workOrder: parent.workOrder,
                type: "service"
            }
        });
        let combinedData = [...subRows, ...services]
        combinedData.forEach((_subRow, j) => {
            _subRow.srno = parent.srno + '.' + (j + 1);
            _subRow.detail = _subRow?.productDetail?.productName ?? _subRow?.serviceName;
            _subRow.serializedProduct = _subRow?.productDetail?.serializedProduct;
            _subRow.qtyDisplay = _subRow?.serviceName ? `` : `${parent.qtyDisplay * _subRow.qty}`;
            _subRow.isValid = true;
            _subRow.assetQty = _subRow.serializedProduct ? inventory?.filter((e) => e._id === _subRow._id).length : nonSerializeAsset?.filter((e) => e._id === _subRow._id).length;
            _subRow.hideSelection = _subRow.assetQty > 0 ? true : _subRow?.status ? true : false;;
            _subRow.subRows = _subRow?.serviceName ? null : generateNestedData(material, inventory, nonSerializeAsset, _subRow);
        });
        if (combinedData.length === 0 && parent.type === "package") {
            parent.isValid = false;
        }
        if (parent.type === "package") {
            parent.hideSelection = combinedData.filter((e) => e.hideSelection).length ? true : false;
        }
        return combinedData;
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
        <Fragment>
            <Grid container spacing={2}>
                <Grid item xs={12} md={12} sm={12}>
                    {columns && rowsData ? (
                        <Box
                            zIndex={5}
                            width={stepFullScreen ? '100%' : isTabletScreen ? 'calc(100vw)' : isSmallScreen ? 'calc(100vw)' : showActivity ? '100%' : 'calc(100vw - 103px)'}
                            height={stepFullScreen ? "calc(100vh - 150px)" : "calc(100vh - 345px)"}
                        >
                            <CustomReactTable
                                height={stepFullScreen ? "calc(100vh - 150px)" : "calc(100vh - 345px)"}
                                columns={columns}
                                data={rowsData}
                                setWholeRowsCellColor={(rowData) => !rowData.isValid ? "error" : ""}
                                onSelect={setSelectedProducts}
                                childrenProperty="subRows"
                                uniqueKey="_id"
                                hideSelection={isOffline || !allowedToEdit}
                                renderedFrom="repair_order_workorder_product_package"
                                isClientSideGrid={true}
                            />
                        </Box>
                    ) : (
                        <Box p={2} height={500} bgcolor="white">
                            <CommonSkeleton lenArray={[...Array(10).keys()]} />
                        </Box>
                    )}
                </Grid>
            </Grid>
        </Fragment>
    );
};

export default Prework;
