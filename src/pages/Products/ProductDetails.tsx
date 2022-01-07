import { useState, useEffect, useContext, Fragment, useReducer } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../axios/axiosInstance";
import { formatAmountWithCurrency, eProduct, dateFormatForInputControl } from "../../constants/helpers";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { Rating } from "@material-ui/lab";
import { Button, Box, Grid, makeStyles, IconButton, TextField, Typography } from "@material-ui/core";
import FrequentlyBought from "../../components/ProductList/FrequentlyBought/FrequentlyBought";
import SimilarItems from "../../components/ProductList/SimilarItems/SimilarItems";
import AddShoppingCartIcon from "@material-ui/icons/AddShoppingCart";
import RemoveShoppingCartIcon from "@material-ui/icons/RemoveShoppingCart";
import { BsImage } from "react-icons/bs";
import RatingAndReviewChart from "../../components/ProductList/RatingAndReviewChart";
import { Link } from "react-router-dom";
import ManageQuoteDialog from "../../pages/QuoteBuilderCombined/ManageQuote/ManageQuoteDialog";
import { useData } from "../../StateProvider/Provider";
import { useHistory } from "react-router-dom";
import routes from "../../components/Helpers/Routes";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import { SET_CART } from "../../StateProvider/actionTypes";
import Carousel from "react-material-ui-carousel";
import styles from "./product-detail-page.module.scss";
import { WishlistContext } from "../../StateProvider/WishlistContext/WishlistProvider";
import CustomButton from "../../components/Helpers/CustomButton";
import FavoriteIcon from '@material-ui/icons/Favorite';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import PlusMinusTextboxComponent from "../../components/PlusMinusTextboxComponent/PlusMinusTextboxComponent";
import DateUtils from '@date-io/date-fns';
import { DatePicker, KeyboardDatePicker, KeyboardDateTimePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';

const useStyles = makeStyles(() => ({
  imageContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  img: {
    maxWidth: "500px",
  },
}));

const TYPES = {
  startDate: "START_DATE",
  endDate: "END_DATE",
  unitAndPricingMethod: "UNIT",
  indexOfProductInCart: "INDEX_OF_PRODUCT_IN_CART",
  updateWholePaload: "UPDATE_WHOLE_PALOAD",
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

    case TYPES.updateWholePaload:
      return { ...data, ...action.payload };

    default:
      return { ...data }
  }
}

