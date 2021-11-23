import { useState, useEffect, useContext, useReducer, Fragment } from "react";
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import AddIcon from "@material-ui/icons/Add";
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import { Link, useHistory } from 'react-router-dom'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../axios/axiosInstance";
import CreateProduct from "../../components/Product/CreateProduct";
import { RiShoppingBag3Fill } from 'react-icons/ri';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog'
import { ExpandMore } from "@material-ui/icons";
import { Box, Menu, MenuItem } from "@material-ui/core";
import SearchBox from '../../components/Helpers/SearchBox'
import styles from "../Leads/Header.module.scss";
import routes from "../../components/Helpers/Routes";
import ImportExportLinks from "../../components/Product/ImportExportLinks";
import CustomAgGrid, { reducer, intialState } from "../../components/AgGridComponents/CustomAgGrid";
import { product, isObjectEmpty, gridLoadingTimeout } from '../../constants/helpers';
import {
    CommonRenderer
} from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import NoDataCell from "../../components/Helpers/NoDataCell";
import { useData } from "../../StateProvider/Provider";
import { sortBy } from 'lodash';
import { RiBillLine } from "react-icons/ri";
import { Autocomplete } from "@material-ui/lab";
import TextField from "@material-ui/core/TextField";
import {
    getColumnData, getStaticFields, getFrameworkComponents,
    getColumnHiddenStatus, getSortedColumns
} from "../../constants/columns"
import { prepareDataForGrid } from "../../constants/helpers";
import Tooltip from '@material-ui/core/Tooltip'

const ignoreField = ["qty", "priceTemplate"]

var levalOrderBy = [
    "product",
    "product-custom",
    "product-template",
    "price-template",
    "product-builder-custom",
    "price-builder-custom",
];


