import { Autocomplete, IconButton, MenuItem, TextField } from '@mui/material';
import Box from '@mui/material/Box/Box';
import Grid from '@mui/material/Grid2';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { camelCase, isArray, isObject } from 'lodash';
import { ReactNode, useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import AssignEmployeeDialog from 'src/components/AssignRolesDialog/AssignEmployeeDialog';
import CustomReactTable, { AccessorFunction, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import {
  CHILD_RESOURCE,
  displayDateTime,
  TECHNICIAN_STATUS,
  fieldServiceOrder,
  MATERIAL_TYPE,
  prepareDataForGrid,
  SERVICE_ORDER_STATUS,
  sidebarResource
} from 'src/constants/helpers';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import routes from '../../../components/Helpers/Routes';
import { FiExternalLink } from 'react-icons/fi';
import DropdownCell from 'src/components/CustomReactTable/Cells/DropdownCell';
import Consumables from './Consumables';
import { fetch_child_resource_fields_perm } from 'src/components/ChildResourceField';
import TechnicianDialog from './TechnicianDialog';
import ConsumablesDialog from './ConsumablesDialog';
import StartStopLogsDialog, { formatDurationInHrs } from 'src/pages/FieldTicket/material/StartStopLogsDialog';
import StartStopDateDialog from 'src/pages/FieldTicket/material/StartStopDateDialog';
import { Visibility } from '@mui/icons-material';
import { RiUserShared2Fill } from 'react-icons/ri';
import { RiUserReceived2Fill } from 'react-icons/ri';
import PreviewDownload from 'src/components/PreviewDownload';

const Technicians = ({
  allowedToEdit,
  serviceOrderData,
  serviceOrderFields,
  fetchData: fetchserviceOrderData,
  resourcePolicy,
  stepFullScreen,
  setNextStep,
  handleChangeStatus
}) => {
  const renderedFrom = `${camelCase(sidebarResource.fieldServiceOrder)}_Technicians`;

  const toastConfig = useContext(CustomToastContext);
  const [columns, setColumns] = useState(null);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [technicianDialog, setTechnicianDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serviceOption, setServiceOption] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [openTechnicianEditDialog, setOpenTechnicianEditDialog] = useState({ open: false, data: null });
  const [allConsumables, setAllConsumables] = useState(null);
  const [consumablesDialog, setConsumablesDialog] = useState({ open: false, consumables: [] });
  const [startEndDateConfermationDialog, setStartEndDateConfermationDialog] = useState({
    open: false,
    type: null,
    minDateTime: null,
    notes: '',
    products: [],
    _id: null
  });
  const [viewStartStopLog, setViewStartStopLog] = useState({ open: false, technicianId: null });
  const {
    state: { permissions }
  }: any = useData();
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;
  const { generateColumns } = useColumns();
  const [showConfirmBox, setShowConfirmBox] = useState({ open: false, rows: [] });

  useEffect(() => {
    fetchColumns();
  }, [allConsumables]);

  useEffect(() => {
    if (resourcePolicy?.addServices) {
      fetchServices();
    }
  }, [resourcePolicy?.addServices]);

  useEffect(() => {
    fetchData();
  }, [selectedService]);

  const fetchColumns = async () => {
    let data = await fetch_child_resource_fields_perm(CHILD_RESOURCE.fieldServiceOrderTechnician, serviceOrderData?.currency, false);

    const fieldLabelResponce = await axiosInstance().put(`/field/find-field-labels`, {
      fields: [
        {
          resource: sidebarResource.employeeMaster,
          fieldNames: ['competencyType', 'competencies']
        }
      ]
    });
    const technicianFields = fieldLabelResponce?.data?.data?.find((e) => e.resource === sidebarResource.employeeMaster)?.fieldNames || [];
    let column: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: 'left',
        Cell: ({ row }) => (
          <div className="d-flex align-items-center gap-2">
            <h5 className="text-truncate">{row?.original?.index}</h5>
          </div>
        )
      },
      {
        accessor: 'technicianName',
        Header: 'Name',
        width: 250,
        Cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <p className="text-truncate" title={row.original.technicianName}>
              {row.original.technicianName}
            </p>
            <IconButton
              size="small"
              onClick={() => {
                window.open(`${routes.employeeMasterDetail.path}/${row.original.technicianId}`);
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
          </div>
        )
      },
      {
        accessor: 'status',
        Header: 'Status',
        width: 200,
        Cell: ({ row }) => (row.original['status'] ? <p>{row.original?.status}</p> : <NoDataCell />)
      },
      ...(resourcePolicy?.addServices
        ? [
          {
            accessor: 'service',
            Header: 'Service',
            width: 200,
            Cell: ({ row }) =>
              row?.original?.serviceId ? (
                <div className="flex items-center gap-2">
                  <p className="text-truncate" title={row.original.service}>
                    {row.original.service}
                  </p>
                  <IconButton
                    size="small"
                    onClick={() => {
                      window.open(`${routes.serviceMasterDetail.path}/${row.original.serviceId}`);
                    }}
                  >
                    <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                  </IconButton>
                </div>
              ) : (
                <NoDataCell />
              )
          }
        ]
        : []),
      ...(technicianFields?.find((e) => e.fieldName === 'competencyType')
        ? [
          {
            accessor: 'competencyType',
            Header: technicianFields?.find((e) => e.fieldName === 'competencyType')?.fieldLabel,
            width: 250,
            Cell: ({ row }) => (
              <DropdownCell
                permissions={permissions}
                permissionForLinks={{}}
                field={{
                  fieldName: 'competencyType',
                  lookupResource: sidebarResource.competencyType
                }}
                original={row?.original}
              />
            ),
            accessorFn: (original) => AccessorFunction(original, 'competencyType')
          }
        ]
        : []),
      ...(technicianFields?.find((e) => e.fieldName === 'competencies')
        ? [
          {
            accessor: 'competencies',
            Header: technicianFields?.find((e) => e.fieldName === 'competencies')?.fieldLabel,
            width: 250,
            Cell: ({ row }) => (
              <DropdownCell
                permissions={permissions}
                permissionForLinks={{}}
                field={{
                  fieldName: 'competencies',
                  lookupResource: sidebarResource.competencies
                }}
                original={row?.original}
              />
            ),
            accessorFn: (original) => AccessorFunction(original, 'competencies')
          }
        ]
        : []),
      {
        accessor: 'startDate',
        Header: 'Dispatched Date',
        disableFilters: true,
        disableSortBy: true,
        width: 250,
        Cell: ({ row }) => (row.original?.startDate ? <p>{displayDateTime(row.original?.startDate)}</p> : <NoDataCell />)
      },
      {
        accessor: 'endDate',
        Header: 'Returned Date',
        disableFilters: true,
        disableSortBy: true,
        width: 250,
        Cell: ({ row }) => (row.original?.endDate ? <p>{displayDateTime(row.original?.endDate)}</p> : <NoDataCell />)
      },
      {
        accessor: 'duration',
        Header: 'Duration',
        disableFilters: true,
        disableSortBy: true,
        disabled: true,
        Cell: ({ row }) => {
          return (
            <>
              {row?.original?.duration ? (
                <>
                  <h5 className="text-truncate">{formatDurationInHrs(row?.original?.duration)}</h5>
                </>
              ) : (
                <NoDataCell />
              )}
            </>
          );
        }
      },
      {
        accessor: 'notes',
        Header: 'Notes',
        Cell: ({ row }) => {
          return (
            <>
              {row?.original?.notes ? (
                <div>
                  <p className="text-truncate">{row.original?.notes}</p>
                </div>
              ) : (
                <NoDataCell />
              )}
            </>
          );
        }
      }
    ];
    const newColumns = generateColumns(renderedFrom, data, null, false, serviceOrderData?.currency);
    column = [...column, ...newColumns];
    column.push({
      accessor: 'action',
      Header: 'Actions',
      width: 150,
      sticky: 'right',
      disableFilters: true,
      disableSortBy: true,
      canDrag: false,
      Cell: ({ row }) => {
        return (
          <>
            {data?.length && allowedToEdit ? (
              <HtmlTooltip title={'Edit'}>
                <IconButton
                  size="small"
                  aria-label="Details"
                  onClick={() => {
                    setOpenTechnicianEditDialog({ open: true, data: row?.original });
                  }}
                >
                  <EditIcon fontSize="small" color={'primary'} />
                </IconButton>
              </HtmlTooltip>
            ) : null}
            {(row?.original?.endDate || (!row?.original?.startDate && !row?.original?.endDate)) && (
              <HtmlTooltip title={'Dispatch'}>
                <IconButton
                  size="small"
                  onClick={() => {
                    let date = null;
                    if (row?.original?.endDate) {
                      date = new Date(row?.original?.endDate);
                      date.setMinutes(date.getMinutes() + 1);
                    }
                    if (allConsumables?.length) {
                      setConsumablesDialog({ open: true, consumables: allConsumables });
                      setStartEndDateConfermationDialog({
                        open: false,
                        type: 'start',
                        minDateTime: date,
                        notes: '',
                        products: [],
                        _id: row?.original?._id
                      });
                    } else {
                      setStartEndDateConfermationDialog({
                        open: true,
                        type: 'start',
                        minDateTime: date,
                        notes: '',
                        products: [],
                        _id: row?.original?._id
                      });
                    }
                  }}
                  color={'primary'}
                >
                  <RiUserShared2Fill fontSize={18} />
                </IconButton>
              </HtmlTooltip>
            )}
            {row?.original?.startDate && !row?.original?.endDate && (
              <HtmlTooltip title={'Return'}>
                <IconButton
                  size="small"
                  onClick={() => {
                    setStartEndDateConfermationDialog({
                      open: true,
                      type: 'stop',
                      minDateTime: new Date(row?.original?.maxStartDate),
                      notes: row?.original?.notes,
                      products: [],
                      _id: row?.original?._id
                    });
                  }}
                  color={'primary'}
                >
                  <RiUserReceived2Fill fontSize={18} />
                </IconButton>
              </HtmlTooltip>
            )}
            <HtmlTooltip title={'View Logs'}>
              <IconButton
                size="small"
                onClick={() => {
                  setViewStartStopLog({ open: true, technicianId: row?.original?.technicianId });
                }}
              >
                <Visibility fontSize="small" color="primary" />
              </IconButton>
            </HtmlTooltip>
            {allowedToEdit ? (
              <HtmlTooltip title={'Delete'}>
                <span>
                  <IconButton
                    size="small"
                    aria-label="Details"
                    disabled={!row?.original?.canDelete}
                    onClick={() => {
                      setDeleteData([row.original._id]);
                    }}
                  >
                    <DeleteIcon fontSize="small" color={row.original?.canDelete ? 'error' : 'disabled'} />
                  </IconButton>
                </span>
              </HtmlTooltip>
            ) : null}
          </>
        );
      }
    });
    setColumns(column);
  };

  const fetchData = async () => {
    setNextStep(false);
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });

    let api = `${fieldServiceOrder.api}/technician?fieldServiceOrder=${serviceOrderData?._id}`;
    if (selectedService && selectedService?.optionValue !== 'All') {
      api = `${api}&uniqueId=${selectedService?._id}`;
    }
    axiosInstance()
      .get(api)
      .then(({ data: { data } }) => {
        let rows = data?.technician?.map((u, i) => {
          let res: any = {
            ...prepareDataForGrid(u)
          };
          res.index = i + 1;
          res.technicianName = u?.technician?.['firstName'] + ' ' + u?.technician?.['lastName'];
          res.technicianId = u?.technician?.['_id'];
          res.competencyType = u?.technician?.competencyType;
          res.competencies = u?.technician?.competencies;
          return res;
        });
        if (rows?.length > 0) {
          setNextStep(true);
        }
        dispatch({ type: 'initialize', data: rows, count: rows?.length });
        dispatch({ type: 'loading', loading: false });
        fetchAllConsumables();
      })
      .catch((error) => {
        setNextStep(false);
        toastConfig.setToastConfig(error);
      });
  };

  const fetchAllConsumables = async () => {
    try {
      setAllConsumables(null);
      let api = `${fieldServiceOrder.api}/${serviceOrderData?._id}/material?type=${MATERIAL_TYPE.product}`;
      const response = await axiosInstance().get(api);
      let consumables = response?.data?.data?.material;
      consumables?.forEach((parent, i) => {
        parent.index = i + 1;
        parent.productName = parent?.productDetail?.productName;
        parent.productDescription = parent?.productDetail?.productDescription;
        parent.productNumber = parent?.productDetail?.productNumber;
        parent.technicianId = parent?.technician?.optionValue;
        parent.technician = parent?.technician?.optionLabel || '';
        parent.canDelete = parent?.status ? parent?.status === TECHNICIAN_STATUS.reserved : true;
      });
      setAllConsumables(consumables || []);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchServices = async () => {
    let data;
    const response = await axiosInstance().get(`${fieldServiceOrder.api}/${serviceOrderData?._id}/material?type=${MATERIAL_TYPE.service}`);
    data = response?.data?.data?.material;
    const services = [{ optionLabel: 'All', optionValue: 'All', _id: null, competencyType: [], competencies: [] }];
    data?.map((d) => {
      services.push({
        _id: d?._id,
        optionLabel: d?.serviceDetail?.serviceName,
        optionValue: d?.materialId,
        competencyType: d?.serviceDetail?.competencyType,
        competencies: d?.serviceDetail?.competencies
      });
    });
    setServiceOption(services);
  };

  const handleDelete = async (rows) => {
    setIsDeleting(true);
    axiosInstance()
      .put(`${fieldServiceOrder.api}/technician`, { ids: rows })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
        setIsDeleting(false);
        fetchData();
        fetchserviceOrderData();
        setDeleteData(null);
      })
      .catch((error) => {
        setIsDeleting(false);
        toastConfig.setToastConfig(error);
        setDeleteData(null);
      });
  };

  const handleAssign = (rows, skipDateValidation = false) => {
    setIsSubmitting(true);
    const technician: any = [];
    rows.forEach((d) => {
      const element: any = {};
      element.technician = d?._id;
      element.referenceId = serviceOrderData?._id;
      element.warehouse = serviceOrderData?.warehouse?.optionValue;
      element.service = selectedService?.optionValue !== 'All' ? selectedService?.optionValue : null;
      element.uniqueId = selectedService?.optionValue !== 'All' ? selectedService?._id : null;
      element.estimateStartDate = serviceOrderData?.estimateStartDate;
      element.estimateEndDate = serviceOrderData?.estimateEndDate;
      technician.push(element);
    });
    axiosInstance()
      .post(`${fieldServiceOrder.api}/technician`, { technician, skipDateValidation })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
        if (serviceOrderData?.status === SERVICE_ORDER_STATUS.new) {
          handleChangeStatus(SERVICE_ORDER_STATUS.inProgress);
        }
        setTechnicianDialog(false);
        fetchData();
        fetchserviceOrderData();
        setIsSubmitting(false);
        setShowConfirmBox({ open: false, rows: [] });
      })
      .catch((error) => {
        if (skipDateValidation) {
          toastConfig.setToastConfig(error);
        } else {
          setShowConfirmBox({ open: true, rows: rows });
        }
        setIsSubmitting(false);
      });
  };

  const handleUpdateTechnician = async (rows: any) => {
    setIsSubmitting(true);
    axiosInstance()
      .put(`${fieldServiceOrder.api}/technician/${serviceOrderData._id}`, { technician: rows })
      .then(() => {
        setIsSubmitting(false);
        fetchData();
        setOpenTechnicianEditDialog({ open: false, data: null });
      })
      .catch((error) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={selectedRecords?.every((r) => r?.endDate || (!r?.startDate && !r?.endDate)) ? false : true}
          onClick={() => {
            const dates = [];
            selectedRecords?.forEach((d: any) => {
              if (d?.endDate) {
                dates.push(new Date(d?.endDate));
              }
            });
            let date = null;
            if (dates?.length) {
              date = new Date(Math.max(...dates));
              date.setMinutes(date.getMinutes() + 1);
            }
            if (allConsumables?.length) {
              setConsumablesDialog({ open: true, consumables: allConsumables });
              setStartEndDateConfermationDialog({
                open: false,
                type: 'start',
                minDateTime: date,
                notes: '',
                products: [],
                _id: null
              });
            } else {
              setStartEndDateConfermationDialog({
                open: true,
                type: 'start',
                minDateTime: date,
                notes: '',
                products: [],
                _id: null
              });
            }
          }}
        >
          Dispatch
        </MenuItem>
        <MenuItem
          disabled={selectedRecords?.every((r) => r?.startDate && !r?.endDate) ? false : true}
          onClick={() => {
            const dates = [];
            selectedRecords?.forEach((d: any) => {
              dates.push(new Date(d?.maxStartDate));
            });
            let date = null;
            if (dates?.length) {
              date = new Date(Math.max(...dates));
            }
            setStartEndDateConfermationDialog({
              open: true,
              type: 'stop',
              minDateTime: date,
              notes: selectedRecords?.length === 1 ? selectedRecords[0]?.notes : '',
              products: [],
              _id: null
            });
          }}
        >
          Return
        </MenuItem>
        <MenuItem
          disabled={selectedRecords?.every((e) => e?.canDelete) ? false : true}
          onClick={() => {
            setDeleteData(selectedRecords?.map((d) => d?._id));
          }}
        >
          Delete
        </MenuItem>
      </>
    );
  };

  const leftSideContents = () => {
    return (
      <Box style={{ maxWidth: '400px' }}>
        <Autocomplete
          id={'select-service'}
          size="small"
          style={{ minWidth: '300px' }}
          fullWidth
          options={serviceOption ? serviceOption : []}
          autoHighlight
          value={selectedService}
          getOptionLabel={(option: any) => option?.optionLabel || ''}
          isOptionEqualToValue={(option, val) => (option ? option?._id === val?._id : false)}
          onChange={(_, val) => {
            let value = val;
            if (!val) {
              value = { optionLabel: 'All', optionValue: 'All', _id: null, competencies: [] };
            }
            dispatch({ type: 'update', data: [] });
            setSelectedService(value);
          }}
          renderInput={(params) => <TextField {...params} label={'Select Service'} variant="outlined" />}
        />
      </Box>
    );
  };

  const handleUpdateStartEndDate = (values, type, products = [], _id = null) => {
    let value: any = {
      type: type,
      referenceId: serviceOrderData?._id,
      _id: _id ? [_id] : selectedRecords?.map((r) => r?._id)
    };
    if (values?.notes) value.notes = values?.notes;
    if (type !== 'stop') {
      value.startDate = values?.startDate;
    } else {
      value.endDate = values?.endDate;
    }
    if (products?.length) {
      value.materialIds = products;
    }
    setIsSubmitting(true);
    axiosInstance()
      .put(`${fieldServiceOrder.api}/technician/start-end-date`, value)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
        setStartEndDateConfermationDialog({ open: false, type: null, minDateTime: null, notes: '', products: [], _id: null });
        setConsumablesDialog({ open: false, consumables: [] });
        setIsSubmitting(false);
        fetchData();
      })
      .catch((error) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <>
      {allowedToEdit && (
        <>
          <DetailsPageHeader
            isAddButtonVisible={true}
            addButtonProps={{ onClick: () => setTechnicianDialog(true), id: 'add-technician' }}
            addButtonText="Assign"
            isActionButtonVisible={true}
            actionButtonMenuItems={actionButtonMenuItems()}
            actionButtonProps={{ disabled: !Boolean(selectedRecords?.length) }}
            leftSideContents={resourcePolicy?.addServices && serviceOption?.length > 1 ? leftSideContents() : null}
            hasXpadding
            previewDownloadProps={{
              fileName: sidebarResource.employeeMaster,
              resource: sidebarResource.employeeMaster,
              referenceId: serviceOrderData?._id,
              columns: [],
              hideDetailButton: true,
              hideDialog: true
            }}
          />
        </>
      )}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 12, sm: 12 }}>
          {columns ? (
            <CustomReactTable
              height={stepFullScreen ? 'calc(100vh - 300px)' : '300px'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              renderedFrom={renderedFrom}
              isClientSideGrid={true}
              hideSelection={!allowedToEdit}
              hideAction={!allowedToEdit}
              refreshGrid={fetchData}
            />
          ) : (
            <Box p={2} height={300}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </Grid>
      </Grid>
      {resourcePolicy?.addConsumables ? (
        <Box mt={2}>
          <Consumables
            allowedToEdit={allowedToEdit}
            serviceOrderData={serviceOrderData}
            serviceOrderFields={serviceOrderFields}
            stepFullScreen={stepFullScreen}
            fetchData={fetchserviceOrderData}
            technicians={dataRows}
            allConsumables={allConsumables}
            fetchConsumablesData={fetchAllConsumables}
          />
        </Box>
      ) : null}
      {technicianDialog && (
        <AssignEmployeeDialog
          onSuccess={(data) => {
            handleAssign(data);
          }}
          handleClose={() => {
            setTechnicianDialog(false);
          }}
          isSubmitting={isSubmitting}
          warehouse={serviceOrderData?.warehouse?.optionValue}
          ids={dataRows?.map((d) => d?.technicianId)}
          defaultCompetencyType={
            selectedService?.competencyType
              ? isObject(selectedService?.competencyType)
                ? [selectedService?.competencyType]
                : isArray(selectedService?.competencyType)
                  ? selectedService?.competencyType
                  : []
              : []
          }
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
      {openTechnicianEditDialog.open && (
        <TechnicianDialog
          handleClose={() => {
            setOpenTechnicianEditDialog({ open: false, data: null });
          }}
          serviceOrderData={serviceOrderData}
          technicianData={openTechnicianEditDialog.data}
          loading={isSubmitting}
          handleUpdate={handleUpdateTechnician}
        />
      )}
      {consumablesDialog.open && (
        <ConsumablesDialog
          serviceOrderData={serviceOrderData}
          consumables={consumablesDialog.consumables}
          onClose={() => setConsumablesDialog({ open: false, consumables: [] })}
          onSubmit={(data) => {
            setStartEndDateConfermationDialog((prev) => ({ ...prev, open: true, products: data }));
          }}
        />
      )}
      {startEndDateConfermationDialog.open && (
        <StartStopDateDialog
          type={startEndDateConfermationDialog.type}
          resource={sidebarResource.fieldServiceOrder}
          onClose={() => {
            setStartEndDateConfermationDialog({ open: false, type: null, minDateTime: null, notes: '', products: [], _id: null });
          }}
          handleSubmit={(value) => {
            handleUpdateStartEndDate(
              value,
              startEndDateConfermationDialog.type,
              startEndDateConfermationDialog.products,
              startEndDateConfermationDialog._id
            );
          }}
          loading={isSubmitting}
          minStartDateTime={startEndDateConfermationDialog.minDateTime}
          notes={startEndDateConfermationDialog.notes}
        />
      )}
      {viewStartStopLog?.open && (
        <StartStopLogsDialog
          onClose={() => {
            setViewStartStopLog({ open: false, technicianId: null });
          }}
          referenceId={serviceOrderData?._id}
          service={null}
          technician={viewStartStopLog?.technicianId}
          fetchRecords={fetchData}
          resource={sidebarResource.fieldServiceOrder}
        />
      )}
      {showConfirmBox.open && (
        <ConfirmationDialog
          open={showConfirmBox.open}
          message={`A technician is already scheduled during these dates. Do you still wish to proceed with this assignment?`}
          onClose={() => {
            setShowConfirmBox({ open: false, rows: [] });
          }}
          onOk={() => {
            handleAssign(showConfirmBox.rows, true);
          }}
        />
      )}
    </>
  );
};

export default Technicians;
