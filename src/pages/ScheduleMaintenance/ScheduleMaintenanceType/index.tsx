import { Delete, Edit } from '@mui/icons-material';
import { Box, Dialog, IconButton, MenuItem } from '@mui/material';
import axios, { CancelTokenSource } from 'axios';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomReactTable, { getStaticFields, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialogRaw from 'src/components/Helpers/ConfirmationDialog';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { CustomDialogTransition, gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import ManageScheduleMaintenanceType from 'src/pages/ScheduleMaintenance/ScheduleMaintenanceType/ManageScheduleMaintenanceType';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const ScheduleMaintenanceTypeDialog = ({ handleClose }) => {
  const { setToastConfig } = useContext(CustomToastContext);
  const renderedFrom = `${camelCase(sidebarResource.schedulingMaintenance)}_Type`;

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { selectedRecords } = state;

  const [showScheduleMaintenanceType, setShowScheduleMaintenanceType] = useState({ open: false, data: null });
  const [showConfirmBox, setShowConfirmBox] = useState({ open: false, data: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const columns = [
    {
      accessor: 'name',
      Header: 'Name',
      width: 200,
      Cell: ({ row }) => (row.original?.name ? <p>{row.original?.name}</p> : <NoDataCell />)
    },
    ...getStaticFields(),
    {
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
          <HtmlTooltip title="Edit">
            <span>
              <IconButton
                size="small"
                onClick={() => {
                  setShowScheduleMaintenanceType({ open: true, data: row?.original });
                }}
              >
                <Edit fontSize="small" color="primary" />
              </IconButton>
            </span>
          </HtmlTooltip>
          <HtmlTooltip title="Delete">
            <span>
              <IconButton
                size="small"
                onClick={() => {
                  setShowConfirmBox({ open: true, data: [row.original] });
                }}
              >
                <Delete fontSize="small" color="error" />
              </IconButton>
            </span>
          </HtmlTooltip>
        </>
      )
    }
  ];

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, []);

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .get(`/scheduled-maintenance-type`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data } }) => {
        let rows = data.map((u) => {
          let finalObject: any = prepareDataForGrid(u);
          finalObject['isChecked'] = false;
          return finalObject;
        });
        dispatch({ type: 'initialize', data: rows, count: rows?.length });
      })
      .catch((error) => {
        setToastConfig(error);
      })
      .finally(() => {
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      });
  };

  const handleRemove = () => {
    setIsDeleting(true);
    const { data } = showConfirmBox;
    axiosInstance()
      .put(`/scheduled-maintenance-type/remove`, {
        ids: data?.map((d) => d?._id)
      })
      .then(({ data }) => {
        setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
        dispatch({ type: 'selection', selectedRecords: [] });
        setIsDeleting(false);
        setShowConfirmBox({ open: false, data: null });
        fetchData();
      })
      .catch((err) => {
        setToastConfig(err);
        setIsDeleting(false);
      });
  };

  const ActionMenuItems = () => {
    return (
      <>
        <MenuItem disabled={selectedRecords.length === 0} onClick={() => setShowConfirmBox({ open: true, data: selectedRecords })}>
          Delete
        </MenuItem>
      </>
    );
  };

  return (
    <Dialog
      maxWidth="md"
      fullScreen={true}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
    >
      <CustomDialogHeader title={`Schedule Maintenance Type`} onClose={handleClose} showRequiredLabel={false}></CustomDialogHeader>
      <CustomDialogContent>
        <>
          <ListingPageHeader
            isActionButtonVisible={true}
            actionButtonProps={{ disabled: selectedRecords?.length ? false : true }}
            actionMenuItems={<ActionMenuItems />}
            addButtonOnclick={() => {
              setShowScheduleMaintenanceType({ open: true, data: null });
            }}
            isAddButtonVisible={true}
          />
          {columns ? (
            <CustomReactTable
              height={'calc(100vh - 250px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              renderedFrom={renderedFrom}
              refreshGrid={fetchData}
              showFilters={false}
              isClientSideGrid={true}
            />
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
          {showScheduleMaintenanceType?.open && (
            <ManageScheduleMaintenanceType
              handleClose={() => {
                setShowScheduleMaintenanceType({ open: false, data: null });
              }}
              data={showScheduleMaintenanceType?.data}
              handleSuccess={() => {
                setShowScheduleMaintenanceType({ open: false, data: null });
                fetchData();
              }}
            />
          )}
          {showConfirmBox.open && (
            <ConfirmationDialogRaw
              open={true}
              message={`Are you sure you want to remove selected item(s)?`}
              okBtnLoading={isDeleting}
              onClose={() => {
                setShowConfirmBox({ open: false, data: null });
              }}
              onOk={handleRemove}
            />
          )}
        </>
      </CustomDialogContent>
    </Dialog>
  );
};

export default ScheduleMaintenanceTypeDialog;
