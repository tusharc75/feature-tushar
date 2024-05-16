import { Chip, Dialog, IconButton, MenuItem, TextField } from '@material-ui/core';
import Box from '@material-ui/core/Box';
import { Delete as DeleteIcon } from '@material-ui/icons';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { Autocomplete } from '@material-ui/lab';

import { camelCase } from 'lodash';
import queryString from 'query-string';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory } from 'react-router-dom';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { deleteDisable } from 'src/constants/messageHelpers';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import ActivityModelHandler from '../../../components/Activity/ActivityModelHandler';
import { get_activity_resource } from '../../../components/Activity/Helpers/utils';
import { CreateNote } from '../../../components/Activity/Note/CreateNote';
import CustomBreadCrumbs from '../../../components/CustomBreadCrumbs';
import CustomContainer from '../../../components/CustomContainer';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import routes from '../../../components/Helpers/Routes';
import { CustomDialogTransition, displayDate, gridLoadingTimeout, isObjectEmpty, sidebarResource } from '../../../constants/helpers';
import axios, { CancelTokenSource } from 'axios';

const Note = () => {
  const renderedFrom = camelCase(routes?.activityNote.title);
  const { state, dispatch } = useTableReducer();
  const {
    state: { user, permissions }
  }: any = useData();
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const parsed = queryString.parse(history.location.search);
  const { referenceType, referenceId } = parsed;
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [filter, setFilter] = useState(null);
  const [okButtonLoading, setOkButtonLoading] = useState(false);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState({ id: null, name: null });
  const [, setShowDeleteWarningConfirmBox] = useState(false);
  const [noteData, setNoteData] = useState(null);
  const [noteId, setNoteId] = useState(undefined);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [columns, setColumns] = useState(null);
  const [resource, setResource] = useState(null);
  const [resourceData, setResourceData] = useState(null);
  const [loadingResources, setLoadingResources] = useState(false);
  const [selectedResourceData, setSelectedResourceData] = useState(null);
  const [resourceOptions, setResourceOptions] = useState([]);

  const { page, limit, search, filters, sorting, selectedRecords } = state;

  useEffect(() => {
    setResourceOptions(get_activity_resource(permissions));
  }, []);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = () => {
    const column = [
      {
        accessor: 'name',
        Header: 'Title',
        show: true,
        disabled: true,
        primaryField: true,
        Cell: ({ row }) => (
          <div>
            <span
              className={permissions?.note?.isUpdate ? 'link cursor-pointer' : ''}
              onClick={() => {
                if (permissions?.note?.isUpdate) {
                  handleActivityOpen(row.original);
                }
              }}
            >
              {row.original?.name}
            </span>
          </div>
        )
      },
      {
        accessor: 'relatedTo',
        Header: 'Related To',
        show: true,
        disabled: true,
        primaryField: true,
        filter: false,
        sortable: false,
        Cell: ({ row }) => (
          <div>
            {row.original?.relatedTo && row.original?.relatedTo?.length > 0 ? (
              row.original?.relatedTo.map((d) => {
                return (
                  <div style={{ display: 'flex', alignItems: 'center' }} key={d.name}>
                    <p> {d.name}</p>
                    <IconButton className="ml-3" size="small" onClick={() => window.open(`${routes[d?.type].path}/detail/${d?.referenceId}`)}>
                      <OpenInNewIcon fontSize="small" color="primary" />
                    </IconButton>
                    <Chip className="ml-3" color="primary" label={`${routes[d?.type]?.title}`} />
                  </div>
                );
              })
            ) : (
              <NoDataCell />
            )}
          </div>
        )
      },
      {
        accessor: 'createdByDate',
        Header: 'Created At',
        filter: false,
        sortable: false,
        show: true,
        Cell: ({ row }) => <div>{displayDate(row.original?.createdByDate)}</div>
      },
      {
        accessor: 'updatedByDate',
        Header: 'Updated At',
        filter: false,
        sortable: false,
        show: true,
        Cell: ({ row }) => (row.original?.updatedByDate ? <div>{displayDate(row.original?.updatedByDate)}</div> : <NoDataCell />)
      }
    ];
    setColumns([...column, ActionsRenderer]);
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 110,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        <HtmlTooltip title={permissions?.note?.isDelete ? 'Delete' : deleteDisable}>
          <span>
            <IconButton disabled={!permissions?.note?.isDelete} size="small" aria-label="Delete" onClick={() => showConfirmBox(row.original)}>
              <DeleteIcon fontSize="small" color={permissions?.note?.isDelete ? 'error' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
      </>
    )
  };

  useEffect(() => {
    if (referenceType) {
      axiosInstance()
        .get(`/activity/referenceName?referenceType=${referenceType}&referenceId=${referenceId}`)
        .then(({ data: { data } }) => {
          setFilter([{ _id: referenceId, type: referenceType, name: data.name }]);
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
        });
    } else {
      setFilter([]);
    }
  }, [referenceId]);

  useEffect(() => {
    if (resource && resource?.optionValue) {
      setLoadingResources(true);
      const lookupResource = sidebarResource[resource?.optionValue === 'quote' ? 'quoteBuilder' : resource?.optionValue];
      axiosInstance()
        .get(`/sa-formbuilder/lookup?lookupResource=${lookupResource}`)
        .then(({ data: { data } }) => {
          setResourceData(data[lookupResource] || []);
          setLoadingResources(false);
        })
        .catch((error) => {
          setLoadingResources(false);
        });

      return () => {
        setSelectedResourceData(null);
        setResourceData(null);
      };
    }
  }, [resource]);

  const handleClose = () => {
    setShowCreateDialog(false);
    setIsNew(false);
    fetchData();
  };

  const handleDialogClose = () => {
    setShowCreateDialog(false);
    setIsNew(false);
  };

  useEffect(() => {
    const cancelToken = axios.CancelToken.source();
    if (filter) fetchData(cancelToken);
    return () => cancelToken.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, filters, filter, sorting, search]);

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    const queryString = getQueryString();
    dispatch({ type: 'loading', loading: true });
    let apiUrl = `/note?filter=${JSON.stringify(filter)}${queryString}`;
    axiosInstance()
      .get(apiUrl, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data } }) => {
        let rows = data.map((u) => {
          const { createdBy, updatedBy, ...restProperties } = u;
          let res = {
            ...restProperties,
            id: u._id,
            name: u.name,
            createdBy: u.createdBy?.user,
            createdByDate: u.createdBy?.date,
            updatedBy: u.updatedBy?.user?.concatedName,
            updatedByDate: u.updatedBy?.date,
            isChecked: false,
            canDelete: permissions?.note?.isDelete ? u.createdBy?.user === user?.user?._id : false
          };
          return res;
        });

        dispatch({ type: 'initialize', data: rows, count: data.length });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        dispatch({ type: 'loading', loading: false });
      });
  };

  const getQueryString = () => {
    let deepFilter = `&page=${page}&limit=${limit}`;

    if (!isObjectEmpty(filters)) {
      const updatedFilters = [];

      Object.keys(filters).forEach((field) => {
        if (filters[field].filter?.toLowerCase() === 'me') {
          filters[field].filter = user?.user?.email;
        }
        updatedFilters.push({
          field: field,
          term: filters[field].filter
        });
      });
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}&filterType=and`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${search}`;
    }
    return deepFilter;
  };

  const handleDeleteNote = async () => {
    if (deleteRecord.id || selectedRecords.length > 0) {
      setOkButtonLoading(true);
      axiosInstance()
        .put(`/note/deletemany`, { ids: deleteRecord.id ? [deleteRecord.id] : selectedRecords.map((d) => d._id) })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          dispatch({ type: 'selection', selectedRecords: [] });
          setIsConformDialogVisible(false);
          setOkButtonLoading(false);
          setDeleteRecord({ id: null, name: null });
          fetchData();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setIsConformDialogVisible(false);
          setOkButtonLoading(false);
        });
    }
  };

  const handleChangeFilter = (value) => {
    setFilter(value);
  };

  const handleActivityOpen = (data) => {
    setShowCreateDialog(true);
    setNoteData(data);
  };

  const showConfirmBox = (row) => {
    if (row) {
      setIsConformDialogVisible(true);
      if (row) {
        setDeleteRecord({ id: row.id, name: row.name });
      }
    } else {
      if (selectedRecords.find((d) => d.ownerId !== user.user._id)) {
        setShowDeleteWarningConfirmBox(true);
      } else {
        setIsConformDialogVisible(true);
      }
    }
  };

  const ActionMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={permissions?.note?.isDelete ? !selectedRecords.every((records) => records.canDelete) : true}
          onClick={() => {
            showConfirmBox(selectedRecords);
          }}
        >
          {`Delete (${selectedRecords?.length})`}
        </MenuItem>
      </>
    );
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ title: routes.activityNote.title }]} />
      </div>
      <CustomContainer>
        {filter && (
          <ListingPageHeader
            leftSideContents={
              <LeftSideContents
                {...{
                  resourceOptions,
                  resource,
                  setResource,
                  setFilter,
                  resourceData,
                  loadingResources,
                  selectedResourceData,
                  setSelectedResourceData
                }}
              />
            }
            isActionButtonVisible={permissions?.productionOrder?.isDelete}
            searchFilter={filter}
            handleSearchFilter={handleChangeFilter}
            actionButtonProps={{ disabled: selectedRecords?.length ? false : true }}
            actionMenuItems={<ActionMenuItems />}
            addButtonOnclick={() => {
              setIsNew(true);
              setShowCreateDialog(true);
            }}
            isAddButtonVisible={true}
          />
        )}
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            showOnlyShowFilteredRecordSwitch={true}
            showFilters={false}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
        {noteId !== undefined && <ActivityModelHandler activityType="note" activityId={noteId} onClose={() => setNoteId(undefined)} />}
      </CustomContainer>
      {isConfirmDialogVisible ? (
        <ConfirmationDialog
          open={isConfirmDialogVisible}
          message={`Are you sure you want to delete ${deleteRecord.name || 'Notes'}?`}
          onClose={() => {
            if (deleteRecord.id) setDeleteRecord({ id: null, name: null });
            setIsConformDialogVisible(false);
          }}
          okBtnLoading={okButtonLoading}
          onOk={handleDeleteNote}
        />
      ) : null}
      {showCreateDialog && (
        <Dialog
          open={showCreateDialog}
          fullScreen={fullScreen || isMobile || isTablet}
          TransitionComponent={CustomDialogTransition}
          aria-labelledby="customized-dialog-title"
          maxWidth={'md'}
          onClose={(e, reason) => {
            if (reason !== 'backdropClick') {
              handleDialogClose();
              setFullScreen(false);
            }
          }}
          fullWidth
        >
          <CreateNote
            noteId={isNew ? null : noteData?.id}
            relatedTo={[
              {
                type: resource && selectedResourceData ? resource.optionValue : 'user',
                referenceId: resource && selectedResourceData ? selectedResourceData.optionValue : user?.user?._id,
                access: true
              }
            ]}
            handleClose={() => {
              handleClose();
              setFullScreen(false);
            }}
            handleDialogClose={() => {
              handleDialogClose();
              setFullScreen(false);
            }}
            isMinimized={!fullScreen}
            onMinimizeMaximize={() => {
              setFullScreen((prevState) => !prevState);
            }}
            showManimizeMaximize={true}
            // noteData={noteData}
          />
        </Dialog>
      )}
    </section>
  );
};

