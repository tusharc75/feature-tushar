import { Box, Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import { AddOutlined, Delete, ExpandMore, FileCopy } from '@material-ui/icons';
import React, { useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomAgGrid, { intialState, reducer } from 'src/components/AgGridComponents/CustomAgGrid';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { gridLoadingTimeout, prepareDataForGrid } from 'src/constants/helpers';
import { getStaticFields } from 'src/constants/useColumns';
import { staticFrameworkRender } from '../../constants/useColumns';
import { baseURL } from './builderHelpers';

const Dashboards = () => {
  const history = useHistory();
  const {
    state: { permissions }
  }: any = useData();
  const { setToastConfig } = React.useContext(CustomToastContext);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState({ open: false, data: [], isLoading: false });
  const [gridApi, setGridApi] = React.useState(null);
  const [anchorEl, setAnchorEl] = React.useState(null);

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
              disabled={!permissions?.dashboardMaster?.isDelete}
              size="small"
              onClick={() => setShowDeleteDialog({ ...showDeleteDialog, open: true, data: [data?._id] })}
            >
              <Delete fontSize="small" color={permissions?.dashboardMaster?.isDelete ? 'error' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>

        <HtmlTooltip title="Clone">
          <span>
            <IconButton
              disabled={!permissions?.dashboardMaster?.isCreate}
              size="small"
              onClick={() => history.push(`dashboard-master/${params.data._id}?type=clone`)}
            >
              <FileCopy fontSize="small" color={permissions?.dashboardMaster?.isCreate ? 'primary' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
      </>
    );
  };

  const frameworkComponents = {
    nameRenderer: NameRenderer,
    actionsRenderer: ActionRenderer,
    ...staticFrameworkRender
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

  const closeActions = () => {
    setAnchorEl(null);
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ title: 'Dashboard Master' }]} />
      </div>
      <CustomContainer>
        <Box className="header-panel">
          <div className="flex gap-2">
            <Box className="ml-auto" />
            {permissions?.dashboardMaster?.isCreate && (
              <Button
                color="primary"
                variant="contained"
                size="small"
                disableRipple
                startIcon={<AddOutlined />}
                onClick={() => history.push(`dashboard-master/new`)}
              >
                Add
              </Button>
            )}

            <Button
              variant="outlined"
              color="default"
              size="small"
              endIcon={<ExpandMore />}
              onClick={openActions}
              aria-controls="action-menu"
              disabled={selectedRecords.length === 0}
              className="new-dropdown-v1"
            >
              Actions
            </Button>
            <Menu
              anchorEl={anchorEl}
              keepMounted
              getContentAnchorEl={null}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left'
              }}
              id="action-menu"
              open={Boolean(anchorEl)}
              onClose={closeActions}
            >
              <MenuItem
                disabled={!permissions?.report?.isDelete}
                onClick={() => {
                  closeActions();
                  setShowDeleteDialog({
                    ...showDeleteDialog,
                    open: true,
                    data: selectedRecords.map((d: any) => d._id)
                  });
                }}
              >
                Delete
              </MenuItem>
            </Menu>
          </div>
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
    </section>
  );
};

export default Dashboards;
