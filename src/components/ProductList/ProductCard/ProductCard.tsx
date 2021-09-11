import PropTypes from "prop-types";
import { Box, Avatar } from "@material-ui/core";
import { Rating } from "@material-ui/lab";
import styles from './product-card.module.scss'
import { useHistory } from "react-router-dom";
import { formatAmountWithCurrency } from "../../../constants/helpers";
import { BsImage } from 'react-icons/bs';
import { MdAddShoppingCart } from 'react-icons/md';

const ProductCard = (props: { product: any, onAddItem: any }) => {
  const { product, onAddItem } = props;

  const history = useHistory()

  return (
    <div className={styles.product_card}>
      {product.mrp && parseInt(product.mrp) !== 0 && product.discount && parseInt(product.discount) !== 0 && (
        <div className={styles.product_discount}>-{product.discount}%</div>
      )}
      <div className={styles.title}>
        <h4
          onClick={() => {
            history.push(`product/details/${product._id}`);
          }}
        >{`${product.productName}, ${product.productCategory.optionLabel} `}</h4>
        <Avatar className={styles.product_less}>-10%</Avatar>
      </div>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        onClick={() => {
          history.push(`product/details/${product._id}`);
        }}
      >
        {product.productImage ? <img src={product.productImage} alt={product.productName} /> : <BsImage className={styles.no_image} />}
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
          <div >

              <Avatar className={styles.cart_icon} onClick={() => onAddItem(product)}>
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