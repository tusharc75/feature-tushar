import React, { useEffect, useState } from 'react';
import Layout from "../../components/Layout";
import { GetContacts, RemoveContacts } from '../../axios/index';
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
    Divider,
    Select
} from "@material-ui/core";
import { useData } from '../../StateProvider/Provider';
import { Link } from 'react-router-dom'
import { DataGrid } from "@material-ui/data-grid";
import { ExpandMore } from "@material-ui/icons";
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import AddIcon from '@material-ui/icons/Add';
import { contactDetailPage } from '../../routes/Contacts'
import CreateContact from './CreateContact/CreateContact';
import { makeStyles } from "@material-ui/core/styles";
import routes from './../../components/Helpers/Routes';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import SearchBox from '../../components/Helpers/SearchBox'
import DeleteIcon from '@material-ui/icons/Delete';
import BlockIcon from '@material-ui/icons/Block';
import { capitalize } from '../../services/util'
import CustomContainer from "./../../components/Container";
import MessageDialog from '../../components/Helpers/MessageDialog'
import { getErrorMessage } from '../../services/util'
import contactStyles from './contact.module.scss'
import DataGridCustomToolbar from '../../components/Helpers/DataGridCustomToolbar';
import { CustomEventEmitter } from './../../axios/events';

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
        color: theme.palette.primary.main   //  textDark
    },
    linkDivider: {
        backgroundColor: theme.palette.primary.main,  //  darkBg
        margin: "0 1rem",
    },
}));

