import React, { useEffect, useState } from 'react';
import Layout from "../../components/Layout";
import { GetAccounts } from '../../axios/index';
import { useData } from '../../StateProvider/Provider';
import {
    Box,
    Button,
    Checkbox,
    Menu,
    MenuItem,
    Paper,
    Tooltip,
    IconButton,
    Grid,
    Divider,
    Select
} from "@material-ui/core";
import { DataGrid, GridToolbar } from "@material-ui/data-grid";
import { Link } from 'react-router-dom'
import { useHistory } from "react-router-dom";
import { ExpandMore, AddOutlined } from "@material-ui/icons";
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog'
import MessageDialog from '../../components/Helpers/MessageDialog'
import SearchBox from '../../components/Helpers/SearchBox'
import { accountDetailPage } from '../../routes/Accounts'
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import CreateAccountDialog from './CreateAccount/index'
import routes from './../../components/Helpers/Routes';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import { makeStyles } from "@material-ui/core/styles";
import { CustomEventEmitter } from './../../axios/events';
import axiosInstance from '../../axios/axiosInstance'
import CustomContainer from "./../../components/Container";

import './account.css'

const AccTypes = {
    "All Accounts": 1,
    "My Accounts": 2
}
const useStyles = makeStyles((theme) => ({
    root: {
        width: "100%",
        border: "1px solid #D4D6D7",
        borderRadius: 8,
        padding: theme.spacing(3, 2),
    },
    linksContainer: {
        display: "flex",
    },
    links: {
        color: theme.palette.textDark
    },
    linkDivider: {
        backgroundColor: theme.palette.darkBg,
        margin: "0 1rem",
    }
}));

