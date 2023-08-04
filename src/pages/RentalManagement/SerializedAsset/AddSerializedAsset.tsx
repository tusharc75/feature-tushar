import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import { Box, CircularProgress, Tab, Tabs, useTheme } from '@material-ui/core';
import SearchBox from '../../../components/Helpers/SearchBox';
import routes from '../../../components/Helpers/Routes';
import CustomAgGrid, { reducer, intialState } from '../../../components/AgGridComponents/CustomAgGrid';
import {
  serializedAsset,
  isObjectEmpty,
  gridLoadingTimeout,
  CustomDialogTransition,
  getLocalStorageArrayData,
  ASSET_STATUS,
  transferAsset,
  DELIVERY_FROM_TO_TYPE,
  DELIVERY_TICKET_STATUS,
  DELIVERY_TICKET_TYPE,
  DELIVERY_TICKET_REFERENCE_TYPE,
  rentalManagement,
  deliveryTicket
} from '../../../constants/helpers';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { useData } from '../../../StateProvider/Provider';
import Dialog from '@material-ui/core/Dialog/Dialog';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import useColumns, { getStaticFields, getFrameworkComponents } from '../../../constants/useColumns';
import { prepareDataForGrid } from '../../../constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import { uniq, map } from 'lodash';
import ManageTransferAsset from '../../TransferAssets/ManageTransferAsset';
import { Autocomplete } from '@material-ui/lab';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import { Link } from 'react-router-dom';
import ManageDeliveryTicket from 'src/pages/DeliveryTicket/ManageDeliveryTicket';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';

import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import { useAppTheme } from 'src/constants/AppConfig';

let searchTimeout;

