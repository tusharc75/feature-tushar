import { useState, useEffect, Fragment, useContext, useCallback } from "react";
import Grid from '@material-ui/core/Grid';
import Layout from "../../components/Layout";
import Button from '@material-ui/core/Button';
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import { DataGrid } from "@material-ui/data-grid";
import AddIcon from "@material-ui/icons/Add";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import { Link } from 'react-router-dom'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../axios/axiosInstance";
import CreateProduct from "../../components/Product/CreateProduct";
import moment from "moment";
import NoDataCell from "../../components/Helpers/NoDataCell";
import { GiAbstract055 } from 'react-icons/gi';
import CustomDataGridNoDataFound from "../../components/Helpers/DataGridHelpers/CustomDataGridNoDataFound";
import FileCopyIcon from '@material-ui/icons/FileCopy';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog'
import CustomDataGridToolbar from "../../components/Helpers/DataGridHelpers/CustomDataGridToolbar";
import { ExpandMore } from "@material-ui/icons";
import { Menu, MenuItem } from "@material-ui/core";
import SearchBox from '../../components/Helpers/SearchBox'
import { getSearchQuery } from '../../services/util';
import routes from "../../components/Helpers/Routes";
import ImportExportLinks from "../../components/Product/ImportExportLinks";

const Product = () => {
    const toastConfig = useContext(CustomToastContext)
    const [loading, setLoading] = useState(true);
    const [product, setProduct] = useState([]);
    const [open, setOpen] = useState(false);
    const [productId, setProductId] = useState(null);
    const [isClone, setIsClone] = useState(false);
    const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false)
    const [deleteRecord, setDeleteRecord] = useState(null)
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState([]);
    const [searchVal, setSearchVal] = useState("");
    const [query, setQuery] = useState({ page: 0, limit: 25 });
    const [rowCount, setRowCount] = useState(0);

    useEffect(() => {
        fetchProduct()
    }, [query, searchVal])

    const fetchProduct = () => {
        let searchParams = searchVal
            ? { ...query, search: searchVal }
            : { ...query };
        let api = getSearchQuery("/product", searchParams);
        setLoading(true)
        axiosInstance().get(api).then(({ data }) => {
            data.data = data.data?.map((u) => ({
                ...u,
                id: u._id,
            }));
            setProduct(data.data);
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
            ids = selectedProduct;
        }
        setLoading(true)
        axiosInstance().put(`/product/remove`, { "ids": ids }).then(() => {
            fetchProduct();
            setShowDeleteConfirmBox(false)
            setDeleteRecord(null)
            setSelectedProduct([])
            setAnchorEl(null)
        }).catch((error) => {
            toastConfig.setToastConfig(error)
        });
    }

    const columns = [
        { field: 'id', headerName: 'id', hide: true },
        {
            field: "productName",
            headerName: "Product Name",
            width: 300,
            renderCell: (params) => (
                <Link className="link" onClick={() => { OpenProduct(params.row.id); setIsClone(false) }}  >
                    {params.row.productName}
                </Link>
            )
        },
        {
            field: "productCategory",
            headerName: "Product Category",
            width: 250,
            renderCell: (params) => (params.row.productCategory?.optionLabel)
        },
        {
            field: "productTemplate",
            headerName: "Product Template",
            width: 250,
            renderCell: (params) => (params.row.productTemplate?.optionLabel)
        },
        {
            field: "createdBy",
            headerName: "Created By",
            width: 200,
            disableColumnMenu: true,
            sortable: false,
            filterable: false,
            renderCell: (params: any) =>
                params?.value && params?.value?.user ? (
                    <h5 className="createBy">
                        {params?.value?.user?.firstName}
                        <span
                            className="createdAtTime badge-date"
                            title={`${params?.value?.user?.firstName} • ${moment(
                                params?.value?.date?.slice(0, 10)
                            ).format("MMM Do, YYYY")}`}
                        >
                            {moment(params?.value?.date?.slice(0, 10)).format("MMM Do, YYYY")}
                        </span>
                    </h5>
                ) : (
                    <NoDataCell />
                ),
        },
        {
            field: "updatedBy",
            headerName: "Updated By",
            width: 200,
            renderCell: (params: any) =>
                params?.value && params?.value?.user ? (
                    <h5 className="updateBy">
                        {params.value.user.firstName}
                        <span
                            className="updatedAtTime badge-date"
                            title={`${params.value.user.firstName} • ${moment(
                                params.value.date.slice(0, 10)
                            ).format("MMM Do, YYYY")}`}
                        >
                            {moment(params.value.date.slice(0, 10)).format("MMM Do, YYYY")}
                        </span>
                    </h5>
                ) : (
                    <NoDataCell />
                )
        },
        {
            field: "description",
            headerName: "Description",
            width: 300,
            renderCell: (params) => (params.row.description)
        },
        {
            field: "actions", headerName: "Actions ",
            renderCell: (params) => (
                <Fragment>
                    <Tooltip title="Clone">
                        <IconButton aria-label="Clone" onClick={() => { OpenProduct(params.row._id); setIsClone(true) }}>
                            <FileCopyIcon fontSize="small" color="primary" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete" >
                        <IconButton aria-label="Delete" onClick={() => { setDeleteRecord(params.row); setShowDeleteConfirmBox(true) }} >
                            <DeleteIcon fontSize="small" color="error" />
                        </IconButton>
                    </Tooltip >
                </Fragment>
            ),
            width: 100,
            disableColumnMenu: true,
            sortable: false,
            filterable: false,
        }
    ];

    const OpenProduct = (id) => {
        setProductId(id)
        setOpen(true)
    }

    const handleClose = () => {
        setProductId(null)
        setOpen(false)
        fetchProduct();
    }

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
        <Grid container className="headerbox">
            <Grid item md={4} sm={11} xs={10}>
                <CustomBreadCrumbs routes={[{ title: routes.product.title }]} />
            </Grid>
            <Grid item md={8} sm={1} xs={2}>
                <ImportExportLinks
                    module="product(s)"
                    api={"product"}
                    refrenceId={null}
                    onSuccessfulImport={(isImportedSuccessfully) => {
                        if (isImportedSuccessfully) {
                            fetchProduct();
                        }
                    }}
                />
            </Grid>
        </Grid>
        <div className="main-container">
            <div className="header-panel">
                <Grid container>
                    <Grid item md={6} sm={12} xs={12} className="d-flex align-items-center gap-1">
                        <GiAbstract055 className="headerLogo" /> <span className="listingHeader">{routes.product.title} </span>
                    </Grid>
                    <Grid md={6} sm={12} xs={12} container justify="flex-end">
                        <SearchBox
                            onSearch={handleSearch}
                            searchbox="terms_header_search_bar"
                            width="300px"
                            value={searchVal}
                        />
                        <Button className="ml-2 mr-2" onClick={() => OpenProduct(null)} variant="contained" size="small" color="primary" startIcon={<AddIcon />}>Add</Button>
                        <Button
                            variant="outlined"
                            color="default"
                            size="small"
                            onClick={openActions}
                            disabled={selectedProduct.length ? false : true}
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
                    onSelectionModelChange={(e) => setSelectedProduct(e.selectionModel)}
                    rows={loading ? [] : product}
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
        </div>
        {open && <CreateProduct isClone={isClone} productId={productId} handleClose={handleClose} />}
        {showDeleteConfirmBox &&
            <ConfirmationDialog
                open={showDeleteConfirmBox}
                message={`Are you sure, you want to delete product ${deleteRecord?._id ? deleteRecord?.productName : ""} ?`}
                onClose={() => setShowDeleteConfirmBox(false)}
                onOk={handleDelete}
            />
        }
    </Layout>
    );
}

export default Product;
