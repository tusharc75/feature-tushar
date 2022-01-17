import { useContext, useState, useReducer } from "react";
import PropTypes from "prop-types";
import { Box, Avatar, makeStyles, IconButton, Dialog, Button, Grid, MenuItem, InputLabel, FormHelperText, Typography } from "@material-ui/core";
import { Rating, Skeleton } from "@material-ui/lab";
import styles from './product-card.module.scss'
import { useHistory, useParams } from "react-router-dom";
import { eProduct, formatAmountWithCurrency, ORDER_TYPES, CustomDialogTransition, dateFormatForInputControl } from "../../../constants/helpers";
import { BsImage } from 'react-icons/bs';
import { MdAddShoppingCart, MdModeEdit } from 'react-icons/md';
import routes from "../../Helpers/Routes";
import Carousel from "react-material-ui-carousel";
import FavoriteIcon from '@material-ui/icons/Favorite';
import FavoriteBorderIcon from '@material-ui/icons/FavoriteBorder';
import { WishlistContext } from "../../../StateProvider/WishlistContext/WishlistProvider";
import axiosInstance from "../../../axios/axiosInstance";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import AutorenewIcon from '@material-ui/icons/Autorenew';
import { useData } from "../../../StateProvider/Provider";
import ConfirmationDialog from "../../Helpers/ConfirmationDialog";
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogHeader from "../../CustomDialog/CustomDialogHeader";
import CustomButton from "../../Helpers/CustomButton";
import CustomDialogFooter from "../../CustomDialog/CustomDialogFooter";
import CustomDialogContent from "../../CustomDialog/CustomDialogContent";
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import DateUtils from '@date-io/date-fns';
import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import PlusMinusTextboxComponent from "../../PlusMinusTextboxComponent/PlusMinusTextboxComponent";
import AddShoppingCartIcon from "@material-ui/icons/AddShoppingCart";
import { SET_CART } from "../../../StateProvider/actionTypes";
import RemoveShoppingCartIcon from '@material-ui/icons/RemoveShoppingCart';

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

const TYPES = {
  startDate: "START_DATE",
  endDate: "END_DATE",
  unitAndPricingMethod: "UNIT",
  indexOfProductInCart: "INDEX_OF_PRODUCT_IN_CART",
  updateWholePayload: "UPDATE_WHOLE_PALOAD",
  resetValues: "RESET_VALUES"
}

const initialData = {
  startDate: new Date(),
  endDate: new Date(),
  selectedUnit: "",
  selectedPricingMethod: "",
  indexOfProductInCart: -1
}

const reducer = (data = initialData, action) => {
  switch (action.type) {
    case TYPES.startDate:
      return { ...data, startDate: action.payload };

    case TYPES.endDate:
      return { ...data, endDate: action.payload };

    case TYPES.unitAndPricingMethod:
      return { ...data, ...action.payload };

    case TYPES.indexOfProductInCart:
      return { ...data, indexOfProductInCart: action.payload };

    case TYPES.updateWholePayload:
      return { ...data, ...action.payload };

    case TYPES.resetValues:
      return { ...initialData };

    default:
      return { ...data }
  }
}

