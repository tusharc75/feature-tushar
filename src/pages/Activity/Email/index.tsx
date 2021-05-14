import React, { useState, useEffect } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Layout from "../../../components/Layout";
import { SearchFilter } from "../../../components/Activity/Report/SearchFilter";
import { useParams, useHistory } from "react-router-dom";
import queryString from 'query-string';
import { GetReferenceName, GetEmails } from "../../../axios/activity";
import { DataGrid, GridToolbar } from "@material-ui/data-grid";
import moment from "moment";
import CustomBreadCrumbs from "../../../components/CustomBreadCrumbs";
import CustomDataGridNoDataFound from "../../../components/Helpers/DataGridHelpers/CustomDataGridNoDataFound";
import axiosAPI from "../../../axios/axios";
import { isEmpty } from "lodash";
import CustomDataGridToolbar from "../../../components/Helpers/DataGridHelpers/CustomDataGridToolbar";
import CustomContainer from "../../../components/CustomContainer";
import './index.scss'

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
        // axiosAPI().get(`/email?relatedTo=${JSON.stringify(filter)}`)
        // .then(({ data }) => {
        //     setEmails(data.data)
        //     setLoading(false)
        // }).catch((err) => {})
        //     }
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
        { field: '_id', headerName: 'id', hide: true },
        {
            field: 'to',
            headerName: 'Recipient',
            width: 200,
            renderCell: (params) => {
                if (typeof params.row.to == "string") return <span>{params.row.to}</span>
                return <span>To: {params.row.to.join(", ")}</span>
            }
        },
        {
            field: 'cc',
            headerName: 'CC',
            width: 800,
            renderCell: (params) => {
                if (isEmpty(params.row.cc)) return <span>---</span>
                if (typeof params.row.cc == "string") return <span>{params.row.cc}</span>
                return <span>{params.row?.subject ?? "(no subject)"}
                    <> - {params.row.to.join(", ")}</>
                    <span style={{ marginLeft: '5px', fontSize: '12px' }}>{moment(params.row.createdBy.date).format("ddd MM/DD")}</span>
                </span>
            }
        },
        // { field: 'mailbox', headerName: 'mailbox', width: 300 },
    ];


    return (<Layout>
        <Grid container direction="row">
            <Grid item xs={12}>
                <CustomBreadCrumbs routes={[{ title: "Email" }]} />
            </Grid>
        </Grid>
        <CustomContainer>
            <Box mt={2} p={2} pt={1} pl={1} bgcolor="white" >
                <Box mb={2}>
                    <Grid container>
                        <Grid item xs={8} className="pl-1">
                            <SearchFilter handleChangeFilter={handleChangeFilter} filter={filter} />
                        </Grid>
                        <Grid xs={4} container justify="flex-end">
                        </Grid>
                    </Grid>
                </Box>
                <div className="listing-grid email-list">
                    <DataGrid
                        components={{
                            Toolbar: CustomDataGridToolbar,
                            NoRowsOverlay: CustomDataGridNoDataFound,
                        }}
                        loading={loading}
                        rows={emails}
                        checkboxSelection
                        columns={columns}
                        pageSize={10}
                        density="compact"
                        getRowId={(row) => row._id}
                    />
                </div>
            </Box>
        </CustomContainer>
    </Layout>
    );
}

export default Email;
