import React, { useState, useEffect, useContext, useReducer } from "react";
import Box from '@material-ui/core/Box';
import CreateProduct from "../Product/CreateProduct";
import AddExistingProduct from "./AddExistingProduct";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import ProductDialog from "./ProductDialog";
import axiosInstance from '../../axios/axiosInstance'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import NoDataCell from "../../components/Helpers/NoDataCell";
import { Link } from 'react-router-dom'
import { ExpandMore } from "@material-ui/icons";
import { Menu, MenuItem } from "@material-ui/core";
import { AddField } from '../FormBuilder/AddField';
import ConfirmationDialog from '../Helpers/ConfirmationDialog'
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import ImportExportLinks from "../Product/ImportExportLinks";
import { orderBy, sortBy, uniq, map } from "lodash";
import CustomAgGrid, { reducer, intialState } from "../../components/AgGridComponents/CustomAgGrid";
import {
    CommonRenderer
} from "../../components/AgGridComponents/CustomAgGridCellRenderers";

var levalOrderBy = ["product", "product-custom", "template", "cost", "builder", "builder-custom"]

const ProductBuilder = (props) => {

    const { productBuilderId,
        isAddNewProduct, setIsAddNewProduct,
        isAddExistingProduct, setIsAddExistingProduct,
        refreshProducts, Editable, stage } = props;

    const toastConfig = useContext(CustomToastContext)

    const [renderCount, setRenderCount] = useState(0);
    const [product, setProduct] = useState([]);
    const [columns, setColumns] = useState(null);
    const [productData, setProductData] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [isAddField, setIsAddField] = useState(false);
    const [addFieldData, setaddFieldData] = useState({ section: [], fields: [] });
    const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false)
    const [deleteRecord, setDeleteRecord] = useState(null)

    //  Grid Variables - Start
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

    useEffect(() => {
        fetchProduct(productBuilderId);
    }, []);

    useEffect(() => {
        if (renderCount > 0) {
            fetchProduct(productBuilderId);
        } else setRenderCount((preCount) => preCount + 1);
    }, [page, limit, filters, sorting]);

    const ActionsRenderer = params => <>

        <Tooltip title="Edit" >
            <IconButton aria-label="Edit" onClick={() => { setProductData(params.data) }}  >
                <EditIcon fontSize="small" color="primary" />
            </IconButton>
        </Tooltip >
        <Tooltip title="Delete" >
            <IconButton aria-label="Delete" onClick={() => { setDeleteRecord(params.data); setShowDeleteConfirmBox(true) }}   >
                <DeleteIcon fontSize="small" color="error" />
            </IconButton>
        </Tooltip >
    </>

    const ProductNameRenderer = params => <>
        {        Editable ?
            <Link className="link" onClick={() => { setProductData(params.data) }}   >
                {params.data.productName}
            </Link> :
            <>{params.data.productName}</>
        }
    </>

    const ProductCategoryRenderer = params => <>
        {
            params.data.productCategory || params.data.productCategory === 0 ?
                typeof params.data.productCategory === 'object' ? params.data.productCategory["optionLabel"] : params.data.productCategory
                : <NoDataCell />
        }
    </>
    const ProductTemplateRenderer = params => <>
        {
            params.data.productTemplate || params.data.productTemplate === 0 ?
                typeof params.data.productTemplate === 'object' ? params.data.productTemplate["optionLabel"] : params.data.productTemplate
                : <NoDataCell />
        }
    </>

    const frameworkComponents = {
        actionsRenderer: ActionsRenderer,
        commonRenderer: CommonRenderer,
        productNameRenderer: ProductNameRenderer,
        productCategoryRenderer: ProductCategoryRenderer,
        productTemplateRenderer: ProductTemplateRenderer,

    };

    const fetchProduct = (id) => {
        dispatch({ type: "loading", loading: true });

        if (gridApi) {
            gridApi.setRowData([]);
            gridApi.showLoadingOverlay();
        }
        axiosInstance().get(`/productbuilder/getproduct/${id}`)
            .then(({ data: { data } }) => {
                data = data.data?.map((u, index) => ({
                    ...u,
                    id: u._id,
                    srno: index + 1
                }));
                refreshProducts(data)
                setColumns(null);
                let column = [
                    // { field: 'id', headerName: 'id', show: false, cellRenderer: "commonRenderer" },
                    { field: 'srno', headerName: 'Sr.', width: 70, show: true, filter: false, cellRenderer: "commonRenderer" }]
                data.forEach((row) => {
                    let _fields = row.fields;
                    console.log(_fields)
                    if (stage) {
                        //|| (t.leval === "template" && t.sectionType !== "cost")
                        if (stage === "product") {
                            _fields = row.fields.filter((t) => t.leval === "product" || t.leval === "product-custom")
                        }
                    }
                    _fields.forEach((ele) => {
                        if (ele.type === "converter" || ele.type === "currencyAmount" || ele.isConverter === true) {
                            if (ele.type !== "currencyAmount" && (ele.type === "converter" || ele.isConverter === true)) {
                                ele.displayUnits.forEach((_unit) => {
                                    let fieldName = ele.fieldName + "_" + _unit.toLowerCase()
                                    let fieldLabel = ele.fieldLabel + " " + _unit
                                    if (column.filter((_c) => _c.field === fieldName && _c.headerName === fieldLabel).length === 0) {
                                        let col: any = {}
                                        col.field = fieldName
                                        col.headerName = fieldLabel
                                        col.width = 180
                                        // col.renderCell = (params) => (params.row[fieldName] || params.row[fieldName] === 0 ? params.row[fieldName] : <NoDataCell />)
                                        col.show = true
                                        col.cellRenderer = "commonRenderer"
                                        col.order = ele.order
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
                                            // col.renderCell = (params) => (params.row[fieldName] || params.row[fieldName] === 0 ? params.row[fieldName] : <NoDataCell />)
                                            col.show = true
                                            col.cellRenderer = "commonRenderer"
                                            col.width = 180
                                            col.order = ele.order
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
                                        // col.renderCell = (params) => (params.row[fieldName] || params.row[fieldName] === 0 ? params.row[fieldName] : <NoDataCell />)
                                        col.show = true
                                        col.cellRenderer = "commonRenderer"
                                        col.width = 180
                                        col.order = ele.order
                                        col.leval = ele.leval
                                        column.push(col)
                                    }
                                })
                            }
                        }
                        else {
                            if (column.filter((_c) => _c.field === ele.fieldName && _c.headerName === ele.fieldLabel).length === 0) {
                                let col: any = {}
                                col.field = ele.fieldName
                                col.headerName = ele.fieldLabel
                                col.width = 180
                                if (ele.fieldName === "productName") {
                                    col.cellRenderer = "productNameRenderer"
                                }
                                if (ele.fieldName === "productCategory" ){
                                    col.cellRenderer = "productCategoryRenderer"
                                }
                                if( ele.fieldName === "productTemplate") {
                                    col.cellRenderer = "productTemplateRenderer"
                                }
                                col.show = true
                                col.order = ele.order
                                col.leval = ele.leval
                                column.push(col)
                            }
                        }
                    })
                });
                column = orderBy(column, 'order', 'asc');
                column = sortBy(column, (item: any) => {
                    return levalOrderBy.indexOf(item.leval)
                });

                // if (Editable) {
                //     column.push(ActionsColoum)
                // }

                setColumns(column);
                setProduct(data);
                dispatch({ type: "initialize", data: data, count: data.length });
                dispatch({ type: "loading", loading: false });
            }).catch((error) => {
                toastConfig.setToastConfig(error);
            });
    };

    const addProductInBuilder = (rows) => {
        let data: any = {}
        data.product = rows
        data._id = productBuilderId
        axiosInstance().post(`/productbuilder/addproduct`, data).then(({ data: { data } }) => {
            fetchProduct(productBuilderId)
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    }

    const handleSaveProduct = (row) => {
        let data: any = {}
        data.product = row
        data._id = productBuilderId

        axiosInstance().put(`/productbuilder/updateProduct`, data).then(({ data: { data } }) => {
            setProductData(null)
            fetchProduct(productBuilderId);
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    }

    const handleDelete = () => {
        let ids = []
        if (deleteRecord) {
            ids.push(deleteRecord._id)
        }
        else {
            ids = selectedRecords.map(d => d.id);
        }
        let data: any = {}
        data.productBuilderId = productBuilderId
        data._ids = ids
        axiosInstance().post(`/productbuilder/deleteproduct`, data).then(({ data: { data } }) => {

            setShowDeleteConfirmBox(false)
            setDeleteRecord(null)
            // setSelectedProduct([])
            setAnchorEl(null)
            fetchProduct(productBuilderId)
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    }

    const openActions = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const closeActions = () => {
        setAnchorEl(null);
    };

    const handleOpenAddField = () => {
        const rows: any = product.filter((data) => selectedRecords.some(rec => rec._id === data._id))
        let section: any = []
        let fields: any = []
        section = uniq(map(rows[0].fields, 'sectionName'));
        rows[0].fields.forEach(_field => {
            let fid = { ..._field }
            if (fid.type !== "currencyAmount" && (fid.type === "converter" || fid.isConverter === true)) {
                fid.displayUnits && fid.displayUnits.forEach(_unit => {
                    fields.push({ ...fid, fieldLabel: fid.fieldLabel + " " + _unit, fieldName: fid.fieldName + "_" + _unit.toLowerCase() })
                })
            }
            else if (fid.type === "currencyAmount") {
                fid.displayCurrency && fid.displayCurrency.forEach(_currency => {
                    if (fid.isConverter) {
                        fid.displayUnits && fid.displayUnits.forEach(_unit => {
                            fields.push({ ...fid, fieldLabel: fid.fieldLabel + " " + _unit, fieldName: fid.fieldName + "_" + _currency.toLowerCase() + "_" + _unit.toLowerCase() })
                        })
                    }
                    else {
                        fields.push({ ...fid, fieldLabel: fid.fieldLabel + " " + _currency, fieldName: fid.fieldName + "_" + _currency.toLowerCase() })
                    }
                })
            }
            else {
                fields.push(fid)
            }
        })
        setaddFieldData({ section: section, fields: fields })
        setIsAddField(true)
        setAnchorEl(null);
    }

    const handleCloseAddField = () => {
        setIsAddField(false)
    }

    const handleAddField = (field) => {
        let data: any = {}
        data.productBuilderId = productBuilderId
        data._ids = selectedRecords.map(d => d.id)
        data.field = field
        data.field.leval = "builder-custom"
        axiosInstance().post(`/productbuilder/addField`, data).then(({ data: { data } }) => {
            fetchProduct(productBuilderId)
            setIsAddField(false)
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    }

    return (<Box p={1} pt={0}>
        <Grid container>
            <Grid item xs={4} className="d-flex align-items-center gap-1">
            </Grid>
            {Editable &&
                <Grid xs={8} container justify="flex-end">
                    <ImportExportLinks
                        module="builder"
                        api={"productbuilder"}
                        refrenceId={productBuilderId}
                        onSuccessfulImport={(isImportedSuccessfully) => {
                            if (isImportedSuccessfully) {
                                fetchProduct(productBuilderId)
                            }
                        }}
                    />
                    <Button
                        variant="outlined"
                        color="default"
                        size="small"
                        className="float-right"
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
                        <MenuItem onClick={handleOpenAddField}>Add Field</MenuItem>
                    </Menu>
                </Grid>
            }
        </Grid>
        <Box height={500} mt={1}>
            {columns &&
                <CustomAgGrid columns={columns} dataRows={dataRows} frameworkComponents={frameworkComponents} setGridApi={setGridApi}
                    dispatch={dispatch} rowCount={rowCount} limit={limit} pageSizes={pageSizes} page={page} allowSelection={Editable} allowAction={Editable} actionWidth={150} isClientSideGrid={true} />
            }
        </Box>
        {isAddNewProduct && <CreateProduct isClone={false} productId={null} handleClose={() => setIsAddNewProduct(false)}
            isAddInBuilder={true} addProductInBuilder={addProductInBuilder} openFrom="builder"
        />}
        {isAddExistingProduct && <AddExistingProduct addProductInBuilder={addProductInBuilder} handleClose={() => setIsAddExistingProduct(false)} />}
        {productData && <ProductDialog productData={productData} handleSaveProduct={handleSaveProduct} handleClose={() => setProductData(null)} stage={stage} />}
        {isAddField && <AddField refrence="builder" section={addFieldData.section}
            fieldData={null} handleClose={handleCloseAddField} handleAddField={handleAddField} fields={addFieldData.fields} />
        }
        {showDeleteConfirmBox &&
            <ConfirmationDialog
                open={showDeleteConfirmBox}
                message={`Are you sure, you want to delete product ?`}
                onClose={() => setShowDeleteConfirmBox(false)}
                onOk={handleDelete}
            />
        }
    </Box >
    );
}

export default ProductBuilder;
