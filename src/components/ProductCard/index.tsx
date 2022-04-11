
import routes from '../Helpers/Routes';
import CustomBreadCrumbs from '../CustomBreadCrumbs';
import CustomContainer from '../CustomContainer';
import { Fragment, useEffect, useState } from 'react';
import Box from '@material-ui/core/Box';
import { Skeleton } from '@material-ui/lab';
import Carousel from 'react-material-ui-carousel';
import { BsFillCircleFill, BsImage } from 'react-icons/bs';
import { formatAmountWithCurrency } from 'src/constants/helpers';
import { useHistory } from 'react-router-dom';
import styles from './product-card.module.scss'
import { Avatar, makeStyles } from '@material-ui/core';
import { MdAddShoppingCart } from 'react-icons/md';

const useStyles = makeStyles(() => ({
    imageContainer: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative"
    },
    img: {
        height: "500px",
        maxWidth: "500px",
    },



}));
const ProductCad = ({ product, showSkeleton = false, handleAddToCart = null, disabledCart = false }) => {
    const history = useHistory();
    const classes = useStyles();
    const [productImages, setProductImages] = useState([])

    useEffect(() => {
        if (product !== null) {
            if (product.hasOwnProperty(["sliderImage"])) {
                setProductImages([product.productImage ?? "", ...product["sliderImage"] as []].filter(image => image));
            } else {
                setProductImages([product.productImage ?? ""].filter(f => f));
            }
        }
    }, [product]);

    return (
        <Fragment>
            <div className={styles.product_card}>

                <div className={styles.title}>
                    {
                        showSkeleton ? <Skeleton width={120} height={30} /> : <h4
                            className="cursor-pointer"
                            onClick={() => {
                                history.push(`${routes.productDetail.path}/${product._id}`);
                            }}
                        >{`${product?.productName} `}</h4>
                    }
                </div>
                <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    className="fullcarousellayout"
                >
                    {
                        showSkeleton ? <Skeleton height={200} width={200} /> : (productImages.length > 0 ? <Carousel
                            strictIndexing
                            IndicatorIcon={<BsFillCircleFill size={10} style={{ paddingLeft: "2px" }} />}
                            animation="slide"
                            autoPlay={false}
                            navButtonsAlwaysInvisible
                            indicators={productImages.length > 1}
                            indicatorContainerProps={{
                                className: "indicators-pops"
                            }}
                            cycleNavigation={false}
                            navButtonsProps={{          // Change the colors and radius of the actual buttons. THIS STYLES BOTH BUTTONS
                                style: {
                                    top: "38%",
                                    opacity: 0.3,
                                    padding: 5,
                                    borderRadius: "50%"
                                }
                            }}
                        >
                            {productImages.map((image: any, i) => (
                                <div key={i} className={classes.imageContainer}>
                                    <img className={classes.img} src={image}
                                        onClick={() => {
                                            history.push(`${routes.productDetail.path}/${product._id}`);
                                        }}
                                    />
                                </div>
                            ))}
                        </Carousel> : <BsImage className={`${styles.no_image} cursor-pointer`} onClick={() => {
                            history.push(`${routes.productDetail.path}/${product?._id}`);
                        }} />)
                    }

                </Box>

                <div className={styles.text}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <div>
                            {
                                showSkeleton ? <Skeleton width={100} height={30} /> : (product.mrp && parseInt(product.mrp) !== 0) &&
                                    <>
                                        <span className={styles.amount}>{formatAmountWithCurrency(product.currency, product.mrp).fullFormatAmount}</span>
                                        {(product.discount && parseInt(product.discount) !== 0) && <span className={styles.amount_stricked}>{formatAmountWithCurrency(product.currency, product.mrp).fullFormatAmount}</span>}
                                    </>
                            }
                        </div>
                        <div>
                            {!disabledCart && (showSkeleton ? <Skeleton width={30} height={30} /> : <Avatar className={`${styles.cart_icon} cursor-pointer`} onClick={() => { handleAddToCart([product]) }}>
                                <MdAddShoppingCart size={18} />
                            </Avatar>)
                            }
                        </div>
                    </Box>
                </div>

            </div >
        </Fragment >
    );
};

export default ProductCad;


