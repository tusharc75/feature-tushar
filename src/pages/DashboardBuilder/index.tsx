import React from 'react';
import { Grid, Box, Button } from '@material-ui/core';
import { useHistory, Link } from 'react-router-dom';
import { MdDashboardCustomize } from 'react-icons/md';

import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import axiosInstance from 'src/axios/axiosInstance';
import CustomContainer from 'src/components/CustomContainer';
import { gridLoadingTimeout } from 'src/constants/helpers';
import DeleteButton from 'src/components/Helpers/DeleteButton';
import CustomAgGrid, { reducer, intialState } from 'src/components/AgGridComponents/CustomAgGrid';
import { useData } from 'src/StateProvider/Provider';
import { baseURL } from './builderHelpers';

const Dashboards = () => {
  const history = useHistory();
  const {
    state: { user }
  } = useData();
  const { setToastConfig } = React.useContext(CustomToastContext);
  const [gridApi, setGridApi] = React.useState(null);
  const [state, dispatch] = React.useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;
  let columns = [
    {
      field: 'name',
      headerName: 'Dashboard Name',
      show: true,
      disabled: true,
      cellRenderer: 'nameRenderer'
    }
  ];

  const NameRenderer = (params) => (
    <Link className="link" to={`dashboard-builder/${params.data._id}`} title={params.value}>
      {params.value}
    </Link>
  );

  const frameworkComponents = {
    nameRenderer: NameRenderer
  };

  React.useEffect(() => {
    handleFetch();
  }, []);

  const handleFetch = () => {
    dispatch({ type: 'loading', loading: true });

    if (gridApi) {
      gridApi.setRowData([]);
    }
    axiosInstance()
      .get(baseURL)
      .then(({ data: { data } }) => {
        dispatch({ type: 'initialize', data, count: data.length });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((err) => {
        setToastConfig(err);
        dispatch({ type: 'loading', loading: false });
      });
  };

  return (
    <React.Fragment>
      <div className="headerbox">
        <CustomBreadCrumbs routes={[{ title: 'Dashboard List' }]} />
      </div>
      <CustomContainer>
        <Box className="header-panel" display="flex" justifyContent="space-between" alignItems={'center'}>
          <Box display={'flex'} alignItems="center">
            <MdDashboardCustomize size={22} className="headerLogo" />
            <Box ml={1}>
              <span className="listingHeader">Dashboards List</span>
            </Box>
          </Box>
          <Box py={'6px'}>
            <Button color="primary" variant="contained" size="small" disableRipple onClick={() => history.push(`dashboard-builder/new`)}>
              Create
            </Button>
            <Box component="span" ml={1} />
            <DeleteButton text="Delete" onClick={() => {}} />
          </Box>
        </Box>

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
          actionWidth={150}
          allowSelection={false}
          allowAction={false}
          isClientSideGrid={true}
          loading={loading}
          renderedFrom={'dashboard-builder'}
          refreshGrid={handleFetch}
        />
      </CustomContainer>
    </React.Fragment>
  );
};

export default Dashboards;
