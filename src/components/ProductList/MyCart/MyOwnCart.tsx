import { useEffect, useState, Fragment, useContext } from 'react';
import { Button, Box, Grid, FormControl, InputLabel, MenuItem, Select, TextField } from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import axiosInstance from '../../../axios/axiosInstance';
import { useData } from '../../../StateProvider/Provider';
import routes from '../../../components/Helpers/Routes';
import { useHistory, Link } from 'react-router-dom';
import { displayDate, formatAmountWithCurrency } from '../../../constants/helpers';
import Typography from '@material-ui/core/Typography';
import { BsFillInfoCircleFill } from 'react-icons/bs';
import { AiOutlineSafetyCertificate } from 'react-icons/ai';
import { SET_CART } from '../../../StateProvider/actionTypes';
import { BsImage } from "react-icons/bs";
import { makeStyles } from '@material-ui/core/styles';
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

  const history = useHistory();
  const toastConfig = useContext(CustomToastContext)
  const [totalCount, setTotalCount] = useState(0);
  const [totalPrice, setTotalPrice] = useState("");
  const [checkoutLabel, setCheckoutLabel] = useState('Checkout');
  const [openPlaceOrderDialog, setOpenPlaceOrderDialog] = useState({ open: false, okBtnLoading: false })
  const [cart, setCart] = useState([]);
  const [cartProducts, setCartProducts] = useState([]);
  const [cartProductsLoading, setCartProductsLoading] = useState(false);
  const [deleteProductFromCartConfirmationDialog, setDeleteProductFromCartConfirmationDialog] = useState({ show: false, okBtnLoading: false, recordToRemove: null })

  const [selectedBillingAddress, setSelectedBillingAddress] = useState(null)
  const [selectedShippingAddress, setSelectedShippingAddress] = useState(null)
  const [addressOptions, setAddressOptions] = useState([])

  const {
    state: { user }
  }: any = useData();

  useEffect(() => {
    fetchCart();
    fetchAddresses();
  }, []);

  const fetchAddresses = () => {
    axiosInstance().get("/sa-formbuilder/lookup?lookupResource=Address").then(({ data: { data } }) => {
      setAddressOptions(data.Address)
    })
  }

  const deleteCartItem = (cartId) => {
    if (cartId) {
      axiosInstance()
        .put(`/ecommerce/cart/remove`, { ids: [cartId] })
        .then(({ data }) => {
          setDeleteProductFromCartConfirmationDialog(prevState => { return { ...prevState, show: false, okBtnLoading: false, recordToRemove: null } })
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
          setCartProducts(data.map((d) => {
            return {
              ...d.product,
              cartId: d._id,
              productId: d.materialId,
              qty: d.qty,
              productName: d.productDetail?.productName,
              mrp: d.mrp,
              startDate: d?.startDate ? displayDate(d.startDate) : '',
              endDate: d?.endDate ? displayDate(d.endDate) : '',
              pricingMethod: d?.pricingMethod,
              unit: d?.unit,
              currency: d?.currency,
              orderType: d?.orderType,
              currencyWithFormat: formatAmountWithCurrency(d?.currency, d.mrp)?.fullFormatAmount
            }
          }));

          if (data.length > 0) {
            setTotalPrice(formatAmountWithCurrency(data[0].currency, tempTotalPrice)?.fullFormatAmount);
          }

          setTotalCount(data.length);
        }
        if (data && data.length >= 1) {
          setCheckoutLabel('Place Order');
        }
        setCartProductsLoading(false);
        setDeleteProductFromCartConfirmationDialog({ show: false, okBtnLoading: false, recordToRemove: null })
      });
  };

  const onCheckout = () => {
    if (checkoutLabel === 'Place Order') {
      setOpenPlaceOrderDialog(prevState => { return { ...prevState, open: true } });
    }
  };

  const onSuccess = () => {
    setOpenPlaceOrderDialog(prevState => { return { ...prevState, open: false } });
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
                          <div className={`${styles.card_body_layout} my-3`}>
                            <div className={styles.card_product_name_and_price}>
                              <div className={styles.card_seller}>
                                <Link className="link" to={`${routes.eCommerceDetail.path}/${item.productId}`}><b><u>{item?.orderType}</u></b> - {item.productName}</Link>
                              </div>
                              <div className={styles.card_price}>
                                {item?.currencyWithFormat}
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

                          <Grid container>
                            {
                              item.startDate && <Grid item xs={6}>
                                <b>Start Date:</b> {item.startDate}
                              </Grid>
                            }

                            {
                              item.endDate && <Grid item xs={6}>
                                <b>End Date:</b> {item.endDate}
                              </Grid>
                            }

                            {
                              item.pricingMethod && <Grid item xs={6}>
                                <b>Pricing Method:</b> {item.pricingMethod}
                              </Grid>
                            }

                            <Grid item xs={6}>
                              <b>Unit:</b> {item.unit}
                            </Grid>
                          </Grid>

                          <Grid container className="my-3">
                            <Grid item xs={6}>
                              <PlusMinusTextboxComponent
                                inputTextLabel="Quantity"
                                value={item.qty}
                                isRequired={true}
                                onChange={(value) => {
                                  let items = [...cartProducts];
                                  const indexOfProduct = items.findIndex(s => s._id === item.cartId);

                                  axiosInstance().put(`/ecommerce/cart`, { _id: item.cartId, qty: parseInt(value) }).then(() => {
                                    items[indexOfProduct].qty = value;
                                    setCartProducts([...items]);
                                  }).catch((error) => {
                                    toastConfig.setToastConfig(error);
                                    dispatch({ type: SET_CART, payload: [...items] });
                                  })

                                }}
                              />
                            </Grid>
                          </Grid>

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
                          <h3 className={styles.price_card_price}>{totalPrice}</h3>
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
                          <h3 className={styles.price_card_price}>{totalPrice}</h3>
                        </div>

                        <Grid container className="px-3">
                          <Grid item xs={12}>
                            <Autocomplete
                              fullWidth
                              id="shipping-address"
                              options={addressOptions}
                              getOptionLabel={(option) => option.optionLabel}
                              onChange={(_, newValue) => {
                                setSelectedShippingAddress(newValue?.optionValue ?? "")
                              }}
                              renderInput={(params) => <TextField {...params} label="Shipping Address" margin="dense" variant="outlined" />}
                            />
                          </Grid>
                        </Grid>

                        <Grid container className="px-3">
                          <Grid item xs={12}>
                            <Autocomplete
                              fullWidth
                              id="billing-address"
                              options={addressOptions}
                              getOptionLabel={(option) => option.optionLabel}
                              onChange={(_, newValue) => {
                                setSelectedBillingAddress(newValue?.optionValue ?? "")
                              }}
                              renderInput={(params) => <TextField {...params} label="Billing Address" margin="dense" variant="outlined" />}
                            />
                          </Grid>
                        </Grid>

                        <div className={styles.price_card_checkout_button}>
                          <Button disabled={!selectedShippingAddress || !selectedBillingAddress} variant="contained" color="primary" fullWidth onClick={onCheckout}>
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

        {openPlaceOrderDialog.open && (
          <ConfirmationDialog
            open={true}
            message={`You want to place order ?`}
            onClose={() =>
              setOpenPlaceOrderDialog(prevState => { return { ...prevState, open: false } })
            }
            okBtnLoading={openPlaceOrderDialog.okBtnLoading}
            onOk={() => {
              setOpenPlaceOrderDialog(prevState => { return { ...prevState, okBtnLoading: true } })

              axiosInstance().post("/ecommerce/checkout", { cart: cartProducts.map(m => m.cartId), shippingAddress: selectedShippingAddress, billingAddress: selectedBillingAddress }).then(({ data }) => {
                toastConfig.setToastConfig({
                  open: true,
                  type: "success",
                  message: data.message,
                });

                history.push(routes.rentalManagement.path);
              }).catch((error) => {
                toastConfig.setToastConfig(error);
              })
            }}
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
