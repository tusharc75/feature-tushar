import { Box, Button, CircularProgress, Dialog, TextField } from '@material-ui/core';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import { ListingPageHeader } from 'src/components/PageHeaders';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import {
  ASSET_STATUS,
  CustomDialogTransition,
  deliveryTicket,
  gridLoadingTimeout,
  prepareDataForGrid,
  rentalManagement,
  serializedAsset,
  sidebarResource,
  transferAsset
} from 'src/constants/helpers';
import axiosInstance from 'src/axios/axiosInstance';
import CustomTabs, { CustomTab } from 'src/components/CustomTabs';
import axios, { CancelTokenSource } from 'axios';
import { Autocomplete } from '@material-ui/lab';
import { isMobile, isTablet } from 'react-device-detect';
import { camelCase, map, uniq } from 'lodash';
import ManageTransferAsset from 'src/pages/TransferAssets/ManageTransferAsset';
import AssetDetailsChangeDialog from 'src/pages/RentalManagement/ReceivingTicket/AssetDetailsChangeDialog';
import { Link } from 'react-router-dom';

const AddExistingSerializedAssetDialog = ({ handleClose, handleSucess, referenceData = null }) => {
  const renderedFrom = `${camelCase(routes.serializedAsset.title)}`;
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer();
  const { page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { generateColumns } = useColumns();

  const {
    state: { permissions, selectedEntity }
  }: any = useData();

  const [columns, setColumns] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [checkMTRValidation, setCheckMTRValidation] = useState(false);
  const [mtrConfirmBox, setMtrConfirmBox] = useState(false);
  const [warehouseOption, setWarehouseOption] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(
    referenceData && referenceData?.warehouse ? referenceData?.warehouse?.optionValue : null
  );
  const [showTransferAssetDialog, setShowTransferAssetDialog] = useState({ open: false, data: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inuseAssetConfirmBox, setInuseAssetConfirmBox] = useState(false);
  const [assetPolicyData, setAssetPolicyData] = useState(null);
  const [openAssetDataDialog, setOpenAssetDataDialog] = useState({ open: false, statusPolicy: null, _ids: null, type: '' });
  const [underReviewAssetData, setUnderReviewAssetData] = useState(null);

  useEffect(() => {
    fetchGridColumns();
    fetchPolicy();
  }, []);

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${serializedAsset.resource}&view=true`)
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

  const fetchPolicy = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.serializedAsset}`);
      if (data) {
        setAssetPolicyData(data);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  useEffect(() => {
    axiosInstance()
      .get('/sa-formbuilder/lookup?lookupResource=Warehouse')
      .then(({ data: { data } }) => {
        setWarehouseOption(data['Warehouse']);
      });
  }, []);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly, tabValue, selectedWarehouse]);

  const fetchData = (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });

    let queryString = getQueryString();

    let api = '';
    if (Number(tabValue) === 2) {
      api = `${serializedAsset.api}/in-use${queryString}`;
    } else {
      api = `${serializedAsset.api}${queryString}`;
    }

    axiosInstance()
      .get(api, { cancelToken: cancelTokenSource?.token })
      .then(({ data }) => {
        let rows = data.data.map((u) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['isChecked'] = false;
          if (Number(tabValue) === 2) {
            finalObject['rentalJob'] = u.loadingTicket?.rentalJob;
            finalObject['loadingTicket'] = u.loadingTicket;
          }
          return {
            ...finalObject
          };
        });
        dispatch({
          type: 'selection',
          selectedRecords: selectedRecords || []
        });
        dispatch({ type: 'initialize', data: rows, count: data.count });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}&rental=true`;

    if (selectedWarehouse) {
      deepFilter = `${deepFilter}&plant=${selectedWarehouse}`;
    }
    if (referenceData?.rentalJob) {
      deepFilter = `${deepFilter}&rentalJobId=${referenceData?.rentalJob}`;
    }

    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || []).map((m) => m._id))}`;
    }

    const { filterByIds, deepFilters } = gridFilterParser(filters);
    if (filterByIds?.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
    }
    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}`;
    }
    if (filterByIds?.length || deepFilters?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
    }
    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    if (search) {
      deepFilter = `${deepFilter}&search=${search}`;
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

  const handleMainTabChange = (event: any, newValue: number) => {
    setTabValue(newValue);
    if (((tabValue === 0 || tabValue === 1) && newValue === 2) || ((newValue === 0 || newValue === 1) && tabValue === 2)) {
      dispatch({ type: 'selection', selectedRecords: [] });
    }
  };

  const checkUniqWarehouse = () => {
    if (selectedRecords?.length === 0) {
      return true;
    } else if (uniq(map(selectedRecords, 'warehouseId')).length === 1) {
      if (uniq(map(selectedRecords, 'warehouseId'))[0] === null || uniq(map(selectedRecords, 'warehouseId'))[0] === undefined) {
        return true;
      }
      if (uniq(map(selectedRecords, 'warehouseId'))[0] === referenceData?.warehouse?.optionValue) {
        return true;
      }
      return false;
    } else {
      return true;
    }
  };

  const handleAddAsset = async (assetsData: any = null) => {
    setIsSubmitting(true);
    const assetsAdd: any = [];
    selectedRecords?.forEach((item) => {
      const obj: any = {};
      obj.asset = item?._id;
      if (assetsData) {
        const matchedAsset = assetsData?.find((asset) => asset._id === obj.asset);
        if (matchedAsset) {
          const { _id, ...assetData } = matchedAsset;
          obj.assetData = assetData;
        }
      }
      assetsAdd.push(obj);
    });
    axiosInstance()
      .post(`${rentalManagement.api}/productpackage/${referenceData?.rentalJob}/assets`, { assets: assetsAdd })
      .then(() => {
        handleSucess();
        setIsSubmitting(false);
      })
      .catch((error) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleAddAssetToTransferAsset = (transferAssetId) => {
    setIsSubmitting(true);
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
        handleAddAsset(showTransferAssetDialog.data);
        setShowTransferAssetDialog({ open: false, data: null });
        setIsSubmitting(false);
      })
      .catch((error) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleAutoTransferAssets = (underReviewAssetsData = null, reserveAssetsData = null) => {
    const assetsAdd: any = [];
    selectedRecords?.forEach((item) => {
      const obj: any = {};
      obj._id = null;
      obj.asset = item?._id;
      obj.product = item?.productId;
      obj.rentalJob = item?.loadingTicket?.rentalJob?.optionValue;
      const rentalAsset = item?.loadingTicket?.assets?.find((ele) => ele.asset === item?._id);
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
    });
    setIsSubmitting(true);
    axiosInstance()
      .post(`${deliveryTicket.api}/auto-transfer-inuse-assets`, {
        assets: assetsAdd,
        rentalJob: referenceData?.rentalJob
      })
      .then(({ data }) => {
        setIsSubmitting(false);
        handleSucess();
        setInuseAssetConfirmBox(false);
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

  const leftSideContentsOfSearchFilter = () => {
    return (
      <Box mt={0.5} width={'30%'}>
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
      </Box>
    );
  };

  const rightSideContents = () => {
    return (
      <Box>
        {(Number(tabValue) === 0 || Number(tabValue) === 1) && (
          <>
            {permissions?.transferAsset?.isCreate && selectedRecords?.length !== 0 && !checkUniqWarehouse() && (
              <Button
                style={{ minWidth: 'max-content', marginRight: '10px' }}
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
                disabled={isSubmitting}
                className={`${isMobile && !isTablet ? 'mobile_button' : ''}  `}
                endIcon={isSubmitting && <CircularProgress size={20} />}
              >
                {`Transfer to ${referenceData?.warehouse?.optionLabel}`}
                {selectedRecords?.length ? ' (' + selectedRecords?.length + ')' : ''}
              </Button>
            )}
            <Button
              variant="contained"
              color="primary"
              size="small"
              disabled={isSubmitting || selectedRecords?.length === 0}
              onClick={() => {
                if (checkAssetPolicy(ASSET_STATUS.reserved)) {
                  const { statusPolicy, assetIds } = checkAssetPolicy(ASSET_STATUS.reserved);
                  setOpenAssetDataDialog({
                    open: true,
                    statusPolicy: statusPolicy,
                    _ids: assetIds,
                    type: 'add'
                  });
                } else if (checkMTRValidation) {
                  if (selectedRecords?.some((e) => e.mtrAttached !== true)) {
                    setMtrConfirmBox(true);
                  } else {
                    handleAddAsset();
                  }
                } else {
                  handleAddAsset();
                }
              }}
              endIcon={isSubmitting && <CircularProgress size={20} />}
            >
              Add {selectedRecords?.length > 0 ? `(${selectedRecords?.length})` : ''}
            </Button>
          </>
        )}
        {Number(tabValue) === 2 && (
          <Button
            variant="contained"
            color="primary"
            size="small"
            disabled={isSubmitting || selectedRecords?.length === 0}
            onClick={() => {
              setInuseAssetConfirmBox(true);
            }}
            endIcon={isSubmitting && <CircularProgress size={20} />}
          >
            Add {selectedRecords?.length > 0 ? `(${selectedRecords?.length})` : ''}
          </Button>
        )}
      </Box>
    );
  };

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      TransitionComponent={CustomDialogTransition}
      fullScreen={true}
      open={true}
      onClose={handleClose}
      aria-labelledby="assign-roles-dialog"
    >
      <CustomDialogHeader
        title={`Add ${routes.serializedAsset.title}`}
        showManimizeMaximize={false}
        showRequiredLabel={false}
        onClose={handleClose}
      />
      <CustomDialogContent isFooterPresent={false}>
        <ListingPageHeader
          showSearchInMobile={true}
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={false}
          leftSideContentsOfSearchFilter={leftSideContentsOfSearchFilter()}
          rightSideContents={rightSideContents()}
          isAddButtonVisible={false}
          setQueryString={false}
        />
        <Box pt={1}>
          <CustomTabs value={tabValue} onChange={handleMainTabChange}>
            <CustomTab value={0} label={'Assets'} />
            {permissions?.sublease && <CustomTab value={1} label={'Sublease Assets'} />}
            <CustomTab value={2} label={'In Use Assets'} />
          </CustomTabs>
        </Box>
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            state={state}
            columns={Number(tabValue) === 2 ? columns : columns?.filter((e: any) => e.accessor !== 'rentalJob')}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            showOnlyShowFilteredRecordSwitch={true}
            showFilters={true}
            resource={sidebarResource.serializedAsset}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomDialogContent>
      {mtrConfirmBox && (
        <ConfirmationDialog
          open={mtrConfirmBox}
          okBtnLoading={false}
          message={`MTR(s) missing for some or all line items.`}
          onClose={() => {
            setMtrConfirmBox(false);
          }}
          onOk={() => {
            handleAddAsset();
            setMtrConfirmBox(false);
          }}
        />
      )}
      {showTransferAssetDialog.open && (
        <ManageTransferAsset
          isClone={false}
          transferAssetId={null}
          onClose={() => setShowTransferAssetDialog({ open: false, data: null })}
          onSuccess={(data) => {
            handleAddAssetToTransferAsset(data?._id);
          }}
          referenceId={referenceData?.rentalJob}
          referenceType={'Rental Job'}
          referenceData={{
            transferFromPlant: selectedRecords[0]?.warehouseId,
            transfertoPlant: referenceData?.warehouse?.optionValue,
            wellName: referenceData?.wellName?.optionValue,
            wellNumber: referenceData?.wellNumber,
            afeNumber: referenceData?.afeNumber,
            transferType: 'Internal'
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
            if (checkAssetPolicy(ASSET_STATUS.underReview)) {
              const { statusPolicy, assetIds } = checkAssetPolicy(ASSET_STATUS.underReview);
              setOpenAssetDataDialog({
                open: true,
                statusPolicy: statusPolicy,
                _ids: assetIds,
                type: 'underReview'
              });
            } else if (checkAssetPolicy(ASSET_STATUS.reserved)) {
              const { statusPolicy, assetIds } = checkAssetPolicy(ASSET_STATUS.reserved);
              setOpenAssetDataDialog({
                open: true,
                statusPolicy: statusPolicy,
                _ids: assetIds,
                type: 'reserved'
              });
            } else {
              handleAutoTransferAssets();
            }
          }}
        />
      )}
      {openAssetDataDialog.open && (
        <AssetDetailsChangeDialog
          ids={openAssetDataDialog._ids}
          statusPolicy={openAssetDataDialog.statusPolicy}
          setAssetsData={() => {}}
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
                handleAddAsset(data);
                setOpenAssetDataDialog({ open: false, statusPolicy: null, _ids: null, type: '' });
              } else {
                setShowTransferAssetDialog({ open: true, data: data });
                setOpenAssetDataDialog({ open: false, statusPolicy: null, _ids: null, type: '' });
              }
            }
          }}
          staticLookUpFilters={{ wellNumber: referenceData?.wellNumber }}
        />
      )}
    </Dialog>
  );
};

export default AddExistingSerializedAssetDialog;
