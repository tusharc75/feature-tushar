import React, { useState, useEffect, Fragment, useContext, useCallback } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Layout from "../../components/Layout";
import Button from '@material-ui/core/Button';
import { useHistory } from "react-router-dom";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import { DataGrid } from "@material-ui/data-grid";
import AddIcon from "@material-ui/icons/Add";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import NoDataCell from "../../components/Helpers/NoDataCell";
import { Link } from 'react-router-dom'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../axios/axiosInstance";
import moment from "moment";
import CustomDataGridNoDataFound from "../../components/Helpers/DataGridHelpers/CustomDataGridNoDataFound";
import { GiAbstract055 } from 'react-icons/gi';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog'
import CustomContainer from "../../components/CustomContainer";
import CreateProductCategory from "./CreateProductCategory";
import routes from "../../components/Helpers/Routes";
import CustomDataGridToolbar from "../../components/Helpers/DataGridHelpers/CustomDataGridToolbar";
import { ExpandMore } from "@material-ui/icons";
import { Menu, MenuItem } from "@material-ui/core";
import SearchBox from '../../components/Helpers/SearchBox'
import { getSearchQuery } from '../../services/util';

const ProductCategory = () => {

    const toastConfig = useContext(CustomToastContext)
    const history = useHistory();
    const [loading, setLoading] = useState(true);
    const [productCategory, setProductCategory] = useState([]);
    const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false)
    const [deleteRecord, setDeleteRecord] = useState(null)
    const [open, setOpen] = useState(false);
    const [productCategoryId, setProductCategoryId] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState([]);
    const [searchVal, setSearchVal] = useState("");
    const [query, setQuery] = useState({ page: 0, limit: 25 });
    const [rowCount, setRowCount] = useState(0);

    useEffect(() => {
        fetchProductCategory()
    }, [query, searchVal])

    const fetchProductCategory = () => {
        let searchParams = searchVal
            ? { ...query, search: searchVal }
            : { ...query };
        let api = getSearchQuery("/product-category", searchParams);
        setLoading(true)
        axiosInstance().get(api).then(({ data }) => {
            setProductCategory(data.data);
            setRowCount(data.count);
            setLoading(false)
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    };

    const handleDelete = () => {
        let ids = []
        if (deleteRecord) {
            ids.push(deleteRecord._id)
        }
        else {
            ids = selectedCategory;
        }
        axiosInstance().put(`/product-category/remove`, { "ids": ids }).then(() => {
            fetchProductCategory();
            setShowDeleteConfirmBox(false)
            setDeleteRecord(null)
            setSelectedCategory([])
            setAnchorEl(null)
        }).catch((error) => {
            toastConfig.setToastConfig(error)
        });
    }

    const columns = [
        { field: 'id', headerName: 'id', hide: true },
        {
            field: "name",
            headerName: "Product Category",
            width: 300,
            renderCell: (params) => (
                <Link className="link" onClick={() => { setProductCategoryId(params.row.id); setOpen(true); }
                } >
                    {params.row.name}
                </Link >
            )
        },
        {
            field: "createdBy",
            headerName: "Created By",
            width: 300,
            disableColumnMenu: true,
            sortable: false,
            filterable: false,
            renderCell: (params) => params?.row && params?.row?.createdBy ? (<h5 className="createBy">
                {params.row.createdBy.user.firstName}
                <span
                    className="createdAtTime badge-date"
                    title={`${params.row.createdBy.user.firstName} • ${moment(
                        params.row.createdBy.date.slice(0, 10)
                    ).format('MMM Do, YYYY')}`}
                >
                    {moment(params.row.createdBy.date.slice(0, 10)).format(
                        'MMM Do, YYYY'
                    )}
                </span>
            </h5>) : <NoDataCell />
        },
        {
            field: "updatedBy",
            headerName: "Updated By",
            width: 300,
            disableColumnMenu: true,
            sortable: false,
            filterable: false,
            renderCell: (params) => params?.row && params?.row?.updatedBy && params?.row?.updatedBy?.user ? (<h5 className="createBy">
                {params.row.updatedBy.user.firstName}
                <span
                    className="updatedAtTime badge-date"
                    title={`${params.row.updatedBy.user.firstName} • ${moment(
                        params.row.updatedBy.date.slice(0, 10)
                    ).format('MMM Do, YYYY')}`}
                >
                    {moment(params.row.updatedBy.date.slice(0, 10)).format(
                        'MMM Do, YYYY'
                    )}
                </span>
            </h5>) : <NoDataCell />
        },
        {
            field: "actions", headerName: "Actions ",
            renderCell: (params) => (
                <Fragment>
                    <Tooltip title="Delete" >
                        <IconButton aria-label="Delete" onClick={() => { setDeleteRecord(params.row); setShowDeleteConfirmBox(true) }}  >
                            <DeleteIcon fontSize="small" color="error" />
                        </IconButton>
                    </Tooltip >
                </Fragment>
            ),
            width: 200,
            disableColumnMenu: true,
            sortable: false,
            filterable: false,
        }
    ];

    const openActions = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const closeActions = () => {
        setAnchorEl(null);
    };

    const handleSearch = (e) => {
        if (query.page !== 1) {
            setQuery((prevState) => ({ ...prevState, page: 0 }));
        }
        setSearchVal(e.target.value);
    };

    const onFilterChange = useCallback((params) => {
        if (params.filterModel.items[0].value) {
            setQuery((prevState) => ({
                ...prevState,
                [params.filterModel.items[0].columnField]:
                    params.filterModel.items[0].value,
            }));
        } else {
            setQuery({ page: 0, limit: 25 });
        }
    }, []);

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


    return (<Layout>
        <Grid container>
            <Grid item md={12} sm={12} xs={12}>
                <CustomBreadCrumbs routes={[{ title: routes.productCategory.title }]} />
            </Grid>
        </Grid>
        <CustomContainer>
            <div className="header-panel">
                <Grid container>
                    <Grid item md={6} sm={12} xs={12} className="d-flex align-items-center gap-1">
                        <GiAbstract055 /> <span className="listingHeader">{routes.productCategory.title}</span>
                    </Grid>
                    <Grid md={6} sm={12} xs={12} container justify="flex-end">
                        <SearchBox
                            onSearch={handleSearch}
                            searchbox="terms_header_search_bar"
                            width="300px"
                            value={searchVal}
                        />
                        <Button className="ml-2 mr-2" onClick={() => { setProductCategoryId(null); setOpen(true); }} variant="contained" size="small" color="primary" startIcon={<AddIcon />}>Add</Button>
                        <Button
                            variant="outlined"
                            color="default"
                            size="small"
                            onClick={openActions}
                            disabled={selectedCategory.length ? false : true}
                            aria-controls="action-menu"
                        >Actions <ExpandMore />
                        </Button>
                        <Menu
                            anchorEl={anchorEl}
                            keepMounted
                            getContentAnchorEl={null}
                            anchorOrigin={{
                                vertical: "bottom",
                                horizontal: "left",
                            }}
                            id="action-menu"
                            open={Boolean(anchorEl)}
                            onClose={closeActions}
                        >
                            <MenuItem onClick={() => setShowDeleteConfirmBox(true)}>Delete</MenuItem>
                        </Menu>
                    </Grid>
                </Grid>
            </div>
            <div className="listing-grid">
                <DataGrid
                    checkboxSelection
                    components={{
                        Toolbar: CustomDataGridToolbar,
                        NoRowsOverlay: CustomDataGridNoDataFound,
                    }}
                    scrollbarSize={20}
                    loading={loading}
                    onSelectionModelChange={(e) => setSelectedCategory(e.selectionModel)}
                    rows={loading ? [] : productCategory}
                    disableSelectionOnClick
                    disableMultipleSelection
                    columns={columns}
                    pageSize={query.limit}
                    rowCount={rowCount}
                    page={query.page}
                    paginationMode="server"
                    pagination
                    onPageChange={handlePage}
                    onPageSizeChange={handlePageSize}
                    onSortModelChange={handleSortModelChange}
                    density="compact"
                    onFilterModelChange={onFilterChange}
                />
            </div>
            {showDeleteConfirmBox &&
                <ConfirmationDialog
                    open={showDeleteConfirmBox}
                    message={`Are you sure, you want to delete product category  ${deleteRecord?._id ? deleteRecord?.name : ""}  ?`}
                    onClose={() => setShowDeleteConfirmBox(false)}
                    onOk={handleDelete}
                />
            }
            {open && <CreateProductCategory productCategoryId={productCategoryId} handleClose={() => { setOpen(false); fetchProductCategory() }} />}
        </CustomContainer>
    </Layout>
    );
}

export default ProductCategory;
