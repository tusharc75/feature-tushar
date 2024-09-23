import { useContext, useEffect, useState } from 'react';
import Dialog from '@material-ui/core/Dialog/Dialog';
import { CustomDialogTransition, dateTimeFormat } from 'src/constants/helpers';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { Box, IconButton } from '@material-ui/core';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import { camelCase } from 'lodash';
import routes from 'src/components/Helpers/Routes';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import VisibilityIcon from '@material-ui/icons/Visibility';
import { isMobile } from 'react-device-detect';
import LogDialog from './LogDialog';
import moment from 'moment';
import NoDataCell from 'src/components/Helpers/NoDataCell';

const renderedFrom = camelCase(routes?.formBuilder.title);

const HistoryLogs = ({ onClose, resource }) => {
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const [columns, setColumns] = useState(null);
  const toastConfig = useContext(CustomToastContext);
  const [openDialog, setOpenDialog] = useState({ open: false, data: null });

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
        Cell: ({ row }) => <p className="text-truncate">{row?.original?.date}</p>
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
      {
        accessor: 'changes',
        Header: 'Changes',
        width: 300,
        Cell: ({ row }) =>
          row?.original?.changes ? (
            <div>
              <p className="text-truncate">{row?.original?.changes}</p>
            </div>
          ) : (
            <NoDataCell />
          )
      },
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
            <HtmlTooltip title="View Changes">
              <IconButton onClick={() => setOpenDialog({ open: true, data: row?.original })}>
                <VisibilityIcon color="primary" fontSize="small" />
              </IconButton>
            </HtmlTooltip>
          </>
        )
      }
    ];
    setColumns(columns);
  };

  const fetchHistory = () => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .get(`/history/resource-log?resource=${resource}`)
      .then(({ data: { data } }) => {
        data?.forEach((element) => {
          element.date = moment(element?.date)?.format(dateTimeFormat);
          element.changes = element?.log?.map((e) => e?.detail)?.toString();
        });
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
    <Dialog fullScreen={true} TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true} fullWidth>
      <CustomDialogHeader showRequiredLabel={false} title={`History`} onClose={onClose}></CustomDialogHeader>
      <div className="listing-grid p-3">
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchHistory}
            isClientSideGrid={true}
            hideSelection={true}
            showArrangeView={false}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </div>
      {openDialog?.open && <LogDialog onClose={() => setOpenDialog({ open: false, data: null })} data={openDialog?.data} />}
    </Dialog>
  );
};

export default HistoryLogs;
