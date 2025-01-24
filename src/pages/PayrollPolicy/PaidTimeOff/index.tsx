import { Box, IconButton, MenuItem } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ImportExportMenu from 'src/components/Helpers/ImportExportMenu';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { CHILD_RESOURCE, gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import ManagePaidTimeOff from './ManagePaidTimeOff';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';

const PaidTimeOff = ({ payrollPolicyData }) => {
  const renderedFrom = `${camelCase(sidebarResource.payrollPolicy)}_paidTimeOff`;
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { rowCount, selectedRecords } = state;
  const {
    state: { permissions, user }
  }: any = useData();

  const { generateColumns } = useColumns();

  const [columns, setColumns] = useState(null);
  const [managePaidTimeOff, setManagePaidTimeOff] = useState({ open: false, id: null });
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);

  useEffect(() => {
    fetchFields();
    fetchData();
  }, []);

  const fetchFields = async () => {
    var data = await fetch_child_resource_fields(CHILD_RESOURCE.payrollPaidTimeOff, user.user?.brandCurrency, true);
    const newColumns = generateColumns(renderedFrom, data);

    newColumns?.forEach((e: any) => {
      e.editable = false;
    });
    setColumns([
      ...newColumns,
      {
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
            <HtmlTooltip title={'Edit'}>
              <IconButton
                size="small"
                aria-label="Edit"
                onClick={() => {
                  setManagePaidTimeOff({ open: true, id: row?.original?._id });
                }}
              >
                <EditIcon fontSize="small" color={'primary'} />
              </IconButton>
            </HtmlTooltip>

            <HtmlTooltip title={'Delete'}>
              <IconButton
                size="small"
                aria-label="Delete"
                onClick={() => {
                  setShowConfirmBox(true);
                  setDeleteRecord(row?.original);
                }}
              >
                <DeleteIcon fontSize="small" color={'error'} />
              </IconButton>
            </HtmlTooltip>
          </>
        )
      }
    ]);
  };

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });

    axiosInstance()
      .get(`${routes.payrollPolicy?.path}/paid-time-off/${payrollPolicyData?._id}`)
      .then(({ data: { data, count } }) => {
        let rows = data?.map((u) => {
          let finalObject: any = prepareDataForGrid(u, user);
          finalObject['isChecked'] = selectedRecords?.some((s) => s._id === u._id);
          return finalObject;
        });
        dispatch({ type: 'initialize', data: rows, count: count });
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
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords?.map((d) => d._id);
    }
    axiosInstance()
      .put(`${routes?.payrollPolicy?.path}/paid-time-off/${payrollPolicyData?._id}/remove`, { ids: ids })
      .then(() => {
        fetchData();
        setShowConfirmBox(false);
        setDeleteRecord(null);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const addButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          onClick={() => {
            setManagePaidTimeOff({ open: true, id: null });
          }}
        >
          Add Paid Time Off
        </MenuItem>
      </>
    );
  };
  const actionButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          onClick={() => {
            setShowConfirmBox(true);
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
          module="paid-time-off"
          api={`${routes.payrollPolicy.path}/paid-time-off/${payrollPolicyData?._id}`}
          afterImportCompleted={() => {
            fetchData();
          }}
          isExportAllOrSomeFeature={true}
          total={rowCount}
          recordsToExport={selectedRecords.length}
          ids={selectedRecords?.length ? selectedRecords?.map((obj) => obj._id) : []}
          additionalParams={`payrollPolicyId=${payrollPolicyData?._id}`}
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
          height={'calc(100vh - 283px)'}
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
      {managePaidTimeOff?.open && (
        <ManagePaidTimeOff
          payrollPolicyId={payrollPolicyData?._id}
          currency={user.user?.brandCurrency}
          id={managePaidTimeOff?.id}
          onSuccess={() => {
            fetchData();
            setManagePaidTimeOff({ open: false, id: null });
          }}
          onClose={() => {
            setManagePaidTimeOff({ open: false, id: null });
          }}
        />
      )}

      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${deleteRecord?.name || ''} ?`}
          onClose={() => {
            setDeleteRecord(null);
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
    </>
  );
};

export default PaidTimeOff;
