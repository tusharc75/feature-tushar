import React, { useState, useEffect, useContext } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Layout from "../../../components/Layout";
import { SearchFilter } from "../../../components/Activity/Report/SearchFilter";
import { useHistory } from "react-router-dom";
import queryString from 'query-string';
import { GetReferenceName, GetEmails } from "../../../axios/activity";
import { DataGrid } from "@material-ui/data-grid";
import moment from "moment";
import CustomBreadCrumbs from "../../../components/CustomBreadCrumbs";
import CustomDataGridNoDataFound from "../../../components/Helpers/DataGridHelpers/CustomDataGridNoDataFound";
import axiosAPI from "../../../axios/axios";
import { useData } from "../../../StateProvider/Provider";
import CustomDataGridToolbar from "../../../components/Helpers/DataGridHelpers/CustomDataGridToolbar";
import CustomContainer from "../../../components/CustomContainer";
import { Button, MenuItem, Menu, Checkbox, Typography, Tooltip, IconButton } from '@material-ui/core'
import { ExpandMore } from "@material-ui/icons";
import axiosInstance from "../../../axios/axiosInstance";
import ConfirmationDialog from "../../../components/Helpers/ConfirmationDialog";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import MessageDialog from "../../../components/Helpers/MessageDialog";
import { Delete as DeleteIcon } from "@material-ui/icons";
import { BsFillEnvelopeOpenFill } from 'react-icons/bs'
import reactHtmlparser from 'react-html-parser'
import styles from "../../Leads/Header.module.scss";
import emailStyles from './email.module.scss'
import './email.scss'

