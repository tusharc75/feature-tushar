import { useState, useEffect, useContext, useReducer } from "react";
import Grid from '@material-ui/core/Grid';
import Layout from "../../components/Layout";
import Button from '@material-ui/core/Button';
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import AddIcon from "@material-ui/icons/Add";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import { Link } from 'react-router-dom'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../axios/axiosInstance";
import CreateProduct from "../../components/Product/CreateProduct";
import { GiAbstract055 } from 'react-icons/gi';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog'
import { ExpandMore } from "@material-ui/icons";
import { Box, Menu, MenuItem } from "@material-ui/core";
import SearchBox from '../../components/Helpers/SearchBox'
import styles from "../Leads/Header.module.scss";
import routes from "../../components/Helpers/Routes";
import ImportExportLinks from "../../components/Product/ImportExportLinks";
import CustomAgGrid, { reducer, intialState } from "../../components/AgGridComponents/CustomAgGrid";
import { product, isObjectEmpty } from '../../constants/helpers';
import CustomRenderCell from '../../components/Helpers/CustomRenderCell'
import {
    CommonRenderer,
    CreatedByRenderer,
    UpdatedByRenderer
} from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import NoDataCell from "../../components/Helpers/NoDataCell";
import { useData } from "../../StateProvider/Provider";
import { sortBy } from 'lodash';

const ignoreField = ["qty"]

var levalOrderBy = [
    "product",
    "product-custom",
    "product-template",
    "price-template",
    "product-builder-custom",
    "price-builder-custom",
];

