import React, { useState, useEffect, useContext, Fragment } from 'react';
import { Box, Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import { useData } from '../../../StateProvider/Provider';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { rentalManagement } from '../../../constants/helpers';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import AdditionalCostDialog from './AdditionalCostDialog';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import { CustomOfflineContext } from '../../../StateProvider/OfflineContext/OfflineContext';
import { objectStore, findOne } from '../../../constants/indexdbhelper';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { calculateRowsField, fetch_rental_cost_fields } from '../../../components/RentalManagment/helper';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { BiChevronDown } from 'react-icons/bi';
import { flattenArray } from 'src/constants/columns';
import { ownerAndColaborator, quotationApprovedMessage } from 'src/constants/messageHelpers';
import Add from '@material-ui/icons/Add';
import { DetailsPageHeader } from 'src/components/PageHeaders';

const AdditionalCost = ({ rentalManagementData, setNextStep, renderedFrom, stepFullScreen, allowedToEdit, quotationApproved }) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();

  const [columns, setColumns] = useState(null);
  const [showCostDialog, setShowCostDialog] = useState({ open: false, showSaveAndNext: false });
  const [selectedCostData, setSelectedCostData] = useState(null);
  const { isOffline } = useContext(CustomOfflineContext);
  const [isUpdating, setUpdating] = useState(false);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [isRateRequired, setIsRateRequired] = useState(false);
  const [allFields, setAllFields] = useState(null);

  const { state, dispatch } = useTableReducer();
  const { dataRows, selectedRecords } = state;
  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchFields();
    fetchData();
  }, []);

  useEffect(() => {
    if (allFields) {
      createColumns();
    }
  }, [allFields, allowedToEdit, quotationApproved]);

  const handleOpen = (row, rows) => {
    setShowCostDialog({
      open: true,
      showSaveAndNext: row?.index < rows?.filter((e) => e?.depth === 0)?.length - 1 && row?.depth === 0 ? true : false
    });
    setSelectedCostData(row.original);
  };

  const fetchFields = async () => {
    const fields = await fetch_rental_cost_fields(rentalManagementData.currency, isOffline);
    setAllFields(fields);
  };

  const createColumns = () => {
    setColumns(null);
    const data = [...allFields];
    if (!allowedToEdit || quotationApproved) {
      data?.forEach((e) => {
        e.isColumnEditable = false;
      });
    }
    const newColumns = generateColumns(renderedFrom, data, null, false, rentalManagementData?.currency);
    let column: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
        Footer: () => {
          return <>Total</>;
        }
      }
    ];
    column = [...column, ...newColumns];
    const isPriceRequired = data.filter((el) => el.fieldName === 'price' && el.required).length > 0;
    setIsRateRequired(isPriceRequired);
    column.push({
      accessor: 'action',
      Header: 'Actions',
      minWidth: 100,
      width: 100,
      sticky: 'right',
      disableFilters: true,
      disableSortBy: true,
      canDrag: false,
      Cell: ({ row, table }) =>
        !isOffline && (
          <Fragment>
            <HtmlTooltip title="Edit">
              <IconButton
                size="small"
                aria-label="Clone"
                onClick={() => {
                  handleOpen(row, table.getRowModel().rows);
                }}
              >
                <EditIcon color="primary" fontSize="small" />
              </IconButton>
            </HtmlTooltip>
            {permissions?.rentalManagement?.isUpdate && allowedToEdit && !quotationApproved ? (
              <HtmlTooltip title="Delete">
                <IconButton
                  size="small"
                  aria-label="Delete"
                  onClick={() => {
                    setDeleteData([row?.original?._id]);
                  }}
                >
                  <DeleteIcon color="error" fontSize="small" />
                </IconButton>
              </HtmlTooltip>
            ) : (
              <HtmlTooltip className="cursor-stop" title={`You do not have permission to delete rentalManagement`}>
                <IconButton size="small" aria-label="Delete">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </HtmlTooltip>
            )}
          </Fragment>
        )
    });
    setColumns(column);
  };

  const fetchData = async () => {
    setNextStep(false);
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    try {
      var data: any = [];
      if (isOffline) {
        data = await findOne(objectStore.rentalManagement, rentalManagementData._id);
        data = data?.additionalCost;
      } else {
        const response = await axiosInstance().get(`${rentalManagement.api}/additionalcost/${rentalManagementData._id}`);
        data = response?.data?.data;
      }

      data.forEach((parent, i) => {
        parent.index = i + 1;
        parent.isValid = parent['finalPrice_' + rentalManagementData?.currency?.toLowerCase()] ? true : !isRateRequired;
      });

      dispatch({ type: 'initialize', data: data, count: data?.length });
      dispatch({ type: 'loading', loading: false });
      setNextStep(true);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleAddCost = (rows) => {
    setUpdating(true);
    axiosInstance()
      .post(`${rentalManagement.api}/additionalcost/${rentalManagementData._id}/add`, { additionalCost: rows })
      .then(() => {
        fetchData();
        setShowCostDialog({ open: false, showSaveAndNext: false });
        setUpdating(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setUpdating(false);
      });
  };

  const handleUpdateCost = (rows: any, saveAndNext = false) => {
    setUpdating(true);
    axiosInstance()
      .put(`${rentalManagement.api}/additionalcost/${rentalManagementData._id}/update`, { additionalCost: rows })
      .then(({ data }) => {
        setUpdating(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        if (saveAndNext) {
          const rowIndex = dataRows?.findIndex((d) => d._id === rows[0]?._id);
          setSelectedCostData(dataRows[rowIndex + 1]);
          setShowCostDialog({
            open: true,
            showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false
          });
        } else {
          setShowCostDialog({ open: false, showSaveAndNext: false });
        }
        fetchData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleDelete = (ids) => {
    setDeleting(true);
    axiosInstance()
      .post(`${rentalManagement.api}/additionalcost/${rentalManagementData._id}/delete`, { ids })
      .then(() => {
        fetchData();
        setDeleting(false);
        setDeleteData(null);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setDeleteData(null);
      });
  };

  const onSaveInlineEdit = async (inputField, updatedData) => {
    const rowData = flattenArray(dataRows)?.find((d) => d._id === updatedData._id);
    let rows: any = [{ ...rowData, ...updatedData }];
    rows = await calculateRowsField(flattenArray(dataRows), inputField, allFields, updatedData);
    handleUpdateCost(rows);
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        <HtmlTooltip
          title={Boolean(selectedRecords && selectedRecords?.length) ? 'Delete selected records' : 'Select records to delete'}
          placement="top"
          arrow
          enterTouchDelay={0}
        >
          <MenuItem
            disabled={isDeleting}
            onClick={() => {
              setDeleteData(selectedRecords?.map(({ _id }: any) => _id));
            }}
          >
            Delete
          </MenuItem>
        </HtmlTooltip>
      </>
    );
  };

  return (
    <Fragment>
      <DetailsPageHeader
        isAddButtonVisible={true}
        addButtonProps={{
          tooltip: !allowedToEdit ? ownerAndColaborator : quotationApproved ? quotationApprovedMessage : ``,
          disabled: allowedToEdit && !isOffline && !quotationApproved ? false : true,
          onClick: () => {
            setShowCostDialog({ open: true, showSaveAndNext: false });
            setSelectedCostData(null);
          }
        }}
        isActionButtonVisible={true}
        actionButtonMenuItems={actionButtonMenuItems()}
        actionButtonProps={{ disabled: !Boolean(selectedRecords?.length && selectedRecords?.filter((e) => !e.hideSelection).length) }}
        hasXpadding
      />

      {columns ? (
        <Box zIndex={5}>
          <CustomReactTable
            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            setWholeRowsCellColor={(rowData) => (!rowData.isValid ? 'error' : '')}
            refreshGrid={fetchData}
            hideSelection={isOffline || !allowedToEdit || quotationApproved}
            hideAction={isOffline || !allowedToEdit || quotationApproved}
            renderedFrom={renderedFrom}
            onSaveEdit={onSaveInlineEdit}
            isClientSideGrid={true}
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
          currency={rentalManagementData?.currency}
          costData={selectedCostData}
          loadingEdit={isUpdating}
          showSaveAndNext={showCostDialog.showSaveAndNext}
        />
      )}
      {deleteData && (
        <ConfirmationDialog
          open={true}
          message={`Are you sure you want to delete the record(s)?`}
          onClose={() => setDeleteData(null)}
          onOk={() => handleDelete(deleteData)}
          okBtnLoading={isDeleting}
        />
      )}
    </Fragment>
  );
};

export default AdditionalCost;