const Email = () => {

    const toastConfig = useContext(CustomToastContext);
    const history = useHistory();
    const {
        state: { user },
    }: any = useData();
    const parsed = queryString.parse(history.location.search);
    const { referenceType, referenceId } = parsed;

    const [filter, setFilter] = useState([]);
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);
    const [deleteRec, setDeleteRec] = useState(null)
    const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false)
    const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [checkAllEmails, setCheckAllEmails] = useState(false);

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
                data = data.map(obj => {
                    return {
                        ...obj,
                        id: obj._id,
                        isCreatedByMe: obj?.createdBy?.user === user?.user?._id ? true : false,
                        isChecked: false,
                    }
                })
                setEmails(data)
                setLoading(false)
            })
            .catch((err) => {
                setLoading(false)
            });
    };

    const handleChangeFilter = (value) => {
        setFilter(value)
    }

    const getToEmailList = toList => {
        return (toList.map(email => email === user?.user?.email ? 'me' : email).join(','))
    }

    const columns = [
        {
            field: "isChecked",
            headerName: "Checkbox",
            renderHeader: () => (
                <Checkbox
                    color="primary"
                    checked={checkAllEmails}
                    onChange={(ev) => {
                        setCheckAllEmails(ev.target.checked);
                        const gridData = emails;
                        gridData.map((d) => {
                            d.isChecked = ev.target.checked;
                            return d;
                        });
                        setEmails([...gridData]);
                    }}
                />
            ),
            renderCell: (params) => (
                <Checkbox
                    color="primary"
                    checked={params.value}
                    onChange={(ev) => {
                        updateCheckedStatus(params, ev);
                    }}
                />
            ),
            disableColumnMenu: true,
            sortable: false,
            filterable: false,
            width: 75,
        },
        {
            field: 'to',
            headerName: 'Recipient',
            width: 200,
            renderCell: (params) => {
                if (typeof params.row.to == "string") return <span>{params.row.to}</span>
                return <span>
                    {params.row?.isCreatedByMe ? getToEmailList(params.row.to) : params.row?.mailbox ?? ''}
                </span>
            }
        },
        {
            field: 'cc',
            headerName: 'Subject - Message',
            width: 700,
            renderCell: (params) => {
                return <div className={emailStyles.emailMessageConatiner} >
                    <Typography > {params.row?.subject ?? "(no subject) "} - </Typography>
                    <Typography noWrap display="inline"
                        className={emailStyles.emailMessage}> {params.row.message ? reactHtmlparser(params.row.message) : null}
                    </Typography>
                </div >
            }
        },
        {
            field: 'createdAt', headerName: 'Created At', width: 120,
            renderCell: (params) => (
                <span className={emailStyles.emailCreatedAt}>
                    { moment(params.row.createdBy.date).format("ddd MM/DD")}
                </span >)
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

    const updateCheckedStatus = (params, ev) => {
        const gridData = [...emails];
        const indexOfRecord = gridData.findIndex((d) => d.id === params.row.id);
        gridData[indexOfRecord].isChecked = ev.target.checked;

        setEmails([...gridData]);

        const checkedRecords = gridData.filter((d) => d.isChecked === true);

        if (checkedRecords.length === gridData.length) {
            setCheckAllEmails(true);
        } else {
            setCheckAllEmails(false);
        }
    };

    const openActions = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const closeActions = () => {
        setAnchorEl(null);
    };

    const showConfirmBox = (row) => {
        if (row) {
            setIsConformDialogVisible(true);
            if (row && row.id) {
                setDeleteRec(row);
            }
        } else {
            setIsConformDialogVisible(true);
        }
    };

    const handleDeleteEmails = async () => {
        setDeleteLoading(true);
        let recs = [];
        if (deleteRec?.id) {
            recs.push(deleteRec?.id);
        } else {
            emails.forEach((obj) => {
                if (obj.isChecked) recs.push(obj.id);
            });
        }

        if (recs && recs.length > 0) {
            axiosInstance()
                .put('/email', { emails: [...recs] })
                .then(({ data }) => {
                    toastConfig.setToastConfig({
                        open: true,
                        type: "success",
                        message: "email deleted succesfully",
                    });
                    setIsConformDialogVisible(false);
                    setDeleteLoading(false);
                    if (deleteRec) setDeleteRec({});
                    fetchEmails();
                })
                .catch((error) => {
                    toastConfig.setToastConfig(error);
                    setIsConformDialogVisible(false);
                    setDeleteLoading(false);
                });
        }
    };

    return (<Layout>
        <Grid container direction="row">
            <Grid item xs={12}>
                <CustomBreadCrumbs routes={[{ title: "Email" }]} />
            </Grid>
        </Grid>
        <CustomContainer>
            <div className="header-panel">
                <Grid container className={styles.filter_side_container}>
                    <Grid item xs={6} className="d-flex align-items-center gap-1">
                        <BsFillEnvelopeOpenFill className="headerLogo" />{" "}
                        <span className="listingHeader">Emails</span>
                    </Grid>
                    <Grid item xs={6} className={styles.filter_side}>
                        <Box component="div" className={styles.filter_side_header} style={{ width: '100%' }} >
                            <Box style={{ width: '70%' }}>
                                <SearchFilter
                                    handleChangeFilter={handleChangeFilter} filter={filter} />
                            </Box>
                            <Button
                                className={styles.action_submit_btn}
                                variant="outlined"
                                color="default"
                                size="small"
                                onClick={openActions}
                                aria-controls="action-menu"
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
            <div className='listing-grid emailList'>
                <DataGrid
                    components={{
                        Toolbar: CustomDataGridToolbar,
                        NoRowsOverlay: CustomDataGridNoDataFound,
                    }}
                    loading={loading}
                    rows={loading ? [] : emails}
                    columns={columns}
                    pageSize={10}
                    density="compact"
                />
            </div>
            {showDeleteWarningConfirmBox ? (
                <MessageDialog
                    open={showDeleteWarningConfirmBox}
                    message={`You are trying to delete records which you do not have permission to delete, Please remove those records from selection and try again.`}
                    onClose={() => setShowDeleteWarningConfirmBox(false)}
                />
            ) : null}
            {isConfirmDialogVisible ? (
                <ConfirmationDialog
                    open={isConfirmDialogVisible}
                    message={`Are you sure, you want to delete ${deleteRec?.id ? "this email" : "these emails"} ?`}
                    onClose={() => {
                        if (deleteRec) setDeleteRec({});
                        setIsConformDialogVisible(false);
                    }}
                    okBtnLoading={deleteLoading}
                    onOk={handleDeleteEmails}
                />
            ) : null}
        </CustomContainer>
    </Layout >
    );
}

export default Email;
