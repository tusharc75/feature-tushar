import { useState, useEffect, Fragment, useContext } from 'react';
import { Box, Button, Grid, makeStyles, Paper } from '@material-ui/core';
import { useParams } from 'react-router-dom';
import routes from '../../../components/Helpers/Routes';
import CustomBreadCrumbs from '../../../components/CustomBreadCrumbs';
import axiosInstance from "src/axios/axiosInstance";
import Skeleton from '@material-ui/lab/Skeleton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import Carousel from 'react-material-ui-carousel';
import { BsImage } from 'react-icons/bs';
import styles from "./product-detail-page.module.scss";
import { MdAdd, MdAddShoppingCart, MdOutlineHorizontalRule } from 'react-icons/md';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import QuantityDialog from '../QuantityDialog';

const useStyles = makeStyles(() => ({
    mainDetail: {
        display: "grid",
        gridTemplateColumns: "minmax(300px, 1fr) minmax(250px , 0.6fr)",
        "@media screen and (max-width: 960px)": {
            gridTemplateColumns: "minmax(300px, 1fr)",

        }
    },
    imageContainer: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "300px",
        height: "70vh",
        "@media screen and (max-width: 960px)": {
            height: "30vh",
            width: "40%",
            margin: "auto"
        }
    },
    img: {
        height: "500px",
        maxWidth: "500px",
    },
    listOpen: {
        backgroundColor: "#F7F7F7",
        borderBottom: "1px solid grey"
    },
    listClose: {
        backgroundColor: "#555555",
        color: "white"
    },
    buyRentSwitch: {
        padding: "0 8px",
    },
    toggle_layout: {
        backgroundColor: "white"
    },

}));

