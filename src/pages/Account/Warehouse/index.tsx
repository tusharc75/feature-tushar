import { Button, Grid, IconButton } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import { gridLoadingTimeout, prepareDataForGrid } from '../../../constants/helpers';
import routes from './../../../components/Helpers/Routes';
import CustomReactTable, { getStaticFields, useColumns, useTableReducer } from 'src/components/CustomReactTableNew';
import { Box } from '@material-ui/core';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteIcon from '@material-ui/icons/Delete';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialogRaw from '../../../components/Helpers/ConfirmationDialog';
import WarhouseList from './WarhouseList';
import { camelCase } from 'lodash';

const Warehouse = ({ reference, api, id, accountId = '' }) => {
  const renderedFrom = camelCase(routes?.warehouse.title);
  const toastConfig = useContext(CustomToastContext);
  const { state, dispatch } = useTableReducer();
  const { dataRows, page, limit, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { getColumnData } = useColumns();

  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [openAssignWarehouse, setOpenAssignWarehouse] = useState(false);
  const [isAddingWarehouse, setAddingWarehouse] = useState(false);
  const [warehouseArray, setWarehouseArray] = useState([]);
  const [columns, setColumns] = useState(null);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    fetchData();
  }, [page, limit, filters, sorting, selectedEntity, showFilteredRecordsOnly]);

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=Warehouse`);
    data = response?.data?.data;
    let columns = [];
    data.forEach((o) => {
      let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.warehouseDetail.path, true);
      if (currentColumn !== null) {
        columns = [...columns, currentColumn?.columnData];
      }
      return o?.fieldData;
    });
    columns = [...columns, ...getStaticFields(), ActionsRenderer];
    setColumns(columns);
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 110,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        <HtmlTooltip title="Delete">
          <IconButton
            size="small"
            aria-label="Delete"
            onClick={() => {
              setDeleteRecord(row.original);
              setShowDeleteConfirmBox(true);
            }}
          >
            <DeleteIcon color="error" />
          </IconButton>
        </HtmlTooltip>
      </>
    )
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .get(`/${api}/${id}/warehouse`)
      .then(({ data: { data } }) => {
        setWarehouseArray(data);
        let rows = data?.map((u) => {
          let finalObject = prepareDataForGrid(u?.warehouseDetail);
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === u?.warehouseDetail._id);
          return finalObject;
        });
        dispatch({ type: 'initialize', data: rows, count: rows?.length });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      })
      .finally(() => {
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      });
  };

  const handleDelete = () => {
    setIsSubmitting(true);
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords?.map((d) => d._id);
    }
    let tempArray = warehouseArray.filter((obj) => ids.some((d) => d === obj.warehouse)).map((d) => d._id);
    axiosInstance()
      .put(`/${api}/${id}/warehouse/remove`, { ids: tempArray })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        dispatch({ type: 'selection', selectedRecords: [] });
        fetchData();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
        setIsSubmitting(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsSubmitting(false);
      });
  };

  const handleAddWarehouse = (rows) => {
    setAddingWarehouse(true);
    axiosInstance()
      .post(`/${api}/${id}/warehouse`, { warehouse: rows.map((d) => d._id) })
      .then(() => {
        setOpenAssignWarehouse(false);
        fetchData();
        setAddingWarehouse(false);
      })
      .catch((error) => {
        setOpenAssignWarehouse(false);
        toastConfig.setToastConfig(error);
        setAddingWarehouse(false);
      });
  };

  return (
    <>
      {permissions[reference]?.isUpdate ? (
        <Box display="flex" justifyContent="space-between" m={1}>
          <Box display="flex" pt={1} alignItems="center">
            <Button
              variant={'contained'}
              color="primary"
              size="small"
              onClick={() => {
                setOpenAssignWarehouse(true);
              }}
            >
              {`Assign ${routes.warehouse.title}`}
            </Button>
          </Box>
          <Box display="flex" pt={1} justifyContent="flex-end">
            <Button
              variant="contained"
              color="primary"
              size="small"
              disabled={selectedRecords.length === 0}
              onClick={() => {
                setShowDeleteConfirmBox(true);
              }}
            >
              Delete
            </Button>
            <Box mx={1} />
          </Box>
        </Box>
      ) : null}
      <Grid item xs={12} md={12} sm={12} className="mt-3">
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            showOnlyShowFilteredRecordSwitch={false}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Grid>
      {showDeleteConfirmBox && (
        <ConfirmationDialogRaw
          open={true}
          message={`Are you sure you want to delete this ${routes.warehouse.title}?`}
          okBtnLoading={isSubmitting}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openAssignWarehouse && (
        <WarhouseList
          isCustomer={reference === 'customerContact'}
          api={reference === 'customerContact' ? `/customer-account/${accountId}/warehouse` : '/warehouse'}
          isAddingWarehouse={isAddingWarehouse}
          addWarehouse={handleAddWarehouse}
          onClose={() => {
            setOpenAssignWarehouse(false);
          }}
          assignedWarehouse={dataRows.map((d) => d._id)}
        />
      )}
    </>
  );
};

export default Warehouse;
