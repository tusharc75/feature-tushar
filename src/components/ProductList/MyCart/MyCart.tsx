import React, { useContext, useEffect, useState } from "react";
import Layout from "../../Layout";
import styles from "./my-cart.module.scss";
import SecureIcon from "@material-ui/icons/VerifiedUserOutlined";
import ManageQuoteDialog from "../../../pages/QuoteBuilderCombined/ManageQuote/ManageQuoteDialog";
import AddCircleOutlineIcon from "@material-ui/icons/AddCircleOutline";
import RemoveCircleOutlineIcon from "@material-ui/icons/RemoveCircleOutline";
import { Button, IconButton, Box, Grid } from "@material-ui/core";
import ButtonDesign from "../Buttondesign/Buttondesign";
import Product from "../ProductCard/ProductCard";
import { product } from "../../../constants/helpers";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../../axios/axiosInstance";
import { useData } from "../../../StateProvider/Provider";
import routes from "../../../components/Helpers/Routes";
import { useHistory } from "react-router-dom";

function MyCart() {
  const [products, setProducts] = useState([]);

  const toastConfig = useContext(CustomToastContext);

  useEffect(() => {
    fetchCart()
  }, []);

  const { state: { user } }: any = useData();
  const history = useHistory();
  const [items, setItems] = useState([
    {
      id: 1,
      itemDesc:
        "Cactus Wellhead, Frac Tree, 7 1/16 Run, 3 1/16 wing,  10,000 psi, Temperature Class U, Material Class DD",
      itemSeller: "Cactus Wellhead",
      itemPrice: 5000,
      itemCount: 1,
    },
    {
      id: 2,
      itemDesc:
        "Cactus Wellhead, Frac Tree, 7 1/16 Run, 3 1/16 wing,  10,000 psi, Temperature Class U, Material Class DD",
      itemSeller: "Cactus Wellhead",
      itemPrice: 5000,
      itemCount: 1,
    },
    {
      id: 3,
      itemDesc:
        "Cactus Wellhead, Frac Tree, 7 1/16 Run, 3 1/16 wing,  10,000 psi, Temperature Class U, Material Class DD",
      itemSeller: "Cactus Wellhead",
      itemPrice: 5000,
      itemCount: 1,
    },
  ]);
  const [totalCount, setTotalCount] = useState(items.length);
  const [checkoutLabel, setCheckoutLabel] = useState("Checkout")
  const [totalPrice, setTotalPrice] = useState(15000);
  const [showCreateQuoteDialog, setshowCreateQuoteDialog] = useState(false);
  const [addedCartItems, setAddedCartItems] = useState([])

  function handleDecrease(event, index) {
    if (items[index].itemCount > 0)
      items[index].itemCount = items[index].itemCount - 1;
    setItems([...items]);

    let count = 0, price = 0;

    items.map((item) => {
      count = count + item.itemCount;
      price = price + item.itemCount * item.itemPrice;
    });

    setTotalCount(count);
    setTotalPrice(price);
  }

  function handleIncrease(event, index) {
    items[index].itemCount = items[index].itemCount + 1;
    setItems([...items]);
    let count = 0,
      price = 0;
    items.map((item) => {
      count = count + item.itemCount;
      price = price + item.itemCount * item.itemPrice;
    });

    setTotalCount(count);
    setTotalPrice(price);
  }
  const FracImage =
    "https://freepngimg.com/thumb/disney_pluto/32386-8-pluto-transparent.png";

  const onAddToCartItem = (item, data) => {
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

  const fetchCart = () => {
    axiosInstance()
      .get(`/user/cart`).then(({ data: { data } }) => {

        if (data) {
          setAddedCartItems(data)
        }
        if (data && data.length >= 4) {
          setCheckoutLabel("Create Quote")
        }
      })
  }

  const onCheckout = () => {
    if (checkoutLabel === "Create Quote" && addedCartItems.length >= 1) {
      setshowCreateQuoteDialog(true)
    }
  }

  const onSuccess = () => {
    setshowCreateQuoteDialog(false)
  }

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
        <div className={styles.wrapper}>
          <div>
            {items.map((item, index) => (
              <div key={item.id} className={styles.checkout_items}>
                <div className={styles.card}>
                  <img className={styles.card_img} src={FracImage} />

                  <div className={styles.card_body}>
                    <div className={styles.card_desc}>{item.itemDesc}</div>
                    <div className={styles.card_seller}>
                      Seller: {item.itemSeller}
                    </div>
                    <div className={styles.card_price}>
                      Rs. {item.itemPrice}
                    </div>
                    <div className={styles.card_controls}>
                      <IconButton onClick={(e) => handleDecrease(e, index)}>
                        <RemoveCircleOutlineIcon />
                      </IconButton>{" "}
                      {item.itemCount}{" "}
                      <IconButton onClick={(e) => handleIncrease(e, index)}>
                        <AddCircleOutlineIcon />
                      </IconButton>
                    </div>
                    <Button>REMOVE</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.price_card}>
            <div className={styles.price_card_price_summary}>
              <h3 className={styles.price_card_price_summary_heading}>
                Price Summary
              </h3>
              <div className={styles.price_card_summary}>
                <p>Price ({totalCount} items) </p>
                <h3 className={styles.price_card_price}>Rs. {totalPrice}</h3>
              </div>
              <div className={styles.price_card_summary}>
                <p>
                  Pickup{" "}
                  <span className={styles.price_card_details}>
                    (<Button size="small">Details</Button>)
                  </span>
                </p>
              </div>
              <div className={styles.price_card_total}>
                <h3>Total Amount</h3>
                <h3 className={styles.price_card_price}>Rs. {totalPrice}</h3>
              </div>
            </div>
            {/* <div className={styles.price_card_secure_text}>
              <SecureIcon />
              <h3>Safe and Secure Payments.100% Authentic products.</h3>
            </div> */}
            <div className={styles.price_card_checkout_button}>
              <Button variant="contained" color="secondary" onClick={onCheckout}>
                {checkoutLabel}
              </Button>
            </div>
          </div>
        </div>
        <div className={styles.sponsored_items}>
          <h2>Sponsored Products Related To This Item </h2>
          <div className={`gap-3 ${styles.sponsored_items_list}`}>
            {products.map((product, index: number) => (
              <>
                < Product key={index} product={product}
                  onAddItem={onAddToCartItem}
                />
              </>
            ))}
          </div>
        </div>
      </Box>
    </Layout>
  );
}

export default MyCart;