const ProductDetails = () => {

    const classes = useStyles();
    const toastConfig = useContext(CustomToastContext);
    const { id, warehouseId } = useParams();
    const [productData, setProductData] = useState(null);
    const [productImages, setProductImages] = useState([])
    const [cartProduct, setCartProduct] = useState(null)
    const [qtyDialog, setQtyDialog] = useState(false)

    useEffect(() => {
        if (id) {
            fetchProductData();
            fetchCart();
        }
    }, [id]);


    const fetchProductData = () => {
        axiosInstance()
            .get(`/pos/product/${id}/${warehouseId}`)
            .then(({ data: { data } }) => {
                setProductData(data?.productData)
                if (data?.productData.hasOwnProperty(["sliderImage"])) {
                    setProductImages([data?.productData.productImage ?? "", ...data?.productData["sliderImage"] as []].filter(image => image));
                } else {
                    setProductImages([data?.productData.productImage ?? ""].filter(f => f));
                }
            })
            .catch((error) => {
                toastConfig.setToastConfig(error)
            });
    }

    const fetchCart = () => {
        axiosInstance().get(`/pos/cart`)
            .then(({ data: { data } }) => {
                setCartProduct(data.find(d => d.product.optionValue === id))
            })
            .catch((error) => {
                toastConfig.setToastConfig(error);
            });
    }

    const handleAddToCart = (product, qty = null) => {
        if (product?.length === 1) {

            let data = [{
                "product": product[0]._id,
                "qty": parseInt(qty || 1),
                "warehouse": warehouseId
            }]
            axiosInstance().post(`/pos/cart`, data)
                .then(({ data }) => {
                    fetchCart()
                    toastConfig.setToastConfig({
                        open: true,
                        type: 'success',
                        message: "Add to cart successfully"
                    });
                }).catch((error) => {
                    toastConfig.setToastConfig(error)
                });
        }
        setQtyDialog(false)
    }

    const handleUpdateCart = (product, operation) => {
        let data = {
            "_id": product._id,
            "qty": operation === "add" ? parseInt(product?.qty || 0) + 1 : parseInt(product?.qty || 0) - 1,
        }
        if (data?.qty) {
            axiosInstance().put(`/pos/cart`, data)
                .then(({ data }) => {
                    fetchCart()
                    toastConfig.setToastConfig({
                        open: true,
                        type: 'success',
                        message: data.message
                    });
                }).catch((error) => {
                    toastConfig.setToastConfig(error)
                });
        }
        else {
            axiosInstance().put(`/pos/cart/remove`, { ids: [data._id] })
                .then(({ data }) => {
                    fetchCart()
                    toastConfig.setToastConfig({
                        open: true,
                        type: 'success',
                        message: data.message
                    });
                }).catch((error) => {
                    toastConfig.setToastConfig(error)
                });
        }
    };

    return (<Fragment>
        <Grid container className="headerbox">
            <CustomBreadCrumbs routes={[routes.pos, { title: productData?.productName }]} />
        </Grid>
        <Grid container spacing={1} className="detail-container">
            <Grid item xs={12} sm={12} md={12} lg={12}>
                <Paper>
                    <div className="container">
                        <Box>
                            {productData ?
                                <Grid container className={`${classes.mainDetail} py-4 px-2`} spacing={4}>
                                    <Grid className="d-flex flex-column align-items-center">
                                        <Box display="flex" justifyContent="center" alignItems="center" className='w-100' >
                                            <div className='position-relative w-100'>
                                                {productImages.length > 0 ? (
                                                    <Carousel
                                                        strictIndexing
                                                        animation="slide"
                                                        autoPlay={false}
                                                        navButtonsAlwaysInvisible
                                                        cycleNavigation={false}
                                                        indicators={productImages.length > 1}
                                                        timeout={150}
                                                        navButtonsProps={{          // Change the colors and radius of the actual buttons. THIS STYLES BOTH BUTTONS
                                                            style: {
                                                                opacity: 0.4,
                                                                padding: 5,
                                                                borderRadius: "50%"
                                                            }
                                                        }}
                                                    >
                                                        {productImages.map((image: any, i) => (
                                                            <div key={i} className={classes.imageContainer}>
                                                                <img src={image} style={{ height: "100%", width: "80%", maxWidth: "400px", backgroundRepeat: "no-repeat" }} />
                                                            </div>
                                                        ))}
                                                    </Carousel>
                                                ) : (
                                                    <div>
                                                        <BsImage className={styles.product_no_image} />
                                                    </div>
                                                )}
                                            </div>
                                        </Box>
                                    </Grid>
                                    <Grid className="px-0 py-0 my-3" style={{ border: "1px solid grey" }}>
                                        <Grid className=' px-2 py-2 first-content-Layout'>
                                            <h5>{productData.productCategory?.optionLabel}</h5>
                                            <div className="w-100 d-flex align-items-center gap-2 justify-content-space-between" >
                                                <h2 style={{ color: "white", fontSize: "1.5rem" }}>{productData.productName}</h2>
                                            </div>
                                        </Grid>
                                        {
                                            productData?.productShortDetail && <div className="my-3 px-5" dangerouslySetInnerHTML={{ __html: productData?.productShortDetail }}></div>
                                        }
                                        <Box p={1}>
                                            {cartProduct ?
                                                <>
                                                    <Button variant="outlined" color="primary" onClick={() => { handleUpdateCart(cartProduct, "add") }}>
                                                        <MdAdd color="primary" fontSize="small" />
                                                    </Button>
                                                    <Button color="primary" disabled>
                                                        {`${cartProduct?.qty}`}
                                                    </Button>
                                                    <Button variant="outlined" color="primary" onClick={() => { handleUpdateCart(cartProduct, "subtract") }}>
                                                        <MdOutlineHorizontalRule fontSize="small" color="primary" />
                                                    </Button>
                                                </>
                                                : <>
                                                    <HtmlTooltip title={productData?.inventory?.inventory ? 'Add to cart' : 'No inventory'} >
                                                        <span>
                                                            <Button
                                                                variant="outlined"
                                                                size="medium"
                                                                disabled={!productData?.inventory?.inventory || productData?.inventory?.inventory === 0}
                                                                aria-label="Add to cart"
                                                                onClick={() => {
                                                                    setQtyDialog(true)
                                                                }}
                                                                color={productData?.inventory ? "secondary" : "inherit"}
                                                                startIcon={<MdAddShoppingCart />}
                                                            >
                                                                Add to cart
                                                            </Button>
                                                        </span>
                                                    </HtmlTooltip>
                                                </>}
                                        </Box>
                                    </Grid>
                                </Grid> : <Grid container className="py-4 px-2">
                                    <Grid item xs={4} className="d-flex flex-column align-items-center">
                                        <Box display="flex" justifyContent="center" alignItems="center">
                                            <Skeleton width={200} height={200} />
                                        </Box>
                                        <Skeleton width={120} height={50} />
                                    </Grid>
                                    <Grid item xs={8}>
                                        <Skeleton width={70} height={50} />
                                        <Skeleton width={100} height={50} />
                                        <Skeleton width={120} height={50} />
                                        <Skeleton width={150} height={50} />
                                        <Grid container className="mt-4">
                                            <Grid item xs={12} md={6} className="d-flex flex-column gap-3">
                                                <Grid container spacing={2}>
                                                    <Grid item xs={6}>
                                                        <Skeleton width="100%" height={70} />
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <Skeleton width="100%" height={70} />
                                                    </Grid>
                                                </Grid>
                                                <Grid container spacing={2}>
                                                    <Grid item xs={6}>
                                                        <Skeleton width="100%" height={70} />
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <Skeleton width="100%" height={70} />
                                                    </Grid>
                                                </Grid>
                                                <Box className="my-3 d-flex gap-4 align-items-baseline">
                                                    {
                                                        <div className="d-flex align-items-center gap-2">
                                                            <Skeleton width={100} height={50} />
                                                            <Skeleton width={100} height={50} />
                                                        </div>
                                                    }
                                                </Box>
                                                <Skeleton width={150} height={70} />
                                            </Grid>
                                        </Grid>

                                    </Grid>
                                </Grid>
                            }
                            <br></br>
                            <hr />
                            <br></br>
                            {productData?.productLongDetail &&
                                <Fragment>
                                    <div className="d-flex w-100 align-items-center justify-content-center my-3">
                                        <h1>Product Details</h1>
                                    </div>
                                    <div className="px-5" dangerouslySetInnerHTML={{ __html: productData?.productLongDetail }}></div>
                                </Fragment>
                            }
                        </Box>
                    </div>
                </Paper>
            </Grid>
        </Grid>
        {qtyDialog &&
            <QuantityDialog
                handleAddToCart={handleAddToCart}
                product={productData}
                handleCloseDialog={() => { setQtyDialog(false) }}
            />
        }
    </Fragment>
    );
};

export default ProductDetails;
