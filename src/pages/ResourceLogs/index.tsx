import { Box, IconButton, TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import routes from 'src/components/Helpers/Routes';
import { dateFormat, gridLoadingTimeout, LOG_RESOURCE, dateTimeFormat } from 'src/constants/helpers';
import VisibilityIcon from '@material-ui/icons/Visibility';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import ChangesDialog from './ChangesDialog';
import { useData } from '../../StateProvider/Provider';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import moment from 'moment';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import upperFirst from 'lodash/upperFirst';

const ResourceLogs = () => {

  const toastConfig = useContext(CustomToastContext);
  const [columns, setColumns] = useState([]);
  const { state, dispatch } = useTableReducer();
  const { page, limit } = state;
  const {
    state: { user, permissions }
  }: any = useData();
  const [openDialog, setOpenDialog] = useState({ open: false, changes: null, operations: null, updatedBy: null });
  const [option, setOption] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [resourceOptions, setResourceOptions] = useState([]);
  const [userOptions, setUserOptions] = useState([]);

  const actionOptions = [
    {
      optionLabel: 'Create',
      optionValue: 'create'
    },
    {
      optionLabel: 'Update',
      optionValue: 'update'
    },
    {
      optionLabel: 'Delete',
      optionValue: 'delete'
    }
  ];

  const [selectedAction, setSelectedAction] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const data: any = [];
    for (var key in LOG_RESOURCE) {
      if (permissions[key]?.isRead === true) {
        data.push({ optionLabel: routes[key].title, optionValue: LOG_RESOURCE[key], key: key });
      }
    }
    setResourceOptions(data);
    if (data?.length >= 1) {
      setSelectedResource(data[0]);
    }
  }, []);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    if (selectedResource) {
      axiosInstance()
        .get(`/sa-formbuilder/lookup?lookupResource=${selectedResource?.optionValue}`)
        .then(({ data: { data } }) => {
          setOption(data[selectedResource?.optionValue] || []);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  }, [selectedResource]);

  useEffect(() => {
    if (selectedResource) {
      axiosInstance().get(`/sa-formbuilder/lookup?lookupResource=User`).then(({ data: { data } }) => {
        setUserOptions(data["User"])
      })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  }, [selectedResource]);

  useEffect(() => {
    if (selectedResource) {
      fetchData();
    }
  }, [selectedResource, selectedOption, selectedAction, selectedUser, page, limit]);

  const fetchGridColumns = () => {
    let columns = [
      {
        accessor: 'referenceId',
        Header: 'Resource',
        width: 120,
        disableFilters: true,
        disableSortBy: true,
        Cell: ({ row }) => (
          <div>
            <p className="text-truncate link"
              title={row?.original?.optionLabel}
              onClick={() => window.open(`${routes[`${row?.original?.key}Detail`]?.path}/${row?.original?.referenceId?.optionValue}`)}
            >
              {row?.original?.referenceId?.optionLabel}
            </p>
          </div>
        )
      },
      {
        accessor: 'updatedBy',
        Header: 'Updated By',
        width: 120,
        disableFilters: true,
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
        Header: 'Action',
        width: 120,
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
        disableFilters: true,
        disableSortBy: true,
        width: 120,
        Cell: ({ row }) => <div className="text-truncate">{row?.original?.changeString}</div>
      },
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
        <HtmlTooltip title="View Changes">
          <IconButton
            onClick={() =>
              setOpenDialog({
                open: true,
                changes: row?.original?.changes || [],
                operations: row?.original?.operations || [],
                updatedBy: row?.original?.updatedBy?.optionLabel || ''
              })
            }
          >
            <VisibilityIcon color="primary" fontSize="small" />
          </IconButton>
        </HtmlTooltip>
      </>
    )
  };

  const getQueryString = () => {
    let query = null;
    query = `page=${page}&limit=${limit}&resource=${selectedResource?.optionValue}`;
    if (selectedOption) {
      query = `${query}&referenceId=${selectedOption.optionValue}`;
    }
    if (selectedAction) {
      query = `${query}&action=${selectedAction?.optionValue}`;
    }
    if (selectedUser) {
      query = `${query}&userId=${selectedUser?.optionValue}`;
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
            u.changes = changes;
            u.operations = operations;
            u.key = selectedResource?.key;
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
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[routes.resourceLogs]} />
      </div>
      <CustomContainer>
        <div className="header-panel">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[8px]">
            <Autocomplete
              fullWidth
              options={resourceOptions}
              getOptionLabel={(option) => option.optionLabel}
              value={selectedResource}
              onChange={(event, newValue) => {
                setSelectedResource(newValue);
                setSelectedOption(null);
              }}
              size="small"
              renderInput={(params) => <TextField {...params} label="Select Resource" variant="outlined" />}
            />
            {selectedResource && (
              <>
                <Autocomplete
                  options={option}
                  fullWidth
                  getOptionLabel={(option: any) => option.optionLabel}
                  getOptionSelected={(option: any, value: any) => option.optionValue === value.optionValue}
                  value={selectedOption}
                  onChange={(event, newValue) => {
                    setSelectedOption(newValue);
                  }}
                  size="small"
                  renderInput={(params) => <TextField {...params} label={`Select ${selectedResource?.optionLabel}`} variant="outlined" />}
                />
                <Autocomplete
                  options={actionOptions}
                  fullWidth
                  getOptionLabel={(option: any) => option.optionLabel}
                  getOptionSelected={(option: any, value: any) => option.optionValue === value.optionValue}
                  value={selectedAction}
                  onChange={(event, newValue) => {
                    setSelectedAction(newValue);
                  }}
                  size="small"
                  renderInput={(params) => <TextField {...params} label={'Select Action'} variant="outlined" />}
                />
                <Autocomplete
                  options={userOptions}
                  fullWidth
                  getOptionLabel={(option: any) => option.optionLabel}
                  getOptionSelected={(option: any, value: any) => option.optionValue === value.optionValue}
                  value={selectedUser}
                  onChange={(event, newValue) => {
                    setSelectedUser(newValue);
                  }}
                  size="small"
                  renderInput={(params) => <TextField {...params} label={'Select User'} variant="outlined" />}
                />
              </>
            )}
          </div>
        </div>
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={'resourceLogs'}
            refreshGrid={fetchData}
            hideSelection={true}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomContainer>
      {openDialog?.open && (
        <ChangesDialog
          open={openDialog?.open}
          onClose={() => setOpenDialog({ open: false, changes: null, operations: null, updatedBy: null })}
          changes={openDialog?.changes}
          operations={openDialog.operations}
          updatedBy={openDialog?.updatedBy}
        />
      )}
    </section>
  );
};

export default ResourceLogs;
