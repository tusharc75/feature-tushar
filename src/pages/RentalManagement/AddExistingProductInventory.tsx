import { useState, useEffect, useContext, useReducer, Fragment } from "react";
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { Link } from 'react-router-dom'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../axios/axiosInstance";
import { Box, IconButton, TextField, Tooltip } from "@material-ui/core";
import SearchBox from '../../components/Helpers/SearchBox'
import routes from "../../components/Helpers/Routes";
import CustomAgGrid, { reducer, intialState } from "../../components/AgGridComponents/CustomAgGrid";
import { productInventory, isObjectEmpty, gridLoadingTimeout, CustomDialogTransition, product, packages } from '../../constants/helpers';
import {
    CommonRenderer,
    CreatedByRenderer,
    UpdatedByRenderer
} from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import { useData } from "../../StateProvider/Provider";
import Dialog from "@material-ui/core/Dialog/Dialog";
import CustomDialogHeader from "../../components/CustomDialog/CustomDialogHeader";
import { AddOutlined } from "@material-ui/icons";
import CustomDialogContent from "../../components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "../../components/CustomDialog/CustomDialogFooter";
import { Autocomplete } from "@material-ui/lab";

const AddExistingProductInventory = ({ addProductInventory, handleProductInventoryClose, type }) => {
    const toastConfig = useContext(CustomToastContext)
    const [quantityDialog, setQuantityDialog] = useState(false);
    const [packageDialog, setPackageDialog] = useState(false);
    const [productData, setProductData] = useState([]);
    const [packageProductData, setPackageProductData] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState({ name: "", id: "", quantity: 0 });
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

    const {
        state: { permissions },
    }: any = useData();

    useEffect(() => {
        if (type === "product") fetchProductInventory();
        if (type === "package") fetchPackage();
    }, []);

    const columns = type === "product" ? [
        { field: "productName", headerName: "Product Description", show: true, disabled: true, cellRenderer: "nameRenderer" },
        { field: "productNumber", headerName: "Product Number", show: true, cellRenderer: "commonRenderer" },
        { field: "priceTemplate", headerName: "Price Template", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "productCategory", headerName: "Product Category", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "quantity", headerName: "Quantity", show: true, disabled: true, cellRenderer: "commonRenderer" },
    ] : [
        { field: "packageName", headerName: "Package Name", show: true, cellRenderer: "commonRenderer" },
        { field: "packageDescription", headerName: "Package Description", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "quantity", headerName: "Quantity", show: true, disabled: true, cellRenderer: "commonRenderer" },
    ];

    const fetchPackageProduct = (packageId) => {
        if (type === "package") {
            setLoadingProducts(true);
            axiosInstance()
                .get(`${packages.packageApi}/get-products/${packageId}`)
                .then(({ data: { data } }) => {
                    const newArr = data.length > 0 ? data.map((product: any) => ({ product: product.productId, qty: product.qty })) : [];
                    setPackageProductData(newArr);
                    setLoadingProducts(false);
                })
                .catch((err) => {
                    toastConfig.setToastConfig(err);
                    setLoadingProducts(false);
                });
        }
    };

    const fetchPackage = () => {
        dispatch({ type: "loading", loading: true });

        if (gridApi) {
            gridApi.setRowData([]);
        }
        axiosInstance().get(`${packages.packageApi}`).then(({ data }) => {
            data.data = data.data?.map((u) => ({
                ...u,
                id: u._id,
                type: type,
                quantity: 0,
            }));
            setProductData(data.data)
            dispatch({ type: "initialize", data: data.data, count: data.data.length });
            setTimeout(() => {
                dispatch({ type: "loading", loading: false });
            }, gridLoadingTimeout);

        }).catch((error) => {
            toastConfig.setToastConfig(error);
            dispatch({ type: "loading", loading: false });
        });
    };

    const fetchProductInventory = () => {
        dispatch({ type: "loading", loading: true });

        if (gridApi) {
            gridApi.setRowData([]);
        }
        axiosInstance().get(`${product.api}`).then(({ data }) => {
            data.data = data.data?.filter(u => u?.serializedProduct)
                .map((u) => ({
                    ...u,
                    id: u._id,
                    productCategory: u.productCategory?.optionLabel,
                    priceTemplate: u.priceTemplate?.optionLabel,
                    type: type,
                    quantity: 0,
                }));
            setProductData(data.data)
            dispatch({ type: "initialize", data: data.data, count: data.data.length });
            setTimeout(() => {
                dispatch({ type: "loading", loading: false });
            }, gridLoadingTimeout);

        }).catch((error) => {
            toastConfig.setToastConfig(error);
            dispatch({ type: "loading", loading: false });
        });
    };

    const ActionsRenderer = (params) => (
        <>
            {
                permissions.rentalManagement.isUpdate && (

                    <Tooltip title={`Add ${type}`}>
                        <IconButton
                            size="small"
                            aria-label={`Add ${type}`}
                            onClick={() => {
                                if (type === "package") {
                                    setPackageDialog(true)
                                    fetchPackageProduct(params.data.id)
                                    setSelectedProduct({ name: params.data.packageName, id: params.data.id, quantity: params.data.quantity })
                                }
                                else {
                                    setQuantityDialog(true);
                                    setSelectedProduct({ name: params.data.productName, id: params.data.id, quantity: params.data.quantity })
                                }
                            }}
                        >
                            <AddOutlined fontSize="small" color="primary" />
                        </IconButton>
                    </Tooltip>
                )
            }
        </>
    );

    const NameRenderer = (params) => (
        <Link className="link" title={params.value} to={`${routes.productInventoryDetail.path}/${params.data._id}`}>
            {params.value}
        </Link>
    );


    const handleSearch = (e) => {
        dispatch({ type: "search", search: e.target.value });
    };

    const frameworkComponents = {
        createdByRenderer: CreatedByRenderer,
        updatedByRenderer: UpdatedByRenderer,
        nameRenderer: NameRenderer,
        commonRenderer: CommonRenderer,
        actionsRenderer: ActionsRenderer,
    };

    const handleSubmit = () => {
        dispatch({ type: "loading", loading: true });
        let tempProduct = productData
        tempProduct.find(d => d.id === selectedProduct.id).quantity = selectedProduct.quantity
        setProductData(tempProduct)
        setQuantityDialog(false)
        setPackageDialog(false)
        if (gridApi) {
            gridApi.setRowData(productData);
        }
        // dispatch({ type: "update", data: productData, count: productData.length });
        setTimeout(() => {
            dispatch({ type: "loading", loading: false });
        }, gridLoadingTimeout);
    }

    const getRowStyleScheduled = (params) => {
        if (["Available", "New"].indexOf(params?.data?.status) >= 0) {
            return {
                'background-color': "#d3ffe0",
            }
        }
        return null;
    };

    return (<Fragment>
        <>
            {(<Dialog
                fullScreen={true}
                TransitionComponent={CustomDialogTransition}
                aria-labelledby="customized-dialog-title"
                open={true}
            >
                <CustomDialogHeader title={`Add ${type}`} onClose={handleProductInventoryClose} ></CustomDialogHeader>
                <div className="listing-grid p-3">
                    <Box mb={2}>
                        <Grid container >
                            <Grid item xs={12} sm={6}>

                            </Grid>
                            <Grid item xs={12} sm={6} container justify="flex-end">
                                <SearchBox
                                    onSearch={handleSearch}
                                    searchbox="terms_header_search_bar"
                                    width="300px"
                                    value={search}
                                />
                                <Box ml={1} mt={1} >
                                    <Button size="small" color="primary" onClick={() => addProductInventory(selectedRecords)} variant="contained" disabled={selectedRecords.length > 0 ? false : true}  >
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
                            allowAction={true}
                            loading={loading}
                            customGridOptions={{ getRowStyle: getRowStyleScheduled }}
                            isClientSideGrid={true}
                        />
                        : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>}
                </div>
            </Dialog>
            )}
            {quantityDialog && <Dialog open fullWidth maxWidth="sm" onClose={() => { setQuantityDialog(false) }}>
                <CustomDialogHeader title="Assign To Product" onClose={() => { setQuantityDialog(false) }} />
                <CustomDialogContent>
                    <Box p={2}>
                        <TextField
                            size="small"
                            fullWidth
                            value={selectedProduct.name}
                            disabled
                            type="text"
                            variant="outlined"
                            label="Product Name"
                        />

                        <Box my={4} />
                        <TextField
                            size="small"
                            fullWidth
                            value={selectedProduct.quantity}
                            type="number"
                            onChange={(e) => { setSelectedProduct({ name: selectedProduct.name, id: selectedProduct.id, quantity: parseInt(e.target.value) }) }}
                            variant="outlined"
                            required
                            label="Quantity"
                        />
                    </Box>
                </CustomDialogContent>
                <CustomDialogFooter>
                    <Button variant="outlined" color="primary" onClick={() => { setQuantityDialog(false) }}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit}
                        variant="contained"
                        color="primary"
                    >
                        Save
                    </Button>
                </CustomDialogFooter>
            </Dialog>
            }
            {packageDialog && <Dialog open fullWidth maxWidth="md" onClose={() => setPackageDialog(false)}>
                <CustomDialogHeader title={"Assign To Package"} onClose={() => setPackageDialog(false)} />
                <CustomDialogContent>
                    <Box p={2}>
                        <TextField
                            size="small"
                            value={selectedProduct.quantity}
                            type="number"
                            onChange={(e) => { setSelectedProduct({ name: selectedProduct.name, id: selectedProduct.id, quantity: parseInt(e.target.value) }) }}
                            variant="outlined"
                            required
                            label="Package Quantity"
                        />
                        <div className="detail-box">
                            <h3 className="form-label-style" title={"Package Details"}>
                                {"Package Details"}
                            </h3>
                        </div>
                        <Grid container spacing={2}>
                            {packageProductData.length > 0 && packageProductData.map((obj, indx) => (
                                <Fragment key={obj.id}>
                                    <Grid item xs={5} sm={5}>
                                        <TextField
                                            size="small"
                                            fullWidth
                                            value={obj.product.productName}
                                            type="text"
                                            disabled
                                            variant="outlined"
                                            label="Product"
                                        />
                                    </Grid>
                                    <Grid item xs={5} sm={5}>
                                        <TextField
                                            size="small"
                                            fullWidth
                                            value={obj.qty}
                                            type="number"
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                            }}
                                            variant="outlined"
                                            required
                                            label="Quantity"
                                        />
                                    </Grid>
                                </Fragment>
                            ))}
                        </Grid>
                    </Box>
                </CustomDialogContent>
                <CustomDialogFooter>
                    <Button variant="outlined" color="primary" onClick={() => setPackageDialog(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        color="primary"
                    >
                        Save
                    </Button>
                </CustomDialogFooter>
            </Dialog>}
        </>
    </Fragment>
    );
}

export default AddExistingProductInventory;
