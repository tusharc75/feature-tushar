import { Autocomplete, Box, Dialog, TextField } from '@mui/material';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { CustomDialogTransition, gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import CommonSkeleton from '../Helpers/CommonSkeleton';
import routes from '../Helpers/Routes';
import { ListingPageHeader } from '../PageHeaders';
import axios, { CancelTokenSource } from 'axios';
import { useData } from 'src/StateProvider/Provider';

const AssignSerializedPackagesDialog = ({
  onSuccess,
  handleClose,
  ids = [],
  extraDeepFilter = [],
  extraFilterById = [],
  isSubmitting = false,
  selectedPackages = [],
  referenceData = null
}) => {
  const renderedFrom = `${camelCase(sidebarResource?.serializedPackages)}`;
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { generateColumns } = useColumns();

  const [columns, setColumns] = useState(null);
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [warehouseOption, setWarehouseOption] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(
    referenceData && referenceData?.warehouse ? referenceData?.warehouse?.optionValue : null
  );

  const {
    state: { resources }
  }: any = useData();

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [page, limit, filters, sorting, search, showFilteredRecordsOnly, selectedPackage, selectedWarehouse]);

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.serializedPackages}&view=true`)
      .then(({ data: { data } }) => {
        let newColumns = generateColumns(renderedFrom, data, routes.serializedPackagesDetail.path);
        setColumns([...newColumns, ...getStaticFields()]);
      });
  };

  const fetchData = (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`${routes.serializedPackages.path}${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data } }) => {
        let rows = data.data.map((u) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
          return {
            ...finalObject
          };
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

    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (extraDeepFilter?.length > 0) {
      extraDeepFilter?.map((e) => {
        deepFilters.push(e);
      });
    }

    if (extraFilterById?.length > 0) {
      extraFilterById?.map((e) => {
        filterByIds.push(e);
      });
    }

    if (selectedPackages?.length) {
      if (selectedPackage) {
        filterByIds.push({ field: 'package', term: { $in: [selectedPackage] } });
      } else {
        filterByIds.push({ field: 'package', term: { $in: selectedPackages?.map((p) => p?.package) } });
      }
    }

    if (selectedWarehouse) {
      filterByIds.push({ field: 'warehouse', term: { $in: [selectedWarehouse] } })
    }

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
    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || []).map((m) => m._id))}`;
    }

    return deepFilter;
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const handleAdd = () => {
    if (selectedPackages?.length) {
      const data = [];
      selectedPackages?.forEach((ele) => {
        let qty = ele.qty;
        while (qty) {
          const result = selectedRecords?.filter((f) => f.packageId === ele.package && !f.isCounted);
          if (result.length) {
            data.push({ uniqueId: ele?.uniqueId, serializedPackage: result[0]._id });
            result[0].isCounted = true;
          }
          qty--;
        }
      });
      onSuccess(data);
    } else {
      onSuccess(selectedRecords);
    }
  };

  useEffect(() => {
    let tempPackages = [];
    selectedPackages?.map((d) => {
      const alreadyAdded = tempPackages.find((obj) => obj.package === d.package);
      if (alreadyAdded) {
        alreadyAdded.qty = d?.qty + alreadyAdded.qty;
      } else {
        tempPackages.push({ ...d });
      }
    });
    tempPackages?.forEach((e) => {
      e.qty = e?.qty - selectedRecords?.filter((obj) => obj.packageId === e.package).length;
    });
    setPackages(tempPackages);
  }, [selectedRecords]);

  useEffect(() => {
    axiosInstance()
      .get('/sa-formbuilder/lookup?lookupResource=Warehouse')
      .then(({ data: { data } }) => {
        setWarehouseOption(data['Warehouse']);
      });
  }, []);

  const leftSideContents = () => {
    return (
      <>
        <Box style={{ display: 'inline' }}>
          {packages?.length > 0
            ? packages?.map((d) => (
              <Box
                m={0.5}
                p={1}
                border={1}
                className={`cursor-pointer rounded-sm ${selectedPackage === d.package ? 'bg-[var(--dark-secondary,_var(--primary))] text-white' : 'text-[var(--primary-text)]'
                  }`}
                borderColor="var(--common-border-color)"
                onClick={() => {
                  if (selectedPackage === d.id) {
                    setSelectedPackage(null);
                  } else {
                    setSelectedPackage(d.package);
                  }
                }}
                style={{ display: 'inline-block' }}
              >
                {d?.qty < 0 ? (
                  <span key={d.packageName} className="text-error">{`${d.packageName} (${d?.qty})`}</span>
                ) : d?.qty === 0 ? (
                  <span key={d.packageName} className="text-success">{`${d.packageName} (${d?.qty})`}</span>
                ) : (
                  <span key={d.packageName}>{`${d.packageName} (${d?.qty})`}</span>
                )}
              </Box>
            ))
            : null}
        </Box>
      </>
    );
  };

  const leftSideContentsOfSearchFilter = () => {
    return (
      <Box mt={0.5}>
        <Autocomplete
          fullWidth
          sx={{ width: 250 }}
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
      </Box>
    )
  }

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
        title={`Add ${resources?.serializedPackages?.titlePlural}`}
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
            disabled: isSubmitting || selectedRecords?.length === 0 || packages?.some((d) => d?.qty < 0),
            loading: isSubmitting,
            iconsEnabled: false,
            text: selectedRecords?.length > 0 ? `(${selectedRecords?.length})` : '',
            textAddShow: true
          }}
          addButtonOnclick={handleAdd}
          isAddButtonVisible={true}
          setQueryString={false}
          leftSideContentsOfSearchFilter={leftSideContentsOfSearchFilter()}
        />

        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 250px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            showOnlyShowFilteredRecordSwitch={true}
            showFilters={true}
            resource={sidebarResource.serializedPackages}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomDialogContent>
    </Dialog>
  );
};

export default AssignSerializedPackagesDialog;
