import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import { SearchFilter } from '../../../components/Activity/Report/SearchFilter';
import { useHistory } from 'react-router-dom';
import queryString from 'query-string';
import { GetReferenceName, GetNotes } from '../../../axios/activity';
import axiosInstance from '../../../axios/axiosInstance';
import ActivityModelHandler from '../../../components/Activity/ActivityModelHandler';
import CustomBreadCrumbs from '../../../components/CustomBreadCrumbs';
import CustomContainer from '../../../components/CustomContainer';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { GoNote } from 'react-icons/go';
import { ExpandMore } from '@material-ui/icons';
import { Button, Chip, Dialog, Link, Menu, MenuItem, TextField } from '@material-ui/core';
import { AddOutlined } from '@material-ui/icons';
import { CreateNote } from '../../../components/Activity/Note/CreateNote';
import { CustomDialogTransition, getApi, getData, gridLoadingTimeout } from '../../../constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import { useData } from '../../../StateProvider/Provider';
import styles from '../../Leads/Header.module.scss';
import CustomAgGrid, { reducer, intialState } from '../../../components/AgGridComponents/CustomAgGrid';
import { displayDate } from '../../../constants/helpers';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import GridDeleteIcon from '../../../components/Helpers/GridDeleteIcon';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import routes from '../../../components/Helpers/Routes';
import CustomSwipableList from '../../../components/SwipableListComponents/CustomSwipableList';
import { MdAdd } from 'react-icons/all';
import { Autocomplete } from '@material-ui/lab';
import { get_activity_resource } from '../../../components/Activity/Helpers/utils';

