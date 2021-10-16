import { useState, useEffect, useContext, useReducer } from "react";
import {
    Box,
    Button,
    ButtonGroup,
    Checkbox,
    CircularProgress,
    Dialog,
    FormControl,
    Grid,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    TextField,
    Typography,
} from "@material-ui/core";
import CustomDialogContent from "../CustomDialog/CustomDialogContent";
import CustomDialogHeader from "../CustomDialog/CustomDialogHeader";
import Loader from "../Loader";
import CustomDialogFooter from "../CustomDialog/CustomDialogFooter";
import axiosInstance from "../../axios/axiosInstance";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import SearchBox from "../Helpers/SearchBox";
import { gridLoadingTimeout, isObjectEmpty, product } from "../../constants/helpers";
import CustomAgGrid, { reducer, intialState } from "../../components/AgGridComponents/CustomAgGrid";
import { useData } from "../../StateProvider/Provider";
import CommonSkeleton from "../Helpers/CommonSkeleton";
import { CommonRenderer } from "../AgGridComponents/CustomAgGridCellRenderers";
import routes from "../Helpers/Routes";
import styles from "../../pages/Leads/Header.module.scss";
import { ToggleButton, ToggleButtonGroup } from "@material-ui/lab";
import { AddOutlined, RemoveOutlined } from "@material-ui/icons";
import CustomAgGridEditable from "../AgGridComponents/CustomAgGridEditable";

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
    assignedProducts
}) => {

    const {
        state: { permissions, selectedEntity },
    }: any = useData();

    const toastConfig = useContext(CustomToastContext);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [isAssigning, setAssigning] = useState(false);
    const [productsConst, setProductsConst] = useState([]);
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const [selectedType, setSelectedType] = useState(1);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

    const [columns, setColumns] = useState([
        { field: 'productName', headerName: 'Product Description', show: true, cellRenderer: 'commonRenderer' },
        { field: 'productNumber', headerName: 'Product Number', show: true, cellRenderer: 'commonRenderer' },
        { field: 'quantity', headerName: 'Quantity', show: true, cellRenderer: 'commonRenderer', cellEditor: "numericCellEditor", editable: true },
    ]);
    const [filter, setFilter] = useState(`All ${routes.product.title}`);

    const getQueryString = () => {
        let deepFilter = `?page=${page}&limit=${limit}&filterProducts=${selectedType}`;

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

    useEffect(() => {
        fetchProduct()
        // eslint-disable-next-line
    }, [page, limit, filters, sorting, search, selectedEntity, selectedType]);

    const fetchProduct = () => {
        dispatch({ type: "loading", loading: true });

        if (gridApi) {
            gridApi.setRowData([]);
        }

        const queryString = getQueryString();
        axiosInstance().get(`${product.api}/bom/${productId}/available-products`).then(({ data }) => {
            // let tData = data.filter(o => o._id !== productId)
            // tData = tData.map(obj => ({ ...obj, isChecked: assignedProducts.some(item => item?._id === obj?._id) ? true : false }))
            data.data = data.data?.map((u) => ({
                ...u,
                id: u._id,
                quantity: assignedProducts.some(item => item?._id === u?._id) ? assignedProducts.find(item => item?._id === u?._id).qty : 0,
            }));
            setProductsConst(data.data)
            // setSelectedProducts(assignedProducts.map(obj => obj._id))
            dispatch({ type: "initialize", data: data.data, count: data.data.length });
            setTimeout(() => {
                dispatch({ type: "loading", loading: false });
                dispatch({ type: "selection", selectedRecords: data.data.filter(obj => assignedProducts.some(item => item?._id === obj?._id)) });
            }, gridLoadingTimeout);

        })
            .catch((error) => {
                toastConfig.setToastConfig(error);
            });
    };

    const ActionsRenderer = params => {
        const rowNode = params.node.gridApi.getRowNode(params.data.id)

        return <>
            {/* {selectedRecords.find(d => d._id === params.data._id) && */}
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
                    {/* <TextField
                        type="number"
                        name={params.data.id}
                        margin="dense"
                        size="small"
                        value={rowNode.data.quantity ? rowNode.data.quantity : 110}
                        onChange={(e) => {

                         }
                        }
                    /> */}
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
        if (selectedRecords.length > 0) {
            setAssigning(true);
            const dataObj = {
                "_id": productId,
                "bom": selectedRecords.filter(d => d.quantity > 0).map(d => {
                    return ({
                        "product": d.id,
                        "qty": Number(d.quantity)
                    })
                })
            };

            await axiosInstance().post(`/product/bom`, dataObj)
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
    }

    return (
        <Dialog
            fullWidth
            maxWidth="md"
            open={productsDialogOpen}
            onClose={handleCloseDialog}
            aria-labelledby="assign-roles-dialog"
        >
            <CustomDialogHeader title={`Assign ${routes.product.title}`} />
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
                            <Grid xs={6} container className={styles.filter_side} >
                                <Box className={styles.filter_side_header} component="div" >

                                    <SearchBox
                                        onSearch={handleSearch}
                                        searchbox={styles.search_box_input}
                                        width="242px"
                                        size="small"
                                        value={search}
                                    />
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
                            renderedFrom="productDetailsPage"
                            refreshGrid={fetchProduct}
                            onCellValueChanged={onCellValueChanged}
                            selectedRecords={selectedRecords}
                        />
                        : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>}
                </>
            </CustomDialogContent>
            <CustomDialogFooter>
                <Button
                    disabled={isAssigning}
                    onClick={handleCloseDialog}
                    color="primary"
                    size="small"
                >
                    Cancel
                </Button>
                <Button
                    disabled={isAssigning}
                    onClick={handleAssignProduct}
                    color="primary"
                    size="small"
                    variant="contained"
                >
                    {isAssigning ? <CircularProgress size={22} /> : "Save"}
                </Button>
            </CustomDialogFooter>
        </Dialog>
    );
};

export default AssignProductDialog;
function replaceFieldName(field: string) {
    throw new Error("Function not implemented.");
}

