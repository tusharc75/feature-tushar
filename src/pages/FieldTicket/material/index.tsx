import { Box, Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { BiChevronDown } from 'react-icons/bi';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { generateCustomTableColumns } from 'src/constants/columns';
import { autoCalculateSpecificFields } from 'src/constants/formulaUtility';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteIcon from '@material-ui/icons/Delete';
import routes from 'src/components/Helpers/Routes';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import MaterialQtyDialog from './MaterialQtyDialog';
import { fetch_field_ticket_material_fields } from '../helper';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import AssignServiceDialog from 'src/components/AssignRolesDialog/AssignServiceDialog';
import { calculatePrice } from 'src/components/RentalManagment/helper';


const Material = ({ stepFullScreen, fieldTicketData, id, renderedFrom, allowedToEdit, setNextStep }) => {
    const toastConfig = useContext(CustomToastContext);

    const [columns, setColumns] = useState(null);
    const [rowsData, setRowsData] = useState([]);
    const [selectedServices, setSelectedServices] = useState([]);
    const [addExistingServiceDialog, setAddExistingServiceDialog] = useState(false);
    const [allFields, setAllFields] = useState([]);
    const [isServiceEdit, setIsServiceEdit] = useState({ open: false, data: null, showSaveAndNext: false });
    const [isBulkEdit, setIsBulkEdit] = useState(false);
    const [deleteData, setDeleteData] = useState(null);
    const [isDeleting, setDeleting] = useState(false);
    const [isUpdating, setUpdating] = useState(false);

    const fetchFields = async () => {
        setColumns(null);
        var { fields: data, allFields } = await fetch_field_ticket_material_fields(fieldTicketData?.currency);
        if (!allowedToEdit) {
            allFields?.forEach((e) => {
                e.isColumnEditable = false;
            });
        }
        setAllFields(JSON.parse(JSON.stringify(allFields)));
        const newColumns = generateCustomTableColumns(data, fieldTicketData?.currency, renderedFrom);
        let qtyIndex = newColumns.findIndex((d) => d.accessor === 'qty');
        if (qtyIndex > -1) {
            newColumns[qtyIndex].accessor = 'qtyDisplay';
        }
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
                accessor: 'detail',
                Header: 'Details',
                minWidth: 300,
                width: 300,
                sticky: isMobile ? 'none' : 'left',
                Cell: ({ row, rows }) => (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {!allowedToEdit ? (
                            <p> {row.original.detail}</p>
                        ) : (
                            <p
                                onClick={() => {
                                    setIsServiceEdit({
                                        open: true,
                                        data: row.original,
                                        showSaveAndNext: row?.index < rows?.filter((e) => e?.depth === 0)?.length - 1 && row?.depth === 0 ? true : false
                                    });
                                    setIsBulkEdit(false);
                                }}
                                className="link text-truncate"
                                title={row.original.detail}
                            >
                                {row.original.detail}
                            </p>
                        )}
                        <Box ml={1}>
                            <IconButton
                                size="small"
                                onClick={() => {
                                    if (row.original.type === 'service') {
                                        window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                                    }
                                }}
                            >
                                <OpenInNewIcon fontSize="small" color="primary" />
                            </IconButton>
                        </Box>
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
        column.push({
            accessor: 'action',
            Header: 'Action',
            minWidth: 50,
            width: 50,
            sticky: 'right',
            disableFilters: true,
            canDrag: false,
            Cell: ({ row }) => {
                return (
                    <HtmlTooltip title={'Delete'}>
                        <span>
                            <IconButton
                                size="small"
                                aria-label="Delete"
                                disabled={!allowedToEdit}
                                onClick={() => {
                                    setDeleteData([{ id: row.original._id, service: row?.original?.materialId }]);
                                }}
                            >
                                <DeleteIcon fontSize="small" color={allowedToEdit ? 'error' : 'disabled'} />
                            </IconButton>
                        </span>
                    </HtmlTooltip >
                )
            }
        });
        setColumns(column);
    };

    const fetchMaterial = async () => {

        const response = await axiosInstance().get(`/field-ticket/${id}/material?type=service`);
        const data = response?.data?.data?.material;

        data.forEach((parent, i) => {
            parent.srno = i + 1;
            parent.detail = `${parent?.serviceDetail?.serviceName}`;
            parent.description = `${parent?.serviceDetail?.serviceDescription || ''}`;
            parent.qtyDisplay = parent.qty;
            parent.type = parent.type;
            parent.isValid = parent['finalPrice_' + fieldTicketData?.currency?.toLowerCase()] ? true : false;

        });
        if (data.filter((_rows) => _rows.isValid === false).length > 0) {
            setNextStep(false);
        } else {
            setNextStep(true);
        }
        setRowsData(data);
        setSelectedServices([]);
    }

    useEffect(() => {
        fetchFields();
    }, [id]);

    useEffect(() => {
        if (columns) {
            fetchMaterial();
        }
    }, [columns]);

    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleAdd = async (rows) => {
        const material: any = [];
        rows.forEach((d) => {
            const element: any = {};
            element.materialId = d._id;
            element.detail = d?.serviceName;
            element.type = 'service';
            element.unit = d.unitMain && d.unitMain.length ? d.unitMain[0] : '';
            element.pricingMethod = d.pricingMethodMain && d.pricingMethodMain.length ? d.pricingMethodMain[0] : '';
            element.qty = d.qty ? parseFloat(d.qty) : 1;
            element.estimateStartDate = fieldTicketData ? fieldTicketData?.estimateStartDate : new Date();
            element.estimateEndDate = fieldTicketData ? fieldTicketData?.estimateEndDate : new Date();
            const calValues = autoCalculateSpecificFields({ pricingMethod: element.pricingMethod }, element, allFields);
            element.estimateJobDuration = 1;
            if (calValues && calValues['estimateJobDuration']) {
                element.estimateJobDuration = calValues['estimateJobDuration'];
            }
            material.push(element);
        });
        const priceData: any = await calculatePrice(fieldTicketData, material);
        AddMaterial(material, priceData);
    };

    const AddMaterial = async (material, priceData) => {
        const tempMaterial = [...material];
        if (priceData) {
            tempMaterial.forEach((element) => {
                const rateResult = priceData?.filter(
                    (e) => e.materialId === element.materialId && e.materialType === element.type && e.unit === element.unit
                );
                if (element.listPrice) {
                    const priceFieldName = `price_${fieldTicketData?.currency?.toLowerCase()}`;
                    element[priceFieldName] = element.listPrice;
                    const calValues = autoCalculateSpecificFields({ [priceFieldName]: element.listPrice }, element, allFields);
                    Object.assign(element, calValues);
                } else if (rateResult.length && rateResult[0].mrp) {
                    const priceFieldName = `price_${fieldTicketData?.currency?.toLowerCase()}`;
                    element[priceFieldName] = rateResult[0].mrp;
                    element['pricingCondition'] = rateResult[0].conditionId;
                    element['pricingMethod'] = rateResult[0].pricingMethod?.trim();
                    const calValues = autoCalculateSpecificFields({ [priceFieldName]: rateResult[0].mrp }, element, allFields);
                    Object.assign(element, calValues);
                }
            });
        }

        axiosInstance()
            .post(`/field-ticket/${id}/material`, { material: tempMaterial })
            .then(() => {
                setAddExistingServiceDialog(false);
                fetchMaterial();
            })
            .catch((error) => {
                toastConfig.setToastConfig(error);
            });
    }

    const handleDelete = (rows) => {
        setDeleting(true);
        axiosInstance()
            .put(`/field-ticket/${id}/material/delete`, { ids: rows })
            .then(() => {
                setDeleting(false);
                fetchMaterial();
                setDeleteData(null);
            })
            .catch((error) => {
                setDeleting(false);
                toastConfig.setToastConfig(error);
                setDeleteData(null);
            });
    };

    const handleSaveData = async (rows: any, saveAndNext = false) => {
        rows.forEach((element) => {
            element.pricingCondition = element.pricingCondition?.optionValue ? element.pricingCondition?.optionValue : element.pricingCondition; // temporary fix
            delete element.srno;
            delete element.detail;
            delete element.qtyDisplay;
            delete element.isValid;
            delete element.serviceDetail;
        });
        setUpdating(true);
        axiosInstance()
            .put(`/field-ticket/${id}/material`, { material: rows })
            .then(() => {
                fetchMaterial();
                if (saveAndNext) {
                    const rowIndex = rowsData?.findIndex((d) => d._id === rows[0]?._id);
                    setIsServiceEdit({ open: true, data: rowsData[rowIndex + 1], showSaveAndNext: rowIndex + 1 < rowsData?.length - 1 ? true : false });
                } else {
                    setIsServiceEdit({ open: false, data: null, showSaveAndNext: false });
                }
                setUpdating(false);
                setIsBulkEdit(false);
            })
            .catch((error) => {
                setUpdating(false);
                toastConfig.setToastConfig(error);
            });
    };

    return (
        <>
            {allowedToEdit &&
                <Box display="flex" justifyContent="space-between" m={1}>
                    <Box display="flex" gridGap={'8px'} flexWrap={'wrap'}>
                        <Button
                            size="small"
                            variant={'contained'}
                            color="primary"
                            onClick={() => {
                                setAddExistingServiceDialog(true);
                            }}
                        >
                            {isMobile && !isTablet ? 'Service' : `Add Service`}
                        </Button>
                    </Box>
                    <Box display="flex" ml={1}>
                        <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            id="demo-positioned-button"
                            onClick={handleClick}
                            disabled={!Boolean(selectedServices?.length)}
                            endIcon={<BiChevronDown />}
                        >
                            Actions
                        </Button>
                        <Menu
                            anchorEl={anchorEl}
                            keepMounted
                            open={open}
                            onClose={handleClose}
                            getContentAnchorEl={null}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right'
                            }}
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right'
                            }}
                        >
                            <HtmlTooltip
                                title={
                                    Boolean(selectedServices.length)
                                        ? 'Bulk edit selected records'
                                        : 'Select records to edit'
                                }
                            >
                                <MenuItem
                                    onClick={() => {
                                        setIsServiceEdit({ open: true, data: null, showSaveAndNext: false });
                                        setIsBulkEdit(true);
                                        handleClose();
                                    }}
                                >
                                    Bulk Edit
                                </MenuItem>
                            </HtmlTooltip>
                            <HtmlTooltip
                                title={
                                    Boolean(selectedServices.length)
                                        ? 'Delete selected records'
                                        : 'Select records to delete'
                                }
                            >
                                <MenuItem
                                    disabled={isDeleting}
                                    onClick={() => {
                                        setDeleteData(selectedServices?.map(d => {
                                            return (
                                                {
                                                    id: d?._id,
                                                    service: d?.materialId
                                                }
                                            )
                                        }))
                                        handleClose();
                                    }}
                                >
                                    Delete
                                </MenuItem>
                            </HtmlTooltip>
                        </Menu>
                    </Box>
                </Box>
            }
            {columns && rowsData ? (
                <Box zIndex={5} width={'100%'} height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}>
                    <CustomReactTable
                        height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
                        columns={columns}
                        data={rowsData}
                        setWholeRowsCellColor={(rowData) => (!rowData.isValid ? 'error' : '')}
                        onSelect={setSelectedServices}
                        childrenProperty="subRows"
                        uniqueKey="_id"
                        hideSelection={!allowedToEdit}
                        hideAction={!allowedToEdit}
                        renderedFrom="field_ticket_add_service"
                        isClientSideGrid={true}
                        hideExpander={true}
                    />
                </Box>
            ) : (
                <Box p={2} height={500}>
                    <CommonSkeleton lenArray={[...Array(10).keys()]} />
                </Box>
            )}
            {addExistingServiceDialog && (
                <AssignServiceDialog
                    reference={'fieldTicket'}
                    referenceId={id}
                    onSuccess={handleAdd}
                    handleClose={() => {
                        setAddExistingServiceDialog(false);
                    }}
                    ids={rowsData?.map(row => row?.materialId)}
                />
            )}

            {isServiceEdit.open && (
                <MaterialQtyDialog
                    onClose={() => {
                        setIsServiceEdit({ open: false, data: null, showSaveAndNext: false });
                        setIsBulkEdit(false);
                    }}
                    isBulkedit={isBulkEdit}
                    handleSaveData={handleSaveData}
                    fieldTicketData={fieldTicketData}
                    rowData={!isBulkEdit ? isServiceEdit.data : selectedServices}
                    material={rowsData}
                    selectedServices={selectedServices}
                    loading={isUpdating}
                    showSaveAndNext={isServiceEdit.showSaveAndNext}
                />
            )}

            {deleteData && (
                <ConfirmationDialog
                    open={true}
                    message={`Are you sure you want to delete the record(s)?`}
                    onClose={() => setDeleteData(null)}
                    onOk={() => handleDelete(deleteData)}
                    okBtnLoading={isDeleting}
                />
            )}
        </>
    );
};

export default Material;