export default function Contact() {

    const classes = useStyles();

    const { state: { user } }: any = useData();

    const [selectedType, setselectedType] = useState(1)
    const [contactData, setContactData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dataRows, setDataRows] = useState([]);
    const [rowCount, setRowCount] = useState(0);
    const [checkAllContacts, setCheckAllContacts] = useState(false);
    const [query, setQuery] = useState({ page: 0, limit: 25 });
    const [anchorEl, setAnchorEl] = useState(null);
    const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
    const [searchVal, setSearchVal] = useState("");

    const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState(false)
    const [showCreateContactDialog, setShowCreateContactDialog] = useState(false);
    const [singleContactDelete, setSingleContactDelete] = useState({ id: null, show: false, contactName: "" })

    const [createContactEntityDetails] = useState({
        fields: [],
        initialValues: {},
    })

    const [contactPermissions, setContactPermissions] = useState<any>({ isCreate: false, isUpdate: false, isRead: false, isDelete: false });

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
                            d.isChecked = ev.target.checked;
                            return d;
                        });
                        setDataRows([...gridData]);
                    }}
                />
            ),
            renderCell: (params) => (
                <Checkbox
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
                />
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
                        contactPermissions.isDelete ?
                            params.row.allowToDelete ?
                                <Tooltip title="Delete">
                                    <IconButton aria-label="Delete" onClick={() => {
                                        setSingleContactDelete({ show: true, id: params.row._id, contactName: `${params.row.firstName} ${params.row.lastName}` })
                                    }}>
                                        <DeleteIcon fontSize="small" color="error" />
                                    </IconButton>
                                </Tooltip> :
                                <Tooltip className="cursor-stop" title="You must be the owner of this contact to get the delete functionality">
                                    <IconButton aria-label="Delete">
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip> :
                            <Tooltip className="cursor-stop" title="You do not have permission to delete contact">
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
        const data = user.role?.sideBar;

        if (data) {
            const hasContactPermission = data.find(d => d.name == "Contact");
            if (hasContactPermission) {
                setContactPermissions({ isCreate: hasContactPermission.isCreate, isRead: hasContactPermission.isRead, isDelete: hasContactPermission.isDelete });
            }
        }
    }, [user]);

    useEffect(() => {
        getContacts();
        // eslint-disable-next-line
    }, [query, searchVal, selectedType]);


    const handleSingleDeleteContacts = async () => {
        setLoading(true);

        let data = await RemoveContacts({ ids: [singleContactDelete.id] })
        if (data.status === 200) {
            CustomEventEmitter.dispatch("show-toast", { type: "success", errorMsg: data.message });
            getContacts();
            setLoading(false);
        }
        setSingleContactDelete({ id: null, show: false, contactName: "" });

    }

    const getContacts = () => {
        setLoading(true);
        let searchParams: any = { ...query, filterContacts: selectedType }
        searchParams = searchVal
            ? { ...searchParams, search: searchVal }
            : { ...searchParams };

        GetContacts(searchParams).then(({ data, count }) => {
            setContactData(data);
            setRowCount(count)
            setLoading(false);
        }).catch(err => {
            CustomEventEmitter.dispatch("show-toast", { type: "success", errorMsg: getErrorMessage(err) });
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
            setShowDeleteConfirmBox(false);
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

    const getFirstName = tData => {
        let name = capitalize(tData.firstName || '') + ' '
        name = name + capitalize(tData.middleName || '') + ' '
        name = name + capitalize(tData.lastName || '')
        return <Link className={contactStyles.contacts_name_link}
            to={`${contactDetailPage.path}/${tData._id}`}>
            {name}
        </Link>
    }

    const handleContactSel = (e) => {
        setselectedType(e.target.value)
    }

    return (
        <Layout>
            <Grid container spacing={3} direction="row">
                <Grid item xs={12} sm={6} className="pl-3">
                    <CustomBreadCrumbs routes={[routes.contact]} />
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
                            Object.keys(ContactTypes).length ? <Select
                                style={{ width: '160px' }}
                                labelId="demo-simple-select-outlined-label"
                                id="demo-simple-select-outlined"
                                disableUnderline
                                MenuProps={{
                                    anchorOrigin: {
                                        vertical: "bottom",
                                        horizontal: "left"
                                    },
                                    getContentAnchorEl: null
                                }}
                                value={selectedType}
                                onChange={handleContactSel}
                                label="Select Type"
                            >
                                {
                                    Object.keys(ContactTypes).map((k, index) => {
                                        return <MenuItem key={index} value={ContactTypes[k]}>{k}</MenuItem>
                                    })
                                }
                            </Select>
                                : null
                        }
                    </Grid>

                    <Grid item>

                        <SearchBox onSearch={handleSearch} value={searchVal} size="small" />

                        {
                            contactPermissions.isCreate && <>
                                <Box component="span" marginX={1} />
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={clickCreateNew}
                                    startIcon={<AddIcon />}
                                >
                                    Add
                                </Button>
                            </>
                        }

                        {
                            contactPermissions.isDelete && <>
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
                                        onClick={() => {
                                            if (dataRows.find((d) => d.isChecked && d.owner?.optionValue === user.user._id)) {
                                                setShowDeleteConfirmBox(true)
                                            } else {
                                                setShowDeleteWarningConfirmBox(true);
                                                
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
                    {/* <Box component="div" marginY={1}> */}
                    <div className="contact-grid-height1">
                        <DataGrid
                            components={{
                                Toolbar: DataGridCustomToolbar,
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

                    {
                        showDeleteWarningConfirmBox ?
                            <MessageDialog
                                open={showDeleteWarningConfirmBox}
                                message={`You are trying to delete records which you do not have permission to delete, Please remove those records from selection and try again.`}
                                onClose={() => setShowDeleteWarningConfirmBox(false)}
                            /> : null
                    }
                    {
                        showDeleteConfirmBox ? (
                            <ConfirmationDialog
                                open={showDeleteConfirmBox}
                                message={`Are you sure you want to delete selected Contacts ?`}
                                onClose={() => setShowDeleteConfirmBox(false)}
                                onOk={handleDeleteContact}
                            />
                        ) : null
                    }

                    {
                        showCreateContactDialog && <CreateContact
                            open={showCreateContactDialog}
                            onClose={() => setShowCreateContactDialog(false)}
                            onSuccess={() => {
                                setShowCreateContactDialog(false);
                                getContacts();
                            }}
                        // entityDetails={createContactEntityDetails}
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
