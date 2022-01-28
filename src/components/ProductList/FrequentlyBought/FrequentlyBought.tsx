import { useEffect, useState, useContext } from 'react';
import styles from './frequently_bought.module.scss';
import Checkbox from '@material-ui/core/Checkbox';
import { Button, Grid, withStyles } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import axiosInstance from '../../../axios/axiosInstance';
import { useHistory } from 'react-router-dom';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CircularProgress from '@material-ui/core/CircularProgress';
import routes from '../../Helpers/Routes';
import { BsImage } from 'react-icons/bs';
import { formatAmountWithCurrency } from '../../../constants/helpers';
import { useData } from '../../../StateProvider/Provider';
import { alpha, makeStyles, styled } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  mainBox: {
    backgroundColor: '#F9F9F9'
  },
  addOnProducts: {
    display: 'grid',
    gridTemplateColumns: 'minmax(200px, 1fr) minmax(15px , 25px) minmax(200px, 1fr) minmax(15px , 25px) minmax(200px, 1fr) minmax(15px , 25px) minmax(250px, 350px)',
    justifyContent: 'center',
    backgroundColor: '#F9F9F9',
    padding: '20px 30px',
    gridRowGap: '20px',
    gridWrap: 'wrap',

    '@media screen and (max-width: 960px)': {
      gridTemplateColumns: 'minmax(180px, 1fr) minmax(15px , 20px) minmax(180px, 1fr) minmax(15px , 20px) minmax(180px, 1fr) minmax(15px , 20px) ',
      gridTemplateRow: '1fr 1fr',
      padding:"20px 10px",
    },
    // '@media screen and (max-width: 768px)': {
    //   gridTemplateColumns: 'repeat(2, minmax(200px, 1fr)) ',
    //   gridTemplateRow: '1fr 1fr'
    // }
  },
  gridLayout: {
    '@media screen and (max-width: 960px)': {
      gridColumn: '1/-1'
    },
    '@media screen and (max-width: 768px)': {
      gridColumn: '1/-1'
    }
  },

  logoAlign: {
    width: '100%',
    height: 'auto'
  },
  priceHeading: {
    paddingBottom: '10px',
    paddingLeft: '3px',
    color: 'grey'
  },
  addIcon: {
    backgroundColor: '#F9F9F9'
  },
  // imgLayout:{
  //   display:"grid",
  //   gridTemplateRows: 'minmax(100px , 200px)'
  // }
}));

