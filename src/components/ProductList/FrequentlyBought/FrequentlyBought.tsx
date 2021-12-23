import { useEffect, useState, useContext } from 'react';
import styles from './frequently_bought.module.scss';
import Checkbox from '@material-ui/core/Checkbox';
import { Button } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import axiosInstance from '../../../axios/axiosInstance';
import { useHistory } from 'react-router-dom';
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import CircularProgress from "@material-ui/core/CircularProgress"
import routes from '../../Helpers/Routes';

function FrequentlyBought({ id }) {
  const history = useHistory();
  const [count, setCount] = useState(0);
  const [checkedItems, setCheckedItems] = useState([])
  const [totalPrice, setTotalPrice] = useState(0);
  const [frequentData, setFrequentData] = useState([]);
  const toastConfig = useContext(CustomToastContext);
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState([
    {
      id: 1,
      select: false,
      itemDesc: 'Frac Tree, 7 1/16 Run, 3 1/16 wing, 10,000 psi, Temperature ClassU, Material Class DD',
      itemPrice: 3000
    },
    {
      id: 2,
      select: false,
      itemDesc: 'Frac Tree, 7 1/16 Run, 3 1/16 wing, 10,000 psi, Temperature ClassU, Material Class DD',
      itemPrice: 3000
    }
  ]);

  useEffect(() => {
    if (id) fetchFrequentProducts()
  }, [id])

  const fetchCart = () => {
    setLoading(true)
    axiosInstance()
      .get(`/user/cart`).then(({ data: { data } }) => {
        let tempMappedQuantity = {}
        if (data && data.length) {
          data.forEach(o => {
            tempMappedQuantity[o.productId] = o.quantity
          })
        }

        let cartItems = frequentData.filter(o => (checkedItems.indexOf(o._id) >= 0)).map(o => {
          return {
            quantity: `${tempMappedQuantity[o._id] || 1}`,
            productId: o._id
          }
        })
        axiosInstance()
          .post(`/user/cart`, {
            products: [...cartItems]
          })
          .then(({ data }) => {
            setLoading(false)
            history.push(routes.eCommerce.path);
          }).catch((error) => {
            setLoading(false)
            toastConfig.setToastConfig(error);
          });
      })
  }

  const fetchFrequentProducts = () => {
    axiosInstance()
      .get(`product/customer/frequent/${id}`)
      .then(({ data: { data } }) => {
        setFrequentData([...data])
        let tPrice = 0
        if (data && data.length) {
          let items = data.map(o => {
            tPrice = tPrice + parseInt(o?.mrp)
            return o._id
          })
          setTotalPrice(tPrice)
          setCheckedItems([...items])
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }

  const changeTotalPrice = (checkedItems) => {
    let tPrice = 0
    frequentData.forEach(o => {
      if (checkedItems.indexOf(o._id) >= 0) {
        tPrice = tPrice + parseInt(o?.mrp)
      }
      return o._id
    })
    setTotalPrice(tPrice)
  }

  const handleCheckedItems = (e, id) => {
    let items = [...checkedItems]
    if (e.target.checked) {
      items = [...items, id]
    }
    else {
      items.splice(items.indexOf(id), 1)
    }
    changeTotalPrice(items)
    setCheckedItems([...items])
  }
  function countTrue4obj(obj) {
    let count = 0;
    for (var p in obj) {
      if (obj.hasOwnProperty(p) && obj[p] === true) {
        count++;
      }
    }
    return count;
  }

  const handleChange = (event, index) => {
    items[index]['select'] = !items[index]['select'];

    setItems([...items]);
    let total = 0;
    let cost = 0;
    items.map((item) => {
      total = total + countTrue4obj(item);
      if (item.select == true) {
        cost = cost + item.itemPrice;
      }
    });
    setTotalPrice(cost);
    setCount(total);
  };

  const onAddSelectedToCart = () => {
    fetchCart()
  }
  const FracImage = 'https://freepngimg.com/thumb/disney_pluto/32386-8-pluto-transparent.png';

  return (
    <div className={styles.outerbox}>
      <div className={styles.set_width}>
        <h2 className="text-align-center" color="textSecondary">
          Frequently Bought Together
        </h2>
        <div className={styles.items_flex}>
          {
            frequentData && frequentData.length ?
              frequentData.map((o, i) => {
                return <>
                  {
                    checkedItems.indexOf(o._id) >= 0 ?
                      <>
                        <div>
                          {' '}
                          <img src={o?.productImage} alt={o?.productName} className={styles.frequently_bought_together_products} />
                        </div>
                        {
                          i < checkedItems.length - 1 ?
                            <span className={styles.set_icon}>
                              <AddIcon />
                            </span> : null
                        }
                      </> : null
                  }
                </>
              }) : null
          }
        </div>

        <div className={styles.total_price}>
          <h2>Total Price = &nbsp;</h2>
          <h3>${totalPrice}</h3>
        </div>
        <div className={styles.add_to_selected_card_button}>
          <Button variant="contained" color="primary"
            disabled={loading}
            onClick={onAddSelectedToCart} >
            {
              loading ? <CircularProgress /> : null
            } ADD SELECTED TO CART
          </Button>
          <div className={styles.contain_all_items}>
            {
              frequentData && frequentData.length ?
                frequentData.map((o, i) => {
                  return <div className={styles.frequently_bought_products_primary}>
                    <Checkbox checked={checkedItems.indexOf(o._id) >= 0}
                      onChange={(e) => handleCheckedItems(e, o._id)}
                      inputProps={{ 'aria-label': 'disabled checked checkbox' }} size={'small'} className={styles.checkbox} />
                    <p>{o?.description} &nbsp;<span>${o?.mrp}</span></p>
                  </div>
                }) : null
            }
          </div>
        </div>
      </div>


      <div className={styles.wrapper}>
        <div className={styles.card}>
          <div className={styles.card__checkbox}>
            <Checkbox color="primary" size="small" inputProps={{ 'aria-label': 'secondary checkbox' }} checked disabled />
          </div>
          <div className={styles.card__img}>
            <img alt="image" src={FracImage} className={styles.card__img} />
          </div>
          <div className={styles.card__body}>
            <p className={styles.card__desc}>Frac Tree, 7 1/16 Run, 3 1/16 wing, 10,000 psi, Temperature Class U, Material Class DD</p>
            <h2 className={styles.card__price}>Rs. 3000 /day</h2>
          </div>
        </div>

        {items.map((item, index) => (
          <div key={item.id} className={styles.card}>
            <div className={styles.card__checkbox}>
              <Checkbox
                color="primary"
                inputProps={{ 'aria-label': 'secondary checkbox' }}
                name="select"
                value={items[index].select}
                onChange={(e) => handleChange(e, index)}
              />
            </div>
            <img alt="image" src={FracImage} className={styles.card__img} />
            <div className={styles.card__body}>
              <p className={styles.card__desc}>{item.itemDesc}</p>
              <h2 className={styles.card__price}>Rs. {item.itemPrice} /day</h2>
            </div>
          </div>
        ))}

        <div className={styles.card}>
          <div className={styles.card__pricesummary}>
            <h3 className={styles.card__pricesummaryheading}>Price Summary</h3>
            <div className={styles.card__summary}>
              <p>Main Product Selected</p>
              <h3>Rs. 3000 /day</h3>
            </div>
            <div className={styles.card__summary}>
              <p>{count} Addon Selected</p>
              <h3>Rs. {totalPrice} /day</h3>
            </div>
            <div className={styles.card__total}>
              <h3>Total</h3>
              <h3>Rs. {totalPrice + 3000} /day</h3>
            </div>
            <Button variant="contained" color="primary">
              Rent All
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FrequentlyBought;
