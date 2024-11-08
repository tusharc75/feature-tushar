import MomentUtils from '@date-io/moment';
import { Box, IconButton, MenuItem } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import { camelCase, startCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import CustomReactTable, { getStaticFields, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomContainer from '../../components/CustomContainer';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import { gridLoadingTimeout, prepareDataForGrid, sidebarResource } from '../../constants/helpers';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import ManageScheduleReport from './ManageScheduleReport';
import axios, { CancelTokenSource } from 'axios';
import NoDataCell from 'src/components/Helpers/NoDataCell';

const renderedFrom = 'schedule-report';

const ScheduleReport = () => {
  const toastConfig = useContext(CustomToastContext);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, filters, sorting, selectedRecords } = state;

  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState({ open: false, id: null });
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);

  const [columns, setColumns] = useState(null);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [page, limit, filters, sorting, selectedEntity]);

  const fetchGridColumns = () => {
    let columns = [
      {
        accessor: 'scheduleName',
        Header: 'Schedule Name',
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (
          row?.original?.scheduleName ? <p
            className="text-truncate link"
            onClick={() => {
              if (permissions?.scheduleReport?.isUpdate) {
                setShowManageDialog({ open: true, id: row?.original?._id });
              }
            }}
          >
            {row.original.scheduleName}
          </p>
            : <NoDataCell />)
      },
      {
        accessor: 'resource',
        Header: 'Report',
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (row?.original?.resource ? <p className="text-truncate">{row.original.resource}</p> : <NoDataCell />)
      },
      {
        accessor: 'subscribeUsers',
        Header: 'Subscribe Users',
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (row?.original?.subscribeUsers?.length ? <p className="text-truncate">{row.original.subscribeUsers}</p> : <NoDataCell />)
      },
      {
        accessor: 'frequency',
        Header: 'Frequency',
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (row?.original?.frequency ? <p className="text-truncate">{row.original.frequency}</p> : <NoDataCell />)
      },
      {
        accessor: 'day',
        Header: 'Day',
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (row?.original?.day ? <p className="text-truncate">{row.original.day}</p> : <NoDataCell />)
      },
      {
        accessor: 'reportAction',
        Header: 'Report Action',
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (row?.original?.reportAction ? <p className="text-truncate">{row.original.reportAction}</p> : <p className="text-truncate">{'Email'}</p>)
      },
      {
        accessor: 'time',
        Header: 'Time',
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (row?.original?.time ? <p className="text-truncate">{row.original.time}</p> : <NoDataCell />)
      },
      ...getStaticFields(),
      ActionsRenderer
    ];
    setColumns(columns);
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 100,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        {permissions?.scheduleReport?.isDelete && (
          <HtmlTooltip title="Delete">
            <IconButton
              size="small"
              aria-label="Delete"
              onClick={() => {
                setDeleteRecord(row.original);
                setShowDeleteConfirmBox(true);
              }}
            >
              <DeleteIcon color="error" />
            </IconButton>
          </HtmlTooltip>
        )}
      </>
    )
  };

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .get(`${routes?.scheduleReport.path}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data } }) => {
        let count = data?.length;
        let rows = data?.map((u) => {
          let finalObject: any = prepareDataForGrid(u);

          finalObject.resource = routes[camelCase(finalObject.resource)] ? routes[camelCase(finalObject.resource)]?.title : finalObject.resource;
          finalObject.subscribeUsers = finalObject.subscribeUsers.length
            ? finalObject.subscribeUsers.map((user: any) => `${user?.firstName} ${user?.lastName}`).join(', ')
            : [];
          finalObject.date = new Date(finalObject.date).toDateString();
          // finalObject.time = new Date(finalObject.time).toLocaleTimeString();
          finalObject.column = finalObject.column
            .split(',')
            .map((s: string) => startCase(s))
            .join(', ');
          finalObject.filters = finalObject.filters.length > 0 ? finalObject.filters.map((item) => startCase(item.term)) : [];
          return finalObject;
        });
        dispatch({ type: 'initialize', data: rows, count: count });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      })
      .finally(() => {
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      });
  };

  const handleDelete = () => {
    setIsSubmitting(true);
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords?.map((d) => d._id);
    }
    axiosInstance()
      .put(`${routes?.scheduleReport.path}/remove`, { ids: ids })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          type: 'success',
          message: data.message,
          open: true
        });
        dispatch({ type: 'selection', selectedRecords: [] });
        fetchData();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
        setIsSubmitting(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsSubmitting(false);
      });
  };

  const ActionMenuItems = () => {
    return (
      <>
        <MenuItem
          onClick={() => {
            setShowDeleteConfirmBox(true);
          }}
        >
          {`Delete (${selectedRecords?.length})`}
        </MenuItem>
      </>
    );
  };

  return (
    <MuiPickersUtilsProvider utils={MomentUtils}>
      <section className="main-container-v1">
        <div className="headerbox-v1">
          <CustomBreadCrumbs
            routes={[
              { title: 'Reports', path: '/reports' },
              { title: 'Schedule Report', path: '' }
            ]}
          />
        </div>
        <CustomContainer>
          <ListingPageHeader
            isActionButtonVisible={permissions?.scheduleReport?.isDelete}
            actionButtonProps={{ disabled: selectedRecords?.length ? false : true }}
            actionMenuItems={<ActionMenuItems />}
            addButtonOnclick={() => {
              setShowManageDialog({ open: true, id: null });
            }}
            isAddButtonVisible={permissions?.scheduleReport?.isCreate}
          />

          {columns ? (
            <CustomReactTable
              height={'calc(100vh - 200px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              renderedFrom={renderedFrom}
              refreshGrid={fetchData}
              showOnlyShowFilteredRecordSwitch={false}
              showFilters={false}
              resource={sidebarResource.scheduleReport}
            />
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </CustomContainer>
        {showDeleteConfirmBox && (
          <ConfirmationDialog
            open={showDeleteConfirmBox}
            message={`Are you sure you want to delete ${routes?.scheduleReport?.title.toLowerCase()} ${deleteRecord?.scheduleName || ''} ?`}
            onClose={() => {
              setDeleteRecord(null);
              setShowDeleteConfirmBox(false);
            }}
            okBtnLoading={isSubmitting}
            onOk={handleDelete}
          />
        )}
        {showManageDialog.open && (
          <ManageScheduleReport
            id={showManageDialog.id}
            handleClose={() => setShowManageDialog({ open: false, id: null })}
            onSuccess={() => {
              fetchData();
              setShowManageDialog({ open: false, id: null });
            }}
          />
        )}
      </section>
    </MuiPickersUtilsProvider>
  );
};

export default ScheduleReport;
