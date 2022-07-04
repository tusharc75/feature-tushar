import React, { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import { Box, Button, IconButton } from '@material-ui/core';
import { Delete, FileCopy } from '@material-ui/icons';
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
import GridDeleteIcon from 'src/components/Helpers/GridDeleteIcon';
import useColumns, { getStaticFields, getFrameworkComponents } from 'src/constants/useColumns';
import { prepareDataForGrid } from 'src/constants/helpers';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

const Dashboards = () => {
  const history = useHistory();
  const {
    state: { permissions }
  }: any = useData();
  const { setToastConfig } = React.useContext(CustomToastContext);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState({ open: false, data: [], isLoading: false });
  const [gridApi, setGridApi] = React.useState(null);
  const [state, dispatch] = React.useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

  const [columns, setColumns] = useState([]);

  React.useEffect(() => {
    fetchFields();
  }, []);

  React.useEffect(() => {
    fetchDashboards();
  }, []);

  const NameRenderer = (params) => (
    <Link className="link" to={`dashboard-master/${params.data._id}`} title={params.value}>
      {params.value}
    </Link>
  );

  const removeDashboard = () => {
    setShowDeleteDialog({
      ...showDeleteDialog,
      isLoading: true
    });
    axiosInstance()
      .put(`${baseURL}/remove`, {
        ids: showDeleteDialog.data
      })
      .then(() => {
        fetchDashboards();
        closeDeleteDialog();
      })
      .catch((err) => {
        setToastConfig(err);
        closeDeleteDialog();
      });
  };

  const ActionRenderer = (params) => {
    const { data } = params;
    return (
      <>
        <HtmlTooltip title="Delete">
          <span>
            <IconButton
              disabled={!permissions?.dashboardMaster.isDelete}
              size="small"
              onClick={() => setShowDeleteDialog({ ...showDeleteDialog, open: true, data: [data?._id] })}
            >
              <Delete fontSize="small" color={permissions?.dashboardMaster.isDelete ? 'error' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>

        <HtmlTooltip title="Clone">
          <span>
            <IconButton
              disabled={!permissions?.dashboardMaster.isCreate}
              size="small"
              onClick={() => history.push(`dashboard-master/${params.data._id}?type=clone`)}
            >
              <FileCopy fontSize="small" color={permissions?.dashboardMaster.isCreate ? 'primary' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
      </>
    );
  };

  const frameworkComponents = {
    nameRenderer: NameRenderer,
    actionsRenderer: ActionRenderer
  };

  const fetchFields = () => {
    const coloum = [
      {
        field: 'name',
        headerName: 'Dashboard Name',
        show: true,
        disabled: true,
        cellRenderer: 'nameRenderer'
      },
      ...getStaticFields()
    ];
    setColumns(coloum);
  };

  const fetchDashboards = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    axiosInstance()
      .get(baseURL)
      .then(({ data: { data } }) => {
        let rows = data?.map((u) => {
          let finalObject = prepareDataForGrid(u);
          let res = {
            ...finalObject
          };
          return res;
        });
        dispatch({ type: 'initialize', data: rows, count: rows.length });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((err) => {
        setToastConfig(err);
        dispatch({ type: 'loading', loading: false });
      });
  };

  const closeDeleteDialog = () => {
    setShowDeleteDialog({
      open: false,
      data: [],
      isLoading: false
    });
  };

  return (
    <React.Fragment>
      <div className="headerbox">
        <CustomBreadCrumbs routes={[{ title: 'Dashboard Master' }]} />
      </div>
      <CustomContainer>
        <Box className="header-panel" display="flex" justifyContent="space-between" alignItems={'center'}>
          <Box display={'flex'} alignItems="center">
            <MdDashboardCustomize size={22} className="headerLogo" />
            <Box ml={1}>
              <span className="listingHeader">Dashboard Master</span>
            </Box>
          </Box>
          <Box py={'6px'}>
            {permissions?.dashboardMaster.isCreate && (
              <Button color="primary" variant="contained" size="small" disableRipple onClick={() => history.push(`dashboard-master/new`)}>
                Add
              </Button>
            )}
            <Box component="span" ml={1} />
            <DeleteButton
              disabled={selectedRecords.length === 0}
              text="Delete"
              onClick={() => {
                setShowDeleteDialog({
                  ...showDeleteDialog,
                  open: true,
                  data: selectedRecords.map((d: any) => d._id)
                });
              }}
            />
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
          allowSelection={true}
          allowAction={true}
          isClientSideGrid={true}
          loading={loading}
          renderedFrom={'dashboard-builder'}
          refreshGrid={fetchDashboards}
        />
      </CustomContainer>
      {showDeleteDialog.open && (
        <ConfirmationDialog
          open={true}
          okBtnLoading={showDeleteDialog.isLoading}
          message={'Are you sure you want delete?'}
          onClose={closeDeleteDialog}
          onOk={removeDashboard}
        />
      )}
    </React.Fragment>
  );
};

export default Dashboards;
