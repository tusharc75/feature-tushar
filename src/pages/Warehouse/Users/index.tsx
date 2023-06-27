import { Fragment, useState, useEffect, useReducer, useContext } from 'react';
import { Box, Grid, Button, Menu, MenuItem, IconButton } from '@material-ui/core';
import { ExpandMore } from '@material-ui/icons';
import CustomAgGrid, { intialState, reducer } from 'src/components/AgGridComponents/CustomAgGrid';
import axiosInstance from 'src/axios/axiosInstance';
import { getLocalStorageArrayData, gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import useColumns, { getFrameworkComponents, getStaticFields } from 'src/constants/useColumns';
import routes from 'src/components/Helpers/Routes';
import { useData } from 'src/StateProvider/Provider';
import { camelCase } from 'lodash';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteIcon from '@material-ui/icons/Delete';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialogRaw from 'src/components/Helpers/ConfirmationDialog';
import AssignUserDialog from 'src/components/AssignRolesDialog/NewAssignUserDialog';

const Users = ({ warehouse }) => {
  let renderedFrom = `${camelCase(routes.user.title)}_warehouse_master`;
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  const toastConfig = useContext(CustomToastContext);

  const [openDialog, setOpenDialog] = useState(false);
  const [anchorActionEl, setAnchorActionEl] = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const [gridApi, setGridApi] = useState(null);
  const [columns, setColumns] = useState([]);
  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const { getColumnData } = useColumns();

  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    localStorage.removeItem(localStorageSelectedRecords);
    fetchGridColumns();
  }, []);

  useEffect(() => {
    fetchData();
  }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly]);

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.user}`)
      .then(({ data: { data } }) => {
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          let currentColumn = getColumnData(routes.user?.title, o?.fieldData, routes.userDetail.path);
          if (currentColumn !== null) {
            columns = [...columns, currentColumn?.columnData];
            if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
              rendererNames.push(currentColumn?.rendererName);
            }
          }
        });
        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
        tempFrameworkComponent = {
          ...tempFrameworkComponent,
          actionsRenderer: ActionsRenderer
        };
        setFrameWorkComponent({ ...tempFrameworkComponent });
        columns = [...columns, ...getStaticFields()];
        setColumns([...columns]);
      });
  };

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    axiosInstance()
      .get(`${routes.warehouse.path}/user/${warehouse}`)
      .then(({ data: { data } }) => {
        let rows = data?.map((u) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['isChecked'] = getLocalStorageArrayData(localStorageSelectedRecords)?.some((s) => s._id === u._id);
          finalObject['allowedToEdit'] = permissions?.warehouse?.isUpdate;
          finalObject['canDelete'] = permissions?.warehouse?.isUpdate;
          let res = {
            ...finalObject
          };
          return res;
        });
        dispatch({ type: 'initialize', data: rows, count: rows?.length });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${routes.warehouse.path}/user/remove`, { warehouse, user: deleteRecord })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        localStorage.removeItem(localStorageSelectedRecords);
        fetchData();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
        setAnchorActionEl(null);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const ActionsRenderer = (params) => (
    <HtmlTooltip title="Delete">
      <IconButton
        size="small"
        aria-label="Delete"
        onClick={() => {
          setDeleteRecord([params.data._id]);
          setShowDeleteConfirmBox(true);
        }}
      >
        <DeleteIcon color="error" />
      </IconButton>
    </HtmlTooltip>
  );

  const openActions = (event) => {
    setAnchorActionEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorActionEl(null);
  };

  const handleAssignUser = (data) => {
    setIsAssigning(true);
    const user = data?.map((e) => e?._id);
    axiosInstance()
      .post(`${routes.warehouse.path}/user/assign`, { warehouse: [warehouse], user })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        localStorage.removeItem(localStorageSelectedRecords);
        fetchData();
        setOpenDialog(false);
        setIsAssigning(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsAssigning(false);
      });
  };

  return (
    <Fragment>
      <Box p={1} pb={2}>
        <Grid container>
          <Grid item xs={3} md={3} sm={3}>
            <Button
              size="small"
              variant="contained"
              color="primary"
              onClick={() => {
                setOpenDialog(true);
              }}
            >
              Assign Users
            </Button>
          </Grid>
          <Grid item xs={9} md={9} sm={9}>
            <Box display={'flex'} justifyContent={'flex-end'} alignItems="center">
              <Button
                variant="outlined"
                color="default"
                size="small"
                onClick={openActions}
                aria-controls="action-menu"
                disabled={selectedRecords.length === 0}
                endIcon={<ExpandMore />}
                className="new-dropdown-v1"
              >
                Actions
              </Button>
              <Menu
                anchorEl={anchorActionEl}
                keepMounted
                getContentAnchorEl={null}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left'
                }}
                id="action-menu"
                open={Boolean(anchorActionEl)}
                onClose={closeActions}
              >
                <MenuItem
                  onClick={() => {
                    closeActions();
                    setShowDeleteConfirmBox(true);
                    setDeleteRecord(selectedRecords.map((d) => d._id));
                  }}
                >
                  Delete
                </MenuItem>
              </Menu>
            </Box>
          </Grid>
        </Grid>
      </Box>
      {columns && Object.keys(frameWorkComponent).length > 0 ? (
        <CustomAgGrid
          columns={columns}
          dataRows={dataRows}
          frameworkComponents={frameWorkComponent}
          setGridApi={setGridApi}
          dispatch={dispatch}
          rowCount={rowCount}
          limit={limit}
          pageSizes={pageSizes}
          page={page}
          actionWidth={150}
          loading={loading}
          renderedFrom={renderedFrom}
          refreshGrid={fetchData}
          allowAction={permissions?.warehouse?.isUpdate}
          isClientSideGrid={true}
          showOnlyShowFilteredRecordSwitch={false}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {openDialog && (
        <AssignUserDialog
          handleClose={() => {
            setOpenDialog(false);
          }}
          onSuccess={(data) => {
            handleAssignUser(data);
          }}
          reference={'warehouse'}
          isAssigning={isAssigning}
          ignoreUsers={dataRows?.map((e) => e?._id) || []}
        />
      )}
      {showDeleteConfirmBox && (
        <ConfirmationDialogRaw
          open={showDeleteConfirmBox}
          message={`Are you sure you want to remove the ${routes.user?.title?.toLowerCase()} ?`}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
    </Fragment>
  );
};

export default Users;
