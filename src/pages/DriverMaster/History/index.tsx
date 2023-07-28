import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import { CommonRenderer, DateTimeRenderer } from 'src/components/AgGridComponents/CustomAgGridCellRenderers';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { Link } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CustomAgGrid, { intialState, reducer } from 'src/components/AgGridComponents/CustomAgGrid';
import axiosInstance from 'src/axios/axiosInstance';
import { Box } from '@material-ui/core';
import { camelCase } from 'lodash';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

const History = ({ id, status }) => {
  const toastConfig = useContext(CustomToastContext);

  const [gridApi, setGridApi] = useState(null);

  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

  const NameRenderer = (params) => (
    <>
      {params?.value ? (
        <p className="link text-truncate" title={params.value?.optionLabel} onClick={() => window.open(`${routes.driverMasterDetail.path}/${params.value?.optionValue}`)}>
          {params?.value?.optionLabel}
        </p>
      ) : (
        <NoDataCell />
      )}
    </>
  );
  const frameworkComponents = {
    nameRenderer: NameRenderer,
    commonRenderer: CommonRenderer,
    dateTimeRenderer: DateTimeRenderer
  };

  const columns = [
    { field: 'reference', headerName: 'Reference', show: true, cellRenderer: 'nameRenderer' },
    { field: 'referenceType', headerName: 'Type', show: true, disabled: true, cellRenderer: 'commonRenderer' },
    { field: 'date', headerName: 'Date & Time', show: true, disabled: true, filter: false, cellRenderer: 'dateTimeRenderer' },
    { field: 'status', headerName: 'Status', show: true, cellRenderer: 'commonRenderer' },
    { field: 'comments', headerName: 'Comment', show: true, cellRenderer: 'commonRenderer' }
  ];

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id, status]);

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    axiosInstance()
      .get(`${routes.driverMaster?.path}/history/${id}`)
      .then(({ data: { data } }) => {
        dispatch({ type: 'initialize', data: data, count: data.length });
        dispatch({ type: 'loading', loading: false });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  return (
    <Fragment>
      <Box>
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
            allowSelection={false}
            isClientSideGrid={true}
            loading={loading}
            renderedFrom={`${camelCase(routes?.truckMaster.title)}_History`}
            refreshGrid={fetchData}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Box>
    </Fragment>
  );
};

export default History;
