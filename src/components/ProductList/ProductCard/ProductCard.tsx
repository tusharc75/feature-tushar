import PropTypes from "prop-types";
import { Box, Avatar, makeStyles } from "@material-ui/core";
import { Rating } from "@material-ui/lab";
import styles from './product-card.module.scss'
import { useHistory } from "react-router-dom";
import { formatAmountWithCurrency } from "../../../constants/helpers";
import { BsImage } from 'react-icons/bs';
import { MdAddShoppingCart } from 'react-icons/md';
import routes from "../../Helpers/Routes";
import Carousel from "react-material-ui-carousel";

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

const ProductCard = (props: { product: any, onAddItem: any }) => {
  const { product, onAddItem } = props;
  const classes = useStyles();
  const history = useHistory()

  //  replace below images variable with the array of images of the product
  const images = [
    "https://images.unsplash.com/photo-1506467493604-25d7861a6703?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxleHBsb3JlLWZlZWR8MTF8fHxlbnwwfHx8fA%3D%3D&w=1000&q=80",
    "https://www.esa.int/var/esa/storage/images/esa_multimedia/images/2016/10/colima_volcano/16186851-1-eng-GB/Colima_volcano.jpg",
    "https://news.cornell.edu/sites/default/files/styles/full_size/public/2020-10/1012_nasa.jpg?itok=KJ3jzpto"
  ]

  return (
    <div className={styles.product_card}>
      {product.mrp && parseInt(product.mrp) !== 0 && product.discount && parseInt(product.discount) !== 0 && (
        <div className={styles.product_discount}>-{product.discount}%</div>
      )}
      <div className={styles.title}>
        <h4
          className={"cursor-pointer"}
          onClick={() => {
            history.push(`${routes.eCommerceDetail.path}/${product._id}`);
          }}
        >{`${product.productName}, ${product.productCategory.optionLabel} `}</h4>
        <Avatar className={styles.product_less}>-10%</Avatar>
      </div>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
      // onClick={() => {
      //   history.push(`${routes.eCommerceDetail.path}/${product._id}`);
      // }}
      >
        {images
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
            {images.map((image: any, i) => (
              <div key={i} className={classes.imageContainer}>
                <img className={classes.img} src={image}
                  onClick={() => {
                    history.push(`${routes.eCommerceDetail.path}/${product._id}`);
                  }}
                />
              </div>
            ))}
          </Carousel>
          : <BsImage className={`${styles.no_image} cursor-pointer`} />}
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

ProductCard.propTypes = {
  product: PropTypes.object,
  onAddItem: PropTypes.func
};

export default ProductCard;