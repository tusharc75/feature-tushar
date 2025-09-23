import Box from '@mui/material/Box/Box';
import { useState, useEffect, useContext } from 'react';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import routes from '../../../components/Helpers/Routes';
import Grid from '@mui/material/Grid2';
import axiosInstance from 'src/axios/axiosInstance';
import { prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { IconButton } from '@mui/material';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CustomReactTable, { AccessorFunction, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { useData } from 'src/StateProvider/Provider';
import { displayDate } from 'src/constants/helpers';
import { Visibility } from '@mui/icons-material';
import { CustomOfflineContext } from '../../../StateProvider/OfflineContext/OfflineContext';
import { camelCase } from 'lodash';
import { fetch_rental_technician_fields } from 'src/components/RentalManagment/helper';
import { FiExternalLink } from 'react-icons/fi';
import DropdownCell from 'src/components/CustomReactTable/Cells/DropdownCell';
import { RiUserShared2Fill, RiUserReceived2Fill } from 'react-icons/ri';
import StartStopDateDialog from 'src/pages/FieldTicket/material/StartStopDateDialog';
import StartStopLogsDialog from 'src/pages/FieldTicket/material/StartStopLogsDialog';

const Technicians = ({ rentalManagementData, stepFullScreen, receive = false }) => {
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
      const fieldLabelResponce = await axiosInstance().put(`/field/find-field-labels`, {
        fields: [
          {
            resource: sidebarResource.employeeMaster,
            fieldNames: ['competencyType', 'competencies']
          }
        ]
      });
      technicianFields = fieldLabelResponce?.data?.data?.find((e) => e.resource === sidebarResource.employeeMaster)?.fieldNames || [];
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
        Header: 'Status',
        width: 200,
        Cell: ({ row }) => (row.original['status'] ? <p>{row.original?.status}</p> : <NoDataCell />)
      },
      ...(technicianFields?.find((e) => e.fieldName === 'competencyType')
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
        Cell: ({ row, table }) => {
          return (
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
              hideSelection={true}
            />
          ) : (
            <Box p={2} height={300}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </Grid>
      </Grid>
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
    </>
  );
};

export default Technicians;
