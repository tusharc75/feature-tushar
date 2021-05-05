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
import axiosAPI from "../../../axios/axios";
import { isEmpty } from "lodash";

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
        axiosAPI().get(`/email?relatedTo=${JSON.stringify(filter)}`)
        .then(({ data }) => {
            setEmails(data.emails)
            setLoading(false)
        }).catch((err) => {})
            //     }
        // await GetEmails(JSON.stringify(filter))
        //     .then(({ data }) => {
        //         setEmails(data)
        //         setLoading(false)
        //     })
        //     .catch((err) => {
        //     });
    };

    const handleChangeFilter = (value) => {
        setFilter(value)
    }

    const columns = [
        { field: '_id', headerName: 'id', hide: true },
        { field: 'subject', headerName: 'Subject', width: 300 },
        {
            field: 'to',
            headerName: 'Recipient',
            width: 200,
            renderCell: (params) =>{
            if(typeof params.row.to == "string") return <span>{params.row.to}</span> 
            return <span>{params.row.to.join(", ")}</span> 
        }},
        {
            field: 'cc',
            headerName: 'CC',
            width: 200,
            renderCell: (params) =>{
            if(isEmpty(params.row.cc)) return <span>---</span>
            if(typeof params.row.cc == "string") return <span>{params.row.cc}</span> 
            return <span>{params.row.cc.join(", ")}</span> 
        }},
        {
            field: 'createdBy',
            headerName: 'Send At',
            width: 200,
            renderCell: (params) =>{
            return <span>{moment(params.row.createdBy.date).format("DD/MM/YYYY hh:mm A")}</span>
        }},
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
                    getRowId={(row) => row._id}
                />
            </div>
        </Box>
    </Layout>
    );
}

export default Email;
