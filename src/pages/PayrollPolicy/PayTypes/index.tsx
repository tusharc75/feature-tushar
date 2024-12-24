import { Box, IconButton, MenuItem } from '@mui/material';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { getStaticFields, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ImportExportMenu from 'src/components/Helpers/ImportExportMenu';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { CHILD_RESOURCE, gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import { cloneDisable, deleteDisable, editDisable } from 'src/constants/messageHelpers';
import { useData } from '../../../StateProvider/Provider';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import ManagePayType from './ManagePayType';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';

const PayTypes = ({ payrollPolicyId }) => {
  const renderedFrom = `${camelCase(sidebarResource.payrollPolicy)}_payTypes`;
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { rowCount, selectedRecords } = state;
  const {
    state: { permissions, user }
  }: any = useData();

  const [payTypeDialog, setPayTypeDialog] = useState({ open: false, data: null, isClone: false });
  const [showConfirmBox, setShowConfirmBox] = useState({ open: false, ids: null });
  const [deleting, setDeleting] = useState(false);
  const [columns, setColumns] = useState(null);
  const { generateColumns } = useColumns();

  const fetchGridColumns = async () => {
    let data;
    data = await fetch_child_resource_fields(CHILD_RESOURCE.payrollPayTypes, user.user?.brandCurrency, true);
    const newColumns = generateColumns(renderedFrom, data);
    setColumns([...newColumns, ...getStaticFields(), ActionsRenderer]);
  };

  useEffect(() => {
    fetchGridColumns();
    fetchData();
  }, [payrollPolicyId]);

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 100,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        <HtmlTooltip title={permissions?.payrollPolicy?.isUpdate ? 'Edit' : editDisable}>
          <IconButton
            size="small"
            aria-label="Edit"
            disabled={!permissions?.payrollPolicy?.isUpdate}
            onClick={() => {
              setPayTypeDialog({ open: true, data: row?.original, isClone: false });
            }}
          >
            <EditIcon color={permissions?.payrollPolicy?.isUpdate ? 'primary' : 'disabled'} />
          </IconButton>
        </HtmlTooltip>
        <HtmlTooltip title={permissions?.payrollPolicy?.isCreate ? 'Clone' : cloneDisable}>
          <IconButton
            size="small"
            aria-label="Clone"
            disabled={!permissions?.payrollPolicy?.isCreate}
            onClick={() => {
              setPayTypeDialog({ open: true, isClone: true, data: row?.original });
            }}
          >
            <FileCopyIcon fontSize="small" color={permissions?.payrollPolicy?.isCreate ? 'primary' : 'disabled'} />
          </IconButton>
        </HtmlTooltip>
        <HtmlTooltip title={permissions?.payrollPolicy?.isDelete ? 'Delete' : deleteDisable}>
          <IconButton
            size="small"
            aria-label="Delete"
            disabled={!permissions?.payrollPolicy?.isDelete}
            onClick={() => {
              setShowConfirmBox({ open: true, ids: [row?.original?._id] });
            }}
          >
            <DeleteIcon color={permissions?.payrollPolicy?.isDelete ? 'error' : 'disabled'} />
          </IconButton>
        </HtmlTooltip>
      </>
    )
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    axiosInstance()
      .get(`${routes.payrollPolicy.path}/pay-types/${payrollPolicyId}`)
      .then(({ data: { data } }) => {
        data = data?.map((u) => {
          let finalObject = prepareDataForGrid(u);
          return {
            ...finalObject
          };
        });
        dispatch({
          type: 'initialize',
          data: data,
          count: data.length
        });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((err) => {
        dispatch({ type: 'loading', loading: false });
        toastConfig.setToastConfig(err);
      });
  };

  const handleDelete = () => {
    setDeleting(true);
    axiosInstance()
      .put(`${routes.payrollPolicy.path}/pay-types/remove`, { ids: showConfirmBox.ids })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          message: data.message,
          severity: 'success'
        });
        setDeleting(false);
        fetchData();
        setShowConfirmBox({ open: false, ids: null });
      })
      .catch((err) => {
        setDeleting(false);
        toastConfig.setToastConfig(err);
      });
  };

  const addButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          onClick={() => {
            setPayTypeDialog({ open: true, data: null, isClone: false });
          }}
        >
          Add Pay Type
        </MenuItem>
      </>
    );
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          onClick={() => {
            setShowConfirmBox({ open: true, ids: selectedRecords?.map((e) => e._id) });
          }}
        >
          Delete
        </MenuItem>
      </>
    );
  };

  const rightSideContents = () => {
    return (
      <>
        <ImportExportMenu
          permissions={permissions?.payrollPolicy}
          module="pay-types"
          api={`${routes.payrollPolicy.path}/pay-types`}
          afterImportCompleted={() => {
            fetchData();
          }}
          isExportAllOrSomeFeature={true}
          total={rowCount}
          recordsToExport={selectedRecords.length}
          ids={selectedRecords?.length ? selectedRecords?.map((obj) => obj._id) : []}
          additionalParams={`payrollPolicy=${payrollPolicyId}`}
        />
      </>
    );
  };

  return (
    <>
      {permissions?.payrollPolicy?.isUpdate && (
        <>
          <DetailsPageHeader
            isAddButtonVisible={true}
            addButtonMenuItems={addButtonMenuItems()}
            isActionButtonVisible={true}
            actionButtonMenuItems={actionButtonMenuItems()}
            actionButtonProps={{ disabled: selectedRecords.length ? false : true }}
            rightSideContents={rightSideContents()}
            hasXpadding={false}
          />
        </>
      )}
      {columns ? (
        <CustomReactTable
          height={'calc(100vh - 200px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          renderedFrom={renderedFrom}
          isClientSideGrid={true}
          refreshGrid={fetchData}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {payTypeDialog.open && (
        <ManagePayType
          onClose={() => setPayTypeDialog({ open: false, data: null, isClone: false })}
          onSuccess={() => {
            setPayTypeDialog({ open: false, data: null, isClone: false });
            fetchData();
          }}
          currency={user.user?.brandCurrency}
          payTypeData={payTypeDialog.data}
          payrollPolicyId={payrollPolicyId}
          isClone={payTypeDialog.isClone}
        />
      )}
      {showConfirmBox.open && (
        <ConfirmationDialog
          open={true}
          message={`Are you sure you want to delete this Pay Type?`}
          okBtnLoading={deleting}
          onClose={() => {
            setShowConfirmBox({ open: false, ids: null });
          }}
          onOk={handleDelete}
        />
      )}
    </>
  );
};

export default PayTypes;
