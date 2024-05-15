import Box from '@material-ui/core/Box/Box';
import { useContext, useEffect, useState } from 'react';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import CustomReactTable, { gridFilterParser, useTableReducer } from 'src/components/CustomReactTable';
import Grid from '@material-ui/core/Grid/Grid';
import axiosInstance from 'src/axios/axiosInstance';
import { dateFormat, gridLoadingTimeout, productInventory } from 'src/constants/helpers';
import { prepareDataForGrid } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import routes from 'src/components/Helpers/Routes';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import moment from 'moment';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { Autocomplete } from '@material-ui/lab';
import { TextField } from '@material-ui/core';

const SerialNumber = ({ product, warehouse }) => {
  
  const { state, dispatch } = useTableReducer();
  const { page, limit, filters, sorting } = state;
  const [renderCount, setRenderCount] = useState(0);
  const [warehouseOptions, setWarehouseOptions] = useState(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState(warehouse && warehouse?.split(',')?.length === 1 ? warehouse : 'All');
  const {
    state: { user }
  }: any = useData();

  useEffect(() => {
    getWarehouse();
  }, []);

  useEffect(() => {
    if (warehouseOptions && renderCount > 0) {
      fetchRecords();
    } else {
      setRenderCount(renderCount + 1);
    }
  }, [page, limit, filters, sorting, warehouseOptions, selectedWarehouse]);

  const toastConfig = useContext(CustomToastContext);


  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}`;

    if (selectedWarehouse) {
      let tempWarehouse =
        selectedWarehouse === 'All'
          ? warehouseOptions
            ?.filter((d) => d.optionValue !== 'All')
            .map((d) => d.optionValue)
            .toString()
          : selectedWarehouse;

      deepFilter = `${deepFilter}&warehouse=${tempWarehouse}`;
    }

    if (product) {
      deepFilter = `${deepFilter}&products=${product}`;
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
    return deepFilter;
  };

  const getWarehouse = () => {
    axiosInstance()
      .get('/sa-formbuilder/lookup?lookupResource=Warehouse,Storage Location')
      .then(({ data: { data } }) => {
        setWarehouseOptions([{ optionLabel: 'All', optionValue: 'All' }, ...data.Warehouse]);
      });
  };

  const fetchRecords = async () => {
    dispatch({ type: 'loading', loading: true });
    let queryString = getQueryString();
    axiosInstance().get(`/product-inventory/serial-number${queryString}`).then(({ data }) => {
      let rows = data.data.map((u) => {
        let finalObject = prepareDataForGrid(u);
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

  const columns = [
    {
      accessor: 'serialNumber',
      Header: 'Serial Number',
      Cell: ({ row }) => (
        <>
          {row?.original?.serialNumber ? (
            <h5 className="text-truncate" title={row?.original?.serialNumber}>
              {row?.original?.serialNumber}
            </h5>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    },
    {
      accessor: 'warehouse',
      Header: routes.warehouse.title,
      disableFilters: true,
      Cell: ({ row }) => (
        <>
          {row?.original?.warehouse ? (
            <h5 className="text-truncate" title={row?.original?.warehouse}>
              {row?.original?.warehouse}
            </h5>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    },
    {
      accessor: 'status',
      Header: 'Status',
      Cell: ({ row }) => (
        <h5 className="text-truncate" title={row?.original?.status}>
          {row?.original?.status}
        </h5>
      )
    },
    {
      accessor: 'createdBy',
      Header: 'Created By',
      disableFilters: true,
      Cell: ({ row }) => (
        <>
          {row?.original?.createdBy ? (
            <h5 className="createBy" title={`${row?.original?.createdBy} • ${moment(row?.original?.createdByDate).format(dateFormat)}`}>
              {row?.original?.createdBy}
              <span className="hidden">&nbsp;-&nbsp;</span>
              <span className="createdAtTime badge-date">{moment(row?.original?.createdByDate)?.format(dateFormat)}</span>
            </h5>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    }
  ];

  return (
    <>
      { warehouseOptions ? (
        <div className="md:pr-[82px]">
        <Grid container spacing={2} justifyContent="space-between">
          <Grid item md={3} sm={6} xs={12}>
            <Autocomplete
              options={warehouseOptions}
              getOptionLabel={(option: any) => option.optionLabel}
              disableClearable
              getOptionSelected={(option: any, val) => option.optionValue === val}
              value={
                warehouseOptions.filter((data) => data.optionValue === selectedWarehouse).length
                  ? warehouseOptions.filter((data) => data.optionValue === selectedWarehouse)[0]
                  : ''
              }
              onChange={(e, val) => {
                if (val !== null) {
                  setSelectedWarehouse(val && val.optionValue ? val.optionValue : '');
                }
              }}
              renderInput={(params) => (
                <TextField {...params} margin="dense" name="plant" label={routes.warehouse.title} variant="outlined" fullWidth />
              )}
            />
          </Grid>
        </Grid>
        </div>
        ): (
        <div className="min-h-[50px]" />
      )}
      <Grid item xs={12} md={12} sm={12} className="mt-3">
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={'serialNumber_grid'}
            refreshGrid={fetchRecords}
            hideSelection={true}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Grid>
    </>
  );
};

export default SerialNumber;
