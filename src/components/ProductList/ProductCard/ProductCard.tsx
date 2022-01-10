import { useContext, useState } from "react";
import PropTypes from "prop-types";
import { Box, Avatar, makeStyles, IconButton } from "@material-ui/core";
import { Rating } from "@material-ui/lab";
import styles from './product-card.module.scss'
import { useHistory } from "react-router-dom";
import { eProduct, formatAmountWithCurrency } from "../../../constants/helpers";
import { BsImage } from 'react-icons/bs';
import { MdAddShoppingCart } from 'react-icons/md';
import routes from "../../Helpers/Routes";
import Carousel from "react-material-ui-carousel";
import FavoriteIcon from '@material-ui/icons/Favorite';
import FavoriteBorderIcon from '@material-ui/icons/FavoriteBorder';
import { WishlistContext } from "../../../StateProvider/WishlistContext/WishlistProvider";
import { id } from "date-fns/locale";
import axiosInstance from "../../../axios/axiosInstance";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import AutorenewIcon from '@material-ui/icons/Autorenew';

const useStyles = makeStyles(() => ({
  imageContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  img: {
    maxWidth: "500px",
  }
}));

const ProductCard = ({ product, onAddItem, selectedOrderType }) => {
  const classes = useStyles();
  const history = useHistory();
  const { wishlistState, wishlistDispatch } = useContext(WishlistContext);
  const [disableWishlistButton, setDisableWishlistButton] = useState(false)
  const toastConfig = useContext(CustomToastContext);

  return (
    <div className={styles.product_card}>
      {product.mrp && parseInt(product.mrp) !== 0 && product.discount && parseInt(product.discount) !== 0 && (
        <div className={styles.product_discount}>-{product.discount}%</div>
      )}
      <div className={styles.title}>
        <h4
          className="cursor-pointer"
          onClick={() => {
            history.push(`${routes.eCommerceDetail.path}/${product._id}/${selectedOrderType}`);
          }}
        >{`${product.productName}, ${product.productCategory.optionLabel} `}</h4>

        {
          wishlistState.wishlist.some(d => d._id === product._id) ? (
            <IconButton
              id="removeFromWishlist"
              title="Remove from wishlist"
              size="small"
              aria-label="removeFromWishlist"
              disabled={disableWishlistButton}
              onClick={() => {
                setDisableWishlistButton(true);

                axiosInstance().put(`${eProduct.api}/wishlist/remove`, { productId: product._id }).then(({ data }) => {
                  wishlistDispatch({ type: "REMOVE", payload: product._id })
                  setDisableWishlistButton(false);

                  toastConfig.setToastConfig({
                    open: true,
                    type: "success",
                    message: data.message,
                  });

                }).catch((error) => {
                  toastConfig.setToastConfig(error);
                  setDisableWishlistButton(false);
                })
              }}
            >
              {disableWishlistButton ? <AutorenewIcon className="rotate" /> : <FavoriteIcon />}
            </IconButton>
          ) : (
            <IconButton
              id="addToWishlist"
              title="Add to wishlist"
              size="small"
              aria-label="addToWishlist"
              disabled={disableWishlistButton}
              onClick={() => {
                setDisableWishlistButton(true);

                axiosInstance().put(`${eProduct.api}/wishlist`, { productId: product._id }).then(({ data }) => {
                  wishlistDispatch({ type: "ADD", payload: { _id: product._id } })
                  setDisableWishlistButton(false);

                  toastConfig.setToastConfig({
                    open: true,
                    type: "success",
                    message: data.message,
                  });

                }).catch((error) => {
                  toastConfig.setToastConfig(error);
                  setDisableWishlistButton(false);
                })

              }}
            >
              {disableWishlistButton ? <AutorenewIcon className="rotate" /> : <FavoriteBorderIcon />}
            </IconButton>
          )
        }

      </div>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
      // onClick={() => {
      //   history.push(`${routes.eCommerceDetail.path}/${product._id}`);
      // }}
      >
        {product.sliderImage && product.sliderImage.length > 0
          ?
          <Carousel
            strictIndexing
            animation="slide"
            autoPlay={false}
            navButtonsAlwaysVisible
            // indicators={false}
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
            {product.sliderImage.map((image: any, i) => (
              <div key={i} className={classes.imageContainer}>
                <img className={classes.img} src={image}
                  onClick={() => {
                    history.push(`${routes.eCommerceDetail.path}/${product._id}/${selectedOrderType}`);
                  }}
                />
              </div>
            ))}
          </Carousel>
          : <BsImage className={`${styles.no_image} cursor-pointer`} onClick={() => {
            history.push(`${routes.eCommerceDetail.path}/${product._id}/${selectedOrderType}`);
          }} />}
      </Box>

      <div className={styles.text}>
        {/*<h4 onClick={() => {*/}
        {/*  if (history?.location?.pathname && history?.location?.pathname.indexOf("my-cart") >= 0) {*/}
        {/*    history.push(`details/${product._id}`)*/}
        {/*  }*/}
        {/*  else {*/}
        {/*    history.push(`product/details/${product._id}`)*/}
        {/*  }*/}
        {/*}}>{`${product?.productName}, ${product?.productCategory ? product.productCategory.optionLabel : ""} `}</h4>*/}
        {/*<div><Rating name="size-small"*/}
        {/*  precision={0.5}*/}
        {/*  value={Math.round(product?.averageRating)} readOnly size="small" /></div>*/}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <div>
            {(product.mrp && parseInt(product.mrp) !== 0) &&
              <>
                <span className={styles.amount}>{formatAmountWithCurrency(product.currency, product.mrp).fullFormatAmount}</span>
                {(product.discount && parseInt(product.discount) !== 0) && <span className={styles.amount_stricked}>{formatAmountWithCurrency(product.currency, product.mrp).fullFormatAmount}</span>}
              </>
            }
          </div>
          <div>

            <Avatar className={`${styles.cart_icon} cursor-pointer`} onClick={() => onAddItem(product)}>
              <MdAddShoppingCart size={18} />
            </Avatar>
          </div>
        </Box>
        <div className={styles.rating}>
          <Rating name="size-small" value={product.rating} defaultValue={4} readOnly size="small" />
          <span>
            <h5>4.1 out of 5.0</h5>
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;