function FrequentlyBought({ mainProductMrp, mainProductWithCurrency, id, orderType }) {
  const classes = useStyles();
  const {
    state: { user, cartItems }
  }: any = useData();
  const history = useHistory();
  const [count, setCount] = useState(0);
  // const [checkedItems, setCheckedItems] = useState([])
  const [totalPrice, setTotalPrice] = useState(0);
  const [frequentData, setFrequentData] = useState([]);
  const toastConfig = useContext(CustomToastContext);
  const [loading, setLoading] = useState(false);
  // const [items, setItems] = useState([]);

  useEffect(() => {
    if (id) fetchFrequentProducts();
  }, [id]);

  // const fetchCart = () => {
  //   setLoading(true)
  //   axiosInstance()
  //     .get(`/ecommerce/cart`).then(({ data: { data } }) => {
  //       let tempMappedQuantity = {}
  //       if (data && data.length) {
  //         data.forEach(o => {
  //           tempMappedQuantity[o.productId] = o.quantity
  //         })
  //       }

  //       let cartItems = frequentData.filter(o => (checkedItems.indexOf(o._id) >= 0)).map(o => {
  //         return {
  //           quantity: `${tempMappedQuantity[o._id] || 1}`,
  //           productId: o._id
  //         }
  //       })
  //       axiosInstance()
  //         .post(`/ecommerce/cart`, {
  //           products: [...cartItems]
  //         })
  //         .then(({ data }) => {
  //           setLoading(false)
  //           history.push(routes.eCommerce.path);
  //         }).catch((error) => {
  //           setLoading(false)
  //           toastConfig.setToastConfig(error);
  //         });
  //     })
  // }

  const fetchFrequentProducts = () => {
    axiosInstance()
      .get(`/e-product/frequent/${id}`)
      .then(({ data: { data } }) => {
        let fixedData = [
          ...data
            .filter((f) => f._id !== id)
            .slice(0, 3)
            .map((f) => {
              return {
                ...f,
                isAddedInCart: cartItems.some((s) => s.productDetail._id === f._id),
                isChecked: cartItems.some((s) => s.productDetail._id === f._id)
              };
            })
        ];
        setFrequentData([...fixedData]);

        // let tPrice = 0
        // if (fixedData && fixedData.length) {
        //   let items = fixedData.map(o => {
        //     tPrice = tPrice + parseInt(o?.mrp)
        //     return o._id
        //   })
        //   setTotalPrice(tPrice)
        //   setCheckedItems([...items])
        // }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const changeTotalPrice = (checkedItems) => {
    let tPrice = 0;
    frequentData.forEach((o) => {
      if (checkedItems.indexOf(o._id) >= 0) {
        tPrice = tPrice + parseInt(o?.mrp);
      }
      return o._id;
    });
    setTotalPrice(tPrice);
  };

  // const handleCheckedItems = (e, id) => {
  //   let items = [...checkedItems]
  //   if (e.target.checked) {
  //     items = [...items, id]
  //   }
  //   else {
  //     items.splice(items.indexOf(id), 1)
  //   }
  //   changeTotalPrice(items)
  //   setCheckedItems([...items])
  // }

  function countTrue4obj(obj) {
    let count = 0;
    for (var p in obj) {
      if (obj.hasOwnProperty(p) && obj[p] === true) {
        count++;
      }
    }
    return count;
  }
  

  const handleChange = (checked, index) => {
    let tempFrequentData = [...frequentData];
    tempFrequentData[index].isChecked = checked;
    setFrequentData([...tempFrequentData]);

    // items[index]['select'] = !items[index]['select'];

    // setItems([...items]);
    // let total = 0;
    // let cost = 0;
    // items.map((item) => {
    //   total = total + countTrue4obj(item);
    //   if (item.select == true) {
    //     cost = cost + item.itemPrice;
    //   }
    // });
    // setTotalPrice(cost);
    // setCount(total);
  };

  // const onAddSelectedToCart = () => {
  //   fetchCart()
  // }

  const RenderProductDetails = ({ index }) => {

    return frequentData[index] ? (
      <> 
        <Grid container className="d-flex justify-content-center align-item-center" style={{ backgroundColor: 'white' }}>
          {frequentData[index]?.productImage ? (
            
              <Grid xs={12}  className={` position-relative`}>
              <img
                src={frequentData[index]?.productImage}
                className={`${classes.logoAlign} cursor-pointer`}
                alt={frequentData[index]?.productName}
                style={{ objectFit: 'contain', height: '100%' }}
                onClick={() => {
                  history.push(`${routes.eCommerceDetail.path}/${frequentData[index]._id}/${orderType}`);
                }}
              />

              <Checkbox
                disabled={frequentData[index].isAddedInCart}
                style={{position:"absolute" , top: '0' , right:"0" }}
                color="primary"
                checked={frequentData[index].isChecked}
                onChange={(e) => {
                  handleChange(e.target.checked, index);
                }}
                inputProps={{ 'aria-label': 'primary checkbox' }}
              />
            
            </Grid>
          ) : (
            <BsImage
              className={`${styles.no_image} cursor-pointer`}
              onClick={() => {
                history.push(`${routes.eCommerceDetail.path}/${frequentData[index]._id}/${orderType}`);
              }}
            />
          )}
        </Grid>
        <h4 className="pt-3 pb-2 text-truncate px-2" style={{color:"var(--primary-light)", opacity:"0.8"}}>{frequentData[index]?.productName}</h4>

        <div className={`${styles.price} d-flex align-items-center px-2 pb-4`}>
          {frequentData[index] ? `${formatAmountWithCurrency(frequentData[index].currency, frequentData[index].mrp ?? 0)?.fullFormatAmount}` : ''}
        </div>
      </>
    ) : (
      <></>
    );
  };

  const getSelectedRecordsTotal = () => {
    return (
      frequentData
        .filter((f) => f.isChecked && f.mrp)
        .map((m) => Number(m.mrp))
        .reduce((a, b) => a + b, 0) ?? 0
    );
  };

  return (
    <>
      <div className="d-flex w-100 align-items-center px-4 my-3">
        <h2>Frequently bought together ({orderType})</h2>
      </div>

      <Grid className={classes.addOnProducts}>
        
          <Grid container className="d-flex justify-content-center align-item-center" style={{ backgroundColor: 'white' }}>
            
              <RenderProductDetails index={0} />

          </Grid>

          <Grid className={`${classes.addIcon} d-flex justify-content-center align-item-center`}>
              <h2 className='align-self-center'>+</h2>
            </Grid>


          <Grid container className="d-flex justify-content-center align-item-center" style={{ backgroundColor: 'white' }}>
          
            <RenderProductDetails index={1} />

          </Grid>

          <Grid className={`${classes.addIcon} d-flex justify-content-center align-item-center`}>
            <h2 className='align-self-center'>+</h2>
          </Grid>


          <Grid container className="d-flex justify-content-center align-item-center" style={{ backgroundColor: 'white' }}>

            <RenderProductDetails index={2} />

          </Grid>
 
          <Grid className={`${classes.addIcon} d-flex justify-content-center align-item-center`}>
            <h2 className='align-self-center'>=</h2>
          </Grid>
          


          <Grid
          style={{ backgroundColor: "white", padding: "20px 15px" }}
          className={`${classes.gridLayout}`}
        >
            <div className="p-3 d-flex flex-column gap-3">
              <h2>Price summary</h2>

              <hr />

              <div className="d-flex justify-content-space-between">
                <h3>Main Product</h3>
                <h3>{mainProductWithCurrency}</h3>
              </div>

              <div className="d-flex justify-content-space-between">
                <h3>{frequentData.filter((f) => f.isChecked).length} Addon selected</h3>

                <h3>
                  {
                    formatAmountWithCurrency(
                      frequentData.find((f) => f.hasOwnProperty('currency') && f.currency)?.currency,
                      getSelectedRecordsTotal()
                    )?.fullFormatAmount
                  }
                </h3>
              </div>

              <hr />

              <div className="d-flex justify-content-space-between">
                <h3>Total</h3>

                <h3>
                  {
                    formatAmountWithCurrency(
                      frequentData.find((f) => f.hasOwnProperty('currency') && f.currency)?.currency,
                      getSelectedRecordsTotal() + Number(mainProductMrp)
                    )?.fullFormatAmount
                  }
                </h3>
              </div>

              <hr />

              <div className="d-flex justify-content-space-between">
                <Button variant="contained" onClick={() => {}} fullWidth color="primary">
                  Add all to cart
                </Button>
              </div>
            </div>
          </Grid>
      </Grid>
    </>

    // <div className={styles.outerbox}>
    //   <div className={styles.set_width}>
    //     <h2 className="text-align-center" color="textSecondary">
    //       Frequently Bought Together
    //     </h2>
    //     <div className={styles.items_flex}>
    //       {
    //         frequentData && frequentData.length ?
    //           frequentData.map((o, i) => {
    //             return <>
    //               {
    //                 checkedItems.indexOf(o._id) >= 0 ?
    //                   <>
    //                     <div>
    //                       {' '}
    //                       <img src={o?.productImage} alt={o?.productName} className={styles.frequently_bought_together_products} />
    //                     </div>
    //                     {
    //                       i < checkedItems.length - 1 ?
    //                         <span className={styles.set_icon}>
    //                           <AddIcon />
    //                         </span> : null
    //                     }
    //                   </> : null
    //               }
    //             </>
    //           }) : null
    //       }
    //     </div>

    //     <div className={styles.total_price}>
    //       <h2>Total Price = &nbsp;</h2>
    //       <h3>${totalPrice}</h3>
    //     </div>
    //     <div className={styles.add_to_selected_card_button}>
    //       <Button variant="contained" color="primary"
    //         disabled={loading}
    //         onClick={onAddSelectedToCart} >
    //         {
    //           loading ? <CircularProgress /> : null
    //         } ADD SELECTED TO CART
    //       </Button>
    //       <div className={styles.contain_all_items}>
    //         {
    //           frequentData && frequentData.length ?
    //             frequentData.map((o, i) => {
    //               return <div className={styles.frequently_bought_products_primary}>
    //                 <Checkbox checked={checkedItems.indexOf(o._id) >= 0}
    //                   onChange={(e) => handleCheckedItems(e, o._id)}
    //                   inputProps={{ 'aria-label': 'disabled checked checkbox' }} size={'small'} className={styles.checkbox} />
    //                 <p>{o?.description} &nbsp;<span>${o?.mrp}</span></p>
    //               </div>
    //             }) : null
    //         }
    //       </div>
    //     </div>
    //   </div>

    //   <div className={styles.wrapper}>
    //     <div className={styles.card}>
    //       <div className={styles.card__checkbox}>
    //         <Checkbox color="primary" size="small" inputProps={{ 'aria-label': 'secondary checkbox' }} checked disabled />
    //       </div>
    //       <div className={styles.card__img}>
    //         <img alt="image" src={FracImage} className={styles.card__img} />
    //       </div>
    //       <div className={styles.card__body}>
    //         <p className={styles.card__desc}>Frac Tree, 7 1/16 Run, 3 1/16 wing, 10,000 psi, Temperature Class U, Material Class DD</p>
    //         <h2 className={styles.card__price}>Rs. 3000 /day</h2>
    //       </div>
    //     </div>

    //     {items.map((item, index) => (
    //       <div key={item.id} className={styles.card}>
    //         <div className={styles.card__checkbox}>
    //           <Checkbox
    //             color="primary"
    //             inputProps={{ 'aria-label': 'secondary checkbox' }}
    //             name="select"
    //             value={items[index].select}
    //             onChange={(e) => handleChange(e, index)}
    //           />
    //         </div>
    //         <img alt="image" src={FracImage} className={styles.card__img} />
    //         <div className={styles.card__body}>
    //           <p className={styles.card__desc}>{item.itemDesc}</p>
    //           <h2 className={styles.card__price}>Rs. {item.itemPrice} /day</h2>
    //         </div>
    //       </div>
    //     ))}

    //     <div className={styles.card}>
    //       <div className={styles.card__pricesummary}>
    //         <h3 className={styles.card__pricesummaryheading}>Price Summary</h3>
    //         <div className={styles.card__summary}>
    //           <p>Main Product Selected</p>
    //           <h3>Rs. 3000 /day</h3>
    //         </div>
    //         <div className={styles.card__summary}>
    //           <p>{count} Addon Selected</p>
    //           <h3>Rs. {totalPrice} /day</h3>
    //         </div>
    //         <div className={styles.card__total}>
    //           <h3>Total</h3>
    //           <h3>Rs. {totalPrice + 3000} /day</h3>
    //         </div>
    //         <Button variant="contained" color="primary">
    //           Rent All
    //         </Button>
    //       </div>
    //     </div>
    //   </div>
    // </div>
  );
}

export default FrequentlyBought;
