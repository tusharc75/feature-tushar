import React, { useState, useEffect } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Layout from "../../../components/Layout";
import Button from '@material-ui/core/Button';
import { SearchFilter } from "../../../components/Activity/Report/SearchFilter";
import { useParams, useHistory } from "react-router-dom";
import queryString from 'query-string';
import { GetReferenceName, GetNotes } from "../../../axios/activity";
import { DataGrid, GridToolbar } from "@material-ui/data-grid";
import moment from "moment";
import ActivityModelHandler from "../../../components/Activity/ActivityModelHandler";

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
            field: 'createdAt',
            headerName: 'Created At',
            width: 200,
            renderCell: (params) =>
                <span>{moment(params.row.createdAt).format("DD/MM/YYYY hh:mm A")}</span>
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
            <Box height={500}>

                <DataGrid
                    components={{
                        Toolbar: GridToolbar,
                    }}
                    loading={loading}
                    rows={notes}
                    disableSelectionOnClick
                    disableMultipleSelection
                    columns={columns}
                    pageSize={10}
                    density="compact"
                />

            </Box>
        </Box>
        {activityType !== undefined && <ActivityModelHandler activityType={activityType} activityId={activityId} />}
    </Layout>
    );
}

export default Note;
