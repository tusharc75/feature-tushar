import { useEffect, useState, Fragment, useContext, useCallback } from 'react';
import { Button, Box, Grid, Chip, TextField, IconButton } from '@material-ui/core';
import clsx from 'clsx'
import Autocomplete from '@material-ui/lab/Autocomplete';
import axiosInstance from '../../../axios/axiosInstance';
import { useData } from '../../../StateProvider/Provider';
import routes from '../../../components/Helpers/Routes';
import { useHistory, Link } from 'react-router-dom';
import { displayDate, formatAmountWithCurrency, ORDER_TYPES } from '../../../constants/helpers';
import Typography from '@material-ui/core/Typography';
import { AiOutlineSafetyCertificate } from 'react-icons/ai';
import { SET_CART } from '../../../StateProvider/actionTypes';
import { BsImage } from "react-icons/bs";
import { makeStyles } from '@material-ui/core/styles';
import Carousel from "react-material-ui-carousel";
import styles from './my-cart.module.scss';
import PlusMinusTextboxComponent from '../../../components/PlusMinusTextboxComponent/PlusMinusTextboxComponent';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import CustomBreadCrumbs from '../../../components/CustomBreadCrumbs';
import CloseIcon from '@material-ui/icons/Close';
import AddIcon from "@material-ui/icons/AddCircle";
import { Skeleton } from "@material-ui/lab";
import ManageAddressDialog from '../../../components/Address/ManageAddressDialog';
import Tooltip from '../../../components/CustomTooltipTitle';

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
  },
  tabs: {
    display: "flex",
    marginTop: theme.spacing(2)
  },
  tab: { 
    padding: theme.spacing(1, 2.5),
    backgroundColor: theme.palette.background.default,
    borderRadius: 2,
    cursor: "pointer",

    "&:hover": {
      borderBottomWidth: "2px",
      borderBottomStyle: "solid",
      borderBottomColor: theme.palette.primary.main,
    },

    "&:first-child": {
      marginRight: 10
    },
    
    "& h4": {
      fontSize: theme.spacing(2),
      fontWeight: 400,
      color: theme.palette.text.secondary
    }
  },
  tabActive: {
    borderBottomWidth: "2px",
    borderBottomStyle: "solid",
    borderBottomColor: theme.palette.primary.main,

    "& h4": {
      color: theme.palette.primary.main,
      fontWeight: 'bold'
    }
  }
}));

