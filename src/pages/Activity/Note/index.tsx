import React, { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Layout from '../../../components/Layout';
import { SearchFilter } from '../../../components/Activity/Report/SearchFilter';
import { useHistory } from 'react-router-dom';
import queryString from 'query-string';
import { GetReferenceName, GetNotes } from '../../../axios/activity';
import axiosInstance from '../../../axios/axiosInstance';
import moment from 'moment';
import ActivityModelHandler from '../../../components/Activity/ActivityModelHandler';
import CustomBreadCrumbs from '../../../components/CustomBreadCrumbs';
import CustomContainer from '../../../components/CustomContainer';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { GoNote } from 'react-icons/go';
import { ExpandMore } from '@material-ui/icons';
import { Button, Dialog, Menu, MenuItem } from '@material-ui/core';
import { AddOutlined } from '@material-ui/icons';
import { CreateNote } from '../../../components/Activity/Note/CreateNote';
import { CustomDialogTransition, gridLoadingTimeout } from '../../../constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import { useData } from '../../../StateProvider/Provider';
import styles from '../../Leads/Header.module.scss';
import CustomAgGrid, { reducer, intialState } from '../../../components/AgGridComponents/CustomAgGrid';
import { displayDate } from '../../../constants/helpers';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import GridDeleteIcon from '../../../components/Helpers/GridDeleteIcon';
import { truncate } from 'lodash';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import routes from '../../../components/Helpers/Routes';

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
  const [filter, setFilter] = useState([]);
  const [notes, setNotes] = useState([]);
  const [okButtonLoading, setOkButtonLoading] = useState(false);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState({ id: null, name: null });
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState(false);
  const [noteData, setNoteData] = useState(null);
  const [noteId, setNoteId] = useState(undefined);
  const [open, setOpen] = useState(false);

  //  Grid Variables - Start
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;

  // const [showGridFilters, setShowGridFilters] = useState(true)
  const columnState = JSON.parse(localStorage.getItem('notesPage'));

  const columns = [
    { field: 'name', headerName: 'Title', show: true, disabled: true, cellRenderer: 'nameRenderer' },
    { field: 'createdByDate', headerName: 'Created At', filter: false, sortable: false, show: true, cellRenderer: 'createdAtDateRenderer' },
    { field: 'updatedByDate', headerName: 'Updated At', filter: false, sortable: false, show: true, cellRenderer: 'updatedAtDateRenderer' }
  ];
  if (columnState) {
    columns.map((item) => {
      columnState.map((d) => {
        if (d.colId == item.field) {
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
    }
  }, [referenceId]);

  useEffect(() => {
    fetchNotes();
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
    <span className="link cursor-pointer" onClick={() => handleActivityOpen(params.data)}>
      {params.value}
    </span>
  );

  const CreatedAtDateRenderer = (params) => <span style={{ marginLeft: 5, fontSize: 12 }}>{displayDate(params.value)}</span>;

  const UpdatedAtDateRenderer = (params) =>
    params.value ? <span style={{ marginLeft: 5, fontSize: 12 }}>{displayDate(params.value)}</span> : <NoDataCell />;

  const ActionsRenderer = (params) => (
    <>
      <GridDeleteIcon
        hasDeletePermission={permissions.note.isDelete}
        ownerId={params.data.createdBy}
        userId={user?.user?._id}
        onDelete={() => showConfirmBox(params.data)}
        entity="note"
      />
    </>
  );
  const frameworkComponents = {
    nameRenderer: NameRenderer,
    createdAtDateRenderer: CreatedAtDateRenderer,
    updatedAtDateRenderer: UpdatedAtDateRenderer,
    actionsRenderer: ActionsRenderer
  };

  const fetchNotes = async () => {
    // setLoading(true)

    dispatch({ type: 'loading', loading: true });

    if (gridApi) {
      gridApi.setRowData([]);
    }

    await GetNotes(JSON.stringify(filter))
      .then(({ data }) => {
        let rows = data.map((u) => {
          const { createdBy, updatedBy, relatedTo, ...restProperties } = u;

          let res = {
            ...restProperties,
            id: u._id,
            name: u.name,
            createdBy: u.createdBy?.user,
            createdByDate: u.createdBy?.date,
            updatedBy: u.updatedBy?.user?.concatedName,
            updatedByDate: u.updatedBy?.date
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

  const handleDeleteNote = async () => {
    if (deleteRecord.id || selectedRecords.length > 0) {
      setOkButtonLoading(true);

      axiosInstance()
        .put(`/note/deletemany`, { ids: deleteRecord.id ? [deleteRecord.id] : selectedRecords.map((d) => d._id) })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: 'Note Deleted Succesfully'
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
    // history.push({
    //     pathname: '/activity/note',
    //     search: '?activityType=note&activityId=' + id
    // })
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
        <div className="header-panel">
          <Grid container className={styles.filter_side_container}>
            <Grid item xs={6} className="d-flex align-items-center gap-1">
              <GoNote className="headerLogo" /> <span className="listingHeader">{routes.activityNote.title} ({dataRows.length})</span>
            </Grid>
            <Grid item xs={6} className={styles.filter_side}>
              <Box component="div" className={styles.filter_side_header} style={{ width: '100%' }}>
                <SearchFilter handleChangeFilter={handleChangeFilter} filter={filter} chip={{ size: 'small' }} />
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  className={styles.add_submit_btn}
                  onClick={() => {
                    setIsNew(true);
                    setShowCreateDialog(true);
                  }}
                  startIcon={<AddOutlined />}
                >
                  Add
                </Button>
                {/* </Box> */}
                <Button
                  className={styles.action_submit_btn}
                  variant="outlined"
                  color="default"
                  size="small"
                  onClick={openActions}
                  aria-controls="action-menu"
                  disabled={selectedRecords.length > 0 ? false : true}
                >
                  Actions <ExpandMore />
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
                  >
                    Delete
                  </MenuItem>
                </Menu>
              </Box>
            </Grid>
          </Grid>
        </div>

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
        />

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
          fullScreen={isMobile || isTablet}
          TransitionComponent={CustomDialogTransition}
          aria-labelledby="customized-dialog-title"
          maxWidth={'md'}
          onClose={handleDialogClose}
          fullWidth
        >
          <CreateNote
            noteId={isNew ? null : noteData?.id}
            relatedTo={[{ type: 'my', name: user?.user?._id }]}
            handleClose={handleClose}
            handleDialogClose={handleDialogClose}

          // noteData={noteData}
          />
        </Dialog>
      )}
    </Fragment>
  );
};

export default Note;
