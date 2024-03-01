import { Box, IconButton, MenuItem } from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import { camelCase } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import ConfirmationDialogRaw from 'src/components/Helpers/ConfirmationDialog';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { calculateRowsField } from 'src/components/RentalManagment/helper';
import { flattenArray } from 'src/constants/columns';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import GridDeleteIcon from '../../../components/Helpers/GridDeleteIcon';
import { CURReplaceByCurrencySingle } from '../../../constants/formulaUtility';
import { CHILD_RESOURCE, salesOrder } from '../../../constants/helpers';
import AdditionalCostDialog from './AdditionalCostDialog';

const AdditionalCost = ({ salesOrderData, setNextStep, stepFullScreen, allowedToEdit }) => {
  const renderedFrom = `${camelCase(routes?.salesOrder.title)}_Cost`;

  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();

  const [isUpdating, setUpdating] = useState(false);
  const [columns, setColumns] = useState(null);
  const [showCostDialog, setShowCostDialog] = useState({ open: false, showSaveAndNext: false });
  const [selectedCostData, setSelectedCostData] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecords, setDeleteRecords] = useState(null);

  const { state, dispatch } = useTableReducer();
  const { dataRows, selectedRecords } = state;
  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchFields();
  }, []);

  const handleOpen = (row, rows) => {
    setShowCostDialog({
      open: true,
      showSaveAndNext: row?.index < rows?.filter((e) => e?.depth === 0)?.length - 1 && row?.depth === 0 ? true : false
    });
    setSelectedCostData(row.original);
  };

  const fetchFields = async () => {
    var data = [];
    const response = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.salesOrderCost}`);
    data = response?.data?.data;
    const fields = CURReplaceByCurrencySingle(data, salesOrderData.currency);
    setAllFields(JSON.parse(JSON.stringify(fields)));
    const newColumns = generateColumns(renderedFrom, fields, null, false, salesOrderData?.currency);
    let column: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 100,
        sticky: 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
        Footer: () => {
          return <>Total</>;
        }
      }
    ];
    column = [...column, ...newColumns];
    column.push({
      accessor: 'action',
      Header: 'Actions',
      minWidth: 100,
      width: 150,
      sticky: 'right',
      disableFilters: true,
      disableSortBy: true,
      canDrag: false,
      Cell: ({ row, table }) =>
        allowedToEdit && (
          <Fragment>
            <HtmlTooltip title="Edit">
              <IconButton
                size="small"
                aria-label="Clone"
                onClick={() => {
                  handleOpen(row, table.getRowModel().rows);
                }}
              >
                <EditIcon color="primary" />
              </IconButton>
            </HtmlTooltip>
            <GridDeleteIcon
              hasDeletePermission={permissions?.salesOrder?.isUpdate}
              ownerId={user?.user?._id}
              userId={user?.user?._id}
              onDelete={() => {
                setShowDeleteConfirmBox(true);
                setDeleteRecords([row.original._id]);
              }}
              entity="salesOrder"
            />
          </Fragment>
        )
    });
    setColumns(column);
    fetchAdditionalCost();
  };

  const fetchAdditionalCost = async () => {
    try {
      dispatch({ type: 'loading', loading: true });
      dispatch({ type: 'selection', selectedRecords: [] });
      setNextStep(false);
      const response = await axiosInstance().get(`${salesOrder.api}/additionalcost/${salesOrderData._id}`);
      let rows = response?.data?.data;
      rows?.forEach((parent, i) => {
        parent.index = i + 1;
      });
      setNextStep(true);
      dispatch({ type: 'initialize', data: rows, count: rows?.length });
      dispatch({ type: 'loading', loading: false });
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleAddCost = (rows) => {
    setUpdating(true);
    axiosInstance()
      .post(`${salesOrder.api}/additionalcost/${salesOrderData._id}/add`, { additionalCost: rows })
      .then(({ data }) => {
        fetchAdditionalCost();
        setShowCostDialog({ open: false, showSaveAndNext: false });
        setUpdating(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((error) => {
        setUpdating(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleUpdateCost = (rows: any, saveAndNext = false) => {
    setUpdating(true);
    axiosInstance()
      .put(`${salesOrder.api}/additionalcost/${salesOrderData._id}/update`, { additionalCost: rows })
      .then(({ data }) => {
        setUpdating(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        if (saveAndNext) {
          const rowIndex = dataRows.findIndex((d) => d._id === rows[0]?._id);
          setSelectedCostData(dataRows[rowIndex + 1]);
          setShowCostDialog({
            open: true,
            showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false
          });
        } else {
          setShowCostDialog({ open: false, showSaveAndNext: false });
        }
        fetchAdditionalCost();
      })
      .catch((error) => {
        setUpdating(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleDeleteCost = () => {
    axiosInstance()
      .post(`${salesOrder.api}/additionalcost/${salesOrderData._id}/delete`, { ids: deleteRecords })
      .then(({ data }) => {
        fetchAdditionalCost();
        setShowDeleteConfirmBox(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const onSaveInlineEdit = async (inputField, updatedData) => {
    const rowData = flattenArray(dataRows)?.find((d) => d._id === updatedData._id);
    let rows: any = [{ ...rowData, ...updatedData }];
    rows = await calculateRowsField(flattenArray(dataRows), inputField, allFields, updatedData);
    handleUpdateCost(rows);
  };

  const addButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          onClick={() => {
            setShowCostDialog({ open: true, showSaveAndNext: false });
            setSelectedCostData(null);
          }}
        >
          Add
        </MenuItem>
      </>
    );
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        {permissions?.quotation?.isDelete && (
          <MenuItem
            onClick={() => {
              setShowDeleteConfirmBox(true);
              setDeleteRecords(selectedRecords.map((d) => d._id));
            }}
          >
            Delete
          </MenuItem>
        )}
      </>
    );
  };

  return (
    <Fragment>
      <DetailsPageHeader
        isAddButtonVisible={true}
        addButtonMenuItems={addButtonMenuItems()}
        isActionButtonVisible={true}
        actionButtonMenuItems={actionButtonMenuItems()}
        actionButtonProps={{ tooltip: selectedRecords.length ? '' : 'Please select some records', disabled: selectedRecords.length ? false : true }}
        hasXpadding
      />

      {columns ? (
        <Box zIndex={5}>
          <CustomReactTable
            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            refreshGrid={fetchAdditionalCost}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
            onSaveEdit={onSaveInlineEdit}
          />
        </Box>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {showCostDialog.open && (
        <AdditionalCostDialog
          onClose={() => {
            setShowCostDialog({ open: false, showSaveAndNext: false });
            setSelectedCostData(null);
          }}
          handleAddCost={handleAddCost}
          handleUpdateCost={handleUpdateCost}
          currency={salesOrderData?.currency}
          costData={selectedCostData}
          loadingEdit={isUpdating}
          showSaveAndNext={showCostDialog.showSaveAndNext}
        />
      )}
      {showDeleteConfirmBox && (
        <ConfirmationDialogRaw
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete  ? `}
          onClose={() => setShowDeleteConfirmBox(false)}
          onOk={handleDeleteCost}
        />
      )}
    </Fragment>
  );
};

export default AdditionalCost;
