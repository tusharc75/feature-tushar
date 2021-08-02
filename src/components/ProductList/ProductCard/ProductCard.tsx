import React from "react";
import PropTypes from "prop-types";
import { Avatar, Box, Button, CardHeader, IconButton, makeStyles, Typography } from "@material-ui/core";
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import AddShoppingCartIcon from '@material-ui/icons/AddShoppingCart';
import { Rating } from "@material-ui/lab";
import styles from './product-card.module.scss'
import { useHistory } from "react-router-dom";
import { formatAmountWithCurrency, getUniqueCurrencies } from "../../../constants/helpers";
import { BsImage } from 'react-icons/bs';

const useStyles = makeStyles({
  root: {
    maxWidth: 350,
  },
  media: {
    height: 240,
    width: '100%',
    objectFit: 'cover'
  },
});

const ProductCard = (props: { product: any, onAddItem: any }) => {
  const { product, onAddItem } = props;

  const classes = useStyles();
  const history = useHistory()

  const calculateNetPrice = (price: number, discount: number) => {
    let netPrice = price;
    netPrice = (price * discount) / 100;
    return netPrice;

  }
  return (
    <div className={styles.product_card}>
      {(product.mrp && parseInt(product.mrp) !== 0) && (product.discount && parseInt(product.discount) !== 0) &&
        <div className={styles.product_discount}>
          -{product.discount}%
        </div>
      }
      <Box display="flex" justifyContent="center" alignItems="center" onClick={() => { history.push(`product/details/${product._id}`) }}>
        {product.productImage ?
          <img src={product.productImage} alt={product.productName} />
          : <BsImage className={styles.no_image} />
        }
      </Box>
      <div className={styles.text}>
        <h4 onClick={() => { history.push(`product/details/${product._id}`) }}>{`${product.productName}, ${product.productCategory.optionLabel} `}</h4>
        <div><Rating name="size-small" value={product.rating} readOnly size="small" /></div>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <div>
            {(product.mrp && parseInt(product.mrp) !== 0) &&
              <>
                <span className={styles.amount}>{formatAmountWithCurrency(product.currency, calculateNetPrice(parseInt(product.mrp), parseInt(product.discount))).fullFormatAmount}</span>
                {(parseInt(product.discount) !== 0) && <span className={styles.amount_stricked}>{formatAmountWithCurrency(product.currency, product.mrp).fullFormatAmount}</span>}
              </>
            }
          </div>
          <Button variant="outlined" color="secondary" size="small"
            onClick={() => onAddItem(product, { isAdd: true })} startIcon={<AddShoppingCartIcon />}>
            Add to cart
          </Button>
        </Box>
      </div>
    </div>
  );
}

ProductCard.propTypes = {
  product: PropTypes.object,
  onAddItem: PropTypes.func,
};

export default ProductCard;
