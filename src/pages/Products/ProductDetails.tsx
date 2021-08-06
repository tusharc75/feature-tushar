import React, { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../axios/axiosInstance";
import Layout from "../../components/Layout";
import { formatAmountWithCurrency, product } from "../../constants/helpers";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { Rating } from "@material-ui/lab";
import styles from "./product-detail-page.module.scss";
import { Button, Box, Grid } from "@material-ui/core";
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

export default function ProductDetails() {
  const [productDetails, setProductDetails] = useState(null);
  const [similarItems, setSimilarItems] = useState([]);
  const [showCreateQuoteDialog, setshowCreateQuoteDialog] = useState(false);
  const [checkoutLabel, setCheckoutLabel] = useState("Checkout")
  const [addedCartItems, setAddedCartItems] = useState([])
  const [products, setProducts] = useState([]);
  const toastConfig = useContext(CustomToastContext);
  const { state: { user } }: any = useData();
  const history = useHistory();
  let { id } = useParams();

  useEffect(() => {
    fetchCart()
    fetchProducts()
  }, []);

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
          setAddedCartItems(data)
        }
        if (data && data.length >= 1) {
          setCheckoutLabel("Create Quote")
        }
      })
  }

  const onCheckout = () => {
    if (checkoutLabel === "Create Quote" && addedCartItems.length >= 1) {
      console.log('Yes checkout ')
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
        setProductDetails(data.productData);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, []);

  useEffect(() => {
    if (productDetails) {
      axiosInstance()
        .get(
          `${product.api}?filterById=[{"field":"productCategory", "term": "${productDetails.productCategory}"}]&limit=3`
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
    <Layout>
      <Grid container className="headerbox">

      </Grid>
      <Box className="detail-container">
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
                <Box display="flex" justifyContent="center" alignItems="center">
                  {productDetails.productImage ? (
                    <img
                      src={productDetails.productImage}
                      alt={productDetails.productName}
                      width="100%"
                    />
                  ) : (
                    <BsImage className={styles.product_no_image} />
                  )}
                </Box>
              </div>
              <div className={styles.product_details}>
                <header>
                  <h1 className={styles.title}>{productDetails.productName}</h1>
                  <span className={styles.avaibility}>
                    {productDetails?.qty > 0 ? "In Stock" : "Out of Stock"}
                  </span>
                  <div className={styles.price}>
                    <span className={styles.current}>
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
                    <span className={styles.before}>
                      {
                        formatAmountWithCurrency(
                          productDetails.currency,
                          productDetails.mrp
                        ).fullFormatAmount
                      }
                    </span>
                  </div>
                  <div className={styles.rate}>
                    <Rating
                      name="half-rating-read"
                      defaultValue={2.5}
                      precision={0.5}
                      value={productDetails.rating}
                      readOnly
                      size="small"
                    />
                  </div>
                </header>
                <article>
                  <h5>Description</h5>
                  <p>{productDetails?.description}</p>
                </article>
                <div className={styles.controls}>
                  <div>
                    <h5>MFG</h5>
                    <a className="option">(UK 8)</a>
                  </div>
                  <div>
                    <h5>Product Number</h5>
                    <a className="option">(1)</a>
                  </div>
                  <div>
                    <h5>Mesuring Unit</h5>
                    <a className="option">(1)</a>
                  </div>
                </div>
                <div className="footer">
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    className="mr-2"

                    startIcon={<AddShoppingCartIcon />}
                    onClick={() => onAddToCartItem(productDetails)}
                  >
                    Add to cart
                  </Button>

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
                    className="mr-2"
                  >
                    Add to Configure
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    size="small"
                    className="mr-2"
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
          <FrequentlyBought />
          <div className="a_divider_inner"></div>
          <SimilarItems similarItems={similarItems} />
          <div className="a_divider_inner"></div>
          <RatingAndReviewChart />
        </div>

      </Box>
    </Layout>
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