const AddSerializedAsset = ({
  renderedFrom = 'addSerializedAssets',
  isAdding,
  addSerializedAsset,
  handleSerializedAssetClose,
  selectedProducts,
  referenceType = null,
  referenceData = null,
  rentalId = null,
  repairJobId = null,
  transferAssetId = null,
  notIn = null,
  filterByPlant = null,
  handleSuccess = null
}) => {
  const localStorageSelectedRecords = `${renderedFrom}_selected`;
  const [theme] = useAppTheme();

  const toastConfig = useContext(CustomToastContext);
  const [serializedProducts, setSerializedProducts] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const { getColumnData } = useColumns();
  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const [columns, setColumns] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const {
    state: { permissions }
  }: any = useData();

  const [showTransferAssetDialog, setShowTransferAssetDialog] = useState(false);

  const [warehouseOption, setWarehouseOption] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(filterByPlant);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  const [showTicketDialog, setShowTicketDialog] = useState({ open: false, data: {}, assets: [] });

  const [checkMTRValidation, setCheckMTRValidation] = useState(false);
  const [mtrConfirmBox, setMtrConfirmBox] = useState(false);

  const [inuseAssetConfirmBox, setInuseAssetConfirmBox] = useState(false);

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 600;
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    searchTimeout = setTimeout(() => {
      fetchAssets();
    }, millisec);
  }, [page, limit, filters, sorting, search, showFilteredRecordsOnly, selectedWarehouse, selectedProduct, tabValue]);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    axiosInstance()
      .get('/sa-formbuilder/lookup?lookupResource=Warehouse')
      .then(({ data: { data } }) => {
        setWarehouseOption(data['Warehouse']);
      });
  }, []);

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${serializedAsset.resource}`)
      .then(({ data: { data } }) => {
        setCheckMTRValidation(data?.some((e) => e?.fieldData?.fieldName === 'mtrAttached'));
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
        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
        tempFrameworkComponent = {
          ...tempFrameworkComponent
        };
        setFrameWorkComponent({ ...tempFrameworkComponent, rentalJobRenderer: RentalJobRenderer });

        const inUseColoumns: any = [
          {
            field: 'rentalJob',
            headerName: 'Rental Job',
            show: true,
            filter: true,
            sortable: true,
            lockPosition: true,
            cellRenderer: 'rentalJobRenderer'
          }
        ];

        columns = [...inUseColoumns, ...columns, ...getStaticFields()];
        setColumns([...columns]);
      });
  };

  const RentalJobRenderer = (params) => (
    <Link className="link text-truncate" target="_blank" to={`${routes.rentalManagementDetail.path}/${params.data?.rentalJob?.optionValue}`}>
      {params?.data?.rentalJob?.optionLabel}
    </Link>
  );

  useEffect(() => {
    let tempProducts = serializedProducts;
    const alreadyStoredSelectedRecords = [...getLocalStorageArrayData(localStorageSelectedRecords)];
    if (tempProducts.length === 0) {
      selectedProducts.map((d) => {
        if (tempProducts.find((obj) => obj.id === d.id)) {
          tempProducts.find((obj) => obj.id === d.id).qty = d?.qty + tempProducts.find((obj) => obj.id === d.id).qty;
        } else {
          tempProducts.push({ id: d.id, name: d.productName, qty: d?.qty });
        }
      });
    } else {
      tempProducts = [];
      selectedProducts.map((d) => {
        tempProducts.push({
          id: d.id,
          name: d.productName,
          qty: d?.qty - alreadyStoredSelectedRecords?.filter((obj) => obj.productId === d.id).length
        });
      });
    }
    setSerializedProducts(tempProducts);
  }, [selectedRecords]);

  const fetchAssets = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    let queryString = getQueryString();
    if (selectedProducts.length > 0) {
      var updatedFilters = [];
      if (selectedProduct) {
        updatedFilters.push({ field: 'product', term: selectedProduct });
      } else {
        updatedFilters = selectedProducts.map((m) => {
          return { field: 'product', term: m?.id ?? '' };
        });
      }
      queryString = `${queryString}&filterById=${JSON.stringify(updatedFilters)}&filterByIdType=or`;
    }
    let api = '';
    if (Number(tabValue) === 2) {
      api = `${serializedAsset.api}/in-use${queryString}&rental=${referenceData?._id}`;
    } else {
      api = `${serializedAsset.api}${queryString}`;
    }
    axiosInstance()
      .get(api)
      .then(({ data: { data, count } }) => {
        const rows = data?.map((u) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['isChecked'] = false;
          if (Number(tabValue) === 2) {
            finalObject['rentalJob'] = u.loadingTicket?.rentalJob;
            finalObject['loadingTicket'] = u.loadingTicket;
          }
          return finalObject;
        });
        dispatch({ type: 'initialize', data: rows, count: count });
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
    let deepFilter = `?page=${page}&limit=${limit}`;
    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify(getLocalStorageArrayData(localStorageSelectedRecords)?.map((m) => m._id))}`;
    }
    const updatedFilters = [];
    if (!isObjectEmpty(filters)) {
      Object.keys(filters).forEach((field) => {
        updatedFilters.push({
          field: field,
          term: filters[field].filter
        });
      });
    }
    if (updatedFilters.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}&filterType=and`;
    }
    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    if (search) {
      deepFilter = `${deepFilter}&search=${search}`;
    }
    //  To fetch the remaining unassigned assets of that rental management
    if (rentalId) {
      deepFilter = `${deepFilter}&rentalJobId=${rentalId}&notIn=${notIn}`;
    } else if (repairJobId) {
      deepFilter = `${deepFilter}&repairJobId=${repairJobId}&notIn=${notIn}`;
    } else if (transferAssetId) {
      deepFilter = `${deepFilter}&transferAssetId=${transferAssetId}&notIn=${notIn}`;
    } else {
      if (selectedWarehouse == null) {
        deepFilter = `${deepFilter}`;
      } else {
        deepFilter = `${deepFilter}&plant=${selectedWarehouse}`;
      }
      if (referenceType === 'Repair Job') {
        deepFilter = `${deepFilter}&repairable=true`;
      } else if (referenceType === 'Rental Job') {
        const dateFilter = { from: referenceData?.fromDate, to: referenceData?.toDate };
        deepFilter = `${deepFilter}&rental=true&date=${JSON.stringify(dateFilter)}`;
      } else {
        deepFilter = `${deepFilter}&availableAsset=true`;
      }
    }
    if (Number(tabValue) === 1) {
      deepFilter = `${deepFilter}&subleaseAsset=1`;
    } else {
      deepFilter = `${deepFilter}&subleaseAsset=0`;
    }

    return deepFilter;
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const getRowStyleScheduled = (params) => {
    if (params?.data?.reserved) {
      return {
        'background-color': 'var(--dark-gray, #FAEAE9)'
      };
    } else if ([ASSET_STATUS.available, ASSET_STATUS.new]?.includes(params?.data?.status)) {
      return {
        'background-color': 'var(--dark-green, #DBF8DB)'
      };
    } else if ([ASSET_STATUS.inUse]?.includes(params?.data?.status)) {
      return {
        'background-color': 'var(--dark-yellow, #FFD580)'
      };
    }
    return null;
  };

  const checkUniqWarehouse = () => {
    if (getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length === 0) {
      return true;
    } else if (uniq(map(getLocalStorageArrayData(`${localStorageSelectedRecords}`), 'warehouseId')).length === 1) {
      if (
        uniq(map(getLocalStorageArrayData(`${localStorageSelectedRecords}`), 'warehouseId'))[0] === null ||
        uniq(map(getLocalStorageArrayData(`${localStorageSelectedRecords}`), 'warehouseId'))[0] === undefined
      ) {
        return true;
      }
      if (uniq(map(getLocalStorageArrayData(`${localStorageSelectedRecords}`), 'warehouseId'))[0] === filterByPlant) {
        return true;
      }
      return false;
    } else {
      return true;
    }
  };

  const checkUniqRentalJob = () => {
    if (getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length === 0) {
      return true;
      // } else if (uniq(map(getLocalStorageArrayData(`${localStorageSelectedRecords}`), 'loadingTicket.rentalJob.optionLabel')).length === 1) {
      //   return false;
    } else {
      return false;
    }
  };

  const handleAddAssetToTransferAsset = (transferAssetId) => {
    axiosInstance()
      .put(`${transferAsset.api}/add-asset/${transferAssetId}`, {
        assets: getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.map((s) => {
          return {
            _id: s._id,
            currentStatus: s.status
          };
        }),
        manualStatus: ASSET_STATUS.reserved
      })
      .then(({ data }) => {
        fetchAssets();
        setShowTransferAssetDialog(false);
        addSerializedAsset([...getLocalStorageArrayData(localStorageSelectedRecords)]);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  function a11yProps(index: any) {
    return {
      id: `main-tab-${index}`,
      'aria-controls': `main-tabpanel-${index}`
    };
  }

  const handleMainTabChange = (event: any, newValue: number) => {
    setTabValue(newValue);
    if (((tabValue === 0 || tabValue === 1) && newValue === 2) || ((newValue === 0 || newValue === 1) && tabValue === 2)) {
      dispatch({ type: 'selection', selectedRecords: [] });
      localStorage.removeItem(localStorageSelectedRecords);
    }
    // if (newValue === 0) {
    //   setSelectedWarehouse(filterByPlant);
    // } else {
    //   setSelectedWarehouse(null);
    // }
  };

  const handleTicketDialog = () => {
    const loadingTicket = getLocalStorageArrayData(`${localStorageSelectedRecords}`)[0].loadingTicket;

    const assetsAdd: any = [];
    const assets = [...getLocalStorageArrayData(`${localStorageSelectedRecords}`)];
    selectedProducts?.forEach((e: any) => {
      if (e.type === 'product') {
        let qty = e.realAssetQty - e.realAssetAssignedQty;
        while (qty) {
          const result = assets.filter((f) => f.productId === e.materialId && !f.isCounted);
          if (result.length) {
            let obj: any = {};
            obj._id = e._id;
            obj.inventory = result[0]._id;
            obj.product = e.materialId;
            assetsAdd.push(obj);
            result[0].isCounted = true;
          }
          qty--;
        }
      }
    });

    if (assetsAdd?.length === 0) {
      return;
    }

    const data = {};
    data['ticketName'] = loadingTicket?.rentalJob?.optionLabel;
    data['referenceId'] = loadingTicket?.rentalJob?.optionValue;

    data['pickupFromType'] = DELIVERY_FROM_TO_TYPE.customer;
    data['pickupFrom'] = loadingTicket?.deliveryTo;
    data['pickupFromAddress'] = loadingTicket?.deliveryToAddress;
    data['isPickupFromDisable'] = true;

    data['deliveryToType'] = DELIVERY_FROM_TO_TYPE.customer;
    data['deliveryTo'] = referenceData?.customerAccount;
    data['deliveryToAddress'] = referenceData?.shippingAddress;
    data['isDeliveryToDisable'] = true;

    data['startDate'] = referenceData?.fromDate;
    data['endDate'] = referenceData?.toDate;
    data['wellName'] = referenceData?.wellName;
    if (referenceData?.wellNumber) {
      data['wellNumber'] = referenceData?.wellNumber;
    }
    data['afeNumber'] = referenceData?.afeNumber;
    if (referenceData?.processor) {
      data['processor'] = referenceData?.processor;
    }
    data['status'] = DELIVERY_TICKET_STATUS.delivered;

    setShowTicketDialog({ open: true, data: data, assets: assetsAdd });
  };

  const handleCreateLoadingTicketAddAsstes = (data) => {
    const deliveryTicketData: any = {};
    deliveryTicketData._id = data._id;
    deliveryTicketData.rentalJob = referenceData?._id;
    deliveryTicketData.ticketType = DELIVERY_TICKET_TYPE.loading;
    axiosInstance()
      .post(`${rentalManagement.api}/${referenceData?._id}/inventory`, { products: showTicketDialog.assets })
      .then(({ data }) => {
        axiosInstance()
          .post(`${deliveryTicket.api}/auto-create-ticket`, deliveryTicketData)
          .then(({ data }) => {
            setShowTicketDialog({ open: false, data: {}, assets: [] });
            handleSuccess();
          })
          .catch((error) => {
            toastConfig.setToastConfig(error);
          });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleAutoTransferAssets = () => {
    const assetsAdd: any = [];
    const assets = [...getLocalStorageArrayData(`${localStorageSelectedRecords}`)];

    selectedProducts?.forEach((e: any) => {
      if (e.type === 'product') {
        let qty = e.realAssetQty - e.realAssetAssignedQty;
        while (qty) {
          const result = assets.filter((f) => f.productId === e.materialId && !f.isCounted);
          if (result.length) {
            let obj: any = {};
            obj._id = e._id;
            obj.product = e.materialId;
            obj.asset = result[0]._id;
            obj.rentalJob = result[0].loadingTicket?.rentalJob?.optionValue;
            assetsAdd.push(obj);
            result[0].isCounted = true;
          }
          qty--;
        }
      }
    });

    axiosInstance()
      .post(`${deliveryTicket.api}/auto-transfer-inuse-assets`, { assets: assetsAdd, rentalJob: referenceData?._id })
      .then(({ data }) => {
        handleSuccess();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Fragment>
      <Dialog fullScreen={true} TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true}>
        <CustomDialogHeader
          title={`${referenceType === 'ReplaceAsset' ? 'Replace' : 'Add'} ${routes.serializedAsset.title}`}
          onClose={handleSerializedAssetClose}
        ></CustomDialogHeader>
        <CustomDialogContent>
          <Box pt={1} pb={1} className="main-container-v1">
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Box display="flex">
                  <Box style={{ display: 'inline' }}>
                    {serializedProducts.length > 0
                      ? serializedProducts.map((d) => (
                          <Box
                            m={0.5}
                            p={1}
                            border={1}
                            className="cursor-pointer"
                            borderColor="var(--common-border-color)"
                            onClick={() => {
                              if (selectedProduct === d.id) {
                                setSelectedProduct(null);
                              } else {
                                setSelectedProduct(d.id);
                              }
                            }}
                            style={{ display: 'inline-block' }}
                            bgcolor={d.id === selectedProduct ? 'var(--dark-primary, var(--primary))' : 'var(--dark-secondary, transparent)'}
                            color={d.id === selectedProduct && 'white'}
                          >
                            {d?.qty < 0 ? (
                              <span key={d.name} className="text-error">{`${d.name} (${d?.qty})`}</span>
                            ) : d?.qty === 0 ? (
                              <span key={d.name} className="text-success">{`${d.name} (${d?.qty})`}</span>
                            ) : (
                              <span key={d.name}>{`${d.name} (${d?.qty})`}</span>
                            )}
                          </Box>
                        ))
                      : null}
                  </Box>
                </Box>
                {serializedProducts.length > 0 && serializedProducts.some((s) => s.qty < 0) ? (
                  <div className="text-error font-weight-bold">You have selected more assets then needed.</div>
                ) : (
                  ''
                )}
              </Grid>
              <Grid item xs={12} md={3}>
                {referenceType === 'Rental Job' && (
                  <Grid container>
                    {/* <Grid item xs={6} justifyContent={'flex-end'}>
                        {permissions?.sublease && (
                          <FormControlLabel
                            control={
                              <Checkbox
                                name="subleaseAsset"
                                checked={subleaseAsset}
                                onChange={(e) => {
                                  dispatch({ type: 'selection', selectedRecords: [] });
                                  localStorage.removeItem(localStorageSelectedRecords);
                                  setSubleaseAsset(e.target.checked);
                                  if (e.target.checked) {
                                    setSelectedWarehouse(null);
                                  } else {
                                    setSelectedWarehouse(filterByPlant);
                                  }
                                }}
                                color="primary"
                              />
                            }
                            label="Sublease Assets"
                          />
                        )}
                      </Grid> */}
                    <Grid item xs={12} justifyContent={'flex-end'}>
                      <Autocomplete
                        fullWidth
                        options={warehouseOption}
                        getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
                        getOptionSelected={(option: any, val) => option.optionValue === val}
                        value={
                          warehouseOption.filter((data) => data.optionValue === selectedWarehouse).length
                            ? warehouseOption.filter((data) => data.optionValue === selectedWarehouse)[0]
                            : ''
                        }
                        onChange={(e, val) => {
                          // if (selectedRecords.length > 0 && val?.optionValue !== selectedWarehouse) {
                          //   toastConfig.setToastConfig({
                          //     open: true,
                          //     message: 'All pre-selected records will be deselected if you change the plant.',
                          //     type: 'warning'
                          //   });
                          //   dispatch({
                          //     type: 'selection',
                          //     selectedRecords: []
                          //   });
                          //   localStorage.removeItem(localStorageSelectedRecords);
                          // }
                          setSelectedWarehouse(val && val.optionValue ? val.optionValue : null);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            margin="dense"
                            name="plant"
                            placeholder={routes.warehouse.title}
                            label={routes.warehouse.title}
                            variant="outlined"
                            fullWidth
                            className="m-0"
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                )}
              </Grid>
              <Grid item xs={12} md={5}>
                <Box display="flex" alignItems={'center'}>
                  <Box flexGrow={1}>
                    <SearchBox
                      onChange={handleSearch}
                      className="terms_header_search_bar"
                      value={search}
                      width={isMobile && !isTablet ? '75%' : '100%'}
                    />
                  </Box>
                  {(Number(tabValue) === 0 || Number(tabValue) === 1) && (
                    <Fragment>
                      {permissions?.transferAsset?.isCreate &&
                        getLocalStorageArrayData(`${localStorageSelectedRecords}`).length !== 0 &&
                        !checkUniqWarehouse() && (
                          <Box pl={1}>
                            <Button
                              style={{ minWidth: 'max-content' }}
                              size="small"
                              color="primary"
                              onClick={() => {
                                setShowTransferAssetDialog(true);
                              }}
                              variant={isMobile && !isTablet ? 'text' : 'contained'}
                              disabled={isAdding || serializedProducts.some((d) => d?.qty < 0)}
                              className={`${isMobile && !isTablet ? 'mobile_button' : ''} new-dropdown-v1 `}
                              endIcon={isAdding && <CircularProgress size={20} />}
                            >
                              {'Transfer to Job Plant'}
                              {getLocalStorageArrayData(`${localStorageSelectedRecords}`).length
                                ? ' (' + getLocalStorageArrayData(`${localStorageSelectedRecords}`).length + ')'
                                : ''}
                            </Button>
                          </Box>
                        )}
                      <Box pl={1}>
                        <HtmlTooltip
                          title={
                            getLocalStorageArrayData(`${localStorageSelectedRecords}`).length !== 0 && !checkUniqWarehouse()
                              ? 'Direct transfer to customer location'
                              : referenceType === 'Rental Job'
                              ? 'Add to Job'
                              : referenceType === 'ReplaceAsset'
                              ? 'Replace'
                              : 'Add'
                          }
                        >
                          <Button
                            color="primary"
                            size="small"
                            style={{ minWidth: 'max-content' }}
                            onClick={() => {
                              if (referenceType === 'Rental Job' && checkMTRValidation) {
                                if ([...getLocalStorageArrayData(localStorageSelectedRecords)]?.some((e) => e.mtrAttached !== true)) {
                                  setMtrConfirmBox(true);
                                } else {
                                  addSerializedAsset([...getLocalStorageArrayData(localStorageSelectedRecords)]);
                                }
                              } else {
                                addSerializedAsset([...getLocalStorageArrayData(localStorageSelectedRecords)]);
                              }
                            }}
                            variant={isMobile && !isTablet ? 'text' : 'contained'}
                            disabled={
                              getLocalStorageArrayData(`${localStorageSelectedRecords}`).length === 0 ||
                              isAdding ||
                              serializedProducts.some((d) => d?.qty < 0)
                            }
                            className={`${isMobile && !isTablet ? 'mobile_button' : ''}  `}
                            endIcon={isAdding && <CircularProgress size={20} />}
                          >
                            {referenceType === 'Rental Job' ? 'Add to Job' : referenceType === 'ReplaceAsset' ? 'Replace' : 'Add'}
                            {getLocalStorageArrayData(`${localStorageSelectedRecords}`).length
                              ? ' (' + getLocalStorageArrayData(`${localStorageSelectedRecords}`).length + ')'
                              : ''}
                          </Button>
                        </HtmlTooltip>
                      </Box>
                    </Fragment>
                  )}
                  {Number(tabValue) === 2 && (
                    <Box ml={2}>
                      <HtmlTooltip title={'Add to Job'}>
                        <Button
                          color="primary"
                          size="small"
                          style={{ minWidth: 'max-content' }}
                          onClick={() => {
                            setInuseAssetConfirmBox(true);
                          }}
                          variant={isMobile && !isTablet ? 'text' : 'contained'}
                          disabled={isAdding || checkUniqRentalJob()}
                          className={`${isMobile && !isTablet ? 'mobile_button' : ''}  `}
                          endIcon={isAdding && <CircularProgress size={20} />}
                        >
                          {`Add to Job`}
                          {getLocalStorageArrayData(`${localStorageSelectedRecords}`).length
                            ? ' (' + getLocalStorageArrayData(`${localStorageSelectedRecords}`).length + ')'
                            : ''}
                        </Button>
                      </HtmlTooltip>
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>
            {referenceType === 'Rental Job' && (
              <Grid container spacing={2}>
                <Grid item>
                  <CustomTabs value={tabValue} onChange={handleMainTabChange}>
                    <CustomTab value={0} index={0} label={'Assets'} {...a11yProps(0)} />
                    {permissions?.sublease && <CustomTab className={'tabLayout'} value={1} index={1} label={'Sublease Assets'} {...a11yProps(1)} />}
                    <CustomTab className={'tabLayout'} value={2} index={2} label={'In Use Assets'} {...a11yProps(2)} />
                  </CustomTabs>
                </Grid>
              </Grid>
            )}
            <div className={'listing-grid'}>
              {Object.keys(frameWorkComponent).length > 0 && columns ? (
                <CustomAgGrid
                  columns={Number(tabValue) === 2 ? columns : columns?.filter((e: any) => e.field !== 'rentalJob')}
                  dataRows={dataRows}
                  frameworkComponents={frameWorkComponent}
                  setGridApi={setGridApi}
                  dispatch={dispatch}
                  rowCount={rowCount}
                  limit={limit}
                  pageSizes={pageSizes}
                  page={page}
                  allowAction={false}
                  loading={loading}
                  customGridOptions={{ getRowStyle: getRowStyleScheduled }}
                  renderedFrom={renderedFrom}
                  showOnlyShowFilteredRecordSwitch={true}
                  refreshGrid={fetchAssets}
                />
              ) : (
                <Box p={2} height={500}>
                  <CommonSkeleton lenArray={[...Array(10).keys()]} />
                </Box>
              )}
            </div>
          </Box>
        </CustomDialogContent>
      </Dialog>
      {showTransferAssetDialog && (
        <ManageTransferAsset
          isClone={false}
          transferAssetId={null}
          onClose={() => setShowTransferAssetDialog(false)}
          onSuccess={(data) => {
            handleAddAssetToTransferAsset(data?._id);
          }}
          referenceId={referenceData._id}
          referenceType={referenceType}
          referenceData={{
            transferFromPlant: getLocalStorageArrayData(`${localStorageSelectedRecords}`)[0]?.warehouseId,
            transferToPlant: referenceData?.warehouse,
            wellName: referenceData?.wellName,
            wellNumber: referenceData?.wellNumber,
            afeNumber: referenceData?.afeNumber
          }}
        />
      )}
      {showTicketDialog.open && (
        <ManageDeliveryTicket
          ticketType={DELIVERY_TICKET_TYPE.receiving}
          referenceType={DELIVERY_TICKET_REFERENCE_TYPE.rentalJob}
          referenceData={showTicketDialog.data}
          productInventory={getLocalStorageArrayData(`${localStorageSelectedRecords}`)}
          products={[]}
          onClose={() => setShowTicketDialog({ open: false, data: {}, assets: [] })}
          onSuccess={(data) => {
            handleCreateLoadingTicketAddAsstes(data);
          }}
        />
      )}
      {mtrConfirmBox && (
        <ConfirmationDialog
          open={mtrConfirmBox}
          okBtnLoading={isAdding}
          message={`MTR(s) missing for some or all line items.`}
          onClose={() => {
            setMtrConfirmBox(false);
          }}
          onOk={() => {
            addSerializedAsset([...getLocalStorageArrayData(localStorageSelectedRecords)]);
            setMtrConfirmBox(false);
          }}
        />
      )}
      {inuseAssetConfirmBox && (
        <ConfirmationDialog
          open={inuseAssetConfirmBox}
          okBtnLoading={isAdding}
          message={`Do you want to move the assets to the new rental job?`}
          onClose={() => {
            setInuseAssetConfirmBox(false);
          }}
          onOk={() => {
            handleAutoTransferAssets();
            setInuseAssetConfirmBox(false);
          }}
        />
      )}
    </Fragment>
  );
};

export default AddSerializedAsset;
