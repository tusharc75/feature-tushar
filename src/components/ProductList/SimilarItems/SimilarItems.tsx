import React from 'react';
import { Rating } from '@material-ui/lab';
import styles from './similar-items.module.scss';
import { BsImage } from 'react-icons/bs';
import { Grid, Paper } from '@material-ui/core';
import { useHistory } from 'react-router-dom'
import routes from '../../Helpers/Routes';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import { useData } from '../../../StateProvider/Provider';
import { formatAmountWithCurrency } from '../../../constants/helpers';

const useStyles = makeStyles({
  table: {
    minWidth: 650,
  },
  firstContentBox:{
    display:"grid",
    gridTemplateColumns:"minmax(130px , 180px)  repeat(4 , minmax(170px , 1fr)) ",
    "& .MuiTableCell-root":{
      padding:"12px 16px"
    },
    
  },
  nextContentBox:{
       backgroundColor:"#EFEFEF",
       marginBottom:"3px"

  },
  vendorName:{
       color:"rgba(22 , 51 , 64 , 0.8)",
       fontWeight:"bold"
  },
  ratingContentBox:{
    display:"grid",
    gridTemplateColumns:"minmax(130px , 180px)  repeat(4 , minmax(170px , 1fr)) ",
    "& .MuiTableCell-root":{
      padding:"2px 16px"
    },
  },
  textAlignRating:{
    color:"var(--primary-light)",
    fontWeight:600,
    padding:"12px 16px !important"
  },
  "@media screen and (max-width: 960px)":{
    firstContentBox:{
      gridTemplateColumns:"minmax(100px , 150px)  repeat(3 , minmax(170px , 1fr)) ",
    },
    
    ratingContentBox:{
      gridTemplateColumns:"minmax(100px , 150px)  repeat(3 , minmax(170px , 1fr)) ",
    },
   
  }
});

