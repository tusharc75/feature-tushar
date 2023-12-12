import { Box, Button, Grid, IconButton, Menu, MenuItem } from '@material-ui/core';
import { ExpandMore } from '@material-ui/icons';
import AddIcon from '@material-ui/icons/Add';
import { Fragment, useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTableNew';
import routes from 'src/components/Helpers/Routes';
import { CHILD_RESOURCE, fieldTicket } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import { flattenArray } from 'src/constants/columns';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import AddCostDialog from './AddCostDialog';
import ConfirmationDialogRaw from 'src/components/Helpers/ConfirmationDialog';
import { CURReplaceByCurrencySingle } from 'src/constants/formulaUtility';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import { calculateRowsField } from 'src/components/RentalManagment/helper';

const AddCost = ({ fieldTicketData, setNextStep, renderedFrom, allowedToEdit }) => {
  const toastConfig = useContext(CustomToastContext);

  const [anchorEl, setAnchorEl] = useState(null);
  const {
    state: { permissions }
  }: any = useData();
  const { state, dispatch } = useTableReducer();
  const { dataRows, selectedRecords } = state;
  const { generateColumns } = useColumns();

  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [columns, setColumns] = useState(null);
  const [addDialog, setAddDialog] = useState({ open: false, data: null });
  const [allFields, setAllFields] = useState([]);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field/child?resource=${CHILD_RESOURCE.fieldTicketCost}`)
      .then(({ data: { data } }) => {
        data = CURReplaceByCurrencySingle(data, fieldTicketData?.currency || 'USD');
        setAllFields(JSON.parse(JSON.stringify(data)));
        const newColumns = generateColumns(renderedFrom, data, null, false, fieldTicketData?.currency || 'USD');
        let columns: any = [
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
        columns = [...columns, ...newColumns];
        columns.push({
          accessor: 'action',
          Header: 'Actions',
          minWidth: 100,
          width: 100,
          sticky: 'right',
          disableFilters: true,
          disableSortBy: true,
          canDrag: false,
          Cell: ({ row }) => (
            <Grid container spacing={1}>
              <IconButton
                size="small"
                aria-label="Details"
                onClick={() => {
                  setAddDialog({ open: true, data: row.original });
                }}
              >
                <EditIcon fontSize="small" color="primary" />
              </IconButton>
              <IconButton
                size="small"
                aria-label="Details"
                onClick={() => {
                  setDeleteRecord(row.original);
                  setShowDeleteConfirmBox(true);
                }}
              >
                <DeleteIcon fontSize="small" color="error" />
              </IconButton>
            </Grid>
          )
        });
        setColumns(columns);
        fetchCostData();
      });
  };

  const fetchCostData = () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });

    axiosInstance()
      .get(`${fieldTicket.api}/${fieldTicketData?._id}/cost`)
      .then(({ data: { data } }) => {
        let rows = [];
        if (data) {
          rows = data?.map((i, index) => {
            return { index: index + 1, ...i };
          });
        }
        dispatch({ type: 'initialize', data: rows, count: rows?.length });
        dispatch({ type: 'loading', loading: false });
        setNextStep(true);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

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
      .put(`${routes?.fieldTicket?.path}/${fieldTicketData?._id}/cost/remove`, { ids: ids })
      .then(({ data }) => {
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

  const onSaveInlineEdit = async (inputField, updatedData) => {
    const rowData = flattenArray(dataRows)?.find((d) => d._id === updatedData._id);

    if (inputField.hasOwnProperty('qty')) {
      if (parseInt(inputField?.qty) === 0) {
        toastConfig.setToastConfig({
          open: true,
          type: 'error',
          message: 'Qty can not be 0'
        });
        return;
      }
    }
    let rows: any = [{ ...rowData, ...updatedData }];
    rows = await calculateRowsField(flattenArray(dataRows), inputField, allFields, updatedData);

    rows.forEach((element) => {
      delete element.index;
    });

    axiosInstance()
      .put(`${routes.fieldTicket?.path}/${fieldTicketData?._id}/cost`, rows)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchCostData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Fragment>
      {allowedToEdit && (
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
              {'Add Manual Entry'}
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
              endIcon={<ExpandMore />}
              className="new-dropdown-v1"
            >
              {'Actions'}
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
                disabled={!(selectedRecords?.length > 0 && selectedRecords?.length)}
                onClick={() => {
                  closeActions();
                  if (selectedRecords.length === 1) {
                    setDeleteRecord(selectedRecords[0]);
                  }
                  setShowDeleteConfirmBox(true);
                }}
              >
                Delete
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      )}
      {columns ? (
        <Box p="6px" zIndex={5} width={'100%'}>
          <CustomReactTable
            height={'calc(100vh - 345px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            setWholeRowsCellColor={(rowData) => (!rowData.isValid ? '' : '')}
            onSaveEdit={onSaveInlineEdit}
            renderedFrom={renderedFrom}
            hideAction={!allowedToEdit}
            hideSelection={!allowedToEdit}
            isClientSideGrid={true}
            refreshGrid={fetchCostData}
          />
        </Box>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
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
            setAddDialog({ open: false, data: null });
            fetchCostData();
          }}
          fieldTicketData={fieldTicketData}
          costData={addDialog.data}
        />
      )}
    </Fragment>
  );
};

export default AddCost;
