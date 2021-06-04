import React, { useState, useEffect, useContext, useReducer } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Layout from "../../../components/Layout";
import { SearchFilter } from "../../../components/Activity/Report/SearchFilter";
import { useHistory } from "react-router-dom";
import queryString from 'query-string';
import { GetReferenceName, GetNotes } from "../../../axios/activity";
import axiosInstance from '../../../axios/axiosInstance';
import moment from "moment";
import ActivityModelHandler from "../../../components/Activity/ActivityModelHandler";
import CustomBreadCrumbs from "../../../components/CustomBreadCrumbs";
import CustomContainer from "../../../components/CustomContainer";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import { GoNote } from "react-icons/go";
import { ExpandMore } from "@material-ui/icons";
import { Button, Dialog, Menu, MenuItem } from "@material-ui/core";
import { AddOutlined } from "@material-ui/icons";
import { CreateNote } from "../../../components/Activity/Note/CreateNote";
import { CustomDialogTransition } from "../../../constants/helpers";
import { isMobile, isTablet } from "react-device-detect";
import { useData } from "../../../StateProvider/Provider";
import styles from "../../Leads/Header.module.scss";
import CustomAgGrid, { reducer, intialState } from "../../../components/AgGridComponents/CustomAgGrid";
import ConfirmationDialog from "../../../components/Helpers/ConfirmationDialog";
import GridDeleteIcon from "../../../components/Helpers/GridDeleteIcon";

