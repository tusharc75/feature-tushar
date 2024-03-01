import { Box, Grid, IconButton, MenuItem } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import { camelCase } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialogRaw from 'src/components/Helpers/ConfirmationDialog';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { CURReplaceByCurrencySingle } from 'src/constants/formulaUtility';
import { CHILD_RESOURCE } from 'src/constants/helpers';
import AdditionalCostDialog from './AdditionalCostDialog';

const AdditionalCost = ({ invoiceData, stepFullScreen, setNextStep }) => {
  const renderedFrom = `${camelCase(routes?.invoice.title)}_Cost`;

  const toastConfig = useContext(CustomToastContext);

  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [columns, setColumns] = useState(null);
  const [addDialog, setAddDialog] = useState({ open: false, data: null });

  const { state, dispatch } = useTableReducer();
  const { selectedRecords } = state;
  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field/child?resource=${CHILD_RESOURCE.invoiceCost}`)
      .then(({ data: { data } }) => {
        data = CURReplaceByCurrencySingle(data, invoiceData?.currency || 'USD');
        const newColumns = generateColumns(renderedFrom, data, null, false, invoiceData?.currency || 'USD');
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
        fetchData();
      });
  };

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    axiosInstance()
      .get(`${routes.invoice.path}/${invoiceData._id}/additional-cost`)
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

  const handleDelete = () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords.map((m) => m._id);
    }
    axiosInstance()
      .put(`${routes?.invoice?.path}/${invoiceData._id}/additional-cost/remove`, { ids: ids })
      .then(({ data }) => {
        fetchData();
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

  const actionButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={!(selectedRecords?.length > 0 && selectedRecords?.length)}
          onClick={() => {
            if (selectedRecords.length === 1) {
              setDeleteRecord(selectedRecords[0]);
            }
            setShowDeleteConfirmBox(true);
          }}
        >
          Delete
        </MenuItem>
      </>
    );
  };

  return (
    <Fragment>
      <DetailsPageHeader
        isAddButtonVisible={true}
        addButtonProps={{ onClick: () => setAddDialog({ open: true, data: null }) }}
        isActionButtonVisible={true}
        actionButtonMenuItems={actionButtonMenuItems()}
        actionButtonProps={{
          disabled: selectedRecords.length ? false : true,
          tooltip: selectedRecords.length ? '' : 'Select records to edit'
        }}
        hasXpadding
      />

      {columns ? (
        <Box zIndex={5} width={'100%'}>
          <CustomReactTable
            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            refreshGrid={fetchData}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
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
        <AdditionalCostDialog
          onClose={() => setAddDialog({ open: false, data: null })}
          onSuccess={() => {
            setAddDialog({ open: false, data: null });
            fetchData();
          }}
          invoiceData={invoiceData}
          costData={addDialog.data}
        />
      )}
    </Fragment>
  );
};

export default AdditionalCost;
