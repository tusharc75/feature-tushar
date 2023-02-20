import { Box, Button, IconButton, Menu, MenuItem, Tooltip } from '@material-ui/core';
import { ExpandMore } from '@material-ui/icons';
import AddIcon from '@material-ui/icons/Add';
import { camelCase } from 'lodash';
import { Fragment, useContext, useEffect, useReducer, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomAgGrid, { intialState, reducer } from 'src/components/AgGridComponents/CustomAgGrid';
import routes from 'src/components/Helpers/Routes';
import { CHILD_RESOURCE, removeLocalStorage } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import DeleteIcon from '@material-ui/icons/Delete';
import { getColumnData } from 'src/constants/columns';
import { getFrameworkComponents } from 'src/constants/columns';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import AddCostDialog from './AddCostDialog';
import ConfirmationDialogRaw from 'src/components/Helpers/ConfirmationDialog';
import { CURReplaceByCurrencySingle } from 'src/constants/formulaUtility';

const AddCost = ({ id, fieldTicketData }) => {

  const renderedFrom = camelCase(routes?.fieldTicket.title);
  const toastConfig = useContext(CustomToastContext);

  const [anchorEl, setAnchorEl] = useState(null);
  const {
    state: { permissions, selectedEntity, user }
  }: any = useData();
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } = state;
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [gridApi, setGridApi] = useState(null);
  const [columns, setColumns] = useState([]);
  const localStorageSelectedRecords = `${renderedFrom}_selected`;
  const [addDialog, setAddDialog] = useState({ open: false, data: null });

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${CHILD_RESOURCE.fieldTicketCost}`)
      .then(({ data: { data } }) => {
        data = CURReplaceByCurrencySingle(data, fieldTicketData?.currency || "USD");
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          if (o?.fieldData?.fieldName === 'description') {
            columns = [
              ...columns,
              {
                field: o?.fieldData?.fieldName,
                headerName: o?.fieldData?.fieldLabel,
                show: true,
                disabled: true,
                cellRenderer: 'nameRenderer',
              }
            ];
          } else {
            let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.fieldTicket.path);
            if (currentColumn !== null) {
              columns = [...columns, currentColumn?.columnData];
              if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
                rendererNames.push(currentColumn?.rendererName);
              }
            }
          }
        });
        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
        tempFrameworkComponent = {
          ...tempFrameworkComponent,
          nameRenderer: NameRenderer,
          actionsRenderer: ActionsRenderer
        };
        setFrameWorkComponent({ ...tempFrameworkComponent });
        setColumns([...columns]);
      });
  }

  const fetchCostData = () => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .get(`/field-ticket/${id}/cost`)
      .then(({ data }) => {
        let rows = data?.data.map((i) => {
          return {
            ...i,
            price: i.price_cur,
            totalPrice: i.totalPrice_cur,
            finalPrice: i.finalPrice_cur
          }
        })
        dispatch({
          type: 'initialize',
          data: rows,
          count: data?.data.length
        });
        dispatch({ type: 'loading', loading: false });
      })
      .catch((err) => {
        dispatch({ type: 'loading', loading: false });
        toastConfig.setToastConfig(err);
      });
  }

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const handleDelete = () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords.map((m) => m._id);
    }
    axiosInstance()
      .put(`${routes?.fieldTicket?.path}/${id}/cost/remove`, { ids: ids })
      .then(({ data }) => {
        removeLocalStorage(localStorageSelectedRecords);
        fetchCostData();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const NameRenderer = (params) => {
    return (
      <span
        onClick={() => setAddDialog({ open: true, data: params.data })}
        className="link text-truncate">
        {params.value}
      </span>
    );
  };

  const ActionsRenderer = (params) => (
    <Fragment>
      {permissions.fieldTicket.isDelete ? (
        <Tooltip title="Delete">
          <IconButton
            aria-label="Delete"
            onClick={() => {
              setDeleteRecord(params.data);
              setShowDeleteConfirmBox(true);
            }}
          >
            <DeleteIcon fontSize="small" color="error" />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip className="cursor-stop" title="You do not have permission to delete">
          <IconButton aria-label="Delete" size="small">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Fragment>
  )

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    fetchCostData();
  }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly]);

  return (
    <Fragment>
      <Box display="flex" justifyContent="space-between" m={1}>
        <Box display="flex" alignItems="center">
          <Button
            variant={'outlined'}
            color="primary"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setAddDialog({ open: true, data: null })}
            aria-controls="add-menu"
          >
            {'Add Cost'}
          </Button>
        </Box>
        <Box display="flex">
          <Button
            disabled={selectedRecords.length ? false : true}
            variant={'outlined'}
            color="default"
            size="small"
            onClick={openActions}
            aria-controls="action-menu"
          >
            {'Actions'} <ExpandMore />
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
              disabled={
                !((selectedRecords?.length > 0 && selectedRecords?.length))
              }
              onClick={() => {
                closeActions();
                // eslint-disable-next-line no-lone-blocks
                {
                  selectedRecords.length === 1 && setDeleteRecord(selectedRecords[0]);
                }
                setShowDeleteConfirmBox(true);
              }}
            >
              Delete
            </MenuItem>
          </Menu>
        </Box>
      </Box>
      {Object.keys(frameWorkComponent).length > 0 && (
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
          allowAction={true}
          loading={loading}
          renderedFrom={renderedFrom}
          refreshGrid={fetchCostData}
          showOnlyShowFilteredRecordSwitch={true}
          isClientSideGrid={true}
        />
      )}
      {showDeleteConfirmBox && (
        <ConfirmationDialogRaw
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete Cost  ${deleteRecord?.description || ''} ?`}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {addDialog.open && (
        <AddCostDialog
          onClose={() => setAddDialog({ open: false, data: null })}
          onSuccess={() => {
            setAddDialog({ open: false, data: null })
            fetchCostData()
          }}
          fieldTicketData={fieldTicketData}
          costData={addDialog.data}
        />
      )}
    </Fragment>
  );
};

export default AddCost;