function MyOwnCart() {
  const classes = useStyles();
  const { dispatch }: any = useData();

  const history = useHistory();
  const toastConfig = useContext(CustomToastContext)
  const [currentTab, setCurrentTab] = useState(1);
  const [showAddAddresstDialog, setShowAddAddresstDialog] = useState({open: false, type: ""});
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
      setAddressOptions(data.Address?.filter(f => f.optionLabel && f.optionValue) ?? [])
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

  useEffect(() => {
    if (cartProducts.length > 0) {
      const tempTotalPrice = cartProducts.reduce((acc, curr) => {
        return acc + (curr.qty * curr.rate);
      }, 0);

      setTotalPrice(formatAmountWithCurrency(cartProducts[0].currency, tempTotalPrice)?.fullFormatAmount);
    }
    else {
      setTotalPrice("");
    }

  }, [cartProducts])

  const fetchCart = () => {
    setCartProductsLoading(true);
    axiosInstance()
      .get(`/ecommerce/cart`)
      .then(({ data: { data } }) => {
        if (data) {
          dispatch({ type: SET_CART, payload: [...data] });

          setCart(data);
          setCartProducts(data.map((d, index) => {
            let productImages = [];

            if (d.hasOwnProperty(["sliderImage"])) {
              productImages = [d.productImage ?? "", ...d["sliderImage"] as []].filter(image => image);
            } else {
              productImages = [d.productImage ?? ""].filter(f => f);
            }


            return {
              ...d.product,
              indexOfProduct: index,
              cartId: d._id,
              productId: d.materialId,
              qty: d.qty,
              productName: d.productDetail?.productName,
              mrp: d.mrp,
              rate: d.rate,
              startDate: d?.startDate ? displayDate(d.startDate) : '',
              endDate: d?.endDate ? displayDate(d.endDate) : '',
              pricingMethod: d?.pricingMethod,
              unit: d?.unit,
              currency: d?.currency,
              orderType: d?.orderType,
              productImages: productImages,
              currencyWithFormat: formatAmountWithCurrency(d?.currency, d.rate)?.fullFormatAmount
            }
          }));

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

    axiosInstance()
      .post(`quote-builder/create/from-cart`, { ...values, products: cartProducts })
      .then(({ data: { data } }) => {
        history.push(`${routes.quoteBuilder.path}/detail/${data?._id}`);
      });
  };

  let qtyTimeout:ReturnType<typeof setTimeout> = null

  const tabs = [{title: "Rent", key: "rent", id: 0}, {title: "Buy", key: "sale", id: 1}]
  

  return (
    <>
      <div className="p-2">
        <CustomBreadCrumbs routes={[routes.eCommerce, { title: "Cart" }]} />
      </div>

      <Box>
        <Grid container>

          <Grid item xs={1}></Grid>

          <Grid item xs={7}>
            <div className="px-4 py-2">

              <h1>Shopping Cart</h1>
             <div className={classes.tabs}>
               {tabs.map((tab) => (
               <div key={tab.key} className={clsx(classes.tab, {
                 [classes.tabActive]: currentTab === tab.id
               })} onClick={() => setCurrentTab(tab.id)}>
                 <h4>{tab.title}</h4>
               </div>
               ))}
             </div>

              <hr style={{ border: "0.5px solid #e9eaee" }} />
              {
                cartProductsLoading ? (
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      {
                        [1, 2, 3, 4, 5].map((item) => {
                          return (
                            <div key={item} className={styles.checkout_items}>
                              <div className={styles.card}>
                                <div className={`d-flex justify-content-center`}>
                                  <Skeleton width={200} height={200} />
                                </div>

                                <div className={styles.card_body}>
                                  <div className={`${styles.card_body_layout} my-3`}>
                                    <div className={styles.card_product_name_and_price}>

                                      <div className={`${styles.card_seller} w-100 d-flex justify-content-space-between`}>
                                        <div className="d-flex gap-3 align-items-center">
                                          <Skeleton width={200} height={35} />
                                          <Skeleton width={50} height={35} />
                                        </div>

                                        <Skeleton width={35} height={35} />
                                      </div>
                                    </div>

                                    <div className={styles.card_price}>
                                      <Skeleton width={100} height={35} />
                                    </div>

                                    <div className={styles.card_vendor}>
                                      <Skeleton width={60} height={35} />
                                    </div>
                                  </div>
                                </div>

                              </div>
                            </div>
                          )
                        })
                      }
                    </Grid>
                  </Grid>
                ) : cartProducts.length ? (
                  cartProducts.filter(item => item.orderType === tabs.find(tab => tab.id === currentTab).key).map((item) => {
                    return (
                      <div key={item.id} className={styles.checkout_items}>
                        <div className={styles.card}>
                          <div className={`${styles.products_image_layout} d-flex justify-content-center`}>

                            {item?.productImages && item?.productImages.length > 0 ? (
                              <Carousel
                                strictIndexing
                                animation="slide"
                                autoPlay={false}
                                navButtonsAlwaysVisible
                                indicators={item?.productImages.length > 1}
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
                                {item?.productImages.map((image: any, i) => (
                                  <div key={i} className={classes.imageContainer}>
                                    <img className={classes.img} src={image} loading='lazy' />
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
                                <div className={`${styles.card_seller} w-100 d-flex justify-content-space-between`}>
                                  <div className="d-flex gap-3 align-items-center">
                                    <Link className="link" to={`${routes.eCommerceDetail.path}/${item.productId}/${item?.orderType}`}>{item.productName}</Link>
                                    <Chip label={ORDER_TYPES[item?.orderType]?.key} color="primary" />
                                  </div>

                                  <IconButton aria-label="delete" onClick={() => {
                                    setDeleteProductFromCartConfirmationDialog(prevState => { return { ...prevState, show: true, recordToRemove: item } })
                                  }}>
                                    <CloseIcon fontSize="small" />
                                  </IconButton>

                                </div>
                              </div>

                              <div className={styles.card_vendor}>
                                <span>Sold by:</span> {user?.user?.brandName}
                              </div>
                            </div>

                            <Grid container spacing={1}>
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

                              <Grid item xs={6}>
                                <b>Unit:</b> {item.unit}
                              </Grid>

                              {
                                item.pricingMethod && <Grid item xs={6}>
                                  <b>Pricing Method:</b> {item.pricingMethod}
                                </Grid>
                              }
                            </Grid>

                            <Grid container className="mt-4 mb-3">
                              <Grid item xs={6}>
                                <PlusMinusTextboxComponent
                                  inputTextLabel="Quantity"
                                  value={item.qty}
                                  isRequired={true}
                                  onChange={(value) => {
                                    let items = [...cartProducts];
                                    if(qtyTimeout) {
                                      clearTimeout(qtyTimeout)
                                    }
                                    qtyTimeout =  setTimeout(() => {
                                      axiosInstance().put(`/ecommerce/cart`, { _id: item.cartId, qty: parseInt(value) }).then(() => {
                                        items[item.indexOfProduct].qty = parseInt(value);
                                        setCartProducts([...items]);
                                
                                        // toastConfig.setToastConfig({
                                        //   open: true,
                                        //   type: "success",
                                        //   message: "Quantity updated successfully"
                                        // });
                                
                                      }).catch((error) => {
                                        toastConfig.setToastConfig(error);
                                        dispatch({ type: SET_CART, payload: [...items] });
                                      })
                                    }, 200)      
                                }}
                                />
                              </Grid>
                            </Grid>

                            <Grid container className="my-3">
                              <Grid item xs={12}>
                                <Typography variant="h5">{item?.currencyWithFormat}</Typography>
                              </Grid>
                            </Grid>


                          </div>
                        </div>
                        <div className={styles.middle_line}>
                          <hr className="my-3" style={{ border: "0.5px solid #e9eaee" }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Typography> No items added to cart</Typography>
                    </Grid>
                  </Grid>
                )}

            </div>
          </Grid>

          <Grid item xs={3} style={{ background: "#f9fafc" }}>

            <div className="px-4 py-2">

              <h1>Order Summary</h1>

              <div className="d-flex justify-content-space-between flex-column" style={{ height: 600 }}>

                <div>

                  <hr className="my-3" style={{ border: "0.5px solid #e9eaee" }} />

                  <h4>Subtotal <span>({totalCount} items) </span></h4>

                  <hr className="my-3" style={{ border: "0.5px solid #e9eaee" }} />

                  <div className="d-flex gap-2 flex-column">
                    {
                      cartProducts.map(m => (
                        <div key={m._id} className="d-flex gap-3 align-items-center justify-content-space-between">
                          <div className="d-flex gap-2 align-items-center">
                            <p>{m.productName}</p>
                            <Chip size="small" label={ORDER_TYPES[m?.orderType]?.key} color="primary" />
                          </div>

                          <div>{formatAmountWithCurrency(m.currency, m.rate * m.qty)?.fullFormatAmount}</div>
                        </div>
                      ))
                    }
                  </div>

                  <hr className="my-3" style={{ border: "0.5px solid #e9eaee" }} />

                </div>

                <div>
                  <p className="d-flex align-items-center gap-2 justify-content-space-between">
                    <h4>Total Amount</h4>
                    <h4>{totalPrice ?? "-"}</h4>
                  </p>

                  <hr className="my-3" style={{ border: "0.5px solid #e9eaee" }} />

                  <Grid container spacing={1} justifyContent="space-between" alignItems='center'>
                    <Grid item xs={10}>
                      <Autocomplete
                        disabled={cartProducts.length === 0}
                        fullWidth
                        id="shipping-address" 
                        options={addressOptions}
                        getOptionLabel={(option) => option.optionLabel}
                        getOptionSelected={(option, value) => option.optionValue === value.optionValue}
                        value={selectedShippingAddress}
                        onChange={(_, newValue) => {
                          setSelectedShippingAddress(newValue)
                        }}
                        renderInput={(params) => <TextField required {...params} label="Shipping Address" margin="dense" variant="outlined" />}
                      />
                    </Grid>
                    <Grid item xs={2}>
                      <Tooltip
                        title="Add Shipping Address"
                      >
                        <IconButton
                          onClick={() => setShowAddAddresstDialog({open: true, type: "ship"})}
                          size="small"
                        >
                          <AddIcon color={"primary"} />
                        </IconButton>
                      </Tooltip>
                    </Grid>
                  </Grid>

                  <Grid container spacing={1} justifyContent="space-between" alignItems='center'>
                    <Grid item xs={10}>
                      <Autocomplete
                        disabled={cartProducts.length === 0}
                        fullWidth
                        id="billing-address" 
                        options={addressOptions}
                        getOptionLabel={(option) => option.optionLabel}
                        getOptionSelected={(option, value) => option.optionValue === value.optionValue}
                        value={selectedBillingAddress}
                        onChange={(_, newValue) => {
                          setSelectedBillingAddress(newValue)
                        }}
                        renderInput={(params) => (
                          <TextField 
                          {...params} 
                            required 
                            label="Billing Address" 
                            margin="dense" 
                            variant="outlined"
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={2}>
                      <Tooltip
                        title="Add Billing Address"
                      >
                        <IconButton
                          onClick={() => setShowAddAddresstDialog({open: true, type: "bill"})}
                          size="small"
                        >
                          <AddIcon color={"primary"} />
                        </IconButton>
                      </Tooltip>
                    </Grid>
                  </Grid>

                  <hr className="my-3" style={{ border: "0.5px solid #e9eaee" }} />

                  <div className="mt-4 d-flex flex-column gap-3">
                    <Button disabled={!selectedShippingAddress || !selectedBillingAddress} variant="contained" color="primary" fullWidth onClick={onCheckout}>
                      {checkoutLabel}
                    </Button>
                    <div className="d-flex gap-2 align-items-center">
                      <AiOutlineSafetyCertificate size={38} />
                      <p>Safe and Secure Payments.100% Authentic products.</p>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </Grid>

          <Grid item xs={1}></Grid>
        </Grid>

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

              axiosInstance().post("/ecommerce/checkout", { 
                cart: cartProducts.map(m => m.cartId), 
                shippingAddress: selectedShippingAddress?.optionValue, 
                billingAddress: selectedBillingAddress?.optionValue 
              }).then(({ data }) => {
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
       {showAddAddresstDialog.open && <ManageAddressDialog
          onClose={() => {
            setShowAddAddresstDialog({open: false, type: ""});
          }}
          onSuccess={(obj) => {
            if (obj) {
              setShowAddAddresstDialog({open: false, type: ""});
              setAddressOptions(prevState => {
                let options = [...prevState]
                options.push({
                  optionValue: obj._id,
                  optionLabel: obj.fullAddress,
                  default: false,
                  order: prevState.length
                })
                return options
              })
              if(showAddAddresstDialog.type === "bill") {
                setSelectedBillingAddress({optionValue: obj._id, optionLabel: obj.fullAddress})
              } else {
                setSelectedShippingAddress({optionValue: obj._id, optionLabel: obj.fullAddress})
              }
            }
          }
          }
        />}

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
    </ >
  );
}

export default MyOwnCart;
