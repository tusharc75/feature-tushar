import { useState, useEffect, useContext, Fragment, useReducer } from "react";
import {
    Grid, Box, Button, Typography, IconButton, Paper, Chip, List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
} from "@material-ui/core";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import { ControlPoint, ExpandLess, ExpandMore, InfoOutlined } from "@material-ui/icons";
import { Skeleton, ToggleButtonGroup, ToggleButton } from "@material-ui/lab";
import { useParams, useHistory, Link } from "react-router-dom";
import axiosInstance from "../../axios/axiosInstance";
import routes from "../../components/Helpers/Routes";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import DetailsPageHeader from "../../components/DetailsPageHeader";
import DetailsPage from "../../components/Shared/DetailsPage";
import { useData } from "../../StateProvider/Provider";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { product, warehouse } from "../../constants/helpers";
import CreateProduct from "../../components/Product/CreateProduct";
import BoxWithBorder from "../../components/BoxWithBorder";
import DeleteButton from "../../components/Helpers/DeleteButton";
import AssignedFrequentlyBoughtProduct from "./AssignedFrequentlyBoughtProduct";
import AssignProductDialog from "../../components/AssignRolesDialog/AssignProductDialog";
import ManageProductInventory from "../ProductInventory/ManageProductInventory"
import { extractFieldsForDisplay } from "../../constants/formulaUtility";
import ProductHierarchy from "./ProductHierarchy"
import HtmlTooltip from "../../components/CustomTooltipTitle";
import AssignQuantityDialog from '../../components/Helpers/AssignQuantityDialog';
import CustomAgGrid, { reducer, intialState } from "../../components/AgGridComponents/CustomAgGrid";
import {
    CommonRenderer,
    CreatedByRenderer,
    UpdatedByRenderer
} from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import NoDataCell from "../../components/Helpers/NoDataCell";

interface TabPanelProps {
    children?: React.ReactNode;
    index: any;
    value: any;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`main-tabpanel-${index}`}
            aria-labelledby={`main-tab-${index}`}
            {...other}
        >
            {children}
        </div>
    );
}

