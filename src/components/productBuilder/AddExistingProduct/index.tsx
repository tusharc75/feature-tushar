import { useState, useEffect, useContext, useReducer } from "react";
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import Dialog from '@material-ui/core/Dialog'
import axiosInstance from '../../../axios/axiosInstance'
import { gridLoadingTimeout, isObjectEmpty, product } from '../../../constants/helpers';
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton'
import CustomAgGrid, { reducer, intialState } from "../../../components/AgGridComponents/CustomAgGrid";
import { sortBy } from 'lodash';
import NoDataCell from "../../../components/Helpers/NoDataCell";
import SearchBox from '../../Helpers/SearchBox'
import { CustomDialogTransition } from "../../../constants/helpers";
import { CommonRenderer } from "../../AgGridComponents/CustomAgGridCellRenderers";
import { Link } from "react-router-dom";
import routes from "../../../components/Helpers/Routes";
import { Box, Chip, Menu, MenuItem } from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import TextField from "@material-ui/core/TextField";

var levalOrderBy = [
    "product",
    "product-custom",
    "product-template",
    "price-template",
    "product-builder-custom",
    "price-builder-custom",
];

const ignoreField = ["qty", "priceTemplate"]

const AddExistingProduct = (props) => {

    const toastConfig = useContext(CustomToastContext)
    const { handleClose, addProductInBuilder } = props;
    const [columns, setColumns] = useState(null);
    const [productList, setProductList] = useState([]);
    const [productColoums, setProductColoums] = useState([]);
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

    const [productCategoryList, setProductCategoryList] = useState([]);
    const [productTemplateList, setProductTemplateList] = useState([]);
    const [productCategory, setProductCategory] = useState(null);
    const [productTemplate, setProductTemplate] = useState(null);
    const [isProductTemplate, setIsProductTemplate] = useState(true);


    useEffect(() => {
        axiosInstance().get("/product-category").then(({ data: { data } }) => {
            setProductCategoryList(data)
        })
    }, [])

    useEffect(() => {
        if (isProductTemplate) {
            if (productCategory && productCategory !== "") {
                axiosInstance().post(`/product-template/template/` + productCategory, { entity: [] }).then(({ data: { data } }) => {
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
        if (productColoums.length) {
            fetchProduct()
        }
    }, [page, limit, filters, sorting, search, productColoums, productCategory, productTemplate]);

    useEffect(() => {
        axiosInstance().get("/field?resource=Product").then(({ data: { data } }) => {
            const productField = []
            data.map((_f) => productField.push(_f.fieldData));
            if (productField.filter((e) => e.fieldName === "productTemplate").length === 0) {
                setIsProductTemplate(false)
            }
            var coloum = [];
            GenrateColoum(productField, coloum)
            coloum.forEach((ele) => {
                ele.leval = "product"
            })
            setProductColoums(coloum)
        })
    }, [])


    const EntityNameRenderer = (params) => params.value ? (
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

    const ProductNameRenderer = params => (
        <Link className="link" title={params.value} to={`${routes.productDetail.path}/${params.data._id}`}>
            {params.value}
        </Link>
    )


    const frameworkComponents = {
        commonRenderer: CommonRenderer,
        entityRenderer: EntityNameRenderer,
        productNameRenderer: ProductNameRenderer,
        productCategoryRenderer: ProductCategoryRenderer,
    };

    const getQueryString = () => {
        let deepFilter = `?page=${page}&limit=${limit}`;
        if (!isObjectEmpty(filters)) {
            const updatedFilters = [];

            Object.keys(filters).forEach(field => {
                updatedFilters.push({
                    field: field,
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

    const handleSearch = (e) => {
        dispatch({ type: "search", search: e.target.value });
    };

    const fetchProduct = () => {
        dispatch({ type: "loading", loading: true });
        if (gridApi) {
            gridApi.setRowData([]);
        }
        const queryString = getQueryString();
        axiosInstance().get(`${product.api}${queryString}`).then(({ data }) => {
            setProductList(data.data);
            data.data = data.data?.map((u, index) => {
                const { entity, ...restProperties } = u;
                const [firstEntity, ...restEntity] = entity ? entity : [];
                let res = {
                    ...restProperties,
                    id: u._id,
                    entity: firstEntity?.optionLabel,
                    entityId: firstEntity?.optionValue,
                    productCategoryChipColor: u.productCategory?.chipColour,
                    restEntity: restEntity,
                }
                for (let col in res) {
                    if (res[col] && res[col].optionLabel) {
                        res[col] = res[col].optionLabel;
                    }
                }
                return res;
            });
            let column = [...productColoums]
            if (data.data.length) {
                data.data.forEach((row) => {
                    GenrateColoum(row.fields, column);
                });
                column = sortBy(column, function (item: any) {
                    return levalOrderBy.indexOf(item.leval)
                });
            }
            setColumns(column);
            dispatch({ type: "initialize", data: data.data, count: data.count });
            setTimeout(() => { dispatch({ type: "loading", loading: false }); }, gridLoadingTimeout);
        }).catch((error) => {
            toastConfig.setToastConfig(error);
            dispatch({ type: "loading", loading: false });
        });
    };

    const GenrateColoum = (fields, column) => {
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
    }

    const handleAdd = () => {
        let rows = productList.filter(
            (val) => selectedRecords.filter((u) => val._id === u._id).length > 0
        );
        rows.forEach((_d) => {
            _d.productId = _d._id
            if (_d.fields) {
                const qtyField = _d.fields.filter((_f) => _f.fieldName === "qty")
                if (qtyField.length) {
                    if (!qtyField[0].isFormula) {
                        _d.qty = 0
                    }
                }
            }
            delete _d.id
            delete _d.brand
            delete _d.createdBy
            delete _d.updatedBy
            delete _d.fields
            for (const [key, value] of Object.entries(_d)) {
                if (typeof value === 'object' && value && value["optionValue"]) {
                    _d[key] = value["optionValue"]
                }
                if (Array.isArray(value) && value.length && value[0].optionValue) {
                    const entity = []
                    value && value.forEach((ele) => {
                        entity.push(ele.optionValue)
                    })
                    _d[key] = entity
                }
            }
        })
        addProductInBuilder(rows)
        handleClose()
    }

    return (<Dialog
        fullScreen={true}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        open={true}
    >
        <CustomDialogHeader title={"Add Existing Product"} onClose={handleClose} ></CustomDialogHeader>
        <div className="listing-grid p-3">
            <Box mb={2}>
                <Grid container >
                    <Grid className="d-flex align-items-center gap-1" item xs={12} sm={6}>
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
                    <Grid item xs={12} sm={6} container justify="flex-end">
                        <SearchBox
                            onSearch={handleSearch}
                            searchbox="terms_header_search_bar"
                            width="300px"
                            value={search}
                        />
                        <Box ml={1} mt={1} >
                            <Button size="small" color="primary" onClick={handleAdd} variant="contained" disabled={selectedRecords.length > 0 ? false : true}  >
                                {selectedRecords.length ? "(" + selectedRecords.length + ")  " : ""}
                                Add</Button>
                        </Box>
                    </Grid>
                </Grid>
            </Box>
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
                    allowAction={false}
                    loading={loading}
                    refreshGrid={fetchProduct}
                />
                : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>}
        </div>
    </Dialog>
    );
}

export default AddExistingProduct;
