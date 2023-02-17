import React from 'react';
import { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import CustomReactTable from '../../../components/CustomReactTable/CustomReactTable';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import DeleteIcon from '@material-ui/icons/Delete';
import { serviceOrder } from '../../../constants/helpers';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { isMobile, isTablet } from 'react-device-detect';
import { BiChevronDown } from 'react-icons/bi';
import { startCase } from 'lodash';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { getNestedSubRows } from 'src/components/RentalManagment/helper';
import AssignEmployeeDialog from 'src/components/AssignRolesDialog/AssignEmployeeDialog';
import SendEmail from '../SendEmail';
import { fetch_service_order_detail_fields } from 'src/components/ServiceOrder/helper';
import { genrateCustomTableColumns } from 'src/constants/columns';

const Technician = ({
    serviceOrderData,
    setNextStep,
    renderedFrom,
    stepFullScreen,
    allowedToEdit,
    fromInvoice = false
}: any) => {

    const toastConfig = useContext(CustomToastContext);
    const { state: { user, permissions } }: any = useData();

    const [selectedProducts, setSelectedProducts] = useState([]);
    const [deleteData, setDeleteData] = useState(null);
    const [isDeleting, setDeleting] = useState(false);

    const [addEmployeeMasterDialog, setAddEmployeeMasterDialog] = useState({ open: false, data: null });
    const [columns, setColumns] = useState(null);
    const [rowsData, setRowsData] = useState(null);

    useEffect(() => {
        fetchFields();
    }, [allowedToEdit]);

    useEffect(() => {
        fetchData();
    }, [columns]);

    const fetchFields = async () => {
        var data = await fetch_service_order_detail_fields(serviceOrderData?.currency);
        data?.forEach((e) => {
            e.isColumnEditable = false;
        });
        var newColumns = genrateCustomTableColumns(data, serviceOrderData?.currency, renderedFrom);
        var column: any = [
            {
                accessor: 'index',
                Header: 'Index',
                width: 50,
                sticky: isMobile ? 'none' : 'left',
                Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
            },
            {
                accessor: 'type',
                Header: 'Type',
                disableFilters: true,
                sticky: isMobile ? 'none' : 'left',
                width: 100,
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
                width: 250,
                sticky: isMobile ? 'none' : 'left',
                Cell: ({ row }) => (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {row.original.detail}
                        <IconButton
                            size="small"
                            style={{ marginLeft: "10px" }}
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
                accessor: 'status',
                Header: 'Status',
                width: 200,
                Cell: ({ row }) => row.original['status'] ? (<p>{row.original?.status}</p>) : <NoDataCell />
            },
            {
                accessor: 'competency',
                Header: 'Competency',
                width: 250,
                Cell: ({ row }) => row.original['competency'] ? (<p>{row.original?.competency}</p>) : <NoDataCell />
            },
        ];
        column = [...column, ...newColumns]
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
        setNextStep(false)
        var data: any = [];
        const response = await axiosInstance().get(`${serviceOrder.api}/${serviceOrderData._id}/material`);

        const responseTechnician = await axiosInstance().get(`${serviceOrder.api}/${serviceOrderData._id}/technician`);
        const technician = responseTechnician?.data?.data;

        data = response?.data?.data?.material?.filter((e) => e.type !== "product");
        let rows = data.filter((e) => e.parentId === null);
        rows.forEach((parent, i) => {
            parent.index = i + 1;
            parent.detail =
                parent.type === 'product'
                    ? parent?.productDetail?.productName
                    : parent.type === 'service'
                        ? parent?.serviceDetail?.serviceName
                        : parent?.packageDetail?.packageName;
            parent.competency = parent.type === 'service' ? parent?.serviceDetail?.competency?.map((e) => e?.optionLabel)?.toString() : null
            parent.serviceCompetency = parent.type === 'service' ? parent?.serviceDetail?.competency || [] : []
            parent.subRows = generateNestedData(data, technician, parent);
        });

        if (technician?.length) {
            setNextStep(true)
        }

        setRowsData(rows);
        setSelectedProducts([]);
    };

    const generateNestedData = (material, technician, parent) => {

        const subRowsTechnician: any = [];
        technician.filter((e) => e._id === parent._id)?.forEach((element, i) => {
            const obj: any = {};
            obj._id = parent._id;
            obj.index = parent.index + '.' + (i + 1);
            obj.detail = `${element?.technician?.firstName} ${element?.technician?.lastName} - (${element?.technician?.firstName})`
            obj.technician = element?.technician?._id
            obj.type = "technician"
            obj.estimateStartDate = element?.estimateStartDate
            obj.estimateEndDate = element?.estimateEndDate
            obj.status = element?.status
            parent.isValid = true;
            subRowsTechnician.push(obj)
        });

        const subRows: any = material.filter((e) => e.parentId === parent._id);
        subRows.forEach((_subRow, j) => {
            _subRow.srno = parent.srno + '.' + (j + 1);
            _subRow.detail = _subRow.type === 'product' ? _subRow?.productDetail?.productName : _subRow.type === 'service' ? _subRow?.serviceDetail?.serviceName : _subRow?.packageDetail?.packageName;
            _subRow.competency = _subRow.type === 'service' ? _subRow?.serviceDetail?.competency?.map((e) => e.optionLabel)?.toString() : null
            _subRow.serviceCompetency = _subRow.type === 'service' ? _subRow?.serviceDetail?.competency || [] : []
            _subRow.subRows = generateNestedData(material, technician, _subRow);
        });

        return [...subRowsTechnician, ...subRows];
    };

    const handleAssignTechnician = async (rows) => {
        const sendData: any = [];
        rows?.forEach((e) => {
            sendData.push({
                _id: selectedProducts[0]?._id,
                service: selectedProducts[0]?.materialId,
                technician: e?._id,
                estimateStartDate: selectedProducts[0]?.estimateStartDate,
                estimateEndDate: selectedProducts[0]?.estimateEndDate
            })
        })
        axiosInstance().post(`${serviceOrder.api}/${serviceOrderData._id}/technician`, sendData)
            .then(() => {
                setAddEmployeeMasterDialog({ open: false, data: null });
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
                <Grid item xs={12} md={12} sm={12}>
                    <Box display="flex" justifyContent="space-between" m={1} mb={0}>
                        <Box display="flex">
                            {fromInvoice && (
                                <SendEmail serviceOrderData={serviceOrderData} />
                            )}
                        </Box>
                        {allowedToEdit && (
                            <Box display="flex">
                                <Button
                                    variant="contained"
                                    color="primary"
                                    type="button"
                                    size="small"
                                    disabled={selectedProducts?.length === 1 ? false : true}
                                    onClick={() => {
                                        setAddEmployeeMasterDialog({ open: true, data: selectedProducts[0] });
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
                        )}
                    </Box>
                </Grid>
                <Grid item xs={12} md={12} sm={12}>
                    {columns && rowsData ? (
                        <Box zIndex={5} width={'100%'} height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}   >
                            <CustomReactTable
                                height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
                                columns={columns}
                                data={rowsData}
                                onSelect={setSelectedProducts}
                                childrenProperty="subRows"
                                uniqueKey="_id"
                                hideSelection={!allowedToEdit}
                                hideAction={!allowedToEdit}
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
                        setAddEmployeeMasterDialog({ open: false, data: null });
                    }}
                    defaultCompetency={addEmployeeMasterDialog?.data?.serviceCompetency}
                    ids={[]}
                />
            )}
        </Fragment>
    );
};

export default Technician;
