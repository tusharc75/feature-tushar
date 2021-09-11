import { useState, useEffect, useContext, Fragment } from "react";
import { Grid, Box, Button, Typography, IconButton, Paper, Chip } from "@material-ui/core";
import { ControlPoint, ExpandLess, ExpandMore } from "@material-ui/icons";
import { Skeleton } from "@material-ui/lab";
import { useParams, useHistory } from "react-router-dom";
import axiosInstance from "../../axios/axiosInstance";
import routes from "../../components/Helpers/Routes";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import DetailsPageHeader from "../../components/DetailsPageHeader";
import DetailsPage from "../../components/Shared/DetailsPage";
import { useData } from "../../StateProvider/Provider";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { product } from "../../constants/helpers";
import CreateProduct from "../../components/Product/CreateProduct";
import BoxWithBorder from "../../components/BoxWithBorder";
import DeleteButton from "../../components/Helpers/DeleteButton";
import AssignedFrequentlyBoughtProduct from "./AssignedFrequentlyBoughtProduct";
import AssignProductDialog from "../../components/AssignRolesDialog/AssignProductDialog";
import ManageProductInventory from "../ProductInventory/ManageProductInventory"
import { extractFields } from "../../constants/formulaUtility";

const ProductDetailsPage = () => {
    const toastConfig = useContext(CustomToastContext);

    const { id } = useParams();
    const history = useHistory();
    const {
        state: { user, permissions }
    }: any = useData();
    const [headingLabel, setHeadingLabel] = useState("");
    const [loading, setLoading] = useState(false);
    const [productData, setProductData] = useState(null);
    const [showConfirmBox, setShowConfirmBox] = useState(false);
    const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
    const [openAssignProductDialog, setOpenAssignProductDialog] = useState(false);
    const [productFields, setProductFields] = useState([]);
    const [mainPoints, setMainPoints] = useState(null);
    const [customizedRoutes, setCustomizedRoutes] = useState([]);
    const [frequentlyBoughtProduct, setFrequentlyBoughtProduct] = useState([]);
    const [inventoriesData, setInventoriesData] = useState([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState(null)
    const [openProductInventoryDialog, setOpenProductInventoryDialog] = useState(false);

    const ignoreField = ["priceTemplate"]

    useEffect(() => {
        if (id) {
            getProductFieldsAndData();
            getFrequentlyBoughtProduct();
            getWarehouses()
        }
        // eslint-disable-next-line
    }, [id]);

    const handleMainPoints = (data) => {
        let mainPoint = {};
        mainPoint['Quantity'] = data?.qty || '';
        mainPoint['MRP'] = data?.mrp || '';
        setMainPoints(mainPoint);
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
                    fields = extractFields(fields)
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
        axiosInstance().get(`product/${id}/inventory`)
            .then(async ({ data: { data } }) => {
                let wareHouses = []
                for (const d of data) {
                    if (!wareHouses.includes(d?.warehouse.optionLabel)) {
                        wareHouses.push(d?.warehouse.optionLabel)
                    }
                }
                const inventories = wareHouses.map(w => {
                    let inventory = data.filter(d => w === d?.warehouse.optionLabel);
                    return { warehouse: w, inventory }
                })
                setInventoriesData(inventories)

            }).catch(err => {
                toastConfig.setToastConfig(err)
            })
    }


    return (
        <>
            <Fragment>

                <Grid container className="headerbox">
                    <CustomBreadCrumbs routes={customizedRoutes} />
                </Grid>
                <Grid container spacing={1} className="detail-container">
                    <Grid item xs={12} sm={12} md={8} lg={8} spacing={2}>
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


                            <Box>
                                {loading || !productFields.length ? (
                                    <Grid container spacing={2} style={{ padding: "8px" }}>
                                        <CommonSkeleton lenArray={[...Array(7).keys()]} />
                                    </Grid>
                                ) : (
                                    <>
                                        <DetailsPage data={productData} fields={productFields} />
                                    </>
                                )}
                            </Box>

                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={12} md={4} lg={4} spacing={2}>
                        <Paper>
                            <Box
                                padding={1}
                                bgcolor="grey.200"
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                            >
                                <Typography variant="subtitle2">
                                    Frequently Bought Product
                                </Typography>

                                {permissions.product.isUpdate && (
                                    <IconButton
                                        title="Assign users"
                                        color="primary"
                                        size="small"
                                        onClick={() => { setOpenAssignProductDialog(true) }}
                                    >
                                        <ControlPoint />
                                    </IconButton>
                                )}
                            </Box>
                            {(
                                <Box>
                                    {loading ? (
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

                                    ) : frequentlyBoughtProduct.length ? (
                                        <>
                                            <AssignedFrequentlyBoughtProduct
                                                permissions={permissions.product}
                                                product={frequentlyBoughtProduct}
                                                unassignProduct={unassignProduct}
                                            />
                                            <Box marginY={1} />
                                        </>
                                    ) : (
                                        <Box textAlign="center" padding={2}>
                                            <Typography>No Product has been assigned </Typography>
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </Paper>
                        <Paper>
                            <Box
                                padding={1}
                                bgcolor="grey.200"
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                            >
                                <Typography variant="subtitle2">
                                    Warehouses ({inventoriesData.length || 0})
                                </Typography>

                                {permissions?.productInventory?.isCreate && (
                                    <IconButton
                                        title="Assign users"
                                        color="primary"
                                        size="small"
                                        onClick={() => { setOpenProductInventoryDialog(true) }}
                                    >
                                        <ControlPoint />
                                    </IconButton>
                                )}
                            </Box>
                            {(
                                <Box>
                                    {loading ? (
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
                                        inventoriesData.map(({ inventory, warehouse }) => (
                                            <Box>
                                                <Box key={warehouse}
                                                    display="flex"
                                                    p="8px"
                                                    m="8px 8px 0 8px"
                                                    bgcolor="#fff"
                                                    borderRadius="3px"
                                                    border="1px solid #c9c0c0">
                                                    <Grid>
                                                        <Grid item xs={8}>
                                                            <Box display="flex" alignItems="center">
                                                                <Box >
                                                                    <IconButton size='small' onClick={() => {
                                                                        if (!selectedWarehouse) {
                                                                            setSelectedWarehouse(warehouse)
                                                                        } else {
                                                                            setSelectedWarehouse(null)

                                                                        }
                                                                    }}>
                                                                        {selectedWarehouse === warehouse ? <ExpandLess /> : <ExpandMore />}
                                                                    </IconButton>
                                                                </Box>
                                                                <Box ml={1}>
                                                                    <Typography
                                                                        variant="subtitle2"
                                                                        color="primary"
                                                                        className="d-flex align-items-center"
                                                                        style={{ display: 'inline-block', whiteSpace: 'nowrap' }}
                                                                    >
                                                                        {warehouse} ({inventory.length || 0})
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
                                                        </Grid>
                                                    </Grid>
                                                </Box>
                                                <Box p={1}>
                                                    {selectedWarehouse === warehouse && inventory?.map((i, idx) => (
                                                        <Fragment key={i._id}>
                                                            {i?.serialNumber ?
                                                                <Chip
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
                                        ))
                                        : (
                                            <Box textAlign="center" padding={2}>
                                                <Typography>No Warehouses Found</Typography>
                                            </Box>
                                        )}
                                </Box>
                            )}
                        </Paper>
                    </Grid>

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
                    assignedProducts={frequentlyBoughtProduct}
                    onSuccess={() => {
                        getFrequentlyBoughtProduct();
                        setOpenAssignProductDialog(false)
                    }}
                />
            }

            {openProductInventoryDialog ?
                <ManageProductInventory
                    productId={productData?._id}
                    productCategory={productData?.productCategory}
                    productInventoryId={null}
                    onClose={() => setOpenProductInventoryDialog(false)}
                    onSuccess={() => {
                        setOpenProductInventoryDialog(false)
                        getWarehouses()
                    }}
                /> : null
            }
        </>
    );
};

export default ProductDetailsPage;
