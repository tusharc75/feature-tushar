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
} from "@material-ui/core";
import { DataGrid, GridToolbar } from "@material-ui/data-grid";
import { useHistory } from "react-router-dom";
import BrandHeader from '../../components/BrandHeader';
import { ExpandMore } from "@material-ui/icons";
import BoxWithBorder from "../../components/BoxWithBorder";
import { GetAccounts } from '../../axios/index'
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog'
import { deleteAccounts } from '../../axios/accounts'
import CustomToast from '../../components/Helpers/CustomToast'
import SearchBox from '../../components/Helpers/SearchBox'

let accountTimeout
export default function Account() {

    const { state: { user } } = useData();
    const history = useHistory();

    const [entitiesCount, setEntitiesCount] = useState(0);

    const [accountData, setAccountData] = useState([]);
    const [loadingAccountData, setLoadingAccountData] = useState(false);
    const [loading, setLoading] = useState(false);
    const [dataRows, setDataRows] = useState([]);
    const [rowCount, setRowCount] = useState(0);
    const [checkAllAccounts, setCheckAllAccounts] = useState(false);
    const [query, setQuery] = useState({ page: 1, limit: 5 });
    const [anchorEl, setAnchorEl] = useState(null);
    const [renderCount, setRenderCount] = useState(0);
    const [rowCount, setRowCount] = useState(0);
    const [selectedRecs, setSelectedRecs] = useState([])
    const [showConfirmBox, setShowConfirmBox] = useState(false)
    const [alertData, setAlertData] = useState({})
    const [searchVal, setSearchVal] = useState("");

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
            if (user) {
                fetchAccounts();
            }
        } else setRenderCount((preCount) => preCount + 1);
    }, [query, user]);

    useEffect(() => {
        let rows = accountData?.map((u) => ({
            ...u,
            isChecked: false,
            id: u._id,
        }));
        setDataRows([...rows]);
    }, [accountData])

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
                            setCheckAllAccounts(true);
                        } else {
                            setCheckAllAccounts(false);
                        }
                        handleSelectedAccounts(params.row.id, ev.target.checked)

                        // if (checkedRecords.length === 1) {
                        //   const id = checkedRecords[0].id;
                        //   findOneUser(id);
                        // } else {
                        //   setSelectedUser(null);
                        //   if (selectedBrand) {
                        //     accountData.forEach((u) => {
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
        { field: "accountName", headerName: "Account Name", width: 200 },
        { field: "phone", headerName: "Phone", width: 200 },
        { field: "rootAccount", headerName: "Root Account", width: 200 },
    ];

    const handleSearch = (e) => {
        if (query.page !== 1) {
            setQuery((prevState) => ({ ...prevState, page: 1 }));
        }
        setSearchVal(e.target.value);
    };

    const fetchAccounts = async () => {
        if (user) {
            setLoading(true);
            let searchParams = { brand: user.user.brand, ...query }
            searchParams = searchVal
                ? { ...searchParams, search: searchVal }
                : { ...searchParams };
            let tdata = await GetAccounts(searchParams)

            setRowCount(tdata.count)
            if (tdata?.data && tdata.data.length > 0) {
                setAccountData(tdata.data)
            }
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
        history.push({
            pathname: "/account/new",
            // state: {
            //     brand_id: selectedBrand.id,
            // },
        });
    }

    const handleSnackbar = (msg, type, isOpen) => {
        setAlertData({
            errorMsg: msg,
            type: type,
            open: isOpen
        })
    };
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
        let recLen = selectedRecs.length
        if (selectedRecs && recLen > 0) {
            // selectedRecs.forEach(async (curId, i) => {
            //     let data = await deleteAccounts({ _id: curId })
            //     if ((i === recLen - 1) && data.status === 200) {
            //         handleSnackbar(data.message, 'success', true)
            //         fetchAccounts();
            //     }
            // })
            setShowConfirmBox(false)
            setSelectedRecs([])
        }
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

            <BrandHeader total={entitiesCount} heading="Accounts"
                showHeading={false}
            >
                <SearchBox onSearch={handleSearch} value={searchVal} />
                <Box component="span" marginX={1} />
                <Button
                    variant="contained"
                    color="primary"
                    onClick={clickCreateNew}
                >
                    Create Account
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

                    <MenuItem disabled={dataRows.filter((d) => d.isChecked).length !== 1}
                        onClick={() => setShowConfirmBox(true)}
                    >
                        Delete
                    </MenuItem>
                </Menu>

            </BrandHeader>

            <Paper style={{ marginTop: 15 }}>
                <BoxWithBorder>
                    <div style={{ width: "100%", height: "400px" }}>
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
                            rowsPerPageOptions={[5, 10, 20]}
                            onSortModelChange={handleSortModelChange}
                            density="compact"
                        />
                    </div>
                    {
                        showConfirmBox ?
                            <ConfirmationDialog
                                open={showConfirmBox}
                                message={`Are you sure you want to delete these entities`}
                                onClose={() => setShowConfirmBox(false)}
                                onOk={handleDeleteAccounts}
                            /> : null
                    }
                </BoxWithBorder>
            </Paper>
        </Layout>
    )
}
