import React, { useState, useEffect } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Layout from "../../../components/Layout";
import { SearchFilter } from "../../../components/Activity/Report/SearchFilter";
import { useHistory } from "react-router-dom";
import queryString from 'query-string';
import { GetReferenceName, GetNotes } from "../../../axios/activity";
import { DataGrid } from "@material-ui/data-grid";
import moment from "moment";
import ActivityModelHandler from "../../../components/Activity/ActivityModelHandler";
import CustomBreadCrumbs from "../../../components/CustomBreadCrumbs";
import CustomDataGridToolbar from "../../../components/Helpers/DataGridHelpers/CustomDataGridToolbar";
import CustomDataGridNoDataFound from "../../../components/Helpers/DataGridHelpers/CustomDataGridNoDataFound";
import CustomContainer from "../../../components/CustomContainer";
import styles from "../../Leads/Header.module.scss";
import { GoNote } from "react-icons/go";
import { Button, Dialog } from "@material-ui/core";
import { AddOutlined } from "@material-ui/icons";
import { CreateNote } from "../../../components/Activity/Note/CreateNote";
import { CustomDialogTransition } from "../../../constants/helpers";
import { isMobile, isTablet } from "react-device-detect";
import { useData } from "../../../StateProvider/Provider";

const Note = () => {

    const {
        state: { user },
    }: any = useData();

    const history = useHistory();
    const parsed = queryString.parse(history.location.search);
    const { referenceType, referenceId, activityType, activityId } = parsed;
    const [showCreateDialog, setShowCreateDialog] = useState(false);

    const [filter, setFilter] = useState([]);
    const [notes, setNotes] = useState([]);
    const [noteData, setNoteData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [noteId, setNoteId] = useState(undefined)

    useEffect(() => {
        if (referenceType) {
            GetReferenceName(referenceType, referenceId)
                .then(({ data }) => {
                    setFilter([{ "_id": referenceId, "type": referenceType, "name": data.name }])
                })
                .catch((err) => {
                });
        }
    }, [referenceId]);


    useEffect(() => {
        fetchNotes()
    }, [filter]);

    const handleClose = () => {
        setShowCreateDialog(false)
        fetchNotes()
    }


    const fetchNotes = async () => {
        setLoading(true)
        await GetNotes(JSON.stringify(filter))
            .then(({ data }) => {
                setNotes(data)
                setLoading(false)
            })
            .catch((err) => {
            });
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


    const columns = [
        { field: 'id', headerName: 'id', hide: true },
        {
            field: 'name', headerName: 'Title',
            width: 300,
            renderCell: (params) =>
                <a onClick={() => handleActivityOpen(params.row)}>{params.row.name}</a>
        },
        {
            field: 'createdBy',
            headerName: 'Created At',
            width: 200,
            renderCell: (params) =>
                <span>{moment(params.row.createdBy.date).format("DD/MM/YYYY hh:mm A")}</span>
        },
        {
            field: 'updatedAt',
            headerName: 'Updated At',
            width: 200,
            renderCell: (params) =>
                <span>{moment(params.row.updatedAt).format("DD/MM/YYYY hh:mm A")}</span>
        },
    ];


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
                        <span className="listingHeader">Note ({notes.length})</span>
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
                                onClick={() => setShowCreateDialog(true)}
                                startIcon={<AddOutlined />}>
                                Add
                                </Button>
                        </Box>
                    </Grid>
                </Grid>
            </div>

            <div className="listing-grid">
                <DataGrid
                    components={{
                        Toolbar: CustomDataGridToolbar,
                        NoRowsOverlay: CustomDataGridNoDataFound,
                    }}
                    loading={loading}
                    rows={notes}
                    disableSelectionOnClick
                    disableMultipleSelection
                    columns={columns}
                    pageSize={10}
                    density="compact"
                />
            </div>
            {noteId !== undefined && <ActivityModelHandler
                activityType="note"
                activityId={noteId}
                onClose={() => setNoteId(undefined)}
            />}
        </CustomContainer>
        {
            showCreateDialog &&
            <Dialog
                open={showCreateDialog}
                fullScreen={isMobile || isTablet}
                TransitionComponent={CustomDialogTransition}
                aria-labelledby="customized-dialog-title"
                maxWidth={"md"}
                onClose={handleClose}
                fullWidth
            >
                <CreateNote
                    noteId={noteData?.id}
                    relatedTo={[{ type: "my", name: user?.user?._id }]}
                    handleClose={handleClose}
                // noteData={noteData}
                />


            </Dialog>
        }
    </Layout>

    );
}

export default Note;