export default Note;

const LeftSideContents = ({
  resourceOptions,
  resource,
  setResource,
  setFilter,
  resourceData,
  loadingResources,
  selectedResourceData,
  setSelectedResourceData
}) => {
  return (
    <>
      <Autocomplete
        options={resourceOptions || []}
        getOptionLabel={(option) => option.optionLabel || ''}
        className={`sm:max-w-[250px] sm:min-w-[200px] flex-grow`}
        value={resource}
        size="small"
        fullWidth
        onChange={(event, newValue) => {
          setResource(newValue);
          if (newValue) {
            //setFilter((prevState) => [...prevState, { type: newValue?.optionValue, name: newValue?.optionLabel, isAll: true }]);
          } else {
            setFilter([]);
          }
        }}
        renderInput={(params) => (
          <TextField
            fullWidth
            className="flex-grow md:max-w-[250px]"
            margin="none"
            size="small"
            {...params}
            label="Select Resource"
            variant="outlined"
          />
        )}
      />
      {resource && resourceData && (
        <Autocomplete
          disabled={loadingResources}
          options={resourceData || []}
          fullWidth
          className={`sm:max-w-[270px] sm:min-w-[250px] flex-grow`}
          getOptionLabel={(option: any) => option.optionLabel || ''}
          getOptionSelected={(option: any, value: any) => option.optionLabel === value.optionLabel}
          value={selectedResourceData}
          onChange={(event, newValue) => {
            setSelectedResourceData(newValue);
            if (newValue?.optionValue) {
              setFilter((prevState) => [...prevState, { _id: newValue.optionValue, type: resource.optionValue, name: newValue.optionLabel }]);
            } else {
              setFilter([]);
            }
          }}
          size="small"
          renderInput={(params) => (
            <TextField
              fullWidth
              className={`sm:max-w-[270px] sm:min-w-[250px] flex-grow`}
              margin="none"
              size="small"
              {...params}
              label={`${resource.optionLabel}`}
              variant="outlined"
            />
          )}
        />
      )}
    </>
  );
};
