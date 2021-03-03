import React, { useEffect, useState } from 'react';
import Layout from "../../components/Layout";
import { GetAccounts, RemoveAccounts } from '../../axios/index';
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
    Divider
} from "@material-ui/core";
import { DataGrid, GridToolbar } from "@material-ui/data-grid";
import { Link } from 'react-router-dom'
import { useHistory } from "react-router-dom";
import BrandHeader from '../../components/BrandHeader';
import { ExpandMore, AddOutlined, EditLocationTwoTone, Visibility } from "@material-ui/icons";
import BoxWithBorder from "../../components/BoxWithBorder";
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog'
import { deleteAccounts, getDataToClone } from '../../axios/accounts'
import CustomToast from '../../components/Helpers/CustomToast'
import SearchBox from '../../components/Helpers/SearchBox'
import { getErrorMessage } from '../../services/util'
import BlockIcon from '@material-ui/icons/Block';
import { accountDetailPage } from '../../routes/Accounts'
import _ from "lodash";
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import CreateAccountDialog from './CreateAccount/index'
import routes from './../../components/Helpers/Routes';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import { makeStyles } from "@material-ui/core/styles";
import { CustomEventEmitter } from './../../axios/events';
import './account.css'

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
    const [query, setQuery] = useState({ page: 0, limit: 25 });
    const [anchorEl, setAnchorEl] = useState(null);
    const [renderCount, setRenderCount] = useState(0);
    const [selectedRecs, setSelectedRecs] = useState([])
    const [showConfirmBox, setShowConfirmBox] = useState(false)
    const [alertData, setAlertData] = useState({})
    const [isAccDialogVisible, setIsAccDialogVisible] = useState(false)
    const [searchVal, setSearchVal] = useState("");

    const [singleAccountDelete, setSingleAccountDelete] = useState({ id: null, show: false, accountName: "" })

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
        // eslint-disable-next-line
    }, [query]);

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
                            if (d.allowToDelete) {
                                d.isChecked = ev.target.checked;
                            }
                            return d;
                        });
                        setDataRows([...gridData]);
                    }}
                />
            ),
            renderCell: (params) => (
                params.row.allowToDelete ? <Checkbox
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
                /> : <Tooltip className="cursor-stop" title="You must be the owner or collaborator of this account to get the selection functionality">
                        <IconButton>
                            <BlockIcon fontSize="small" color="error" />
                        </IconButton>
                    </Tooltip >
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
            field: "actions", headerName: "Actions ",
            renderCell: (params) => (
                <>
                    <Tooltip title="Clone">
                        <IconButton aria-label="Clone" onClick={() => { cloneAccount(params.row._id) }}>
                            <FileCopyIcon fontSize="small" color="primary" />
                        </IconButton>
                    </Tooltip>
                    {
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

    const handleEdit = data => {
    }

    const handleSearch = (e) => {
        if (query.page !== 1) {
            setQuery((prevState) => ({ ...prevState, page: 0 }));
        }
        setSearchVal(e.target.value);
    };

    const fetchAccounts = async () => {
        setLoading(true);
        let searchParams = { ...query }
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
            // let errMes = getErrorMessage(err)
            // if (errMes) {
            //     handleSnackbar(errMes, 'error', true)
            // }
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
            setQuery({ page: 1, limit: params.pageSize });
        }
    };

    const handleSortModelChange = (params) => {
        if (params?.sortModel && params.sortModel.length > 0) {
            let temp = { ...params.sortModel[0] };
            setQuery((prevState) => ({
                ...prevState,
                page: 1,
                sortBy: temp.field,
                orderBy: temp.sort,
            }));
        }
    }

    const handleDeleteAccounts = async () => {
        // try {
        let recLen = selectedRecs.length
        if (selectedRecs && recLen > 0) {
            let reqs = {
                ids: [...selectedRecs]
            }
            let data = await deleteAccounts(reqs)
            if (data.status === 200) {
                CustomEventEmitter.dispatch("show-toast", { type: "success", errorMsg: data.message });
                // handleSnackbar(data.message, 'success', true)
                fetchAccounts();
            }
            setShowConfirmBox(false)
            setSelectedRecs([])
        }
        // }
        // catch (err) {
        //     let errMes = getErrorMessage(err)
        //     if (errMes) {
        //         handleSnackbar(errMes, 'error', true)
        //     }
        // }
    }

    const handleSingleDeleteAccounts = async () => {
        // try {
        let data = await deleteAccounts({ ids: [singleAccountDelete.id] })
        if (data.status === 200) {
            CustomEventEmitter.dispatch("show-toast", { type: "success", errorMsg: data.message });
            fetchAccounts();
        }
        setSingleAccountDelete({ id: null, show: false, accountName: "" });
        setSelectedRecs([])
        // }
        // catch (err) {
        //     let errMes = getErrorMessage(err)
        //     if (errMes) {
        //         handleSnackbar(errMes, 'error', true)
        //     }
        // }
    }

    const handleRowClick = e => {
        let tempPath = accountDetailPage.path + '/' + e.row._id
        history.push({
            pathname: tempPath,
        });
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
                                href="#"
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
                                href="#"
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
                                href="#"
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
                                href="#"
                                onClick={(e) => e.preventDefault()}
                                className={classes.links}
                            >
                                Email a Link
                            </Link>
                        </Grid>
                    </Grid>

                </Grid>

                <BrandHeader heading=""
                    style={{ marginTop: "150px", minHeight: "200px" }}
                    showHeading={false}>

                    <SearchBox onSearch={handleSearch} value={searchVal} size="sm" />
                    <Box component="span" marginX={1} />

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={clickCreateNew}
                        startIcon={<AddOutlined />}
                    >
                        Add
                    </Button>
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
                            onClick={() => setShowConfirmBox(true)}
                        >
                            Delete
                    </MenuItem>
                    </Menu>

                </BrandHeader>

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
                            showConfirmBox ?
                                <ConfirmationDialog
                                    open={showConfirmBox}
                                    message={`Are you sure, you want to delete selected account(s) ?`}
                                    onClose={() => setShowConfirmBox(false)}
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