let accountTimeout
export default function Account() {

    const classes = useStyles();

    const { state: { user } } = useData();
    const history = useHistory();
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

    const [accountPermissions, setAccountPermissions] = useState({ isCreate: false, isRead: false, isDelete: false });

    useEffect(() => {
        const data = user.role?.sideBar;

        if (data) {
            const hasAccountPermission = data.find(d => d.name == "Account");
            if (hasAccountPermission) {
                setAccountPermissions({ isCreate: hasAccountPermission.isCreate, isRead: hasAccountPermission.isRead, isDelete: hasAccountPermission.isDelete });
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
    }, [query, , selectedType]);

    useEffect(() => {
        let rows = accountData?.map((u) => ({
            ...u,
            isChecked: false,
            id: u._id,
            allowToDelete: u.allowToDelete,
            collaborator: u.collaborator || [],
            masterAccount: u.parentHierarchy.length > 0 ? u.parentHierarchy[0].accountName : ""
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
                            // if (d.allowToDelete) {
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
                    // disabled={!params.allowToDelete}
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
                        handleSelectedAccounts(params.row.id, ev.target.checked)
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
            field: "accountName", headerName: "Account Name", width: 200,
            renderCell: (params) => (
                <Link className="accountNameLink" to={`${accountDetailPage.path}/${params.row._id}`}>
                    {params?.row?.accountName ? params.row.accountName : ''}
                </Link>
            )
        },
        {
            field: "typeOfAccount",
            headerName: "Type",
            width: 200,
            renderCell: (params) => (
                <>
                    {
                        params?.value?.optionLabel ? params.value.optionLabel : ''
                    }
                </>
            )
        },
        {
            field: "industry",
            headerName: "Industry",
            width: 200,
            renderCell: (params) => (
                <>
                    {
                        params?.value?.optionLabel ? params.value.optionLabel : ''
                    }
                </>
            )
        },
        {
            field: "parentAccount",
            headerName: "Parent Account",
            width: 200,
            renderCell: (params) => (
                <>
                    {
                        params?.value?.optionLabel ? params.value.optionLabel : ''
                    }
                </>
            )
        },
        {
            field: "masterAccount",
            headerName: "Master Account",
            width: 200,
            disableColumnMenu: true,
            sortable: false,
            filterable: false,
        },
        { field: "phone", headerName: "Phone", width: 200 },
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
                        accountPermissions.isDelete ?
                            params.row.allowToDelete ?
                                <Tooltip title="Delete">
                                    <IconButton aria-label="Delete" onClick={() => {
                                        setSingleAccountDelete({ show: true, id: params.row._id, accountName: params.row.accountName })
                                    }}>
                                        <DeleteIcon fontSize="small" color="error" />
                                    </IconButton>
                                </Tooltip> :
                                <Tooltip className="cursor-stop" title="You must be the owner or collaborator of this account to get the delete functionality">
                                    <IconButton aria-label="Delete">
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip> :
                            <Tooltip className="cursor-stop" title="You do not have permission to delete account">
                                <IconButton aria-label="Delete">
                                    <DeleteIcon fontSize="small" />
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

    const fetchAccounts = async () => {
        setLoading(true);
        let searchParams = { ...query, filterAccounts: selectedType }
        searchParams = searchVal
            ? { ...searchParams, search: searchVal }
            : { ...searchParams };
        try {
            let tdata = await GetAccounts(searchParams)
            setRowCount(tdata.count)
            setAccountData(tdata.data)
            setLoading(false);
        }
        catch (err) {
            setLoading(false);
        }
    }

    const handleSelectedAccounts = (id, isChecked) => {
        let tempSelectedRecs = [...selectedRecs], curRecIndex = selectedRecs.indexOf(id)
        if (isChecked && curRecIndex < 0) {
            tempSelectedRecs = [...selectedRecs, id]
        }
        else if (!isChecked && curRecIndex >= 0) {
            tempSelectedRecs.splice(curRecIndex, 1)
        }
        setSelectedRecs(tempSelectedRecs)
    }

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

    // const handleSnackbar = (msg, type, isOpen) => {
    //     setAlertData({
    //         errorMsg: msg,
    //         type: type,
    //         open: isOpen
    //     })
    // };

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
        let recLen = selectedRecs.length
        if (selectedRecs && recLen > 0) {
            let reqs = {
                ids: [...selectedRecs]
            }
            axiosInstance().put(`/account/remove`, reqs).then(({ data }) => {
                CustomEventEmitter.dispatch("show-toast", { type: "success", errorMsg: data.message });
                setShowDeleteConfirmBox(false)
                fetchAccounts();
            })
            setSelectedRecs([])
        }
    }

    const handleSingleDeleteAccounts = async () => {

        axiosInstance().put(`/account/remove`, { ids: [singleAccountDelete.id] })
            .then(({ data }) => {
                CustomEventEmitter.dispatch("show-toast", { type: "success", errorMsg: data.message });
                fetchAccounts();
            });

        setSingleAccountDelete({ id: null, show: false, accountName: "" });
        setSelectedRecs([])
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

    const handleAccountSel = (e) => {
        setselectedType(e.target.value)
        setCheckAllAccounts(false)
    }
    return (
        <>
            <Layout>

                <Grid container spacing={3} direction="row">
                    <Grid item xs={12} sm={6} className="pl-3">
                        <CustomBreadCrumbs routes={[routes.account]} />
                    </Grid>
                    <Grid item xs={12} sm={6} className="pr-3">
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

                <CustomContainer>
                    <Grid container justify="space-between">
                        <Grid item>
                            {
                                Object.keys(AccTypes).length ? <Select
                                    style={{ width: '160px' }}
                                    labelId="demo-simple-select-outlined-label"
                                    id="demo-simple-select-outlined"
                                    MenuProps={{
                                        anchorOrigin: {
                                            vertical: "bottom",
                                            horizontal: "left"
                                        },
                                        getContentAnchorEl: null
                                    }}
                                    value={selectedType}
                                    onChange={handleAccountSel}
                                    label="Select Type"
                                >
                                    {
                                        Object.keys(AccTypes).map((k, index) => {
                                            return <MenuItem key={index} value={AccTypes[k]}>{k}</MenuItem>
                                        })
                                    }
                                </Select>
                                    : null
                            }
                        </Grid>

                        <Grid item>

                            <SearchBox onSearch={handleSearch} value={searchVal} size="small" />

                            {
                                accountPermissions.isCreate && <>
                                    <Box component="span" marginX={1} />

                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={clickCreateNew}
                                        startIcon={<AddOutlined />}
                                    >
                                        Add
                                    </Button>
                                </>
                            }

                            {
                                accountPermissions.isDelete && <>
                                    <Box component="span" marginX={1} />

                                    <Button
                                        disabled={dataRows.filter((d) => d.isChecked).length === 0}
                                        variant="outlined"
                                        color="default"
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

                                        <MenuItem disabled={dataRows.filter((d) => d.isChecked).length == 0}
                                            onClick={() => {
                                                if (dataRows.find((d) => d.isChecked && d.allowToDelete == false)) {
                                                    setShowDeleteWarningConfirmBox(true);
                                                } else {
                                                    setShowDeleteConfirmBox(true)
                                                }
                                            }}
                                        >
                                            Delete
                                        </MenuItem>
                                    </Menu>
                                </>
                            }

                        </Grid>
                    </Grid>
                </CustomContainer>

                <Paper style={{ marginTop: 15 }}>
                    <Box component="div" style={{ padding: '4px 4px' }} className={classes.root}>
                        <div className="account-grid-height1">
                            <DataGrid
                                components={{
                                    Toolbar: GridToolbar,
                                }}
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

                    </Box>
                </Paper>
            </Layout>
            {
                isAccDialogVisible ?
                    <CreateAccountDialog
                        open={isAccDialogVisible}
                        onClose={handleDialogClose}
                        // showSuccessMes={handleSnackbar}
                        id={cloneId}
                    /> : null
            }
        </>
    )
}
