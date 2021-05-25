import React, { useState, useEffect, useContext } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Layout from "../../../components/Layout";
import { SearchFilter } from "../../../components/Activity/Report/SearchFilter";
import { useHistory } from "react-router-dom";
import queryString from 'query-string';
import { GetReferenceName } from "../../../axios/activity";
import { DataGrid, GridToolbar } from "@material-ui/data-grid";
import moment from "moment";
import CustomBreadCrumbs from "../../../components/CustomBreadCrumbs";
import CustomDataGridToolbar from "../../../components/Helpers/DataGridHelpers/CustomDataGridToolbar";
import CustomDataGridNoDataFound from "../../../components/Helpers/DataGridHelpers/CustomDataGridNoDataFound";
import axiosInstance from "../../../axios/axiosInstance";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import Dialog from '@material-ui/core/Dialog';
import ManageAttachment from "../../../components/Activity/Attachments/ManageAttachment";
import CustomContainer from '../../../components/CustomContainer'
import ConfirmationDialog from "../../../components/Helpers/ConfirmationDialog";
import styles from "../../Leads/Header.module.scss";
import { AiOutlinePaperClip } from 'react-icons/ai'
import { AddOutlined } from "@material-ui/icons";
import { Button, Tooltip, IconButton } from '@material-ui/core'
import { useData } from "../../../StateProvider/Provider";
import { Delete as DeleteIcon } from "@material-ui/icons";

export default function Attachment(props) {

    const history = useHistory();
    const parsed = queryString.parse(history.location.search);
    const { referenceType, referenceId, activityType, activityId } = parsed;

    const [filter, setFilter] = useState([]);
    const [attachments, setAttachments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false)
    const [attachmentData, setAttachmentData] = useState(null)
    const [deleteRecord, setDeleteRecord] = useState(null)
    const [isConfirmDialogVisible, setIsConfirmDialogVisible] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false);
    const toastConfig = useContext(CustomToastContext);
    const {
        state: { user },
    }: any = useData();

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
        fetchAttachments()
    }, [filter]);


    const fetchAttachments = async () => {
        setLoading(true)
        let api = `/attachment?relatedTo=${JSON.stringify(filter)}`
        axiosInstance().get(api)
            .then(({ data: { data } }) => {
                setAttachments(data)
                setLoading(false)
            })
            .catch((error) => {
                setLoading(false)
                toastConfig.setToastConfig(error);
            });
    };

    const handleChangeFilter = (value) => {
        setFilter(value)
    }

    const handleActivityOpen = (data) => {
        setOpen(true)
        setAttachmentData(data)
    }
    const handleClose = () => {
        setOpen(false)
        setAttachmentData(null)
        fetchAttachments()
    }
    const showConfirmBox = (row) => {
        if (row) {
            setIsConfirmDialogVisible(true);
            if (row && row.id) {
                setDeleteRecord(row);
            }
        }
    };

    const handleDeleteEmails = async () => {
        setDeleteLoading(true);
        if (deleteRecord?.id)
            axiosInstance()
                .delete(`/attachment/${deleteRecord?.id}`)
                .then(({ data }) => {
                    toastConfig.setToastConfig({
                        open: true,
                        type: "success",
                        message: data.message,
                    });
                    setIsConfirmDialogVisible(false);
                    setDeleteLoading(false);
                    if (deleteRecord) setDeleteRecord(null);
                    fetchAttachments();
                })
                .catch((error) => {
                    toastConfig.setToastConfig(error);
                    setIsConfirmDialogVisible(false);
                    setDeleteLoading(false);
                });
    };

    const columns = [
        {
            field: 'name', headerName: 'Name',
            width: 300,
            renderCell: (params) =>
                <a className="link cursor-pointer"
                    onClick={() => handleActivityOpen(params.row)}>{params.row.name}</a>
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
        {
            field: "actions",
            headerName: "Actions ",
            disableColumnMenu: true,
            sortable: false,
            filterable: false,
            renderCell: (params: any) => (
                <Tooltip title="Delete">
                    <IconButton
                        aria-label="Delete"
                        onClick={() => showConfirmBox(params.row)}>
                        <DeleteIcon fontSize="small" color="error" />
                    </IconButton>
                </Tooltip>
            ),
            width: 100,
        },
    ];


    return <Layout>
        <Grid container>
            <Grid item md={12} sm={12} xs={12}>
                <CustomBreadCrumbs routes={[{ title: "Attachment" }]} />
            </Grid>
        </Grid>
        <CustomContainer>
            <div className="header-panel">
                <Grid container className={styles.filter_side_container}>
                    <Grid item xs={2} className="d-flex align-items-center gap-1">
                        <AiOutlinePaperClip className="headerLogo" />{" "}
                        <span className="listingHeader">Attachment ({attachments.length})</span>
                    </Grid>
                    <Grid item xs={10} className={styles.filter_side}>
                        <Box component="div" className={styles.filter_side_header} style={{ width: "100%" }} >
                            <SearchFilter handleChangeFilter={handleChangeFilter}
                                filter={filter}
                                chip={{ size: "small" }}
                            />
                            <Button

                                variant="contained"
                                color="primary"
                                size="small"
                                className={`${styles.add_submit_btn} ml-10`}
                                onClick={() => setOpen(true)}
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
                    rows={attachments}
                    disableSelectionOnClick
                    disableMultipleSelection
                    columns={columns}
                    pageSize={10}
                    density="compact"
                />
            </div>
            {open ?
                < Dialog
                    open={open}
                    aria-labelledby="customized-dialog-title"
                    maxWidth={"md"}
                    onClose={handleClose}
                    fullWidth
                >
                    <ManageAttachment
                        attachmentId={attachmentData?.id}
                        relatedTo={[{ type: "my", name: user?.user?._id }]}
                        handleClose={handleClose}
                        attachmentData={attachmentData}
                    />
                </Dialog>
                : null
            }
            {isConfirmDialogVisible ? (
                <ConfirmationDialog
                    open={isConfirmDialogVisible}
                    message={`Are you sure, you want to delete ${deleteRecord?.id ? "this attachment ?" : ""}`}
                    onClose={() => {
                        if (deleteRecord) setDeleteRecord(null);
                        setIsConfirmDialogVisible(false);
                    }}
                    okBtnLoading={deleteLoading}
                    onOk={handleDeleteEmails}
                />
            ) : null}
        </CustomContainer>

    </Layout>
}
