import { useContext, useEffect, useReducer, useState } from 'react';
import Dialog from '@material-ui/core/Dialog/Dialog';
import { CustomDialogTransition } from 'src/constants/helpers';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { Box, IconButton } from '@material-ui/core';
import CustomAgGrid, { intialState, reducer } from 'src/components/AgGridComponents/CustomAgGrid';
import { camelCase, startCase } from 'lodash';
import routes from 'src/components/Helpers/Routes';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import axiosInstance from 'src/axios/axiosInstance';
import { CommonRenderer, CreatedByRenderer, DateTimeRenderer, LinkRenderer } from 'src/components/AgGridComponents/CustomAgGridCellRenderers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import VisibilityIcon from '@material-ui/icons/Visibility';
import LogDialog from './LogDialog';

const HistoryLogs = ({ onClose, open, resource }) => {
  const [state, dispatch] = useReducer(reducer, intialState);
  const renderedFrom = camelCase(routes?.formBuilder.title);
  const [gridApi, setGridApi] = useState(null);
  const toastConfig = useContext(CustomToastContext);
  const [openDialog, setOpenDialog] = useState({ open: false, log: null });
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  const columns = [
    { field: 'date', headerName: 'Date Time', show: true, cellRenderer: 'dateTimeRenderer' },
    { field: 'user', headerName: 'User', show: true, cellRenderer: 'nameRenderer' }
  ];

  const ActionsRenderer = (params) => (
    <>
      <HtmlTooltip title="View Changes">
        <IconButton onClick={() => setOpenDialog({ open: true, log: params?.data?.log })}>
          <VisibilityIcon color="primary" fontSize="small" />
        </IconButton>
      </HtmlTooltip>
    </>
  );

  const NameRenderer = (params) => {
    return <span>{params?.value?.optionLabel}</span>;
  };

  const frameworkComponents = {
    nameRenderer: NameRenderer,
    dateTimeRenderer: DateTimeRenderer,
    actionsRenderer: ActionsRenderer
  };
  useEffect(() => {
    fetchHistory();
  }, [page, limit, filters, sorting, search, showFilteredRecordsOnly]);

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
        {columns && frameworkComponents ? (
          <CustomAgGrid
            columns={columns}
            dataRows={dataRows}
            frameworkComponents={frameworkComponents}
            setGridApi={setGridApi}
            dispatch={dispatch}
            rowCount={rowCount}
            limit={limit}
            pageSizes={pageSizes}
            page={page}
            allowAction={true}
            loading={loading}
            allowSelection={false}
            isClientSideGrid={true}
            showOnlyShowFilteredRecordSwitch={true}
            refreshGrid={fetchHistory}
            renderedFrom={renderedFrom}
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
