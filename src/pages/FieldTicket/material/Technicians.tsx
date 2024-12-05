import { IconButton, MenuItem } from '@material-ui/core';
import Box from '@material-ui/core/Box/Box';
import Grid from '@material-ui/core/Grid/Grid';
import DeleteIcon from '@material-ui/icons/Delete';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import AssignEmployeeDialog from 'src/components/AssignRolesDialog/AssignEmployeeDialog';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { displayDateTime, fieldTicket, prepareDataForGrid } from 'src/constants/helpers';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import routes from '../../../components/Helpers/Routes';
import VisibilityIcon from '@material-ui/icons/Visibility';
import StartStopLogsDialog from 'src/pages/FieldTicket/material/StartStopLogsDialog';
import StartStopDate from 'src/pages/FieldTicket/material/StartStopDateDialog';
import { FiExternalLink } from 'react-icons/fi';

const Technicians = ({ allowedToEdit, fieldTicketData, selectedService, stepFullScreen }) => {
  const renderedFrom = `${camelCase(routes?.fieldTicket.title)}_Technicians`;

  const toastConfig = useContext(CustomToastContext);
  const [columns, setColumns] = useState(null);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [technicianDialog, setTechnicianDialog] = useState(false);
  const [startEndDateConfermationDialog, setStartEndDateConfermationDialog] = useState({
    open: false,
    type: null,
    loading: false,
    minDate: null
  });
  const [viewStartStopLog, setViewStartStopLog] = useState({ open: false, rowId: null });

  const {
    state: { user }
  }: any = useData();
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { selectedRecords } = state;

  useEffect(() => {
    fetchColumns();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedService]);

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
            <HtmlTooltip title={'View Logs'}>
              <span>
                <IconButton
                  size="small"
                  onClick={() => {
                    setViewStartStopLog({ open: true, rowId: row?.original?.rowId });
                  }}
                >
                  <VisibilityIcon fontSize="small" color="primary" />
                </IconButton>
              </span>
            </HtmlTooltip>
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
        accessor: 'service',
        Header: 'Service',
        width: 250,
        Cell: ({ row }) =>
          row.original?.service ? (
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
        Cell: ({ row }) => (row.original['competencyType'] ? <p>{row.original?.competencyType}</p> : <NoDataCell />)
      },
      {
        accessor: 'competencies',
        Header: 'Competencies',
        width: 250,
        Cell: ({ row }) => (row.original['competencies'] ? <p>{row.original?.competencies}</p> : <NoDataCell />)
      },
      {
        accessor: 'startDate',
        Header: 'Start Date',
        disableFilters: true,
        disableSortBy: true,
        width: 250,
        Cell: ({ row }) => (row.original?.startDate ? <p>{displayDateTime(row.original?.startDate)}</p> : <NoDataCell />)
      },
      {
        accessor: 'endDate',
        Header: 'End Date',
        disableFilters: true,
        disableSortBy: true,
        width: 250,
        Cell: ({ row }) => (row.original?.endDate ? <p>{displayDateTime(row.original?.endDate)}</p> : <NoDataCell />)
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
                  onClick={() => {
                    setDeleteData([{ rowId: row.original.rowId }]);
                  }}
                >
                  <DeleteIcon fontSize="small" color={'error'} />
                </IconButton>
              </span>
            </HtmlTooltip>
          ) : null;
        }
      }
    ];
    setColumns(column);
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });

    let api = `${fieldTicket.api}/technician?fieldTicketId=${fieldTicketData?._id}`;
    if (selectedService && selectedService?.optionValue !== 'All') {
      api = `${api}&serviceId=${selectedService?.optionValue}&uniqueId=${selectedService?._id}`;
    }
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
          res.competencyType = u?.technician['competencyType']?.optionLabel;
          res.competencies = u?.technician['competencies']?.map((e) => e?.optionLabel)?.toString();
          return res;
        });

        dispatch({ type: 'initialize', data: rows, count: rows?.length });
        dispatch({ type: 'loading', loading: false });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleDelete = async (rows) => {
    setIsDeleting(true);
    axiosInstance()
      .put(`${fieldTicket.api}/technician`, { ids: rows })
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
    const technician: any = [];
    rows.forEach((d) => {
      const element: any = {};
      element.fieldTicket = fieldTicketData?._id;
      element.technician = d?._id;
      element.uniqueId = selectedService?._id;
      element.service = selectedService?.optionValue !== 'All' ? selectedService?.optionValue : null;
      element.status = 'Assigned';
      element.warehouse = fieldTicketData?.warehouse?.optionValue;
      element.startDate = fieldTicketData?.estimateStartDate || new Date();
      element.endDate = fieldTicketData?.estimateEndDate || new Date();
      technician.push(element);
    });
    axiosInstance()
      .post(`${fieldTicket.api}/technician`, { technician })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
        setTechnicianDialog(false);
        fetchData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleUpdateStartEndDate = (values, type) => {
    const value: any = {
      type: type,
      referenceId: fieldTicketData?._id,
      rowId: selectedRecords?.map((r) => r?.rowId)
    };
    setStartEndDateConfermationDialog({ ...startEndDateConfermationDialog, loading: true });
    if (type != 'stop') {
      value.startDate = values?.startDate;
    }
    if (type === 'stop' || type === 'startStop') {
      value.endDate = values?.endDate;
    }
    axiosInstance()
      .put(`${fieldTicket.api}/technician/start-end-date`, value)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
        setStartEndDateConfermationDialog({ open: false, type: null, loading: false, minDate: null });
        fetchData();
      })
      .catch((error) => {
        setStartEndDateConfermationDialog({ open: false, type: null, loading: false, minDate: null });
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
              date.setDate(date.getDate() + 1);
            }
            setStartEndDateConfermationDialog({ open: true, type: 'start', loading: false, minDate: date });
          }}
        >
          Start
        </MenuItem>
        <MenuItem
          disabled={selectedRecords?.every((r) => r?.startDate && !r?.endDate) ? false : true}
          onClick={() => {
            const dates = [];
            selectedRecords?.forEach((d: any) => {
              dates.push(new Date(d?.startDate));
            });
            let date = null;
            if (dates?.length) {
              date = new Date(Math.max(...dates));
            }
            setStartEndDateConfermationDialog({ open: true, type: 'stop', loading: false, minDate: date });
          }}
        >
          Stop
        </MenuItem>
        <MenuItem
          disabled={selectedRecords?.every((r) => (r?.startDate && r?.endDate) || (!r?.startDate && !r?.endDate)) ? false : true}
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
              date.setDate(date.getDate() + 1);
            }
            setStartEndDateConfermationDialog({ open: true, type: 'startStop', loading: false, minDate: date });
          }}
        >
          Start/Stop
        </MenuItem>
        <HtmlTooltip title={Boolean(selectedRecords.length) ? 'Delete selected records' : 'Select records to delete'}>
          <MenuItem
            disabled={isDeleting}
            onClick={() => {
              setDeleteData(
                selectedRecords?.map((d) => {
                  return {
                    rowId: d?.rowId
                  };
                })
              );
            }}
          >
            Delete
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
              isAddButtonVisible={true}
              addButtonProps={{ onClick: () => setTechnicianDialog(true), id: 'add-technician' }}
              isActionButtonVisible={true}
              actionButtonMenuItems={actionButtonMenuItems()}
              actionButtonProps={{ disabled: !Boolean(selectedRecords?.length) }}
              hasXpadding
            />
          </>
        )}
        <Grid container spacing={2}>
          <Grid item xs={12} md={12} sm={12}>
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

      {technicianDialog && (
        <AssignEmployeeDialog
          reference={'fieldTicket'}
          onSuccess={(data) => {
            handleAssign(data);
          }}
          handleClose={() => {
            setTechnicianDialog(false);
          }}
          warehouse={fieldTicketData?.warehouse?.optionValue}
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

      {startEndDateConfermationDialog.open && (
        <StartStopDate
          type={startEndDateConfermationDialog.type}
          onClose={() => {
            setStartEndDateConfermationDialog({ open: false, type: null, loading: false, minDate: null });
          }}
          handleSubmit={(value) => {
            handleUpdateStartEndDate(value, startEndDateConfermationDialog.type);
          }}
          loading={startEndDateConfermationDialog.loading}
          minStartDate={startEndDateConfermationDialog.minDate}
        />
      )}

      {viewStartStopLog?.open && (
        <StartStopLogsDialog
          onClose={() => {
            setViewStartStopLog({ open: false, rowId: null });
          }}
          referenceId={fieldTicketData?._id}
          rowId={viewStartStopLog?.rowId}
          fetchRecords={fetchData}
        />
      )}
    </>
  );
};

export default Technicians;
