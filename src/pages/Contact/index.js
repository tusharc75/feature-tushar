import React, { useEffect, useState } from 'react';
import Layout from "../../components/Layout";
import { GetContacts, RemoveContacts } from '../../axios/index';
import { useData } from '../../StateProvider/Provider';
import {
    Box,
    Button,
    Checkbox,
    Container,
    Chip,
    CircularProgress,
    Divider,
    Menu,
    MenuItem,
    Typography,
    Paper,
} from "@material-ui/core";
import { DataGrid, GridToolbar } from "@material-ui/data-grid";
import { useHistory } from "react-router-dom";
import BrandHeader from '../../components/BrandHeader';
import { ExpandMore } from "@material-ui/icons";
import BoxWithBorder from "../../components/BoxWithBorder";
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import AddIcon from '@material-ui/icons/Add';
import './contact.css';

let contactTimeout
export default function Contact() {

    const { state: { user } } = useData();
    const history = useHistory();

    const [entitiesCount, setEntitiesCount] = useState(0);

    const [contactData, setContactData] = useState([]);
    const [loadingContactData, setLoadingContactData] = useState(false);
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

                        // if (checkedRecords.length === 1) {
                        //   const id = checkedRecords[0].id;
                        //   findOneUser(id);
                        // } else {
                        //   setSelectedUser(null);
                        //   if (selectedBrand) {
                        //     contactData.forEach((u) => {
                        //       if (u.brand !== selectedBrand.id) {
                        //         setSelectedBrand(null);
                        //       }
                        //     });
                        //   }
                        // }
                    }}
                />
            ),
            disableColumnMenu: true,
            sortable: false,
            filterable: false,
            width: 75,
        },
        { field: "firstName", headerName: "First Name", width: 200 },
        { field: "lastName", headerName: "Last Name", width: 200 },
        { field: "phone", headerName: "Phone", width: 200 },
        { field: "email", headerName: "Email", width: 200 },
        { field: "account", headerName: "Account", width: 200 },
    ];

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
    }, [query]);

    const getContacts = () => {
        setLoading(true);
        let searchParams = { ...query };

        GetContacts(searchParams).then(({ data, count }) => {
            setContactData(data);
            setRowCount(count)
            setLoading(false);
        });
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
        history.push({
            pathname: "/contact/new",
            // state: {
            //     brand_id: selectedBrand.id,
            // },
        });
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


        // let recLen = selectedRecs.length;
        // if (selectedRecs && recLen > 0) {
        //     selectedRecs.forEach(async (curId, i) => {
        //         let data = await deleteBrand({ id: curId });
        //         if (i === recLen - 1 && data.status === 200) {
        //             setOpen(true);
        //             setErroMsg(data.message);
        //             setMsgType("success");
        //             getContacts();
        //         }
        //     });
        //     setShowConfirmBox(false);
        //     // setSelectedRecs([]);
        // }
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


    return (
        <Layout>

            <Paper className="contact-header">

                <Button
                    variant="contained"
                    color="primary"
                    onClick={clickCreateNew}
                    startIcon={<AddIcon />}
                >
                    Add
                    </Button>

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
            </Paper>

            <Paper style={{ marginTop: 15 }}>

                <BoxWithBorder>
                    {/* <Box component="div" marginY={1}> */}
                    <div className="contact-grid-height">
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

                </BoxWithBorder>
            </Paper>
        </Layout >
    )
}
