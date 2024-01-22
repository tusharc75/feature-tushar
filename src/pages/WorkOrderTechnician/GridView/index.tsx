import { Box, Button, IconButton, Menu, MenuItem, Tab, Tabs } from '@material-ui/core';
import { camelCase } from 'lodash';
import { useHistory } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { WORKORDER_SERVICE_STATUS, gridLoadingTimeout, prepareDataForGrid, sidebarResource, workOrder } from 'src/constants/helpers';
import { Link } from 'react-router-dom';
import DescriptionIcon from '@material-ui/icons/Description';
import VisibilityIcon from '@material-ui/icons/Visibility';
import DiagramDialog from 'src/pages/WorkOrder/Diagram/DiagramDialog';
import { ExpandMore, Info } from '@material-ui/icons';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import TechnicianDialog from '../TechnicianDialog';

const GridView = ({ serviceStatus, filterQuery }) => {
  const renderedFrom = camelCase(routes?.workOrderTechnician.title);
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();

  const [showDrawingDialog, setShowDrawingDialog] = useState({ open: false, workOrder: null });
  const { generateColumns } = useColumns();
  const {
    state: { user }
  }: any = useData();

  const { state, dispatch } = useTableReducer();
  const { page, limit, sorting, selectedRecords } = state;

  const [tabValue, setTabValue] = useState('');
  const [anchorActionEl, setAnchorActionEl] = useState(null);
  const [showServiceCompleteConfirmBox, setShowServiceCompleteConfirmBox] = useState(false);
  const [isServiceCompleting, setIsServiceCompleting] = useState(false);
  const [columns,setColumns] = useState(null);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    setTabValue(serviceStatus[0]);
  }, [serviceStatus]);

  useEffect(()=>{
   fetchGridColumns();
  },[])

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: string) => {
    setTabValue(newValue);
  };

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=${sidebarResource['workOrder']}&view=true`);
    data = response?.data?.data;
 
    const newColumns = generateColumns(renderedFrom, data, routes.workOrderDetail.path, true);
    const columns = newColumns.filter((ele)=>ele.accessor!='owner' && ele.accessor!='collaborator' && ele.accessor!='workOrderNumber' );
    
  const extraColumns = [
    {
      accessor: 'serviceName',
      Header: 'Service',
      disableFilters: true,
      disableSortBy: true,
      Cell: ({ row }) => (
        <>
          {row?.original?.serviceName ? (
            <div>
              <h5
                className="link text-truncate"
                onClick={() => {
                  setSelectedService({
                    uniqueId: row?.original?._id,
                    workOrderId: row?.original?.workOrderId,
                    canPerform: row?.original?.canPerform
                  });
                  setServiceOpen(true);
                }}
              >
                {row.original.serviceName}
              </h5>
              <Box ml={1}>
                {row?.original?.canPerformInfo ? (
                  <HtmlTooltip title={row?.original?.canPerformInfo} arrow placement="top" enterTouchDelay={0}>
                    <Info className="[font-size:20px_!important] text-red-500" />
                  </HtmlTooltip>
                ) : null}
              </Box>
            </div>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    },
    {
      accessor: 'workOrderNumber',
      Header: 'Work Order Number',
      disableFilters: true,
      disableSortBy: true,
      Cell: ({ row }) => (row.original['workOrderNumber'] ? <Link to = {`${routes?.workOrderDetail?.path}/${row?.original?.workOrderId}`}> <h5 className="link text-truncate">{row.original.workOrderNumber}</h5> </Link> : <NoDataCell />)
    },
      {
        accessor: 'assignedWorkStations',
        Header: 'Work Stations',
        disableFilters: true,
        disableSortBy: true,
        Cell: ({ row }) =>
          row.original['assignedWorkStations'] ? <h5 className="text-truncate">{row.original.assignedWorkStations}</h5> : <NoDataCell />
      },
      ...(user?.user?.brandPolicy?.workOrderTimer
        ? [
          {
            accessor: 'stepData',
            Header: 'Time',
            disableFilters: true,
            disableSortBy: true,
            Cell: ({ row }) => (row.original['stepData'] ? <h5 className="text-truncate">{row.original.stepData}</h5> : <NoDataCell />)
          }
        ]
        : []),
    ]
    const finalColumns = [...extraColumns.slice(0,2),...columns,...extraColumns.slice(2),ActionsRenderer];
  setColumns(finalColumns)
  };

  const ActionsRenderer =  {
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
        {row?.original?.productionOrderId && (
          <HtmlTooltip title="Drawings">
            <IconButton
              size="small"
              aria-label="Details"
              color="primary"
              onClick={(e) => {
                setShowDrawingDialog({ open: true, workOrder: row?.original?._id });
              }}
            >
              <DescriptionIcon fontSize="small" color={'primary'} />
            </IconButton>
          </HtmlTooltip>
        )}
      </>
    )
  }

  useEffect(() => {
    if (tabValue) {
      fetchData();
    }
  }, [page, limit, sorting, tabValue, filterQuery]);

  useEffect(() => {
    dispatch({ type: 'selection', selectedRecords: [] });
  }, [tabValue]);

  const getQueryString = () => {
    let deepFilters = `?page=${page}&limit=${limit}&status=${tabValue}`;

    if (filterQuery?.filterById?.length > 0 || filterQuery?.deepFilter?.length > 0) {
      deepFilters = `${deepFilters}&filterType=and`;
    }
    if (filterQuery?.filterById?.length > 0) {
      deepFilters = `${deepFilters}&filterById=${JSON.stringify(filterQuery?.filterById)}`;
    }
    if (filterQuery?.deepFilter?.length > 0) {
      deepFilters = `${deepFilters}&deepFilter=${JSON.stringify(filterQuery?.deepFilter)}`;
    }
    return deepFilters;
  };

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });

    const queryString = getQueryString();
    axiosInstance()
      .get(`/work-order-technician${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          let finalObject: any = prepareDataForGrid(u, user);
          let workOrderDetailData: any = prepareDataForGrid(u?.workOrderDetail, user);
          finalObject['serviceName'] = u?.service?.serviceName;
          finalObject['serviceStatus'] = u?.status;
          finalObject['workOrderId'] = u?.workOrderDetail?._id;
          delete workOrderDetailData?._id;
          delete workOrderDetailData?.id;
          return {...finalObject,...workOrderDetailData};
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

  const openActions = (event) => {
    setAnchorActionEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorActionEl(null);
  };

  const handleCompleteService = () => {
    setIsServiceCompleting(true);
    const data = selectedRecords?.filter((s) => s?.serviceStatus === WORKORDER_SERVICE_STATUS.pending && s?.canPerform)?.map((_s) => ({
      workOrder: _s?.workOrderDetail?._id,
      service: _s?.materialId,
      uniqueId: _s?._id,
      status: WORKORDER_SERVICE_STATUS.completed
    }))
    axiosInstance().put(`${workOrder.api}/service/work-orders-services-status`, data).then(({ data }) => {
      setIsServiceCompleting(false);
      setShowServiceCompleteConfirmBox(false);
      dispatch({ type: 'selection', selectedRecords: [] });
      fetchData();
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: data?.message
      });
  })
  }
  return (
    <>
      {serviceStatus?.length ? (
        <Box>
          <Tabs
            className="new-tab-container-v1"
            value={tabValue}
            onChange={handleMainTabChange}
            textColor="primary"
            TabIndicatorProps={{
              style: {
                height: 0
              }
            }}
          >
            {serviceStatus?.map((status, i) => {
              return (
                <Tab
                  label={<div className="tab-font">{status}</div>}
                  value={status}
                  aria-controls={`a11y-tabpanel-${i}`}
                  id={`a11y-tab-${i}`}
                  className={'tabLayout'}
                />
              );
            })}
          </Tabs>
          <Box display="flex" alignItems="center" justifyContent={'flex-end'} gridColumnGap={8} flex={1} m={1} my={1}>
            <Button
              variant="outlined"
              color="default"
              size="small"
              onClick={openActions}
              aria-controls="action-menu"
              disabled={tabValue !== WORKORDER_SERVICE_STATUS.pending || selectedRecords?.length === 0}
              endIcon={<ExpandMore />}
              className="new-dropdown-v1"
            >
              Actions
            </Button>
            <Menu
              anchorEl={anchorActionEl}
              keepMounted
              getContentAnchorEl={null}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left'
              }}
              id="action-menu"
              open={Boolean(anchorActionEl)}
              onClose={closeActions}
            >
              <MenuItem
                onClick={() => {
                  setShowServiceCompleteConfirmBox(true);
                  closeActions();
                }}
                disabled={selectedRecords?.length &&
                  selectedRecords?.filter((s) => s?.serviceStatus === WORKORDER_SERVICE_STATUS.pending && s?.canPerform)?.length === selectedRecords?.length ? false : true}
              >
                Complete Service(s)
              </MenuItem>
            </Menu>
          </Box>
          {columns ? (
            <CustomReactTable
              height={'calc(100vh - 300px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              renderedFrom={renderedFrom}
              refreshGrid={fetchData}
            />
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </Box>
      ) : (
        <p>Please Select Status </p>
      )}
      {showServiceCompleteConfirmBox && (
        <ConfirmationDialog
          okBtnLoading={isServiceCompleting}
          open={showServiceCompleteConfirmBox}
          message={`Are you sure you want to Complete this Service(s)`}
          onClose={() => {
            setShowServiceCompleteConfirmBox(false);
          }}
          onOk={handleCompleteService}
        />
      )}
      {showDrawingDialog.open && (
        <DiagramDialog
          referenceId={showDrawingDialog.workOrder}
          currentVersion={null}
          handleClose={() => {
            setShowDrawingDialog({ open: false, workOrder: null });
          }}
        />
      )}

      {serviceOpen && (
        <TechnicianDialog
          handleClose={() => {
            setServiceOpen(false);
            setSelectedService(null);
            if (workOrder) {
              history.push(`${routes.workOrderTechnician.path}`);
            }
          }}
          workOrderId={selectedService?.workOrderId}
          uniqueId={selectedService?.uniqueId}
          canPerform={selectedService?.canPerform}
        />
      )}
    </>
  );
};

export default GridView;
