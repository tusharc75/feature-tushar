import React, { useEffect, useState } from "react";
import styles from "./frequently_bought.module.scss";
import Checkbox from "@material-ui/core/Checkbox";
// import ButtonDesign from "../../components/Buttondesign/Buttondesign";
import { Button, IconButton } from "@material-ui/core";
import ButtonDesign from "../Buttondesign/Buttondesign";

function FrequentlyBought() {
  const [count, setCount] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [items, setItems] = useState([
    {
      id: 1,
      select: false,
      itemDesc:
        "Frac Tree, 7 1/16 Run, 3 1/16 wing, 10,000 psi, Temperature ClassU, Material Class DD",
      itemPrice: 3000,
    },
    {
      id: 2,
      select: false,
      itemDesc:
        "Frac Tree, 7 1/16 Run, 3 1/16 wing, 10,000 psi, Temperature ClassU, Material Class DD",
      itemPrice: 3000,
    },
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
    items[index]["select"] = !items[index]["select"];

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
  const FracImage =
    "https://freepngimg.com/thumb/disney_pluto/32386-8-pluto-transparent.png";
  return (
    <div className={styles.outerbox}>
      <h1 className="text-align-center">Frequently Bought Together</h1>
      <div className={styles.wrapper}>
        <div className={styles.card}>
          <div className={styles.card__checkbox}>
            <Checkbox
              color="primary"
              size="small"
              inputProps={{ "aria-label": "secondary checkbox" }}
              checked
              disabled
            />
          </div>
          <div className={styles.card__img}>
            <img src={FracImage} className={styles.card__img} />
          </div>
          <div className={styles.card__body}>
            <p className={styles.card__desc}>
              Frac Tree, 7 1/16 Run, 3 1/16 wing, 10,000 psi, Temperature Class
              U, Material Class DD
            </p>
            <h2 className={styles.card__price}>Rs. 3000 /day</h2>
          </div>
        </div>
        {items.map((item, index) => (
          <div key={item.id} className={styles.card}>
            <div className={styles.card__checkbox}>
              <Checkbox
                color="primary"
                inputProps={{ "aria-label": "secondary checkbox" }}
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
