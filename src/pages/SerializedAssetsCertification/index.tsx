import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import Grid from '@material-ui/core/Grid';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../axios/axiosInstance';
import { Box, Button, Chip, Menu, MenuItem, TextField } from '@material-ui/core';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import routes from '../../components/Helpers/Routes';
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import {
  serializedAssetsCertification,
  serializedAsset,
  gridLoadingTimeout,
  ASSET_STATUS,
  COLOUR_MASTER,
  getLocalStorageArrayData,
  sidebarResource,
} from '../../constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { useData } from '../../StateProvider/Provider';
import HtmlTooltip from '../../components/CustomTooltipTitle';
import useColumns, { getStaticFields, getFrameworkComponents, gridFilterParser } from '../../constants/useColumns';
import { prepareDataForGrid } from '../../constants/helpers';
import { camelCase } from 'lodash';
import { Link } from 'react-router-dom';
import WarningIcon from '@material-ui/icons/Warning';
import moment from 'moment';
import IssueCertificateDialog from './IssueCertificateDialog';
import { Autocomplete } from '@material-ui/lab';
import CertificateHistoryDialog from './CertificateHistoryDialog';
import { isMobile, isTablet } from 'react-device-detect';
import SearchBox from 'src/components/Helpers/SearchBox';
import styles from '../Leads/Header.module.scss';