const ProductDetailsPage = () => {
    const toastConfig = useContext(CustomToastContext);

    const { id } = useParams();
    const history = useHistory();
    const {
        state: { user, permissions }
    }: any = useData();
    const [headingLabel, setHeadingLabel] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingWarehouse, setLoadingWarehouse] = useState(false);
    const [loadingBOMData, setLoadingBOMData] = useState(false);
    const [productData, setProductData] = useState(null);
    const [showConfirmBox, setShowConfirmBox] = useState(false);
    const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
    const [openAssignProductDialog, setOpenAssignProductDialog] = useState(false);
    const [productFields, setProductFields] = useState([]);
    const [mainPoints, setMainPoints] = useState(null);
    const [customizedRoutes, setCustomizedRoutes] = useState([]);
    const [frequentlyBoughtProduct, setFrequentlyBoughtProduct] = useState([]);
    const [inventoriesData, setInventoriesData] = useState([]);
    const [BOMData, setBOMData] = useState([])
    const [activeTable, setActiveTable] = useState("packages");
    const [productWarehouseData, setProductWarehouseData] = useState([]);
    const [tabValue, setTabValue] = useState(0);
    const [selectedWarehouse, setSelectedWarehouse] = useState(null)
    const [openProductInventoryDialog, setOpenProductInventoryDialog] = useState(false);
    const [productColoums, setProductColoums] = useState([]);
    const [columns, setColumns] = useState([]);
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const [currentTab, setCurrentTab] = useState(null)
    const { dataRows, rowCount, loading: gridLoading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;
    const ignoreField = ["priceTemplate"]

    useEffect(() => {
        if (id) {
            getProductFieldsAndData();
            getFrequentlyBoughtProduct();
        }
    }, [id]);

    useEffect(() => {
        if (process.env.REACT_APP_ENV !== 'staging') {
            getProductTree()
            if (productData) {
                getWarehouses()
            }
        }
    }, [productData])

    useEffect(() => {
        if (productData) {
            getColumns()
        }
    }, [activeTable, productData])

    const handleMainPoints = (data) => {
        let mainPoint = {};
        mainPoint['Quantity'] = data?.qty || '';
        // mainPoint['MRP'] = data?.mrp || '';
        // mainPoint['Serialized Product'] = data?.serializedProduct ? "Yes" : 'No';
        setMainPoints(mainPoint);
    };

    const handleMainTabChange = (
        event: React.ChangeEvent<{}>,
        newValue: number
    ) => {
        setTabValue(newValue);
        if (newValue === 1) {
            setActiveTable("packages");
        }
        else if (newValue === 2) {
            setActiveTable("parent");
        }
    };

    const getProductFieldsAndData = () => {
        setLoading(true);
        axiosInstance()
            .get("/field?resource=Product")
            .then(({ data: { data } }) => {
                const _productField: any = []
                const filteredData = data.filter((obj) => obj.isCreate);
                filteredData.forEach((_f) => {
                    if (!ignoreField.includes(_f.fieldData.fieldName)) {
                        _productField.push(_f.fieldData)
                    }
                })
                const _fields = [];
                _productField.map((_f) => _fields.push({ "fieldData": _f }));
                var newField = _fields;
                axiosInstance().get(`/product/` + id).then(({ data: { data } }) => {
                    data.fields?.map((_f) => newField.push({ "fieldData": _f }));
                    data.productData.fields?.map((_f) => newField.push({ "fieldData": _f }));
                    var fields = []
                    newField.forEach((_f) => {
                        fields.push(_f.fieldData)
                    })
                    fields = extractFieldsForDisplay(fields)
                    newField = []
                    fields.forEach((_f) => {
                        newField.push({ "fieldData": _f })
                    })
                    setProductFields(newField)
                    handleMainPoints(data.productData);
                    setHeadingLabel(data.productData?.productNumber ? `${data.productData?.productNumber} - ${data.productData?.productName}` : data.productData?.productName);
                    setCustomizedRoutes([routes.product, { title: `${data.productData.productName}` }]);
                    if (data.productData.entity && data.productData.entity !== undefined) {
                        data.productData.entity = user.entity.filter(d => data.productData.entity.some(e => d._id === e)).map(d => { return { "optionValue": d._id, "optionLabel": d.entityName } })
                    }
                    setProductData(data.productData);
                    setLoading(false);
                }).catch((error) => {
                    toastConfig.setToastConfig(error);
                    setLoading(false);
                });

            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
            });
    };

    const getProductTree = () => {
        if (productData?._id) {
            setLoadingBOMData(true)
            axiosInstance()
                .get(`/product/bom/${productData?._id}`)
                .then(({ data: { data } }) => {
                    data = data.map(o => {
                        if (o?.parent) {
                            o.type = "child"
                        }
                        return o
                    })
                    setBOMData([...data])
                    setLoadingBOMData(false)
                }).catch(err => {
                    setLoadingBOMData(false)
                })
        }
    }

    const getFrequentlyBoughtProduct = () => {
        axiosInstance()
            .get(`${product.api}/frequent/` + id)
            .then(({ data }) => {
                setFrequentlyBoughtProduct(data.data);
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
            });
    };

    const unassignProduct = async (obj) => {
        if (obj) {
            const dataObj = {
                "_id": id,
                "frequentlyBoughtTogether": frequentlyBoughtProduct.filter(r => r._id !== obj._id).map(obj => obj._id)
            };

            await axiosInstance()
                .put(`/product/frequent`, dataObj)
                .then(({ data }) => {
                    toastConfig.setToastConfig({
                        message: data.message,
                        type: "success",
                        open: true,
                    });
                    getFrequentlyBoughtProduct()
                })
                .catch((error) => {
                    toastConfig.setToastConfig(error);
                });
        }
    };

    const handleOpenUpdateDialog = () => {
        setOpenUpdateDialog(true);
    };

    const handleDelete = () => {

        axiosInstance().put(`${product.api}/remove`, { "ids": [id] }).then(() => {
            setShowConfirmBox(false);
            history.goBack();
        }).catch((error) => {
            toastConfig.setToastConfig(error)
            setShowConfirmBox(false);
        });
    }


    const getWarehouses = () => {
        setLoadingWarehouse(true)
        axiosInstance().get(`product/${id}/inventory`)
            .then(async ({ data: { data } }) => {
                setProductWarehouseData(data)
                if (productData?.serializedProduct) {
                    let wareHouses = []
                    let byStatus = []
                    for (const d of data) {
                        if (!wareHouses.includes(d?.warehouse?.optionLabel)) {
                            wareHouses.push(d?.warehouse?.optionLabel)
                        }
                        if (!byStatus.includes(d?.status)) {
                            byStatus.push(d?.status)
                        }
                    }
                    const inventories = wareHouses.map(w => {
                        let inventory = data.filter(d => w === d?.warehouse?.optionLabel);
                        let status = byStatus.map(status => {
                            let count = data.filter(d => w === d?.warehouse?.optionLabel).filter(d => status === d?.status).length;
                            if (count) {
                                return { status, count }
                            }
                        }).filter(x => x)
                        return { warehouse: w, inventory, status }
                    })
                    setInventoriesData(inventories)
                    setLoadingWarehouse(false)

                } else {
                    setInventoriesData(data)
                    setLoadingWarehouse(false)

                }
            }).catch(err => {
                setLoadingWarehouse(false)
                toastConfig.setToastConfig(err)
            })
    }


    const getColumns = () => {
        if (productData === null) return
        const { parent, packages } = productData
        if (gridApi) {
            gridApi.setRowData([]);
        }
        dispatch({ type: "loading", loading: true });
        let newColumns = []
        let rowsData = []
        if (activeTable === "parent") {
            rowsData = parent ? parent.map(product => ({
                ...product,
                serializedProduct: product.serializedProduct ? "Yes" : "No",
                productType: product.productType,
                createdBy: product.createdBy.user.concatedName,
                createdByDate: product.createdBy.date,
                updatedBy: product.updatedBy.user.concatedName,
                updatedByDate: product.updatedBy.date,
            })) : []
            newColumns = [
                { field: "productName", headerName: "Product Description", show: true, disabled: false, cellRenderer: "productNameRenderer" },
                { field: "productNumber", headerName: "Product Number", show: true, cellRenderer: "commonRenderer" },
                { field: "longDescription", headerName: "Long Description", show: true, cellRenderer: "commonRenderer" },
                { field: "productCategory", headerName: "Product Category", show: true, disabled: false, cellRenderer: "productCategoryRenderer" },
                { field: "mrp", headerName: "MRP", show: true, disabled: false, cellRenderer: "commonRenderer" },
                { field: "productType", headerName: "Product Type", show: true, disabled: false, cellRenderer: "commonRenderer" },
                { field: "serializedProduct", headerName: "Serialized Product", show: true, disabled: false, cellRenderer: "commonRenderer" },
                { field: "ratingsCount", headerName: "Ratings Count", show: true, disabled: false, cellRenderer: "commonRenderer" },
                { field: "createdBy", headerName: "Created By", show: true, disabled: false, cellRenderer: "createdByRenderer" },
                { field: "updatedBy", headerName: "Updated By", show: true, disabled: false, cellRenderer: "updatedByRenderer" },

            ]
        } else {
            rowsData = packages ? packages.map(({ products, ...p }) => ({
                ...p,
                createdBy: p.createdBy.user.concatedName,
                createdByDate: p.createdBy.date,
                updatedBy: p.updatedBy.user.concatedName,
                updatedByDate: p.updatedBy.date,
            })) : []
            newColumns = [
                { field: "packageName", headerName: "Package Name", show: true, cellRenderer: "packageNameRenderer" },
                { field: "packageDescription", headerName: "Package Description", show: true, disabled: false, cellRenderer: "commonRenderer" },
                { field: "createdBy", headerName: "Created By", show: true, disabled: false, cellRenderer: "createdByRenderer" },
                { field: "updatedBy", headerName: "Updated By", show: true, disabled: false, cellRenderer: "updatedByRenderer" },
            ];
        }
        setColumns(newColumns)
        dispatch({ type: "initialize", data: rowsData, count: rowsData.length });
        dispatch({ type: "loading", loading: false });
    }


    const ProductNameRenderer = params => (
        <Link className="link" title={params.value} to={`${routes.productDetail.path}/${params.data._id}`}>
            {params.value}
        </Link>
    )

    const PackageNameRenderer = params => (
        <Link className="link" title={params.value} to={`${routes.packagesDetail.path}/${params.data._id}`}>
            {params.value}
        </Link>
    )

    const ProductCategoryRenderer = (params) => params.data.productCategory ?
        <Chip
            className="ml-3"
            style={{ backgroundColor: `${params.data.productCategory.chipColor}` }}
            label={`${params.data.productCategory.optionLabel}`}
        />
        : <NoDataCell />



    const frameworkComponents = {
        productNameRenderer: ProductNameRenderer,
        packageNameRenderer: PackageNameRenderer,
        createdByRenderer: CreatedByRenderer,
        updatedByRenderer: UpdatedByRenderer,
        productCategoryRenderer: ProductCategoryRenderer,
        commonRenderer: CommonRenderer,
    };


    return (
        <>
            <Fragment>

                <Grid container className="headerbox">
                    <CustomBreadCrumbs routes={customizedRoutes} />
                </Grid>
                <Grid container spacing={1} className="detail-container">
                    <Grid item xs={12} sm={12}
                        md={process.env.REACT_APP_ENV === 'staging' ? 12 : 8}
                        lg={process.env.REACT_APP_ENV === 'staging' ? 12 : 8}>
                        <Paper>
                            {!productData ? (
                                <div>
                                    <Skeleton variant="text" width="150px" height="40px" />
                                    <Box display="flex">
                                        <Skeleton
                                            style={{ borderRadius: 6 }}
                                            width="120px"
                                            height="80px"
                                        />
                                        <Box marginX={1} />
                                        <Skeleton
                                            style={{ borderRadius: 6 }}
                                            width="120px"
                                            height="80px"
                                        />
                                    </Box>
                                </div>
                            ) : (
                                <DetailsPageHeader
                                    heading={headingLabel}
                                    mainPoints={mainPoints}
                                    showHeading={true}
                                >
                                    {permissions?.product?.isUpdate && (
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            size="small"
                                            onClick={handleOpenUpdateDialog}
                                        >
                                            Edit
                                        </Button>
                                    )}
                                    {permissions?.product?.isDelete &&
                                        <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />
                                    }

                                </DetailsPageHeader>
                            )}
                            <Tabs
                                className="oms-tab"
                                value={tabValue}
                                onChange={handleMainTabChange}
                                indicatorColor="primary"
                                textColor="primary"
                                aria-label="icon tabs example"
                                TabIndicatorProps={{
                                    style: {
                                        height: 0
                                    }
                                }}
                            >
                                <Tab
                                    label="Details"
                                    aria-controls="a11y-tabpanel-0"
                                    id="a11y-tab-0"
                                />
                                <Tab
                                    label="Packages"
                                    aria-controls="a11y-tabpanel-1"
                                    id="a11y-tab-1"
                                />
                                <Tab
                                    label="Parent Product"
                                    aria-controls="a11y-tabpanel-2"
                                    id="a11y-tab-2"
                                />
                            </Tabs>
                            <TabPanel value={tabValue} index={0}>
                                <Box>
                                    {loading || !productFields.length ? (
                                        <Grid container spacing={2} style={{ padding: "8px" }}>
                                            <CommonSkeleton lenArray={[...Array(7).keys()]} />
                                        </Grid>
                                    ) : (
                                        <div className="pb-3">
                                            <DetailsPage data={productData} fields={productFields} />
                                        </div>
                                    )}
                                </Box>

                            </TabPanel>
                            <TabPanel value={tabValue} index={1}>
                                <CustomAgGrid
                                    allowSelection={false}
                                    allowAction={false}
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
                                    loading={gridLoading}
                                    renderedFrom="productMasterDetailsPage"
                                    refreshGrid={getColumns}
                                />
                            </TabPanel>
                            <TabPanel value={tabValue} index={2}>
                                <CustomAgGrid
                                    allowSelection={false}
                                    allowAction={false}
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
                                    loading={gridLoading}
                                    renderedFrom="productMasterDetailsPage"
                                    refreshGrid={getColumns}
                                />
                            </TabPanel>
                        </Paper>
                    </Grid>
                    {
                        process.env.REACT_APP_ENV === 'staging' ? null :
                            <Grid item xs={12} sm={12}
                                md={4} lg={4}>
                                <Paper style={{ overflow: 'hidden' }}>
                                    <Box
                                        padding={1}
                                        bgcolor="grey.200"
                                        display="flex"
                                        justifyContent="space-between"
                                        alignItems="center"
                                    >
                                        <Typography variant="subtitle2">
                                            BOM
                                        </Typography>

                                        {permissions.product.isUpdate && (
                                            <IconButton
                                                title="Manage Product(s)"
                                                color="primary"
                                                size="small"
                                                onClick={() => { setOpenAssignProductDialog(true) }}
                                            >
                                                <ControlPoint />
                                            </IconButton>
                                        )}
                                    </Box>
                                    {(
                                        <Box style={{ paddingBottom: "8px" }}>
                                            {loading || loadingBOMData ? (
                                                [1, 2].map((i) => (
                                                    <BoxWithBorder
                                                        key={i}
                                                        style={{
                                                            margin: "8px",
                                                        }}
                                                    >
                                                        <Box padding={1}>
                                                            <Skeleton
                                                                variant="text"
                                                                width="100px"
                                                                height="20px"
                                                            />
                                                            <Box marginTop={1} />
                                                            <Skeleton variant="text" width="100%" height="15px" />
                                                        </Box>
                                                    </BoxWithBorder>
                                                ))
                                            ) : BOMData.length ? (
                                                <>
                                                    {/* <AssignedFrequentlyBoughtProduct
                                                permissions={permissions.product}
                                                product={frequentlyBoughtProduct}
                                                unassignProduct={unassignProduct}
                                            /> */}
                                                    <ProductHierarchy
                                                        data={BOMData}
                                                        permissions={permissions.product}
                                                        unassignProduct={unassignProduct}
                                                    />
                                                    <Box px={1} my={1} >
                                                        <Button
                                                            fullWidth
                                                            variant="outlined"
                                                            color='primary'
                                                            onClick={() => history.push(`${routes.productDetail.path}/${id}/bom`, { productName: productData.productName })}>
                                                            View All
                                                        </Button>
                                                    </Box>
                                                </>
                                            ) : (
                                                <Box textAlign="center" padding={2} minHeight={150}>
                                                    <Typography>No Product has been assigned </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    )}
                                </Paper>
                                <Paper className="mt-2" style={{ overflow: 'hidden' }}>
                                    <Box
                                        padding={1}
                                        bgcolor="grey.200"
                                        display="flex"
                                        justifyContent="space-between"
                                        alignItems="center"
                                    >
                                        <Typography variant="subtitle2">
                                            Plants ({inventoriesData.length || 0})
                                        </Typography>

                                        {permissions?.productInventory?.isCreate && (
                                            <IconButton
                                                title="Manage Plant(s)"
                                                color="primary"
                                                size="small"
                                                onClick={() => { setOpenProductInventoryDialog(true) }}
                                            >
                                                <ControlPoint />
                                            </IconButton>
                                        )}
                                    </Box>
                                    {(
                                        <Box style={{ paddingBottom: "8px" }}>
                                            {loading || loadingWarehouse ? (
                                                [1, 2].map((i) => (
                                                    <BoxWithBorder
                                                        key={i}
                                                        style={{
                                                            margin: "8px",
                                                        }}
                                                    >
                                                        <Box padding={1}>
                                                            <Skeleton
                                                                variant="text"
                                                                width="100px"
                                                                height="20px"
                                                            />
                                                            <Box marginTop={1} />
                                                            <Skeleton variant="text" width="100%" height="15px" />
                                                        </Box>
                                                    </BoxWithBorder>
                                                ))

                                            ) : inventoriesData.length ?
                                                productData?.serializedProduct
                                                    ? inventoriesData.map(({ inventory, warehouse, status }, i) => (
                                                        <Box key={i}>
                                                            <Box
                                                                display="flex"
                                                                bgcolor="#f7f5f5"
                                                                borderRadius="3px"
                                                                borderBottom="1px solid #efe7e7">
                                                                <Grid>
                                                                    <Grid item xs={8}>
                                                                        <Box display="flex" alignItems="center">
                                                                            <Box >
                                                                                <IconButton size='small' onClick={() => {
                                                                                    if (selectedWarehouse !== warehouse) {
                                                                                        setSelectedWarehouse(warehouse)
                                                                                    } else {
                                                                                        setSelectedWarehouse(null)

                                                                                    }
                                                                                }}>
                                                                                    {selectedWarehouse === warehouse ? <ExpandLess /> : <ExpandMore />}
                                                                                </IconButton>
                                                                            </Box>
                                                                            <Box ml={1} display="flex" alignItems='center'>
                                                                                <Typography
                                                                                    variant="subtitle2"
                                                                                    color="primary"
                                                                                    className="d-flex align-items-center"
                                                                                    style={{ display: 'inline-block', whiteSpace: 'nowrap' }}
                                                                                >
                                                                                    {warehouse} ({inventory.length || 0})
                                                                                </Typography>
                                                                                <Box mx={1} />
                                                                                <HtmlTooltip arrow interactive title={
                                                                                    <>
                                                                                        <Typography>Inventory Status: </Typography>
                                                                                        {status.map((s) => (
                                                                                            <Typography>
                                                                                                {`(${s.count}) ${s.status}`}
                                                                                            </Typography>
                                                                                        ))}
                                                                                    </>
                                                                                }>
                                                                                    <IconButton size="small">
                                                                                        <InfoOutlined />
                                                                                    </IconButton>
                                                                                </HtmlTooltip>
                                                                            </Box>
                                                                        </Box>
                                                                    </Grid>
                                                                </Grid>
                                                            </Box>
                                                            <Box p={1}>
                                                                {selectedWarehouse === warehouse && inventory?.slice(0, 6).map((i, index) => (
                                                                    <Fragment key={i._id}>
                                                                        {i?.serialNumber ? index === 5 ?
                                                                            <Button
                                                                                fullWidth
                                                                                className="mt-2"
                                                                                variant="outlined"
                                                                                color='primary'
                                                                                onClick={() => {
                                                                                            history.push(`${routes.productInventory.path}`, {
                                                                                                warehouse: productWarehouseData.find(d => d?.warehouse?.optionLabel === selectedWarehouse).warehouse,
                                                                                                product: { "id": id, "name": headingLabel },
                                                                                            })
                                                                                        }}>
                                                                                View All
                                                                            </Button>
                                                                            // <Chip
                                                                            //     label={"show more"}
                                                                            //     // color="secondary"
                                                                            //     style={{ marginRight: '2px', background: "#1aa3ff" }}
                                                                            //     onClick={() => {
                                                                            //         history.push(`${routes.productInventory.path}`, {
                                                                            //             warehouse: productWarehouseData.find(d => d?.warehouse?.optionLabel === selectedWarehouse).warehouse,
                                                                            //             product: { "id": id, "name": headingLabel },
                                                                            //         })
                                                                            //     }} />
                                                                            : <Chip
                                                                                label={i?.serialNumber}
                                                                                // color="secondary"
                                                                                style={{ marginRight: '2px', background: ["New", "Available"].indexOf(i?.status) >= 0 ? "#b9ffce" : "#ffb4b4" }}
                                                                                onClick={() => {
                                                                                    history.push({ pathname: `${routes.productInventoryDetail.path}/${i._id}` })
                                                                                }} /> : null
                                                                        }
                                                                    </Fragment>
                                                                ))}
                                                            </Box>
                                                        </Box>
                                                    )) :

                                                    <Box width="100%">
                                                        <Box mx={2} mt={1} display="flex" justifyContent="space-between">
                                                            <Typography variant="h6">Plants</Typography>
                                                            <Typography variant="h6">Qty.</Typography>
                                                        </Box>
                                                        {
                                                            inventoriesData.map(({ qty, wareHouse }) => (
                                                                <List disablePadding key={wareHouse?._id}>
                                                                    <ListItem dense>
                                                                        <ListItemText primary={wareHouse?.warehouseName} />
                                                                        <ListItemSecondaryAction>
                                                                            <Typography variant="h6">
                                                                                {qty}
                                                                            </Typography>
                                                                        </ListItemSecondaryAction>
                                                                    </ListItem>
                                                                </List>
                                                            ))
                                                        }
                                                    </Box>
                                                : (
                                                    <Box textAlign="center" padding={2} minHeight={150}>
                                                        <Typography>No Plants Found</Typography>
                                                    </Box>
                                                )}
                                        </Box>
                                    )}
                                </Paper>
                            </Grid>
                    }
                </Grid>

            </Fragment>
            {showConfirmBox && (
                <ConfirmationDialog
                    open={showConfirmBox}
                    message={`Are you sure you want to delete this product ${headingLabel} ?`
                    }
                    onClose={() => {
                        setShowConfirmBox(false);
                    }}
                    onOk={handleDelete}
                />
            )}
            {openUpdateDialog &&
                <CreateProduct
                    isClone={false}
                    productId={id}
                    handleClose={() => {
                        setOpenUpdateDialog(false)
                        getProductFieldsAndData()
                    }}
                    openFrom="productMaster"
                />
            }
            {openAssignProductDialog &&
                <AssignProductDialog
                    productsDialogOpen={openAssignProductDialog}
                    productId={id}
                    handleCloseDialog={() => setOpenAssignProductDialog(false)}
                    assignedProducts={BOMData}
                    onSuccess={() => {
                        getFrequentlyBoughtProduct();
                        if (process.env.REACT_APP_ENV !== 'staging') {
                            getProductTree()
                        }
                        setOpenAssignProductDialog(false)
                    }
                    }
                />
            }

            {openProductInventoryDialog ?
                productData.serializedProduct ? <ManageProductInventory
                    productId={productData?._id}
                    productCategory={productData?.productCategory}
                    productInventoryId={null}
                    onClose={() => setOpenProductInventoryDialog(false)}
                    onSuccess={() => {
                        setOpenProductInventoryDialog(false)
                        if (process.env.REACT_APP_ENV !== 'staging') {
                            getWarehouses()
                        }
                    }}
                /> : <AssignQuantityDialog
                    ids={id}
                    onClose={() => setOpenProductInventoryDialog(false)}
                    onSuccess={() => {
                        setOpenProductInventoryDialog(false)
                        if (process.env.REACT_APP_ENV !== 'staging') {
                            getWarehouses()
                        }
                    }}
                    resource={warehouse.warehouseApi}
                    title="Assign Plants"
                    label='Select Plants'
                    resourceData={inventoriesData} />
                : null
            }
        </>
    );
};

export default ProductDetailsPage;
