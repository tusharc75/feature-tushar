import { Box, IconButton, TextField } from '@material-ui/core';
import moment from 'moment';
import { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { dateFormat, rentalManagement, sidebarResource } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import AssignTechnicianDialog from '../Roadmap/AssignTechnicianDialog';
import { Autocomplete } from '@material-ui/lab';
import { useData } from 'src/StateProvider/Provider';
import ConfirmationDialogRaw from 'src/components/Helpers/ConfirmationDialog';
import { FiExternalLink } from 'react-icons/fi';

const renderedFrom = `service_order_technician`;

function ServiceOrder({ assignTechnicianDialog, unAssignTechnicianDialog, handleSucess, handleClose, updateSelectedRecord }) {
  const {
    state: { permissions,resources }
  }: any = useData();

  const TECHNICIAN_RESOURCE = [
  {
    key: 'fieldTicket',
    resource: sidebarResource.fieldTicket,
    title: resources?.fieldTicketDetail?.titlePlural
  },
  {
    key: 'rentalManagement',
    resource: sidebarResource.rentalManagement,
    title: routes.rentalManagementDetail.title
  },
];

  const toastConfig = useContext(CustomToastContext);
  const [columns, setColumns] = useState(null);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { selectedRecords } = state;

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const options: any = [];
    TECHNICIAN_RESOURCE?.forEach((item) => {
      if (permissions[item.key] && permissions[item.key]?.isRead === true) {
        options.push({ ...item, title: routes[item.key] ? routes[item.key]?.title : item.title });
      }
    });
    setServiceTypes(options);
    setSelectedType(options[0]?.key || '');
  }, []);

  useEffect(() => {
    updateSelectedRecord(selectedRecords);
  }, [selectedRecords]);

  useEffect(() => {
    if (selectedType) {
      fetchData();
      fetchGridColumns();
    }
  }, [selectedType]);

  const fetchData = (type = '') => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    if (type === '') {
      type = serviceTypes?.find((e) => e.key === selectedType)?.resource || serviceTypes[0]?.resource || '';
    }
    axiosInstance()
      .get(`/technician-scheduler/un-assign-service?type=${type}`)
      .then(({ data: { data } }) => {
        const rows: any = [];
        data?.forEach((ele, index) => {
          const obj: any = { ...ele };
          obj.index = index + 1;
          (obj._id = ele?.service?.uniqueId), (obj.resourceId = ele._id);
          obj.warehouse = ele?.warehouse?.optionValue;
          obj.fieldServiceOrder = ele?.fieldServiceOrder?.optionLabel;
          obj.fieldServiceOrderId = ele?.fieldServiceOrder?.optionValue;
          obj.serviceName = ele?.service?.serviceName;
          obj.serviceId = ele?.service?._id;
          obj.competencyType = ele?.service?.competencyType?.optionLabel;
          obj.competencies = ele?.service?.competencies?.map((e) => e?.optionLabel)?.toString();
          obj.service = ele?.service;
          obj.customerAccount = ele?.customerAccount?.optionLabel;
          obj.customerAccountId = ele?.customerAccount?.optionValue;
          obj.estimateStartDate = ele?.service?.estimateStartDate;
          obj.estimateEndDate = ele?.service?.estimateEndDate;
          rows.push(obj);
        });
        dispatch({ type: 'initialize', data: rows, count: rows?.length });
        dispatch({ type: 'loading', loading: false });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const fetchGridColumns = () => {
    setColumns(null);
    const columns = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>
      },
      ...(selectedType === 'fieldTicket'
        ? [
          {
            accessor: 'fieldServiceOrderNumber',
            Header: 'Field Service Order',
            width: 200,
            Cell: ({ row }) => (
              <div className="flex items-center gap-1">
                <p title={row.original.fieldServiceOrder}>{row.original.fieldServiceOrder}</p>
                <IconButton
                  size="small"
                  onClick={() => {
                    window.open(`${routes.fieldServiceOrderDetail.path}/${row.original.fieldServiceOrderId}`);
                  }}
                >
                  <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                </IconButton>
              </div>
            )
          },
          {
            accessor: 'fieldTicketNumber',
            Header: 'Field Ticket',
            width: 200,
            Cell: ({ row }) =>
              row.original['fieldTicketNumber'] ? (
                <div className="flex items-center gap-1">
                  <p title={row.original.fieldTicketNumber}>{row.original.fieldTicketNumber}</p>
                  <IconButton
                    size="small"
                    onClick={() => {
                      window.open(`${routes.fieldTicketDetail.path}/${row.original.resourceId}`);
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
        : selectedType === 'rentalManagement'
          ? [
            {
              accessor: 'rentalJobName',
              Header: 'Rental Job',
              width: 200,
              Cell: ({ row }) =>
                row.original['rentalJobName'] ? (
                  <div className="flex items-center gap-1">
                    <p title={row.original.rentalJobName}>{row.original.rentalJobName}</p>
                    <IconButton
                      size="small"
                      onClick={() => {
                        window.open(`${routes.rentalManagementDetail.path}/${row.original.resourceId}`);
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
      {
        accessor: 'serviceName',
        Header: 'Service Name',
        width: 250,
        Cell: ({ row }) =>
          row.original.serviceName && row.original.serviceId ? (
            <div className="flex items-center gap-1">
              <p title={row.original.serviceName}>{row.original.serviceName}</p>
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
      },
      {
        accessor: 'competencyType',
        Header: 'Competency Type',
        width: 250,
        Cell: ({ row }) => (row.original['competencyType'] ? <p className="text-truncate">{row.original.competencyType}</p> : <NoDataCell />)
      },
      {
        accessor: 'competencies',
        Header: 'Competencies',
        width: 250,
        Cell: ({ row }) => (row.original['competencies'] ? <p className="text-truncate">{row.original.competencies}</p> : <NoDataCell />)
      },
      {
        accessor: 'customerAccount',
        Header: 'Customer Account',
        width: 250,
        Cell: ({ row }) =>
          row.original['customerAccount'] ? (
            <div className="flex items-center gap-1">
              <p title={row.original['customerAccount']}>{row.original['customerAccount']}</p>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${routes.customerAccountDetail.path}/${row.original.customerAccountId}`);
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            </div>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'estimateStartDate',
        Header: 'Estimate Start Date',
        width: 200,
        Cell: ({ row }) =>
          row.original['estimateStartDate'] ? (
            <p className="text-truncate">{moment(row.original.estimateStartDate).format(dateFormat)}</p>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'estimateEndDate',
        Header: 'Estimate End Date',
        width: 200,
        Cell: ({ row }) =>
          row.original['estimateEndDate'] ? (
            <p className="text-truncate">{moment(row.original.estimateEndDate).format(dateFormat)}</p>
          ) : (
            <NoDataCell />
          )
      }
    ];

    setColumns(columns);
  };

  const handleUnAssign = () => {
    setIsSubmitting(true);
    axiosInstance()
      .put(`${rentalManagement.api}/technician`, { ids: [{ id: unAssignTechnicianDialog?.data?.technicianHistoryId }] })
      .then(() => {
        handleSucess();
        setIsSubmitting(false);
      })
      .catch((error) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  const height = 400;
  return (
    <Box pt={3}>
      <Box style={{ maxWidth: '400px' }} mb={2} mt={2}>
        <Autocomplete
          size="small"
          style={{ minWidth: '300px' }}
          fullWidth
          options={serviceTypes || []}
          autoHighlight
          value={serviceTypes?.find((e) => e.key === selectedType) || null}
          getOptionLabel={(option: any) => option?.title || ''}
          getOptionSelected={(option, val) => (option ? option?.title === val?.title : false)}
          onChange={(_, val) => {
            setSelectedType(val.key);
            fetchData(val.resource);
          }}
          renderInput={(params) => <TextField {...params} label={'Select Type'} variant="outlined" />}
        />
      </Box>
      {columns ? (
        <Box zIndex={5} width={'100%'}>
          <CustomReactTable
            height={`${height}px`}
            columns={columns}
            state={state}
            dispatch={dispatch}
            refreshGrid={fetchData}
            hideAction={true}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
          />
        </Box>
      ) : (
        <Box p={2} height={height}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {assignTechnicianDialog.open && (
        <AssignTechnicianDialog
          technicianData={assignTechnicianDialog.data}
          selectedServiceOrder={selectedRecords}
          handleSucess={() => {
            fetchData();
            handleSucess();
          }}
          handleClose={() => {
            handleClose();
          }}
        />
      )}
      {unAssignTechnicianDialog.open && (
        <ConfirmationDialogRaw
          open={true}
          message={`Are you sure you want to un-assign technician ?`}
          okBtnLoading={isSubmitting}
          onClose={handleClose}
          onOk={handleUnAssign}
        />
      )}
    </Box>
  );
}

export default ServiceOrder;
