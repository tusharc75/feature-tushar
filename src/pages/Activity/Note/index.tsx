import { Chip, Dialog, IconButton, MenuItem, TextField } from '@mui/material';
import Box from '@mui/material/Box';
import { Delete as DeleteIcon } from '@mui/icons-material';
import Autocomplete from '@mui/material/Autocomplete';
import { camelCase } from 'lodash';
import queryString from 'query-string';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory } from 'react-router-dom';
import CustomReactTable, { getStaticFields, useTableReducer } from 'src/components/CustomReactTable';
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
import { CustomDialogTransition, gridLoadingTimeout, isObjectEmpty, prepareDataForGrid, sidebarResource } from '../../../constants/helpers';
import axios, { CancelTokenSource } from 'axios';
import { FiExternalLink } from 'react-icons/fi';

const Note = () => {
  const renderedFrom = camelCase(sidebarResource.note);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const {
    state: { user, permissions, resources }
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
    setResourceOptions(get_activity_resource(permissions, resources));
  }, []);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = () => {
    const column = [
      {
        accessor: 'name',
        Header: 'Title',
        disabled: true,
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
        disabled: true,
        disableFilters: true,
        disableSortBy: true,
        Cell: ({ row }) => (
          <div>
            {row.original?.relatedTo && row.original?.relatedTo?.length > 0 ? (
              row.original?.relatedTo.map((d) => {
                return (
                  <div className="flex items-center gap-2" key={d.name}>
                    <p> {d.name}</p>
                    <IconButton size="small" onClick={() => window.open(`${routes[d?.type].path}/detail/${d?.referenceId}`)}>
                      <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                    </IconButton>
                    <Chip color="primary" label={`${routes[d?.type]?.title}`} />
                  </div>
                );
              })
            ) : (
              <NoDataCell />
            )}
          </div>
        )
      },
      ...getStaticFields(),
      {
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
            <HtmlTooltip title={row.original?.canDelete ? 'Delete' : deleteDisable}>
              <span>
                <IconButton disabled={!row.original?.canDelete} size="small" aria-label="Delete" onClick={() => setDeleteRecord(row.original)}>
                  <DeleteIcon fontSize="small" color={row.original?.canDelete ? 'error' : 'disabled'} />
                </IconButton>
              </span>
            </HtmlTooltip>
          </>
        )
      }
    ];
    setColumns(column);
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
    let apiUrl = `/note?relatedTo=${JSON.stringify(
      filter?.map((e) => {
        return { type: e?.type, referenceId: e?._id, access: true };
      })
    )}${queryString}`;
    axiosInstance()
      .get(apiUrl, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data, count } }) => {
        let rows = data?.map((u) => {
          let finalObject: any = prepareDataForGrid(u, user);
          finalObject.canDelete = permissions?.note?.isDelete && finalObject?.createdById === user?.user?._id ? true : false;
          return finalObject;
        });
        dispatch({ type: 'initialize', data: rows, count: count });
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
          disabled={selectedRecords?.every((e) => !e.canDelete) ? true : false}
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
        <CustomBreadCrumbs routes={[{ title: resources?.note?.titlePlural }]} />
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
            isActionButtonVisible={permissions?.note?.isDelete}
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
            showOnlyShowFilteredRecordSwitch={false}
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
          message={`Are you sure you want to delete ${deleteRecord
            ? `${resources?.activity?.titleSingular?.toLowerCase()} :
            ${deleteRecord.name || 'Notes'}`
            : `selected ${resources?.activity?.titlePlural?.toLowerCase()}`
            } ?`}
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
          disableEnforceFocus={true}
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
        className={`flex-grow sm:min-w-[200px] sm:max-w-[250px]`}
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
          className={`flex-grow sm:min-w-[250px] sm:max-w-[270px]`}
          getOptionLabel={(option: any) => option.optionLabel || ''}
          isOptionEqualToValue={(option: any, value: any) => option.optionLabel === value.optionLabel}
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
              className={`flex-grow sm:min-w-[250px] sm:max-w-[270px]`}
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