const Note = () => {
    const {
        state: { user,permissions },
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
    const [noteId, setNoteId] = useState(undefined)
    const [open, setOpen] = useState(false);

    //  Grid Variables - Start
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;

    // const [showGridFilters, setShowGridFilters] = useState(true)
    const columns = [
        { field: "name", headerName: "Title", show: true, disabled: true, cellRenderer: "nameRenderer" },
        { field: "createdByDate", headerName: "Created At", filter: false, sortable: false, show: true, cellRenderer: "createdAtDateRenderer" },
        { field: "updatedByDate", headerName: "Updated At", filter: false, sortable: false, show: true, cellRenderer: "updatedAtDateRenderer" },
    ];
    //  Grid Variables - End

    useEffect(() => {
        if (referenceType) {
            GetReferenceName(referenceType, referenceId)
                .then(({ data }) => {
                    setFilter([{ "_id": referenceId, "type": referenceType, "name": data.name }])
                })
                .catch((err) => {
                    toastConfig.setToastConfig(err);
                });
        }
    }, [referenceId]);
    


    useEffect(() => {
        fetchNotes()
    }, [filter]);

    const openActions = (event) => {
        setAnchorEl(event.currentTarget);
        console.log(selectedRecords)
    };

    const closeActions = () => {
        setAnchorEl(null);
    };

    const handleClose = () => {
        setShowCreateDialog(false);
        setIsNew(false);
        fetchNotes();
    }

    const handleDialogClose = () => {
        setShowCreateDialog(false);
        setIsNew(false);
    }

    const NameRenderer = params => (
        <span className="link cursor-pointer" onClick={() => handleActivityOpen(params.data)}>
            {params.value}
        </span>
    )

    const CreatedAtDateRenderer = params => (
        <span style={{ marginLeft: 5, fontSize: 12 }}>
            { moment(params.value).format("ddd MM/DD")}
        </span>
    )

    const UpdatedAtDateRenderer = params => (
        <span style={{ marginLeft: 5, fontSize: 12 }}>
            { moment(params.value).format("ddd MM/DD")}
        </span>
    )
    
    const ActionsRenderer = params => <>
    <GridDeleteIcon
      hasDeletePermission={ permissions.note.isDelete}
      ownerId={params.data.createdBy}
      userId={user?.user?._id}
      onDelete={() => showConfirmBox(params.data)}
      entity="note"
    />
  </>
    const frameworkComponents = {
        nameRenderer: NameRenderer,
        createdAtDateRenderer: CreatedAtDateRenderer,
        updatedAtDateRenderer: UpdatedAtDateRenderer,
        actionsRenderer: ActionsRenderer,
    }

    const fetchNotes = async () => {
        // setLoading(true)

        dispatch({ type: "loading", loading: true });

        if (gridApi) {
            gridApi.setRowData([]);
            gridApi.showLoadingOverlay();
        }

        await GetNotes(JSON.stringify(filter))
            .then(({ data }) => {

                let rows = data.map((u) => {
                    const { createdBy, updatedBy, relatedTo, ...restProperties } = u;

                    let res = {
                        ...restProperties,
                        id: u._id,

                        createdBy: u.createdBy?.user,
                        createdByDate: u.createdBy?.date,
                        updatedBy: u.updatedBy?.user?.concatedName,
                        updatedByDate: u.updatedBy?.date,
                    };
                    return res;
                });

                dispatch({ type: "initialize", data: rows, count: data.length });
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
                dispatch({ type: "loading", loading: false });
            });
    };

    const handleDeleteNote = async () => {
        if (deleteRecord.id || selectedRecords.length > 0) {
          setOkButtonLoading(true);
    
          axiosInstance()
            .put(`/note/deletemany`,
              { ids: deleteRecord.id ? [deleteRecord.id] : selectedRecords.map(d => d._id) })
            .then(({ data }) => {
              toastConfig.setToastConfig({
                open: true,
                type: "success",
                message: data.message,
              });
              setIsConformDialogVisible(false);
              setOkButtonLoading(false);
              if (deleteRecord.id) { setDeleteRecord({ id: null, name: null }); }
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
        setFilter(value)
    }


    const handleActivityOpen = (data) => {
        // history.push({
        //     pathname: '/activity/note',
        //     search: '?activityType=note&activityId=' + id
        // })
        setShowCreateDialog(true);
        setNoteData(data);

    }

    const showConfirmBox = (row) => {
        if (row) {
          setIsConformDialogVisible(true);
          if (row) {
            setDeleteRecord({ id: row.id, name: row.concatedName });
            console.log(deleteRecord)
          }
        } else {
          if (
            selectedRecords.find((d) => d.ownerId !== user.user._id)
          ) {
            setShowDeleteWarningConfirmBox(true);
          } else {
            setIsConformDialogVisible(true);
          }
        }
      };


    // const columns = [
    //     { field: 'id', headerName: 'id', hide: true },
    //     {
    //         field: 'name', headerName: 'Title',
    //         width: 300,
    //         renderCell: (params) =>
    //             <a onClick={() => handleActivityOpen(params.row.id)}>{params.row.name}</a>
    //     },
    //     {
    //         field: 'createdBy',
    //         headerName: 'Created At',
    //         width: 200,
    //         renderCell: (params) =>
    //             <span>{moment(params.row.createdBy.date).format("DD/MM/YYYY hh:mm A")}</span>
    //     },
    //     {
    //         field: 'updatedAt',
    //         headerName: 'Updated At',
    //         width: 200,
    //         renderCell: (params) =>
    //             <span>{moment(params.row.updatedAt).format("DD/MM/YYYY hh:mm A")}</span>
    //     },
    // ];


    return (<Layout>
        <Grid container className="headerbox">
            <Grid item xs={12}>
                <CustomBreadCrumbs routes={[{ title: "Note" }]} />
            </Grid>
        </Grid>

        <CustomContainer>
            <div className="header-panel">
                <Grid container className={styles.filter_side_container}>
                    <Grid item xs={2} className="d-flex align-items-center gap-1">
                        <GoNote className="headerLogo" />{" "}
                        <span className="listingHeader">Note ({dataRows.length})</span>
                    </Grid>
                    <Grid item xs={10} className={styles.filter_side}>
                        <Box component="div" className={styles.filter_side_header} style={{ width: '100%' }} >
                            <SearchFilter
                                handleChangeFilter={handleChangeFilter}
                                filter={filter}
                                chip={{ size: "small" }}
                            />
                            <Button

                                variant="contained"
                                color="primary"
                                size="small"
                                className={styles.add_submit_btn}
                                onClick={() => {
                                    setIsNew(true)
                                    setShowCreateDialog(true)
                                }}
                                startIcon={<AddOutlined />}>
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
                                    vertical: "bottom",
                                    horizontal: "left",
                                }}
                                id="action-menu"
                                open={Boolean(anchorEl)}
                                onClose={closeActions}>
                                <MenuItem
                                    onClick={() => {
                                        showConfirmBox(null);
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

            <CustomAgGrid columns={columns} dataRows={dataRows} frameworkComponents={frameworkComponents} setGridApi={setGridApi}
                dispatch={dispatch} rowCount={rowCount} limit={limit} pageSizes={pageSizes} page={page} allowAction={false} allowSelection={false} 
                isClientSideGrid={true} />

            {noteId !== undefined && <ActivityModelHandler
                activityType="note"
                activityId={noteId}
                onClose={() => setNoteId(undefined)}
            />}
        </CustomContainer>
        {
          isConfirmDialogVisible ? (
            <ConfirmationDialog
              open={isConfirmDialogVisible}
              message={`Are you sure, you want to delete Note ${deleteRecord.name || ""
                }?`}
              onClose={() => {
                if (deleteRecord.id) setDeleteRecord({ id: null, name: null });
                setIsConformDialogVisible(false);
              }}
              okBtnLoading={okButtonLoading}
              onOk={handleDeleteNote}
            />
          ) : null
        }
        {
            showCreateDialog &&
            <Dialog
                open={showCreateDialog}
                fullScreen={isMobile || isTablet}
                TransitionComponent={CustomDialogTransition}
                aria-labelledby="customized-dialog-title"
                maxWidth={"md"}
                onClose={handleDialogClose}
                fullWidth
            >
                <CreateNote
                    noteId={isNew ? null : noteData?.id}
                    relatedTo={[{ type: "my", name: user?.user?._id }]}
                    handleClose={handleClose}
                    handleDialogClose={handleDialogClose}


                // noteData={noteData}
                />


            </Dialog>
        }
    </Layout>

    );
}

export default Note;
