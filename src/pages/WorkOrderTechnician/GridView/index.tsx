import { Box, IconButton, MenuItem } from '@material-ui/core';
import { Info } from '@material-ui/icons';
import DescriptionIcon from '@material-ui/icons/Description';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CustomTabs, { CustomTab } from 'src/components/CustomTabs';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import ImportExportMenu from 'src/components/Helpers/ImportExportMenu';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { WORKORDER_SERVICE_STATUS, gridLoadingTimeout, prepareDataForGrid, sidebarResource, workOrder } from 'src/constants/helpers';
import DiagramDialog from 'src/pages/WorkOrder/Diagram/DiagramDialog';
import TechnicianDialog from '../TechnicianDialog';
import axios, { CancelTokenSource } from 'axios';
import DropdownCell from 'src/components/CustomReactTable/Cells/DropdownCell';

const renderedFrom = camelCase(routes?.workOrderTechnician.title);

const GridView = ({ serviceStatus, filterQuery, permissions }) => {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();

  const [showDrawingDialog, setShowDrawingDialog] = useState({ open: false, workOrder: null });
  const { generateColumns } = useColumns();
  const {
    state: { user }
  }: any = useData();

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, sorting, selectedRecords, filters } = state;

  const [tabValue, setTabValue] = useState('');
  const [showServiceCompleteConfirmBox, setShowServiceCompleteConfirmBox] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [columns, setColumns] = useState(null);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    setTabValue(serviceStatus[0]);
  }, [serviceStatus]);

  useEffect(() => {
    const cancelToken = axios.CancelToken.source();
    fetchGridColumns(cancelToken);
    return () => cancelToken.cancel();
  }, []);

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: string) => {
    setTabValue(newValue);
  };

  const fetchGridColumns = async (cancelToken?: CancelTokenSource) => {
    let data;
    const response = await axiosInstance().get(`/field?resource=${sidebarResource['workOrder']}&view=true`, { cancelToken: cancelToken?.token });
    data = response?.data?.data;

    const newColumns = generateColumns(renderedFrom, data, routes.workOrderDetail.path);
    const columns = newColumns.filter((ele) => ele.accessor != 'workOrderNumber');

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
                      <Info className="text-red-500 [font-size:20px_!important]" />
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
        Cell: ({ row }) => (row.original['workOrderNumber'] ? <h5 className=" text-truncate">{row.original.workOrderNumber}</h5> : <NoDataCell />)
      },
      {
        accessor: 'assignedWorkStations',
        Header: 'Work Stations',
        disableFilters: true,
        disableSortBy: true,
        Cell: ({ row }) =>
          row.original['assignedWorkStations'] ? <DropdownCell
            permissions={permissions}
            permissionForLinks={{}}
            field={{
              fieldName: 'assignedWorkStations',
              lookupResource: sidebarResource.workStations
            }}
            original={row?.original}
          />
            : <NoDataCell />
      }
    ];
    const finalColumns = [...extraColumns.slice(0, 2), ...columns, ...extraColumns.slice(2), ActionsRenderer];
    setColumns(finalColumns);
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
        {row?.original?.productionOrderId && (
          <HtmlTooltip title="Drawings">
            <IconButton
              size="small"
              aria-label="Details"
              color="primary"
              onClick={(e) => {
                setShowDrawingDialog({ open: true, workOrder: row?.original?.workOrderId });
              }}
            >
              <DescriptionIcon fontSize="small" color={'primary'} />
            </IconButton>
          </HtmlTooltip>
        )}
      </>
    )
  };

  useEffect(() => {
    const cancelToken = axios.CancelToken.source();
    if (tabValue) {
      fetchData(cancelToken);
    }
    return () => cancelToken.cancel();
  }, [page, limit, sorting, tabValue, filterQuery, filters]);

  useEffect(() => {
    dispatch({ type: 'selection', selectedRecords: [] });
  }, [tabValue]);

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}&status=${tabValue}`;
    const { filterByIds, deepFilters } = gridFilterParser(filters);
    if (filterQuery?.filterById?.length) {
      filterQuery?.filterById?.forEach((e) => {
        filterByIds.push(e);
      });
    }
    if (filterQuery?.deepFilter?.length) {
      filterQuery?.deepFilter?.forEach((e) => {
        deepFilters.push(e);
      });
    }
    if (filterByIds?.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
    }
    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}`;
    }
    if (filterByIds?.length || deepFilters?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
    }
    return deepFilter;
  };

  const fetchData = (cancelToken?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`/work-order-technician${queryString}`, { cancelToken: cancelToken?.token })
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          let finalObject: any = prepareDataForGrid(u, user);
          let workOrderDetailData: any = prepareDataForGrid(u?.workOrderDetail, user);
          finalObject['serviceName'] = u?.service?.serviceName;
          finalObject['serviceId'] = u?.service?._id;
          finalObject['serviceStatus'] = u?.status;
          finalObject['workOrderId'] = u?.workOrderDetail?._id;
          const matchedTempMaterial = workOrderDetailData?.tempMaterial?.find((t) => t?.materialId === u?.service?._id);
          finalObject['uniqueId'] = matchedTempMaterial?._id;
          delete workOrderDetailData?._id
          delete workOrderDetailData?.id;
          return { ...finalObject, ...workOrderDetailData };
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

  const handleCompleteService = () => {
    setIsSubmitting(true);
    const data = selectedRecords
      ?.filter((s) => s?.serviceStatus === WORKORDER_SERVICE_STATUS.pending && s?.canPerform)
      ?.map((_s) => ({
        workOrder: _s?.workOrderId,
        service: _s?.materialId,
        uniqueId: _s?._id,
        status: WORKORDER_SERVICE_STATUS.completed
      }));
    axiosInstance()
      .put(`${workOrder.api}/service/work-orders-services-status`, data)
      .then(({ data }) => {
        setIsSubmitting(false);
        setShowServiceCompleteConfirmBox(false);
        dispatch({ type: 'selection', selectedRecords: [] });
        fetchData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
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
          onClick={() => {
            setShowServiceCompleteConfirmBox(true);
          }}
          disabled={
            selectedRecords?.length &&
              selectedRecords?.filter((s) => s?.serviceStatus === WORKORDER_SERVICE_STATUS.pending && s?.canPerform)?.length === selectedRecords?.length
              ? false
              : true
          }
        >
          Complete Service(s)
        </MenuItem>
      </>
    );
  };

  return (
    <>
      {serviceStatus?.length ? (
        <Box>
          <CustomTabs value={tabValue} onChange={handleMainTabChange}>
            {serviceStatus?.map((status, i) => {
              return <CustomTab key={status} label={status} value={status} />;
            })}
          </CustomTabs>
          <DetailsPageHeader
            isAddButtonVisible={false}
            isActionButtonVisible={true}
            actionButtonMenuItems={actionButtonMenuItems()}
            actionButtonProps={{ disabled: tabValue !== WORKORDER_SERVICE_STATUS.pending || selectedRecords?.length === 0 }}
            rightSideContents={
              user?.user?.brandPolicy?.workOrderStepDataImport && (
                <ImportExportMenu
                  permissions={permissions}
                  module={sidebarResource.workOrderTechnician}
                  api={`work-order-technician`}
                  afterImportCompleted={() => {
                    fetchData();
                  }}
                  disabled={selectedRecords.length !== 1}
                  additionalParams={`${selectedRecords[0]?.repairOrderId
                    ? `repairOrder=${selectedRecords[0]?.repairOrderId}`
                    : `productionOrder=${selectedRecords[0]?.productionOrderId}`
                    }&serviceId=${selectedRecords[0]?.serviceId}&uniqueId=${selectedRecords[0]?.uniqueId}`}
                />
              )
            }
            hasXpadding
          />
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
          okBtnLoading={isSubmitting}
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
