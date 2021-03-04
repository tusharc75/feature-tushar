import React, { useEffect, useState } from 'react';
import Layout from "../../components/Layout";
import { GetContacts, RemoveContacts } from '../../axios/index';
import { useData } from '../../StateProvider/Provider';
import {
    Box,
    Button,
    Checkbox,
    Menu,
    MenuItem,
    Tooltip,
    IconButton,
    Paper,
    Grid,
    Divider
} from "@material-ui/core";
import { Link } from 'react-router-dom'
import { DataGrid, GridToolbar } from "@material-ui/data-grid";
import { useHistory } from "react-router-dom";
import { ExpandMore, Visibility } from "@material-ui/icons";
import BoxWithBorder from "../../components/BoxWithBorder";
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import AddIcon from '@material-ui/icons/Add';
import { contactDetailPage } from '../../routes/Contacts'
import './contact.css';
import CreateContact from './CreateContact/CreateContact';
import { getObjKeys } from '../../constants/helpers';
import { makeStyles } from "@material-ui/core/styles";
import routes from './../../components/Helpers/Routes';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import BrandHeader from '../../components/BrandHeader';
import SearchBox from '../../components/Helpers/SearchBox'
import DeleteIcon from '@material-ui/icons/Delete';
import { getErrorMessage } from '../../services/util'
import CustomToast from '../../components/Helpers/CustomToast'
import BlockIcon from '@material-ui/icons/Block';
import { capitalize } from '../../services/util'
import './contact.css'

const ContactTypes = {
    "All Contacts": 1,
    "My Contacts": 2
}
const useStyles = makeStyles((theme) => ({
    root: {
        width: "100%",
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
    },
}));

