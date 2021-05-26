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
import reactHtmlparser, { convertNodeToElement } from 'react-html-parser'
import { HiOutlineMail } from "react-icons/hi";
import Dialog from '@material-ui/core/Dialog';
import { CreateEmail } from '../../../components/Activity/Email/CreateEmail'
import ToggleButton from "@material-ui/lab/ToggleButton";
import ToggleButtonGroup from "@material-ui/lab/ToggleButtonGroup";
import _ from 'lodash'
import styles from "../../Leads/Header.module.scss";
import emailStyles from './email.module.scss'
import './email.scss'

const tabs = {
    Inbox: 1,
    Sent: 2
}
const Email = () => {

    const toastConfig = useContext(CustomToastContext);
    const history = useHistory();
    const {
        state: { user },
    }: any = useData();
    const parsed = queryString.parse(history.location.search);
    const { referenceType, referenceId } = parsed;

    const [filter, setFilter] = useState([]);
    const [emailsCopy, setEmailsCopy] = useState([]);
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);
    const [deleteRecord, setDeleteRecord] = useState(null)
    const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false)
    const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [checkAllEmails, setCheckAllEmails] = useState(false);
    const [query, setQuery] = useState({ page: 0, limit: 25 });
    const [rowCount, setRowCount] = useState(0);
    const [open, setOpen] = useState(false);
    const [emailId, setEmailId] = useState(null);
    const [currentTab, setCurrentTab] = useState(1)

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
    }, [filter, query]);


    const fetchEmails = async () => {
        setLoading(true)

        await GetEmails(JSON.stringify(filter), { ...query })
            .then(({ data, count }) => {
                data = data.map(obj => {
                    return {
                        ...obj,
                        id: obj._id,
                        isCreatedByMe: obj?.createdBy?.user === user?.user?._id ? true : false,
                        isChecked: false,
                    }
                })
                setEmails(data)
                setEmailsCopy(data)
                setRowCount(count)
                setLoading(false)
            })
            .catch((error) => {
                setLoading(false)
                toastConfig.setToastConfig(error);
            });
    };

    const handleChangeFilter = (value) => {
        if (query.page !== 0) {
            setQuery((prevState) => ({ ...prevState, page: 0 }));
        }
        setFilter(value)
    }

    const getToEmailList = (toList) => {
        return (currentTab === tabs.Sent ? "To: " : "") + (toList.map(email => email === user?.user?.email ? 'me' : email).join(','))
    }

    const transform = (node, index) => {
        if (node.type === 'tag' && ["h2", "h1", "h3", "h4", "h5", "h6", "strong", "em", "u", "ul", "ol", "li", "del"].indexOf(node.name) >= 0) {
            node.name = 'p';
            return convertNodeToElement(node, index, transform);
        }
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
                return <span
                    style={{ cursor: "pointer" }}
                    onClick={(e) => {
                        setOpen(true)
                        setEmailId(params.row.id)
                    }}>
                    {
                        (typeof params.row.to == "string") ?
                            <span> {params.row.to}</span > :
                            <span>
                                {params.row?.isCreatedByMe ? getToEmailList(params.row.to) : params.row?.mailbox ?? ''}
                            </span>
                    }
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
                        className={emailStyles.emailMessage}> {params.row.message ? reactHtmlparser(params.row.message, { transform }) : null}
                    </Typography>
                </div >
            }
        },
        {
            field: 'createdAt', headerName: 'Created At', width: 130,
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
                setDeleteRecord(row);
            }
        } else {
            setIsConformDialogVisible(true);
        }
    };

    const handleDeleteEmails = async () => {
        setDeleteLoading(true);
        let selectedRecords = [];
        if (deleteRecord?.id) {
            selectedRecords.push(deleteRecord?.id);
        } else {
            selectedRecords = emails.filter(currentObject => currentObject.isChecked).map(o => o.id)
        }

        if (selectedRecords && selectedRecords.length > 0) {
            axiosInstance()
                .put('/email', { emails: [...selectedRecords] })
                .then(({ data }) => {
                    toastConfig.setToastConfig({
                        open: true,
                        type: "success",
                        message: "Email deleted succesfully",
                    });
                    setIsConformDialogVisible(false);
                    setDeleteLoading(false);
                    if (deleteRecord) setDeleteRecord({});
                    fetchEmails();
                })
                .catch((error) => {
                    toastConfig.setToastConfig(error);
                    setIsConformDialogVisible(false);
                    setDeleteLoading(false);
                });
        }
    };

    const handlePage = (params) => {
        if (query.page !== params.page) {
            setQuery((prevState) => ({ ...prevState, page: params.page }));
        }
    };

    const handlePageSize = (params) => {
        if (params.pageSize !== query.limit) {
            setQuery({ page: 0, limit: params.pageSize });
        }
    };
    const handleClose = () => {
        setEmailId(null)
        setOpen(false)
    }
    const handleTab = (e, currentTab) => {
        let filteredEmails = [...emailsCopy]
        if (currentTab === tabs.Sent) {
            filteredEmails = emailsCopy.filter(email => email.isCreatedByMe)
        }
        setRowCount(filteredEmails.length)
        setEmails(filteredEmails)
        setCurrentTab(currentTab)
    }

    return (<Layout>
        <Grid container className="headerbox">
            <Grid item xs={12}>
                <CustomBreadCrumbs routes={[{ title: "Email" }]} />
            </Grid>
        </Grid>
        <CustomContainer>
            <div className="header-panel">
                <Grid container className={styles.filter_side_container}>
                    <Grid item xs={3} className="d-flex align-items-center gap-1">
                        <HiOutlineMail className="headerLogo" />{" "}
                        <span className="listingHeader">Email({rowCount}) </span>
                        <ToggleButtonGroup
                            size="small"
                            className="ml-8"
                            value={currentTab}
                            exclusive
                            onChange={handleTab}>
                            {Object.keys(tabs).map((k, index) => (
                                <ToggleButton value={tabs[k]} key={index} className="l-2">
                                    {k} {currentTab === tabs[k] ? `(${rowCount})` : ""}
                                </ToggleButton>
                            ))}
                        </ToggleButtonGroup>
                    </Grid>
                    <Grid item xs={9} className={styles.filter_side}>
                        <Box component="div" className={styles.filter_side_header} style={{ width: '100%' }} >
                            <Box style={{ width: '90%' }}>
                                <SearchFilter
                                    handleChangeFilter={handleChangeFilter}
                                    filter={filter}
                                    chip={{ size: "small" }}
                                />
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
                    density="compact"
                    paginationMode="server"
                    pagination
                    onPageChange={handlePage}
                    onPageSizeChange={handlePageSize}
                    pageSize={query.limit}
                    page={query.page}
                    rowCount={rowCount}
                    rowsPerPageOptions={[25, 50, 75]}
                    // onRowClick={(e) => {
                    //     setOpen(true)
                    //     setEmailId(e.id)
                    // }}
                    disableColumnSelector={false}
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
                    message={`Are you sure, you want to delete ${deleteRecord?.id ? "this email" : "these emails"} ?`}
                    onClose={() => {
                        if (deleteRecord) setDeleteRecord({});
                        setIsConformDialogVisible(false);
                    }}
                    okBtnLoading={deleteLoading}
                    onOk={handleDeleteEmails}
                />
            ) : null}
            {
                open ?
                    <Dialog
                        open={open}
                        aria-labelledby="customized-dialog-title"
                        maxWidth="md"
                        onClose={handleClose}
                        fullWidth
                    >
                        <CreateEmail emailId={emailId} handleClose={handleClose} relatedTo={filter} />
                    </Dialog> : null
            }
        </CustomContainer>
    </Layout >
    );
}

export default Email;
