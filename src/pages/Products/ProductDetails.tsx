import { useState, useEffect, useContext, Fragment } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../axios/axiosInstance";
import { formatAmountWithCurrency, product, review } from "../../constants/helpers";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { Rating } from "@material-ui/lab";
import styles from "./product-detail-page.module.scss";
import { Button, Box, Grid, makeStyles } from "@material-ui/core";
import FrequentlyBought from "../../components/ProductList/FrequentlyBought/FrequentlyBought";
import SimilarItems from "../../components/ProductList/SimilarItems/SimilarItems";
import AddShoppingCartIcon from "@material-ui/icons/AddShoppingCart";
import { BsImage } from "react-icons/bs";
import RatingAndReviewChart from "../../components/ProductList/RatingAndReviewChart";
import { Link } from "react-router-dom";
import ManageQuoteDialog from "../../pages/QuoteBuilderCombined/ManageQuote/ManageQuoteDialog";
import { useData } from "../../StateProvider/Provider";
import { useHistory } from "react-router-dom";
import routes from "../../components/Helpers/Routes";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import { SET_CART_COUNT } from "../../StateProvider/actionTypes"
import Carousel from "react-material-ui-carousel";

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

export default function ProductDetails() {

  const classes = useStyles();
  const [reviews, setReviews] = useState([])
  const [productDetails, setProductDetails] = useState(null);
  const [similarItems, setSimilarItems] = useState([]);
  const [showCreateQuoteDialog, setshowCreateQuoteDialog] = useState(false);
  const [checkoutLabel, setCheckoutLabel] = useState("Checkout")
  const [addedCartItems, setAddedCartItems] = useState([])
  const [products, setProducts] = useState([]);
  const toastConfig = useContext(CustomToastContext);
  const { state: { user }, dispatch }: any = useData();
  const history = useHistory();
  let { id } = useParams();

  useEffect(() => {
    fetchCart()
    fetchProducts()
    fetchReviews()
  }, []);

  const fetchReviews = () => {
    axiosInstance()
      .get(`${review.reviewsApi}/${id}`)
      .then(({ data: { data } }) => {
        if (data.review) {
          setReviews(data.review)
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }

  const fetchProducts = () => {
    axiosInstance()
      .get(`${product.api}?limit=0`)
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
      .get(`/user/cart`).then(({ data: { data } }) => {

        if (data) {
          dispatch({ type: SET_CART_COUNT, payload: data.length });
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
    let tempQuantity = 1
    addedCartItems.some(o => {
      if (o.productId === item._id) {
        tempQuantity = tempQuantity + 1
        return true
      }
    })

    axiosInstance()
      .post(`/user/cart`, {
        products: [{
          quantity: `${tempQuantity}`,
          productId: item._id
        }]
      }).then(({ data }) => {
        fetchCart()
      })
  }

  useEffect(() => {
    axiosInstance()
      .get(`/product/` + id)
      .then(({ data: { data } }) => {
        setProductDetails({
          ...data.productData, images: [
            "https://images.unsplash.com/photo-1506467493604-25d7861a6703?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxleHBsb3JlLWZlZWR8MTF8fHxlbnwwfHx8fA%3D%3D&w=1000&q=80",
            "https://www.esa.int/var/esa/storage/images/esa_multimedia/images/2016/10/colima_volcano/16186851-1-eng-GB/Colima_volcano.jpg",
            "https://news.cornell.edu/sites/default/files/styles/full_size/public/2020-10/1012_nasa.jpg?itok=KJ3jzpto"
          ]
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, []);

  useEffect(() => {
    if (productDetails) {
      axiosInstance()
        .get(
          `${product.api}?filterById=[{"field":"productCategory", "term": "${productDetails.productCategory}"}]&limit=0`
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

                  {productDetails.images ? (
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
                      {productDetails.images.map((image: any, i) => (
                        <div key={i} className={classes.imageContainer}>
                          <img className={classes.img} src={image} />
                        </div>
                      ))}
                    </Carousel>
                  ) : (
                    <BsImage className={styles.product_no_image} />
                  )}
                </Box>
              </div>
              <div className={styles.product_details}>
                <header>
                  <h1 className={styles.title}>{productDetails.productName}</h1>
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
                    <h5><li>Product Number </li></h5>
                    <a className="option">{` ${productDetails.productNumber}`}</a>
                  </div>}
                  {productDetails.unit && <div className={styles.controls_over}>
                    <h5><li>Measuring Unit </li></h5>
                    <a className="option">{` ${productDetails.unit}`}</a>
                  </div>}
                </div>

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
                <div className={'footer' && styles.button_layout} >
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    className={styles.primary_buttons}
                    startIcon={<AddShoppingCartIcon />}
                    onClick={() => onAddToCartItem(productDetails)}
                  >
                    Add to cart
                  </Button>
                  <Link to="/product/my-cart">
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      className={styles.primary_buttons}
                      startIcon={<AddShoppingCartIcon />}
                    >
                      Checkout
                    </Button>
                  </Link>
                </div>
                <div className={'footer' && styles.button_layout}>
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

          <FrequentlyBought id={productDetails?._id} />
          <div className="a_divider_inner"></div>
          <SimilarItems similarItems={similarItems} />
          <div className="a_divider_inner"></div>
          <RatingAndReviewChart id={id} reviews={reviews}
            averageRating={Math.round(productDetails?.averageRating).toFixed(1) || 0} />
        </div>

      </Box>
    </Fragment>
  );
}

// return (
//     <Layout>
//         <>
//             {
//                 productDetails ? <div>
//                     <div>
//                         <h2>Home {`>`} Product {`>`} Item </h2>
//                         <div className={styles.grid_container}>
//                             <div className={styles.left_side}>
//                                 <div className="productImage">
//                                     <img src={productDetails.productImage} alt={productDetails.productName} />
//                                 </div>
//                             </div>
//                             <div className={styles.right_side}>
//                                 <div className={styles.name}>{productDetails.productName}</div>
//                                 <div className={styles.availability}>Availability: <span>{productDetails?.qty > 0 ? "In Stock" : "Out of Stock"}</span></div>
//                                 <div className={styles.seller}>Sold By: {productDetails?.brand?.optionLabel}</div>
//                                 <hr />
//                                 <div className={styles.description}>
//                                     <div className={styles.listItem}>
//                                         <ul>
//                                             <li>MFG Value - {productDetails?.mfg}</li>
//                                             <li>Product Number - {productDetails?.productNumber}</li>
//                                             <li>{productDetails?.description}</li>
//                                             <li>Measuring Unit - {productDetails?.unit}</li>
//                                         </ul>
//                                     </div>
//                                     <div className={styles.price}>{calculateNetPrice(parseInt(productDetails.mrp), productDetails.discount)}<span className={styles.originalPrice}>{productDetails.mrp} {productDetails.currency}</span></div>
//                                     <h4>You Save: <span>{amountOfDiscount(parseInt(productDetails.mrp), productDetails.discount)}</span> </h4>
//                                     <div className={styles.rating}>
//                                         <Rating name="half-rating-read" defaultValue={2.5} precision={0.5} value={productDetails.rating} readOnly size="small" />
//                                         <span className={styles.ml_2}>{productDetails.rating}</span>
//                                     </div>
//                                     <div className={styles.buttons}>
//                                         <div>
//                                             <Button
//                                                 variant="outlined"
//                                                 color="primary"
//                                                 size="small"
//                                                 className="mr-2"
//                                             >
//                                                 Add to Cart
//                                             </Button>
//                                             <Button
//                                                 variant="outlined"
//                                                 color="primary"
//                                                 size="small"
//                                             >
//                                                 Check Out
//                                             </Button>
//                                         </div>
//                                         <div>
//                                             <Button
//                                                 variant="outlined"
//                                                 color="primary"
//                                                 size="small"
//                                                 className="mr-2"
//                                             >
//                                                 Add to Configure
//                                             </Button>
//                                             <Button
//                                                 variant="outlined"
//                                                 color="primary"
//                                                 size="small"
//                                                 className="mr-2"
//                                             >
//                                                 Add to Planner
//                                             </Button>
//                                         </div>

//                                     </div>
//                                 </div>
//                             </div>

//                         </div>
//                     </div>
//                     {/* <div className="a-divider a-divider-section"><div className={styles.a_divider_inner}></div></div>
//                     <FrequentlyBought /> */}
//                     <div className="a-divider a-divider-section"><div className={styles.a_divider_inner}></div></div>
//                     <SimilarItems similarItems={similarItems} />
//                 </div> : <span>Loading...</span>
//             }
//         </>

//     </Layout>
// )
