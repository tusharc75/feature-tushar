import React, { useEffect, useState } from "react";
import styles from "./frequently_bought.module.scss";
import Checkbox from "@material-ui/core/Checkbox";
// import ButtonDesign from "../../components/Buttondesign/Buttondesign";
import { IconButton } from "@material-ui/core";
import ButtonDesign from "../Buttondesign/Buttondesign";

function FrequentlyBought() {
  const [selected, setSelected] = useState({
    item1: false,
    item2: false,
  });

  function countTrue4obj(obj) {
    var count = 0;
    for (var p in obj) {
      if (obj.hasOwnProperty(p) && obj[p] === true) {
        count++;
      }
    }
    return count;
  }

  const handleChange = (event) => {
    selected[event.target.name] = !selected[event.target.name];
    setSelected({ ...selected });
  };

  const FracImage = "https://freepngimg.com/thumb/disney_pluto/32386-8-pluto-transparent.png";
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
            <h2 className={styles.card__price}>$2,099.00</h2>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.card__checkbox}>
            <Checkbox
             size="small"
              color="primary"
              inputProps={{ "aria-label": "secondary checkbox" }}
              name="item1"
              value={selected.item1}
              onChange={handleChange}
            />
          </div>
          <img src={FracImage} className={styles.card__img} />
          <div className={styles.card__body}>
            <p className={styles.card__desc}>
              Frac Tree, 7 1/16 Run, 3 1/16 wing, 10,000 psi, Temperature Class
              U, Material Class DD
            </p>
            <h2 className={styles.card__price}>$2,099.00</h2>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.card__checkbox}>
            <Checkbox
              size="small"
              color="primary"
              inputProps={{ "aria-label": "secondary checkbox" }}
              name="item2"
              value={selected.item2}
              onChange={handleChange}
            />
          </div>
          <img src={FracImage} className={styles.card__img} />
          <div className={styles.card__body}>
            <p className={styles.card__desc}>
              Frac Tree, 7 1/16 Run, 3 1/16 wing, 10,000 psi, Temperature Class
              U, Material Class DD
            </p>
            <h2 className={styles.card__price}>$2,099.00</h2>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.card__pricesummary}>
            <h3 className={styles.card__pricesummaryheading}>Price Summary</h3>
            <hr />
            <div className={styles.card__summary}>
              <p>Main Product Selected</p>
              <h3>$2,099.00 / day</h3>
            </div>
            <div className={styles.card__summary}>
              <p>{countTrue4obj(selected)} Addon Selected</p>
              <h3>$3,848.00 / day</h3>
            </div>
            <hr />
            <div className={styles.card__total}>
              <h3>Total</h3>
              <h3>$5947.00 / day</h3>
            </div>
            <ButtonDesign description="Rent All" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default FrequentlyBought;
