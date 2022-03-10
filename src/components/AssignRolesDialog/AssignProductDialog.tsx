import { useState, useEffect, useContext, useReducer } from "react";
import {
    Box,
    Button,
    ButtonGroup,
    CircularProgress,
    Dialog,
    Grid,
    IconButton,
} from "@material-ui/core";
import CustomDialogContent from "../CustomDialog/CustomDialogContent";
import CustomDialogHeader from "../CustomDialog/CustomDialogHeader";
import CustomDialogFooter from "../CustomDialog/CustomDialogFooter";
import axiosInstance from "../../axios/axiosInstance";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import SearchBox from "../Helpers/SearchBox";
import { gridLoadingTimeout, isObjectEmpty, product, packages, prepareDataForGrid } from "../../constants/helpers";
import { reducer, intialState } from "../../components/AgGridComponents/CustomAgGrid";
import { useData } from "../../StateProvider/Provider";
import CommonSkeleton from "../Helpers/CommonSkeleton";
import { CommonRenderer } from "../AgGridComponents/CustomAgGridCellRenderers";
import routes from "../Helpers/Routes";
import styles from "../../pages/Leads/Header.module.scss";
import { AddOutlined, RemoveOutlined } from "@material-ui/icons";
import CustomAgGridEditable from "../AgGridComponents/CustomAgGridEditable";
import { isMobile, isTablet } from 'react-device-detect';

const options = [
    {
        key: `All ${routes.product.title}`,
        value: 1
    },
    {
        key: `Selected ${routes.product.title}`,
        value: 2
    }
];

