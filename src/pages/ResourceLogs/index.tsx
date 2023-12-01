import { Box, IconButton, TextField } from '@material-ui/core';
import { isMobile } from 'react-device-detect';
import { Autocomplete } from '@material-ui/lab';
import { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTableNew';
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

const ResourceLogs = () => {
  const toastConfig = useContext(CustomToastContext);
  const [columns, setColumns] = useState([]);
  const { state, dispatch } = useTableReducer();
  const { page, limit} = state;
  const {
    state: { user, permissions }
  }: any = useData();
  const [openDialog, setOpenDialog] = useState({ open: false, changes: null, operations: null, updatedBy: null });
  const [option, setOption] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [resourceOptions, setResourceOptions] = useState([]);

  useEffect(() => {
    const data: any = [];
    for (var key in LOG_RESOURCE) {
      if (permissions[key]?.isRead === true) {
        data.push({ optionLabel: routes[key].title, optionValue: LOG_RESOURCE[key], key: key });
      }
    }
    setResourceOptions(data);
    if (data?.length === 1) {
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
      fetchData();
    }
  }, [selectedResource, selectedOption, page, limit]);

  const fetchGridColumns = () => {
    let columns = [
      {
        accessor: 'referenceId',
        Header: 'Resource',
        width: 120,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (
          <p
            className="text-truncate link"
            title={row?.original?.optionLabel}
            onClick={() => window.open(`${routes[`${row?.original?.key}Detail`]?.path}/${row?.original?.optionValue}`)}
          >
            {row?.original?.optionLabel}
          </p>
        )
      },
      {
        accessor: 'updatedBy',
        Header: 'Updated By',
        width: 120,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (
          <p
            className="link text-truncate"
            title={row?.original?.optionLabel}
            onClick={() => window.open(`${routes.userDetail.path}/${row?.original?.optionValue}`)}
          >
            {row?.original?.optionLabel}
          </p>
        )
      },
      {
        accessor: 'date',
        Header: 'Updated Date Time',
        width: 120,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (
          <p
            className="text-truncate"
          >
            {moment(row?.original?.date)?.format(dateTimeFormat)}
          </p>
        )
      },
      {
        accessor: 'changeString',
        Header: 'Changes',
        width: 120,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row?.original?.changeString}</p>
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
          {/* xs={12} sm={6} md={4} lg={4} */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[8px]">
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
            isClientSideGrid={false}
            refreshGrid={fetchData}
            showOnlyShowFilteredRecordSwitch={false}
            showFilters={false}
            hideSelection = {true}
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
