import React, { useCallback, useContext, useEffect, useState } from 'react';
import Layout from "../../components/Layout";
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
import ManageContactDialog from './ManageContact/index';
import { makeStyles } from "@material-ui/core/styles";
import routes from './../../components/Helpers/Routes';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import SearchBox from '../../components/Helpers/SearchBox'
import DeleteIcon from '@material-ui/icons/Delete';
import BlockIcon from '@material-ui/icons/Block';
import CustomContainer from "./../../components/Container";
import MessageDialog from '../../components/Helpers/MessageDialog'
import { getErrorMessage, getSearchQuery } from '../../services/util'
import contactStyles from './contact.module.scss'
import DataGridCustomToolbar from '../../components/Helpers/DataGridCustomToolbar';
import CustomRenderCell from '../../components/Helpers/CustomRenderCell';
import styles from "../Leads/Header.module.scss"
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import { MdContacts } from 'react-icons/md';
import axiosInstance from '../../axios/axiosInstance';


const ContactTypes = [
    {
        key: "All Contacts",
        value: 1
    },
    {
        key: "My Contacts",
        value: 2
    }
]


const ContactTypes1 = {
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


export default function Contact(props) {
    const toastConfig = useContext(CustomToastContext);
    const classes = useStyles();

    const { state: { user } }: any = useData();
    const { contactApi, contactResource, contactPermission, contactBreadcrumb, contactRoute } = props;
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

    const [filter, setFilter] = useState("All Contacts");
    const handleFilter = (event, newFilter) => {
        if (newFilter !== null) {
            setFilter(newFilter);
            handleContactSel(ContactTypes.find((d) => d.key === newFilter).value);
        }
    };

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
            field: "name", headerName: "Name", width: 400,
            renderCell: (params) => (
                <Link className="link"
                    to={`/${contactRoute}/detail/${params.row._id}`}>
                    {params.value || ''}
                </Link>
            )
        },
        // { field: "lastName", headerName: "Last Name", width: 200 },
        {
            field: "phone", headerName: "Phone", width: 300,
            renderCell: (params) => <CustomRenderCell value={params?.value} />
        },
        {
            field: "email", headerName: "Email", width: 300,
            renderCell: (params) => <CustomRenderCell value={params?.value} />
        },
        {
            field: "account", headerName: "Account", width: 300,
            renderCell: (params) => <CustomRenderCell value={params?.value} />
        },
        {
            field: "actions", headerName: "Actions ",
            renderCell: (params) => (
                <>
                    {
                        contactPermissions.isDelete ?
                            params.row.canDelete ?
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
        const data = user?.role?.sideBar;

        if (data) {
            const hasContactPermission = data.find(d => d.name == contactPermission);
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
        axiosInstance().put(`/${contactApi}/remove`, { ids: [singleContactDelete.id] })
            .then(({ data }) => {
                toastConfig.setToastConfig({ open: true, type: "success", message: data.message });
                getContacts();
            }).catch((error) => {
                toastConfig.setToastConfig(error);
            });
        setSingleContactDelete({ id: null, show: false, contactName: "" });

    }

    const getContacts = useCallback(() => {
        setLoading(true);
        let searchParams: any = { ...query, filterContacts: selectedType }
        searchParams = searchVal
            ? { ...searchParams, search: searchVal }
            : { ...searchParams };

        //     GetContacts(searchParams).then(({ data, count }) => {
        //         setContactData(data);
        //         setRowCount(count)
        //         setLoading(false);
        //     }).catch(error => {
        //         toastConfig.setToastConfig(error);
        //         setLoading(false);
        //     })
        // }
        let api = getSearchQuery(`/${contactApi}`, searchParams);
        setLoading(true);
        axiosInstance()
            .get(api)
            .then(({ data: { data, count } }) => {
                setContactData(data);
                // getRows(data);
                setRowCount(count);
                setLoading(false);
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
                setLoading(false);
            });
    }, [searchVal, query]);


    useEffect(() => {
        let rows = contactData?.map((u) => ({
            ...u,
            isChecked: false,
            id: u._id,
            canDelete: u?.owner?.optionValue === user?.user._id,
            collaborator: u.collaborator || [],
            account: u.accountName?.optionLabel,
            name: `${u.firstName || ''} ${u.middleName || ''} ${u.lastName || ''}`
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

        const selectedRecs = dataRows.filter(d => d.isChecked).map(m => { return m.id });
        setLoading(true);
        if (selectedRecs && selectedRecs.length > 0) {
            axiosInstance().put(`/${contactApi}/remove`, {
                ids: [...selectedRecs]
            }).then(({ data }) => {
                toastConfig.setToastConfig({ open: true, type: "success", message: data.message });
                setShowDeleteConfirmBox(false)
                getContacts();
            }).catch((error) => {
                toastConfig.setToastConfig(error);
            })
        }
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


    const handleContactSel = (filterValues) => {
        setselectedType(filterValues)
    }

    return (
        <Layout>
            <CustomBreadCrumbs routes={[contactBreadcrumb]} />
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

            <CustomContainer>
                <div className="header-panel">
                    <Grid className={styles.filter_side_container} container justify="space-between">
                        <Grid item className="d-flex align-items-center gap-1">
                            <MdContacts className="headerLogo" /> <span className="listingHeader">{contactResource} </span>
                            {
                                ContactTypes && <ToggleButtonGroup size="small" className="ml-8"
                                    value={filter}
                                    exclusive
                                    onChange={handleFilter}>
                                    {ContactTypes.map((k, index) => {
                                        return (
                                            <ToggleButton value={k.key} key={index}>{k.key}
                                            </ToggleButton>
                                        );
                                    })}
                                </ToggleButtonGroup>
                            }

                        </Grid>
                        <Grid className={styles.filter_side} item>
                            <Box className={styles.filter_side_header} component="div">
                                <SearchBox onSearch={handleSearch} searchbox={styles.search_box_input} value={searchVal} size="small" />
                                {
                                    contactPermissions.isCreate && <>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={clickCreateNew}
                                            startIcon={<AddIcon />}
                                            className={styles.add_submit_btn}>
                                            Add
                                </Button>
                                    </>
                                }

                                {
                                    contactPermissions.isDelete && <>
                                        <Button
                                            // disabled={Boolean(!selectedBrand)}
                                            disabled={dataRows.filter((d) => d.isChecked).length === 0}
                                            variant="outlined"
                                            color="default"
                                            onClick={openActions}
                                            className={styles.action_submit_btn}
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
                                                    if (dataRows.find((d) => d.isChecked && d.canDelete == false)) {
                                                        closeActions();
                                                        setShowDeleteWarningConfirmBox(true);
                                                    } else {
                                                        closeActions();
                                                        setShowDeleteConfirmBox(true);
                                                    }
                                                }}
                                            >
                                                Delete
                                    </MenuItem>
                                        </Menu>
                                    </>
                                }
                            </Box>
                        </Grid>
                    </Grid>
                </div>
            </CustomContainer>

            <Paper>
                <Box component="div" >
                    {/* <Box component="div" marginY={1}> */}
                    <div className="listing-grid">
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
                        showCreateContactDialog && <ManageContactDialog
                            // open={showCreateContactDialog}
                            // onClose={() => setShowCreateContactDialog(false)}
                            // onSuccess={() => {
                            //     setShowCreateContactDialog(false);
                            //     getContacts();
                            // }}
                            // entityDetails={createContactEntityDetails}
                            open={showCreateContactDialog}
                            onClose={() => setShowCreateContactDialog(false)}
                            onSuccess={() => {
                                setShowCreateContactDialog(false);
                                getContacts();
                            }}
                            contactResource={contactResource}
                            contactApi={contactApi}
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
