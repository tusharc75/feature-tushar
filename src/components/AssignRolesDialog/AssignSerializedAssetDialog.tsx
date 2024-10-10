import { Box, Dialog } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import {
  CustomDialogTransition,
  gridLoadingTimeout,
  isObjectEmpty,
  prepareDataForGrid,
  serializedAsset,
  sidebarResource
} from 'src/constants/helpers';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import CommonSkeleton from '../Helpers/CommonSkeleton';
import routes from '../Helpers/Routes';
import { ListingPageHeader } from '../PageHeaders';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import axios, { CancelTokenSource } from 'axios';

const AssignSerializedAssetDialog = ({ reference, referenceData = null, handleClose, handleSucess, ids, isAssigning, selectedProducts = [] }) => {
  const renderedFrom = `${routes.serializedAsset.title}`;
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { generateColumns } = useColumns();

  const {
    state: { permissions, selectedEntity }
  }: any = useData();

  const [disableSaveButton, setDisableSaveButton] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [columns, setColumns] = useState(null);
  const [products, setProducts] = useState([]);
  const [checkMTRValidation, setCheckMTRValidation] = useState(false);
  const [mtrConfirmBox, setMtrConfirmBox] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly, selectedProduct]);

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${serializedAsset.resource}&view=true`)
      .then(({ data: { data } }) => {
        if (reference === 'rentalJob') setCheckMTRValidation(data?.some((e) => e?.fieldData?.fieldName === 'mtrAttached'));
        let newColumns = generateColumns(renderedFrom, data, routes.serializedAssetDetail.path);
        setColumns([...newColumns, ...getStaticFields()]);
      });
  };

  const fetchData = (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    let queryString = getQueryString();
    if (selectedProducts.length > 0) {
      var updatedFilters = [];
      if (selectedProduct) {
        updatedFilters.push({ field: 'product', term: selectedProduct });
      } else {
        updatedFilters = selectedProducts.map((m) => {
          return { field: 'product', term: m?.product ?? '' };
        });
      }
      queryString = `${queryString}&filterById=${JSON.stringify(updatedFilters)}&filterByIdType=or`;
    }
    axiosInstance()
      .get(`${serializedAsset.api}${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data }) => {
        let rows = data.data.map((u) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['isChecked'] = false;
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
    const ignoreIds = ids && ids?.length > 0 ? ids : [];
    let deepFilter = `?page=${page}&limit=${limit}&ignoreIds=${JSON.stringify(ignoreIds)}`;

    if (reference === 'job') {
      deepFilter += '&job=1';
    }
    if (reference === 'repairOrder') {
      deepFilter = `${deepFilter}`;
      deepFilter += '&repairOrder=1';
      if (referenceData?.customerAccount) {
        deepFilter = `${deepFilter}&owner=${referenceData?.customerAccount}`;
      }
      if (referenceData?.warehouse) {
        deepFilter = `${deepFilter}&plant=${referenceData?.warehouse}`;
      }
    }
    if (reference === 'planning') {
      deepFilter = `${deepFilter}&planning=true`;
      const dateFilter = { from: referenceData?.fromDate, to: referenceData?.toDate };
      deepFilter = `${deepFilter}&date=${JSON.stringify(dateFilter)}`;
    }
    if (reference === 'quotation') {
      deepFilter = `${deepFilter}&quotation=true`;
      const dateFilter = { from: referenceData?.fromDate, to: referenceData?.toDate };
      deepFilter = `${deepFilter}&date=${JSON.stringify(dateFilter)}`;
      if (referenceData?.warehouse) {
        deepFilter = `${deepFilter}&plant=${referenceData?.warehouse}`;
      }
    }
    if (reference === 'supplier') {
      deepFilter = `${deepFilter}&subleaseAsset=0`;
    }
    if (reference === 'sublease') {
      deepFilter = `${deepFilter}&masterSubleaseAsset=true&subleaseAsset=0&subleaseId=${referenceData?._id}`;
      if (referenceData?.warehouse) {
        deepFilter = `${deepFilter}&plant=${referenceData?.warehouse}`;
      }
    }
    if (reference === 'rentalJob') {
      deepFilter = `${deepFilter}&rental=true&subleaseAsset=0`;
      if (referenceData?.warehouse) {
        deepFilter = `${deepFilter}&plant=${referenceData?.warehouse}`;
      }
      if (referenceData?.rentalJob) {
        deepFilter = `${deepFilter}&rentalJobId=${referenceData?.rentalJob}`;
      }
    }

    if (reference === 'managedPackages') {
      deepFilter = `${deepFilter}&managedPackages=1`;
      if (referenceData?.warehouse) {
        deepFilter = `${deepFilter}&plant=${referenceData?.warehouse}`;
      }
    }

    if (reference === 'workOrder_assign_asset') {
      if (referenceData?.warehouse) {
        deepFilter = `${deepFilter}&plant=${referenceData?.warehouse}`;
      }
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
    return deepFilter;
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  useEffect(() => {
    let tempProducts = [];
    selectedProducts?.map((d) => {
      const alreadyAdded = tempProducts.find((obj) => obj.id === d.product);
      if (alreadyAdded) {
        alreadyAdded.qty = d?.qty + alreadyAdded.qty;
      } else {
        tempProducts.push({ id: d.product, name: d.productName, qty: d?.qty });
      }
    });
    tempProducts?.forEach((e) => {
      e.qty = e?.qty - selectedRecords?.filter((obj) => obj.productId === e.id).length;
    });
    setProducts(tempProducts);
  }, [selectedRecords]);

  const handleAdd = () => {
    if (selectedProducts?.length) {
      const data = [];
      selectedProducts?.forEach((ele) => {
        let qty = ele.qty;
        while (qty) {
          const result = selectedRecords?.filter((f) => f.productId === ele.product && !f.isCounted);
          if (result.length) {
            if (reference === 'managedPackages') {
              if (qty - ele?.packages?.length <= 0) {
                data.push({ product: ele.product, package: ele?.packages[0], asset: result[0]._id });
                ele.packages.shift();
              } else {
                data.push({ product: ele.product, package: ele?.packages[0], asset: result[0]._id });
              }
            } else {
              data.push({ ...ele, asset: result[0]._id });
            }
            result[0].isCounted = true;
          }
          qty--;
        }
      });
      handleSucess(data);
    } else {
      handleSucess(selectedRecords);
    }
  };

  const leftSideContents = () => {
    return (
      <>
        <Box style={{ display: 'inline' }}>
          {products.length > 0
            ? products?.map((d) => (
                <Box
                  m={0.5}
                  p={1}
                  border={1}
                  className={`cursor-pointer rounded-sm ${
                    selectedProduct === d.id ? 'bg-[var(--dark-secondary,_var(--primary))] text-white' : 'text-[var(--primary-text)]'
                  }`}
                  borderColor="var(--common-border-color)"
                  onClick={() => {
                    if (selectedProduct === d.id) {
                      setSelectedProduct(null);
                    } else {
                      setSelectedProduct(d.id);
                    }
                  }}
                  style={{ display: 'inline-block' }}
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
      </>
    );
  };

  return (
    <Dialog
      TransitionComponent={CustomDialogTransition}
      fullWidth
      maxWidth="md"
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
          leftSideContents={leftSideContents()}
          addButtonProps={{
            iconsEnabled: false,
            disabled: isAssigning || disableSaveButton || selectedRecords?.length === 0 || products?.some((d) => d?.qty < 0),
            loading: isAssigning,
            text: selectedRecords?.length > 0 ? `(${selectedRecords?.length})` : ''
          }}
          addButtonOnclick={() => {
            if (checkMTRValidation) {
              if (selectedRecords?.some((e) => e.mtrAttached !== true)) {
                setMtrConfirmBox(true);
              } else {
                handleAdd();
              }
            } else {
              handleAdd();
            }
          }}
          isAddButtonVisible
          setQueryString={false}
        />

        {products.length > 0 && products.some((s) => s.qty < 0) ? (
          <div className="text-error font-weight-bold">You have selected more assets than required</div>
        ) : null}
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
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
          okBtnLoading={isSubmitting}
          message={`MTR(s) missing for some or all line items.`}
          onClose={() => {
            setMtrConfirmBox(false);
          }}
          onOk={() => {
            handleAdd();
            setMtrConfirmBox(false);
          }}
        />
      )}
    </Dialog>
  );
};

export default AssignSerializedAssetDialog;
