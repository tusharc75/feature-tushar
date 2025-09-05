import { useContext, useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import { Box, IconButton } from '@mui/material';
import { CustomDialogTransition, displayDateTime, sidebarResource } from 'src/constants/helpers';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { isMobile } from 'react-device-detect';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { camelCase, startCase } from "lodash";
import LogDialog from './LogDialog';


export default function ReportUpdateHistory({ id, onClose }: { id: string, onClose: () => void }) {

  const renderedFrom = `${camelCase(sidebarResource.scheduleReport)}_ReportUpdateHistory`;

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const [columns, setColumns] = useState(null);
  const toastConfig = useContext(CustomToastContext);
  const [openDialog, setOpenDialog] = useState({ open: false, data: null });

  useEffect(() => {
    fetchGridColumns();
    fetchHistory();
  }, []);

  const fetchGridColumns = () => {
    const columns = [
      {
        accessor: 'date',
        Header: 'Date Time',
        width: 300,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row?.original?.date}</p>
      },
      {
        accessor: 'user',
        Header: 'User',
        width: 300,
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
        width: 500,
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

  const fetchHistory = async () => {
    dispatch({ type: 'loading', loading: true });
    try {
      const { data: { data } } = await axiosInstance().get(`/schedule-report/history/${id}`);

      const processedData = data?.map(historyItem => {
        const formattedDate = displayDateTime(historyItem?.date);
        const changes = historyItem?.log?.map(logEntry => {
          const isArray = Array.isArray(logEntry.oldValue) || Array.isArray(logEntry.newValue);
          return isArray
            ? `${startCase(logEntry.fieldName)}: [${logEntry.oldValue}] → [${logEntry.newValue}]`
            : `${startCase(logEntry.fieldName)}: ${logEntry.oldValue || ''} → ${logEntry.newValue || ''}`;
        })?.join(', ');
        return {
          ...historyItem,
          date: formattedDate,
          changes
        };
      });

      dispatch({
        type: 'initialize',
        data: processedData || [],
        count: (processedData || []).length
      });
    } catch (err) {
      toastConfig.setToastConfig(err);
    } finally {
      dispatch({ type: 'loading', loading: false });
    }
  };

  return (
    <Dialog
      fullScreen={true}
      TransitionComponent={CustomDialogTransition}
      open={true}
      fullWidth
    >
      <CustomDialogHeader
        showRequiredLabel={false}
        title="Report Update History"
        onClose={onClose}
      />
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
      {openDialog?.open && (
        <LogDialog
          onClose={() => setOpenDialog({ open: false, data: null })}
          data={openDialog?.data}
        />
      )}
    </Dialog>
  );
}