const AssignProductDialog = ({
    productsDialogOpen,
    productId,
    onSuccess,
    handleCloseDialog,
    assignedProducts,
    reference = 'product',
    renderedFrom
}) => {
    const localStorageSelectedRecords = `${renderedFrom}_selected`
    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
    const {
        state: { permissions, selectedEntity },
    }: any = useData();

    const toastConfig = useContext(CustomToastContext);
    const [isAssigning, setAssigning] = useState(false);
    const [disableSaveButton, setDisableSaveButton] = useState(false);
    const [productsConst, setProductsConst] = useState([]);
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const [selectedType, setSelectedType] = useState(1);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

    const [columns, setColumns] = useState([
        { field: 'productName', headerName: 'Product Description', show: true, cellRenderer: 'commonRenderer' },
        { field: 'productNumber', headerName: 'Product Number', show: true, cellRenderer: 'commonRenderer' },
        { field: 'quantity', headerName: 'Quantity', show: true, cellRenderer: 'commonRenderer', cellEditor: "numericCellEditor", editable: true },
    ]);

    const [filter, setFilter] = useState(`All ${routes.product.title}`);
    const [isProductType, setIsProductType] = useState(false);

    useEffect(() => {
        axiosInstance().get("/field?resource=Product&view=true").then(({ data: { data } }) => {
            const productTypes = data.find((e) => e.fieldData.fieldName === "productType")
            if (productTypes) {
                setIsProductType(true)
            } else {
                setIsProductType(false)
            }
        })
    }, [])

    
    useEffect(() => {
        setDisableSaveButton(selectedRecords.some(d => d.quantity === 0))
    }, [selectedRecords])

    useEffect(() => {
        fetchProduct()
    }, [page, limit, filters, sorting, search, selectedEntity, selectedType, showFilteredRecordsOnly]);

    const fetchProduct = () => {
        dispatch({ type: "loading", loading: true });
        if (gridApi) {
            gridApi.setRowData([]);
        }
        const queryString = getQueryString();
        axiosInstance().get(`${product.api}${queryString}`).then(({ data }) => {
            let rows = data.data.map((u) => {
                let finalObject = prepareDataForGrid(u);
                finalObject["isChecked"] = false;
                finalObject["id"] = u._id;
                finalObject['quantity'] = 0;
                return {
                    ...finalObject,
                };
            });
            const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
            dispatch({
                type: "selection",
                selectedRecords: savedRecords
            })
        

            setProductsConst(data.data)
            dispatch({ type: "initialize", data:rows, count: data.count });
            setTimeout(() => { dispatch({ type: "loading", loading: false }) }, gridLoadingTimeout);
        })
            .catch((error) => {
                toastConfig.setToastConfig(error);
            });
    };

    const getQueryString = () => {
        const ignoreIds = assignedProducts && assignedProducts?.length > 0 ? assignedProducts.map(p => p._id) : []
        let deepFilter = `?page=${page}&limit=${limit}&filterProducts=${selectedType}&ignoreIds=${JSON.stringify(ignoreIds)}`;
        if (selectedEntity) {
            deepFilter = `${deepFilter}&entity=${selectedEntity}`;
        }

        if (showFilteredRecordsOnly) {
            const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
            deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map(m => m._id))}`;
        }
        const updatedFilters = []
        if (isProductType) {
            updatedFilters.push({
                field: "productType",
                term: "Part"
            })
        }
        if (!isObjectEmpty(filters)) {
            Object.keys(filters).forEach(field => {
                updatedFilters.push({
                    field: field,
                    term: filters[field].filter
                })
            });
            deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}&filterType=and`
        } else {
            deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}&filterType=and`
        }
        if (sorting.length > 0) {
            deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`
        }
        if (search) {
            deepFilter = `${deepFilter}&search=${search}`;
        }
        return deepFilter;
    };

    const ActionsRenderer = params => {
        const rowNode = params.node.gridApi.getRowNode(params.data.id)
        return <>
            {
                <ButtonGroup size="small" aria-label="small outlined button group">
                    <IconButton
                        size="small"
                        aria-label="Clone"
                        onClick={() => {
                            if (params.data.quantity > 0) rowNode.setDataValue("quantity", params.data.quantity - 1)
                        }}>
                        <RemoveOutlined fontSize="small" color="primary" />
                    </IconButton>
                    <IconButton
                        size="small"
                        aria-label="Clone"
                        onClick={() => {
                            rowNode.setDataValue("quantity", params.data.quantity + 1)
                        }}>
                        <AddOutlined fontSize="small" color="primary" />
                    </IconButton>
                </ButtonGroup>
            }
        </>
    }

    const frameworkComponents = {
        actionsRenderer: ActionsRenderer,
        commonRenderer: CommonRenderer,
    };

    const handleAssignProduct = async () => {
        setAssigning(true);
        if (reference === 'product') {
            const dataObj = selectedRecords.filter(d => d.quantity > 0)
                .map(d => {
                    return ({
                        "childProduct": d.id,
                        "qty": Number(d.quantity)
                    })
                })
            await axiosInstance().post(`/product/${productId}/bom`, dataObj)
                .then(({ data }) => {
                    setAssigning(false);
                    toastConfig.setToastConfig({
                        message: data.message,
                        type: "success",
                        open: true,
                    });

                    onSuccess();
                })
                .catch((error) => {
                    setAssigning(false);
                    toastConfig.setToastConfig(error);
                });
        } else {
            axiosInstance()
                .post(`${packages.packageApi}/add-products`, {
                    ids: [productId],
                    products: selectedRecords.map((d: any) => ({ product: d.id, qty: Number(d.quantity) }))
                })
                .then(() => {
                    setAssigning(false);
                    onSuccess();
                })
                .catch((err) => {
                    setAssigning(false);
                    toastConfig.setToastConfig(err);
                });
        }
    };

    const handleSearch = (e) => {
        dispatch({ type: "search", search: e.target.value });
    };


    const handleFilter = (event, newFilter) => {
        if (newFilter !== null) {
            setFilter(newFilter);
            setSelectedType(options.find((d) => d.key === newFilter).value);
        }
    };

    const onCellValueChanged = (row) => {
        setDisableSaveButton(selectedRecords.some(d => d.quantity === 0))
    }

    return (
        <Dialog
            fullWidth
            maxWidth="md"
            fullScreen={true}
            open={productsDialogOpen}
            onClose={handleCloseDialog}
            aria-labelledby="assign-roles-dialog"
        >
            <CustomDialogHeader title={`Assign ${routes.product.title}`}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                    setFullScreen(prevState => !prevState)
                }}
                showManimizeMaximize={true}
                showRequiredLabel={false}
                onClose={handleCloseDialog}
            />
            <CustomDialogContent>
                <>
                    <div className="header-panel">
                        <Grid container className={styles.filter_side_container}>
                            <Grid item xs={6} className="d-flex align-items-center gap-1">
                                {/* {
                                    options && <ToggleButtonGroup size="small" className="ml-2"
                                        value={filter}
                                        exclusive
                                        onChange={handleFilter}>
                                        {options.map((k, index) => {
                                            return (
                                                <ToggleButton value={k.key} key={index}>{k.key}
                                                </ToggleButton>
                                            );
                                        })}
                                    </ToggleButtonGroup>
                                } */}
                            </Grid>
                            <Grid xs={6} className={styles.filter_side} >
                                <Box className={styles.filter_side_header} component="div"  >
                                    <SearchBox
                                        onSearch={handleSearch}
                                        searchbox={styles.search_box_input}
                                        width="242px"
                                        size="small"
                                        value={search}
                                    />
                                    <Button
                                        disabled={isAssigning || disableSaveButton  ||  selectedRecords.length === 0}
                                        onClick={handleAssignProduct}
                                        color="primary"
                                        size="small"
                                        variant="contained"
                                        endIcon={isAssigning && <CircularProgress color='inherit' size={18} /> }
                                    >
                                        Add {selectedRecords.length > 0 ? "(" + selectedRecords.length + ")" : ""}
                                    </Button>
                                </Box>
                            </Grid>
                        </Grid>
                    </div>
                    {columns ?
                        <CustomAgGridEditable
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
                            renderedFrom={renderedFrom}
                            refreshGrid={fetchProduct}
                            onCellValueChanged={onCellValueChanged}
                            selectedRecords={selectedRecords}
                            showOnlyShowFilteredRecordSwitch={true}
                        />
                        : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>}
                </>
            </CustomDialogContent>
        </Dialog>
    );
};

export default AssignProductDialog;