const SerializedAssetsCertification = () => {
  const renderedFrom = camelCase(routes?.serializedAssetsCertification.title);
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  const toastConfig = useContext(CustomToastContext);
  const [openDialog, setOpenDialog] = useState({ open: false, id: null });
  const [gridApi, setGridApi] = useState(null);
  const [columns, setColumns] = useState(null);
  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } =
    state;
  const [certificateStatus, setCertificateStatus] = useState<{ _id: string; name: string }>({ _id: 'Pending', name: 'Pending' });
  const [productCategoryList, setProductCategoryList] = useState([]);
  const [productCategory, setProductCategory] = useState(null);
  const [productFilterList, setProductFilterList] = useState([]);
  const [productFilter, setProductFilter] = useState(null);
  const [warehouseOptions, setWarehouseOptions] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [products, setProducts] = useState(null);

  const {
    state: { permissions, user }
  }: any = useData();
  const { getColumnData } = useColumns();

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    fetchProductInventory();
  }, [page, limit, filters, sorting, search, showFilteredRecordsOnly, selectedWarehouse, productCategory, productFilter, certificateStatus]);

  useEffect(() => {
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=Product Category`)
      .then(({ data: { data } }) => {
        setProductCategoryList(data['Product Category']);
      });
  }, []);

  useEffect(() => {
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=Warehouse`)
      .then(({ data: { data } }) => {
        setWarehouseOptions(data['Warehouse']);
      });

  }, []);

  useEffect(() => {
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=Product`)
      .then(({ data: { data } }) => {
        setProducts(data['Product']);
      });

  }, []);

  useEffect(() => {
    if (productCategory && productCategory !== '') {
      const filteredProducts = products.filter(product => product?.productCategory === productCategory);
      setProductFilterList(filteredProducts);
    }
  }, [productCategory, products]);


  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${serializedAsset.resource}`)
      .then(({ data: { data } }) => {
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.serializedAssetDetail.path);
          if (currentColumn !== null) {
            columns = [...columns, currentColumn?.columnData];
            if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
              rendererNames.push(currentColumn?.rendererName);
            }
          }
        });
        columns?.forEach((e) => {
          if (e.field === 'assetNumber') {
            e.cellRenderer = 'assetNumberRenderer';
            e.cellStyle = (params) => {
              if ([ASSET_STATUS.lost, ASSET_STATUS.scrap, ASSET_STATUS.needRepair, ASSET_STATUS.needRecert].includes(params?.data?.status)) {
                return { backgroundColor: COLOUR_MASTER.lostAssets.background };
              }
              return null;
            };
          }
        });

        columns.push({ field: 'ownerType', headerName: 'Actual Owner Type', show: true, disabled: true, cellRenderer: 'commonRenderer' });
        columns.push({ field: 'owner', headerName: 'Actual Owner', show: true, disabled: true, cellRenderer: 'commonRenderer' });

        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
        tempFrameworkComponent = {
          ...tempFrameworkComponent,
          assetNumberRenderer: AssetNumberRenderer,
          actionsRenderer: ActionsRenderer
        };
        setFrameWorkComponent({ ...tempFrameworkComponent });
        columns = [...columns, ...getStaticFields()];
        setColumns([...columns]);
      });
  };

  const fetchProductInventory = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }

    const queryString = getQueryString();
    axiosInstance()
      .get(`${serializedAssetsCertification.api}?certificateStatus=${certificateStatus.name}${queryString}`)
      .then(({ data }) => {
        let rows = data.data?.map((u, user) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['canDelete'] = permissions?.serializedAsset?.isDelete;
          finalObject['isChecked'] = [...getLocalStorageArrayData(localStorageSelectedRecords)].some((s) => s._id === u._id);
          finalObject['allowedToEdit'] = permissions?.serializedAsset.isUpdate;
          return {
            ...finalObject
          };
        });
        if (appendRows) {
          dispatch({
            type: 'initialize',
            data: [...dataRows, ...rows],
            count: data.data.count,
            selectedRecords: [...dataRows, ...rows].filter((f) => f.isChecked === true)
          });
        } else {
          dispatch({
            type: 'initialize',
            data: rows,
            count: data.count,
            selectedRecords: rows.filter((f) => f.isChecked === true)
          });
        }
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  const getQueryString = () => {
    let deepFilter = ``;
    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (selectedWarehouse && selectedWarehouse !== '') {
      filterByIds.push({ field: 'warehouse', term: selectedWarehouse });
    }
    if (productCategory && productCategory !== '') {
      filterByIds.push({ field: 'productCategory', term: productCategory });
    }
    if (productFilter && productFilter !== '') {
      filterByIds.push({ field: 'product', term: productFilter });
    }

    if (filterByIds?.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
    }
    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURI(JSON.stringify(deepFilters))}`;
    }

    if (filterByIds?.length || deepFilters?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURI(search)}`;
    }
    if (showFilteredRecordsOnly) {
      const savedRecords = [...getLocalStorageArrayData(localStorageSelectedRecords)];
      deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map((m) => m._id))}`;
    }
    return `${deepFilter}&filterType=and&filterByIdType=and`;
  };

  const AssetNumberRenderer = (params) => (
    <Fragment>
      <p
        className="link text-truncate"
        onClick={() => {
          setOpenDialog({ open: true, id: params?.data?._id });
        }}
      >
        {params.value}
      </p>
      {params.data?.recertDate && new Date(params.data?.recertDate)?.getTime() <= new Date()?.getTime() && (
        <Box ml={1} pt={1}>
          <HtmlTooltip title="Asset needs to be recert">
            <WarningIcon style={{ fontSize: '14px' }} fontSize="small" color="error" />
          </HtmlTooltip>
        </Box>
      )}
    </Fragment>
  );

  const ActionsRenderer = (params) => <></>;

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[routes.serializedAssetsCertification]} />
        </Grid>
        <Grid item md={8} sm={1} xs={2}></Grid>
      </Grid>
      <div className="main-container">
        <div className="header-panel">
          <Grid container className={styles.filter_side_container}>
            <Grid item xs={12} sm={12} md={9} className="d-flex align-items-center gap-1 flex-wrap">
              <Fragment>
                <Autocomplete
                  style={{ width: '250px' }}
                  options={[
                    { _id: 'Pending', name: 'Pending' },
                    { _id: 'Completed', name: 'Completed' }
                  ]}
                  getOptionLabel={(option: any) => (option ? option.name : '')}
                  getOptionSelected={(option: any, val) => option._id === val._id}
                  value={certificateStatus}
                  onChange={(e, val) => {
                    setCertificateStatus(val ? val : { _id: 'Pending', name: 'Pending' });
                  }}
                  renderInput={(params) => (
                    <TextField {...params} margin="dense" name="certificateStatus" label="Certificate Status" variant="outlined" fullWidth />
                  )}
                />
                <Autocomplete
                  style={{ width: '250px' }}
                  options={productCategoryList}
                  getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                  getOptionSelected={(option: any, val) => option.optionValue === val}
                  value={
                    productCategoryList.filter((data) => data.optionValue === productCategory).length
                      ? productCategoryList.filter((data) => data.optionValue === productCategory)[0]
                      : ''
                  }
                  onChange={(e, val) => {
                    setProductCategory(val && val.optionValue ? val.optionValue : '');
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
                {productCategory && (
                  <Autocomplete
                    style={{ width: '250px' }}
                    options={productFilterList}
                    getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                    getOptionSelected={(option: any, val) => option.optionValue === val}
                    value={
                      productFilterList.filter((data) => data.optionValue === productFilter).length
                        ? productFilterList.filter((data) => data.optionValue === productFilter)[0]
                        : ''
                    }
                    onChange={(e, val) => {
                      setProductFilter(val && val.optionValue ? val.optionValue : '');
                    }}
                    renderInput={(params) => <TextField {...params} margin="dense" name="product" label="Product" variant="outlined" fullWidth />}
                  />
                )}
                <Autocomplete
                  style={{ width: '250px' }}
                  options={warehouseOptions}
                  getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
                  getOptionSelected={(option: any, val) => option.optionValue === val}
                  value={
                    warehouseOptions.filter((data) => data.optionValue === selectedWarehouse).length
                      ? warehouseOptions.filter((data) => data.optionValue === selectedWarehouse)[0]
                      : ''
                  }
                  onChange={(e, val) => {
                    setSelectedWarehouse(val && val.optionValue ? val.optionValue : '');
                  }}
                  renderInput={(params) =>
                    isMobile && !isTablet ? (
                      <TextField
                        {...params}
                        margin="dense"
                        name="plant"
                        placeholder={routes.warehouse.title}
                        variant="standard"
                        fullWidth
                        className={isMobile ? 'serchBox' : ''}
                      />
                    ) : (
                      <TextField {...params} margin="dense" name="plant" label={routes.warehouse.title} variant="outlined" fullWidth />
                    )
                  }
                />
              </Fragment>
            </Grid>
            <Grid sm={12} xs={12} md={3} container className={`${styles.filter_side} align-items-center`}>
              <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">
                <Box style={{ flexGrow: '1' }}>
                  <SearchBox
                    onChange={handleSearch}
                    className={styles.search_box_input}
                    width={isMobile ? '200px' : '210px'}
                    style={{ width: '100%', maxWidth: 250, display: 'flex' }}
                    size="small"
                    value={search}
                  />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </div>
        {columns ? (
          Object.keys(frameWorkComponent).length > 0 && columns ? (
            <CustomAgGrid
              columns={columns}
              dataRows={dataRows}
              frameworkComponents={frameWorkComponent}
              setGridApi={setGridApi}
              dispatch={dispatch}
              rowCount={rowCount}
              limit={limit}
              pageSizes={pageSizes}
              page={page}
              actionWidth={150}
              loading={loading}
              renderedFrom={renderedFrom}
              refreshGrid={fetchProductInventory}
              showOnlyShowFilteredRecordSwitch={true}
              rowClassRules={{
                'light-red-data-row': function (params) {
                  if (params.data?.recertDate) {
                    var a = moment(params.data?.recertDate);
                    var b = moment();
                    const days = a.diff(b, 'days');
                    if (days < 15 && days >= 0) {
                      return true;
                    } else if (days < 0) {
                      return true;
                    }
                  }
                  return false;
                },
                'light-yellow-data-row': function (params) {
                  if (params.data?.recertDate) {
                    var a = moment(params.data?.recertDate);
                    var b = moment();
                    const days = a.diff(b, 'days');
                    if (days < 30 && days >= 15) {
                      return true;
                    }
                  }
                  return false;
                },
                'light-green-data-row': function (params) {
                  if (params.data?.recertDate) {
                    var a = moment(params.data?.recertDate);
                    var b = moment();
                    const days = a.diff(b, 'days');
                    if (days <= 60 && days >= 30) {
                      return true;
                    }
                  }
                  return false;
                }
              }}
              showFilters={true}
              resource={sidebarResource.serializedAsset}
            />
          ) : null
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </div>
      {openDialog?.open && certificateStatus._id === 'Pending' && (
        <IssueCertificateDialog
          onClose={() => setOpenDialog({ open: false, id: null })}
          onSuccess={() => {
            setOpenDialog({ open: false, id: null });
            fetchProductInventory();
          }}
          assetId={openDialog?.id}
        />
      )}
      {openDialog?.open && certificateStatus._id === 'Completed' && (
        <CertificateHistoryDialog onClose={() => setOpenDialog({ open: false, id: null })} id={openDialog?.id} />
      )}
    </Fragment>
  );
};

export default SerializedAssetsCertification;