const Product = () => {

    const history = useHistory();
    const toastConfig = useContext(CustomToastContext)
    const [open, setOpen] = useState(false);
    const [productId, setProductId] = useState(null);
    const [isClone, setIsClone] = useState(false);
    const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false)
    const [deleteRecord, setDeleteRecord] = useState(null)
    const [anchorEl, setAnchorEl] = useState(null);

    const [productColoums, setProductColoums] = useState([]);
    const [productRendererNames, setProductRendererNames] = useState([]);
    const [columns, setColumns] = useState(null);
    const [frameWorkComponent, setFrameWorkComponent] = useState(null)

    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

    const [productCategoryList, setProductCategoryList] = useState([]);
    const [productTemplateList, setProductTemplateList] = useState([]);
    const [productCategory, setProductCategory] = useState(null);
    const [productTemplate, setProductTemplate] = useState(null);
    const [isProductTemplate, setIsProductTemplate] = useState(true);

    const { state: { permissions, user, selectedEntity } }: any = useData();
    // const {getColumnData} = useColumns();
    const [productPermissions, setProductPermissions] = useState({
        isCreate: false,
        isUpdate: false,
        isRead: false,
        isDelete: false,
    });

    useEffect(() => {
        axiosInstance().get("/product-category?sortBy=name&orderBy=asc").then(({ data: { data } }) => {
            setProductCategoryList(data)
        })
    }, [])

    useEffect(() => {
        if (isProductTemplate) {
            if (productCategory && productCategory !== "") {
                axiosInstance().post(`/product-template/template/` + productCategory, { entity: null }).then(({ data: { data } }) => {
                    setProductTemplateList(data.data)
                    setProductTemplate(null);
                })
            }
            else {
                setProductTemplateList([])
                setProductTemplate(null);
            }
        }
    }, [productCategory])

    useEffect(() => {
        if (permissions && permissions.product) {
            setProductPermissions(permissions.product);
        }
    }, [permissions]);

    useEffect(() => {
        if (productColoums && productColoums.length) {
            fetchProduct()
        }
    }, [page, limit, filters, sorting, search, selectedEntity, productColoums, productCategory, productTemplate]);

    useEffect(() => {
        axiosInstance().get("/field?resource=Product").then(({ data: { data } }) => {
            if (data.filter((e) => e.fieldData.fieldName === "productTemplate").length === 0) {
                setIsProductTemplate(false)
            }
            let columns = []
            let rendererNames = []
            data.forEach(o => {
                if (!ignoreField.includes(o?.fieldData.fieldName)) {
                    if (o?.fieldData?.fieldName === "productName") {
                        columns = [...columns, {
                            pivotIndex: 0,
                            field: o?.fieldData?.fieldName,
                            headerName: o?.fieldData?.fieldLabel,
                            show: true,
                            disabled: true,
                            primaryField: true,
                            cellRenderer: 'productNameRenderer'
                        }]
                    }
                    else {
                        let currentColumn = getColumnData(routes.product.title, o?.fieldData, routes.product.path, true)
                        if (currentColumn !== null) {
                            columns = [...columns, currentColumn?.columnData]
                            if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
                                rendererNames.push(currentColumn?.rendererName)
                            }
                        }
                    }
                }
            })
            columns.forEach((ele) => {
                ele.leval = "product"
            })
            setProductRendererNames(rendererNames);
            setProductColoums(columns);
        })
    }, [])

    const fetchProduct = () => {
        dispatch({ type: "loading", loading: true });
        if (gridApi) {
            gridApi.setRowData([]);
        }
        const queryString = getQueryString();
        axiosInstance().get(`${product.api}${queryString}`).then(({ data }) => {
            let rows = data.data.map((item) => {
                let res = {
                    ...prepareDataForGrid(item),
                };
                return res;
            });
            let columns = [...productColoums]
            let rendererNames = [...productRendererNames]
            data.productTemplate?.forEach((ele) => {
                GenrateColoum(ele.fields, columns, rendererNames)
            })

            columns.push({ field: "inventoryCount", headerName: "Inventory Count", show: getColumnHiddenStatus(routes.product.title, "inventoryCount"), cellRenderer: "commonRenderer", leval: "price-builder-custom" })
            columns.push({ field: "warehouses", headerName: "Plants", show: getColumnHiddenStatus(routes.product.title, "warehouses"), cellRenderer: "commonRenderer", leval: "price-builder-custom" })
            columns = sortBy(columns, function (item: any) {
                return levalOrderBy.indexOf(item.leval)
            });
            let tempFrameworkComponent = getFrameworkComponents(rendererNames, true)
            tempFrameworkComponent = {
                ...tempFrameworkComponent,
                commonRenderer: CommonRenderer,
                productNameRenderer: ProductNameRenderer,
                actionsRenderer: ActionsRenderer
            }
            setFrameWorkComponent({ ...tempFrameworkComponent })
            columns = [...columns, ...getStaticFields()]
            setColumns([...columns])
            dispatch({ type: "initialize", data: rows, count: data.count });
            setTimeout(() => { dispatch({ type: "loading", loading: false }); }, gridLoadingTimeout);
        }).catch((error) => {
            toastConfig.setToastConfig(error);
            dispatch({ type: "loading", loading: false });
        });
    };

    const GenrateColoum = (fields, column, rendererNames) => {
        fields.forEach((ele) => {
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
                            col.leval = "product-template"
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
                                col.leval = "product-template"
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
                            col.leval = "product-template"
                            column.push(col)
                        }
                    })
                }
            }
            else {
                if (column.filter((_c) => _c.field === ele.fieldName && _c.headerName === ele.fieldLabel).length === 0) {
                    let currentColumn: any = getColumnData(routes.product.title, ele, routes.product.path, true)
                    column.push({ ...currentColumn.columnData, leval: "product-template" });
                    if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
                        rendererNames.push(currentColumn?.rendererName)
                    }
                }
            }
        })
    }

    const getQueryString = () => {
        let deepFilter = `?page=${page}&limit=${limit}`;
        if (selectedEntity) {
            deepFilter = `${deepFilter}&entity=${selectedEntity}`;
        }
        if (!isObjectEmpty(filters)) {
            const updatedFilters = [];
            Object.keys(filters).forEach(field => {
                updatedFilters.push({
                    field: replaceFieldName(field),
                    term: filters[field].filter
                })
            });
            deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}&filterType=and`
        }
        if (sorting.length > 0) {
            deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`
        }
        if (search) {
            deepFilter = `${deepFilter}&search=${search}`;
        }
        const filterById = []
        if (productCategory && productCategory !== "") {
            filterById.push({ field: 'productCategory', term: productCategory });
        }
        if (productTemplate && productTemplate !== "") {
            filterById.push({ field: 'productTemplate', term: productTemplate });
        }
        if (filterById.length) {
            deepFilter = deepFilter + '&filterById=' + JSON.stringify(filterById) + "&filterType=and"
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
        <Link className="link text-truncate" title={params?.data?.productDescription} to={`${routes.productDetail.path}/${params.data._id}`}>
            {params?.data?.productDescription ?? params?.data?.productName}
        </Link>
    )

    const ActionsRenderer = params => (
        <>
            {productPermissions.isCreate ?
                <Tooltip title="Clone">
                    <IconButton
                        size="small"
                        aria-label="Clone"
                        onClick={() => { OpenProduct(params.data._id); setIsClone(true) }}
                    >
                        <FileCopyIcon color="primary" fontSize="small" />
                    </IconButton>
                </Tooltip> :
                <Tooltip className="cursor-stop" title="You do not have permission to create an product">
                    <IconButton aria-label="Clone" size="small">
                        <FileCopyIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            }
            {
                productPermissions.isDelete && (params?.data?.createdById == user?.user?._id) ?
                    <Tooltip title="Delete">
                        <IconButton size="small" aria-label="Delete"
                            onClick={() => {
                                setDeleteRecord(params.data);
                                setShowDeleteConfirmBox(true)
                            }} >
                            <DeleteIcon color="error" />
                        </IconButton>
                    </Tooltip > :
                    <Tooltip className="cursor-stop" title="You do not have permission to delete an product">
                        <IconButton aria-label="Delete" size="small">
                            <DeleteIcon />
                        </IconButton>
                    </Tooltip>
            }

            {productPermissions.isRead && (process.env.REACT_APP_ENV !== 'staging') ?
                <Tooltip title="BOM">
                    <IconButton size="small" aria-label="View BOM" onClick={() => {
                        history.push(`${routes.productDetail.path}/${params.data._id}/bom`, { productName: params.data.productName })
                    }} >
                        <RiBillLine color="primary" />
                    </IconButton>
                </Tooltip > : null
            }
        </>
    )

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

    return (<Fragment>
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
                    isExportAllOrSomeFeature={true}
                    total={rowCount}
                    recordsToExport={selectedRecords.length}
                    ids={selectedRecords.length ? selectedRecords.map((obj) => obj._id) : []}
                    onExportToExcelSuccess={() => {
                        if (gridApi) gridApi.deselectAll()
                        else fetchProduct()
                    }}
                />
            </Grid>
        </Grid>
        <div className="main-container">
            <div className="header-panel">
                <Grid container className={styles.filter_side_container}>
                    <Grid item xs={6} className="d-flex align-items-center gap-1">
                        <RiShoppingBag3Fill size={22} style={{ paddingBottom: "3px" }} className="headerLogo" /> <span className="listingHeader">{routes.product.title} </span>
                        <Autocomplete
                            style={{ width: "250px" }}
                            options={productCategoryList}
                            getOptionLabel={(option: any) => option ? option.name : ""}
                            getOptionSelected={(option: any, val) =>
                                option._id === val
                            }
                            value={productCategoryList.filter((data) => data._id === productCategory).length
                                ? productCategoryList.filter((data) => data._id === productCategory)[0]
                                : ""
                            }
                            onChange={(e, val) => {
                                setProductCategory(val && val._id ? val._id : "")
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    margin="dense"
                                    name="productCategory"
                                    label="Product Category"
                                    variant="outlined"
                                    fullWidth
                                />
                            )}
                        />
                        {isProductTemplate &&
                            <Autocomplete
                                style={{ width: "250px" }}
                                options={productTemplateList}
                                getOptionLabel={(option: any) => option ? option.optionLabel : ""}
                                getOptionSelected={(option: any, val) =>
                                    option.optionValue === val
                                }
                                value={productTemplateList.filter((data) => data.optionValue === productTemplate).length
                                    ? productTemplateList.filter((data) => data.optionValue === productTemplate)[0]
                                    : ""
                                }
                                onChange={(e, val) => {
                                    setProductTemplate(val && val.optionValue ? val.optionValue : "")
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        margin="dense"
                                        name="productTemplate"
                                        label="Product Template"
                                        variant="outlined"
                                        fullWidth
                                    />
                                )}
                            />}
                    </Grid>
                    <Grid item xs={6}>
                        <Grid container className={styles.filter_side} >
                            <Box className={styles.filter_side_header} component="div" >
                                <SearchBox
                                    onSearch={handleSearch}
                                    searchbox={styles.search_box_input}
                                    width="242px"
                                    size="small"
                                    value={search}
                                />
                                {productPermissions.isCreate &&
                                    <Button className={styles.add_submit_btn} onClick={() => OpenProduct(null)} variant="contained" size="small" color="primary" startIcon={<AddIcon />}>Add</Button>
                                }
                                {productPermissions.isDelete &&
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
                                }
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
                </Grid>
            </div>
            {columns && frameWorkComponent ?
                <CustomAgGrid
                    columns={columns}
                    dataRows={dataRows}
                    frameworkComponents={frameWorkComponent}
                    setGridApi={setGridApi}
                    dispatch={dispatch}
                    rowCount={rowCount}
                    limit={limit}
                    pageSizes={pageSizes}
                    page={page}
                    actionWidth={150}
                    loading={loading}
                    renderedFrom={routes.product.title}
                    refreshGrid={fetchProduct}
                />
                : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>}
        </div>
        {open &&
            <CreateProduct
                isClone={isClone}
                productId={productId}
                handleClose={handleClose}
                isRedirectToDetailPage={true}
                openFrom="productMaster"
            />
        }
        {showDeleteConfirmBox &&
            <ConfirmationDialog
                open={showDeleteConfirmBox}
                message={`Are you sure you want to delete the product ${deleteRecord?._id ? deleteRecord?.productName : ""} ?`}
                onClose={() => setShowDeleteConfirmBox(false)}
                onOk={handleDelete}
            />
        }
    </Fragment>
    );
}

export default Product;
