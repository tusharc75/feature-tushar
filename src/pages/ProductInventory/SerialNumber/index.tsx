import Box from '@material-ui/core/Box/Box';
import { useState, useEffect, useReducer, useContext, Fragment } from 'react';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import CustomAgGrid, { intialState, reducer } from '../../../components/AgGridComponents/CustomAgGrid';
import Grid from '@material-ui/core/Grid/Grid';
import axiosInstance from 'src/axios/axiosInstance';
import { gridLoadingTimeout, productInventory } from 'src/constants/helpers';
import { prepareDataForGrid } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import { CommonRenderer, CreatedByRenderer } from '../../../components/AgGridComponents/CustomAgGridCellRenderers';
import routes from 'src/components/Helpers/Routes';

const SerialNumber = ({ product, warehouse }) => {
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes } = state;
  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    let data;
    const query = warehouse ? `?warehouse=${warehouse}&isAll=true` : `?isAll=true`;
    const response = await axiosInstance().get(`${productInventory.api}/serial-number/${product}${query}`);
    data = response?.data?.data;
    let rows = data.map((u) => {
      let finalObject: any = prepareDataForGrid(u, user);
      return finalObject;
    });
    dispatch({ type: 'initialize', data: rows, count: rows.length });
    setTimeout(() => {
      dispatch({ type: 'loading', loading: false });
    }, gridLoadingTimeout);
  };

  const columns = [
    { field: 'serialNumber', headerName: 'Serial Number', show: true, cellRenderer: 'commonRenderer' },
    { field: 'warehouse', headerName: routes.warehouse.title, show: true, cellRenderer: 'commonRenderer' },
    { field: 'active', headerName: 'Status', show: true, cellRenderer: 'statusRenderer' },
    { field: 'createdBy', headerName: 'Created By', show: true, filter: false, sortable: false, cellRenderer: 'createdByRenderer' }
  ];

  const StatusRenderer = (params) => (params?.value ? 'Available' : 'Unavailable');

  const frameworkComponents = {
    statusRenderer: StatusRenderer,
    createdByRenderer: CreatedByRenderer,
    commonRenderer: CommonRenderer
  };

  return (
    <>
      <Grid item xs={12} md={12} sm={12} className="mt-3">
        {columns ? (
          <CustomAgGrid
            columns={columns}
            dataRows={dataRows}
            frameworkComponents={frameworkComponents}
            setGridApi={setGridApi}
            dispatch={dispatch}
            rowCount={rowCount}
            limit={limit}
            pageSizes={pageSizes}
            page={page}
            allowAction={false}
            loading={loading}
            isClientSideGrid={true}
            allowSelection={false}
            renderedFrom={'serialNumber_grid'}
            refreshGrid={fetchRecords}
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
