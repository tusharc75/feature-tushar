import React, { useEffect, useState } from 'react';
import Layout from "../../components/Layout";
import { GetAccounts } from '../../axios/index';
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
        { field: "masterAccount", headerName: "Master Account", width: 200 },
    ];

    useEffect(() => {
        if (user) {
            getAccounts(user.user.brand);
        }
        // eslint-disable-next-line
    }, [user]);

    useEffect(() => {
        if (user) {
            getAccounts(user.user.brand);
        }
    }, [query]);

    const getAccounts = (brand) => {
        setLoading(true);
        let searchParams = { brand: brand, ...query };

        GetAccounts(searchParams).then(({ data, count }) => {
            setAccountData(data);
            setRowCount(count)
            setLoading(false);
        });
    }

    useEffect(() => {
        let rows = accountData?.map((u) => ({
            ...u,
            isChecked: false,
            id: u._id,
        }));
        setDataRows([...rows]);
    }, [accountData])

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

    const handlePage = (params) => {
        if (query.page !== params.page) {
            setQuery((prevState) => ({ ...prevState, page: params.page }));
        }
    }

    const handlePageSize = (params) => {
        if (params.pageSize !== query.limit) {
            setQuery({ page: 1, limit: params.pageSize });
        }
    }

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
    };

    return (
        <Layout>

            <BrandHeader total={entitiesCount} heading="Accounts">
                {/* <SearchBox onSearch={handleSearch} value={searchVal} /> */}
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

                    <MenuItem disabled={dataRows.filter((d) => d.isChecked).length == 0}>
                        Delete
                    </MenuItem>
                </Menu>

            </BrandHeader>

            <Paper style={{ marginTop: 15 }}>
                <BoxWithBorder>
                    {/* <Box component="div" marginY={1}> */}
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
                        />
                    </div>
                    {/* </Box> */}

                </BoxWithBorder>
            </Paper>
        </Layout>
    )
}
