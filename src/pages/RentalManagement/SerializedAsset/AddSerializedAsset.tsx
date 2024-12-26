import { Box, CircularProgress } from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog/Dialog';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import { camelCase, isString, map, uniq } from 'lodash';
import { Fragment, useCallback, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { Link } from 'react-router-dom';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CustomTabs, { CustomTab } from 'src/components/CustomTabs';
import MessageDialog from 'src/components/Helpers/MessageDialog';
import ManageDeliveryTicket from 'src/pages/DeliveryTicket/ManageDeliveryTicket';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import routes from '../../../components/Helpers/Routes';
import SearchBox from '../../../components/Helpers/SearchBox';
import {
  ASSET_STATUS,
  CustomDialogTransition,
  DELIVERY_FROM_TO_TYPE,
  DELIVERY_TICKET_REFERENCE_TYPE,
  DELIVERY_TICKET_STATUS,
  DELIVERY_TICKET_TYPE,
  deliveryTicket,
  gridLoadingTimeout,
  MATERIAL_TYPE,
  prepareDataForGrid,
  rentalManagement,
  serializedAsset,
  sidebarResource,
  transferAsset
} from '../../../constants/helpers';
import ManageTransferAsset from '../../TransferAssets/ManageTransferAsset';
import axios, { CancelTokenSource } from 'axios';
import AssetDetailsChangeDialog from '../ReceivingTicket/AssetDetailsChangeDialog';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { Add } from '@mui/icons-material';

const AddSerializedAsset = ({
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
  handleSuccess = null,
  chartOfAccount = null,
  replaceAssets = false,
  assetPolicyData = null,
  selectedRecordsOfMain = [],
  ids = []
}) => {
  const renderedFrom = `${camelCase(sidebarResource?.serializedAsset)}`;
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { generateColumns } = useColumns();

  const {
    state: { permissions, user, resources }
  }: any = useData();

  const [serializedProducts, setSerializedProducts] = useState([]);
  const [columns, setColumns] = useState(null);
  const [showTransferAssetDialog, setShowTransferAssetDialog] = useState({ open: false, data: null });
  const [warehouseOption, setWarehouseOption] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(filterByPlant?.optionValue);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [showTicketDialog, setShowTicketDialog] = useState({ open: false, data: {}, assets: [] });
  const [checkMTRValidation, setCheckMTRValidation] = useState(false);
  const [mtrConfirmBox, setMtrConfirmBox] = useState(false);
  const [inuseAssetConfirmBox, setInuseAssetConfirmBox] = useState(false);
  const [certificateExpireAlert, setCertificateExpireAlert] = useState({ open: false, asset: '' });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openAssetDataDialog, setOpenAssetDataDialog] = useState({ open: false, statusPolicy: null, _ids: null, type: '' });
  const [underReviewAssetData, setUnderReviewAssetData] = useState(null);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchAssets(cancelTokenSource);
    return () => cancelTokenSource.cancel();
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
        let newColumns = generateColumns(renderedFrom, data, routes.serializedAssetDetail.path);
        const inUseColoumns: any = [
          {
            accessor: 'rentalJob',
            Header: 'Rental Job',
            minWidth: 180,
            width: 180,
            Cell: ({ row }) => (
              <Link
                className="link text-truncate"
                target="_blank"
                to={`${routes.rentalManagementDetail.path}/${row?.original?.rentalJob?.optionValue}`}
              >
                {row?.original?.rentalJob?.optionLabel}
              </Link>
            )
          }
        ];

        setColumns([...inUseColoumns, ...newColumns, ...getStaticFields()]);
      });
  };

  useEffect(() => {
    let tempProducts = serializedProducts;
    const alreadyStoredSelectedRecords = selectedRecords;
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

  const fetchAssets = (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });

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
      api = `${serializedAsset.api}/in-use${queryString}&rentalJobId=${referenceData?._id}`;
    } else {
      api = `${serializedAsset.api}${queryString}`;
    }
    axiosInstance()
      .get(api, { cancelToken: cancelTokenSource?.token })
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
    const ignoreIds = ids && ids?.length > 0 ? ids : [];
    let deepFilter = `?page=${page}&limit=${limit}&ignoreIds=${JSON.stringify(ignoreIds)}`;
    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || [])?.map((m) => m._id))}`;
    }
    const { deepFilters } = gridFilterParser(filters);
    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}&filterType=and`;
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
        if (chartOfAccount) {
          deepFilter = `${deepFilter}&repairJob=true&chartOfAccount=${chartOfAccount?.optionValue}`;
        } else {
          deepFilter = `${deepFilter}&repairJob=true`;
        }
      } else if (referenceType === 'Transfer Asset') {
        deepFilter = `${deepFilter}&transferable=true&transferAssetId=${referenceData?._id}`;
      } else if (referenceType === 'Rental Job') {
        const dateFilter = { from: referenceData?.fromDate, to: referenceData?.toDate };
        deepFilter = `${deepFilter}&rental=true&rentalJobId=${referenceData?._id}&date=${JSON.stringify(dateFilter)}`;
      } else {
        deepFilter = `${deepFilter}&availableAsset=true`;
      }
    }

    if (referenceType !== 'Transfer Asset') {
      if (Number(tabValue) === 1) {
        deepFilter = `${deepFilter}&subleaseAsset=1`;
      } else {
        deepFilter = `${deepFilter}&subleaseAsset=0`;
      }
    }

    return deepFilter;
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const getRowStyleScheduled = (params) => {
    if (params?.reserved) {
      return 'dark-gray';
    } else if ([ASSET_STATUS.available, ASSET_STATUS.new]?.includes(params?.status)) {
      return 'dark-green';
    } else if ([ASSET_STATUS.inUse]?.includes(params?.status)) {
      return 'dark-yellow';
    }
    return '';
  };

  const checkUniqWarehouse = () => {
    if (selectedRecords?.length === 0) {
      return true;
    } else if (uniq(map(selectedRecords, 'warehouseId')).length === 1) {
      if (uniq(map(selectedRecords, 'warehouseId'))[0] === null || uniq(map(selectedRecords, 'warehouseId'))[0] === undefined) {
        return true;
      }
      if (uniq(map(selectedRecords, 'warehouseId'))[0] === filterByPlant?.optionValue) {
        return true;
      }
      return false;
    } else {
      return true;
    }
  };

  const checkUniqRentalJob = () => {
    if (selectedRecords?.length === 0) {
      return true;
    } else {
      return false;
    }
  };

  const handleAddAssetToTransferAsset = (transferAssetId) => {
    axiosInstance()
      .put(`${transferAsset.api}/add-asset-complete-transfer-asset/${transferAssetId}`, {
        assets: selectedRecords?.map((s) => {
          return {
            _id: s._id,
            currentStatus: s.status
          };
        })
      })
      .then(({ data }) => {
        fetchAssets();
        setShowTransferAssetDialog({ open: false, data: null });
        addSerializedAsset(selectedRecords, true, showTransferAssetDialog.data);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleMainTabChange = (event: any, newValue: number) => {
    setTabValue(newValue);
    if (((tabValue === 0 || tabValue === 1) && newValue === 2) || ((newValue === 0 || newValue === 1) && tabValue === 2)) {
      dispatch({ type: 'selection', selectedRecords: [] });
    }
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

  const handleAutoTransferAssets = (underReviewAssetsData = null, reserveAssetsData = null) => {
    const assetsAdd: any = [];
    selectedRecordsOfMain?.forEach((e: any) => {
      if (e.type === MATERIAL_TYPE.product) {
        let qty = e.realAssetQty - e.realAssetAssignedQty;
        while (qty) {
          const result = selectedRecords?.filter((f) => f.productId === e.materialId && !f.isCounted);
          if (result.length) {
            let obj: any = {};
            obj._id = e._id;
            obj.product = e.materialId;
            obj.asset = result[0]._id;
            obj.rentalJob = result[0].loadingTicket?.rentalJob?.optionValue;
            const rentalAsset = result[0].loadingTicket?.assets?.find((ele) => ele.asset === result[0]._id);
            if (rentalAsset) {
              obj.uniqueId = rentalAsset?.uniqueId;
            }
            if (underReviewAssetsData) {
              const matchedAsset = underReviewAssetsData?.find((asset) => asset._id === obj.asset);
              if (matchedAsset) {
                const { _id, ...assetData } = matchedAsset;
                obj.underReviewAssetsData = assetData;
              }
            }
            if (reserveAssetsData) {
              const matchedAsset = reserveAssetsData?.find((asset) => asset._id === obj.asset);
              if (matchedAsset) {
                const { _id, ...assetData } = matchedAsset;
                obj.reserveAssetsData = assetData;
              }
            }
            assetsAdd.push(obj);
            result[0].isCounted = true;
          }
          qty--;
        }
      }
    });
    setIsSubmitting(true);
    axiosInstance()
      .post(`${deliveryTicket.api}/auto-transfer-inuse-assets`, { assets: assetsAdd, rentalJob: referenceData?._id })
      .then(({ data }) => {
        setInuseAssetConfirmBox(false);
        handleSuccess();
        setIsSubmitting(false);
      })
      .catch((error) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  const checkAssetPolicy = (status) => {
    let result: any = null;
    const statusPolicy = assetPolicyData?.policy?.statusChangeFields?.find((ele) => ele.status === status);
    if (statusPolicy) {
      if (statusPolicy?.products && statusPolicy?.products?.length > 0) {
        const assetIds = selectedRecords?.filter((r) => statusPolicy?.products?.includes(r?.productId))?.map((a) => a?._id);
        if (assetIds && assetIds?.length > 0) {
          result = { statusPolicy: statusPolicy, assetIds: assetIds };
        }
      } else {
        result = { statusPolicy: statusPolicy, assetIds: selectedRecords?.map((a) => a?._id) };
      }
    }
    return result;
  };

  const handleAddButtonClick = useCallback(() => {
    if (referenceType === 'Rental Job') {
      if (
        user?.user?.brandPolicy?.serializedAssetCertification &&
        selectedRecords?.some((e) => e.certificateExpiryDate && new Date(e.certificateExpiryDate)?.getTime() <= new Date()?.getTime())
      ) {
        setCertificateExpireAlert({
          open: true,
          asset: selectedRecords
            ?.filter((e) => e.certificateExpiryDate && new Date(e.certificateExpiryDate)?.getTime() <= new Date()?.getTime())
            ?.map((e) => e.assetNumber)
            ?.toString()
        });
        return;
      } else if (checkAssetPolicy(ASSET_STATUS.reserved)) {
        const { statusPolicy, assetIds } = checkAssetPolicy(ASSET_STATUS.reserved);
        setOpenAssetDataDialog({
          open: true,
          statusPolicy: statusPolicy,
          _ids: assetIds,
          type: 'add'
        });
        return;
      } else if (checkMTRValidation) {
        if (selectedRecords?.some((e) => e.mtrAttached !== true)) {
          setMtrConfirmBox(true);
          return;
        } else {
          addSerializedAsset(selectedRecords);
          return;
        }
      } else {
        addSerializedAsset(selectedRecords);
        return;
      }
    }
    addSerializedAsset(selectedRecords);
  }, [
    addSerializedAsset,
    assetPolicyData?.policy?.statusChangeFields,
    checkMTRValidation,
    referenceType,
    selectedRecords,
    user?.user?.brandPolicy?.serializedAssetCertification
  ]);

  return (
    <Fragment>
      <Dialog
        disableEnforceFocus
        fullScreen={true}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        open={true}
      >
        <CustomDialogHeader
          showRequiredLabel={false}
          title={`${replaceAssets ? 'Replace' : 'Add'} ${resources?.serializedAsset?.titleSingular}`}
          onClose={handleSerializedAssetClose}
        ></CustomDialogHeader>
        <CustomDialogContent isFooterPresent={false}>
          <Box pt={1} pb={1} className="main-container-v1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-grow flex-wrap items-center gap-2">
                {serializedProducts.length > 0
                  ? serializedProducts.map((d, i) => (
                    <Box
                      border={1}
                      className={`cursor-pointer p-2 text-[13px] ${selectedProduct === d.id ? 'bg-[var(--dark-secondary,_var(--primary))] text-white' : 'dark:text-gray-300'
                        }`}
                      borderColor="var(--common-border-color)"
                      id={`serialized-products-${i}`}
                      onClick={() => {
                        if (selectedProduct === d.id) {
                          setSelectedProduct(null);
                        } else {
                          setSelectedProduct(d.id);
                        }
                      }}
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
                {serializedProducts.length > 0 && serializedProducts.some((s) => s.qty < 0) ? (
                  <div className="text-error font-weight-bold">You have selected more assets than required</div>
                ) : (
                  ''
                )}
              </div>
              <div>
                {referenceType === 'Rental Job' && (
                  <Autocomplete
                    style={{ minWidth: '230px' }}
                    fullWidth
                    options={warehouseOption}
                    getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
                    isOptionEqualToValue={(option: any, val) => option.optionValue === val}
                    value={
                      warehouseOption.filter((data) => data.optionValue === selectedWarehouse).length
                        ? warehouseOption.filter((data) => data.optionValue === selectedWarehouse)[0]
                        : ''
                    }
                    onChange={(e, val) => {
                      setSelectedWarehouse(val && val.optionValue ? val.optionValue : null);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        margin="dense"
                        size="small"
                        name="plant"
                        placeholder={resources?.warehouse?.titleSingular}
                        label={resources?.warehouse?.titleSingular}
                        variant="outlined"
                        fullWidth
                        className="m-0"
                      />
                    )}
                  />
                )}
              </div>
              <div className="ml-auto flex flex-grow flex-wrap items-center justify-end gap-2">
                <SearchBox onChange={handleSearch} value={search} />
                {(Number(tabValue) === 0 || Number(tabValue) === 1) && (
                  <Fragment>
                    {permissions?.transferAsset?.isCreate && selectedRecords?.length !== 0 && !checkUniqWarehouse() && (
                      <Button
                        style={{ minWidth: 'max-content' }}
                        size="small"
                        color="primary"
                        onClick={() => {
                          if (checkAssetPolicy(ASSET_STATUS.reserved)) {
                            const { statusPolicy, assetIds } = checkAssetPolicy(ASSET_STATUS.reserved);
                            setOpenAssetDataDialog({
                              open: true,
                              statusPolicy: statusPolicy,
                              _ids: assetIds,
                              type: 'transfer'
                            });
                          } else {
                            setShowTransferAssetDialog({ open: true, data: null });
                          }
                        }}
                        variant={isMobile && !isTablet ? 'text' : 'contained'}
                        disabled={isAdding || serializedProducts.some((d) => d?.qty < 0)}
                        className={`${isMobile && !isTablet ? 'mobile_button' : ''}  `}
                        endIcon={isAdding && <CircularProgress size={20} />}
                      >
                        {`Transfer to ${filterByPlant?.optionLabel}`}
                        {selectedRecords?.length ? ' (' + selectedRecords?.length + ')' : ''}
                      </Button>
                    )}

                    <ThemeButton
                      iconForMobile={<Add />}
                      borderColor="none"
                      tooltip={
                        selectedRecords?.length !== 0 && !checkUniqWarehouse()
                          ? 'Direct transfer to customer location'
                          : referenceType === 'Rental Job'
                            ? 'Add to Job'
                            : replaceAssets
                              ? 'Replace'
                              : 'Add'
                      }
                      color="primary"
                      size="small"
                      id={'add-to-job-button'}
                      style={{ minWidth: 'max-content' }}
                      onClick={handleAddButtonClick}
                      disabled={selectedRecords?.length === 0 || isAdding || serializedProducts.some((d) => d?.qty < 0)}
                      className={`${isMobile && !isTablet ? 'mobile_button' : ''}  `}
                      endIcon={isAdding && <CircularProgress size={20} />}
                    >
                      {referenceType === 'Rental Job' ? 'Add to Job' : replaceAssets ? 'Replace' : 'Add'}
                      {selectedRecords?.length ? ' (' + selectedRecords?.length + ')' : ''}
                    </ThemeButton>
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
                        disabled={isSubmitting || checkUniqRentalJob() || serializedProducts.some((d) => d?.qty < 0)}
                        className={`${isMobile && !isTablet ? 'mobile_button' : ''}  `}
                        endIcon={isSubmitting && <CircularProgress size={20} />}
                      >
                        {`Add to Job`}
                        {selectedRecords?.length ? ' (' + selectedRecords?.length + ')' : ''}
                      </Button>
                    </HtmlTooltip>
                  </Box>
                )}
              </div>
            </div>

            {['Rental Job', 'RentalJobReplaceAsset', 'RentalJobSwapAsset'].includes(referenceType) && (
              <Box pt={1}>
                <CustomTabs value={tabValue} onChange={handleMainTabChange}>
                  <CustomTab value={0} label={'Assets'} />
                  {permissions?.sublease && <CustomTab value={1} label={'Sublease Assets'} />}
                  {['Rental Job'].includes(referenceType) && <CustomTab value={2} label={'In Use Assets'} />}
                </CustomTabs>
              </Box>
            )}
            <Box>
              {columns ? (
                <CustomReactTable
                  height={referenceType === 'Rental Job' ? 'calc(100vh - 350px)' : 'calc(100vh - 250px)'}
                  columns={Number(tabValue) === 2 ? columns : columns?.filter((e: any) => e.accessor !== 'rentalJob')}
                  state={state}
                  setWholeRowsCellColor={getRowStyleScheduled}
                  dispatch={dispatch}
                  renderedFrom={renderedFrom}
                  refreshGrid={fetchAssets}
                  showOnlyShowFilteredRecordSwitch={true}
                />
              ) : (
                <Box p={2} height={500}>
                  <CommonSkeleton lenArray={[...Array(10).keys()]} />
                </Box>
              )}
            </Box>
          </Box>
        </CustomDialogContent>
      </Dialog>
      {showTransferAssetDialog.open ? (
        <ManageTransferAsset
          isClone={false}
          transferAssetId={null}
          onClose={() => setShowTransferAssetDialog({ open: false, data: null })}
          onSuccess={(data) => {
            handleAddAssetToTransferAsset(data?._id);
          }}
          referenceId={referenceData._id}
          referenceType={referenceType}
          assets={selectedRecords?.map((e) => e._id)}
          referenceData={{
            transferFromPlant: selectedRecords[0]?.warehouseId,
            transfertoPlant: referenceData?.warehouse,
            wellName: referenceData?.wellName,
            wellNumber: referenceData?.wellNumber,
            afeNumber: referenceData?.afeNumber,
            transferType: 'Internal'
          }}
        />
      ) : null}
      {showTicketDialog.open && (
        <ManageDeliveryTicket
          ticketType={DELIVERY_TICKET_TYPE.receiving}
          referenceType={DELIVERY_TICKET_REFERENCE_TYPE.rentalJob}
          referenceData={showTicketDialog.data}
          assets={selectedRecords}
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
            addSerializedAsset(selectedRecords);
            setMtrConfirmBox(false);
          }}
        />
      )}
      {inuseAssetConfirmBox && (
        <ConfirmationDialog
          open={inuseAssetConfirmBox}
          okBtnLoading={isSubmitting}
          message={`Do you want to move the assets to the new rental job?`}
          onClose={() => {
            setInuseAssetConfirmBox(false);
          }}
          onOk={() => {
            const receivingStatus = user?.user?.brandPolicy?.rentalReceivingAvailableStatus ? ASSET_STATUS.available : ASSET_STATUS.underReview;
            if (checkAssetPolicy(receivingStatus)) {
              const { statusPolicy, assetIds } = checkAssetPolicy(receivingStatus);
              setOpenAssetDataDialog({
                open: true,
                statusPolicy: statusPolicy,
                _ids: assetIds,
                type: 'underReview'
              });
            } else {
              handleAutoTransferAssets();
            }
          }}
        />
      )}
      {certificateExpireAlert.open && (
        <MessageDialog
          open={true}
          header="Certification Information"
          message={`Certification has expired for asset(s) - ${certificateExpireAlert.asset}`}
          onClose={() => setCertificateExpireAlert({ open: false, asset: '' })}
        />
      )}
      {openAssetDataDialog.open && (
        <AssetDetailsChangeDialog
          ids={openAssetDataDialog._ids}
          statusPolicy={openAssetDataDialog.statusPolicy}
          setAssetsData={() => { }}
          onClose={() => setOpenAssetDataDialog({ open: false, statusPolicy: null, _ids: null, type: '' })}
          onSuccess={(data) => {
            if (Number(tabValue) === 2) {
              if (checkAssetPolicy(ASSET_STATUS.reserved)) {
                if (openAssetDataDialog.type === 'underReview') {
                  setUnderReviewAssetData(data);
                  const { statusPolicy, assetIds } = checkAssetPolicy(ASSET_STATUS.reserved);
                  setOpenAssetDataDialog({
                    open: true,
                    statusPolicy: statusPolicy,
                    _ids: assetIds,
                    type: 'reserved'
                  });
                } else {
                  handleAutoTransferAssets(underReviewAssetData, data);
                  setOpenAssetDataDialog({ open: false, statusPolicy: null, _ids: null, type: '' });
                }
              } else {
                handleAutoTransferAssets(data);
                setOpenAssetDataDialog({ open: false, statusPolicy: null, _ids: null, type: '' });
              }
            } else {
              if (openAssetDataDialog.type === 'add') {
                addSerializedAsset(selectedRecords, false, data);
              } else {
                setShowTransferAssetDialog({ open: true, data: data });
              }
              setOpenAssetDataDialog({ open: false, statusPolicy: null, _ids: null, type: '' });
            }
          }}
          staticLookUpFilters={{
            wellNumber: referenceData?.wellNumber,
            wellName: referenceData?.wellName ? (isString(referenceData?.wellName) ? [referenceData?.wellName] : referenceData?.wellName) : null
          }}
          productsDefaultData={selectedProducts}
        />
      )}
    </Fragment>
  );
};

export default AddSerializedAsset;
