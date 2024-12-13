import { Box, Dialog, TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import {
  CustomDialogTransition,
  employeeMaster,
  gridLoadingTimeout,
  isObjectEmpty,
  prepareDataForGrid,
  sidebarResource
} from 'src/constants/helpers';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import CommonSkeleton from '../Helpers/CommonSkeleton';
import routes from '../Helpers/Routes';
import { ListingPageHeader } from '../PageHeaders';
import axios, { CancelTokenSource } from 'axios';

const AssignEmployeeDialog = ({ reference, onSuccess, handleClose, ids = [], defaultCompetency = [], extraStaticFilter = [], warehouse = null }) => {
  const renderedFrom = `${sidebarResource.employeeMaster}`;
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { generateColumns } = useColumns();

  const {
    state: { permissions, selectedEntity,resources }
  }: any = useData();

  const [isAssigning, setAssigning] = useState(false);
  const [disableSaveButton, setDisableSaveButton] = useState(false);
  const [columns, setColumns] = useState(null);
  const [competencyOptions, setCompetencyOptions] = useState(null);
  const [warehouseOptions, setWarehouseOptions] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(warehouse);
  const [selectedCompetency, setSelectedCompetency] = useState(defaultCompetency);

  useEffect(() => {
    fetchGridColumns();
    fetchOptionsData();
  }, []);

  useEffect(() => {
    setDisableSaveButton(selectedRecords?.some((d) => d.qty === 0));
  }, [selectedRecords]);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly, selectedCompetency, selectedWarehouse]);

  const fetchOptionsData = () => {
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=${sidebarResource.competencyType},${sidebarResource.warehouse}`)
      .then(({ data: { data } }) => {
        setWarehouseOptions(data[sidebarResource.warehouse] || []);
        setCompetencyOptions(data[sidebarResource.competencyType] || []);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource?.employeeMaster}&view=true`)
      .then(({ data: { data } }) => {
        let newColumns = generateColumns(renderedFrom, data, routes.employeeMasterDetail.path);
        setColumns([...newColumns, ...getStaticFields()]);
      });
  };

  const fetchData = (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`${employeeMaster.api}${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data }) => {
        let rows = data.data.data.map((u) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['isChecked'] = false;
          finalObject['id'] = u._id;
          finalObject['pricingMethodMain'] = u?.competencyDetail?.pricingMethod;
          return {
            ...finalObject
          };
        });
        dispatch({
          type: 'selection',
          selectedRecords: selectedRecords || []
        });
        dispatch({ type: 'initialize', data: rows, count: data?.data?.count });
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
    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
    }
    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || []).map((m) => m._id))}`;
    }

    const { filterByIds, deepFilters } = gridFilterParser(filters);

    const updatedDeepFilters = [...deepFilters];
    const updatedFilterByIds = [...filterByIds];

    if (selectedCompetency?.length > 0) {
      updatedFilterByIds.push({
        field: 'competencyType',
        term: { $in: selectedCompetency?.map((e) => e?.optionValue) }
      });
    }
    if (selectedWarehouse && selectedWarehouse !== '') {
      updatedFilterByIds.push({
        field: 'warehouse',
        term: selectedWarehouse
      });
    }
    if (extraStaticFilter?.length) {
      extraStaticFilter?.forEach((e) => {
        updatedDeepFilters.push(e);
      });
    }
    if (updatedDeepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedDeepFilters))}`;
    }
    if (updatedFilterByIds?.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(updatedFilterByIds)}`;
    }

    if (updatedDeepFilters?.length || updatedFilterByIds?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
    }
    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURIComponent(search)}`;
    }
    return deepFilter;
  };

  const handleSubmit = async () => {
    onSuccess(selectedRecords);
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const onSaveEdit = (data, row) => {
    if (!data || !data?.qty) return;
    const selectedFromStorage = selectedRecords;
    if (!selectedFromStorage || selectedFromStorage.length === 0) return;
    const updatedRecords = selectedFromStorage.map((d) => {
      if (row?._id === d._id) {
        d.qty = parseInt(data.qty);
      }
      return d;
    });

    const rows = dataRows;

    rows?.forEach((d) => {
      if (row?._id === d._id) {
        d.qty = parseInt(data.qty);
      }
    });

    dispatch({ type: 'initialize', data: rows, count: rowCount });
    dispatch({ type: 'selection', selectedRecords: updatedRecords });
    setDisableSaveButton(selectedRecords?.some((d) => d.qty === 0));
  };

  const leftSideContents = () => {
    return (
      <>
        <Autocomplete
          fullWidth
          className="max-w-[300px]"
          options={competencyOptions}
          getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
          onChange={(e, val) => {
            setSelectedCompetency(val);
          }}
          multiple
          size={'small'}
          value={selectedCompetency}
          filterSelectedOptions={true}
          renderInput={(params) => (
            <TextField {...params} margin="none" size={'small'} name="competencyType" label="Competency Type" variant="outlined" fullWidth />
          )}
        />
        <Autocomplete
          fullWidth
          className="max-w-[300px]"
          options={warehouseOptions}
          getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
          getOptionSelected={(option: any, val) => option.optionValue === val}
          value={
            warehouseOptions.filter((data) => data.optionValue === selectedWarehouse).length
              ? warehouseOptions.filter((data) => data.optionValue === selectedWarehouse)[0]
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
        title={`Assign ${resources?.employeeMaster?.titleSingular}`}
        showManimizeMaximize={false}
        showRequiredLabel={false}
        onClose={handleClose}
      />
      <CustomDialogContent isFooterPresent={false}>
        {competencyOptions && columns ? (
          <>
            <ListingPageHeader
              showSearchInMobile={true}
              searchValue={search}
              onSearch={handleSearch}
              isActionButtonVisible={false}
              leftSideContents={leftSideContents()}
              addButtonProps={{
                iconsEnabled: false,
                disabled: isAssigning || disableSaveButton || selectedRecords?.length === 0,
                loading: isAssigning,
                text: selectedRecords?.length > 0 ? `(${selectedRecords?.length})` : '',
                textAddShow: true
              }}
              addButtonOnclick={handleSubmit}
              isAddButtonVisible
              setQueryString={false}
            />
            <CustomReactTable
              height={'calc(100vh - 200px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              renderedFrom={renderedFrom}
              onSaveEdit={onSaveEdit}
              refreshGrid={fetchData}
              showOnlyShowFilteredRecordSwitch={true}
              showFilters={true}
              resource={sidebarResource.employeeMaster}
            />
          </>
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomDialogContent>
    </Dialog>
  );
};

export default AssignEmployeeDialog;
