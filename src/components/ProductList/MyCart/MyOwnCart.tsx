import { useEffect, useState, Fragment, useContext } from 'react';
import ManageQuoteDialog from '../../../pages/QuoteBuilderCombined/ManageQuote/ManageQuoteDialog';
import { Button, Box, Grid } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import { useData } from '../../../StateProvider/Provider';
import routes from '../../../components/Helpers/Routes';
import { useHistory, Link } from 'react-router-dom';
import { currencyCodeToSymbol } from '../../../constants/helpers';
import Typography from '@material-ui/core/Typography';
import { BsFillInfoCircleFill } from 'react-icons/bs';
import { AiOutlineSafetyCertificate } from 'react-icons/ai';
import { SET_CART } from '../../../StateProvider/actionTypes';
import { BsImage } from "react-icons/bs";
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import { makeStyles } from '@material-ui/core/styles';
import AddCircleOutlineOutlinedIcon from '@material-ui/icons/AddCircleOutlineOutlined';
import RemoveCircleOutlineOutlinedIcon from '@material-ui/icons/RemoveCircleOutlineOutlined';
import Carousel from "react-material-ui-carousel";

import styles from './my-cart.module.scss';
import PlusMinusTextboxComponent from '../../PlusMinusTextboxComponent/PlusMinusTextboxComponent';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import ConfirmationDialog from '../../Helpers/ConfirmationDialog';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  margin: {
    margin: theme.spacing(1),
  },
  withoutLabel: {
    marginTop: theme.spacing(3),
  },
  textField: {
    width: '25ch',
  },
  imageContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  img: {
    maxWidth: "500px",
  }
}));

