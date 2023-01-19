import React from 'react';
import { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import AssignPackageDialog from 'src/components/AssignRolesDialog/AssignPackageDialog';
import CustomReactTable from '../../../components/CustomReactTable/CustomReactTable';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import Add from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import { serviceOrder } from '../../../constants/helpers';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { autoCalculateSpecificFields } from '../../../constants/formulaUtility';
import { CustomOfflineContext } from '../../../StateProvider/OfflineContext/OfflineContext';
import { isMobile, isTablet } from 'react-device-detect';
import { BiChevronDown } from 'react-icons/bi';
import AssignServiceDialog from 'src/components/AssignRolesDialog/AssignServiceDialog';
import { startCase } from 'lodash';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { calculateRowsField } from 'src/components/RentalManagment/helper';
import ProductionOrderQty from 'src/pages/ProductionOrder/Productpackage/ProductionOrderQty';
import AddIcon from "@material-ui/icons/Add";
import AssignEmployeeDialog from 'src/components/AssignRolesDialog/AssignEmployeeDialog';

const Technician = ({
    serviceOrderData,
    setNextStep,
    currencySymbol,
    isTabletScreen,
    isSmallScreen,
    showActivity,
    renderedFrom,
    stepFullScreen,
    allowedToEdit
}: any) => {

    const toastConfig = useContext(CustomToastContext);
    const { state: { user, permissions } }: any = useData();


    const [selectedProducts, setSelectedProducts] = useState([]);
    const [deleteData, setDeleteData] = useState(null);
    const [isDeleting, setDeleting] = useState(false);

    const [addEmployeeMasterDialog, setAddEmployeeMasterDialog] = useState({ open: false });
    const [columns, setColumns] = useState(null);
    const [rowsData, setRowsData] = useState(null);

    useEffect(() => {
        fetchFields();
    }, [allowedToEdit]);

    useEffect(() => {
        fetchData();
    }, [columns]);

    const fetchFields = async () => {
        const column: any = [
            {
                accessor: 'srno',
                Header: 'Index',
                width: 70,
                sticky: isMobile ? 'none' : 'left',
                Cell: ({ row }) => <p className="text-truncate">{row.original.srno}</p>,
            },
            {
                accessor: 'type',
                Header: 'Type',
                disableFilters: true,
                sticky: isMobile ? 'none' : 'left',
                width: 200,
                Cell: ({ row }) =>
                    row.original['type'] ? (
                        <p>
                            {`${startCase(row.original?.type)} `}
                        </p>
                    ) : (
                        <NoDataCell />
                    )
            },
            {
                accessor: 'detail',
                Header: ' Details',
                minWidth: 300,
                width: 300,
                sticky: isMobile ? 'none' : 'left',
                Cell: ({ row }) => (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {row.original.detail}
                        <IconButton
                            size="small"
                            onClick={() => {
                                if (row.original.type === 'service') {
                                    window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                                } else {
                                    window.open(`${routes.employeeMasterDetail.path}/${row.original.technician}`);
                                }
                            }}
                        >
                            <OpenInNewIcon fontSize="small" color="primary" />
                        </IconButton>
                    </div>
                )
            },
            {
                accessor: 'qty',
                Header: 'Qty',
                width: 200,
                Cell: ({ row }) => {
                    return row.original['qty'] ? <p className="text-truncate">{row.original.qty}</p> : <NoDataCell />;
                },
            },
            {
                accessor: 'unit',
                Header: 'Unit',
                width: 200,
                Cell: ({ row }) => {
                    return row.original['unit'] ? <p className="text-truncate">{row.original.unit}</p> : <NoDataCell />;
                }
            },
        ];
        column.push({
            accessor: 'action',
            Header: '',
            minWidth: 50,
            width: 50,
            sticky: 'right',
            disableFilters: true,
            canDrag: false,
            Cell: ({ row }) => {
                return allowedToEdit && row.original.type === 'technician' ? (
                    <HtmlTooltip title={'Delete'}>
                        <span>
                            <IconButton
                                size="small"
                                aria-label="Details"
                                onClick={() => {
                                    const obj: any = [{ _id: row.original._id, technician: row.original?.technician }];
                                    setDeleteData(obj);
                                }}
                            >
                                <DeleteIcon fontSize="small" color={'error'} />
                            </IconButton>
                        </span>
                    </HtmlTooltip>
                ) : null
            }
        });
        setColumns(column);
    };

    const fetchData = async () => {
        var data: any = [];
        const response = await axiosInstance().get(`${serviceOrder.api}/${serviceOrderData._id}/material`);

        const responseTechnician = await axiosInstance().get(`${serviceOrder.api}/${serviceOrderData._id}/technician`);
        const technician = responseTechnician?.data?.data;

        data = response?.data?.data;
        let rows = data.material.filter((e) => e.parentId === null);
        rows = rows.filter((e) => e.type === 'service' || (e.type === 'package' && e.packageDetail?.packageType === 'Service'));

        rows.forEach((parent, i) => {
            parent.srno = i + 1;
            parent.detail =
                parent.type === 'product'
                    ? parent?.productDetail?.productName
                    : parent.type === 'service'
                        ? parent?.serviceDetail?.serviceName
                        : parent?.packageDetail?.packageName;
            parent.subRows = generateNestedData(data.material, technician, parent);
        });
        setRowsData(rows);
        setSelectedProducts([]);
    };

    const generateNestedData = (material, technician, parent) => {

        const subRowsTechnician: any = [];
        technician.filter((e) => e._id === parent._id)?.forEach((element, i) => {
            const obj: any = {};
            obj._id = parent._id;
            obj.srno = parent.srno + '.' + (i + 1);
            obj.detail = element?.technician?.optionLabel
            obj.technician = element?.technician?.optionValue
            obj.type = "technician"
            subRowsTechnician.push(obj)
        });

        const subRows: any = material.filter((e) => e.parentId === parent._id);
        subRows.forEach((_subRow, j) => {
            _subRow.srno = parent.srno + '.' + (j + 1);
            _subRow.detail =
                _subRow.type === 'product'
                    ? _subRow?.productDetail?.productName
                    : _subRow.type === 'service'
                        ? _subRow?.serviceDetail?.serviceName
                        : _subRow?.packageDetail?.packageName;
            _subRow.subRows = generateNestedData(material, technician, _subRow);
        });

        return [...subRowsTechnician, ...subRows];
    };

    const handleAssignTechnician = async (rows) => {
        const sendData: any = [];
        rows?.forEach((e) => {
            sendData.push({ _id: selectedProducts[0]?._id, service: selectedProducts[0]?.materialId, technician: e?._id })
        })
        axiosInstance().post(`${serviceOrder.api}/${serviceOrderData._id}/technician`, sendData)
            .then(() => {
                setAddEmployeeMasterDialog({ open: false });
                fetchData()
            })
            .catch((error) => {
                toastConfig.setToastConfig(error);
            });
    };

    const handleDelete = (rows) => {
        setDeleting(true);
        axiosInstance()
            .put(`${serviceOrder.api}/${serviceOrderData?._id}/technician/delete`, rows)
            .then(() => {
                fetchData();
                setDeleting(false);
                setDeleteData(null);
            })
            .catch((error) => {
                setDeleting(false);
                setDeleteData(null);
                toastConfig.setToastConfig(error);
            });
    };

    const handleDeleteMultiple = () => {
        const obj: any = [];
        const dataToDelete = selectedProducts && selectedProducts.filter((e) => e.type === 'technician');
        dataToDelete?.forEach((ele) => {
            obj.push({ _id: ele._id, technician: ele?.technician });
        });
        dataToDelete?.forEach((ele) => {
            getNestedSubRows(obj, ele);
        });
        setDeleteData(obj);
    };

    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <Fragment>
            <Grid container spacing={2}>
                {allowedToEdit && (
                    <Grid item xs={12} md={12} sm={12}>
                        <Box display="flex" justifyContent="space-between" m={1} mb={0}>
                            <Box display="flex"></Box>
                            <Box display="flex">
                                <Button
                                    variant="contained"
                                    color="primary"
                                    type="button"
                                    size="small"
                                    disabled={selectedProducts?.length === 1 ? false : true}
                                    onClick={() => {
                                        setAddEmployeeMasterDialog({ open: true });
                                    }}
                                >
                                    {`Assign Technician`}
                                </Button>
                                <Box mx={isMobile ? 0.5 : 1} />
                                <Button
                                    variant={'outlined'}
                                    color="primary"
                                    size="small"
                                    onClick={handleClick}
                                    disabled={!Boolean(selectedProducts && selectedProducts.filter((e) => e.type === 'technician').length)}
                                    endIcon={<BiChevronDown />}
                                >
                                    Actions
                                </Button>
                                <Menu
                                    anchorEl={anchorEl}
                                    open={open}
                                    getContentAnchorEl={null}
                                    anchorOrigin={{
                                        vertical: 'bottom',
                                        horizontal: 'left'
                                    }}
                                    onClose={handleClose}
                                >
                                    <HtmlTooltip title={Boolean(selectedProducts && selectedProducts.length) ? 'Delete selected records' : 'Select records to delete'}>
                                        <MenuItem
                                            disabled={isDeleting}
                                            onClick={() => {
                                                handleDeleteMultiple();
                                                handleClose();
                                            }}
                                        >
                                            Delete
                                        </MenuItem>
                                    </HtmlTooltip>
                                </Menu>
                            </Box>
                        </Box>
                    </Grid>
                )}
                <Grid item xs={12} md={12} sm={12}>
                    {columns && rowsData ? (
                        <Box
                            zIndex={5}
                            width={
                                stepFullScreen
                                    ? '100%'
                                    : isTabletScreen
                                        ? 'calc(100vw -30px)'
                                        : isSmallScreen
                                            ? 'calc(100vw -30px)'
                                            : showActivity
                                                ? '100%'
                                                : 'calc(100vw - 103px)'
                            }
                            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
                        >
                            <CustomReactTable
                                height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
                                columns={columns}
                                data={rowsData}
                                onSelect={setSelectedProducts}
                                childrenProperty="subRows"
                                uniqueKey="_id"
                                hideSelection={!allowedToEdit}
                                renderedFrom={`${renderedFrom}_technician`}
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
            {deleteData && (
                <ConfirmationDialog
                    open={true}
                    message={`Are you sure you want to delete the record(s)?`}
                    onClose={() => setDeleteData(null)}
                    onOk={() => handleDelete(deleteData)}
                    okBtnLoading={isDeleting}
                />
            )}
            {addEmployeeMasterDialog.open && (
                <AssignEmployeeDialog
                    reference={'service'}
                    onSuccess={(data) => {
                        handleAssignTechnician(data);
                    }}
                    handleClose={() => {
                        setAddEmployeeMasterDialog({ open: false });
                    }}
                    ids={[]}
                />
            )}
        </Fragment>
    );
};

export default Technician;
