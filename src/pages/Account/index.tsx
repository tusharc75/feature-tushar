import React, { useCallback, useContext, useEffect, useState } from 'react';
import Layout from "../../components/Layout";
import { useData } from '../../StateProvider/Provider';
import {
    Box,
    Button,
    Checkbox,
    Menu,
    MenuItem,
    Tooltip,
    IconButton,
    Grid,
    Divider,
    Chip
} from "@material-ui/core";
import { DataGrid } from "@material-ui/data-grid";
import { Link } from 'react-router-dom'
import { useHistory } from "react-router-dom";
import { ExpandMore, AddOutlined } from "@material-ui/icons";
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog'
import MessageDialog from '../../components/Helpers/MessageDialog'
import SearchBox from '../../components/Helpers/SearchBox'
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import ManageAccountDialog from './ManageAccount/index'
import routes from './../../components/Helpers/Routes';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import { makeStyles } from "@material-ui/core/styles";
import axiosInstance from '../../axios/axiosInstance'
import CustomContainer from "./../../components/Container";
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import CancelIcon from '@material-ui/icons/Cancel';
import accountClass from "./account.module.scss"
import DataGridCustomToolbar from "../../components/Helpers/DataGridCustomToolbar";
import CustomHeader from '../../components/Helpers/CustomHeader'
import CustomRenderCell from '../../components/Helpers/CustomRenderCell'
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { FcApproval } from 'react-icons/fc';
import { MdAccountCircle } from 'react-icons/md';
import { getSearchQuery } from '../../services/util';
const AccTypes = [
    {
        key: "All Accounts",
        value: 1
    },
    {
        key: "My Accounts",
        value: 2
    }
]
const useStyles = makeStyles((theme) => ({
    root: {
        width: "100%",
        border: "none",
        borderRadius: 8,
        padding: theme.spacing(3, 2),
    },
    linksContainer: {
        display: "flex",
    },
    links: {
        color: theme.palette.primary.main   //  textDark
    },
    linkDivider: {
        backgroundColor: theme.palette.primary.main,  //  darkBg
        margin: "0 1rem",
    },
    delBtn: {
        color: 'red'
    }
}));

