import { useState, useEffect, useContext } from 'react';
import { Box, Dialog, } from '@mui/material';
import axiosInstance from '../../axios/axiosInstance';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { CustomDialogTransition, sidebarResource } from '../../constants/helpers';
import { camelCase } from 'lodash';
import { isMobile, isTablet } from 'react-device-detect';
import CustomReactTable, { getStaticFields, useTableReducer } from 'src/components/CustomReactTable';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { Link } from 'react-router-dom';
import routes from 'src/components/Helpers/Routes';

const renderedFrom = `${camelCase(sidebarResource?.serializedAsset)}_rentalAssetHistory`;

const RentalAssetHistory = ({ asset, rentalId, cols, onClose }) => {
  const toastConfig = useContext(CustomToastContext);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [columns, setColumns] = useState(null);

  const rentalJobColumn = {
    accessor: 'rentalManagement',
    Header: 'Rental Job',
    disableFilters: true,
    disableSortBy: true,
    Cell: ({ row }) => (
      <>
        {row?.original?.rentalJobId ? (
          <Link
            className="link"
            title={row.original.rentalJob}
            to={`${routes.rentalManagementDetail.path}/${row?.original?.rentalJobId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {row.original.rentalJob}
          </Link>
        ) : (
          <NoDataCell />
        )}
      </>
    )
  };

  useEffect(() => {
    const newColumns: any = [rentalJobColumn, ...(cols?.map((col) => {
      const { Footer, ...rest } = col;
      return rest;
    })), getStaticFields()[0]];
    setColumns(newColumns);
  }, [cols]);

  useEffect(() => {
    if (rentalId && asset) {
      fetchData();
    }
  }, [rentalId, asset]);


  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .get(`/history/rental-asset-history?rental=${rentalId}&asset=${asset}`)
      .then(({ data: { data } }) => {
        data = data?.map((u) => {
          let finalRow: any = {};
          Object.keys(u?.assetData || {})?.forEach((key) => {
            finalRow[`assetData.${key}`] = u?.assetData[key];
          });
          finalRow['createdBy'] = u?.createdBy?.user?.concatedName;
          finalRow['createdByDate'] = u?.createdBy?.date;
          finalRow['createdById'] = u?.createdBy?.user?._id;
          finalRow['rentalJobId'] = u?.rentalJob?.optionValue;
          finalRow['rentalJob'] = u?.rentalJob?.optionLabel;
          return finalRow;
        });
        dispatch({ type: 'initialize', data: data, count: data?.length });
        dispatch({ type: 'loading', loading: false });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  return (
    <Dialog
      maxWidth="md"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      onClose={onClose}
      fullWidth
    >
      <CustomDialogHeader
        title={`Rental Asset History`}
        onClose={onClose}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
        showRequiredLabel={false}
      ></CustomDialogHeader>
      <CustomDialogContent>
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 300px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            showFilters={false}
            hideSelection={true}
            isClientSideGrid={true}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomDialogContent>
    </Dialog >
  );
};

export default RentalAssetHistory;
