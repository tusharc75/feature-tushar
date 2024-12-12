import { Badge, Box, Button, Grid, IconButton, TextField } from '@material-ui/core';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import CropFreeIcon from '@material-ui/icons/CropFree';
import ShoppingCartIcon from '@material-ui/icons/ShoppingCart';
import { Autocomplete } from '@material-ui/lab';
import { camelCase } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { MdBorderAll, MdList } from 'react-icons/md';
import axiosInstance from 'src/axios/axiosInstance';
import SearchBox from 'src/components/Helpers/SearchBox';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import CustomContainer from '../../components/CustomContainer';
import styles2 from '../Leads/Header.module.scss';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import Cart from './Cart';
import ProductCard from './Product/Card';
import ProductGrid from './Product/Grid';
import QuantityDialog from './QuantityDialog';
import Scan from './Scan';
import { sidebarResource } from 'src/constants/helpers';

const Pos = () => {
  const renderedFrom = camelCase(sidebarResource?.pos);

  const toastConfig = useContext(CustomToastContext);
  const [searchVal, setSearchVal] = useState('');
  const [plantOptions, setPlantOptions] = useState([]);
  const [plantId, setPlantId] = useState(null);
  const {
    state: { user, permissions, selectedEntity, resources }
  }: any = useData();
  const [scanDialog, setScanDialog] = useState(false);
  const [cartDialog, setCartDialog] = useState(false);
  const [productCategoryList, setProductCategoryList] = useState([]);
  const [productCategory, setProductCategory] = useState(null);

  const [qtyDialog, setQtyDialog] = useState({ open: false, product: null });
  const [cartProduct, setCartProduct] = useState([]);
  const [viewType, setViewType] = useState(localStorage.getItem('pos_ViewType') ? localStorage.getItem('pos_ViewType') : 'card');
  const [loadingCart, setLoadingCart] = useState(false);
  const [refreshData, setRefreshData] = useState(false);

  useEffect(() => {
    getPlants();
    getProductCategory();
  }, []);

  useEffect(() => {
    if (plantId) fetchCart();
  }, [plantId]);
  const getPlants = () => {
    var api = `/warehouse?noEntityWise=1`;
    if (user?.user?.customerAccountId || user?.user?.customerContactId) {
      api = `${routes.warehouse.path}/customer-contact`;
    }
    axiosInstance()
      .get(api)
      .then(({ data: { data } }) => {
        const row = data.map((d) => ({
          warehouseId: d.warehouse || d._id,
          warehouseName: d.warehouseName
        }));
        setPlantId(row[0].warehouseId);
        setPlantOptions(row);
      });
  };

  const getProductCategory = () => {
    axiosInstance()
      .get('/pos/product-category')
      .then(({ data: { data } }) => {
        setProductCategoryList(data);
        if (data?.find((e) => e.name === 'Parts')) {
          setProductCategory(data?.find((e) => e.name === 'Parts')?._id);
        }
      });
  };

  const fetchCart = () => {
    axiosInstance()
      .get(`/pos/cart/${plantId}`)
      .then(({ data: { data } }) => {
        setCartProduct(data);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleAddToCart = async (product, qty) => {
    if (product?.length === 1) {
      let tempCartProduct = cartProduct.find((d) => d.product.optionValue === product[0]._id);
      if (tempCartProduct) {
        let data = {
          _id: tempCartProduct._id,
          qty: parseInt(tempCartProduct?.qty || 0) + qty
        };
        setLoadingCart(true);
        axiosInstance()
          .put(`/pos/cart`, data)
          .then(({ data }) => {
            fetchCart();
            setRefreshData(!refreshData);
            setQtyDialog({ open: false, product: null });
            setLoadingCart(false);
            toastConfig.setToastConfig({
              open: true,
              type: 'success',
              message: 'Add to cart successfully'
            });
          })
          .catch((error) => {
            toastConfig.setToastConfig(error);
          });
      } else {
        let data = [
          {
            product: product[0]._id,
            qty: parseInt(qty),
            warehouse: plantId ?? product[0]?.plantId
          }
        ];
        setLoadingCart(true);
        axiosInstance()
          .post(`/pos/cart`, data)
          .then(({ data }) => {
            fetchCart();
            setRefreshData(!refreshData);
            setQtyDialog({ open: false, product: null });
            setLoadingCart(false);
            toastConfig.setToastConfig({
              open: true,
              type: 'success',
              message: 'Add to cart successfully'
            });
          })
          .catch((error) => {
            toastConfig.setToastConfig(error);
          });
      }
    }
  };

  const handleDeleteCart = (product) => {
    setLoadingCart(true);
    axiosInstance()
      .put(`/pos/cart/remove`, { ids: [product._id] })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setLoadingCart(false);
        fetchCart();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleChangeViewType = (type) => {
    setViewType(type);
    localStorage.setItem('pos_ViewType', type);
  };

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[{...routes.pos,title:resources?.pos?.titlePlural}]} />
        </Grid>
        <Grid item md={8} sm={11} xs={10}></Grid>
      </Grid>
      <CustomContainer>
        <div className="header-panel">
          <Grid container>
            <Grid item xs={12} sm={12} md={6} className={isMobile ? styles2.mobile_panel : 'd-flex align-items-center gap-1'}>
              <Autocomplete
                style={{ width: '250px' }}
                options={plantOptions}
                getOptionLabel={(option: any) => option.warehouseName}
                disableClearable
                getOptionSelected={(option: any, val) => option.warehouseId === val}
                value={
                  plantOptions.filter((data) => data.warehouseId === plantId).length
                    ? plantOptions.filter((data) => data.warehouseId === plantId)[0]
                    : ''
                }
                onChange={(e, val) => {
                  if (val !== null) {
                    setPlantId(val && val.warehouseId ? val.warehouseId : '');
                  }
                }}
                renderInput={(params) =>
                  isMobile && !isTablet ? (
                    <TextField
                      {...params}
                      margin="dense"
                      name="plant"
                      placeholder={resources?.warehouse?.titleSingular}
                      variant="standard"
                      fullWidth
                      className={isMobile ? 'serchBox' : ''}
                    />
                  ) : (
                    <TextField {...params} margin="dense" name="plant" label={resources?.warehouse?.titleSingular} variant="outlined" fullWidth />
                  )
                }
              />
              <Autocomplete
                style={{ width: '250px' }}
                options={productCategoryList}
                getOptionLabel={(option: any) => (option ? option.name : '')}
                getOptionSelected={(option: any, val) => option._id === val}
                value={
                  productCategoryList.find((data) => data._id === productCategory)
                    ? productCategoryList.find((data) => data._id === productCategory)
                    : ''
                }
                onChange={(e, val) => {
                  setProductCategory(val && val._id ? val._id : '');
                }}
                renderInput={(params) =>
                  isMobile && !isTablet ? (
                    <TextField
                      {...params}
                      margin="dense"
                      name="productCategory"
                      placeholder="Product Category"
                      variant="standard"
                      fullWidth
                      className={isMobile ? 'serchBox' : ''}
                    />
                  ) : (
                    <TextField {...params} margin="dense" name="productCategory" label="Product Category" variant="outlined" fullWidth />
                  )
                }
              />
            </Grid>
            <Grid md={6} sm={12} xs={12} container className={styles2.filter_side}>
              <Box className={isMobile ? styles2.mobile_filter_side_header : styles2.filter_side_header} component="div">
                <SearchBox
                  onChange={(e) => {
                    setSearchVal(e.target.value);
                  }}
                  value={searchVal}
                  width="350px"
                  style={isMobile ? { flex: 1 } : {}}
                />
                <IconButton
                  onClick={() => {
                    setScanDialog(true);
                  }}
                  size="small"
                  color="secondary"
                  aria-label="open drawer"
                >
                  <CropFreeIcon />
                </IconButton>
                <ButtonGroup color="primary" aria-label="outlined primary button group">
                  <Button
                    size={isMobile ? 'small' : 'medium'}
                    variant={viewType === 'grid' ? 'contained' : 'outlined'}
                    onClick={() => handleChangeViewType('grid')}
                  >
                    <MdList fontSize="small" color="primary" />
                  </Button>
                  <Button
                    size={isMobile ? 'small' : 'medium'}
                    variant={viewType === 'card' ? 'contained' : 'outlined'}
                    onClick={() => handleChangeViewType('card')}
                  >
                    <MdBorderAll fontSize="small" color="primary" />
                  </Button>
                </ButtonGroup>
                <IconButton
                  id="Cart"
                  aria-label="Cart"
                  color="primary"
                  title="Cart"
                  size={isMobile ? 'small' : 'medium'}
                  onClick={() => {
                    setCartDialog(true);
                  }}
                >
                  <Badge badgeContent={cartProduct?.length} color="secondary">
                    <ShoppingCartIcon />
                  </Badge>
                </IconButton>
              </Box>
            </Grid>
          </Grid>
        </div>
        {viewType === 'grid' ? (
          <ProductGrid
            renderedFrom={renderedFrom}
            setAssignCartProductQty={(data) => {
              setQtyDialog({ open: true, product: data });
            }}
            plantId={plantId}
            productCategory={productCategory}
            refreshData={refreshData}
            searchVal={searchVal}
          />
        ) : (
          <ProductCard
            setAssignCartProductQty={(data) => {
              setQtyDialog({ open: true, product: data });
            }}
            plantId={plantId}
            productCategory={productCategory}
            refreshData={refreshData}
            searchVal={searchVal}
          />
        )}
        {scanDialog && (
          <Scan
            setAssignCartProductQty={(data) => {
              setQtyDialog({ open: true, product: data });
            }}
            plantId={plantId}
            onClose={() => setScanDialog(false)}
          />
        )}
        {cartDialog && (
          <Cart
            fetchCart={fetchCart}
            products={cartProduct}
            handleCloseDialog={() => {
              setCartDialog(false);
              setRefreshData(!refreshData);
            }}
            handleDeleteCart={handleDeleteCart}
          />
        )}
        {qtyDialog.open && (
          <QuantityDialog
            handleAddToCart={handleAddToCart}
            product={qtyDialog.product}
            handleCloseDialog={() => {
              setQtyDialog({ open: false, product: null });
            }}
            loading={loadingCart}
          />
        )}
      </CustomContainer>
    </Fragment>
  );
};

export default Pos;