const Note = () => {
  const {
    state: { user, permissions }
  }: any = useData();
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const parsed = queryString.parse(history.location.search);
  const { referenceType, referenceId } = parsed;
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [filter, setFilter] = useState(null);
  const [okButtonLoading, setOkButtonLoading] = useState(false);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState({ id: null, name: null });
  const [, setShowDeleteWarningConfirmBox] = useState(false);
  const [noteData, setNoteData] = useState(null);
  const [noteId, setNoteId] = useState(undefined);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  //  Grid Variables - Start
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords, appendRows } = state;
  const localStorageSelectedRecords = 'notesPage';
  const [resource, setResource] = useState(null);
  const [resourceData, setResourceData] = useState(null);
  const [loadingResources, setLoadingResources] = useState(false);
  const [selectedResourceData, setSelectedResourceData] = useState(null);
  const columnState = JSON.parse(localStorage.getItem('notesPage'));

  const [resourceOptions, setResourceOptions] = useState([]);

  useEffect(() => {
    setResourceOptions(get_activity_resource(permissions));
  }, []);

  const columns = [
    { field: 'name', headerName: 'Title', show: true, disabled: true, primaryField: true, cellRenderer: 'nameRenderer' },
    { field: 'relatedTo', headerName: 'Related To', show: true, disabled: true, primaryField: true, cellRenderer: 'referenceRenderer' },
    { field: 'createdByDate', headerName: 'Created At', filter: false, sortable: false, show: true, cellRenderer: 'createdAtDateRenderer' },
    { field: 'updatedByDate', headerName: 'Updated At', filter: false, sortable: false, show: true, cellRenderer: 'updatedAtDateRenderer' }
  ];

  if (columnState) {
    columns.map((item) => {
      columnState.map((d) => {
        if (d.colId === item.field) {
          item.show = !d.hide;
        }
      });
    });
  }
  //  Grid Variables - End

  useEffect(() => {
    if (referenceType) {
      GetReferenceName(referenceType, referenceId)
        .then(({ data }) => {
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
      axiosInstance()
        .get(`${getApi(resource?.optionValue)}?limit=100`)
        .then(({ data: { data } }) => {
          if (data.length) {
            const mappedData = data.map((_d) => getData(resource?.optionValue, _d));
            setResourceData(mappedData || []);
          }
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

  useEffect(() => {
    if (filter) {
      fetchNotes();
    }
  }, [filter]);

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const handleClose = () => {
    setShowCreateDialog(false);
    setIsNew(false);
    fetchNotes();
  };

  const handleDialogClose = () => {
    setShowCreateDialog(false);
    setIsNew(false);
  };

  const NameRenderer = (params) => (
    <span
      className={permissions?.note?.isUpdate ? 'link cursor-pointer' : ''}
      onClick={() => {
        if (permissions?.note?.isUpdate) {
          handleActivityOpen(params.data);
        }
      }}
    >
      {params.value}
    </span>
  );

  const ReferenceRenderer = (params) => (
    <>
      {params.value && params.value?.length > 0 ? (
        params.value.map((d) => {
          return (
            <>
              <Link className="link text-truncate" onClick={() => history.push(`${routes[d?.type].path}/detail/${d?.referenceId}`)}>
                {d.name}
              </Link>
              <Chip className="ml-3" color="primary" label={`${routes[d?.type]?.title}`} />
            </>
          );
        })
      ) : (
        <NoDataCell />
      )}
    </>
  );

  const CreatedAtDateRenderer = (params) => <span style={{ marginLeft: 5, fontSize: 12 }}>{displayDate(params.value)}</span>;

  const UpdatedAtDateRenderer = (params) =>
    params.value ? <span style={{ marginLeft: 5, fontSize: 12 }}>{displayDate(params.value)}</span> : <NoDataCell />;

  const ActionsRenderer = (params) => (
    <>
      <GridDeleteIcon
        hasDeletePermission={permissions?.note?.isDelete}
        ownerId={params.data.createdBy}
        userId={user?.user?._id}
        onDelete={() => showConfirmBox(params.data)}
        entity="note"
      />
    </>
  );
  const frameworkComponents = {
    nameRenderer: NameRenderer,
    referenceRenderer: ReferenceRenderer,
    createdAtDateRenderer: CreatedAtDateRenderer,
    updatedAtDateRenderer: UpdatedAtDateRenderer,
    actionsRenderer: ActionsRenderer
  };

  const fetchNotes = async () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    await GetNotes(JSON.stringify(filter))
      .then(({ data }) => {
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
            isChecked: false
          };
          return res;
        });
        if (appendRows) {
          dispatch({
            type: 'initialize',
            data: [...dataRows, ...rows],
            count: data.count,
            selectedRecords: [...dataRows, ...rows].filter((f) => f.isChecked === true)
          });
        } else {
          dispatch({
            type: 'initialize',
            data: rows,
            count: data.count,
            selectedRecords: rows.filter((f) => f.isChecked === true)
          });
        }
        if (gridApi) {
          try {
            let oldSelectedRecords = localStorage.getItem(localStorageSelectedRecords)
              ? JSON.parse(localStorage.getItem(localStorageSelectedRecords))
              : [];
            if (oldSelectedRecords.length > 0) {
              gridApi.forEachNode(function (node) {
                node.setSelected(oldSelectedRecords.some((o) => o === node.data._id));
              });
            }
          } catch (ex) {
            console.error('Error in getting selected records from local storage');
          }
        }

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

  const handleDeleteNote = async () => {
    if (deleteRecord.id || selectedRecords.length > 0) {
      setOkButtonLoading(true);
      axiosInstance()
        .put(`/note/deletemany`, { ids: deleteRecord.id ? [deleteRecord.id] : selectedRecords.map((d) => d._id) })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: 'Note Deleted Successfully'
          });
          setIsConformDialogVisible(false);
          setOkButtonLoading(false);
          if (deleteRecord.id) {
            setDeleteRecord({ id: null, name: null });
          }
          fetchNotes();
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

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item xs={6}>
          <CustomBreadCrumbs routes={[{ title: routes.activityNote.title }]} />
        </Grid>
      </Grid>
      <CustomContainer>
        {filter && (
          <div className="header-panel">
            <Grid container className={styles.filter_side_container}>
              <Grid item xs={12} md={6} sm={12} className="d-flex align-items-center gap-1">
                <GoNote className="headerLogo" />
                <span className="listingHeader">{routes.activityNote.title}</span>
                <Autocomplete
                  options={resourceOptions}
                  getOptionLabel={(option) => option.optionLabel}
                  style={{ width: isMobile && !isTablet ? '60%' : '250px' }}
                  value={resource}
                  onChange={(event, newValue) => {
                    setResource(newValue);
                    if (newValue) {
                      setFilter((prevState) => [...prevState, { type: newValue?.optionValue, name: newValue?.optionLabel, isAll: true }]);
                    } else {
                      setFilter([]);
                    }
                  }}
                  size="small"
                  renderInput={(params) =>
                    isMobile && !isTablet ? (
                      <TextField {...params} label="Select Resource" size="small" variant="outlined" className={isMobile ? 'serchBox' : ''} />
                    ) : (
                      <TextField {...params} label="Select Resource" variant="outlined" />
                    )
                  }
                />
                {resource && resourceData && (
                  <Autocomplete
                    disabled={loadingResources}
                    options={resourceData}
                    getOptionLabel={(option: any) => option.name}
                    getOptionSelected={(option: any, value: any) => option.name === value.name}
                    style={{ width: isMobile && !isTablet ? '60%' : '250px' }}
                    value={selectedResourceData}
                    onChange={(event, newValue) => {
                      setSelectedResourceData(newValue);
                      if (newValue?.id) {
                        setFilter((prevState) => [...prevState, { _id: newValue.id, type: resource.optionValue, name: newValue.name }]);
                      } else {
                        setFilter([]);
                      }
                    }}
                    size="small"
                    renderInput={(params) =>
                      isMobile && !isTablet ? (
                        <TextField
                          {...params}
                          label={`${resource.optionLabel}`}
                          size="small"
                          variant="outlined"
                          className={isMobile ? 'serchBox' : ''}
                        />
                      ) : (
                        <TextField {...params} label={`${resource.optionLabel}`} variant="outlined" />
                      )
                    }
                  />
                )}
              </Grid>
              <Grid item xs={12} md={6} sm={12} className={styles.filter_side}>
                <Box component="div" className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} style={{ width: '100%' }}>
                  <Grid style={{ width: isMobile && !isTablet ? '75%' : '100%', display: 'flex' }}>
                    <SearchFilter handleChangeFilter={handleChangeFilter} filter={filter} chip={{ size: 'small' }} activityName="note" />
                  </Grid>
                  <Grid style={{ display: 'flex', gap: '5px' }}>
                    {
                      <Button
                        variant={isMobile && !isTablet ? 'text' : 'contained'}
                        color="primary"
                        size="small"
                        onClick={() => {
                          setIsNew(true);
                          setShowCreateDialog(true);
                        }}
                        className={isMobile && !isTablet ? 'mobile_button' : styles.add_submit_btn}
                        startIcon={isMobile && !isTablet ? null : <AddOutlined />}
                      >
                        {isMobile && !isTablet ? <MdAdd size={23} /> : 'Add'}
                      </Button>
                    }
                    <div className="d-flex gap-2">
                      {/* </Box> */}
                      <Button
                        variant={isMobile && !isTablet ? 'text' : 'outlined'}
                        color="default"
                        size="small"
                        onClick={openActions}
                        aria-controls="action-menu"
                        disabled={selectedRecords.length > 0 ? false : true}
                        className={isMobile && !isTablet ? 'mobile_button' : styles.action_submit_btn}
                      >
                        {isMobile && !isTablet ? '' : 'Actions'} <ExpandMore />
                      </Button>
                      <Menu
                        anchorEl={anchorEl}
                        keepMounted
                        getContentAnchorEl={null}
                        anchorOrigin={{
                          vertical: 'bottom',
                          horizontal: 'left'
                        }}
                        id="action-menu"
                        open={Boolean(anchorEl)}
                        onClose={closeActions}
                      >
                        <MenuItem
                          onClick={() => {
                            showConfirmBox(selectedRecords);
                            closeActions();
                          }}
                          disabled={!permissions.note.isDelete}
                        >
                          Delete
                        </MenuItem>
                      </Menu>
                    </div>
                  </Grid>
                </Box>
              </Grid>
            </Grid>
          </div>
        )}
        {isMobile && !isTablet ? (
          <CustomSwipableList
            allowSelection={true}
            allowSwipe={true}
            permissions={permissions.note}
            primaryField={columns?.find((d) => d.primaryField)}
            onClick={(data) => {
              if (permissions?.note?.isUpdate) {
                handleActivityOpen(data);
              }
            }}
            dataRows={dataRows}
            selectedRecords={selectedRecords}
            dispatch={dispatch}
            onEdit={(data) => {}}
            extraParamsToCheckDelete={true}
            onDelete={(data) => {
              showConfirmBox(selectedRecords);
              closeActions();
            }}
            rowCount={rowCount}
            page={page}
            loading={loading}
            chips={[
              {
                label: 'Status: ',
                field: 'status'
              }
            ]}
            onCreate={false}
            showClone={false}
            onClone={() => {}}
            renderedFrom={'notesPage'}
          />
        ) : (
          <CustomAgGrid
            columns={columns}
            dataRows={dataRows}
            frameworkComponents={frameworkComponents}
            setGridApi={setGridApi}
            dispatch={dispatch}
            rowCount={rowCount}
            limit={limit}
            pageSizes={pageSizes}
            page={page}
            allowAction={true}
            allowSelection={true}
            actionWidth={100}
            isClientSideGrid={true}
            loading={loading}
            renderedFrom="notesPage"
            refreshGrid={fetchNotes}
          />
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
          onClose={() => {
            handleDialogClose();
            setFullScreen(false);
          }}
          fullWidth
        >
          <CreateNote
            noteId={isNew ? null : noteData?.id}
            relatedTo={[
              {
                type: resource && selectedResourceData ? resource.optionValue : 'user',
                referenceId: resource && selectedResourceData ? selectedResourceData.id : user?.user?._id,
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
    </Fragment>
  );
};

export default Note;