const Product = () => {

    const toastConfig = useContext(CustomToastContext)
    const [open, setOpen] = useState(false);
    const [productId, setProductId] = useState(null);
    const [isClone, setIsClone] = useState(false);
    const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false)
    const [deleteRecord, setDeleteRecord] = useState(null)
    const [anchorEl, setAnchorEl] = useState(null);
    const [columns, setColumns] = useState(null);
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

    const {
        state: { permissions },
      }: any = useData();
      
    useEffect(() => {
        fetchProduct()
    }, [page, limit, filters, sorting, search]);



    const fetchProduct = () => {

        if (gridApi) {
            gridApi.setRowData([]);
            gridApi.showLoadingOverlay();
        }

        const queryString = getQueryString();
        dispatch({ type: "loading", loading: true });
        axiosInstance().get(`${product.api}${queryString}`).then(({ data }) => {
            data.data = data.data?.map((u) => ({
                ...u,
                id: u._id,
                createdBy: u.createdBy?.user?.concatedName,
                createdByDate: u.createdBy?.date,
                updatedBy: u.updatedBy?.user?.concatedName,
                updatedByDate: u.updatedBy?.date,
            }));
            let column = []
            data.data.forEach((row) => {
                row.fields.forEach((ele) => {
                    if (ignoreField.includes(ele.fieldName)) {
                    }
                    else if (ele.type === "converter" || ele.type === "currencyAmount" || ele.isConverter === true) {
                        if (ele.type !== "currencyAmount" && (ele.type === "converter" || ele.isConverter === true)) {
                            ele.displayUnits.forEach((_unit) => {
                                let fieldName = ele.fieldName + "_" + _unit.toLowerCase()
                                let fieldLabel = ele.fieldLabel + " " + _unit
                                if (column.filter((_c) => _c.field === fieldName && _c.headerName === fieldLabel).length === 0) {
                                    let col: any = {}
                                    col.field = fieldName
                                    col.headerName = fieldLabel
                                    col.width = 180
                                    col.show = true
                                    col.cellRenderer = "commonRenderer"
                                    col.leval = ele.leval
                                    column.push(col)
                                }
                            })
                        }
                        else if (ele.type === "currencyAmount" && (ele.type === "converter" || ele.isConverter === true)) {
                            ele.displayUnits.forEach((_unit) => {
                                ele.displayCurrency.forEach((_currency) => {
                                    let fieldName = ele.fieldName + "_" + _currency.toLowerCase() + "_" + _unit.toLowerCase()
                                    let fieldLabel = ele.fieldLabel + " " + _unit + "/" + _currency
                                    if (column.filter((_c) => _c.field === fieldName && _c.headerName === fieldLabel).length === 0) {
                                        let col: any = {}
                                        col.field = fieldName
                                        col.headerName = fieldLabel
                                        col.width = 180
                                        col.show = true
                                        col.cellRenderer = "commonRenderer"
                                        col.leval = ele.leval
                                        column.push(col)
                                    }
                                })
                            })
                        }
                        else if (ele.type === "currencyAmount") {
                            ele.displayCurrency.forEach((_currency) => {
                                let fieldName = ele.fieldName + "_" + _currency.toLowerCase()
                                let fieldLabel = ele.fieldLabel + " " + _currency
                                if (column.filter((_c) => _c.field === fieldName && _c.headerName === fieldLabel).length === 0) {
                                    let col: any = {}
                                    col.field = fieldName
                                    col.headerName = fieldLabel
                                    col.width = 180
                                    col.show = true
                                    col.cellRenderer = "commonRenderer"
                                    col.leval = ele.leval
                                    column.push(col)
                                }
                            })
                        }
                    }
                    else {
                        if (column.filter((_c) => _c.field === ele.fieldName && _c.headerName === ele.fieldLabel).length === 0) {
                            let col: any = {};
                            col.field = ele.fieldName;
                            col.headerName = ele.fieldLabel;
                            col.width = 180;
                            col.show = true
                            if (ele.fieldName === "description") {
                                col.cellRenderer = "productNameRenderer"
                            }
                            if (ele.fieldName === "productCategory") {
                                col.cellRenderer = "productCategoryRenderer"
                            }
                            if (ele.fieldName === "priceTemplate") {
                                col.cellRenderer = "priceTemplateRenderer"
                            }
                            col.order = ele.order;
                            col.leval = ele.leval;
                            column.push(col);
                        }
                    }
                })
            });
            column = sortBy(column, function (item: any) {
                return levalOrderBy.indexOf(item.leval)
            });
            if (column.length) {
                column.push(
                    { field: "createdBy", headerName: "Created By", show: true, cellRenderer: "createdByRenderer", leval: "price-builder-custom" },
                    { field: "updatedBy", headerName: "Updated By", show: true, cellRenderer: "updatedByRenderer", leval: "price-builder-custom" },
                )
            }
            setColumns(column);
            dispatch({ type: "initialize", data: data.data, count: data.count });
            dispatch({ type: "loading", loading: false });
        }).catch((error) => {
            toastConfig.setToastConfig(error);
            dispatch({ type: "loading", loading: false });
        });
    };

    const getQueryString = () => {
        let deepFilter = `?page=${page}&limit=${limit}`;

        if (!isObjectEmpty(filters)) {
            const updatedFilters = [];

            Object.keys(filters).map(field => {
                updatedFilters.push({
                    field: replaceFieldName(field),
                    term: filters[field].filter
                })
            });
            deepFilter = `${deepFilter}&deepFilter=${JSON.stringify(updatedFilters)}&filterType=and`
        }

        if (sorting.length > 0) {
            deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`
        }

        if (search) {
            deepFilter = `${deepFilter}&search=${search}`;
        }

        return deepFilter;
    };

    const handleDelete = () => {
        let ids = []
        if (deleteRecord) {
            ids.push(deleteRecord._id)
        }
        else {
            ids = selectedRecords.map(d => d._id);
        }
        axiosInstance().put(`/product/remove`, { "ids": ids }).then(() => {
            fetchProduct();
            setShowDeleteConfirmBox(false)
            setDeleteRecord(null)
            setAnchorEl(null)
        }).catch((error) => {
            toastConfig.setToastConfig(error)
        });
    }


    const ProductNameRenderer = params => (
        <Link className="link"
            onClick={() => {
                OpenProduct(params.data._id);
                setIsClone(false)
            }}>
            <CustomRenderCell value={params?.value} />
        </Link>
    )

    const ActionsRenderer = params => (
        <>
            <Tooltip title="Clone">
                <IconButton
                    size="small"
                    aria-label="Clone"
                    onClick={() => { OpenProduct(params.data._id); setIsClone(true) }}
                >
                    <FileCopyIcon color="primary" />
                </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
                <IconButton size="small" aria-label="Delete" onClick={() => {
                    setDeleteRecord(params.data);
                    setShowDeleteConfirmBox(true)
                }} >
                    <DeleteIcon color="error" />
                </IconButton>
            </Tooltip >
        </>
    )

    const ProductCategoryRenderer = params => <>
        {
            params.data.productCategory || params.data.productCategory === 0 ?
                typeof params.data.productCategory === 'object' ? params.data.productCategory["optionLabel"] : params.data.productCategory
                : <NoDataCell />
        }
    </>
    const PriceTemplateRenderer = params => <>
        {
            params.data.priceTemplate || params.data.priceTemplate === 0 ?
                typeof params.data.priceTemplate === 'object' ? params.data.priceTemplate["optionLabel"] : params.data.priceTemplate
                : <NoDataCell />
        }
    </>

    const handleSearch = (e) => {
        dispatch({ type: "search", search: e.target.value });
    };

    const OpenProduct = (_id) => {
        setProductId(_id)
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

    const frameworkComponents = {
        productNameRenderer: ProductNameRenderer,
        createdByRenderer: CreatedByRenderer,
        updatedByRenderer: UpdatedByRenderer,
        actionsRenderer: ActionsRenderer,
        commonRenderer: CommonRenderer,
        productCategoryRenderer: ProductCategoryRenderer,
        priceTemplateRenderer: PriceTemplateRenderer,
    };

    const replaceFieldName = (field) => {
        switch (field) {
            case "createdBy":
                return "createdBy.user.concatedName";

            case "updatedBy":
                return "updatedBy.user.concatedName";

            default:
                return field;
        }
    };

    return (<Layout>
        <Grid container className="headerbox">
            <Grid item md={4} sm={11} xs={10}>
                <CustomBreadCrumbs routes={[{ title: routes.product.title }]} />
            </Grid>
            <Grid item md={8} sm={1} xs={2}>
                <ImportExportLinks
                    permissions={permissions.product}
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
                <Grid container className={styles.filter_side_container}>
                    <Grid item xs={6} className="d-flex align-items-center gap-1">
                        <GiAbstract055 className="headerLogo" /> <span className="listingHeader">{routes.product.title} </span>
                    </Grid>
                    <Grid xs={6} container className={styles.filter_side} >
                        <Box className={styles.filter_side_header} component="div" >

                            <SearchBox
                                onSearch={handleSearch}
                                searchbox={styles.search_box_input}
                                width="242px"
                                size="small"
                                value={search}
                            />
                            <Button className={styles.add_submit_btn} onClick={() => OpenProduct(null)} variant="contained" size="small" color="primary" startIcon={<AddIcon />}>Add</Button>
                            <Button
                                className={styles.action_submit_btn}
                                variant="outlined"
                                color="default"
                                size="small"
                                onClick={openActions}
                                disabled={selectedRecords.length ? false : true}
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
                        </Box>
                    </Grid>
                </Grid>
            </div>
            {columns ?
                <CustomAgGrid
                    columns={columns}
                    dataRows={dataRows}
                    frameworkComponents={frameworkComponents}
                    setGridApi={setGridApi}
                    dispatch={dispatch}
                    rowCount={rowCount}
                    limit={limit}
                    pageSizes={pageSizes}
                    page={page}
                    actionWidth={150}
                />
                : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>}
        </div>
        {open && <CreateProduct isClone={isClone} productId={productId} handleClose={handleClose} openFrom="productMaster" />}
        {showDeleteConfirmBox &&
            <ConfirmationDialog
                open={showDeleteConfirmBox}
                message={`Are you sure you want to delete the product ${deleteRecord?._id ? deleteRecord?.productName : ""} ?`}
                onClose={() => setShowDeleteConfirmBox(false)}
                onOk={handleDelete}
            />
        }
    </Layout>
    );
}

export default Product;