function MyOwnCart() {
  const classes = useStyles();
  const { dispatch }: any = useData();

  useEffect(() => {
    fetchCart();
  }, []);

  const {
    state: { user }
  }: any = useData();

  const history = useHistory();
  const toastConfig = useContext(CustomToastContext)
  const [totalCount, setTotalCount] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [checkoutLabel, setCheckoutLabel] = useState('Checkout');
  const [showCreateQuoteDialog, setshowCreateQuoteDialog] = useState(false);
  const [cart, setCart] = useState([]);
  const [cartProducts, setCartProducts] = useState([]);
  const [cartProductsLoading, setCartProductsLoading] = useState(false);
  const [deleteProductFromCartConfirmationDialog, setDeleteProductFromCartConfirmationDialog] = useState({ show: false, okBtnLoading: false, recordToRemove: null })

  const deleteCartItem = (cartId) => {
    if (cartId) {
      axiosInstance()
        .put(`/eCommerce/cart/remove`,{ids:[cartId]})
        .then(({data}) => {
          setDeleteProductFromCartConfirmationDialog(prevState => { return { ...prevState,show: false, okBtnLoading: false, recordToRemove: null }  })
          toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: data.message,
          });
          fetchCart();
        });
    }
  };

  const onDeleteCartItem = (item) => {
    let cartId;
    cart.some((o) => {
      if (o._id === item.cartId) {
        cartId = o._id;
        return true;
      }
    });
    deleteCartItem(cartId);
  };

  const fetchCart = () => {
    let tempTotalPrice = 0;
    setCartProductsLoading(true);
    axiosInstance()
      .get(`/ecommerce/cart`)
      .then(({ data: { data } }) => {
        if (data) {
          dispatch({ type: SET_CART, payload: [...data] });
          data.map((d) => {
            tempTotalPrice = (d?.mrp ? parseInt(d?.mrp) : 0) + tempTotalPrice;
          });
          setCart(data);
          setCartProducts(data.map((d) => { return { ...d.product, cartId: d._id, productId: d.materialId, quantity: d.qty,productName: d.productDetail?.productName, mrp:d.mrp } }));
          setTotalPrice(tempTotalPrice);
          setTotalCount(data.length);
        }
        if (data && data.length >= 1) {
          setCheckoutLabel('Create Quote');
        }
        setCartProductsLoading(false);
        setDeleteProductFromCartConfirmationDialog({ show: false, okBtnLoading: false, recordToRemove: null })
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
              <div className={styles.cart_box}>
                <h2>MY CART</h2>
              </div>

              {/* <hr /> */}
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
                        <div className={`${styles.products_image_layout} d-flex justify-content-center`}>

                          {item.sliderImage && item.sliderImage.length > 0 ? (
                            <Carousel
                              strictIndexing
                              animation="slide"
                              autoPlay={false}
                              navButtonsAlwaysVisible
                              // indicators={false}
                              cycleNavigation={false}
                              timeout={150}
                              navButtonsProps={{          // Change the colors and radius of the actual buttons. THIS STYLES BOTH BUTTONS
                                style: {
                                  opacity: 0.4,
                                  padding: 5,
                                  borderRadius: "50%"
                                }
                              }}
                            >
                              {item.sliderImage.map((image: any, i) => (
                                <div key={i} className={classes.imageContainer}>
                                  <img className={classes.img} src={image} />
                                </div>
                              ))}
                            </Carousel>
                          ) : (
                            <BsImage className={styles.no_image} />
                          )}

                        </div>
                        <div className={styles.card_body}>
                          <div className={styles.card_body_layout}>
                            <div className={styles.card_product_name_and_price}>
                              <div className={styles.card_seller}>
                                <Link className="link" to={`${routes.eCommerceDetail.path}/${item.productId}`}>{item.productName}</Link>
                              </div>
                              <div className={styles.card_price}>
                                {/* Price:{'  '} */}
                                {item?.currency ? currencyCodeToSymbol(item?.currency) : ''}
                                {item?.mrp || 0}
                              </div>
                            </div>

                            {/* <div className={styles.card_desc}>
                              {item.description}The iPad Pro is Apple's high-end tablet computer. The latest iPad Pro models feature a powerful M1
                              chip
                            </div> */}
                            <div className={styles.card_vendor}>
                              <span>Sold by:</span> {user?.user?.brandName}
                            </div>
                          </div>

                          <PlusMinusTextboxComponent
                            inputTextLabel="Quantity"
                            value={item.quantity}
                            isRequired={true}
                            onChange={(value) => {
                              let items = [...cartProducts];
                              items[index].quantity = parseInt(items[index].quantity) - 1;
                              setCartProducts([...items]);

                              axiosInstance().put(`/eCommerce/cart/${item.cartId}`, { quantity: value?.toString() }).then(() => {

                              }).catch((error) => {
                                toastConfig.setToastConfig(error);
                                dispatch({ type: SET_CART, payload: [...items] });
                              })
                            }}
                          />

                          {/* <Grid container spacing={1} alignItems="flex-end">
                            <Grid item>
                              <IconButton onClick={() => {
                                let items = [...cartProducts];
                                items[index].quantity = parseInt(items[index].quantity) - 1;
                                setCartProducts([...items]);
                              }} size="small">
                                <RemoveCircleOutlineOutlinedIcon />
                              </IconButton>
                            </Grid>
                            <Grid item>
                              <TextField id="input-with-icon-grid" type="number" label="Quantity" value={item.quantity} onChange={(e) => {
                                let items = [...cartProducts];
                                items[index].quantity = e.target.value;
                                setCartProducts([...items]);
                              }} />
                            </Grid>
                            <Grid item>
                              <IconButton onClick={() => {
                                let items = [...cartProducts];
                                items[index].quantity = parseInt(items[index].quantity) + 1;
                                setCartProducts([...items]);
                              }} size="small">
                                <AddCircleOutlineOutlinedIcon />
                              </IconButton>
                            </Grid>
                          </Grid> */}

                          <div className={styles.card_controls}>
                            <Button
                              variant="outlined"
                              color="primary"
                              onClick={() => {
                                
                                setDeleteProductFromCartConfirmationDialog(prevState => { return { ...prevState, show: true, recordToRemove: item } })
                                // deleteCartItem(item.cartId)
                              }}
                              className={styles.remove_product}
                            >
                              Remove
                            </Button>
                            {/* <Button
                              variant="outlined"
                              color="primary"
                              onClick={() => {
                                onDeleteCartItem(item);
                              }}
                              className={styles.edit_product}
                            >
                              Save for later
                            </Button> */}
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

            {cartProducts.length !== 0 && (
              <div className={styles.price_card}>
                <div className={styles.price_card_main}>
                  <div className={styles.price_card_price_summary}>
                    <div className={styles.price_card_product_summary}>
                      <h3 className={styles.price_card_price_summary_heading}>Summary</h3>
                    </div>
                    <div className={styles.price_card_all_data}>
                      <div>
                        <div className={styles.price_card_summary}>
                          <p>
                            {' '}
                            Sub-Total <span> ({totalCount} items) </span>{' '}
                          </p>
                          <h3 className={styles.price_card_price}> ${totalPrice}</h3>
                        </div>
                        <div className={styles.price_card_summary_pickup}>
                          <p>Pickup</p>
                          <span className={styles.price_card_details}>
                            {/* (<Button size="small">Details</Button>) */}
                            <BsFillInfoCircleFill size={16} />
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className={styles.price_card_total}>
                          <h3>Total Amount</h3>
                          <h3 className={styles.price_card_price}> ${totalPrice}</h3>
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
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
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

        {
          deleteProductFromCartConfirmationDialog.show ? (
            <ConfirmationDialog
              open={true}
              message={`You want to remove this product from cart ?`}
              onClose={() =>
                setDeleteProductFromCartConfirmationDialog({ show: false, okBtnLoading: false, recordToRemove: null })
              }
              okBtnLoading={deleteProductFromCartConfirmationDialog.okBtnLoading}
              onOk={() => {
                setDeleteProductFromCartConfirmationDialog(prevState => { return { ...prevState, okBtnLoading: true } })
                onDeleteCartItem(deleteProductFromCartConfirmationDialog.recordToRemove)
              }}
            />
          ) : null
        }
      </Box>
    </Fragment >
  );
}

export default MyOwnCart;
