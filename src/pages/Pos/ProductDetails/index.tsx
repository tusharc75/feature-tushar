import { useState, useEffect, Fragment, useContext, useRef } from 'react';
import { Box, Button, Grid, makeStyles, Paper, IconButton } from '@material-ui/core';
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
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import AddIcon from '@material-ui/icons/Add';
import RemoveIcon from '@material-ui/icons/Remove';
import Parts from '../Parts';

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
        position: "relative"
        // alignItems: "center",
        // minHeight: "300px",
        // height: "70vh",
        // margin: "auto",
        // "@media screen and (max-width: 960px)": {
        //     height: "30vh",
        //     width: "40%",
        // }
    },
    zoomWrapper: {
        position: 'absolute',
        overflow: 'hidden',
        left: "calc(10% + 500px)",
        top: "10%",
        width: 500,
        height: 500,
        boxShadow: "10px 10px 20px 10px rgba(0,0,0,0.2)",
        zIndex: 9999999,
        backgroundColor: 'white'
    },
    zoomContainer: {
        width: '200%',
        height: '200%',
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        display: 'flex',
        justifyContent: "center",
        alignItems: 'center',
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
    const [cart, setCart] = useState([])
    const [qtyDialog, setQtyDialog] = useState(false)
    const [isHovering, setHovering] = useState(false)
    const [loadingCart, setLoadingCart] = useState(false)
    const [imageTransform, setImageTransform] = useState({
        xAxis: 0,
        yAxis: 0
    })
    const [hoverImage, setHoverImage] = useState("")
    const imageRef = useRef<HTMLImageElement>(null)


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
        axiosInstance().get(`/pos/cart/${warehouseId}`)
            .then(({ data: { data } }) => {
                setCart(data)
                fetchProductData()
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
            setLoadingCart(true)
            axiosInstance().post(`/pos/cart`, data)
                .then(({ data }) => {
                    fetchCart()
                    setLoadingCart(false)
                    setQtyDialog(false)
                }).catch((error) => {
                    toastConfig.setToastConfig(error)
                    setLoadingCart(false)
                });
        }
    }

    const handleUpdateCart = (product, operation) => {
        let data = {
            "_id": product._id,
            "qty": operation === "add" ? parseInt(product?.qty || 0) + 1 : parseInt(product?.qty || 0) - 1,
        }
        if (data?.qty) {
            setLoadingCart(true)
            axiosInstance().put(`/pos/cart`, data)
                .then(({ data }) => {
                    fetchCart()
                    fetchProductData()
                    setLoadingCart(false)
                }).catch((error) => {
                    toastConfig.setToastConfig(error)
                    setLoadingCart(false)
                });
        }
        else {
            setLoadingCart(true)
            axiosInstance().put(`/pos/cart/remove`, { ids: [data._id] })
                .then(({ data }) => {
                    fetchCart()
                    setLoadingCart(false)
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

    const hoverOverImage = (e: React.MouseEvent<HTMLImageElement>) => {
        const { width, height } = imageRef.current.getBoundingClientRect();
        const xAxis = e.nativeEvent.offsetX / width * 80;
        const yAxis = e.nativeEvent.offsetY / height * 85;
        setImageTransform({ xAxis, yAxis })
    }

    const handleDeleteCart = (product) => {
        axiosInstance().put(`/pos/cart/remove`, { ids: [product._id] })
            .then(({ data }) => {
                toastConfig.setToastConfig({
                    open: true,
                    type: 'success',
                    message: data.message
                });
                fetchCart()
                fetchProductData()
            }).catch((error) => {
                toastConfig.setToastConfig(error)
            });
    };

    return (<Fragment>
        <Grid container className="headerbox">
            <CustomBreadCrumbs routes={[routes.pos, { title: productData?.productName }]} />
        </Grid>
        <Grid container spacing={1} className="detail-container">
            <Grid item xs={12} sm={12} md={12} lg={12}>
                <Paper>
                    <div className="container">
                        <Box> {productData ?
                            <Grid container className={`py-5`} spacing={4}>
                                <Grid item xs={12} sm={6} md={6} lg={6} style={{ maxHeight: "450px", minHeight: "450px" }} className="d-flex flex-column align-items-center">
                                    {productImages.length > 0 ? (
                                        <>
                                            <Carousel
                                                strictIndexing
                                                animation="slide"
                                                autoPlay={productImages.length > 1 && !isHovering ? true : false}
                                                navButtonsAlwaysInvisible
                                                cycleNavigation={productImages.length > 1 ? true : false}
                                                indicators={productImages.length > 1 ? true : false}
                                                timeout={150}
                                                navButtonsProps={{
                                                    style: {
                                                        opacity: 0.4,
                                                        padding: 5,
                                                        borderRadius: "50%"
                                                    }
                                                }}
                                            >
                                                {productImages.map((image: any, i) => (
                                                    <div key={i} onMouseLeave={() => {
                                                        setHoverImage('');
                                                        setHovering(false)
                                                    }}
                                                        onMouseEnter={() => {
                                                            setHoverImage(image);
                                                            setHovering(true)
                                                        }}
                                                        onMouseMove={hoverOverImage} className={classes.imageContainer}
                                                        ref={imageRef}
                                                    >
                                                        <img

                                                            src={image}
                                                            style={{
                                                                width: "95%",
                                                                height: "100%",
                                                                maxHeight: "400px",
                                                                backgroundRepeat: "no-repeat"
                                                            }} />

                                                    </div>
                                                ))}
                                            </Carousel>
                                            {isHovering &&
                                                <div className={classes.zoomWrapper}>
                                                    <div className={classes.zoomContainer} style={{ transform: `translate(-${imageTransform.xAxis}%, -${imageTransform.yAxis}%)` }}>
                                                        <img style={{ width: "100%", height: "auto" }} src={hoverImage} />
                                                    </div>
                                                </div>
                                            }
                                        </>
                                    ) : (
                                        <div>
                                            <BsImage className={styles.product_no_image} />
                                        </div>
                                    )}
                                </Grid>
                                <Grid item xs={12} sm={6} md={6} lg={6}>
                                    <Box border={1} borderColor="grey.300" borderRadius={5} style={{ height: "100%" }}>
                                        <Grid className='px-2 py-2 first-content-Layout'>
                                            <h4>{productData.productCategory?.optionLabel}</h4>
                                            <h2 className='pt-1 pb-1' style={{ color: "white", fontSize: "1.5rem" }}>{productData.productName}</h2>
                                            {productData?.availableInventory ?
                                                <h4>{`Inventory - ${productData?.availableInventory}`}</h4> :
                                                <h4>{`No inventory`}</h4>
                                            }
                                        </Grid>
                                        {productData?.productShortDetail &&
                                            <Box pl={3} pt={2}>
                                                <div dangerouslySetInnerHTML={{ __html: productData?.productShortDetail }}></div>
                                            </Box>
                                        }
                                        <Box pl={3} pt={2} pb={2} >
                                            {cartProduct ?
                                                <Box display="flex" flexDirection="row"  >
                                                    <IconButton
                                                        color="secondary"
                                                        size="small"
                                                        style={{ border: "1px solid" }}
                                                        disabled={cartProduct?.qty >= productData?.availableInventory}
                                                        onClick={() => { handleUpdateCart(cartProduct, "add") }}>
                                                        <AddIcon fontSize="small" />
                                                    </IconButton >
                                                    <IconButton
                                                        disabled
                                                        size="small">
                                                        <Box pl={1} pr={1}>
                                                            {`${cartProduct?.qty}`}
                                                        </Box>
                                                    </IconButton>
                                                    <IconButton
                                                        style={{ border: "1px solid" }}
                                                        color="secondary"
                                                        size="small"
                                                        onClick={() => { handleUpdateCart(cartProduct, "subtract") }}>
                                                        <RemoveIcon fontSize="small" />
                                                    </IconButton>
                                                    <Box pl={1}>
                                                        <IconButton
                                                            style={{ border: "1px solid", color: "red" }}
                                                            color="secondary"
                                                            size="small"
                                                            onClick={() => { handleDeleteCart(cartProduct) }}>
                                                            <DeleteOutlineIcon fontSize="small" />
                                                        </IconButton>
                                                    </Box>
                                                </Box>
                                                : <>
                                                    <HtmlTooltip title={productData?.availableInventory ? 'Add to cart' : 'No inventory'} >
                                                        <span>
                                                            <Button
                                                                variant="outlined"
                                                                size="small"
                                                                disabled={!productData?.availableInventory}
                                                                aria-label="Add to cart"
                                                                onClick={() => {
                                                                    setQtyDialog(true)
                                                                }}
                                                                color={productData?.availableInventory ? "secondary" : "inherit"}
                                                                startIcon={<MdAddShoppingCart />}
                                                            >
                                                                Add to cart
                                                            </Button>
                                                        </span>
                                                    </HtmlTooltip>
                                                </>}
                                        </Box>
                                    </Box>
                                </Grid>
                            </Grid> :
                            <Grid container className="py-4 px-2">
                                <Grid item xs={6} className="d-flex flex-column align-items-center">
                                    <Box display="flex" justifyContent="center" alignItems="center">
                                        <Skeleton width={200} height={200} />
                                    </Box>
                                    <Skeleton width={120} height={50} />
                                </Grid>
                                <Grid item xs={6}>
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
                            <Parts
                                product={id}
                                warehouse={warehouseId}
                                fetchCart={fetchCart}
                                cart={cart}
                            />
                            {productData?.productLongDetail &&
                                <Box pb={3}>
                                    <Box mt={3} mb={3} border={1} borderColor="grey.100"></Box>
                                    <div className="w-100 my-3 mb-2">
                                        <h2>Product Details</h2>
                                    </div>
                                    <div dangerouslySetInnerHTML={{ __html: productData?.productLongDetail }}></div>
                                </Box>
                            }
                        </Box>
                    </div>
                </Paper>
            </Grid>
        </Grid >
        {qtyDialog &&
            <QuantityDialog
                handleAddToCart={handleAddToCart}
                product={productData}
                handleCloseDialog={() => { setQtyDialog(false) }}
                loading={loadingCart}
            />
        }
    </Fragment >
    );
};

export default ProductDetails;