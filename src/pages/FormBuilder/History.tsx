import { useContext, useEffect, useState } from 'react';
import Dialog from '@material-ui/core/Dialog/Dialog';
import { CustomDialogTransition, dateTimeFormat } from 'src/constants/helpers';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { Box, IconButton } from '@material-ui/core';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import { camelCase, startCase } from 'lodash';
import routes from 'src/components/Helpers/Routes';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import VisibilityIcon from '@material-ui/icons/Visibility';
import { isMobile } from 'react-device-detect';
import LogDialog from './LogDialog';
import moment from 'moment';

const HistoryLogs = ({ onClose, open, resource }) => {
  const { state, dispatch } = useTableReducer();
  const renderedFrom = camelCase(routes?.formBuilder.title);
  const [columns, setColumns] = useState(null);
  const toastConfig = useContext(CustomToastContext);
  const [openDialog, setOpenDialog] = useState({ open: false, log: null });
  const { page, limit } = state;

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchGridColumns = () => {
    let columns = [
      {
        accessor: 'date',
        Header: 'Date Time',
        width: 120,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{moment(row?.original?.date)?.format(dateTimeFormat)}</p>
      },

      {
        accessor: 'user',
        Header: 'User',
        width: 120,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (
          <p className="text-truncate" title={row?.original?.user?.optionLabel}>
            {row?.original?.user?.optionLabel}
          </p>
        )
      },

      ActionsRenderer
    ];
    setColumns(columns);
  };

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
        <HtmlTooltip title="View Changes">
          <IconButton onClick={() => setOpenDialog({ open: true, log: row?.original?.log })}>
            <VisibilityIcon color="primary" fontSize="small" />
          </IconButton>
        </HtmlTooltip>
      </>
    )
  };

  const fetchHistory = () => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .get(`/history/resource-log?resource=${resource}`)
      .then(({ data: { data } }) => {
        dispatch({
          type: 'initialize',
          data: data,
          count: data?.length
        });
        dispatch({ type: 'loading', loading: false });
      })
      .catch((err) => {
        dispatch({ type: 'loading', loading: false });
        toastConfig.setToastConfig(err);
      });
  };

  return (
    <Dialog fullScreen={true} TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={open} fullWidth>
      <CustomDialogHeader showRequiredLabel={false} title={`History`} onClose={onClose}></CustomDialogHeader>
      <div className="listing-grid p-3">
        {columns ? (
          <CustomReactTable
          height={'calc(100vh - 250px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          renderedFrom={renderedFrom}
          refreshGrid={fetchHistory}
          isClientSideGrid={true}
          hideSelection={true}
        />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </div>
      {openDialog?.open && <LogDialog open={openDialog?.open} onClose={() => setOpenDialog({ open: false, log: null })} log={openDialog?.log} />}
    </Dialog>
  );
};

export default HistoryLogs;
