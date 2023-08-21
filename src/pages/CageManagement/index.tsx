import { useState, FC, useEffect, useContext, useReducer, Fragment } from 'react';
import {
  Badge,
  Box,
  Button,
  capitalize,
  Chip,
  ClickAwayListener,
  Divider,
  Grid,
  IconButton,
  InputBase,
  List,
  ListItem,
  ListItemText,
  Menu,
  MenuItem,
  TextField,
  Tooltip,
  Typography
} from '@material-ui/core';
import routes from './../../components/Helpers/Routes';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import { useData } from '../../StateProvider/Provider';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import CustomContainer from '../../components/CustomContainer';
import { Autocomplete } from '@material-ui/lab';
import { isMobile, isTablet } from 'react-device-detect';
import SearchBox from 'src/components/Helpers/SearchBox';
import axiosInstance from 'src/axios/axiosInstance';
import styles2 from '../Leads/Header.module.scss';
import CropFreeIcon from '@material-ui/icons/CropFree';
import { camelCase, filter } from 'lodash';
import HistoryIcon from '@material-ui/icons/History';
import Scan from '../Pos/Scan';
import ProductGridLayout from './Product';
import QuantityDialog from './QuantityDialog';
import { cageManagement } from 'src/constants/helpers';
import CageHistory from './CageHistory';

const CageManagement = () => {
  const renderedFrom = camelCase(routes?.cageManagement.title);

  const toastConfig = useContext(CustomToastContext);
  const [searchVal, setSearchVal] = useState('');
  const [plantOptions, setPlantOptions] = useState([]);
  const [plantId, setPlantId] = useState(null);
  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();
  const [scanDialog, setScanDialog] = useState(false);
  const [cartDialog, setHistoryDialog] = useState(false);
  const [productCategoryList, setProductCategoryList] = useState([]);
  const [productCategory, setProductCategory] = useState(null);

  const [qtyDialog, setQtyDialog] = useState({ open: false, product: null });
  const [cartProduct, setHistoryProduct] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [refreshData, setRefreshData] = useState(false);

  useEffect(() => {
    getPlants();
    getProductCategory();
    fetchHistory();
  }, []);

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
      .get(`${cageManagement.api}/product-category`)
      .then(({ data: { data } }) => {
        setProductCategoryList(data);
        if (data?.find((e) => e.name === 'Parts')) {
          setProductCategory(data?.find((e) => e.name === 'Parts')?._id);
        }
      });
  };

  const fetchHistory = () => {
    axiosInstance()
      .get(`${cageManagement.api}/history`)
      .then(({ data: { data } }) => {
        setHistoryProduct(data);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleAddToPickup = async (product, qty) => {
    if (product?.length === 1) {
      let data = [
        {
          product: product[0]._id,
          qty: parseInt(qty),
          warehouse: plantId ?? product[0]?.plantId,
          pickUpDate: new Date()
        }
      ];
      setLoadingHistory(true);
      axiosInstance()
        .post(`${cageManagement.api}/pick-up`, data)
        .then(({ data }) => {
          fetchHistory();
          setRefreshData(!refreshData);
          setQtyDialog({ open: false, product: null });
          setLoadingHistory(false);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: 'Picked Up Successfully'
          });
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleDrop = (product) => {
    setLoadingHistory(true);
    let tempData = [
      {
        _id: product._id,
        dropDate: new Date()
      }
    ];
    axiosInstance()
      .post(`${cageManagement.api}/drop`, tempData)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'Drop Successfully'
        });
        setLoadingHistory(false);
        fetchHistory();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[routes.cageManagement]} />
        </Grid>
        <Grid item md={8} sm={11} xs={10}></Grid>
      </Grid>
      <CustomContainer>
        <div className="header-panel">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
            <div className={'d-flex flex-wrap align-items-center gap-2'}>
              <Autocomplete
                style={{ minWidth: '200px', flexGrow: 1 }}
                className="md:max-w-[250px]"
                options={plantOptions}
                getOptionLabel={(option: any) => option.warehouseName}
                disableClearable
                getOptionSelected={(option: any, val) => option.warehouseId === val}
                size={'small'}
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
                renderInput={(params) => (
                  <TextField {...params} margin="none" size="small" name="plant" label={routes.warehouse.title} variant="outlined" fullWidth />
                )}
              />
              <Autocomplete
                style={{ minWidth: '200px', flexGrow: 1 }}
                className="md:max-w-[250px]"
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
                renderInput={(params) => (
                  <TextField {...params} margin="none" size="small" name="productCategory" label="Product Category" variant="outlined" fullWidth />
                )}
              />
            </div>
            <div className="flex flex-wrap gap-[8px]  justify-end">
              <SearchBox
                onChange={(e) => {
                  setSearchVal(e.target.value);
                }}
                className={styles2.search_box_input}
                value={searchVal}
                size="small"
                placeholder="Search Product"
              />
              <IconButton
                onClick={() => {
                  setScanDialog(true);
                }}
                size="small"
                color="primary"
                aria-label="open drawer"
              >
                <CropFreeIcon />
              </IconButton>
              <IconButton
                id="History"
                aria-label="History"
                color="primary"
                title="History"
                size={isMobile ? 'small' : 'medium'}
                onClick={() => {
                  setHistoryDialog(true);
                }}
              >
                <HistoryIcon />
              </IconButton>
            </div>
          </div>
        </div>
        {
          <ProductGridLayout
            renderedFrom={renderedFrom}
            setAssignHistoryProductQty={(data) => {
              setQtyDialog({ open: true, product: data });
            }}
            plantId={plantId}
            productCategory={productCategory}
            refreshData={refreshData}
            searchVal={searchVal}
          />
        }
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
          <CageHistory
            fetchHistory={fetchHistory}
            products={cartProduct}
            handleCloseDialog={() => {
              setHistoryDialog(false);
              setRefreshData(!refreshData);
            }}
            handleDrop={handleDrop}
          />
        )}
        {qtyDialog.open && (
          <QuantityDialog
            handleAddToPickup={handleAddToPickup}
            product={qtyDialog.product}
            handleCloseDialog={() => {
              setQtyDialog({ open: false, product: null });
            }}
            loading={loadingHistory}
          />
        )}
      </CustomContainer>
    </Fragment>
  );
};

export default CageManagement;
