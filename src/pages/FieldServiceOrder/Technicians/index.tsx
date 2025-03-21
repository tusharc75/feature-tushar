import { Autocomplete, IconButton, MenuItem, TextField } from '@mui/material';
import Box from '@mui/material/Box/Box';
import Grid from '@mui/material/Grid2';
import DeleteIcon from '@mui/icons-material/Delete';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import AssignEmployeeDialog from 'src/components/AssignRolesDialog/AssignEmployeeDialog';
import CustomReactTable, { AccessorFunction, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { fieldServiceOrder, MATERIAL_TYPE, prepareDataForGrid, SERVICE_ORDER_STATUS, sidebarResource } from 'src/constants/helpers';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import routes from '../../../components/Helpers/Routes';
import { FiExternalLink } from 'react-icons/fi';
import DropdownCell from 'src/components/CustomReactTable/Cells/DropdownCell';
import Consumables from 'src/pages/FieldServiceOrder/Technicians/Consumables';

const Technicians = ({ allowedToEdit, serviceOrderData, fetchData: fetchserviceOrderData, resourcePolicy, stepFullScreen, setNextStep, handleChangeStatus }) => {

  const renderedFrom = `${camelCase(sidebarResource.fieldServiceOrder)}_Technicians`;

  const toastConfig = useContext(CustomToastContext);
  const [columns, setColumns] = useState(null);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [technicianDialog, setTechnicianDialog] = useState(false);
  const [refreshChild, setRefreshChild] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serviceOption, setServiceOption] = useState(null);
  const [selectedService, setSelectedService] = useState(null);

  const {
    state: { permissions }
  }: any = useData();
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;

  useEffect(() => {
    fetchColumns();
  }, []);

  useEffect(() => {
    if (resourcePolicy?.addServices) {
      fetchServices();
    }
  }, [resourcePolicy?.addServices]);

  useEffect(() => {
    fetchData();
  }, [selectedService]);

  const fetchColumns = async () => {
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
      {
        accessor: 'competencyType',
        Header: 'Competency Type',
        width: 250,
        Cell: ({ row }) => <DropdownCell
          permissions={permissions}
          permissionForLinks={{}}
          field={{
            fieldName: 'competencyType',
            lookupResource: sidebarResource.competencyType
          }}
          original={row?.original}
        />,
        accessorFn: (original) => AccessorFunction(original, 'competencyType'),
      },
      {
        accessor: 'competencies',
        Header: 'Competencies',
        width: 250,
        Cell: ({ row }) => <DropdownCell
          permissions={permissions}
          permissionForLinks={{}}
          field={{
            fieldName: 'competencies',
            lookupResource: sidebarResource.competencies
          }}
          original={row?.original}
        />,
        accessorFn: (original) => AccessorFunction(original, 'competencies'),
      },
      {
        accessor: 'action',
        Header: 'Actions',
        minWidth: 100,
        width: 100,
        sticky: 'right',
        disableFilters: true,
        disableSortBy: true,
        canDrag: false,
        Cell: ({ row }) => {
          return allowedToEdit ? (
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
          ) : null;
        }
      }
    ];
    if (resourcePolicy?.addServices) {
      column.splice(3, 0, {
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
      });
    }
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
    axiosInstance().get(api).then(({ data: { data } }) => {
      let rows = data?.technician?.map((u, i) => {
        let res: any = {
          ...prepareDataForGrid(u)
        };
        res.index = i + 1;
        res.technicianName = u?.technician['firstName'] + ' ' + u?.technician['lastName'];
        res.technicianId = u?.technician['_id'];
        res.competencyType = u?.technician?.competencyType;
        res.competencies = u?.technician?.competencies;
        return res;
      });
      if (rows?.length > 0) {
        setNextStep(true);
      }
      dispatch({ type: 'initialize', data: rows, count: rows?.length });
      dispatch({ type: 'loading', loading: false });
      setRefreshChild(!refreshChild);
    }).catch((error) => {
      setNextStep(false);
      toastConfig.setToastConfig(error);
    });
  };

  const fetchServices = async () => {
    let data;
    const response = await axiosInstance().get(`${fieldServiceOrder.api}/${serviceOrderData?._id}/material?type=${MATERIAL_TYPE.service}`);
    data = response?.data?.data?.material;
    const services = [{ optionLabel: 'All', optionValue: 'All', _id: null, competencies: [] }];
    data?.map((d) => {
      services.push({ optionLabel: d?.serviceDetail?.serviceName, optionValue: d?.materialId, _id: d?._id, competencies: d?.serviceDetail?.competencies });
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
        setDeleteData(null);
      })
      .catch((error) => {
        setIsDeleting(false);
        toastConfig.setToastConfig(error);
        setDeleteData(null);
      });
  };

  const handleAssign = (rows) => {
    setIsSubmitting(true);
    const technician: any = [];
    rows.forEach((d) => {
      const element: any = {};
      element.technician = d?._id;
      element.fieldServiceOrder = serviceOrderData?._id;
      element.warehouse = serviceOrderData?.warehouse?.optionValue;
      element.service = selectedService?.optionValue !== 'All' ? selectedService?.optionValue : null;
      element.uniqueId = selectedService?.optionValue !== 'All' ? selectedService?._id : null;
      technician.push(element);
    });
    axiosInstance()
      .post(`${fieldServiceOrder.api}/technician`, { technician })
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
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsSubmitting(false);
      });
  };

  const actionButtonMenuItems = () => {
    return (
      <>
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

  return (
    <>
      {allowedToEdit && (
        <>
          <DetailsPageHeader
            isAddButtonVisible={true}
            addButtonProps={{ onClick: () => setTechnicianDialog(true), id: 'add-technician' }}
            addButtonText='Assign'
            isActionButtonVisible={true}
            actionButtonMenuItems={actionButtonMenuItems()}
            actionButtonProps={{ disabled: !Boolean(selectedRecords?.length) }}
            leftSideContents={resourcePolicy?.addServices ? leftSideContents() : null}
            hasXpadding
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
      {resourcePolicy?.addConsumables ?
        <Box mt={2}>
          <Consumables
            allowedToEdit={allowedToEdit}
            serviceOrderData={serviceOrderData}
            stepFullScreen={stepFullScreen}
            fetchData={fetchserviceOrderData}
            technicians={dataRows}
            refreshChild={refreshChild}
            fetchConsumablesData={fetchData}
          />
        </Box>
        : null}
      {technicianDialog && (
        <AssignEmployeeDialog
          reference={camelCase(sidebarResource.fieldServiceOrder)}
          onSuccess={(data) => {
            handleAssign(data);
          }}
          handleClose={() => {
            setTechnicianDialog(false);
          }}
          isSubmitting={isSubmitting}
          warehouse={serviceOrderData?.warehouse?.optionValue}
          ids={dataRows?.map((d) => d?.technicianId)}
          defaultCompetency={selectedService?.competencies || []}
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

export default Technicians;
