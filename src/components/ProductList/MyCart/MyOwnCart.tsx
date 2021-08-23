import { useContext, useEffect, useState, Fragment } from 'react';
import styles from './my-cart.module.scss';
import ManageQuoteDialog from '../../../pages/QuoteBuilderCombined/ManageQuote/ManageQuoteDialog';
import { Button, Box, Grid } from '@material-ui/core';
import Product from '../ProductCard/ProductCard';
import { product } from '../../../constants/helpers';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import { useData } from '../../../StateProvider/Provider';
import routes from '../../../components/Helpers/Routes';
import { useHistory } from 'react-router-dom';
import Skeleton from '@material-ui/lab/Skeleton';
import { currencyCodeToSymbol } from '../../../constants/helpers';
import Typography from '@material-ui/core/Typography';
import { BsInfoCircle } from 'react-icons/bs';
import { AiOutlineSafetyCertificate } from 'react-icons/ai';
import { SET_CART_COUNT } from "../../../StateProvider/actionTypes"

function MyOwnCart() {
  const { dispatch }: any = useData();
  const toastConfig = useContext(CustomToastContext);

  useEffect(() => {
    fetchCart();
  }, []);

  const {
    state: { user }
  }: any = useData();
  const history = useHistory();
  const [totalCount, setTotalCount] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [checkoutLabel, setCheckoutLabel] = useState('Checkout');
  const [showCreateQuoteDialog, setshowCreateQuoteDialog] = useState(false);
  const [cart, setCart] = useState([]);
  const [cartProducts, setCartProducts] = useState([]);
  const [cartProductsLoading, setCartProductsLoading] = useState(false);

  const FracImage = 'https://freepngimg.com/thumb/disney_pluto/32386-8-pluto-transparent.png';

  const onAddToCartItem = (item) => {
    let tempQuantity = 1;
    cartProducts.some((o) => {
      if (o.productId === item._id) {
        tempQuantity = tempQuantity + 1;
        return true;
      }
    });

    axiosInstance()
      .post(`/user/cart`, {
        products: [
          {
            quantity: `${tempQuantity}`,
            productId: item._id
          }
        ]
      })
      .then(() => {
        fetchCart();
      });
  };


  const deleteCartItem = (cartId) => {
    if (cartId) {
      axiosInstance()
        .delete(`/user/cart/${cartId}`)
        .then(() => {
          fetchCart();
        });
    }
  };

  const onDeleteCartItem = (item) => {
    let cartId;
    cart.some((o) => {
      if (o.productId === item._id) {
        cartId = o.id;
        return true;
      }
    });
    deleteCartItem(cartId);
  };

  const fetchCart = () => {
    let numOr0 = n => isNaN(n) ? 0 : n
    let tempTotalPrice = 0
    setCartProductsLoading(true)
    axiosInstance()
      .get(`/user/cart`)
      .then(({ data: { data } }) => {
        if (data) {
          dispatch({ type: SET_CART_COUNT, payload: data.length });
          data.map((d) => {
            tempTotalPrice = (d.product?.mrp ? parseInt(d.product?.mrp) : 0) + tempTotalPrice
          })
          setCart(data)
          setCartProducts(data.map(d => d.product))
          setTotalPrice(tempTotalPrice)
          setTotalCount(data.length)
        }
        if (data && data.length >= 1) {
          setCheckoutLabel('Create Quote');
        }
        setCartProductsLoading(false)
      });
  };

  const onCheckout = () => {
    if (checkoutLabel === 'Create Quote') {
      setshowCreateQuoteDialog(true);
    }
  };

  const onSuccess = () => {
    setshowCreateQuoteDialog(false);
  };

  const handleCreateQuote = (values) => {
    // let selectedProductIds = addedCartItems.map((o) => o.productId);

    // let selectedProducts = products.filter((obj) => selectedProductIds.indexOf(obj._id) >= 0);
    axiosInstance()
      .post(`quote-builder/create/from-cart`, { ...values, products: cartProducts })
      .then(({ data: { data } }) => {
        history.push(`${routes.quoteBuilder.path}/detail/${data?._id}`);
      });
  };

  return (
    <Fragment>
      <Grid container className="headerbox"></Grid>
      <Box className="detail-container">
        <div className={styles.container}>
          <div className={styles.wrapper}>
            <div className={styles.box_layout}>
              <h2>MY CART</h2>
              <hr />
              {cartProductsLoading ? (
                <Grid container spacing={3}>
                  <Grid item xs={12} className={styles.loadingContainer}>
                    <Typography> ...Loading</Typography>
                  </Grid>
                </Grid>
              ) : cartProducts.length ? (
                cartProducts.map((item, index) => {
                  return (
                    <div key={item.id} className={styles.checkout_items}>
                      <div className={styles.card}>
                        <div className={styles.products_image_layout}>
                          <img className={styles.card_img} src={item?.productImage || FracImage} />
                        </div>
                        <div className={styles.card_body}>
                          <div className={styles.card_price}>
                            {/* Price:{'  '} */}
                            {item?.currency ? currencyCodeToSymbol(item?.currency) : ''}
                            {item?.mrp || 0}
                          </div>
                          <div className={styles.card_seller}>
                            <strong> {item.productName}</strong>
                          </div>
                          <div className={styles.card_desc}>{item.description}</div>
                          <div className={styles.card_vendor}>
                            <span>Sold by:</span> {user?.user?.brandName}
                          </div>
                          <div className={styles.card_controls}>
                            <Button
                              onClick={() => {
                                onDeleteCartItem(item);
                              }}
                              className={styles.remove_product}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className={styles.middle_line}>
                        <hr />
                      </div>
                    </div>
                  );
                })
              ) : (
                <Grid container spacing={3}>
                  <Grid item xs={12} className={styles.loadingContainer}>
                    <Typography> No items added to cart</Typography>
                  </Grid>
                </Grid>
              )}
            </div>

            {cartProducts.length !== 0 && <div className={styles.price_card}>
              <div className={styles.price_card_price_summary}>
                <h3 className={styles.price_card_price_summary_heading}>PRICE DETAILS</h3>
                <hr />
                <div className={styles.price_card_summary}>
                  <p>
                    {' '}
                    Sub-Total <span> ({totalCount} items) </span>{' '}
                  </p>
                  <h3 className={styles.price_card_price}> {totalPrice}</h3>
                </div>
                <div className={styles.price_card_summary_pickup}>
                  <p>Pickup</p>
                  <span className={styles.price_card_details}>
                    {/* (<Button size="small">Details</Button>) */}
                    <BsInfoCircle size={18} />
                  </span>
                </div>
                <hr />
                <div className={styles.price_card_total}>
                  <h3>Total Amount</h3>
                  <h3 className={styles.price_card_price}> {totalPrice}</h3>
                </div>
              </div>
              <div className={styles.price_card_checkout_button}>
                <Button variant="contained" color="secondary" onClick={onCheckout} className={styles.price_card_checkout_button_layout}>
                  {checkoutLabel}
                </Button>
                <div className={styles.secure_payment}>
                  <AiOutlineSafetyCertificate size={38} />
                  <p>Safe and Secure Payments.100% Authentic products.</p>
                </div>
              </div>
            </div>}
          </div>
        </div>
        <div className={styles.sponsored}>
          <div className={styles.sponsored_items}>
            <div className={styles.sponsored_items_container}>
              <h2>Sponsored Products Related To This Item </h2>
              <div className={`gap-3 ${styles.sponsored_items_list}`}>
                {cartProductsLoading
                  ? [...Array(7).keys()].map((o, index) => {
                    return (
                      <>
                        <Box key={o} width={210} marginRight={0.5} my={5}>
                          <Skeleton variant="rect" width={210} height={118} />
                          <Box pt={0.5}>
                            <Skeleton />
                            <Skeleton width="60%" />
                            <Skeleton style={{ float: 'right' }} width="40%" />
                          </Box>
                        </Box>
                      </>
                    );
                  })
                  : cartProducts.map((product, index: number) => (
                    <>
                      {/* <Product key={index} product={product} onAddItem={onAddToCartItem} /> */}
                    </>
                  ))}
              </div>
            </div>
          </div>
        </div>
        {showCreateQuoteDialog && (
          <ManageQuoteDialog
            open={showCreateQuoteDialog}
            onSuccess={onSuccess}
            onClose={() => {
              setshowCreateQuoteDialog(false);
            }}
            isNew={true}
            dataToUpdate={null}
            isClone={false}
            resource={null}
            isRedirectTodetailPage={true}
            contactId={null}
            opportunityId={null}
            disableOwnerDropDown={true}
            contacts={null}
            doaCollaboratorResources={user?.user?.doa.map((obj) => obj.user)}
            isRenderedFromOpportunity={false}
            isCreateQuoteFromCart={true}
            onHandleSubmit={handleCreateQuote}
          />
        )}
      </Box>
    </Fragment>
  );
}

export default MyOwnCart;
