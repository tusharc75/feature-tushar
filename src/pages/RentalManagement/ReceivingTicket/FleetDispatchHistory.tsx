import { useContext, useEffect, useState } from 'react';
import { Dialog, Box } from '@mui/material';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { CustomDialogTransition, gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import { camelCase } from 'lodash';
import routes from 'src/components/Helpers/Routes';
import CustomReactTable, { getStaticFields, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { fetch_resource_view_fields } from 'src/components/ResourceFields';

const FleetDispatchHistory = ({ rentalId, assetData, onClose }) => {

  const renderedFrom = `${camelCase(sidebarResource?.fleetDispatch)}_history_logs`;

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const toastConfig = useContext(CustomToastContext);
  const [columns, setColumns] = useState(null);
  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchData();
  }, [rentalId, assetData?._id]);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchData = async () => {
    try {
      dispatch({ type: 'loading', loading: true });
      const response = await axiosInstance().get(`${routes.fleetDispatch.path}/history?rentalId=${rentalId}&asset=${assetData?._id}`);
      const rows = response?.data?.data?.map((e) => prepareDataForGrid(e));
      dispatch({ type: 'initialize', data: rows, count: rows?.length });
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    } catch (e) {
      toastConfig.setToastConfig(e);
      dispatch({ type: 'loading', loading: false });
    }
  };

  const fetchFields = async () => {
    try {
      const { fieldsDataForRead } = await fetch_resource_view_fields(sidebarResource.fleetDispatch, true);
      const column = generateColumns(renderedFrom, fieldsDataForRead?.filter((e) => !['rentalJob', 'asset']?.includes(e?.fieldData?.fieldName)));
      let staticFields: any = getStaticFields();
      setColumns([...column, ...staticFields]);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  return (
    <Dialog
      open={true}
      TransitionComponent={CustomDialogTransition}
      fullScreen={true}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          onClose();
        }
      }}
      maxWidth="sm"
      fullWidth
    >
      <CustomDialogHeader title={`${assetData?.assetNumber || ''} - Dispatch History`} onClose={onClose} showRequiredLabel={false} />
      <CustomDialogContent>
        {columns ? (
          <CustomReactTable
            height={'calc(120vh - 393px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
            hideSelection={true}
            hideAction={true}
            hideExportTable={true}
            refreshGrid={fetchData}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomDialogContent>
    </Dialog>
  );
};

export default FleetDispatchHistory;
