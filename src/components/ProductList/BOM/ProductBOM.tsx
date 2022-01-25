import styles from './bom.module.scss';
import { Grid } from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import routes from '../../Helpers/Routes';
import { BsImage } from 'react-icons/bs';
import { useData } from '../../../StateProvider/Provider';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(() => ({
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

function ProductBOM({ bom, orderType }) {
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
                  history.push(`${routes.eCommerceDetail.path}/${bom[index]?.productDetail?._id}/${orderType}`);
                }}
              />

            </Grid>
          ) : (
            <BsImage
              className={`${styles.no_image} cursor-pointer`}
              onClick={() => {
                history.push(`${routes.eCommerceDetail.path}/${bom[index]?.productDetail?._id}/${orderType}`);
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

      </Grid>
    </>

  );
}

export default ProductBOM;
