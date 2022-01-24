import { useEffect, useState, useContext } from 'react';
import styles from './bom.module.scss';
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
    gridTemplateColumns: 'repeat(3, minmax(200px, 1fr)) minmax(250px, 350px)',
    justifyContent: 'center',
    backgroundColor: '#F9F9F9',
    padding: '20px 30px',
    gridRowGap: '20px',
    gridWrap: 'wrap',

    '@media screen and (max-width: 960px)': {
      gridTemplateColumns: 'repeat(3, minmax(200px, 1fr)) ',
      gridTemplateRow: '1fr 1fr'
    },
    '@media screen and (max-width: 768px)': {
      gridTemplateColumns: 'repeat(2, minmax(200px, 1fr)) ',
      gridTemplateRow: '1fr 1fr'
    }
  },
  gridLayout: {
    '@media screen and (max-width: 960px)': {
      gridColumn: '1/-1'
    },
    '@media screen and (max-width: 768px)': {
      gridColumn: 'auto'
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
  imgLayout: {
    display: "grid",
    gridTemplateRows: 'minmax(100px , 200px)'
  }
}));

function ProductBOM({ bom }) {
  const classes = useStyles();
  const {
    state: { user, cartItems }
  }: any = useData();
  const history = useHistory();

  const RenderProductDetails = ({ index }) => {

    return bom[index] ? (
      <>
        <Grid container className="d-flex justify-content-center align-item-center" style={{ backgroundColor: 'white' }}>
          {bom[index]?.productDetail?.productImage ? (

            <Grid xs={12} className={`${classes.imgLayout} position-relative`}>
              <img
                src={bom[index]?.productDetail?.productImage}
                className={`${classes.logoAlign} cursor-pointer`}
                alt={bom[index]?.productDetail?.productName}
                style={{ objectFit: 'contain', height: '100%' }}
                onClick={() => {
                  history.push(`${routes.eCommerceDetail.path}/${bom[index]._id}`);
                }}
              />

            </Grid>
          ) : (
            <BsImage
              className={`${styles.no_image} cursor-pointer`}
              onClick={() => {
                history.push(`${routes.eCommerceDetail.path}/${bom[index]._id}`);
              }}
            />
          )}
        </Grid>
        <h4 className="pt-3 pb-2 text-truncate px-2" style={{ color: "var(--primary-light)", opacity: "0.8" }}>{bom[index]?.productDetail?.productName}</h4>
      </>
    ) : (
      <></>
    );
  };

  return (
    <>
      <div className="d-flex w-100 align-items-center px-4 my-3">
        <h2>Bill Of Material</h2>
      </div>

      <Grid className={classes.addOnProducts}>
        {
          bom.map((_, index) => (
            <Grid key={index} container>
              <Grid item xs={12}>
                <RenderProductDetails index={index} />
              </Grid>
            </Grid>
          ))
        }


        {/* <Grid container className="d-flex justify-content-center align-item-center" style={{ backgroundColor: 'white' }}>
          <Grid item xs={11}>
            <RenderProductDetails index={1} />
          </Grid>

          <Grid item xs={1} className={`${classes.addIcon} d-flex justify-content-center align-item-center`}>
            <h2 className='align-self-center'>+</h2>
          </Grid>
        </Grid>


        <Grid container className="d-flex justify-content-center align-item-center" style={{ backgroundColor: 'white' }}>
          <Grid item xs={11}>
            <RenderProductDetails index={2} />
          </Grid>
          <Grid item xs={1} className={`${classes.addIcon} d-flex justify-content-center align-item-center`}>
            <h2 className='align-self-center'>=</h2>
          </Grid>

        </Grid> */}

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

export default ProductBOM;
