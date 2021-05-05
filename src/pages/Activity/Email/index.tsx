import React, { useState, useEffect } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Layout from "../../../components/Layout";
import Button from '@material-ui/core/Button';
import { SearchFilter } from "../../../components/Activity/Report/SearchFilter";
import { useParams, useHistory } from "react-router-dom";
import queryString from 'query-string';
import { GetReferenceName, GetEmails } from "../../../axios/activity";
import { DataGrid, GridToolbar } from "@material-ui/data-grid";
import moment from "moment";
import CustomBreadCrumbs from "../../../components/CustomBreadCrumbs";
import DataGridCustomToolbar from "../../../components/Helpers/DataGridCustomToolbar";
import CustomDataGridNoDataFound from "../../../components/Helpers/CustomDataGridNoDataFound";

const Email = () => {

    const history = useHistory();
    const parsed = queryString.parse(history.location.search);
    const { referenceType, referenceId } = parsed;

    const [filter, setFilter] = useState([]);
    const [emails, setEmails] = useState([]);
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
        fetchEmails()
    }, [filter]);


    const fetchEmails = async () => {
        setLoading(true)
        await GetEmails(JSON.stringify(filter))
            .then(({ data }) => {
                setEmails(data)
                setLoading(false)
            })
            .catch((err) => {
            });
    };

    const handleChangeFilter = (value) => {
        setFilter(value)
    }

    const columns = [
        { field: 'id', headerName: 'id', hide: true },
        { field: 'name', headerName: 'Subject', width: 300 },
        {
            field: 'createdBy',
            headerName: 'Send At',
            width: 200,
            renderCell: (params) =>
                <span>{moment(params.row.createdBy.date).format("DD/MM/YYYY hh:mm A")}</span>,
        },
    ];


    return (<Layout>
        <Grid container direction="row">
            <Grid item xs={12}>
                <CustomBreadCrumbs routes={[{ title: "Email" }]} />
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
            <div className="listing-grid">
                <DataGrid
                    components={{
                        Toolbar: DataGridCustomToolbar,
                        NoRowsOverlay: CustomDataGridNoDataFound,
                    }}
                    loading={loading}
                    rows={emails}
                    disableSelectionOnClick
                    disableMultipleSelection
                    columns={columns}
                    pageSize={10}
                    density="compact"
                />
            </div>
        </Box>
    </Layout>
    );
}

export default Email;