const ProductCard = ({ product, selectedOrderType, showSkeleton = false }) => {
  const classes = useStyles();
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const { wishlistState, wishlistDispatch } = useContext(WishlistContext);
  const [data, dispatchData] = useReducer(reducer, initialData);
  const { state: { cartItems }, dispatch }: any = useData();

  const [disableWishlistButton, setDisableWishlistButton] = useState(false)
  const [addToCartConfirmationDialog, setAddToCartConfirmationDialog] = useState({ open: false, okBtnLoading: false, product: null })

  const orderTypeInLowerCase = selectedOrderType.toLowerCase();

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const [hasError, setHasError] = useState(false);
  const [rateCurrency, setRateCurrency] = useState({ currency: "", rate: "", mrp: "", rateWithCurrency: "", isRateMrpSame: false })
  const [addToCartBtnLoading, setAddToCartBtnLoading] = useState(false);

  const [deleteProductFromCartConfirmationDialog, setDeleteProductFromCartConfirmationDialog] = useState({ show: false, okBtnLoading: false })

  const getIndexOfProductInCart = (data) => {
    return data.findIndex(({ orderType, productDetail }) => orderType === orderTypeInLowerCase && productDetail._id === product._id)
  }

  const changeRateCurrency = (productData, unit, pricingMethod) => {

    dispatchData({ type: TYPES.unitAndPricingMethod, payload: { selectedUnit: unit, selectedPricingMethod: pricingMethod } })

    let record = null;

    if (unit && pricingMethod) {
      record = productData.priceCalculation.find(d => d.pricingMethod === pricingMethod && d.unit === unit);
    } else if (unit) {
      record = productData.priceCalculation.find(d => d.unit === unit);
    } else if (pricingMethod) {
      record = productData.priceCalculation.find(d => d.pricingMethod === pricingMethod);
    }

    if (record) {
      setRateCurrency({ currency: record.currency, rate: record.rate, rateWithCurrency: formatAmountWithCurrency(record.currency, record.rate)?.fullFormatAmount, mrp: record.mrp, isRateMrpSame: record.rate === record.mrp })
    }

    if (data.indexOfProductInCart !== -1) {
      updateCart(cartItems[data.indexOfProductInCart]._id, parseInt(cartItems[data.indexOfProductInCart].qty), unit, pricingMethod, data.startDate, data.endDate, record?.mrp, record?.rate);
    }
  }

  const updateCart = (cartId, value, unit, pricingMethod, startDate, endDate, mrp = rateCurrency?.mrp, rate = rateCurrency?.rate) => {
    axiosInstance().put(`/ecommerce/cart`, {
      _id: cartId,
      qty: value,
      unit: unit,
      pricingMethod: pricingMethod,
      startDate: startDate,
      endDate: endDate,
      currency: rateCurrency.currency,
      mrp: mrp,
      rate: rate
    }).then(({ data }) => {
      fetchCart();

      toastConfig.setToastConfig({
        open: true,
        type: "success",
        message: data.message
      });

    }).catch((error) => {
      toastConfig.setToastConfig(error);
      // dispatch({ type: SET_CART, payload: [...items] });
    })
  }

  const onAddToCartItem = (item) => {

    let product = {
      qty: 1,
      type: 'product',
      materialId: item._id,
      mrp: Number(rateCurrency.mrp),
      rate: rateCurrency.rate,
      unit: data.selectedUnit,
      orderType: orderTypeInLowerCase,
      currency: rateCurrency.currency
    }

    if (orderTypeInLowerCase === ORDER_TYPES.rent.value.toLocaleLowerCase()) {
      product["pricingMethod"] = data.selectedPricingMethod;
      product["startDate"] = data.startDate;
      product["endDate"] = data.endDate;
    }

    axiosInstance()
      .post(`/ecommerce/cart`,
        [product]
      ).then(({ data }) => {
        setAddToCartBtnLoading(false)
        toastConfig.setToastConfig({
          open: true,
          type: "success",
          message: "Added To Cart Successfully",
        });
        fetchCart()
      }).catch((error) => {
        toastConfig.setToastConfig(error);
        setAddToCartBtnLoading(false)
      })
  }

  const fetchCart = () => {
    axiosInstance()
      .get(`/ecommerce/cart`).then(({ data: { data } }) => {

        dispatch({ type: SET_CART, payload: [...data] });
        dispatchData({ type: TYPES.indexOfProductInCart, payload: getIndexOfProductInCart(data) })

        if (addToCartBtnLoading) setAddToCartBtnLoading(false)
      })
  }

  const resetValues = () => {
    setRateCurrency({ currency: "", rate: "", mrp: "", rateWithCurrency: "", isRateMrpSame: false });
    dispatchData({ type: TYPES.resetValues })
  }

  return (
    <div className={styles.product_card}>
      
      <div className={styles.title}>
        {
          showSkeleton ? <Skeleton width={120} height={30} /> : <h4
            className="cursor-pointer"
            onClick={() => {
              history.push(`${routes.eCommerceDetail.path}/${product._id}/${selectedOrderType}`);
            }}
          >{`${product.productName}, ${product.productCategory.optionLabel} `}</h4>
        }

        {
          showSkeleton ? <Skeleton width={30} height={30} /> : wishlistState.wishlist.some(d => d._id === product._id) ? (
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
      >
        {
          showSkeleton ? <Skeleton height={200} width={200} /> : (product?.sliderImage && product?.sliderImage?.length > 0 ? <Carousel
            strictIndexing
            animation="slide"
            autoPlay={false}
            navButtonsAlwaysVisible
            indicators={product.sliderImage.length > 1}
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
          </Carousel> : <BsImage className={`${styles.no_image} cursor-pointer`} onClick={() => {
            history.push(`${routes.eCommerceDetail.path}/${product?._id}/${selectedOrderType}`);
          }} />)
        }

      </Box>

      <div className={styles.text}>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <div>
            {
              showSkeleton ? <Skeleton width={100} height={30} /> : (product.mrp && parseInt(product.mrp) !== 0) &&
                <>
                  <span className={styles.amount}>{formatAmountWithCurrency(product.currency, product.mrp).fullFormatAmount}</span>
                  {(product.discount && parseInt(product.discount) !== 0) && <span className={styles.amount_stricked}>{formatAmountWithCurrency(product.currency, product.mrp).fullFormatAmount}</span>}
                </>
            }
          </div>

          <div>
            {
              showSkeleton ? <Skeleton width={30} height={30} /> :
                <Avatar className={`${styles.cart_icon} cursor-pointer`} onClick={() => {
                  const indexOfProductInCart = getIndexOfProductInCart(cartItems);

                  if (indexOfProductInCart > -1) {
                    dispatchData({
                      type: TYPES.updateWholePayload,
                      payload: {
                        selectedUnit: cartItems[indexOfProductInCart].unit,
                        selectedPricingMethod: cartItems[indexOfProductInCart].pricingMethod,
                        startDate: cartItems[indexOfProductInCart].startDate,
                        endDate: cartItems[indexOfProductInCart].endDate,
                        indexOfProductInCart: indexOfProductInCart,
                      }
                    })

                    changeRateCurrency(product, cartItems[indexOfProductInCart].unit, cartItems[indexOfProductInCart].pricingMethod)
                  } else {
                    let firstUnit = product.unit && product.unit.length > 0 ? product.unit[0] : "";
                    let firstPricingMethod = product.pricingMethod && product.pricingMethod.length > 0 ? product.pricingMethod[0] : "";

                    changeRateCurrency(product, firstUnit, firstPricingMethod)
                  }

                  setAddToCartConfirmationDialog(prevState => { return { ...prevState, open: true, product: product } })
                }}>
                  {
                    getIndexOfProductInCart(cartItems) === -1
                      ? <MdAddShoppingCart size={18} />
                      : <MdModeEdit size={18} />
                  }
                </Avatar>
            }
          </div>
        </Box>

        <div className={styles.rating}>
          {
            showSkeleton ? <Skeleton width={30} height={30} /> : <Rating name="size-small" value={product?.rating} defaultValue={4} readOnly size="small" />
          }

          {
            showSkeleton ? <Skeleton width={30} height={30} /> : <span>
              <h5>4.1 out of 5.0</h5>
            </span>
          }

        </div>
      </div>

      {
        deleteProductFromCartConfirmationDialog.show ? (
          <ConfirmationDialog
            open={true}
            message={`You want to remove this product from cart ?`}
            onClose={() =>
              setDeleteProductFromCartConfirmationDialog({ show: false, okBtnLoading: false })
            }
            okBtnLoading={deleteProductFromCartConfirmationDialog.okBtnLoading}
            onOk={() => {
              setDeleteProductFromCartConfirmationDialog(prevState => { return { ...prevState, okBtnLoading: true } })

              let items = [...cartItems];
              const indexOfProduct = getIndexOfProductInCart(items);

              const productsToUpdate = items.filter(s => { return !(s.orderType.toLowerCase() === orderTypeInLowerCase && s.productDetail?._id === product._id) });
              dispatch({ type: SET_CART, payload: [...productsToUpdate] });

              axiosInstance().put(`/ecommerce/cart/remove`, { ids: [items[indexOfProduct]._id] }).then(({ data }) => {
                setDeleteProductFromCartConfirmationDialog({ show: false, okBtnLoading: false })
                setAddToCartConfirmationDialog({ open: false, okBtnLoading: false, product: null });

                setAddToCartBtnLoading(false)

                dispatchData({ type: TYPES.indexOfProductInCart, payload: -1 })

                toastConfig.setToastConfig({
                  open: true,
                  type: "success",
                  message: data.message,
                });
                resetValues();

              }).catch((error) => {
                toastConfig.setToastConfig(error);
                dispatch({ type: SET_CART, payload: [...items] });
              })
            }}
          />
        ) : null
      }

      {
        addToCartConfirmationDialog.open && <Dialog
          maxWidth="xs"
          fullWidth
          fullScreen={fullScreen || (isMobile || isTablet)}
          TransitionComponent={CustomDialogTransition}
          aria-labelledby="customized-dialog-title"
          onClose={() => {
            setAddToCartConfirmationDialog(prevState => { return { ...prevState, open: false } })
            resetValues();
          }}
          open={true}
          disableBackdropClick={true}
        >
          <CustomDialogHeader title={product && data.indexOfProductInCart > -1 ? "Update cart" : "Add to cart"} onClose={() => {
            setAddToCartConfirmationDialog(prevState => { return { ...prevState, open: false } })
            resetValues();
          }}
            isMinimized={!fullScreen}
            onMinimizeMaximize={() => {
              setFullScreen(prevState => !prevState)
            }}
            showManimizeMaximize={true}
          />

          <CustomDialogContent>
            <Grid container>
              <Grid item xs={12} className="d-flex flex-column gap-3">
                {
                  product.unit || product.pricingMethod ? <Grid container spacing={2}>
                    <Grid item xs={12}>
                      {
                        product.unit && <FormControl variant="outlined" margin="dense" fullWidth error={hasError && !data.selectedUnit}>
                          <InputLabel id="unit-label">Unit</InputLabel>
                          <Select
                            required
                            labelId="unit-label"
                            id="unit"
                            value={data.selectedUnit}
                            onChange={(e) => {
                              changeRateCurrency(product, e.target.value, data.selectedPricingMethod)
                            }}
                            label="Unit"
                          >
                            {
                              product.unit.map(m => (
                                <MenuItem value={m}>{m}</MenuItem>
                              ))
                            }
                          </Select>
                          {hasError && !data.selectedUnit && <FormHelperText>This is required!</FormHelperText>}
                        </FormControl>
                      }
                    </Grid>

                    <Grid item xs={12}>
                      {
                        orderTypeInLowerCase === ORDER_TYPES.rent.value.toLowerCase() && product.pricingMethod && <FormControl variant="outlined" margin="dense" fullWidth error={hasError && !data.selectedPricingMethod}>
                          <InputLabel id="pricing-method-label">Pricing Method</InputLabel>
                          <Select
                            required={orderTypeInLowerCase === ORDER_TYPES.rent.key.toLocaleLowerCase()}
                            labelId="pricing-method-label"
                            id="pricing-method"
                            value={data.selectedPricingMethod}
                            onChange={(e) => {
                              changeRateCurrency(product, data.selectedUnit, e.target.value)
                            }}
                            label="Pricing Method"
                          >
                            {
                              product.pricingMethod.map(m => (
                                <MenuItem value={m}>{m}</MenuItem>
                              ))
                            }
                          </Select>
                          {hasError && !data.selectedPricingMethod && <FormHelperText>This is required!</FormHelperText>}
                        </FormControl>
                      }
                    </Grid>
                  </Grid> : ""
                }

                {
                  orderTypeInLowerCase === ORDER_TYPES.rent.value.toLowerCase() && <Grid item xs={12} sm={12} md={12}>
                    <MuiPickersUtilsProvider utils={DateUtils}>
                      <Grid container spacing={3}>

                        <Grid item xs={12}>
                          <KeyboardDatePicker
                            required={orderTypeInLowerCase === ORDER_TYPES.rent.value.toLowerCase()}
                            inputVariant="outlined"
                            variant="inline"
                            fullWidth
                            autoOk
                            size="small"
                            openTo="date"
                            format={dateFormatForInputControl}
                            maxDate={data.endDate}
                            label="Start Date"
                            views={['year', 'month', 'date']}
                            value={data.startDate}
                            onChange={(date) => {
                              dispatchData({ type: TYPES.startDate, payload: date });

                              if (data.indexOfProductInCart !== -1) {
                                updateCart(cartItems[data.indexOfProductInCart]._id, parseInt(cartItems[data.indexOfProductInCart].qty), data.selectedUnit, data.selectedPricingMethod, date, data.endDate);
                              }
                            }}
                          />
                        </Grid>

                        <Grid item xs={12}>
                          <KeyboardDatePicker
                            required={orderTypeInLowerCase === ORDER_TYPES.rent.value.toLowerCase()}
                            inputVariant="outlined"
                            variant="inline"
                            fullWidth
                            autoOk
                            size="small"
                            minDate={data.startDate}
                            openTo="date"
                            format={dateFormatForInputControl}
                            label="End Date"
                            views={['year', 'month', 'date']}
                            value={data.endDate}
                            onChange={(date) => {

                              dispatchData({ type: TYPES.endDate, payload: date })

                              if (data.indexOfProductInCart !== -1) {
                                updateCart(cartItems[data.indexOfProductInCart]._id, parseInt(cartItems[data.indexOfProductInCart].qty), data.selectedUnit, data.selectedPricingMethod, data.startDate, date);
                              }

                            }}
                          />
                        </Grid>
                      </Grid>
                    </MuiPickersUtilsProvider>
                  </Grid>
                }

                <Box className="my-3 d-flex gap-4 align-items-baseline">
                  {
                    rateCurrency.rateWithCurrency
                      ? <Typography variant="h5">{rateCurrency.rateWithCurrency}</Typography>
                      : <Typography variant="h6" className="text-error">Price calculation not available</Typography>
                  }

                  {
                    rateCurrency.isRateMrpSame === false && <Typography variant="h5" className="custom-strike">{rateCurrency.mrp}</Typography>
                  }
                </Box>

                <Box className="mb-2">
                  {
                    product && data.indexOfProductInCart > -1 && cartItems.length > 0 && cartItems.some(s => s.orderType.toLowerCase() === orderTypeInLowerCase && s.productDetail?._id === product?._id)
                      ? <Grid container>
                        <Grid item xs={12}>
                          <PlusMinusTextboxComponent
                            inputTextLabel="Quantity"
                            value={data.indexOfProductInCart > -1 ? cartItems[data.indexOfProductInCart]?.qty?.toString() ?? "1" : "1"}
                            isRequired={true}
                            onChange={(value) => {
                              let items = [...cartItems];
                              const indexOfProduct = getIndexOfProductInCart(items); // items.findIndex(s => s.orderType.toLowerCase() === orderTypeInLowerCase && s.productDetail?._id === id);

                              updateCart(items[indexOfProduct]._id, parseInt(value), data.selectedUnit, data.selectedPricingMethod, data.startDate, data.endDate);
                            }}
                          />
                        </Grid>
                      </Grid>
                      : ""
                  }
                </Box>

              </Grid>
            </Grid>
          </CustomDialogContent>

          <CustomDialogFooter>
            <Button type="button" variant="outlined" color="primary" size="small" onClick={() => {
              resetValues();
              setAddToCartConfirmationDialog({ open: false, okBtnLoading: false, product: null });
            }}>
              Cancel
            </Button>

            {
              product && data.indexOfProductInCart > -1
                ? <CustomButton
                  type="button"
                  color="primary"
                  variant="outlined"
                  disabled={!rateCurrency.rateWithCurrency || deleteProductFromCartConfirmationDialog.okBtnLoading}
                  loading={deleteProductFromCartConfirmationDialog.okBtnLoading}
                  startIcon={addToCartBtnLoading ? null : <RemoveShoppingCartIcon />}
                  onClick={() => {
                    setDeleteProductFromCartConfirmationDialog({ show: true, okBtnLoading: false })
                  }}
                >
                  Remove from cart
                </CustomButton> : <CustomButton
                  type="button"
                  color="primary"
                  variant="outlined"
                  disabled={!rateCurrency.rateWithCurrency || addToCartBtnLoading || (orderTypeInLowerCase === ORDER_TYPES.rent.value.toLowerCase() ? !(data.startDate && data.endDate && data.selectedUnit && data.selectedPricingMethod) : !data.selectedUnit)}
                  loading={addToCartBtnLoading}
                  startIcon={addToCartBtnLoading ? null : <AddShoppingCartIcon />}
                  onClick={() => {
                    if (data.selectedUnit && data.selectedPricingMethod) {
                      setAddToCartBtnLoading(true)
                      onAddToCartItem(product)
                    } else {
                      setHasError(true)
                    }
                  }}
                >
                  Add to cart
                </CustomButton>
            }

          </CustomDialogFooter>

        </Dialog>
      }

    </div >
  );
};

export default ProductCard;