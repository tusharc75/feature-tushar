import React from "react";
import PropTypes from "prop-types";
import { Avatar, CardHeader, IconButton, makeStyles, Typography } from "@material-ui/core";
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import AddShoppingCartIcon from '@material-ui/icons/AddShoppingCart';
import { Rating } from "@material-ui/lab";
import styles from './product-card.module.scss'
import { useHistory } from "react-router-dom";
import { getUniqueCurrencies } from "../../../constants/helpers";

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

const ProductCard = (props: { product: any; }) => {
  const { product } = props;
  const classes = useStyles();
  const history = useHistory()
  const currencySymbol = getUniqueCurrencies().some((data) => data?.currencyCode === product.currency)
    ? getUniqueCurrencies().find(
      (data) => data?.currencyCode === product.currency
    ).symbolNative
    : null

  const calculateNetPrice = (price: number, discount: number) => {
    let netPrice = price;
    netPrice = (price * discount) / 100;
    return netPrice;

  }

  return (
    <Card className={styles.product_card}>
      <div className={styles.product_header}>
        <div className={styles.product_name}>
          <Typography variant="body2" color="error">
            {`${product.productName} ,${product.productCategory.optionLabel} `}
          </Typography>
        </div>
        <div className={styles.product_discount}>
          {(product.discount) && (product.discount !== "") &&
            <Avatar className={styles.product_discount_avatar}>
              <Typography variant="body2" >
                {product.discount}%
              </Typography>
            </Avatar>
          }
        </div>
      </div>
      <CardActionArea onClick={() => { history.push(`product/details/${product._id}`) }}>
        <CardMedia
          className={classes.media}
          image={product.productImage}
          title="Product Image"
        />

      </CardActionArea>

      <div className={styles.product_card_action}>
        <div className={styles.product_card_action_price}>
          <h4 className="d-flex align-items-left justify-content-left">
            <Typography variant="body2" color="error">
              {`${currencySymbol} ${calculateNetPrice(parseInt(product.mrp), parseInt(product.discount))}`}
              <span className={styles.originalPrice}>{`${currencySymbol} ${product.mrp}`}</span>
            </Typography>
          </h4>
        </div>
        {/* <div className={styles.product_card_action_rating}>
          <h4 className="d-flex align-items-left justify-content-left flex-column ">
            <Rating name="size-small" value={product.rating} readOnly size="small" />
          </h4>
          <h4 className="d-flex align-items-left justify-content-left flex-column ">
            <Typography variant="subtitle2" color="error">
              {product.rating} out of 5
            </Typography>
          </h4>
        </div> */}
        <div className={styles.product_card_action_add_to_cart}>
          <IconButton aria-label="AddShoppingCartIcon" onClick={() => { }}>
            <AddShoppingCartIcon color="primary" />
          </IconButton>
        </div>
      </div>

    </Card>
  );
}

ProductCard.propTypes = {
  product: PropTypes.object,
};

export default ProductCard;