export default function ProductDetails() {

  const [data, dispatchData] = useReducer(reducer, initialData);

  const classes = useStyles();
  const [reviews, setReviews] = useState([])
  const [productDetails, setProductDetails] = useState(null);
  const [similarItems, setSimilarItems] = useState([]);
  const [showCreateQuoteDialog, setshowCreateQuoteDialog] = useState(false);
  const [addToCartBtnLoading, setAddToCartBtnLoading] = useState(false);
  const [checkoutLabel, setCheckoutLabel] = useState("Checkout")
  const [addedCartItems, setAddedCartItems] = useState([])
  const [products, setProducts] = useState([]);
  const toastConfig = useContext(CustomToastContext);
  const { state: { user, cartItems }, dispatch }: any = useData();
  const [wishlist, setWishlist] = useState({ loading: false, disabled: false });
  // const [indexOfProductInCart, setIndexOfProductInCart] = useState(-1);
  const [rateCurrency, setRateCurrency] = useState({ currency: "", rate: "", mrp: "", rateWithCurrency: "", unit: "", pricingMethod: "", isRateMrpSame: false })
  const [deleteProductFromCartConfirmationDialog, setDeleteProductFromCartConfirmationDialog] = useState({ show: false, okBtnLoading: false })
  // const [selectedUnit, setSelectedUnit] = useState("");
  // const [selectedPricingMethod, setSelectedPricingMethod] = useState("");
  const { wishlistState, wishlistDispatch } = useContext(WishlistContext);
  const [hasError, setHasError] = useState(false);
  // const [timePeriod, setTimePeriod] = useState({
  //   startDate: new Date(),
  //   endDate: new Date(),
  // });

  const history = useHistory();
  let { id } = useParams();

  useEffect(() => {
    fetchCart()
    fetchProducts()
    // fetchReviews()
  }, []);

  useEffect(() => {
    axiosInstance().get(`${eProduct.api}/${id}`).then(({ data: { data } }) => {
      setProductDetails({ ...data });

      const indexOfProductInCart = cartItems.findIndex(({ productDetail }) => productDetail._id === id);
      if (indexOfProductInCart > -1) {
        dispatchData({
          type: TYPES.updateWholePaload,
          payload: {
            selectedUnit: cartItems[indexOfProductInCart].unit,
            selectedPricingMethod: cartItems[indexOfProductInCart].pricingMethod,
            startDate: cartItems[indexOfProductInCart].startDate,
            endDate: cartItems[indexOfProductInCart].endDate,
            indexOfProductInCart: indexOfProductInCart,
          }
        })

        changeRateCurrency(data, cartItems[indexOfProductInCart].unit, cartItems[indexOfProductInCart].pricingMethod)
      } else {
        let firstUnit = data.unit && data.unit.length > 0 ? data.unit[0] : "";
        let firstPricingMethod = data.pricingMethod && data.pricingMethod.length > 0 ? data.pricingMethod[0] : "";

        changeRateCurrency(data, firstUnit, firstPricingMethod)
      }

    }).catch((error) => {
      toastConfig.setToastConfig(error);
    })
  }, [id])

  const changeRateCurrency = (productData, unit, pricingMethod) => {

    dispatchData({ type: TYPES.unitAndPricingMethod, payload: { selectedUnit: unit, selectedPricingMethod: pricingMethod } })

    if (unit && pricingMethod) {
      const record = productData.priceCalculation.find(d => d.pricingMethod === pricingMethod && d.unit === unit);
      if (record) {
        setRateCurrency({ currency: record.currency, unit: unit, pricingMethod: pricingMethod, rate: record.rate, rateWithCurrency: formatAmountWithCurrency(record.currency, record.rate)?.fullFormatAmount, mrp: record.mrp, isRateMrpSame: record.rate === record.mrp })
      }
    } else if (unit) {
      const record = productData.priceCalculation.find(d => d.unit === unit);
      if (record) {
        setRateCurrency({ currency: record.currency, unit: unit, pricingMethod: pricingMethod, rate: record.rate, rateWithCurrency: formatAmountWithCurrency(record.currency, record.rate)?.fullFormatAmount, mrp: record.mrp, isRateMrpSame: false })
      }
    } else if (pricingMethod) {
      const record = productData.priceCalculation.find(d => d.pricingMethod === pricingMethod);
      if (record) {
        setRateCurrency({ currency: record.currency, unit: unit, pricingMethod: pricingMethod, rate: record.rate, rateWithCurrency: formatAmountWithCurrency(record.currency, record.rate)?.fullFormatAmount, mrp: record.mrp, isRateMrpSame: false })
      }
    }

    if (data.indexOfProductInCart !== -1) {
      updateCart(cartItems[data.indexOfProductInCart]._id, parseInt(cartItems[data.indexOfProductInCart].qty), unit, pricingMethod, data.startDate, data.endDate);
    }

  }

  // const fetchReviews = () => {
  //   axiosInstance()
  //     .get(`${review.reviewsApi}/${id}`)
  //     .then(({ data: { data } }) => {
  //       if (data.review) {
  //         setReviews(data.review)
  //       }
  //     })
  //     .catch((error) => {
  //       toastConfig.setToastConfig(error);
  //     });
  // }

  const fetchProducts = () => {
    axiosInstance()
      .get(`${eProduct.api}?limit=0`)
      .then(({ data: { data } }) => {
        data = data.map(obj => ({ ...obj, selected: false }))
        setProducts(data);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }

  const fetchCart = () => {
    axiosInstance()
      .get(`/ecommerce/cart`).then(({ data: { data } }) => {

        if (data) {
          dispatch({ type: SET_CART, payload: [...data] });
          dispatchData({ type: TYPES.indexOfProductInCart, payload: data.findIndex(({ productDetail }) => productDetail._id === id) })

          if (addToCartBtnLoading) setAddToCartBtnLoading(false)

          setAddedCartItems(data)
        }
        if (data && data.length >= 1) {
          setCheckoutLabel("Create Quote")
        }
      })
  }

  const onCheckout = () => {
    if (checkoutLabel === "Create Quote" && addedCartItems.length >= 1) {
      setshowCreateQuoteDialog(true)
    }
  }

  const onAddToCartItem = (item) => {
    axiosInstance()
      .post(`/ecommerce/cart`,
        [{
          qty: 1,
          type: 'product',
          materialId: item._id,
          mrp: Number(item.mrp),
          rate: 10,
          unit: data.selectedUnit,
          pricingMethod: data.selectedPricingMethod,
          orderType: 'rent',
          startDate: data.startDate,
          endDate: data.endDate,
          currency: rateCurrency.currency
        }]
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
        .get(
          `${eProduct.api}?filterById=[{"field":"productCategory", "term": "${productDetails.productCategory}"}]&limit=0`
        )
        .then(({ data: { data } }) => {
          setSimilarItems(data);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  }, [productDetails]);

  const calculateNetPrice = (price: number, discount: any) => {
    let netPrice = price;
    netPrice = price - (price * discount) / 100;
    return netPrice;
  };

  const amountOfDiscount = (price: number, discount: any) => {
    return (price * discount) / 100 + " " + productDetails.currency;
  };

  const handleCreateQuote = (values) => {
    let selectedProductIds = addedCartItems.map(o => o.productDetail?._id)

    let selectedProducts = products.filter(obj => selectedProductIds.indexOf(obj._id) >= 0)
    axiosInstance()
      .post(`quote-builder/create/from-cart`, { ...values, products: selectedProducts })
      .then(({ data: { data } }) => {
        history.push(`${routes.quoteBuilder.path}/detail/${data?._id}`);
      })
  }

  const updateCart = (cartId, value, unit, pricingMethod, startDate, endDate) => {
    axiosInstance().put(`/ecommerce/cart`, {
      _id: cartId,
      qty: value,
      unit: unit,
      pricingMethod: pricingMethod,
      startDate: startDate,
      endDate: endDate,
      currency: rateCurrency.currency
    }).then(() => {

    }).catch((error) => {
      toastConfig.setToastConfig(error);
      // dispatch({ type: SET_CART, payload: [...items] });
    })
  }

  return (
    <Fragment>
      <Grid container className="headerbox">
        <CustomBreadCrumbs routes={[routes.eCommerce, { title: productDetails?.productName }]} />
      </Grid>
      <Box className="main-container">
        {showCreateQuoteDialog && (
          <ManageQuoteDialog
            open={showCreateQuoteDialog}
            onSuccess={() => { }}
            onClose={() => {
              setshowCreateQuoteDialog(false)
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
            doaCollaboratorResources={user?.user?.doa.map(obj => obj.user)}
            isRenderedFromOpportunity={false}
            isCreateQuoteFromCart={true}
            onHandleSubmit={handleCreateQuote}
          />
        )}


        {

          productDetails ? <Grid container className="py-4 px-2" spacing={2}>

            <Grid item xs={3} className="d-flex flex-column align-items-center">
              <Box display="flex" justifyContent="center" alignItems="center">

                {productDetails?.sliderImage && productDetails?.sliderImage.length > 0 ? (
                  <Carousel
                    strictIndexing
                    animation="slide"
                    autoPlay={false}
                    navButtonsAlwaysVisible
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
                    {productDetails.sliderImage.map((image: any, i) => (
                      <div key={i} className={classes.imageContainer}>
                        <img className={classes.img} src={image} />
                      </div>
                    ))}
                  </Carousel>
                ) : (
                  <BsImage className={styles.product_no_image} />
                )}
              </Box>

              {
                wishlistState.wishlist.length === 0 || !wishlistState.wishlist.find(s => s._id === id) ? <CustomButton
                  type="button"
                  className="mt-2"
                  color="primary"
                  variant="contained"
                  disabled={wishlist.disabled}
                  loading={wishlist.loading}
                  startIcon={wishlist.loading ? null : <FavoriteIcon />}
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
                  Add to wishlist
                </CustomButton> : <CustomButton
                  type="button"
                  className="mt-2"
                  color="primary"
                  variant="outlined"
                  disabled={wishlist.disabled}
                  loading={wishlist.loading}
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
                  Remove from wishlist
                </CustomButton>
              }
            </Grid>

            <Grid item xs={6}>

              <h2>{productDetails.productName}</h2>

              <Rating
                name="half-rating-read"
                defaultValue={4.5}
                precision={0.5}
                value={productDetails?.averageRating}
                readOnly
                size="small"
              />

              {/* <div className="d-flex gap-2">
              <h4>Avaibility-&nbsp;</h4>
              {productDetails?.qty > 0 ? "In Stock" : "Out of Stock"}
            </div> */}

              <div className="d-flex gap-2">
                <h4>Sold by - {user?.user?.brandName}</h4>
              </div>

              <div className="d-flex gap-2 mt-5">
                <h4>Product Number - {productDetails.productNumber}</h4>
              </div>

            </Grid>

            <Grid item xs={3}>
              <div className="d-flex flex-column gap-3">
                {
                  productDetails.unit || productDetails.pricingMethod ? <Grid container spacing={2}>
                    <Grid item xs={productDetails.pricingMethod ? 6 : 12}>
                      {
                        productDetails.unit && <FormControl variant="outlined" margin="dense" fullWidth error={hasError && !data.selectedUnit}>
                          <InputLabel id="unit-label">Unit</InputLabel>
                          <Select
                            labelId="unit-label"
                            id="unit"
                            value={data.selectedUnit}
                            onChange={(e) => {
                              changeRateCurrency(productDetails, e.target.value, rateCurrency.pricingMethod)
                            }}
                            label="Unit"
                          >
                            {
                              productDetails.unit.map(m => (
                                <MenuItem value={m}>{m}</MenuItem>
                              ))
                            }
                          </Select>
                          {hasError && !data.selectedUnit && <FormHelperText>This is required!</FormHelperText>}
                        </FormControl>
                      }
                    </Grid>
                    <Grid item xs={productDetails.unit ? 6 : 12}>
                      {
                        productDetails.pricingMethod && <FormControl variant="outlined" margin="dense" fullWidth error={hasError && !data.selectedPricingMethod}>
                          <InputLabel id="pricing-method-label">Pricing Method</InputLabel>
                          <Select
                            labelId="pricing-method-label"
                            id="pricing-method"
                            value={data.selectedPricingMethod}
                            onChange={(e) => {
                              changeRateCurrency(productDetails, rateCurrency.unit, e.target.value)
                            }}
                            label="Pricing Method"
                          >
                            {
                              productDetails.pricingMethod.map(m => (
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

                <Grid item xs={12} sm={12} md={12}>
                  <MuiPickersUtilsProvider utils={DateUtils}>
                    <Grid container spacing={2}>

                      <Grid item xs={6} sm={6}>
                        <KeyboardDatePicker
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
                      <Grid item xs={6} sm={6}>
                        <KeyboardDatePicker
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

                {
                  productDetails && data.indexOfProductInCart > -1 && cartItems.length > 0 && cartItems.some(s => s.productDetail?._id === productDetails?._id)
                    ? <PlusMinusTextboxComponent
                      inputTextLabel="Quantity"
                      value={data.indexOfProductInCart > -1 ? cartItems[data.indexOfProductInCart]?.qty?.toString() ?? "1" : "1"}
                      isRequired={true}
                      onChange={(value) => {
                        let items = [...cartItems];
                        const indexOfProduct = items.findIndex(s => s.productDetail?._id === id);

                        updateCart(items[indexOfProduct]._id, parseInt(value), data.selectedUnit, data.selectedPricingMethod, data.startDate, data.endDate);
                      }}
                    />
                    : <CustomButton
                      type="button"
                      className="mt-2"
                      color="primary"
                      variant="outlined"
                      disabled={addToCartBtnLoading}
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

                <Box className="my-3 d-flex gap-4 align-items-baseline">
                  <Typography variant="h4">{rateCurrency.rateWithCurrency}</Typography>
                  {
                    rateCurrency.isRateMrpSame === false && <Typography variant="h5" className="custom-strike">{rateCurrency.mrp}</Typography>
                  }
                </Box>

                {/* <div className="d-flex gap-2"> */}

                {
                  data.indexOfProductInCart !== -1 && <CustomButton
                    fullWidth
                    type="button"
                    color="primary"
                    variant="outlined"
                    disabled={deleteProductFromCartConfirmationDialog.okBtnLoading}
                    loading={deleteProductFromCartConfirmationDialog.okBtnLoading}
                    onClick={() => {
                      setDeleteProductFromCartConfirmationDialog({ show: true, okBtnLoading: false })
                    }}
                  >
                    Remove from cart
                  </CustomButton>
                }

                {/* <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    size="small"
                    startIcon={<AddShoppingCartIcon />}
                    onClick={onCheckout}
                  >
                    {checkoutLabel}
                  </Button> */}

                {/* <Button
                    variant="outlined"
                    color="secondary"
                    size="small"
                    className={styles.secondary_buttons}
                  >
                    Add to Configure
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    size="small"
                    className={styles.secondary_buttons}
                  >
                    Add to Planner
                  </Button> */}

                {/* </div> */}

              </div>

            </Grid>

          </Grid> : <div style={{ height: 300 }} className="d-flex align-items-center justify-content-center p-5">
            Loading.....
          </div>
        }








        {/* <div className={styles.container_box}>
          {productDetails ? (
            <div className={styles.product_container}>
              <div className={styles.product_image}>

              </div>
              <div className={styles.product_details}>
                <header>
                  <h1 className={styles.title}>{productDetails.productName}</h1>

                  <div className={styles.user_rating}>
                    <Rating
                      name="half-rating-read"
                      defaultValue={4.5}
                      precision={0.5}
                      value={productDetails?.averageRating}
                      readOnly
                      size="small"
                    />
                    <p>{productDetails?.averageRating}</p>
                  </div>

                  <span className={styles.avaibility}>
                    <h3>Avaibility-&nbsp;</h3>
                    {productDetails?.qty > 0 ? "In Stock" : "Out of Stock"}
                  </span>
                  <div className={styles.price}>
                    <span className={styles.vendor}>
                      <h5>Sold by: <span>{user?.user?.brandName}</span></h5>
                    </span>
                  </div>
                  <div className={styles.set_width}> <hr /> </div>

                </header>
                <article>
                  <p>{productDetails?.description}</p>
                </article>
                <div className={styles.controls}>

                  {productDetails.productNumber && <div className={styles.controls_over}>
                    <h5><li>Product Number - </li></h5>
                    <a className="option">{` ${productDetails.productNumber}`}</a>
                  </div>}
                </div>





                <div className={styles.price_and_discount}>
                  <span className={styles.current}>
                    <h2>{
                      formatAmountWithCurrency(
                        productDetails.currency, productDetails.mrp).fullFormatAmount
                    }</h2>
                    {
                      formatAmountWithCurrency(
                        productDetails.currency,
                        calculateNetPrice(
                          parseInt(productDetails.mrp),
                          productDetails.discount
                        )
                      ).fullFormatAmount
                    }
                  </span>

                  <span className={styles.mrp_price}>

                    {
                      formatAmountWithCurrency(
                        productDetails.currency,
                        productDetails.mrp
                      ).fullFormatAmount
                    }
                  </span>
                </div>

              </div>
            </div>
          ) : (
            <span>Loading...</span>
          )}
          <div className="a_divider_inner"></div>

          <SimilarItems similarItems={similarItems} />
          <div className="a_divider_inner"></div>
          <RatingAndReviewChart id={id} reviews={reviews}
            averageRating={Math.round(productDetails?.averageRating).toFixed(1) || 0} />
        </div> */}

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
              const indexOfProduct = items.findIndex(s => s.productDetail?._id === id);

              const productsToUpdate = items.filter(s => s.productDetail?._id !== id);
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

    </Fragment >
  );
}
