import routes from '../Helpers/Routes';
import { Fragment, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { Skeleton } from '@material-ui/lab';
import Carousel from 'react-material-ui-carousel';
import { BsFillCircleFill, BsImage } from 'react-icons/bs';
import { useHistory } from 'react-router-dom';
import styles from './product-card.module.scss';
import { Avatar } from '@mui/material';
import { MdAddShoppingCart } from 'react-icons/md';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles(() => ({
  imageContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  img: {
    height: '500px',
    maxWidth: '500px'
  }
}));

const ProductCad = ({ product, plantId = null, showSkeleton = false, setAssignCartProductQty = null, disabledCart = false }) => {
  const history = useHistory();
  const classes = useStyles();
  const [productImages, setProductImages] = useState([]);

  useEffect(() => {
    if (product !== null) {
      if (product.hasOwnProperty(['sliderImage'])) {
        setProductImages([product.productImage ?? '', ...(product['sliderImage'] as [])].filter((image) => image));
      } else {
        setProductImages([product.productImage ?? ''].filter((f) => f));
      }
    }
  }, [product]);

  return (
    <Fragment>
      <div className={styles.product_card}>
        <div className={styles.title}>
          {showSkeleton ? (
            <Skeleton width={120} height={30} />
          ) : (
            <h4
              className={styles.cardProductName}
              onClick={() => {
                history.push(`${routes.posProductDetail.path}/${product._id}/${plantId}`);
              }}
              title={product?.productName}
            >{`${product?.productName}`}</h4>
          )}
        </div>
        <Box display="flex" justifyContent="center" alignItems="center" className="fullcarousellayout">
          {showSkeleton ? (
            <Skeleton height={200} width={200} />
          ) : productImages.length > 0 ? (
            <Carousel
              strictIndexing
              IndicatorIcon={<BsFillCircleFill size={10} style={{ paddingLeft: '2px' }} />}
              animation="slide"
              autoPlay={false}
              navButtonsAlwaysInvisible
              indicators={productImages.length > 1}
              indicatorContainerProps={{
                className: 'indicators-pops'
              }}
              cycleNavigation={false}
              navButtonsProps={{
                style: {
                  top: '38%',
                  opacity: 0.3,
                  padding: 5,
                  borderRadius: '50%'
                }
              }}
            >
              {productImages.map((image: any, i) => (
                <div key={i} className={classes.imageContainer}>
                  <img
                    className={classes.img}
                    src={image}
                    onClick={() => {
                      history.push(`${routes.posProductDetail.path}/${product._id}/${plantId}`);
                    }}
                  />
                </div>
              ))}
            </Carousel>
          ) : (
            <BsImage
              className={`${styles.no_image} cursor-pointer`}
              onClick={() => {
                history.push(`${routes.posProductDetail.path}/${product?._id}/${plantId}`);
              }}
            />
          )}
        </Box>
        <div className={styles.text} style={{ bottom: '0px' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <div>
              {' '}
              {showSkeleton ? (
                <Skeleton width={100} height={30} />
              ) : product.availableInventory ? (
                <span>
                  <span style={{ fontSize: '10px' }}>Inventory</span>
                  <br></br>
                  <span className={styles.amount}>{product.availableInventory}</span>
                </span>
              ) : (
                <span>{'No inventory'}</span>
              )}
            </div>
            <div>
              {' '}
              {!disabledCart &&
                (showSkeleton ? (
                  <Skeleton width={30} height={30} />
                ) : (
                  <Avatar
                    className={`${styles.cart_icon} cursor-pointer`}
                    onClick={() => {
                      setAssignCartProductQty(product);
                    }}
                  >
                    <MdAddShoppingCart size={18} />
                  </Avatar>
                ))}
            </div>
          </Box>
        </div>
      </div>
    </Fragment>
  );
};

export default ProductCad;
