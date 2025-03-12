import { IconButton, MenuItem } from '@mui/material';
import Box from '@mui/material/Box/Box';
import Grid from '@mui/material/Grid2';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { displayDate, fieldServiceOrder, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import routes from '../../../components/Helpers/Routes';
import { FiExternalLink } from 'react-icons/fi';
import DropdownCell from 'src/components/CustomReactTable/Cells/DropdownCell';
import DateDialog from '../DateDialog';
import { Link } from 'react-router-dom';

const TechnicianDispatch = ({ allowedToEdit, serviceOrderId, stepFullScreen }) => {
  const renderedFrom = `${camelCase(sidebarResource.fieldServiceOrder)}_TechnicianReceive`;

  const toastConfig = useContext(CustomToastContext);
  const [columns, setColumns] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [receiveDateDialog, setReceiveDateDialog] = useState({ open: false, data: null, minDate: null });

  const {
    state: { permissions }
  }: any = useData();
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { selectedRecords } = state;

  useEffect(() => {
    fetchColumns();
    fetchData();
  }, []);

  const fetchColumns = async () => {
    const column: any = [
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
        />
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
        />
      },
      {
        accessor: 'dispatchedDate',
        Header: 'Dispatched Date',
        disableFilters: true,
        disableSortBy: true,
        width: 250,
        Cell: ({ row }) => (row.original?.startDate ? <p>{displayDate(row.original?.startDate)}</p> : <NoDataCell />)
      },
      {
        accessor: 'startedBy',
        Header: 'Dispatched By',
        disableFilters: true,
        disableSortBy: true,
        Cell: ({ row }) =>
          row?.original?.startedById ? (
            <Link
              className="link text-truncate"
              title={row?.original?.startedBy}
              to={`${routes.userDetail.path}/${row?.original?.startedById}`}
              target={'_blank'}
            >
              {row?.original?.startedBy}
            </Link>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'receiveDate',
        Header: 'Receive Date',
        disableFilters: true,
        disableSortBy: true,
        width: 250,
        Cell: ({ row }) => (row.original?.endDate ? <p>{displayDate(row.original?.endDate)}</p> : <NoDataCell />)
      },
      {
        accessor: 'endedBy',
        Header: 'Receive By',
        disableFilters: true,
        disableSortBy: true,
        Cell: ({ row }) =>
          row?.original?.endedById ? (
            <Link
              className="link text-truncate"
              title={row?.original?.endedBy}
              to={`${routes.userDetail.path}/${row?.original?.endedById}`}
              target={'_blank'}
            >
              {row?.original?.endedBy}
            </Link>
          ) : (
            <NoDataCell />
          )
      },
    ];
    setColumns(column);
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });

    let api = `${fieldServiceOrder.api}/technician?fieldServiceOrder=${serviceOrderId}`;
    axiosInstance()
      .get(api)
      .then(({ data: { data } }) => {
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

        dispatch({ type: 'initialize', data: rows, count: rows?.length });
        dispatch({ type: 'loading', loading: false });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleReceive = (ids, date) => {
    setSubmitting(true);
    axiosInstance()
      .post(`${fieldServiceOrder.api}/technician/receive`, { _ids: ids, date: date, fieldServiceOrder: serviceOrderId })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
        setSubmitting(false);
        setReceiveDateDialog({ open: false, data: null, minDate: null });
        fetchData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setSubmitting(false);
        setReceiveDateDialog({ open: false, data: null, minDate: null });
      });
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        <HtmlTooltip title={'Receive Technicians'}>
          <MenuItem
            disabled={submitting || selectedRecords?.some((d) => !d?.startDate)}
            onClick={() => {
              const minDate = new Date(
                Math.min(...selectedRecords.map((d) => new Date(d.startDate).getTime()))
              );
              setReceiveDateDialog({ open: true, data: selectedRecords?.map((d) => d?._id), minDate: minDate });
            }}
          >
            Receive
          </MenuItem>
        </HtmlTooltip>
      </>
    );
  };

  return (
    <>
      <Box className="container-with-border" p={2} style={{ WebkitBorderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        {allowedToEdit && (
          <>
            <DetailsPageHeader
              isAddButtonVisible={false}
              isActionButtonVisible={true}
              actionButtonMenuItems={actionButtonMenuItems()}
              actionButtonProps={{ disabled: !Boolean(selectedRecords?.length) }}
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
      </Box>
      {receiveDateDialog.open && (
        <DateDialog
          title={'Select Receive Date'}
          onClose={() => {
            setReceiveDateDialog({ open: false, data: null, minDate: null });
          }}
          handleSubmit={(date) => {
            handleReceive(receiveDateDialog.data, date);
          }}
          loading={submitting}
          minDate={receiveDateDialog.minDate}
        />
      )}
    </>
  );
};

export default TechnicianDispatch;