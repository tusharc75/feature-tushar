import { useState, useEffect, useContext, Fragment, useReducer } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../../axios/axiosInstance";
import { formatAmountWithCurrency, eProduct, dateFormatForInputControl, getObjKeysWithValues } from "../../../constants/helpers";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import { Rating, ToggleButton, ToggleButtonGroup } from "@material-ui/lab";
import {
  Box, Chip, Grid, makeStyles, Typography, IconButton, Button, List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListSubheader,
  Collapse
} from "@material-ui/core";
import AddShoppingCartIcon from "@material-ui/icons/AddShoppingCart";
import RemoveShoppingCartIcon from '@material-ui/icons/RemoveShoppingCart';
import { BsImage } from "react-icons/bs";
import { useData } from "../../../StateProvider/Provider";
import { useHistory } from "react-router-dom";
import routes from "../../../components/Helpers/Routes";
import CustomBreadCrumbs from "../../../components/CustomBreadCrumbs";
import { SET_CART } from "../../../StateProvider/actionTypes";
import Carousel from "react-material-ui-carousel";
import styles from "./product-detail-page.module.scss";
import { WishlistContext } from "../../../StateProvider/WishlistContext/WishlistProvider";
import CustomButton from "../../../components/Helpers/CustomButton";
import BookmarkIcon from '@material-ui/icons/Bookmark';
import BookmarkBorderIcon from '@material-ui/icons/BookmarkBorder';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import ConfirmationDialog from "../../../components/Helpers/ConfirmationDialog";
import PlusMinusTextboxComponent from "../../../components/PlusMinusTextboxComponent/PlusMinusTextboxComponent";
import DateUtils from '@date-io/date-fns';
import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import { Skeleton } from "@material-ui/lab";
import AutorenewIcon from '@material-ui/icons/Autorenew';
import SimilarItems from "../../../components/ProductList/SimilarItems/SimilarItems";
import FrequentlyBought from "../../../components/ProductList/FrequentlyBought/FrequentlyBought";
import ProductConfiguration from "./ProductConfiguration";
import ECommerceBreadCrumbs from "../../../components/ECommerce/BreadCrumbs/ECommerceBreadCrumbs";
import { ECommerceContext } from "../../../components/ECommerce/Layout/ECommerceContext/ECommerceContext";
import React from "react";
import { ExpandLess, ExpandMore } from "@material-ui/icons";
import ProductBOM from "../../../components/ProductList/BOM/ProductBOM";
import { isTablet } from "react-device-detect";

const useStyles = makeStyles(() => ({
  imageContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight:"300px",
    height:"70vh",
    "@media screen and (max-width: 960px)":{
      height:"30vh"
    }
  },
  img: {
    height: "500px",
    maxWidth: "500px",
  },
  listOpen: {
    backgroundColor: "#F7F7F7",
    borderBottom: "1px solid grey"
  },
  listClose: {
    backgroundColor: "#555555",
    color: "white"
  },
  buyRentSwitch:{
    padding: "0 8px",
  },
  toggle_layout:{
    backgroundColor:"white"
  }
}));

const TYPES = {
  startDate: "START_DATE",
  endDate: "END_DATE",
  unitAndPricingMethod: "UNIT",
  indexOfProductInCart: "INDEX_OF_PRODUCT_IN_CART",
  updateWholePayload: "UPDATE_WHOLE_PALOAD",
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

    default:
      return { ...data }
  }
}

