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
import { repairOrder, dateFormat, workOrder, sidebarResource, getObjKeys, generateUniqueIdOnly } from '../../../constants/helpers';
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
import AssignServiceDialog from 'src/components/AssignRolesDialog/AssignServiceDialog';
import { ExpandMore } from '@material-ui/icons';
import AssignUserDialog from 'src/pages/WorkOrder/Service/AssignUserDialog';

const WorkOrder = ({ repairOrderData, setNextStep, isTabletScreen, isSmallScreen, showActivity, stepFullScreen }) => {

    const toastConfig = useContext(CustomToastContext);
    const { state: { user, permissions } }: any = useData();
    const [selectedProducts, setSelectedProducts] = useState([]);

    const [columns, setColumns] = useState(null);
    const [rowsData, setRowsData] = useState(null);
    const [addServicesDialog, setAddServicesDialog] = useState({ open: false });
    const [userAssignDialog, setUserAssignDialog] = useState(false);


    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);


    useEffect(() => {
        fetchFields();
    }, []);

    useEffect(() => {
        fetchProductInventory();
    }, []);

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
                        <Chip
                            className="ml-1"
                            label={`${row.original.type === 'service' ? "Service"
                                : row.original.type === 'product' ? "Product" : row.original.type === 'serializedAsset' ? "Asset" : "Package"}`}
                            size="small"
                            color="primary"
                            onClick={() => {
                                window.open(
                                    `${row.original.type === 'service' ? routes.serviceMasterDetail.path : row.original.type === 'product' ? routes.productDetail.path : row.original.type === 'serializedAsset' ? routes.serializedAssetDetail.path : routes.packagesDetail.path}/${row.original.materialId}`
                                );
                            }}
                        />
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
        const response = await axiosInstance().get(`${repairOrder.api}/${repairOrderData._id}/work-order/service`);
        data = response?.data?.data;
        inventory = data.inventory;
        nonSerializeAsset = data.nonSerializeAsset;
        const rows = data.material.filter((e) => e.parentId === null);
        createWorkorderService(rows)
        rows.forEach((parent, i) => {
            parent.srno = (i + 1);
            parent.detail = `${parent.type === 'product' ? parent.productDetail?.productName : parent.type === 'serializedAsset' ? parent.serializedAsset.assetNumber : parent.packageDetail?.packageName}`;
            parent.qtyDisplay = parent.qty;
            parent.isValid = true;
            parent.status = parent?.workOrder?.status
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
        const services = parent?.services?.filter(d => d.packageId === undefined || d.packageId === null || d.packageId === "").map(d => {
            return {
                ...d,
                materialId: d._id,
                parentId: parent._id,
                workOrder: parent.workOrder,
                type: "service"
            }
        });
        const packages = parent?.packages?.map(d => {
            return {
                ...d,
                materialId: d._id,
                parentId: parent._id,
                workOrder: parent.workOrder,
                type: "package"
            }
        });

        let combinedData = [...subRows, ...packages, ...services]
        combinedData.forEach((_subRow, j) => {
            _subRow.srno = parent.srno + '.' + (j + 1);
            _subRow.detail = _subRow?.type === "service" ? _subRow?.serviceName : _subRow?.type === "package" ? _subRow?.packageName : _subRow?.productDetail?.productName;
            _subRow.qtyDisplay = _subRow?.serviceName ? `` : `${parent.qtyDisplay * _subRow.qty}`;
            _subRow.isValid = true;
            _subRow.subRows = _subRow?.type === "package" ? getPackageSubRows(parent, _subRow, material) : _subRow?.type === "service" ? getConsumableSubRows(parent, _subRow, material) : generateNestedData(material, inventory, nonSerializeAsset, _subRow);
        });
        if (combinedData.length === 0 && parent.type === "package") {
            parent.isValid = false;
        }
        return combinedData;
    }

    const getPackageSubRows = (parent, subRowPackage: any, material) => {
        const services = parent?.services?.filter(d => d.packageId === subRowPackage._id).map(d => {
            return {
                ...d,
                materialId: d._id,
                parentId: parent._id,
                workOrder: parent.workOrder,
                type: "service"
            }
        });
        services.forEach((_subRow, j) => {
            _subRow.srno = subRowPackage.srno + '.' + (j + 1);
            _subRow.detail = _subRow?.serviceName;
            _subRow.serializedProduct = _subRow?.productDetail?.serializedProduct;
            _subRow.qtyDisplay = _subRow?.serviceName ? `` : `${parent.qtyDisplay * _subRow.qty}`;
            _subRow.isValid = true;
            _subRow.subRows = _subRow?.type === "service" ? getConsumableSubRows(parent, _subRow, material) : null;
        });
        return services;
    }

    const getConsumableSubRows = (parent, subRowService: any, material) => {
        const consumable = parent?.consumable?.filter(d => d.service.optionValue === subRowService._id).map(d => {
            return {
                ...d,
                materialId: d.product?.optionValue,
                parentId: subRowService._id,
                workOrder: subRowService.workOrder,
                type: "product"
            }
        });
        consumable.forEach((_subRow, j) => {
            _subRow.srno = subRowService.srno + '.' + (j + 1);
            _subRow.detail = _subRow?.product?.optionLabel;
            _subRow.isValid = true;
            _subRow.subRows = null;
        });
        return consumable;
    }

    const getNestedSubRows = (obj, original) => {
        if (original?.subRows?.length) {
            original?.subRows.forEach((element) => {
                obj.push({ id: element._id, type: element.type, materialId: element.materialId });
                getNestedSubRows(obj, element);
            });
        }
    }

    const handleAddService = (ids) => {
        const data: any = {};
        data.serviceIds = ids;
        axiosInstance()
            .post(`${workOrder.api}/service/${selectedProducts[0]['workOrder']?._id}`, data)
            .then(() => {
                fetchProductInventory();
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
            });
    };

    const createWorkorderService = async (rows) => {
        const rowsForWorkorder = rows.filter(d => d.type === "serializedAsset" && !d.workOrder)
        if (rowsForWorkorder.length > 0) {
            const response = await axiosInstance().get(`/field?resource=${sidebarResource["workOrder"]}`)
            let fieldsDataForCreate = response?.data?.data?.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
            const tempInitialData = getObjKeys("", fieldsDataForCreate)
            rowsForWorkorder.forEach(element => {
                tempInitialData["workOrderNumber"] = `WO_${generateUniqueIdOnly()}`
                tempInitialData["type"] = "Repair Order";
                tempInitialData["repairOrder"] = repairOrderData?._id;
                if (element.serializedAsset) {
                    tempInitialData["serializedAsset"] = element?.serializedAsset?._id
                    tempInitialData["product"] = element?.serializedAsset?.product
                }
                axiosInstance().post(`${workOrder.api}`, tempInitialData).then(({ data }) => {
                    if (data?.data?._id) {
                        axiosInstance()
                            .put(`${repairOrder.api}/${repairOrderData._id}/product-package/add-work-order`, {
                                "_id": element?._id,
                                "workOrder": data?.data?._id
                            }
                            )
                            .then(() => {
                                fetchProductInventory();
                            })
                            .catch((error) => {
                                toastConfig.setToastConfig(error);
                            });
                    }
                    else {
                        fetchProductInventory();
                    }
                }).catch((error) => {
                    toastConfig.setToastConfig(error);
                });
            });

        }
    };

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <Fragment>
            <Box display="flex" justifyContent="flex-end" pt={1} pb={2} >
                <Box display="flex" alignItems="center" justifyContent={"flex-end"} paddingX={1} gridColumnGap={8} flex={1}>
                    <Box display="flex" gridColumnGap={5}>
                        <Button
                            variant="outlined"
                            color="default"
                            size="small"
                            onClick={handleClick}
                            aria-controls="action-menu"
                        >
                            Actions <ExpandMore />
                        </Button>
                        <Menu
                            id="basic-menu"
                            anchorEl={anchorEl}
                            open={open}
                            onClose={handleClose}
                            MenuListProps={{
                                'aria-labelledby': 'basic-button'
                            }}
                            className={isMobile ? "add-product-action-menu-mobile" : "add-product-action-menu"}
                        >
                            <MenuItem
                                onClick={() => setAddServicesDialog({ open: true })}
                                disabled={selectedProducts?.length ? false : true}
                            >
                                <ListItemText>Add Services</ListItemText>
                            </MenuItem>
                            <MenuItem
                                onClick={() => setUserAssignDialog(true)}
                                disabled={selectedProducts?.length ? false : true}
                            >
                                <ListItemText>Add Users</ListItemText>
                            </MenuItem>
                        </Menu>
                    </Box>
                </Box>
            </Box>
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
                                hideSelection={false}
                                renderedFrom="repair_order_workorder"
                                isClientSideGrid={true}
                            />
                        </Box>
                    ) : (
                        <Box p={2} height={500} bgcolor="white">
                            <CommonSkeleton lenArray={[...Array(10).keys()]} />
                        </Box>
                    )}
                    {addServicesDialog.open && (
                        <AssignServiceDialog
                            reference="workorder"
                            handleClose={() => setAddServicesDialog({ open: false })}
                            ids={[]}
                            onSuccess={(data) => {
                                handleAddService(data?.map((e) => e.service));
                                setAddServicesDialog({ open: false })
                                handleClose()
                            }}
                        />
                    )}
                    {userAssignDialog && (
                        <AssignUserDialog
                            workOrderData={selectedProducts.filter((e) => e.type === 'service').map(d => {
                                return {
                                    "uniqueId": d?.uniqueId,
                                    "workOrderId": d?.workOrder?._id
                                }
                            })}
                            assignedUsers={[]}
                            handleClose={() => {
                                setUserAssignDialog(false);
                            }}
                            handleSucess={() => {
                                setUserAssignDialog(false);
                            }}
                        />
                    )}
                </Grid>
            </Grid>
        </Fragment>
    );
};

export default WorkOrder;
