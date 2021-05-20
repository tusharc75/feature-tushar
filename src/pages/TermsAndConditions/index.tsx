import { useContext, useEffect, useState, useCallback } from 'react';
import Layout from "../../components/Layout";
import { useData } from '../../StateProvider/Provider';
import {
    Box,
    Button,
    Checkbox,
    Menu,
    MenuItem,
    Tooltip,
    IconButton
} from "@material-ui/core";
import { DataGrid } from "@material-ui/data-grid";
import { Link } from 'react-router-dom'
import { ExpandMore, AddOutlined } from "@material-ui/icons";
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog'
import SearchBox from '../../components/Helpers/SearchBox'
import DeleteIcon from '@material-ui/icons/Delete';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import axiosInstance from '../../axios/axiosInstance'
import CustomContainer from "../../components/CustomContainer";
import styles from "./terms.module.scss"
import CustomDataGridToolbar from "../../components/Helpers/DataGridHelpers/CustomDataGridToolbar";
import CustomHeader from '../../components/Helpers/CustomHeader'
import CustomRenderCell from '../../components/Helpers/CustomRenderCell'
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { getSearchQuery } from '../../services/util';
import { termsAndCondition } from '../../constants/helpers';
import ManageTermsAndCondition from './ManageTermsAndCondition'
import _ from 'lodash'
import CustomDataGridNoDataFound from "../../components/Helpers/DataGridHelpers/CustomDataGridNoDataFound";
import { IoDocumentTextOutline } from 'react-icons/io5';

