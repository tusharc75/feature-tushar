import { useState, useEffect, useContext, Fragment, useRef } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../axios/axiosInstance";
import { formatAmountWithCurrency, eProduct } from "../../constants/helpers";
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

export default function ProductDetails() {

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
  const [indexOfProductInCart, setIndexOfProductInCart] = useState(-1);
  const [rateCurrency, setRateCurrency] = useState({ rate: "", mrp: "", rateWithCurrency: "", unit: "", pricingMethod: "", isRateMrpSame: false })
  const [deleteProductFromCartConfirmationDialog, setDeleteProductFromCartConfirmationDialog] = useState({ show: false, okBtnLoading: false })
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedPricingMethod, setSelectedPricingMethod] = useState('');
  const { wishlistState, wishlistDispatch } = useContext(WishlistContext);
  const [hasError,setHasError] = useState(false);

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

      let firstUnit = data.unit && data.unit.length > 0 ? data.unit[0] : "";
      let firstPricingMethod = data.pricingMethod && data.pricingMethod.length > 0 ? data.pricingMethod[0] : "";

      changeRateCurrency(data, firstUnit, firstPricingMethod)
      setIndexOfProductInCart(cartItems.findIndex(({ productId }) => productId === id))
    }).catch((error) => {
      toastConfig.setToastConfig(error);
    })
  }, [id])

  const changeRateCurrency = (data, unit, pricingMethod) => {

    if (unit && pricingMethod) {
      const record = data.find(d => d.pricingMethod === pricingMethod && d.unit === unit);
      if (record) {
        setRateCurrency({ unit: unit, pricingMethod: pricingMethod, rate: record.rate, rateWithCurrency: formatAmountWithCurrency(record.currency, record.rate)?.fullFormatAmount, mrp: record.mrp, isRateMrpSame: record.rate === record.mrp })
      }
    } else if (unit) {
      const record = data.priceCalculation.find(d => d.unit === unit);
      if (record) {
        setRateCurrency({ unit: unit, pricingMethod: pricingMethod, rate: record.rate, rateWithCurrency: formatAmountWithCurrency(record.currency, record.rate)?.fullFormatAmount, mrp: record.mrp, isRateMrpSame: false })
      }
    } else if (pricingMethod) {
      const record = data.priceCalculation.find(d => d.pricingMethod === pricingMethod);
      if (record) {
        setRateCurrency({ unit: unit, pricingMethod: pricingMethod, rate: record.rate, rateWithCurrency: formatAmountWithCurrency(record.currency, record.rate)?.fullFormatAmount, mrp: record.mrp, isRateMrpSame: false })
      }
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
          setIndexOfProductInCart(data.findIndex(({ productId }) => productId === id));
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
          type:'product',
          materialId: item._id,
          mrp:Number(item.mrp),
          rate:10,
          unit:selectedUnit,
          pricingMethod:selectedPricingMethod,
          orderType:'rent'

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
    let selectedProductIds = addedCartItems.map(o => o.productId)

    let selectedProducts = products.filter(obj => selectedProductIds.indexOf(obj._id) >= 0)
    axiosInstance()
      .post(`quote-builder/create/from-cart`, { ...values, products: selectedProducts })
      .then(({ data: { data } }) => {
        history.push(`${routes.quoteBuilder.path}/detail/${data?._id}`);
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
        <div className={styles.container_box}>
          {productDetails ? (
            <div className={styles.product_container}>
              <div className={styles.product_image}>
                <Box display="flex" justifyContent="center" alignItems="center" >

                  {productDetails.sliderImage && productDetails.sliderImage.length > 0 ? (
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

                  {/*<div className={styles.rate}>*/}
                  {/*  <Rating*/}
                  {/*    name="half-rating-read"*/}
                  {/*    defaultValue={2.5}*/}
                  {/*    precision={0.5}*/}
                  {/*    value={productDetails.rating}*/}
                  {/*    readOnly*/}
                  {/*    size="small"*/}
                  {/*  />*/}
                  {/*</div>*/}
                </header>
                <article>
                  {/*<h5>Description</h5>*/}
                  <p>{productDetails?.description}</p>
                </article>
                <div className={styles.controls}>
                  {/* <div className={styles.controls_over}>
                    <h5><li>MFG</li></h5>
                    <a className="option">(UK 8)</a>
                  </div> */}
                  {productDetails.productNumber && <div className={styles.controls_over}>
                    <h5><li>Product Number - </li></h5>
                    <a className="option">{` ${productDetails.productNumber}`}</a>
                  </div>}
                </div>

                {
                  productDetails.unit && <FormControl variant="outlined" fullWidth error={hasError && selectedUnit?.length === 0}>
                    <InputLabel id="unit-label">Unit</InputLabel>
                    <Select
                      labelId="unit-label"
                      id="unit"
                      value={selectedUnit}
                      onChange={(e) => {
                        changeRateCurrency(productDetails, e.target.value, rateCurrency.pricingMethod)
                        setSelectedUnit(`${e.target.value}`)
                       
                      }}
                      label="Unit"
                    >
                      {
                        productDetails.unit.map(m => (
                          <MenuItem value={m}>{m}</MenuItem>
                        ))
                      }
                    </Select>
                    {hasError && selectedUnit?.length === 0 && <FormHelperText>This is required!</FormHelperText>}
                  </FormControl>
                }

                {
                  productDetails.pricingMethod && <FormControl className="mt-3" variant="outlined" fullWidth error={hasError && selectedPricingMethod?.length === 0}>
                    <InputLabel id="pricing-method-label">Pricing Method</InputLabel>
                    <Select
                      labelId="pricing-method-label"
                      id="pricing-method"
                      value={selectedPricingMethod}
                      onChange={(e) => {
                        changeRateCurrency(productDetails, rateCurrency.unit, e.target.value)
                        setSelectedPricingMethod(`${e.target.value}`)
                       
                      }}
                      label="Pricing Method"
                    >
                      {
                        productDetails.pricingMethod.map(m => (
                          <MenuItem value={m}>{m}</MenuItem>
                        ))
                      }
                    </Select>
                    {hasError && selectedPricingMethod?.length === 0 && <FormHelperText>This is required!</FormHelperText>}
                  </FormControl>
                }


                <Box className="mt-2 d-flex gap-4 align-items-baseline">
                  <Typography variant="h4">{rateCurrency.rateWithCurrency}</Typography>
                  {
                    rateCurrency.isRateMrpSame === false && <Typography variant="h5" className="custom-strike">{rateCurrency.mrp}</Typography>
                  }
                </Box>


                {/*<div className={styles.set_width_2}> <hr/> </div>*/}
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

                <div className="d-flex gap-2" >
                  {
                    indexOfProductInCart > -1 && cartItems.length > 0 && cartItems.some(s => s.productId === productDetails?._id)
                      ? <PlusMinusTextboxComponent
                        inputTextLabel="Quantity"
                        value={indexOfProductInCart > -1 ? cartItems[indexOfProductInCart]?.quantity?.toString() ?? "1" : "1"}
                        isRequired={true}
                        onChange={(value) => {
                          let items = [...cartItems];
                          const indexOfProduct = items.findIndex(s => s.productId === id);

                          axiosInstance().put(`/user/cart/${items[indexOfProduct].id}`, { quantity: value?.toString() }).then(() => {

                          }).catch((error) => {
                            toastConfig.setToastConfig(error);
                            dispatch({ type: SET_CART, payload: [...items] });
                          })
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
                         if(selectedUnit?.length > 0 && selectedPricingMethod?.length > 0){
                          setAddToCartBtnLoading(true)
                          onAddToCartItem(productDetails)
                        
                         }else{
                          setHasError(true) 

                         } 
                         
                        }}
                      >
                        Add to cart
                      </CustomButton>
                  }
                </div>

                <div className={`${styles.button_layout} footer d-flex gap-2`}>

                  {
                    indexOfProductInCart !== -1 && <CustomButton
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

                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    className="mr-2"
                    startIcon={<AddShoppingCartIcon />}
                    onClick={onCheckout}
                  >
                    {checkoutLabel}
                  </Button>

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
                </div>
              </div>
            </div>
          ) : (
            <span>Loading...</span>
          )}
          <div className="a_divider_inner"></div>

          {/* <FrequentlyBought id={productDetails?._id} />
          <div className="a_divider_inner"></div> */}
          <SimilarItems similarItems={similarItems} />
          <div className="a_divider_inner"></div>
          <RatingAndReviewChart id={id} reviews={reviews}
            averageRating={Math.round(productDetails?.averageRating).toFixed(1) || 0} />
        </div>

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
              const indexOfProduct = items.findIndex(s => s.productId === id);

              const productsToUpdate = items.filter(s => s.productId !== id);
              dispatch({ type: SET_CART, payload: [...productsToUpdate] });

              axiosInstance().delete(`/user/cart/${items[indexOfProduct].id}`).then(({ data }) => {
                setDeleteProductFromCartConfirmationDialog({ show: false, okBtnLoading: false })
                setAddToCartBtnLoading(false)
                setIndexOfProductInCart(-1)

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
