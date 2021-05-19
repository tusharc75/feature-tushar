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

const Note = () => {

    const history = useHistory();
    const parsed = queryString.parse(history.location.search);
    const { referenceType, referenceId, activityType, activityId } = parsed;

    const [filter, setFilter] = useState([]);
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);

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


    const handleActivityOpen = (id) => {
        history.push({
            pathname: '/activity/note',
            search: '?activityType=note&activityId=' + id
        })
    }


    const columns = [
        { field: 'id', headerName: 'id', hide: true },
        {
            field: 'name', headerName: 'Title',
            width: 300,
            renderCell: (params) =>
                <a onClick={() => handleActivityOpen(params.row.id)}>{params.row.name}</a>
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
        <Grid container direction="row">
            <Grid item xs={12}>
                <CustomBreadCrumbs routes={[{ title: "Note" }]} />
            </Grid>
        </Grid>
        <Box mt={2} p={2} pt={1} pl={1} bgcolor="white" >
            <Box mb={2}>
                <Grid container>
                    <Grid item xs={8}>
                        <SearchFilter handleChangeFilter={handleChangeFilter} filter={filter} />
                    </Grid>
                    <Grid xs={4} container justify="flex-end">
                    </Grid>
                </Grid>
            </Box>
        </Box>

        <CustomContainer>
            <div className="header-panel">
                <Grid container className={styles.filter_side_container}>
                    <Grid item xs={2} className="d-flex align-items-center gap-1">
                        <GoNote className="headerLogo" />{" "}
                        <span className="listingHeader">Note</span>
                    </Grid>
                    <Grid item xs={10} className={styles.filter_side}>
                        <Box component="div" className={styles.filter_side_header} style={{ width: '100%' }} >
                            <Box style={{ width: '90%' }}>
                                <SearchFilter
                                    handleChangeFilter={handleChangeFilter}
                                    filter={filter}
                                    chip={{ size: "small" }}
                                />
                            </Box>
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
            {activityType !== undefined && <ActivityModelHandler activityType={activityType} activityId={activityId} />}
        </CustomContainer>
    </Layout>

    );
}

export default Note;