let contactTimeout
export default function Contact() {

    const classes = useStyles();

    const { state: { user } } = useData();
    const history = useHistory();

    const [entitiesCount, setEntitiesCount] = useState(0);
    const [alertData, setAlertData] = useState({})
    const [selectedType, setselectedType] = useState(1)
    const [contactData, setContactData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dataRows, setDataRows] = useState([]);
    const [rowCount, setRowCount] = useState(0);
    const [checkAllContacts, setCheckAllContacts] = useState(false);
    const [query, setQuery] = useState({ page: 0, limit: 5 });
    const [anchorEl, setAnchorEl] = useState(null);
    const [open, setOpen] = useState(false);
    const [errorMsg, setErroMsg] = useState("");
    const [msgType, setMsgType] = useState("");
    const [showConfirmBox, setShowConfirmBox] = useState(false);
    const [searchVal, setSearchVal] = useState("");

    const [showCreateContactDialog, setShowCreateContactDialog] = useState(false);
    const [singleContactDelete, setSingleContactDelete] = useState({ id: null, show: false, contactName: "" })

    const [createContactEntityDetails, setCreateContactEntityDetails] = useState({
        fields: [],
        initialValues: {},
    })

    const columns = [
        {
            field: "isChecked",
            headerName: "Checkbox",
            renderHeader: () => (
                <Checkbox
                    color="primary"
                    checked={checkAllContacts}
                    onChange={(ev) => {
                        setCheckAllContacts(ev.target.checked);
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
                            setCheckAllContacts(true);
                        } else {
                            setCheckAllContacts(false);
                        }
                    }}
                /> : <Tooltip className="cursor-stop" title="You must be the owner or collaborator of this contact to get the selection functionality">
                        <IconButton>
                            <BlockIcon fontSize="small" color="error" />
                        </IconButton>
                    </Tooltip>
            ),
            disableColumnMenu: true,
            sortable: false,
            filterable: false,
            width: 75,
        },
        {
            field: "firstName", headerName: "Name", width: 200,
            renderCell: (params) => (
                getFirstName(params.row)
            )
        },
        // { field: "lastName", headerName: "Last Name", width: 200 },
        { field: "phone", headerName: "Phone", width: 200 },
        { field: "email", headerName: "Email", width: 200 },
        { field: "account", headerName: "Account", width: 200 },
        {
            field: "actions", headerName: "Actions ",
            renderCell: (params) => (
                <>
                    {
                        params.row.allowToDelete ?
                            <Tooltip title="Delete">
                                <IconButton aria-label="Delete" onClick={() => {
                                    setSingleContactDelete({ show: true, id: params.row._id, contactName: `${params.row.firstName} ${params.row.lastName}` })
                                }}>
                                    <DeleteIcon fontSize="small" color="error" />
                                </IconButton>
                            </Tooltip> :
                            <Tooltip className="cursor-stop" title="You must be the owner or collaborator of this contact to get the delete functionality">
                                <IconButton aria-label="Delete">
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                    }
                </>
            ), width: 200
        }
    ];

    useEffect(() => {
        if (searchVal && searchVal != "") {

            let millisec = Object.keys(searchVal).length > 0 ? 600 : 5;

            if (contactTimeout) {
                clearTimeout(contactTimeout);
            }

            contactTimeout = setTimeout(() => {
                getContacts();
            }, millisec);
        }
    }, [searchVal]);

    useEffect(() => {
        if (user) {
            getContacts();
        }
        // eslint-disable-next-line
    }, [user]);

    useEffect(() => {
        if (user) {
            getContacts();
        }
    }, [query, selectedType]);

    const handleSnackbar = (msg, type, isOpen) => {
        setAlertData({
            errorMsg: msg,
            type: type,
            open: isOpen
        })
    };

    const handleSingleDeleteContacts = async () => {
        try {
            setLoading(true);

            let data = await RemoveContacts({ ids: [singleContactDelete.id] })
            if (data.status === 200) {
                handleSnackbar(data.message, 'success', true)
                getContacts();
                setLoading(false);
            }
            setSingleContactDelete({ id: null, show: false, contactName: "" });
        }
        catch (err) {
            let errMes = getErrorMessage(err)
            if (errMes) {
                handleSnackbar(errMes, 'error', true)
            }
        }
    }

    const getContacts = () => {
        setLoading(true);
        let searchParams = { ...query, filterContacts: selectedType }
        searchParams = searchVal
            ? { ...searchParams, search: searchVal }
            : { ...searchParams };

        GetContacts(searchParams).then(({ data, count }) => {
            setContactData(data);
            setRowCount(count)
            setLoading(false);
        }).catch(err => {
            let errMes = getErrorMessage(err)
            if (errMes) {
                handleSnackbar(errMes, 'error', true)
            }
            setLoading(false);
        })
    }

    useEffect(() => {
        let rows = contactData?.map((u) => ({
            ...u,
            isChecked: false,
            id: u._id,
            account: u.accountName.optionLabel
        }));
        setDataRows([...rows]);
    }, [contactData])

    useEffect(() => {
        getContacts();
        // eslint-disable-next-line
    }, [query]);

    const handleRowClick = e => {
        let tempPath = contactDetailPage.path + '/' + e.row._id
        history.push({
            pathname: tempPath,
        });
    }

    // ****** ACTIONS BUTTON STUFF *********
    const openActions = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const closeActions = () => {
        setAnchorEl(null);
    };

    const clickCreateNew = () => {
        setShowCreateContactDialog(true);
    }

    const handlePage = (params) => {
        if (query.page !== params.page) {
            setQuery((prevState) => ({ ...prevState, page: params.page }));
        }
    }

    const handleDeleteContact = () => {

        const selectedRecords = dataRows.filter(d => d.isChecked).map(m => { return m.id });
        setLoading(true);
        RemoveContacts({ ids: selectedRecords }).then(() => {
            getContacts();
            setLoading(false);
        })
    };

    const handleSearch = (e) => {
        if (query.page !== 1) {
            setQuery((prevState) => ({ ...prevState, page: 0 }));
        }
        setSearchVal(e.target.value);
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

    const getFirstName = tData => {
        let name = capitalize(tData.firstName || '') + ' '
        name = name + capitalize(tData.middleName || '') + ' '
        name = name + capitalize(tData.lastName || '')
        return <Link className="contactsNameLink"
            to={`${contactDetailPage.path}/${tData._id}`}>
            {name}
        </Link>
    }
    const handleContactSel = (e) => {
        setselectedType(e.target.value)
    }

    return (
        <Layout>

            {
                alertData ? <CustomToast
                    open={alertData.open || false}
                    close={() => handleSnackbar('', '', false)}
                    errorMsg={alertData.errorMsg || ''}
                    type={alertData.type || ''}
                /> : null
            }
            <Grid container spacing={3} direction="row">
                <Grid item xs={12} sm={6} className="pl-3">
                    <CustomBreadCrumbs routes={[routes.contact]} />
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
                showHeading={false}
                onChange={handleContactSel}
                values={selectedType}
                options={ContactTypes}
                placeholder='Select Contact Type'
            >

                <SearchBox onSearch={handleSearch} value={searchVal} size="sm" />
                <Box component="span" marginX={1} />

                <Button
                    variant="contained"
                    color="primary"
                    onClick={clickCreateNew}
                    startIcon={<AddIcon />}
                >
                    Add
                    </Button>

                <Box component="span" marginX={1} />

                <Button
                    // disabled={Boolean(!selectedBrand)}
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
                        onClick={() => setShowConfirmBox(true)}>
                        Delete
                    </MenuItem>
                </Menu>
            </BrandHeader>

            <Paper style={{ marginTop: 15 }}>

                <Box component="div" style={{ padding: '4px 4px' }} className={classes.root}>
                    {/* <Box component="div" marginY={1}> */}
                    <div className="contact-grid-height1">
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
                            density="compact"
                        />
                    </div>
                    {/* </Box> */}

                    {showConfirmBox ? (
                        <ConfirmationDialog
                            open={showConfirmBox}
                            message={`Are you sure you want to delete selected Contacts ?`}
                            onClose={() => setShowConfirmBox(false)}
                            onOk={handleDeleteContact}
                        />
                    ) : null}

                    {
                        showCreateContactDialog && <CreateContact
                            open={showCreateContactDialog}
                            onClose={() => setShowCreateContactDialog(false)}
                            onSuccess={() => {
                                setShowCreateContactDialog(false);
                                getContacts();
                            }}
                            entityDetails={createContactEntityDetails}
                        />
                    }

                    {
                        singleContactDelete.show ?
                            <ConfirmationDialog
                                open={singleContactDelete.show}
                                message={`Are you sure, you want to delete contact: ${singleContactDelete.contactName} ?`}
                                onClose={() => setSingleContactDelete({ id: null, show: false, contactName: "" })}
                                onOk={handleSingleDeleteContacts}
                            /> : null
                    }


                </Box>
            </Paper>
        </Layout >
    )
}
