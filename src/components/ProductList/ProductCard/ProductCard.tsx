import React from 'react';
import PropTypes from 'prop-types';
import { Avatar, Box, Button, CardHeader, IconButton, makeStyles, Typography } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import AddShoppingCartIcon from '@material-ui/icons/AddShoppingCart';
import { Rating } from '@material-ui/lab';
import styles from './product-card.module.scss';
import { useHistory } from 'react-router-dom';
import { formatAmountWithCurrency, getUniqueCurrencies } from '../../../constants/helpers';
import { BsImage } from 'react-icons/bs';
import { MdAddShoppingCart } from 'react-icons/md';

const useStyles = makeStyles({
  root: {
    maxWidth: 350
  },
  media: {
    height: 240,
    width: '100%',
    objectFit: 'cover'
  }
});

const ProductCard = (props: { product: any; onAddItem: any }) => {
  const { product, onAddItem } = props;

  const classes = useStyles();
  const history = useHistory();

  const calculateNetPrice = (price: number, discount: number) => {
    let netPrice = price;
    netPrice = (price * discount) / 100;
    return netPrice;
  };

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
        <Box>
          <div className={styles.text_layout}>
            <span className={styles.product_amount}>$399.00</span>
            {product.mrp && parseInt(product.mrp) !== 0 && (
              <>
                <span className={styles.amount}>
                  {formatAmountWithCurrency(product.currency, calculateNetPrice(parseInt(product.mrp), parseInt(product.discount))).fullFormatAmount}
                </span>
                {parseInt(product.discount) !== 0 && (
                  <span className={styles.amount_stricked}>{formatAmountWithCurrency(product.currency, product.mrp).fullFormatAmount}</span>
                )}
              </>
            )}
          </div>
          <div className={styles.rating}>
            <Rating name="size-small" value={product.rating} defaultValue={4} readOnly size="small" />
            <span>
              <h5>4.1 out of 5.0</h5>
            </span>
          </div>
        </Box>
        <div >
          <Avatar className={styles.cart_icon} onClick={() => onAddItem(product)}>
            <MdAddShoppingCart size={18} />
          </Avatar>
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