export default function SimilarItems({ similarItems, orderType }) {

  const { state: { user } }: any = useData();
  const classes = useStyles();
  const history = useHistory();

  const RenderProductDetails = ({ index }) => {
    return similarItems[index] ? <>
      <div className="text-center cursor-pointer" style={{ height: 150 }} onClick={() => {
        history.push(`${routes.eCommerceDetail.path}/${similarItems[index]._id}/${orderType}`)
      }}>
        {
          similarItems[index]?.productImage ? (
            <img src={similarItems[index]?.productImage} alt={similarItems[index]?.productName} style={{ objectFit: "contain", height: "100%" }} />
          ) : (
            <BsImage className={styles.no_image} />
          )
        }
      </div>
      <h3 className="my-3 text-center text-truncate">{similarItems[index]?.productName}</h3>
    </> : <></>
  }

  const RenderRating = ({ rating, reviews , ratingNum }) => {
    return <div className='text-align-center'>
      <div className="d-flex align-items-center justify-content-center">
      <Rating name="size-small" value={rating || 5} readOnly size="small" /> 
      <span className={`${styles.ratingNumber} pl-2`}>{ratingNum || "5.0"}</span> 
      </div>
      <span className={`${styles.reviews_text} ml-2 mt-1`}>{`${reviews || 134} Reviews `}</span>
    </div>
  }

  const RenderData = ({ text }) => {
    return <div className="d-flex align-items-center justify-content-center" >
      {text}
    </div>
  }

  const RenderPrice = ({ index }) => {
    return similarItems[index] ? <div className={`${styles.price} d-flex align-items-center justify-content-center`}>
      {
        similarItems[index] ? `${formatAmountWithCurrency(similarItems[index].currency, similarItems[index].mrp ?? 0)?.fullFormatAmount}` : ""
      }
    </div> : <></>
  }

  return (
    <>
      <div className="d-flex w-100 align-items-center my-3">
        <h2>Compare with similar items</h2>
      </div>

      <TableContainer component={Paper}>
        <Table className={classes.table} aria-label="simple table">

          <TableBody >

            <TableRow className={classes.firstContentBox}>

              <TableCell height={250}  component="th" scope="row">

              </TableCell>
              <TableCell >
                <RenderProductDetails index={0} />
              </TableCell>
              <TableCell >
                <RenderProductDetails index={1} />
              </TableCell>
              <TableCell >
                <RenderProductDetails index={2} />
              </TableCell>
              <TableCell className={styles.hidden_content}>
                <RenderProductDetails index={3} />
              </TableCell>

            </TableRow>

            <TableRow className={`${classes.ratingContentBox} ${classes.nextContentBox}`}>

              <TableCell component="th" scope="row" className={classes.textAlignRating }>
                <RenderData text="Rating" />
              </TableCell>
              <TableCell component="th" scope="row">
                <RenderRating rating={4.5} reviews={34} ratingNum={"4.5"}/>
              </TableCell>
              <TableCell component="th" scope="row">
                <RenderRating rating={4} reviews={234} ratingNum={"4.0"}/>
              </TableCell>
              <TableCell component="th" scope="row">
                <RenderRating rating={3.5} reviews={134} ratingNum={"3.5"}/>
              </TableCell>
              <TableCell component="th" scope="row" className={styles.hidden_content}>
                <RenderRating rating={3} reviews={334} ratingNum={"3.0"}/>
              </TableCell>

            </TableRow>

            <TableRow className={`${classes.firstContentBox} ${classes.nextContentBox}`} >

              <TableCell component="th" scope="row" style={{color:"var(--primary-light)" , fontWeight:600 }}>
                <RenderData text="Vendor" />
              </TableCell>
              <TableCell component="th" scope="row" className={classes.vendorName}>
                <RenderData text={user?.user?.brandName} />
              </TableCell>
              <TableCell component="th" scope="row" className={classes.vendorName}>
                <RenderData text={user?.user?.brandName} />
              </TableCell>
              <TableCell component="th" scope="row" className={classes.vendorName}>
                <RenderData text={user?.user?.brandName} />
              </TableCell>
              <TableCell component="th" scope="row" className={`${classes.vendorName} ${styles.hidden_content}`}>
                <RenderData text={user?.user?.brandName} />
              </TableCell>

            </TableRow>

            <TableRow className={`${classes.firstContentBox} ${classes.nextContentBox}`}>

              <TableCell component="th" scope="row" style={{color:"var(--primary-light)" , fontWeight:600 }}>
                <RenderData text="Price" />
              </TableCell>
              <TableCell component="th" scope="row">
                <RenderPrice index={0} />
              </TableCell>
              <TableCell component="th" scope="row">
                <RenderPrice index={1} />
              </TableCell>
              <TableCell component="th" scope="row">
                <RenderPrice index={2} />
              </TableCell>
              <TableCell component="th" scope="row" className={styles.hidden_content}>
                <RenderPrice index={3} />
              </TableCell>

            </TableRow>

          </TableBody>
        </Table>
      </TableContainer>





      {/* <Grid container>

        {
          similarItems.slice(0, 4).map((product, index: number) => (
            <Grid key={index} item xs={3} className="d-flex flex-column cursor-pointer" onClick={() => {
              history.push(`${routes.eCommerceDetail.path}/${product._id}/${orderType}`)
            }}>

              <div style={{ height: 300 }} className="d-flex justify-content-center">
                {product.productImage ? (
                  <img src={product.productImage} alt={product.productName} style={{ objectFit: "contain", height: "100%" }} />
                ) : (
                  <BsImage className={styles.no_image} />
                )}
              </div>

              <div className="d-flex justify-content-center">

                <div className={styles.item_details}>
                  <div className="product_name_link p-2">
                    <strong>{product.productName}, </strong>
                    <span>{product?.productCategory?.optionLabel}, </span>
                    <span>{product.description}</span>
                  </div>
                  <span className="d-flex pl-2 align-items-center">
                    <span className={styles.price}>
                      {product.currency} {product.mrp}
                    </span>
                  </span>
                  <span className={`${styles.item_alt} pl-2 d-flex justify-content-center flex-column `}>
                    <div className="d-flex align-items-center">
                      <Rating name="size-small" value={product.rating || 5} readOnly size="small" /> <span className="ml-2 mt-1">({product.reviews || 134})</span>
                    </div>
                  </span>

                </div>

              </div>

            </Grid>

          ))
        }

      </Grid> */}

    </>
  );
}