export default function ProductDetails() {

  const [data, dispatchData] = useReducer(reducer, initialData);

  const [open, setOpen] = React.useState(true);

  const handleClick = () => {
    setOpen(!open);
  };


  const classes = useStyles();
  const [productDetails, setProductDetails] = useState(null);
  const [similarItems, setSimilarItems] = useState([]);
  const [addToCartBtnLoading, setAddToCartBtnLoading] = useState(false);
  const [checkoutLabel, setCheckoutLabel] = useState("Checkout")
  const [addedCartItems, setAddedCartItems] = useState([])
  const [products, setProducts] = useState([]);
  const toastConfig = useContext(CustomToastContext);
  const { state: { user, cartItems }, dispatch }: any = useData();
  const [wishlist, setWishlist] = useState({ loading: false, disabled: false });
  const [productConfigData, setProductConfigData] = useState({ values: {}, fields: [], requiredValues: [""], error: "" });
  const [rateCurrency, setRateCurrency] = useState({ currency: "", rate: "", mrp: "", rateWithCurrency: "", isRateMrpSame: false })
  const [deleteProductFromCartConfirmationDialog, setDeleteProductFromCartConfirmationDialog] = useState({ show: false, okBtnLoading: false })
  const { wishlistState, wishlistDispatch } = useContext(WishlistContext);
  const [hasError, setHasError] = useState(false);

  const [productImages, setProductImages] = useState([])
  const { ORDER_TYPES, firstOrderType } = useContext(ECommerceContext);

  const history = useHistory();
  let { id, orderType: orderTypeFromUrl } = useParams();
  const orderTypeInLowerCase = orderTypeFromUrl?.toLowerCase();

  const [orderType, setOrderType] = useState(() => {
    if (!orderTypeFromUrl) {
      return firstOrderType?.value;
    }
    return Object.keys(ORDER_TYPES).some(s => s.toLowerCase() === orderTypeInLowerCase) && ORDER_TYPES[orderTypeInLowerCase] ? ORDER_TYPES[orderTypeInLowerCase].value : firstOrderType?.value;
  });

  useEffect(() => {
    fetchCart()
  }, []);

  useEffect(() => {
    setProductDetails(null);

    dispatchData({ type: TYPES.updateWholePayload, payload: { ...initialData } })

    axiosInstance().get(`${eProduct.api}/${id}`).then(({ data: { data } }) => {
      setProductDetails({ ...data });
      prepareFormData(data)
      const indexOfProductInCart = getIndexOfProductInCart(cartItems);

      if (data.hasOwnProperty(["sliderImage"])) {
        setProductImages([data.productImage ?? "", ...data["sliderImage"] as []].filter(image => image));
      } else {
        setProductImages([data.productImage ?? ""].filter(f => f));
      }

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
        changeRateCurrency(data, cartItems[indexOfProductInCart].unit, cartItems[indexOfProductInCart].pricingMethod, false)
      } else {
        let firstUnit = data.unit && data.unit.length > 0 ? data.unit[0] : "";
        let firstPricingMethod = data.pricingMethod && data.pricingMethod.length > 0 ? data.pricingMethod[0] : "";

        changeRateCurrency(data, firstUnit, firstPricingMethod, false)
      }
    }).catch((error) => {
      toastConfig.setToastConfig(error);
    })
  }, [id, orderTypeFromUrl])

  const prepareFormData = (data: any) => {
    if (data) {
      const initialData = getObjKeysWithValues(data, data.fields)
      setProductConfigData({
        ...productConfigData,
        values: initialData,
        fields: data.fields,
        requiredValues: data?.fields.filter((d: any) => d.required).map((d: any) => d.fieldName) ?? []
      })
    }
  }

  const changeRateCurrency = (productData, unit, pricingMethod, updateCartValue = true) => {

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
      setRateCurrency({ currency: record.currency, rate: record.mrp, rateWithCurrency: formatAmountWithCurrency(record.currency, record.mrp)?.fullFormatAmount, mrp: record.mrp, isRateMrpSame: record.rate === record.mrp })
    } else {
      setRateCurrency({ currency: productData.currency, rate: productData.mrp, rateWithCurrency: formatAmountWithCurrency(productData.currency, productData.mrp)?.fullFormatAmount, mrp: productData.mrp, isRateMrpSame: true })
    }

    if (updateCartValue && data.indexOfProductInCart !== -1) {
      updateCart(cartItems[data.indexOfProductInCart]._id, Number(cartItems[data.indexOfProductInCart].qty), unit, pricingMethod, data.startDate, data.endDate, record?.mrp, record?.rate);
    }
  }

  const getIndexOfProductInCart = (data) => {
    return data.findIndex(({ orderType, productDetail }) => orderType === orderTypeInLowerCase && productDetail._id === id)
  }

  const fetchCart = () => {
    axiosInstance()
      .get(`/ecommerce/cart`).then(({ data: { data } }) => {

        if (data) {
          dispatch({ type: SET_CART, payload: [...data] });
          dispatchData({ type: TYPES.indexOfProductInCart, payload: getIndexOfProductInCart(data) })

          if (addToCartBtnLoading) setAddToCartBtnLoading(false)

          setAddedCartItems(data)
        }
        if (data && data.length >= 1) {
          setCheckoutLabel("Create Quote")
        }
      })
  }

  const onAddToCartItem = (item) => {
    const { values, requiredValues, error } = productConfigData

    let product = {
      qty: 1,
      type: 'product',
      materialId: item._id,
      mrp: Number(rateCurrency.mrp),
      rate: Number(rateCurrency.rate),
      unit: data.selectedUnit,
      orderType: orderTypeInLowerCase,
      currency: rateCurrency.currency,
      productConfiguration: values
    }

    if (orderTypeInLowerCase === ORDER_TYPES.rent?.value?.toLocaleLowerCase()) {
      product["pricingMethod"] = data.selectedPricingMethod;
      product["startDate"] = data.startDate;
      product["endDate"] = data.endDate;
    }

    let requiredValuesLeft = requiredValues.filter(val => !values[val]);

    if (requiredValuesLeft.length > 0) {
      setProductConfigData({
        ...productConfigData,
        error: "Please select required (*) configuration"
      })
      setTimeout(() => setProductConfigData({
        ...productConfigData,
        error: ""
      }), 5 * 1000)

      setAddToCartBtnLoading(false)
      return
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

  useEffect(() => {
    if (productDetails) {
      axiosInstance()
        .get(`/e-product/similar-product/${id}`)
        .then(({ data: { data } }) => {
          setSimilarItems([...data.filter(f => f._id !== id)]);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  }, [productDetails]);

  const updateCart = (cartId, value, unit, pricingMethod, startDate, endDate, mrp = rateCurrency?.mrp, rate = rateCurrency?.rate) => {
    axiosInstance().put(`/ecommerce/cart`, {
      _id: cartId,
      qty: Number(value),
      unit: unit,
      pricingMethod: pricingMethod,
      startDate: startDate,
      endDate: endDate,
      currency: rateCurrency.currency,
      mrp: Number(mrp),
      rate: Number(rate)
    }).then(() => {

    }).catch((error) => {
      toastConfig.setToastConfig(error);
      // dispatch({ type: SET_CART, payload: [...items] });
    })
  }

  return (
    <div className="containerNew">
      <div className="p-2">
        <ECommerceBreadCrumbs routes={[{ path: `${routes.eCommerce.path}?category=${productDetails?.productCategory?.optionValue}&orderType=${orderType}`, title: productDetails?.productCategory?.optionLabel }, { title: productDetails?.productName }]} />
      </div>
      <Box>
        {productDetails ?
          <Grid container className="py-4 px-2" spacing={4}>
            <Grid item xs={6} md={7} sm={isTablet ? 12 : 7} className="d-flex flex-column align-items-center">
              <Box display="flex" justifyContent="center" alignItems="center" className='w-100' >

                <div className='position-relative w-100'>

                  {
                    wishlistState.wishlist.length === 0 || !wishlistState.wishlist.find(s => s._id === id) ? <IconButton
                      disabled={wishlist.disabled}
                      style={{ position: "absolute", zIndex: 1 }}
                      onClick={() => {
                        setWishlist({ disabled: true, loading: true });
                        axiosInstance().put(`${eProduct.api}/wishlist`, { productId: id }).then(({ data }) => {
                          setWishlist({ disabled: false, loading: false });
                          wishlistDispatch({ type: "ADD", payload: { _id: id } })

                          toastConfig.setToastConfig({
                            open: true,
                            type: "success",
                            message: data.message,
                          });

                        }).catch((error) => {
                          toastConfig.setToastConfig(error);
                          setWishlist({ disabled: false, loading: false });
                        })
                      }}
                    >
                      {wishlist.disabled ? <AutorenewIcon className="rotate" /> : <BookmarkBorderIcon />}
                    </IconButton> : <IconButton
                      disabled={wishlist.disabled}
                      style={{ position: "absolute", zIndex: 1 }}
                      onClick={() => {
                        setWishlist({ disabled: true, loading: true });

                        axiosInstance().put(`${eProduct.api}/wishlist/remove`, { productId: id }).then(({ data }) => {
                          setWishlist({ disabled: false, loading: false });
                          wishlistDispatch({ type: "REMOVE", payload: id })

                          toastConfig.setToastConfig({
                            open: true,
                            type: "success",
                            message: data.message,
                          });
                        }).catch((error) => {
                          toastConfig.setToastConfig(error);
                          setWishlist({ disabled: false, loading: false });
                        })
                      }}
                    >
                      {wishlist.disabled ? <AutorenewIcon className="rotate" /> : <BookmarkIcon />}
                    </IconButton>
                  }

                  {productImages.length > 0 ? (
                    <Carousel
                      strictIndexing
                      animation="slide"
                      autoPlay={false}
                      navButtonsAlwaysVisible
                      cycleNavigation={false}
                      indicators={productImages.length > 1}
                      timeout={150}
                      navButtonsProps={{          // Change the colors and radius of the actual buttons. THIS STYLES BOTH BUTTONS
                        style: {
                          opacity: 0.4,
                          padding: 5,
                          borderRadius: "50%"
                        }
                      }}
                    >
                      {productImages.map((image: any, i) => (
                        <div key={i} className={classes.imageContainer}>
                          <img src={image} style={{ width: "40vw" , height:"100%" , backgroundRepeat:"no-repeat" }} />
                        </div>
                      ))}
                    </Carousel>
                  ) : (
                    <div>
                      <BsImage className={styles.product_no_image} />
                    </div>
                  )}
                </div>
              </Box>
            </Grid>
            <Grid item xs={12} md={5} sm={isTablet ? 12 : 5} className="px-0 py-0 my-3" style={{border:"1px solid grey"}}>
            <Grid className=' px-2 py-2 first-content-Layout'>
              <h5>{productDetails.productCategory?.optionLabel}</h5>
              <div className="w-100 d-flex align-items-center gap-2 justify-content-space-between" >
                <h2 style={{ color: "white", fontSize: "1.5rem" }}>{productDetails.productName}</h2>
                <ToggleButtonGroup
                  size="small"
                  value={orderType}
                  exclusive
                  className={classes.toggle_layout}

                  onChange={(_, value) => {
                    if (value) {
                      setOrderType(value);
                      history.push(`${routes.eCommerceDetail.path}/${id}/${value}`)
                    }
                  }}
                  aria-label="text alignment"
                >
                  {
                    Object.keys(ORDER_TYPES).map((key) => (
                      <ToggleButton className={classes.buyRentSwitch} style={orderType === ORDER_TYPES[key].value ? { "background": "#40AC99", "color": "white" } : {}} value={ORDER_TYPES[key].value} aria-label="left aligned">
                        {ORDER_TYPES[key].key}
                      </ToggleButton>
                    ))
                  }
                </ToggleButtonGroup>
              </div>
              
              <div className="d-flex justify-content-space-between">
              <div className="d-flex gap-2 pt-1">
              
                <h4 style={{ color: "white", opacity: "0.8" }}> Available - </h4>
                {productDetails?.available && <h4 className="mb-2"> {productDetails?.available}</h4>}
              </div> 
              <Box className="pl-3 pr-1 d-flex gap-4 align-items-baseline">
                    {
                      rateCurrency.rateWithCurrency
                        ? <Typography variant="h5" style={{fontWeight:"bold"}}>{rateCurrency.rateWithCurrency}</Typography>
                        : <Typography variant="h6" className="text-error">Price calculation not available</Typography>
                    }
                    {
                      rateCurrency.isRateMrpSame === false && <Typography variant="h5" className="custom-strike">{rateCurrency.mrp}</Typography>
                    }
                  </Box>

                  </div>
              <Rating
                name="half-rating-read"
                defaultValue={4.5}
                precision={0.5}
                value={productDetails?.averageRating}
                readOnly
                size="small"
                className={"rating-design"}
              />
              {/* <hr></hr> */}
              </Grid>
              {
                productDetails?.productShortDetail && <div className="my-3 px-5" dangerouslySetInnerHTML={{ __html: productDetails?.productShortDetail }}></div>
              }
              <Grid container >
                <Box p={0} >
                  
                <ProductConfiguration
                    initializeProductConfig={() => {
                      const items = [...cartItems];
                      const productIndex = getIndexOfProductInCart(items)
                      if (productIndex !== -1 && productConfigData.fields.length > 0) {
                        const productConfiguration = items[productIndex].productConfiguration;
                        setProductConfigData({
                          ...productConfigData,
                          values: productConfiguration
                        })
                      }
                    }}
                    data={productConfigData}
                    handleChange={(values: any) => {
                      setProductConfigData({
                        ...productConfigData,
                        values
                      })
                    }}
                  />



                  {productDetails.unit || productDetails.pricingMethod ? <Grid container spacing={2}>
                    <Grid item xs={productDetails.pricingMethod ? 6 : 12}>
                      {
                        productDetails.unit && <FormControl variant="outlined" margin="dense" fullWidth error={hasError && !data.selectedUnit}>
                          <InputLabel id="unit-label">Unit</InputLabel>
                          <Select
                            required
                            labelId="unit-label"
                            id="unit"
                            value={data.selectedUnit}
                            onChange={(e) => {
                              changeRateCurrency(productDetails, e.target.value, data.selectedPricingMethod)
                            }}
                            label="Unit"
                          >
                            {
                              productDetails.unit.map(m => (
                                <MenuItem value={m} key={m}>{m}</MenuItem>
                              ))
                            }
                          </Select>
                          {hasError && !data.selectedUnit && <FormHelperText>This is required!</FormHelperText>}
                        </FormControl>
                      }
                    </Grid>
                    <Grid item xs={productDetails.unit ? 6 : 12}>
                      {
                        orderTypeInLowerCase === ORDER_TYPES.rent?.value?.toLowerCase() && data.selectedPricingMethod && <FormControl variant="outlined" margin="dense" fullWidth error={hasError && !data.selectedPricingMethod}>
                          <InputLabel id="pricing-method-label">Pricing Method</InputLabel>
                          <Select
                            required={orderType === ORDER_TYPES.rent.key}
                            labelId="pricing-method-label"
                            id="pricing-method"
                            value={data.selectedPricingMethod}
                            onChange={(e) => {
                              changeRateCurrency(productDetails, data.selectedUnit, e.target.value)
                            }}
                            label="Pricing Method"
                          >
                            {
                              productDetails.pricingMethod.map(m => (
                                <MenuItem value={m} key={m}>{m}</MenuItem>
                              ))
                            }
                          </Select>
                          {hasError && !data.selectedPricingMethod && <FormHelperText>This is required!</FormHelperText>}
                        </FormControl>
                      }
                    </Grid>
                  </Grid> : ""
                  }
                  {orderTypeInLowerCase === ORDER_TYPES.rent?.value?.toLowerCase() && <Grid item xs={12} sm={12} md={12}>
                    <MuiPickersUtilsProvider utils={DateUtils}>
                      <Grid container spacing={2}>
                        <Grid item xs={6} sm={6}>
                          <KeyboardDatePicker
                            required={orderTypeInLowerCase === ORDER_TYPES.rent?.value?.toLowerCase()}
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
                                updateCart(cartItems[data.indexOfProductInCart]._id, Number(cartItems[data.indexOfProductInCart].qty), data.selectedUnit, data.selectedPricingMethod, date, data.endDate);
                              }
                            }}
                          />

                        </Grid>
                        <Grid item xs={6} sm={6}>
                          <KeyboardDatePicker
                            required={orderTypeInLowerCase === ORDER_TYPES.rent?.value?.toLowerCase()}
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
                                updateCart(cartItems[data.indexOfProductInCart]._id, Number(cartItems[data.indexOfProductInCart].qty), data.selectedUnit, data.selectedPricingMethod, data.startDate, date);
                              }

                            }}
                          />
                        </Grid>
                      </Grid>
                    </MuiPickersUtilsProvider>
                  </Grid>
                  }
                 
                  <Box className="my-3 px-3 d-flex gap-4 align-items-baseline">
                    {
                      rateCurrency.rateWithCurrency
                        ? <Typography variant="h5">{rateCurrency.rateWithCurrency}</Typography>
                        : <Typography variant="h6" className="text-error">Price calculation not available</Typography>
                    }
                    {
                      rateCurrency.isRateMrpSame === false && <Typography variant="h5" className="custom-strike">{rateCurrency.mrp}</Typography>
                    }
                  </Box>
                  <Box pl={2}>
                    {
                      productDetails && data.indexOfProductInCart > -1 && cartItems.length > 0 && cartItems.some(s => s.orderType.toLowerCase() === orderTypeInLowerCase && s.productDetail?._id === productDetails?._id)
                        ? <Grid container >
                          <Grid item xs={12} md={6} >
                            <PlusMinusTextboxComponent
                              inputTextLabel="Quantity"
                              value={data.indexOfProductInCart > -1 ? cartItems[data.indexOfProductInCart]?.qty?.toString() ?? "1" : "1"}
                              isRequired={true}
                              onChange={(value) => {
                                let items = [...cartItems];
                                const indexOfProduct = getIndexOfProductInCart(items); // items.findIndex(s => s.orderType.toLowerCase() === orderTypeInLowerCase && s.productDetail?._id === id);
                                updateCart(items[indexOfProduct]._id, Number(value), data.selectedUnit, data.selectedPricingMethod, data.startDate, data.endDate);
                              }}
                            />
                          </Grid>
                         </Grid>
                         : <CustomButton
                          type="button"
                          className="mt-2 "
                          color="primary"
                          variant="outlined"
                          disabled={addToCartBtnLoading || (orderTypeInLowerCase === ORDER_TYPES.rent?.value?.toLowerCase() ? !(data.startDate && data.endDate && data.selectedUnit && data.selectedPricingMethod) : !data.selectedUnit)}
                          loading={addToCartBtnLoading}
                          startIcon={addToCartBtnLoading ? null : <AddShoppingCartIcon />}
                          onClick={() => {
                            if (data.selectedUnit && data.selectedPricingMethod) {
                              setAddToCartBtnLoading(true)
                              onAddToCartItem(productDetails)
                            } else {
                              setHasError(true)
                            }
                          }}
                        >
                          Add to cart
                        </CustomButton>
                    }
                  </Box>
                  <Box mt={3}>
                    {
                      data.indexOfProductInCart !== -1 && <CustomButton
                        type="button"
                        color="primary"
                        variant="outlined"
                        disabled={deleteProductFromCartConfirmationDialog.okBtnLoading}
                        loading={deleteProductFromCartConfirmationDialog.okBtnLoading}
                        startIcon={addToCartBtnLoading ? null : <RemoveShoppingCartIcon />}
                        onClick={() => {
                          setDeleteProductFromCartConfirmationDialog({ show: true, okBtnLoading: false })
                        }}
                      >
                        Remove from cart
                      </CustomButton>
                    }
                  </Box>
                </Box>
              </Grid>
            </Grid>
            <Grid item xs={2}>
            </Grid>
          </Grid> : <Grid container className="py-4 px-2">
            <Grid item xs={4} className="d-flex flex-column align-items-center">
              <Box display="flex" justifyContent="center" alignItems="center">
                <Skeleton width={200} height={200} />
              </Box>
              <Skeleton width={120} height={50} />
            </Grid>
            <Grid item xs={8}>
              <Skeleton width={70} height={50} />
              <Skeleton width={100} height={50} />
              <Skeleton width={120} height={50} />
              <Skeleton width={150} height={50} />
              <Grid container className="mt-4">
                <Grid item xs={12} md={6} className="d-flex flex-column gap-3">

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Skeleton width="100%" height={70} />
                    </Grid>
                    <Grid item xs={6}>
                      <Skeleton width="100%" height={70} />
                    </Grid>
                  </Grid>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Skeleton width="100%" height={70} />
                    </Grid>
                    <Grid item xs={6}>
                      <Skeleton width="100%" height={70} />
                    </Grid>
                  </Grid>

                  <Box className="my-3 d-flex gap-4 align-items-baseline">
                    {
                      <div className="d-flex align-items-center gap-2">
                        <Skeleton width={100} height={50} />
                        <Skeleton width={100} height={50} />
                      </div>
                    }
                  </Box>

                  <Skeleton width={150} height={70} />

                </Grid>
              </Grid>

            </Grid>

          </Grid>
        }
        <hr />

        {
          productDetails?.bom && productDetails?.bom.length > 0 && <>
            <div className="my-3 px-4">
              <ProductBOM bom={productDetails?.bom} orderType={orderType} />
            </div>
            <hr />
          </>
        }

        <div className="my-3 px-4">
          <FrequentlyBought id={id} orderType={orderType} mainProductMrp={Number(rateCurrency.mrp)} mainProductWithCurrency={rateCurrency.rateWithCurrency} />
        </div>
        <hr />
        <SimilarItems similarItems={similarItems} orderType={orderType} />
        <hr />
        {productDetails?.productLongDetail &&
          <Fragment  >
            <div className="d-flex w-100 align-items-center justify-content-center my-3">
              <h1>Product Details</h1>
            </div>
            <div className="px-5" dangerouslySetInnerHTML={{ __html: productDetails?.productLongDetail }}></div>
          </Fragment>
        }
      </Box>
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
              const indexOfProduct = getIndexOfProductInCart(items);  //  items.findIndex(s => s.orderType.toLowerCase() === orderTypeInLowerCase && s.productDetail?._id === id);


              const productsToUpdate = items.filter(s => { return !(s.orderType.toLowerCase() === orderTypeInLowerCase && s.productDetail?._id === id) });
              dispatch({ type: SET_CART, payload: [...productsToUpdate] });

              axiosInstance().put(`/ecommerce/cart/remove`, { ids: [items[indexOfProduct]._id] }).then(({ data }) => {
                setDeleteProductFromCartConfirmationDialog({ show: false, okBtnLoading: false })
                setAddToCartBtnLoading(false)

                dispatchData({ type: TYPES.indexOfProductInCart, payload: -1 })

                toastConfig.setToastConfig({
                  open: true,
                  type: "success",
                  message: data.message,
                });
              }).catch((error) => {
                toastConfig.setToastConfig(error);
                dispatch({ type: SET_CART, payload: [...items] });
              })
            }}
          />
        ) : null
      }
    </div >
  );
}
