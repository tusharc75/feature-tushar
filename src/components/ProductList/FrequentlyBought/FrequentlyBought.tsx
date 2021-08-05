import React, { useEffect, useState } from 'react';
import styles from './frequently_bought.module.scss';
import Checkbox from '@material-ui/core/Checkbox';
// import ButtonDesign from "../../components/Buttondesign/Buttondesign";
import { Button, IconButton } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import iphone12 from '../../../assets/iphone-12.jpeg';
import ipadPro from '../../../assets/ipad-pro.jpg';
import AppleWatch from '../../../assets/Apple-watch.jpeg';

function FrequentlyBought() {
  const [count, setCount] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
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
  const FracImage = 'https://freepngimg.com/thumb/disney_pluto/32386-8-pluto-transparent.png';
  return (
    <div className={styles.outerbox}>
      <div className={styles.set_width}>
        <h2 className="text-align-center" color="textSecondary">
          Frequently Bought Together
        </h2>
        <div className={styles.items_flex}>
          <div>
            {' '}
            <img src={ipadPro} className={styles.frequently_bought_together_products}></img>
          </div>
          <span className={styles.set_icon}>
            <AddIcon />
          </span>
          <div>
            {' '}
            <img src={iphone12} className={styles.frequently_bought_together_products}></img>{' '}
          </div>
          <span className={styles.set_icon}>
            <AddIcon />
          </span>
          <div>
            <img src={AppleWatch} className={styles.frequently_bought_together_products}></img>
          </div>
        </div>
        <div className={styles.total_price}>
          <h2>Total Price = &nbsp;</h2>
          <h3>$2,799.00</h3>
        </div>
        <div className={styles.add_to_selected_card_button}>
          <Button variant="contained" color="primary">
            ADD SELECTED TO CART
          </Button>
          <div className={styles.contain_all_items}>
            <div className={styles.frequently_bought_products_primary}>
              <Checkbox disabled checked inputProps={{ 'aria-label': 'disabled checked checkbox' }} size={'small'} className={styles.checkbox} />
              <p>This items: iPad pro 256Gb &nbsp;<span>$599.00</span></p>
            </div>
            <div className={styles.frequently_bought_products_secondary}>
              <Checkbox defaultChecked size="small" inputProps={{ 'aria-label': 'checkbox with small size' }}  className={styles.checkbox}/> 
              <h5>Apple iphone 12 purple 128Gb 4GB A!4 Boinic chip 5nm &nbsp;<span>$799.00</span></h5>
            </div>
            <div className={styles.frequently_bought_products_secondary}>
              <Checkbox defaultChecked size="small" inputProps={{ 'aria-label': 'checkbox with small size' }}  className={styles.checkbox}/> 
              <h5>Apple watch series 6 44mm nike addition &nbsp;<span>$399.00</span></h5>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.wrapper}>
        <div className={styles.card}>
          <div className={styles.card__checkbox}>
            <Checkbox color="primary" size="small" inputProps={{ 'aria-label': 'secondary checkbox' }} checked disabled />
          </div>
          <div className={styles.card__img}>
            <img src={FracImage} className={styles.card__img} />
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
            <img src={FracImage} className={styles.card__img} />
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
