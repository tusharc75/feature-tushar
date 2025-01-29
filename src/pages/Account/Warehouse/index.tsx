import { Box, IconButton, MenuItem } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import CustomReactTable, { getStaticFields, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import ConfirmationDialogRaw from '../../../components/Helpers/ConfirmationDialog';
import { gridLoadingTimeout, prepareDataForGrid, sidebarResource } from '../../../constants/helpers';
import routes from './../../../components/Helpers/Routes';
import WarhouseList from './WarhouseList';
import { DeleteButton } from 'src/components/Helpers/Buttons';

const Warehouse = ({ reference, api, id, accountId = '' }) => {
  const renderedFrom = camelCase(sidebarResource?.warehouse);
  const toastConfig = useContext(CustomToastContext);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, page, limit, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { generateColumns } = useColumns();

  const {
    state: { user, permissions, selectedEntity, resources }
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
    const newColumns = generateColumns(renderedFrom, data, routes.warehouseDetail.path, true);
    setColumns([...newColumns, ...getStaticFields(), ActionsRenderer]);
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
            <DeleteIcon color="error" fontSize='small' />
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

  const rightSideContents = () => {
    return (
      <>
        {permissions[reference]?.isUpdate && selectedRecords.length && (
          <DeleteButton
            onClick={() => {
              setShowDeleteConfirmBox(true);
            }}
            text="Delete"
          />
        )}
      </>
    );
  };

  const addButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          onClick={() => {
            setOpenAssignWarehouse(true);
          }}
        >
          {`Assign ${resources?.warehouse?.titlePlural}`}
        </MenuItem>
      </>
    );
  };

  return (
    <>
      <DetailsPageHeader
        isAddButtonVisible={permissions[reference]?.isUpdate}
        isActionButtonVisible={false}
        addButtonMenuItems={addButtonMenuItems()}
        rightSideContents={rightSideContents()}
        hasXpadding={false}
      />
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
      {showDeleteConfirmBox && (
        <ConfirmationDialogRaw
          open={true}
          message={`Are you sure you want to delete ${deleteRecord
            ? `${resources?.warehouse?.titleSingular?.toLowerCase()} :
             ${deleteRecord?.warehouseName}`
            : `selected ${resources?.warehouse?.titlePlural?.toLowerCase()}`
            } ?`}
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
