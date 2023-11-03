import { Box, IconButton, TextField } from '@material-ui/core';
import moment from 'moment';
import { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { dateFormat, sidebarResource } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import AssignTechnicianDialog from '../Roadmap/AssignTechnicianDialog';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import CustomTabs, { CustomTab } from 'src/components/CustomTabs';
import { Autocomplete } from '@material-ui/lab';
import { useData } from 'src/StateProvider/Provider';

const TECHNICIAN_RESOURCE = [
  {
    key: 'rentalManagement',
    resource: sidebarResource.rentalManagement,
    title: routes.rentalManagementDetail.title
  },
  {
    key: 'fieldTicket',
    resource: sidebarResource.fieldTicket,
    title: routes.fieldTicketDetail.title
  }
];

function ServiceOrder({ assignTechnicianDialog, handleSucess, handleClose, selectedRecords, setSelectedRecords }) {
  const {
    state: { permissions }
  }: any = useData();

  const toastConfig = useContext(CustomToastContext);
  const [rowsData, setRowsData] = useState(null);
  const [columns, setColumns] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(serviceTypes[0]?.key || '');

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
    fetchData();
    fetchColumns();
  }, [selectedType]);

  const fetchData = (type = '') => {
    if (type === '') {
      type = serviceTypes?.find((e) => e.key === selectedType)?.resource || serviceTypes[0]?.resource || '';
    }
    setSelectedRecords([]);
    setRowsData(null);
    axiosInstance()
      .get(`/technician-scheduler/un-assign-service?type=${type}`)
      .then(({ data: { data } }) => {
        const rows: any = [];
        data?.forEach((ele, index) => {
          const obj: any = { ...ele };
          obj.index = index + 1;
          obj._id = ele._id;
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
        setRowsData(rows);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const fetchColumns = () => {
    setColumns(null);
    const columns = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 50,
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>
      },
      ...(selectedType === 'fieldTicket'
        ? [
            {
              accessor: 'fieldServiceOrderNumber',
              Header: 'Field Service Order',
              width: 200,
              Cell: ({ row }) => (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <p title={row.original.fieldServiceOrder}>{row.original.fieldServiceOrder}</p>
                  <Box ml={1}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        window.open(`${routes.fieldServiceOrderDetail.path}/${row.original.fieldServiceOrderId}`);
                      }}
                    >
                      <OpenInNewIcon fontSize="small" color="primary" />
                    </IconButton>
                  </Box>
                </div>
              )
            },
            {
              accessor: 'fieldTicketNumber',
              Header: 'Field Ticket',
              width: 200,
              Cell: ({ row }) =>
                row.original['fieldTicketNumber'] ? (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <p title={row.original.fieldTicketNumber}>{row.original.fieldTicketNumber}</p>
                    <Box ml={1}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          window.open(`${routes.fieldTicketDetail.path}/${row.original._id}`);
                        }}
                      >
                        <OpenInNewIcon fontSize="small" color="primary" />
                      </IconButton>
                    </Box>
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
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <p title={row.original.rentalJobName}>{row.original.rentalJobName}</p>
                    <Box ml={1}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          window.open(`${routes.rentalManagementDetail.path}/${row.original._id}`);
                        }}
                      >
                        <OpenInNewIcon fontSize="small" color="primary" />
                      </IconButton>
                    </Box>
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
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <p title={row.original.serviceName}>{row.original.serviceName}</p>
              <Box ml={1}>
                <IconButton
                  size="small"
                  onClick={() => {
                    window.open(`${routes.serviceMasterDetail.path}/${row.original.serviceId}`);
                  }}
                >
                  <OpenInNewIcon fontSize="small" color="primary" />
                </IconButton>
              </Box>
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
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <p title={row.original['customerAccount']}>{row.original['customerAccount']}</p>
              <Box ml={1}>
                <IconButton
                  size="small"
                  onClick={() => {
                    window.open(`${routes.customerAccountDetail.path}/${row.original.customerAccountId}`);
                  }}
                >
                  <OpenInNewIcon fontSize="small" color="primary" />
                </IconButton>
              </Box>
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

      {columns && rowsData ? (
        <Box zIndex={5} width={'100%'}>
          <CustomReactTable
            height={`${height}px`}
            columns={columns}
            data={rowsData}
            onSelect={setSelectedRecords}
            childrenProperty="subRows"
            uniqueKey="_id"
            hideAction={true}
            renderedFrom={`service_order_technician`}
            isClientSideGrid={false}
            hideExpander={true}
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
    </Box>
  );
}

export default ServiceOrder;
