import Box from '@mui/material/Box/Box';
import { useState, useEffect, useContext } from 'react';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import routes from '../../../components/Helpers/Routes';
import Grid from '@mui/material/Grid2';
import axiosInstance from 'src/axios/axiosInstance';
import { displayDate, MATERIAL_TYPE, rentalManagement, sidebarResource } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { IconButton, MenuItem } from '@mui/material';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import { camelCase, isEmpty } from 'lodash';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { FiExternalLink } from 'react-icons/fi';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ServiceLogDialog from 'src/pages/RentalManagement/ReceivingTicket/ServiceLogDialog';
import StartStopServiceDateDialog from 'src/pages/RentalManagement/ReceivingTicket/StartStopServiceDateDialog';
import CustomMessageDialog from 'src/components/MessageDialog';
import { isMobile, isTablet } from 'react-device-detect';
import { useData } from '../../../StateProvider/Provider';
import { rentalManagementActions, rentalManagementMessage } from 'src/constants/messageHelpers';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { Delete } from '@mui/icons-material';

const ReceivingServices = ({ allowedToEdit, services, rentalManagementData, fetchRecords, stepFullScreen }) => {
  const renderedFrom = `${camelCase(sidebarResource.rentalManagement)}_services`;
  const toastConfig = useContext(CustomToastContext);
  const [openMessageDialog, setOpenMessageDialog] = useState({ open: false, errorMessages: [] });
  const [deleteServiceLogConfirmDialog, setDeleteServiceLogConfirmDialog] = useState({ open: false, data: null });
  const {
    state: { user }
  }: any = useData();
  const [okBtnLoading, setOkBtnLoading] = useState(false);
  const [columns, setColumns] = useState(null);
  const [serviceConfirmationDialog, setServiceConfirmationDialog] = useState({ open: false, type: null, loading: false, minStartDate: null });
  const [serviceLogDialog, setServiceLogDialog] = useState({ open: false, data: null });
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { selectedRecords } = state;

  useEffect(() => {
    fetchColumns();
  }, [rentalManagementData]);

  useEffect(() => {
    fetchData();
  }, [services]);

  const fetchColumns = () => {
    const column: any = [
      {
        accessor: 'index',
        Header: 'Index',
        minWidth: 100,
        width: 100,
        disabled: true,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row }) => (
          <div className="d-flex align-items-center gap-2">
            <h5 className="text-truncate">{row?.original?.index}</h5>
            {row?.original?.type === MATERIAL_TYPE.service && row?.original?.serviceLog?.length ? (
              <HtmlTooltip title={'View Logs'}>
                <span>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setServiceLogDialog({ open: true, data: row?.original });
                    }}
                  >
                    <VisibilityIcon fontSize="small" color="primary" />
                  </IconButton>
                </span>
              </HtmlTooltip>
            ) : null}
          </div>
        )
      },
      {
        accessor: 'serviceName',
        Header: 'Details',
        disabled: true,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <p className="text-truncate">{row?.original?.serviceName}</p>
            <IconButton
              size="small"
              onClick={() => {
                window.open(`${routes.serviceMasterDetail.path}/${row?.original?.materialId}`);
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
          </div>
        )
      },
      {
        accessor: 'parentName',
        Header: 'Parent',
        disabled: true,
        Cell: ({ row }) => (row?.original?.parentName ? <h5 className="text-truncate">{row?.original?.parentName}</h5> : <NoDataCell />)
      },
      {
        accessor: 'qty',
        Header: 'Qty',
        disabled: true,
        Cell: ({ row }) => <h5 className="text-truncate">{row?.original?.qty || <NoDataCell />}</h5>
      },
      {
        accessor: 'description',
        Header: 'Description',
        Cell: ({ row }) => (row?.original?.description ? <h5 className="text-truncate">{row?.original?.description}</h5> : <NoDataCell />)
      },
      {
        accessor: 'manualStartDate',
        Header: 'Actual Start Date',
        Cell: ({ row }) =>
          row?.original?.manualStartDate ? (
            <h5 className="text-truncate" title={`${displayDate(row?.original?.manualStartDate)}`}>
              {displayDate(row?.original?.manualStartDate)}
            </h5>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'manualEndDate',
        Header: 'Actual End Date',
        Cell: ({ row }) =>
          row?.original?.manualEndDate ? (
            <h5 className="text-truncate" title={`${displayDate(row?.original?.manualEndDate)}`}>
              {displayDate(row?.original?.manualEndDate)}
            </h5>
          ) : (
            <NoDataCell />
          )
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
          const serviceLogCount = row?.original?.serviceLog?.length;
          const recentServiceLogStartDate = serviceLogCount ? row?.original?.serviceLog[serviceLogCount - 1]?.startDate : null;
          const recentServiceLogEndDate = serviceLogCount ? row?.original?.serviceLog[serviceLogCount - 1]?.endDate : null;
          const maxInvoiceDate = row?.original?.maxInvoiceDate;
          const cannotDelete =
            !serviceLogCount ||
            (recentServiceLogEndDate && recentServiceLogEndDate >= maxInvoiceDate && recentServiceLogStartDate <= maxInvoiceDate) ||
            (recentServiceLogEndDate && recentServiceLogEndDate <= maxInvoiceDate) ||
            (!recentServiceLogEndDate && maxInvoiceDate >= recentServiceLogStartDate);
          return (
            <>
              <HtmlTooltip
                title={
                  !serviceLogCount
                    ? rentalManagementMessage.serviceNotstarted
                    : cannotDelete
                      ? rentalManagementMessage.invoiceCreated
                      : 'Delete recent log'
                }
              >
                <span>
                  <IconButton
                    size="small"
                    disabled={cannotDelete}
                    onClick={() => {
                      setDeleteServiceLogConfirmDialog({
                        open: true,
                        data: [{ _id: row.original._id, serviceLogId: row?.original?.serviceLog[serviceLogCount - 1]._id }]
                      });
                    }}
                  >
                    <Delete fontSize="small" color={cannotDelete ? 'disabled' : 'error'} />
                  </IconButton>
                </span>
              </HtmlTooltip>
            </>
          );
        }
      }
    ];
    setColumns(column);
  };

  const fetchData = async () => {
    try {
      dispatch({ type: 'selection', selectedRecords: [] });
      dispatch({ type: 'loading', loading: true });
      dispatch({ type: 'initialize', data: services, count: services?.length });
      dispatch({ type: 'loading', loading: false });
    } catch (error) {
      dispatch({ type: 'loading', loading: false });
      toastConfig.setToastConfig(error);
    }
  };

  const handleSubmitChangeDates = (values, type: string = '') => {
    dispatch({ type: 'loading', loading: true });
    let data;
    setServiceConfirmationDialog({ ...serviceConfirmationDialog, loading: true });
    data = { ids: selectedRecords?.map((s) => s?.uniqueId) };
    data['type'] = type;
    data['startDate'] = displayDate(values.startDate, 'MM/DD/YYYY');
    data['endDate'] = displayDate(values.endDate, 'MM/DD/YYYY');
    axiosInstance()
      .put(`${rentalManagement.api}/${rentalManagementData?._id}/start-end-date`, data)
      .then((response) => {
        toastConfig.setToastConfig({
          open: true,
          message: response?.data?.message,
          type: 'success'
        });
        setServiceConfirmationDialog({ open: false, type: null, loading: false, minStartDate: null });
        fetchRecords();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        dispatch({ type: 'loading', loading: false });
        setServiceConfirmationDialog({ open: false, type: null, loading: false, minStartDate: null });
      });
  };

  const handleDeleteServiceLogs = (data: any[]) => {
    setOkBtnLoading(true);
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .delete(`${rentalManagement.api}/productpackage/${rentalManagementData?._id}/service-log`, { data })
      .then((response) => {
        toastConfig.setToastConfig({
          open: true,
          message: response?.data?.message,
          type: 'success'
        });
        setOkBtnLoading(false);
        setDeleteServiceLogConfirmDialog({ open: false, data: null });
        fetchRecords();
      })
      .catch((err) => {
        setOkBtnLoading(false);
        setDeleteServiceLogConfirmDialog({ open: false, data: null });
        toastConfig.setToastConfig(err);
        dispatch({ type: 'loading', loading: false });
      });
  };

  return (
    <Box>
      <DetailsPageHeader
        isAddButtonVisible={false}
        isActionButtonVisible={allowedToEdit && user?.role?.selectedEntity?.policy?.isAllowServicePerformRentalManagement}
        actionButtonMenuItems={
          <ActionButtonMenuItems
            {...{
              selectedRecords,
              setOpenMessageDialog,
              setServiceConfirmationDialog,
              setDeleteServiceLogConfirmDialog
            }}
          />
        }
        actionButtonProps={{ disabled: selectedRecords.length === 0 }}
        hasXpadding
      />
      <Grid container>
        <Grid size={{xs:12, md:12, sm:12}}>
          {columns ? (
            <CustomReactTable
              height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              renderedFrom={renderedFrom}
              isClientSideGrid={true}
              hideSelection={!allowedToEdit || !user?.role?.selectedEntity?.policy?.isAllowServicePerformRentalManagement}
              refreshGrid={fetchRecords}
            />
          ) : (
            <Box p={2} height={300}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </Grid>
      </Grid>
      {openMessageDialog.open && (
        <CustomMessageDialog
          open={openMessageDialog.open}
          errorMessages={openMessageDialog.errorMessages}
          onClose={() => {
            setOpenMessageDialog({ open: false, errorMessages: [] });
          }}
        />
      )}
      {serviceLogDialog.open && (
        <ServiceLogDialog
          rentalId={rentalManagementData?._id}
          id={serviceLogDialog?.data?.uniqueId}
          serviceName={serviceLogDialog?.data?.serviceName}
          onClose={() => {
            setServiceLogDialog({ open: false, data: null });
          }}
          onSuccess={() => {
            fetchRecords();
          }}
          allowedToEdit={allowedToEdit}
          fetchRecords={fetchRecords}
          maxInvoiceDate={serviceLogDialog?.data?.maxInvoiceDate}
        />
      )}
      {serviceConfirmationDialog.open && (
        <StartStopServiceDateDialog
          data={null}
          type={serviceConfirmationDialog.type}
          open={serviceConfirmationDialog.open}
          onClose={() => {
            setServiceConfirmationDialog({ open: false, type: null, loading: false, minStartDate: null });
          }}
          handleSubmit={(val) => {
            handleSubmitChangeDates(val, serviceConfirmationDialog.type);
          }}
          loading={serviceConfirmationDialog.loading}
          minStartDate={serviceConfirmationDialog.minStartDate}
        />
      )}
      {deleteServiceLogConfirmDialog.open && (
        <ConfirmationDialog
          open={deleteServiceLogConfirmDialog.open}
          message={`Are you sure you want to delete recent log for selected service(s)?`}
          onClose={() => {
            setDeleteServiceLogConfirmDialog({ open: false, data: null });
          }}
          onOk={() => {
            handleDeleteServiceLogs(deleteServiceLogConfirmDialog.data);
          }}
          okBtnLoading={okBtnLoading}
        />
      )}
    </Box>
  );
};

export default ReceivingServices;

const ActionButtonMenuItems = ({ selectedRecords, setOpenMessageDialog, setServiceConfirmationDialog, setDeleteServiceLogConfirmDialog }) => {
  const validateAction = (action) => {
    const errorMessages = [];
    selectedRecords.forEach((e) => {
      if (action === rentalManagementActions.startService) {
        const serviceLogEntry = e?.serviceLog?.find((log: any) => !log.endDate);
        if (!isEmpty(serviceLogEntry)) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.serviceAlreadyStarted });
        }
      } else if (action === rentalManagementActions.stopService) {
        const serviceLogEntry = e?.serviceLog?.find((log: any) => !log.endDate);
        if (!serviceLogEntry) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.serviceNotstarted });
        }
      } else if (action === rentalManagementActions.deleteServiceLog) {
        const serviceLogCount = e?.serviceLog?.length;
        const recentServiceLogStartDate = serviceLogCount ? e?.serviceLog[serviceLogCount - 1]?.startDate : null;
        const recentServiceLogEndDate = serviceLogCount ? e?.serviceLog[serviceLogCount - 1]?.endDate : null;
        const maxInvoiceDate = e?.maxInvoiceDate;
        const cannotDelete =
          !serviceLogCount ||
          (recentServiceLogEndDate && recentServiceLogEndDate >= maxInvoiceDate && recentServiceLogStartDate <= maxInvoiceDate) ||
          (recentServiceLogEndDate && recentServiceLogEndDate <= maxInvoiceDate) ||
          (!recentServiceLogEndDate && maxInvoiceDate >= recentServiceLogStartDate);
        if (!serviceLogCount) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.serviceNotstarted });
        } else if (cannotDelete) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.invoiceCreated });
        }
      }
    });
    if (errorMessages?.length) {
      setOpenMessageDialog({ open: true, errorMessages: errorMessages });
      return true;
    }
    return false;
  };

  return (
    <>
      <MenuItem
        onClick={() => {
          if (!validateAction(rentalManagementActions.startService)) {
            const dates = [];
            selectedRecords?.forEach((d: any) => {
              d?.serviceLog?.forEach((l: any) => {
                if (l?.endDate) dates.push(new Date(l.endDate));
              });
            });
            let date = null;
            if (dates?.length) {
              date = new Date(Math.max(...dates));
              date.setDate(date.getDate() + 1);
            }
            setServiceConfirmationDialog({ open: true, type: 'start', minStartDate: date });
          }
        }}
      >
        Start Service(s)
      </MenuItem>
      <MenuItem
        onClick={() => {
          if (!validateAction(rentalManagementActions.stopService)) {
            const dates = [];
            selectedRecords?.forEach((d: any) => {
              const serviceLogEntry = d?.serviceLog?.find((log: any) => !log.endDate);
              dates.push(new Date(serviceLogEntry?.startDate));
            });
            let date = null;
            if (dates?.length) {
              date = new Date(Math.max(...dates));
            }
            date = selectedRecords?.reduce((maxDate, record) => {
              if (record?.maxInvoiceDate) {
                const recordDate = new Date(record.maxInvoiceDate);
                return recordDate > maxDate ? recordDate : maxDate;
              }
              return maxDate;
            }, date);
            setServiceConfirmationDialog({ open: true, type: 'stop', minStartDate: date });
          }
        }}
      >
        Stop Service(s)
      </MenuItem>
      <MenuItem
        onClick={() => {
          if (!validateAction(rentalManagementActions.startService)) {
            const dates = [];
            selectedRecords?.forEach((d: any) => {
              d?.serviceLog?.forEach((l: any) => {
                dates.push(new Date(l.endDate));
              });
            });
            let date = null;
            if (dates?.length) {
              date = new Date(Math.max(...dates));
              date.setDate(date.getDate() + 1);
            }
            setServiceConfirmationDialog({ open: true, type: 'startStop', minStartDate: date });
          }
        }}
      >
        Start/Stop Service(s)
      </MenuItem>
      <MenuItem
        onClick={() => {
          if (!validateAction(rentalManagementActions.deleteServiceLog)) {
            const data = [];
            selectedRecords?.forEach((d: any) => {
              data.push({
                _id: d?.uniqueId,
                serviceLogId: d?.serviceLog[d?.serviceLog?.length - 1]?._id
              });
            });
            setDeleteServiceLogConfirmDialog({ open: true, data });
          }
        }}
      >
        Delete Service Log(s)
      </MenuItem>
    </>
  );
};