let termsTimeout
export default function TermsAndCondition(props) {

    const { termsAndConditionBreadcrumb } = props
    const toastConfig = useContext(CustomToastContext);
    const { state: { permissions } }: any = useData();
    const [data, setData] = useState([]);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [loading, setLoading] = useState(false);
    const [dataRows, setDataRows] = useState([]);
    const [rowCount, setRowCount] = useState(0);
    const [checkAllAccounts, setCheckAllAccounts] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false)
    const [query, setQuery] = useState({ page: 0, limit: 25 });
    const [searchVal, setSearchVal] = useState("");
    const [actionsPermissions, setActionsPermissions] = useState({ isCreate: false, isRead: false, isUpdate: false, isDelete: false, approveAccount: false });
    const [deleteRec, setDeleteRec] = useState<any>({})
    const [editRecord, setEditRecord] = useState<any>({})

    useEffect(() => {
        if (permissions) {
            setActionsPermissions(permissions[termsAndCondition.permission]);
        }
    }, [permissions]);

    useEffect(() => {
        fetchTermsAndConditions()
    }, [query, searchVal])

    useEffect(() => {
        let rows = data?.map((u) => ({
            ...u,
            isChecked: false,
            id: u._id,
        }));
        setDataRows([...rows]);
    }, [data])

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
                            d.isChecked = ev.target.checked
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
            ),
            disableColumnMenu: true,
            sortable: false,
            filterable: false,
            width: 75
        },
        {
            field: "TACName", headerName: "Name", width: 500,
            renderCell: (params) => (
                <Link className={`${styles.terms_name_link}`}
                    style={{ pointerEvents: actionsPermissions.isUpdate ? "" : "none" }}
                    onClick={() => {
                        setShowCreateDialog(true);
                        setEditRecord(_.cloneDeep(params.row))
                    }}>
                    <CustomRenderCell value={params?.value} />
                </Link>
            )
        },
        // {
        //     field: "description ",
        //     headerName: "Description ",
        //     width: 250,
        //     renderCell: (params) => <CustomRenderCell value={params?.value} />
        // },
        {
            field: "actions", headerName: "Actions",
            renderCell: (params) => (
                <>
                    <Tooltip title="Delete">
                        <IconButton aria-label="Delete" onClick={() => {
                            setDeleteRec(params.row);
                            setShowDeleteConfirmBox(true)
                        }}
                            disabled={actionsPermissions.isDelete ? false : true}
                        >
                            <DeleteIcon fontSize="small"
                                color={actionsPermissions.isDelete ? "error" : "disabled"}
                            />
                        </IconButton>
                    </Tooltip >
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

    const fetchTermsAndConditions = () => {
        if (termsTimeout) {
            clearTimeout(termsTimeout);
        }

        termsTimeout = setTimeout(() => {
            setLoading(true);
            let searchParams = searchVal
                ? { ...query, search: searchVal }
                : { ...query };
            let api = getSearchQuery(termsAndCondition.api, searchParams);
            setLoading(true);
            axiosInstance()
                .get(api)
                .then(({ data }) => {
                    setData(data.data);
                    setRowCount(data.count);
                    setCheckAllAccounts(false);
                    setLoading(false);
                })
                .catch((err) => {
                    toastConfig.setToastConfig(err);
                    setLoading(false);
                });
        }, 600);
    }


    // ****** ACTIONS BUTTON STUFF *********
    const openActions = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const closeActions = () => {
        setAnchorEl(null);
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

    const handleDeleteTermsAndConditions = async () => {
        let recs = []
        if (deleteRec?._id) {
            recs.push(deleteRec?._id)
        }
        else {
            dataRows.forEach(obj => {
                if (obj.isChecked) recs.push(obj._id)
            })
        }
        if (recs && recs.length > 0) {
            axiosInstance().put(`${termsAndCondition.api}/remove`, { "ids": [...recs] }).then(({ data }) => {
                toastConfig.setToastConfig({ open: true, type: "success", message: data.message });
                setShowDeleteConfirmBox(false)
                if (deleteRec) setDeleteRec({})
                fetchTermsAndConditions()
            }).catch((error) => {
                toastConfig.setToastConfig(error);
                setShowDeleteConfirmBox(false)
            })
        }
    }

    const handleCloseCreateDialog = (params) => {
        setShowCreateDialog(false)
        setEditRecord({})
        if (params?.fetchData) fetchTermsAndConditions()
    }
    const onFilterChange = useCallback((params) => {
        if (params.filterModel.items[0].value) {
            let deepFilter ;
            switch (params.filterModel.items[0].columnField) {
              case 'createdBy':
                deepFilter = JSON.stringify([{ field: "createdBy.user.concatedName", term: params.filterModel.items[0].value }])
                break;
              case 'updatedBy':
                deepFilter = JSON.stringify([{ field: "updatedBy.user.concatedName", term: params.filterModel.items[0].value }])
                break;
              case 'name':
                deepFilter = JSON.stringify([{ field: "firstName", term: params.filterModel.items[0].value },{ field: "middleName", term: params.filterModel.items[0].value }, { field: "lastName", term: params.filterModel.items[0].value }])
                break;
              default:
                deepFilter = JSON.stringify([{ field: params.filterModel.items[0].columnField, term: params.filterModel.items[0].value }])
            }
            setQuery((prevState) => ({
              ...prevState,
              deepFilter
            }));
        } else {
            setQuery({ page: 0, limit: 25 });
        }
    }, []);
    return (
        <>
            <Layout>
                <CustomBreadCrumbs routes={[termsAndConditionBreadcrumb]} />

                <Box component="div">
                    <CustomContainer>
                        <div className={`${styles["terms_header_inner_container"]}`} >
                            <CustomHeader
                                total={rowCount}
                                heading="Terms and Conditions"
                                secondHeading="Terms and Conditions"
                                icon={<IoDocumentTextOutline className="headerLogo" />}
                            >
                                <div className={`${styles.terms_header} ${styles["terms_header-mobile"]}`} >
                                    <SearchBox
                                        onSearch={handleSearch}
                                        searchbox="terms_header_search_bar"
                                        width="300px" value={searchVal}
                                    />
                                    <div className={`${styles.terms_header_add_btn_action_btn_group}`}>
                                        {
                                            actionsPermissions.isCreate && <Button
                                                variant="contained"
                                                color="primary"
                                                size="small"
                                                className={`${styles.terms_header_add_btn}`}
                                                onClick={() => setShowCreateDialog(true)}
                                                startIcon={<AddOutlined />} >Add</Button>
                                        }

                                        <Button
                                            disabled={dataRows.filter((d) => d.isChecked).length === 0}
                                            variant="outlined"
                                            color="default"
                                            size="small"
                                            className={`${styles.terms_header_action_btn}`}
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
                                                actionsPermissions.isDelete &&
                                                <MenuItem
                                                    onClick={() => {
                                                        closeActions();
                                                        setShowDeleteConfirmBox(true);
                                                    }}>Delete</MenuItem>
                                            }

                                        </Menu>

                                    </div>
                                </div>
                            </CustomHeader>
                        </div>

                        <div className="listing-grid">
                            <DataGrid
                                components={{
                                    Toolbar: CustomDataGridToolbar,
                                    NoRowsOverlay: CustomDataGridNoDataFound,
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
                                onFilterModelChange={onFilterChange}
                                filterMode="server"

                            />
                        </div>
                        {
                            showDeleteConfirmBox ?
                                <ConfirmationDialog
                                    open={showDeleteConfirmBox}
                                    message={`Are you sure, you want to delete selected TermsAndCondition  ${deleteRec?._id ? deleteRec?.TACName : ""} ?`}
                                    onClose={() => setShowDeleteConfirmBox(false)}
                                    onOk={handleDeleteTermsAndConditions}
                                /> : null
                        }
                        {showCreateDialog ? (
                            <ManageTermsAndCondition
                                termsAndCondition={termsAndCondition}
                                open={showCreateDialog}
                                handleClose={handleCloseCreateDialog}
                                fetchData={fetchTermsAndConditions}
                                editRecord={editRecord}
                            />
                        ) : null}
                    </CustomContainer>
                </Box>
            </Layout>

        </>
    )
}
