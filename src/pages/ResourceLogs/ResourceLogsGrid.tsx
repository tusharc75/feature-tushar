import { Box, IconButton } from '@material-ui/core';
import { camelCase, upperFirst } from 'lodash';
import moment from 'moment';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import VisibilityIcon from '@material-ui/icons/Visibility';
import routes from 'src/components/Helpers/Routes';
import { dateFormat, dateTimeFormat, gridLoadingTimeout } from 'src/constants/helpers';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ChangesDialog from './ChangesDialog';

const renderedFrom = 'resourceLogs';

const ResourceLogsGrid = ({ selectedResource, selectedOption = '', selectedAction = '', selectedUser = '', hideResourceField = false }) => {
  const toastConfig = useContext(CustomToastContext);
  const [openDialog, setOpenDialog] = useState({ open: false, data: null });
  const [columns, setColumns] = useState([]);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit } = state;

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    if (selectedResource) {
      fetchData();
    }
  }, [selectedResource, selectedOption, selectedAction, selectedUser, page, limit]);

  const fetchGridColumns = () => {
    let extraColumns = [];
    if (!hideResourceField) {
      extraColumns.push({
        accessor: 'referenceId',
        Header: 'Resource',
        width: 120,
        disableFilters: true,
        disableSortBy: true,
        Cell: ({ row }) => (
          <div>
            <p
              className="text-truncate link"
              title={row?.original?.optionLabel}
              onClick={() => window.open(`${routes[`${row?.original?.key}Detail`]?.path}/${row?.original?.referenceId?.optionValue}`)}
            >
              {row?.original?.referenceId?.optionLabel}
            </p>
          </div>
        )
      });
    }
    let columns = [
      ...extraColumns,
      {
        accessor: 'updatedBy',
        Header: 'Updated By',
        width: 120,
        disableFilters: true,
        disabled: true,
        disableSortBy: true,
        Cell: ({ row }) => (
          <div>
            <p
              className="link text-truncate"
              title={row?.original?.optionLabel}
              onClick={() => window.open(`${routes.userDetail.path}/${row?.original?.updatedBy?.optionValue}`)}
            >
              {row?.original?.updatedBy?.optionLabel}
            </p>
          </div>
        )
      },
      {
        accessor: 'actions',
        Header: 'Operation',
        width: 120,
        disabled: true,
        disableFilters: true,
        disableSortBy: true,
        Cell: ({ row }) => <div>{upperFirst(row.original?.action)}</div>
      },
      {
        accessor: 'date',
        Header: 'Updated Date Time',
        width: 120,
        disableFilters: true,
        disableSortBy: true,
        Cell: ({ row }) => <div className="text-truncate">{moment(row?.original?.date)?.format(dateTimeFormat)}</div>
      },
      {
        accessor: 'changeString',
        Header: 'Changes',
        width: 300,
        Cell: ({ row }) => <div className="text-truncate">{row?.original?.changeString}</div>
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
        Cell: ({ row }) => (
          <>
            <HtmlTooltip title="View Changes">
              <IconButton
                size="small"
                onClick={() =>
                  setOpenDialog({
                    open: true,
                    data: row?.original
                  })
                }
              >
                <VisibilityIcon color="primary" fontSize="small" />
              </IconButton>
            </HtmlTooltip>
          </>
        )
      }
    ];
    setColumns(columns);
  };

  const getQueryString = () => {
    let query = null;
    query = `page=${page}&limit=${limit}&resource=${selectedResource?.optionValue || selectedResource}`;
    if (selectedOption) {
      query = `${query}&referenceId=${selectedOption}`;
    }
    if (selectedAction) {
      query = `${query}&action=${selectedAction}`;
    }
    if (selectedUser) {
      query = `${query}&userId=${selectedUser}`;
    }
    return query;
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`/log?${queryString}`)
      .then(
        ({
          data: {
            data: { data, count }
          }
        }) => {
          let rows = data?.map((u) => {
            var changeString = [];
            var changes = [];
            var operations = [];
            if (u?.action == 'update' || u?.action == 'create') {
              if (Array.isArray(u?.changes)) {
                if (u?.changes?.length === 0) {
                  return;
                }
                u?.changes?.forEach((e) => {
                  if (e?.fieldLabel) {
                    if (e?.fieldLabel === 'history' || e?.fieldLabel === 'createdBy' || e?.fieldLabel === '_id') {
                      return;
                    }
                    changes.push(e);
                    var oldValue = e?.oldValue;
                    var newValue = e?.newValue;
                    if (e?.type === 'date') {
                      if (oldValue && moment(oldValue)?.isValid) {
                        oldValue = moment(oldValue).format(dateFormat);
                      }
                      if (newValue && moment(newValue)?.isValid) {
                        newValue = moment(newValue).format(dateFormat);
                      }
                    } else if (e?.type === 'dropDown' && e?.lookup) {
                      oldValue = oldValue?.label;
                      newValue = newValue?.label;
                    } else if (e?.type === 'multiSelect' && e?.lookup) {
                      oldValue = oldValue?.map((e) => e?.label)?.toString();
                      newValue = newValue?.map((e) => e?.label)?.toString();
                    }
                    if (oldValue && newValue) {
                      changeString.push(`${e.fieldLabel} changed from ${oldValue} to ${newValue}`);
                    } else {
                      changeString.push(`${e.fieldLabel} changed to ${newValue}`);
                    }
                  } else if (e?.label) {
                    operations.push(e);
                  }
                });
              } else {
                operations.push({ ...u?.changes });
              }
              if (changeString?.length) {
                u.changeString = changeString?.toString();
              } else {
                u.changeString = 'Click View for check changes';
              }
              if (u?.action == 'create') {
                u.changeString = 'Created';
              }
            } else if (u?.action == 'delete') {
              u.changeString = 'Deleted';
            }
            u.changes = changes;
            u.operations = operations;
            u.key = selectedResource?.key || camelCase(selectedResource);
            return u;
          });

          rows = rows.filter((e) => e);
          dispatch({ type: 'initialize', data: rows, count: count });
          setTimeout(() => {
            dispatch({ type: 'loading', loading: false });
          }, gridLoadingTimeout);
        }
      )
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <>
      {columns ? (
        <CustomReactTable
          height={'calc(100vh - 200px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          renderedFrom={renderedFrom}
          refreshGrid={fetchData}
          hideSelection={true}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {openDialog?.open && (
        <ChangesDialog
          open={openDialog?.open}
          onClose={() => setOpenDialog({ open: false, data: null })}
          data={openDialog?.data}
        />
      )}
    </>
  );
};
export default ResourceLogsGrid;
