import { useState, useEffect, useContext, useReducer, Fragment } from "react";
import Grid from '@material-ui/core/Grid';
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
import { RiShoppingBag3Fill } from 'react-icons/ri';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog'
import { ExpandMore } from "@material-ui/icons";
import { Box, Chip, Menu, MenuItem } from "@material-ui/core";
import SearchBox from '../../components/Helpers/SearchBox'
import styles from "../Leads/Header.module.scss";
import routes from "../../components/Helpers/Routes";
import ImportExportLinks from "../../components/Product/ImportExportLinks";
import CustomAgGrid, { reducer, intialState } from "../../components/AgGridComponents/CustomAgGrid";
import { product, isObjectEmpty, gridLoadingTimeout } from '../../constants/helpers';
import {
    CommonRenderer,
    CreatedByRenderer,
    UpdatedByRenderer
} from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import NoDataCell from "../../components/Helpers/NoDataCell";
import { useData } from "../../StateProvider/Provider";
import { sortBy } from 'lodash';

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
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

    const {
        state: { permissions, selectedEntity },
    }: any = useData();

    useEffect(() => {
        fetchProduct()
    }, [page, limit, filters, sorting, search, selectedEntity]);

    const [productPermissions, setProductPermissions] = useState({
        isCreate: false,
        isUpdate: false,
        isRead: false,
        isDelete: false,
    });

    useEffect(() => {
        if (permissions && permissions.product) {
            setProductPermissions(permissions.product);
        }
    }, [permissions]);

    const fetchProduct = () => {
        dispatch({ type: "loading", loading: true });

        if (gridApi) {
            gridApi.setRowData([]);
        }

        const queryString = getQueryString();
        axiosInstance().get(`${product.api}${queryString}`).then(({ data }) => {
            data.data = data.data?.map((u) => {
                const { createdBy, entity, ...restProperties } = u;
                const [firstEntity, ...restEntity] = entity;
                let res = {
                    ...restProperties,
                    id: u._id,
                    inventoryCount: u?.inventoryCount,
                    warehouses: u.warehouse?.map(w => w.optionLabel).join(", "),
                    createdBy: u.createdBy?.user?.concatedName,
                    createdByDate: u.createdBy?.date,
                    updatedBy: u.updatedBy?.user?.concatedName,
                    updatedByDate: u.updatedBy?.date,
                    entity: firstEntity?.optionLabel,
                    entityId: firstEntity?.optionValue,
                    productCategoryChipColor: u.productCategory.chipColour,
                    restEntity: restEntity,
                }
                for (let col in res) {
                    if (res[col] && res[col].optionLabel) {
                        res[col] = res[col].optionLabel;
                    }
                }
                return res;
            });
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
                            col.cellRenderer = "commonRenderer"
                            if (ele.fieldName === "productName") {
                                col.cellRenderer = "productNameRenderer"
                            }
                            if (ele.fieldName === "entity") {
                                col.cellRenderer = "entityRenderer"
                            }
                            if (ele.fieldName === "productCategory") {
                                col.cellRenderer = "productCategoryRenderer"
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
                    { field: "inventoryCount", headerName: "Inventory Count", show: true, cellRenderer: "commonRenderer", leval: "price-builder-custom" },
                    { field: "warehouses", headerName: "Warehouses", show: true, cellRenderer: "commonRenderer", leval: "price-builder-custom" },
                    { field: "createdBy", headerName: "Created By", show: true, cellRenderer: "createdByRenderer", leval: "price-builder-custom" },
                    { field: "updatedBy", headerName: "Updated By", show: true, cellRenderer: "updatedByRenderer", leval: "price-builder-custom" },
                )
            }
            const columnState = JSON.parse(localStorage.getItem("productPage"));
            if (columnState) {
                column.forEach((item) => {
                    columnState.forEach((d) => {
                        if (d.colId == item.field) {
                            item.show = !d.hide;
                        }
                    });
                });
            }
            setColumns(column);
            dispatch({ type: "initialize", data: data.data, count: data.count });
            setTimeout(() => {
                dispatch({ type: "loading", loading: false });
            }, gridLoadingTimeout);
        }).catch((error) => {
            toastConfig.setToastConfig(error);
            dispatch({ type: "loading", loading: false });
        });
    };

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
        <Link className="link" title={params.value} to={`${routes.productDetail.path}/${params.data._id}`}>
            {params.value}
        </Link>
    )

    const EntityNameRenderer = (params) =>
        params.value ? (
            <>
                <h5 className="createBy d-flex">
                    <Link className="link" title={params.value} to={`${routes.entity.path}/detail/${params.data.entityId}`}>
                        {params.value}
                    </Link>
                    {params.data.restEntity.length > 0 && (
                        <span className="createdAtTime badge-date">{`+${params.data.restEntity.length} more..`}</span>
                    )}
                </h5>
            </>
        ) : (
            <NoDataCell />
        );

    const ProductCategoryRenderer = (params) => (
        <> {params.data.productCategory !== undefined && params.data.productCategoryChipColor !== null ?
            (
                <Chip
                    className="ml-3"
                    style={{ backgroundColor: `${params.data.productCategoryChipColor}` }}
                    label={`${params.data.productCategory}`}
                />
            )
            : (
                <NoDataCell />
            )}
        </>
    );

    const ActionsRenderer = params => (
        <>
            {productPermissions.isCreate &&
                <Tooltip title="Clone">
                    <IconButton
                        size="small"
                        aria-label="Clone"
                        onClick={() => { OpenProduct(params.data._id); setIsClone(true) }}
                    >
                        <FileCopyIcon color="primary" />
                    </IconButton>
                </Tooltip>
            }
            {productPermissions.isDelete &&
                <Tooltip title="Delete">
                    <IconButton size="small" aria-label="Delete" onClick={() => {
                        setDeleteRecord(params.data);
                        setShowDeleteConfirmBox(true)
                    }} >
                        <DeleteIcon color="error" />
                    </IconButton>
                </Tooltip >
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

    const frameworkComponents = {
        productNameRenderer: ProductNameRenderer,
        createdByRenderer: CreatedByRenderer,
        updatedByRenderer: UpdatedByRenderer,
        actionsRenderer: ActionsRenderer,
        entityRenderer: EntityNameRenderer,
        productCategoryRenderer: ProductCategoryRenderer,
        commonRenderer: CommonRenderer,
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
                />
            </Grid>
        </Grid>
        <div className="main-container">
            <div className="header-panel">
                <Grid container className={styles.filter_side_container}>
                    <Grid item xs={6} className="d-flex align-items-center gap-1">
                        <RiShoppingBag3Fill size={22} style={{ paddingBottom: "3px" }} className="headerLogo" /> <span className="listingHeader">{routes.product.title} </span>
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
                    loading={loading}
                    renderedFrom="productPage"
                />
                : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>}
        </div>
        {open &&
            <CreateProduct
                isClone={isClone}
                productId={productId}
                handleClose={handleClose}
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