let accountTimeout
export default function Account(props) {
    const toastConfig = useContext(CustomToastContext);
    const classes = useStyles();
    const { accountApi, accountResource, accountPermission, accountBreadcrumb, accountRoute } = props;
    const { state: { user } }: any = useData();
    const [accountData, setAccountData] = useState([]);
    const [cloneId, setCloneId] = useState('')
    const [loading, setLoading] = useState(false);
    const [dataRows, setDataRows] = useState([]);
    const [rowCount, setRowCount] = useState(0);
    const [checkAllAccounts, setCheckAllAccounts] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [renderCount, setRenderCount] = useState(0);
    const [selectedRecs, setSelectedRecs] = useState([])
    const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false)
    const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState(false)
    const [isAccDialogVisible, setIsAccDialogVisible] = useState(false)
    const [query, setQuery] = useState({ page: 0, limit: 25 });
    const [searchVal, setSearchVal] = useState("");
    const [selectedType, setselectedType] = useState(1)

    const [singleAccountDelete, setSingleAccountDelete] = useState({ id: null, show: false, accountName: "" })
    const [singleApproveDisapproveAccount, setSingleApproveDisapproveAccount] = useState<any>({ show: false, approved: false, id: null, accountName: "" })
    const [multipleApproveDisapproveAccount, setMultipleApproveDisapproveAccount] = useState<any>({ show: false, approved: false, selectedRecords: 0 })

    const [accountPermissions, setAccountPermissions] = useState({ isCreate: false, isRead: false, isUpdate: false, isDelete: false, approveAccount: false });

    useEffect(() => {
        const data = user?.role?.sideBar;

        if (data) {
            const hasAccountPermission = data.find((d: any) => d.name === accountPermission);
            if (hasAccountPermission) {
                setAccountPermissions({
                    isCreate: hasAccountPermission.isCreate,
                    isUpdate: hasAccountPermission.isUpdate,
                    isRead: hasAccountPermission.isRead,
                    isDelete: hasAccountPermission.isDelete,
                    approveAccount: user.user?.permissions?.approveAccount
                });
            }
        }
    }, [user]);

    useEffect(() => {
        let millisec = Object.keys(searchVal).length > 0 ? 600 : 5;

        if (accountTimeout) {
            clearTimeout(accountTimeout);
        }

        accountTimeout = setTimeout(() => {
            fetchAccounts();
        }, millisec);

    }, [searchVal]);

    useEffect(() => {
        if (renderCount > 0) {
            fetchAccounts();
        } else setRenderCount((preCount) => preCount + 1);
    }, [query, selectedType]);

    useEffect(() => {
        let rows = accountData?.map((u) => ({
            ...u,
            isChecked: false,
            id: u._id,
            canDelete: u?.owner?.optionValue === user?.user._id,
            collaborator: u.collaborator || [],
            masterAccount: u.parentHierarchy.length > 0 ? u.parentHierarchy[0].accountName : "",
            approved: u.static?.approved ? u.static?.approved : false
        }));
        setDataRows([...rows]);
    }, [accountData])

    const cloneAccount = async (accountId) => {
        setCloneId(accountId)
        setIsAccDialogVisible(true)
    }

    const columns = [
        {
            field: "isChecked",
            headerName: "Checkbox",
            renderHeader: () => (
                <Checkbox
                    color="primary"
                    checked={checkAllAccounts}
                    onChange={(ev) => {
                        setCheckAllAccounts(ev.target.checked);
                        const gridData = dataRows;
                        gridData.map((d) => {
                            // if (d.canDelete) {
                            d.isChecked = ev.target.checked;
                            // }
                            return d;
                        });
                        setDataRows([...gridData]);
                    }}
                />
            ),
            renderCell: (params) => (
                <Checkbox
                    color="primary"
                    // disabled={!params.canDelete}
                    checked={params.value}
                    onChange={(ev) => {
                        const gridData = dataRows;
                        const indexOfRecord = gridData.findIndex(
                            (d) => d.id === params.row.id
                        );
                        gridData[indexOfRecord].isChecked = ev.target.checked;

                        setDataRows([...gridData]);

                        const checkedRecords = gridData.filter((d) => d.isChecked === true);

                        if (checkedRecords.length === gridData.length) {
                            setCheckAllAccounts(true);
                        } else {
                            setCheckAllAccounts(false);
                        }
                    }}
                />
                //  : <Tooltip className="cursor-stop" title="You must be the owner or collaborator of this account to get the selection functionality">
                //     <IconButton>
                //         <BlockIcon fontSize="small" color="error" />
                //     </IconButton>
                // </Tooltip >
            ),
            disableColumnMenu: true,
            sortable: false,
            filterable: false,
            width: 75
        },
        {
            field: "accountName", headerName: "Account Name", width: 300,
            renderCell: (params) => (
                <Link className={`${accountClass.account_name_link}`}
                    to={`/${accountRoute}/detail/${params.row._id}`}>
                    <CustomRenderCell value={params?.value} />
                </Link>
            )
        },
        {
            field: "typeOfAccount",
            headerName: "Type",
            width: 250,
            renderCell: (params) => <CustomRenderCell value={params?.value} />
        },
        {
            field: "industry",
            headerName: "Industry",
            width: 250,
            renderCell: (params) => <CustomRenderCell value={params?.value} />
        },
        {
            field: "parentAccount",
            headerName: "Parent Account",
            width: 250,
            renderCell: (params) => <CustomRenderCell value={params?.value?.optionLabel} />
        },
        {
            field: "masterAccount",
            headerName: "Master Account",
            width: 250,
            disableColumnMenu: true,
            sortable: false,
            filterable: false,
            renderCell: (params) => <CustomRenderCell value={params?.value?.optionLabel} />
        },
        {
            field: "phone", headerName: "Phone",
            hide: true,
            width: 300,
            renderCell: (params) => <CustomRenderCell value={params?.value} />
        },
        {
            field: "actions", headerName: "Actions",
            renderCell: (params) => (
                <>
                    {
                        accountPermissions.isCreate ? <Tooltip title="Clone">
                            <IconButton aria-label="Clone" onClick={() => { cloneAccount(params.row._id) }}>
                                <FileCopyIcon fontSize="small" color="primary" />
                            </IconButton>
                        </Tooltip> :
                            <Tooltip className="cursor-stop" title="You do not have permission to clone/create an account">
                                <IconButton aria-label="Clone">
                                    <FileCopyIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                    }

                    {
                        accountPermissions.isUpdate && accountPermissions.approveAccount ?
                            params.row.approved ?
                                <Tooltip title="Disapprove">
                                    <IconButton aria-label="Disapprove" onClick={() => {
                                        setSingleApproveDisapproveAccount({ show: true, approved: false, id: params.row._id, accountName: params.row.accountName })
                                    }}>
                                        <CancelIcon fontSize="inherit" color="error" />
                                    </IconButton>
                                </Tooltip> :
                                <Tooltip title="Approve">
                                    <IconButton aria-label="Approve" onClick={() => {
                                        setSingleApproveDisapproveAccount({ show: true, approved: true, id: params.row._id, accountName: params.row.accountName })
                                    }}>
                                        <FcApproval />
                                    </IconButton>
                                </Tooltip> : ""
                    }

                    {
                        accountPermissions.isDelete ?
                            params.row.canDelete ?
                                <Tooltip title="Delete">
                                    <IconButton aria-label="Delete" onClick={() => {
                                        setSingleAccountDelete({ show: true, id: params.row._id, accountName: params.row.accountName })
                                    }}>
                                        <DeleteIcon fontSize="small" color="error" />
                                    </IconButton>
                                </Tooltip> :
                                <Tooltip className="cursor-stop" title="You must be the owner of this account to get the delete functionality">
                                    <IconButton aria-label="Delete">
                                        <DeleteIcon fontSize="small" color="disabled" />
                                    </IconButton>
                                </Tooltip> :
                            <Tooltip className="cursor-stop" title="You do not have permission to delete account">
                                <IconButton aria-label="Delete">
                                    <DeleteIcon fontSize="small" color="disabled" />
                                </IconButton>
                            </Tooltip>
                    }
                </>
            ),
            disableColumnMenu: true,
            sortable: false,
            filterable: false,
            width: 200
        },
    ];

    const handleSearch = (e) => {
        if (query.page !== 1) {
            setQuery((prevState) => ({ ...prevState, page: 0 }));
        }
        setSearchVal(e.target.value);
    };

    const fetchAccounts = useCallback(() => {

        setLoading(true);
        let searchParams: any = { ...query, filterAccounts: selectedType }
        searchParams = searchVal
            ? { ...searchParams, search: searchVal }
            : { ...searchParams };
        // try {
        //     let tdata = await GetAccounts(searchParams)
        //     setRowCount(tdata.count)
        //     setAccountData(tdata.data)
        //     setLoading(false);
        // }
        // catch (err) {
        //     setLoading(false);
        // }
        let api = getSearchQuery(`/${accountApi}`, searchParams);
        setLoading(true);
        axiosInstance()
            .get(api)
            .then(({ data: { data, count } }) => {
                setAccountData(data);
                // getRows(data);
                setRowCount(count);
                setLoading(false);
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
                setLoading(false);
            });
    }, [searchVal, query]);


    // ****** ACTIONS BUTTON STUFF *********
    const openActions = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const closeActions = () => {
        setAnchorEl(null);
    };

    const clickCreateNew = () => {
        setIsAccDialogVisible(true)
    }

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

    const handleSortModelChange = (params) => {
        if (params?.sortModel && params.sortModel.length > 0) {
            let temp = { ...params.sortModel[0] };
            setQuery((prevState) => ({
                ...prevState,
                page: 0,
                sortBy: temp.field,
                orderBy: temp.sort,
            }));
        }
    }

    const handleDeleteAccounts = async () => {
        let selectedRecs = dataRows.filter(obj => obj.isChecked).map(cr => cr._id)
        if (selectedRecs && selectedRecs.length > 0) {
            axiosInstance().put(`/${accountApi}/remove`, {
                ids: [...selectedRecs]
            }).then(({ data }) => {
                toastConfig.setToastConfig({ open: true, type: "success", message: data.message });
                setShowDeleteConfirmBox(false)
                fetchAccounts();
            }).catch((error) => {
                toastConfig.setToastConfig(error);
            })
        }
    }

    const handleSingleDeleteAccounts = async () => {

        axiosInstance().put(`/${accountApi}/remove`, { ids: [singleAccountDelete.id] })
            .then(({ data }) => {
                toastConfig.setToastConfig({ open: true, type: "success", message: data.message });
                fetchAccounts();
            }).catch((error) => {
                toastConfig.setToastConfig(error);
            });

        setSingleAccountDelete({ id: null, show: false, accountName: "" });
    }

    const handleSingleApproveDisapproveAccount = () => {
        axiosInstance().post(`/${accountApi}/approve`, { ids: [singleApproveDisapproveAccount.id], approved: singleApproveDisapproveAccount.approved })
            .then(({ data }) => {
                toastConfig.setToastConfig({ open: true, type: "success", message: data.message });
                setSingleApproveDisapproveAccount({ show: false, approved: false, id: null, accountName: "" })
                fetchAccounts();
            }).catch((error) => {
                toastConfig.setToastConfig(error);
                setSingleApproveDisapproveAccount({ show: false, approved: false, id: null, accountName: "" })
            });
        setCheckAllAccounts(false)
    }

    const handleDialogClose = (params) => {
        if (params && params.fetch) {
            fetchAccounts()
        }
        setIsAccDialogVisible(false)
        if (cloneId) {
            setCloneId('')
        }
    }

    const handleAccountSel = (filterValues) => {
        setselectedType(filterValues)
        setCheckAllAccounts(false)
    }

    const approveDisapproveAccounts = () => {
        const selectedAccountIds = dataRows.filter(d => d.approved == !multipleApproveDisapproveAccount.approved).map(m => m._id);

        axiosInstance().post(`/${accountApi}/approve`, { ids: selectedAccountIds, approved: multipleApproveDisapproveAccount.approved })
            .then(({ data }) => {
                toastConfig.setToastConfig({ open: true, type: "success", message: data.message });
                setMultipleApproveDisapproveAccount({ show: false, approved: false, selectedRecords: 0 })
                fetchAccounts();
            }).catch((error) => {
                toastConfig.setToastConfig(error);
                setMultipleApproveDisapproveAccount({ show: false, approved: false, selectedRecords: 0 })
            });
        setCheckAllAccounts(false)
    }

    return (
        <>

            <Layout>
                <CustomBreadCrumbs routes={[accountBreadcrumb]} />
                <Grid container direction="row" className="header-links">
                    <Grid item xs={12} sm={12} className="pr-3">
                        <Grid container justify="flex-end">
                            <Link
                                to="#"
                                onClick={(e) => e.preventDefault()}
                                className={classes.links}
                            >
                                Import from Excel
                            </Link>
                            <Divider
                                orientation="vertical"
                                flexItem
                                className={classes.linkDivider}
                            />
                            <Link
                                to="#"
                                onClick={(e) => e.preventDefault()}
                                className={classes.links}
                            >
                                Export to Excel
                            </Link>
                            <Divider
                                orientation="vertical"
                                flexItem
                                className={classes.linkDivider}
                            />
                            <Link
                                to="#"
                                onClick={(e) => e.preventDefault()}
                                className={classes.links}
                            >
                                Download Template
                            </Link>
                            <Divider
                                orientation="vertical"
                                flexItem
                                className={classes.linkDivider}
                            />
                            <Link
                                to="#"
                                onClick={(e) => e.preventDefault()}
                                className={classes.links}
                            >
                                Email a Link
                            </Link>
                        </Grid>
                    </Grid>
                </Grid>

                <Box component="div">
                    <CustomContainer>
                        <div className={`${accountClass["account_header_inner_container"]}`} >
                            <CustomHeader
                                total={rowCount}
                                heading={accountResource}
                                selectedType={selectedType}
                                onTypeChange={handleAccountSel}
                                options={AccTypes}
                                secondHeading="Account"
                                icon={<MdAccountCircle className="headerLogo" />} >
                                <div className={`${accountClass.account_header} ${accountClass["account_header-mobile"]}`} >
                                    <SearchBox
                                        onSearch={handleSearch}
                                        searchbox="account_header_search_bar"
                                        width="300px" value={searchVal}
                                    />
                                    <div className={`${accountClass.account_header_add_btn_action_btn_group}`}>
                                        {
                                            accountPermissions.isCreate && <Button
                                                variant="contained"
                                                color="primary"
                                                className={`px-3 ${accountClass.account_header_add_btn}`}
                                                onClick={clickCreateNew}
                                                startIcon={<AddOutlined />} >Add</Button>
                                        }

                                        <Button
                                            disabled={dataRows.filter((d) => d.isChecked).length === 0}
                                            variant="outlined"
                                            color="default"
                                            className={`${accountClass.account_header_action_btn}`}
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
                                                horizontal: "left"
                                            }}
                                            id="action-menu"
                                            open={Boolean(anchorEl)}
                                            onClose={closeActions}>

                                            {
                                                accountPermissions.isUpdate && accountPermissions.approveAccount && <MenuItem
                                                    disabled={
                                                        dataRows.filter((d) => d.isChecked && !d.approved).length === 0
                                                    }
                                                    onClick={() => {
                                                        closeActions()
                                                        setMultipleApproveDisapproveAccount({ show: true, approved: true, selectedRecords: dataRows.filter((d) => d.isChecked && !d.approved).length })
                                                    }}
                                                >
                                                    Approve Accounts &nbsp;{" "}
                                                    <Chip size="small" label={dataRows.filter((d) => d.isChecked && !d.approved).length} />
                                                </MenuItem>
                                            }
                                            {
                                                accountPermissions.isUpdate && accountPermissions.approveAccount && <MenuItem
                                                    disabled={
                                                        dataRows.filter((d) => d.isChecked && d.approved).length === 0
                                                    }
                                                    onClick={() => {
                                                        closeActions()
                                                        setMultipleApproveDisapproveAccount({ show: true, approved: false, selectedRecords: dataRows.filter((d) => d.isChecked && d.approved).length })
                                                    }}
                                                >
                                                    Disapprove Accounts &nbsp;{" "}
                                                    <Chip size="small" label={dataRows.filter((d) => d.isChecked && d.approved).length} />
                                                </MenuItem>
                                            }
                                            {
                                                accountPermissions.isDelete &&
                                                <MenuItem disabled={dataRows.filter((d) => d.isChecked).length === 0}
                                                    onClick={() => {
                                                        if (dataRows.find((d) => d.isChecked && d.canDelete === false)) {
                                                            closeActions()
                                                            setShowDeleteWarningConfirmBox(true);
                                                        } else {
                                                            closeActions()
                                                            setShowDeleteConfirmBox(true)
                                                        }
                                                    }}
                                                >
                                                    Delete
                                    </MenuItem>
                                            }

                                        </Menu>

                                    </div>
                                </div>
                            </CustomHeader>
                        </div>

                        <div className="listing-grid">
                            <DataGrid
                                components={{
                                    Toolbar: DataGridCustomToolbar,
                                }}
                                scrollbarSize={20}
                                rows={loading ? [] : dataRows}
                                columns={columns}
                                loading={loading}
                                disableSelectionOnClick
                                disableMultipleSelection
                                paginationMode="server"
                                pagination
                                onPageChange={handlePage}
                                onPageSizeChange={handlePageSize}
                                pageSize={query.limit}
                                page={query.page}
                                rowCount={rowCount}
                                rowsPerPageOptions={[25, 50, 75]}
                                onSortModelChange={handleSortModelChange}
                                // onRowClick={handleRowClick}
                                density="compact"
                            />
                        </div>
                        {
                            showDeleteWarningConfirmBox ?
                                <MessageDialog
                                    open={showDeleteWarningConfirmBox}
                                    message={`You are trying to delete records which you do not have permission to delete, Please remove those records from selection and try again.`}
                                    onClose={() => setShowDeleteWarningConfirmBox(false)}
                                /> : null
                        }
                        {
                            showDeleteConfirmBox ?
                                <ConfirmationDialog
                                    open={showDeleteConfirmBox}
                                    message={`Are you sure, you want to delete selected account(s) ?`}
                                    onClose={() => setShowDeleteConfirmBox(false)}
                                    onOk={handleDeleteAccounts}
                                /> : null
                        }
                        {
                            singleAccountDelete.show ?
                                <ConfirmationDialog
                                    open={singleAccountDelete.show}
                                    message={`Are you sure, you want to delete account: ${singleAccountDelete.accountName} ? `}
                                    onClose={() => setSingleAccountDelete({ id: null, show: false, accountName: "" })}
                                    onOk={handleSingleDeleteAccounts}
                                /> : null
                        }

                        {
                            singleApproveDisapproveAccount.show ?
                                <ConfirmationDialog
                                    open={singleApproveDisapproveAccount.show}
                                    message={`Are you sure, you want to ${singleApproveDisapproveAccount.approved ? "approve" : "disapprove"} account: ${singleApproveDisapproveAccount.accountName} ? `}
                                    onClose={() => setSingleApproveDisapproveAccount({ id: null, show: false, accountName: "" })}
                                    onOk={handleSingleApproveDisapproveAccount}
                                /> : null
                        }

                        {
                            multipleApproveDisapproveAccount.show ?
                                <ConfirmationDialog
                                    open={multipleApproveDisapproveAccount.show}
                                    message={`Are you sure, you want to ${multipleApproveDisapproveAccount.approved ? "approve" : "disapprove"} selected ${multipleApproveDisapproveAccount.selectedRecords} account(s) ? `}
                                    onClose={() => setMultipleApproveDisapproveAccount({ show: false, approved: false, selectedRecords: 0 })}
                                    onOk={approveDisapproveAccounts}
                                /> : null
                        }
                        {
                            isAccDialogVisible ?
                                <ManageAccountDialog
                                    open={isAccDialogVisible}
                                    onClose={handleDialogClose}
                                    id={cloneId}
                                    accountResource={accountResource}
                                    accountApi={accountApi}
                                /> : null
                        }
                    </CustomContainer>
                </Box>
            </Layout>

        </>
    )
}
