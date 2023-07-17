import { Box, Grid, IconButton, makeStyles, Paper, TextField } from '@material-ui/core';
import moment from 'moment';
import { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { dateTimeFormat } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import AssignTechnicianDialog from '../Roadmap/AssignTechnicianDialog';
import { Link } from 'react-router-dom';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';


function ServiceOrder({ assignTechnicianDialog, handleSucess, handleClose, selectedRecords, setSelectedRecords }) {
  const toastConfig = useContext(CustomToastContext);
  const [rowsData, setRowsData] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    axiosInstance()
      .get(`/technician-scheduler/un-assign-service`)
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

  const columns = [
    {
      accessor: 'index',
      Header: 'Index',
      width: 50,
      Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>
    },
    {
      accessor: 'fieldServiceOrderNumber',
      Header: 'Field Service Order',
      width: 200,
      Cell: ({ row }) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <p
            title={row.original.fieldServiceOrder}
          >
            {row.original.fieldServiceOrder}
          </p>
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
      Cell: ({ row }) => (
        row.original['fieldTicketNumber'] ? (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <p
              title={row.original.fieldTicketNumber}
            >
              {row.original.fieldTicketNumber}
            </p>
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
        ) : (<NoDataCell />)
      )
    },
    {
      accessor: 'serviceName',
      Header: 'Service Name',
      width: 250,
      Cell: ({ row }) => (
        row.original.serviceName && row.original.serviceId ? (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <p
              title={row.original.serviceName}
            >
              {row.original.serviceName}
            </p>
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
        ) : (<NoDataCell />)
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
            <p
              title={row.original['customerAccount']}
            >
              {row.original['customerAccount']}
            </p>
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
        ) : (<NoDataCell />)
    },
    {
      accessor: 'estimateStartDate',
      Header: 'Estimate Start Date',
      width: 200,
      Cell: ({ row }) =>
        row.original['estimateStartDate'] ? (
          <p className="text-truncate">{moment(row.original.estimateStartDate).format(dateTimeFormat)}</p>
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
          <p className="text-truncate">{moment(row.original.estimateEndDate).format(dateTimeFormat)}</p>
        ) : (
          <NoDataCell />
        )
    }
  ];

  const height = window.innerHeight / 2 - 200;

  return (
    <Box pt={3} style={{ height: height }}>
      {columns && rowsData ? (
        <Box zIndex={5} width={'100%'} height={height}>
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
        <Box p={2} height={height} bgcolor="white">
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
