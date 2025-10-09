import { Visibility, ExpandMore } from '@mui/icons-material';
import { IconButton, Menu, MenuItem } from '@mui/material';
import Box from '@mui/material/Box/Box';
import Grid from '@mui/material/Grid2';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { FiExternalLink } from 'react-icons/fi';
import { RiUserReceived2Fill, RiUserShared2Fill } from 'react-icons/ri';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { AccessorFunction, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import DropdownCell from 'src/components/CustomReactTable/Cells/DropdownCell';
import { BulkActionContainer } from 'src/components/CustomReactTable/GridHeader';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { fetch_rental_technician_fields } from 'src/components/RentalManagment/helper';
import { displayDate, prepareDataForGrid, sidebarResource, TECHNICIAN_STATUS } from 'src/constants/helpers';
import StartStopDateDialog from 'src/pages/FieldTicket/material/StartStopDateDialog';
import StartStopLogsDialog from 'src/pages/FieldTicket/material/StartStopLogsDialog';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import routes from '../../../components/Helpers/Routes';
import { CustomOfflineContext } from '../../../StateProvider/OfflineContext/OfflineContext';
import SubStatusDatesDialog from 'src/pages/RentalManagement/LoadingTicket/SubStatusDatesDialog';
import { fetch_resource_view_fields } from 'src/components/ResourceFields';

const TechnicianDispatchReturn = ({ rentalManagementData, stepFullScreen, allowedToEdit, receive = false }) => {
  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = `${camelCase(sidebarResource?.rentalManagement)}_technician`;

  const {
    state: { resources, user }
  }: any = useData();

  const [columns, setColumns] = useState(null);
  const [isUpdating, setUpdating] = useState(false);
  const [startEndDateConfirmationDialog, setStartEndDateConfirmationDialog] = useState({
    open: false,
    type: null,
    minDateTime: null,
    notes: '',
    _id: null
  });
  const [viewStartStopLog, setViewStartStopLog] = useState({ open: false, technicianId: null });
  const [subStatusToUpdate, setSubStatusToUpdate] = useState({ open: false, status: null });
  const [subStatusAnchorEl, setSubStatusAnchorEl] = useState(null);
  const [subStatusOptions, setSubStatusOptions] = useState([]);

  const { isOffline } = useContext(CustomOfflineContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;

  const { generateColumns } = useColumns();

  const {
    state: { permissions }
  }: any = useData();

  useEffect(() => {
    fetchColumns();
    fetchData();
  }, []);

  const fetchColumns = async () => {
    let data = isOffline ? [] : await fetch_rental_technician_fields(rentalManagementData?.currency, false);
    let technicianFields = [];
    if (!isOffline) {
      const { fieldsDataAll } = await fetch_resource_view_fields(sidebarResource.employeeMaster, true);
      technicianFields = fieldsDataAll?.map((e) => e?.fieldData);
      setSubStatusOptions(technicianFields?.find((e) => e?.fieldName === 'subStatus')?.option);
    }
    const column: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>
      },
      {
        accessor: 'technicianName',
        Header: 'Name',
        width: 250,
        Cell: ({ row, table }) => (
          <div className="flex items-center gap-2">
            <p className="text-truncate" title={row.original.detail}>
              {row.original?.technicianName}
            </p>
            {!isOffline && (
              <Box>
                <IconButton
                  size="small"
                  onClick={() => {
                    window.open(`${routes.employeeMasterDetail.path}/${row.original?.technicianId}`);
                  }}
                >
                  <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                </IconButton>
              </Box>
            )}
          </div>
        )
      },
      {
        accessor: 'service',
        Header: 'Service',
        width: 250,
        Cell: ({ row }) =>
          row.original?.service ? (
            <a className="link text-truncate" href={`${routes.serviceMasterDetail.path}/${row.original?.serviceId}`} target="_blank">
              {row.original?.service}
            </a>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'status',
        Header: 'Rental Status',
        width: 200,
        Cell: ({ row }) => (row.original['status'] ? <p>{row.original?.status}</p> : <NoDataCell />)
      },
      ...(technicianFields?.find((e) => e?.fieldName === 'competencyType')
        ? [
            {
              accessor: 'competencyType',
              Header: technicianFields?.find((e) => e.fieldName === 'competencyType')?.fieldLabel,
              width: 250,
              Cell: ({ row }) => (
                <DropdownCell
                  permissions={permissions}
                  permissionForLinks={{}}
                  field={{
                    fieldName: 'competencyType',
                    lookupResource: sidebarResource.competencyType
                  }}
                  original={row?.original}
                />
              ),
              accessorFn: (original) => AccessorFunction(original, 'competencyType')
            }
          ]
        : []),
      ...(technicianFields?.find((e) => e.fieldName === 'competencies')
        ? [
            {
              accessor: 'competencies',
              Header: technicianFields?.find((e) => e.fieldName === 'competencies')?.fieldLabel,
              width: 250,
              Cell: ({ row }) => (
                <DropdownCell
                  permissions={permissions}
                  permissionForLinks={{}}
                  field={{
                    fieldName: 'competencies',
                    lookupResource: sidebarResource.competencies
                  }}
                  original={row?.original}
                />
              ),
              accessorFn: (original) => AccessorFunction(original, 'competencies')
            }
          ]
        : []),
      {
        accessor: 'startDate',
        Header: 'Dispatched Date',
        width: 250,
        Cell: ({ row }) => (row.original?.startDate ? <p>{displayDate(row.original?.startDate)}</p> : <NoDataCell />)
      },
      {
        accessor: 'endDate',
        Header: 'Returned Date',
        width: 250,
        Cell: ({ row }) => (row.original?.endDate ? <p>{displayDate(row.original?.endDate)}</p> : <NoDataCell />)
      },
      {
        accessor: 'notes',
        Header: 'Notes',
        Cell: ({ row }) => {
          return (
            <>
              {row?.original?.notes ? (
                <div>
                  <p className="text-truncate">{row.original?.notes}</p>
                </div>
              ) : (
                <NoDataCell />
              )}
            </>
          );
        }
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
          return (
            <>
              {allowedToEdit && (
                <>
                  {(row?.original?.endDate || (!row?.original?.startDate && !row?.original?.endDate)) && !receive && (
                    <HtmlTooltip title={'Dispatch'}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          let date = null;
                          if (row?.original?.endDate) {
                            date = new Date(row?.original?.endDate);
                            date.setMinutes(date.getMinutes() + 1);
                          }
                          setStartEndDateConfirmationDialog({
                            open: true,
                            type: 'start',
                            minDateTime: date,
                            notes: '',
                            _id: row?.original?._id
                          });
                        }}
                        color={'primary'}
                      >
                        <RiUserShared2Fill fontSize={18} />
                      </IconButton>
                    </HtmlTooltip>
                  )}
                  {row?.original?.startDate && !row?.original?.endDate && receive && (
                    <HtmlTooltip title={'Return'}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setStartEndDateConfirmationDialog({
                            open: true,
                            type: 'stop',
                            minDateTime: new Date(row?.original?.maxStartDate),
                            notes: row?.original?.notes,
                            _id: row?.original?._id
                          });
                        }}
                        color={'primary'}
                      >
                        <RiUserReceived2Fill fontSize={18} />
                      </IconButton>
                    </HtmlTooltip>
                  )}
                </>
              )}
              <HtmlTooltip title={'View Logs'}>
                <IconButton
                  size="small"
                  onClick={() => {
                    setViewStartStopLog({ open: true, technicianId: row?.original?.technicianId });
                  }}
                >
                  <Visibility fontSize="small" color="primary" />
                </IconButton>
              </HtmlTooltip>
            </>
          );
        }
      }
    ];
    const newColumns = generateColumns(
      renderedFrom,
      data?.filter((f) => f?.isRead && !['endDate', 'startDate'].includes(f?.fieldName)),
      null,
      false,
      rentalManagementData?.currency
    );
    setColumns([...column, ...newColumns]);
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    let api = `/technician?referenceId=${rentalManagementData?._id}&referenceType=${sidebarResource.rentalManagement}`;
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

  const handleUpdateStartEndDate = (values, type, _id = null) => {
    let value: any = {
      type: type,
      referenceId: rentalManagementData?._id,
      referenceType: sidebarResource.rentalManagement,
      _id: _id ? [_id] : selectedRecords?.map((r) => r?._id)
    };
    if (values?.notes) value.notes = values?.notes;
    if (type !== 'stop') {
      value.startDate = values?.startDate;
    } else {
      value.endDate = values?.endDate;
    }
    setUpdating(true);
    axiosInstance()
      .put(`/technician/start-end-date`, value)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
        setStartEndDateConfirmationDialog({ open: false, type: null, minDateTime: null, notes: '', _id: null });
        setUpdating(false);
        fetchData();
      })
      .catch((error) => {
        setUpdating(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleSubStatusChange = (dates) => {
    setUpdating(true);
    axiosInstance()
      .put(`/technician/update-sub-status`, {
        _ids: selectedRecords?.map((r) => r?._id),
        dates: dates
      })
      .then(({ data }) => {
        setSubStatusToUpdate({ open: false, status: null });
        fetchData();
        setUpdating(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((error) => {
        setUpdating(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleClickChangeSubStatus = (event) => {
    setSubStatusAnchorEl(event.currentTarget);
  };

  const handleCloseChangeSubStatusMenu = () => {
    setSubStatusAnchorEl(null);
  };

  return (
    <>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 12, sm: 12 }}>
          {columns && dataRows ? (
            <CustomReactTable
              height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              refreshGrid={fetchData}
              renderedFrom={renderedFrom}
              isClientSideGrid={true}
              hideSelection={!allowedToEdit}
              bulkActionItems={
                allowedToEdit ? (
                  <BulkActionItems
                    receive={receive}
                    selectedRecords={selectedRecords}
                    setStartEndDateConfirmationDialog={setStartEndDateConfirmationDialog}
                    handleClickChangeSubStatus={handleClickChangeSubStatus}
                  />
                ) : null
              }
            />
          ) : (
            <Box p={2} height={300}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </Grid>
      </Grid>
      <Menu
        id="sub-status-menu"
        anchorEl={subStatusAnchorEl}
        keepMounted
        open={Boolean(subStatusAnchorEl)}
        onClose={handleCloseChangeSubStatusMenu}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
      >
        {subStatusOptions?.map((o, i) => {
          return (
            <MenuItem
              key={`${i}`}
              onClick={() => {
                setSubStatusToUpdate({ open: true, status: o?.optionValue });
                handleCloseChangeSubStatusMenu();
              }}
            >
              {o?.optionLabel}
            </MenuItem>
          );
        })}
      </Menu>
      {startEndDateConfirmationDialog.open && (
        <StartStopDateDialog
          type={startEndDateConfirmationDialog.type}
          resource={sidebarResource.fieldServiceOrder}
          onClose={() => {
            setStartEndDateConfirmationDialog({ open: false, type: null, minDateTime: null, notes: '', _id: null });
          }}
          handleSubmit={(value) => {
            handleUpdateStartEndDate(value, startEndDateConfirmationDialog.type, startEndDateConfirmationDialog._id);
          }}
          loading={isUpdating}
          minStartDateTime={startEndDateConfirmationDialog.minDateTime}
          notes={startEndDateConfirmationDialog.notes}
        />
      )}
      {viewStartStopLog?.open && (
        <StartStopLogsDialog
          onClose={() => {
            setViewStartStopLog({ open: false, technicianId: null });
          }}
          referenceId={rentalManagementData?._id}
          service={null}
          technician={viewStartStopLog?.technicianId}
          fetchRecords={fetchData}
          resource={sidebarResource.rentalManagement}
        />
      )}

      {subStatusToUpdate.open && (
        <SubStatusDatesDialog
          handleClose={() => {
            setSubStatusToUpdate({ open: false, status: null });
          }}
          options={subStatusOptions?.map((o) => o?.optionLabel)}
          selectedOption={subStatusToUpdate.status}
          onSuccess={handleSubStatusChange}
          submitting={isUpdating}
          rentalId={rentalManagementData?._id}
          assets={[]}
          technicians={selectedRecords?.map((a) => a?.technicianId)}
        />
      )}
    </>
  );
};

export default TechnicianDispatchReturn;

const BulkActionItems = ({ receive, selectedRecords, setStartEndDateConfirmationDialog, handleClickChangeSubStatus }) => {
  return (
    <BulkActionContainer>
      <>
        {!receive ? (
          <BulkActionContainer.Button
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
                date.setMinutes(date.getMinutes() + 1);
              }
              setStartEndDateConfirmationDialog({
                open: true,
                type: 'start',
                minDateTime: date,
                notes: '',
                _id: null
              });
            }}
          >
            Dispatch
          </BulkActionContainer.Button>
        ) : (
          <BulkActionContainer.Button
            disabled={selectedRecords?.every((r) => r?.startDate && !r?.endDate) ? false : true}
            onClick={() => {
              const dates = [];
              selectedRecords?.forEach((d: any) => {
                dates.push(new Date(d?.maxStartDate));
              });
              let date = null;
              if (dates?.length) {
                date = new Date(Math.max(...dates));
              }
              setStartEndDateConfirmationDialog({
                open: true,
                type: 'stop',
                minDateTime: date,
                notes: selectedRecords?.length === 1 ? selectedRecords[0]?.notes : '',
                _id: null
              });
            }}
          >
            Return
          </BulkActionContainer.Button>
        )}
        <BulkActionContainer.Button
          disabled={selectedRecords?.every((s: any) => s?.status === TECHNICIAN_STATUS.dispatched) ? false : true}
          onClick={handleClickChangeSubStatus}
          endIcon={<ExpandMore />}
        >
          {'Change Sub Status'}
        </BulkActionContainer.Button>
      </>
    </BulkActionContainer>
  );
};
