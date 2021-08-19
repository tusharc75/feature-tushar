import React, { useState, useEffect, useContext, Fragment } from "react";
import { Grid, Box, Button, Typography, IconButton, Paper, Dialog } from "@material-ui/core";
import { ControlPoint } from "@material-ui/icons";
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
import { getUniqueCurrencies, product } from "../../constants/helpers";
import CreateProduct from "../../components/Product/CreateProduct";
import { uniq, map, orderBy } from 'lodash';
import BoxWithBorder from "../../components/BoxWithBorder";
import DeleteButton from "../../components/Helpers/DeleteButton";

const ProductDetailsPage = () => {
    const toastConfig = useContext(CustomToastContext);

    const { id } = useParams();
    const history = useHistory();
    const {
        state: { permissions },
        dispatch,
    }: any = useData();
    const [headingLabel, setHeadingLabel] = useState("");
    const [loading, setLoading] = useState(false);
    const [productData, setProductData] = useState(null);
    const [showConfirmBox, setShowConfirmBox] = useState(false);
    const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
    const [productFields, setProductFields] = useState([]);
    const [mainPoints, setMainPoints] = useState(null);
    const [customizedRoutes, setCustomizedRoutes] = useState([]);
    const [currencySymbol, setCurrencySymbol] = useState(null);
    const [fields, setFields] = useState([]);
    const ignoreField = ["priceTemplate"]


    useEffect(() => {
        if (id) {
            getProductFieldsAndData();
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

                const newField = _fields;
                axiosInstance().get(`/product/` + id).then(({ data: { data } }) => {
                    data.fields?.map((_f) => newField.push({ "fieldData": _f }));
                    data.productData.fields?.map((_f) => newField.push({ "fieldData": _f }));
                    setFields(data.productData.fields)
                    newField.map((_f) => {
                        if (_f.fieldData?.fieldName === "currency") {
                            setCurrencySymbol(
                                getUniqueCurrencies().find(
                                    (d) => d.currencyCode === data.productData["currency"]
                                )?.symbolNative
                            );
                        }
                    });
                    setProductFields(newField)
                    handleMainPoints(data.productData);
                    setHeadingLabel(data.productData.productName);
                    setCustomizedRoutes([routes.product, { title: `${data.productData.productName}` }]);
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

                                {permissions.role.isUpdate && (
                                    <IconButton
                                        title="Assign users"
                                        color="primary"
                                        size="small"
                                        onClick={() => { }}
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

                                    ) : (
                                        <Box textAlign="center" padding={2}>
                                            <Typography>No Product has been assigned </Typography>
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
        </>
    );
};

export default ProductDetailsPage;
