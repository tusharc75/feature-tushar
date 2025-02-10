import { useState, useEffect, useContext } from 'react';
import { Box, Dialog, } from '@mui/material';
import axiosInstance from '../../../axios/axiosInstance';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { CustomDialogTransition, displayDateTime, prepareDataForGrid, sidebarResource } from '../../../constants/helpers';
import { camelCase } from 'lodash';
import CustomReactTable, { useTableReducer, useColumns } from 'src/components/CustomReactTable';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { Link } from 'react-router-dom';
import routes from 'src/components/Helpers/Routes';


const RentalAssetHistoryDialog = ({ asset, rentalJob, fields, onClose }) => {

  const renderedFrom = `${camelCase(sidebarResource?.serializedAsset)}_rentalAssetHistory`;

  const toastConfig = useContext(CustomToastContext);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const [fullScreen, setFullScreen] = useState(true);
  const [columns, setColumns] = useState(null);

  const { generateColumns } = useColumns();

  useEffect(() => {
    const extraColumn = [{
      accessor: 'rentalJob',
      Header: 'Rental Job',
      disableFilters: true,
      disableSortBy: true,
      Cell: ({ row }) => (
        <div>
          {row?.original?.rentalJobId ? (
            <Link
              className="link"
              title={row.original.rentalJob}
              to={`${routes.rentalManagementDetail.path}/${row?.original?.rentalJobId}`}
              target="_blank"
            >
              {row.original.rentalJob}
            </Link>
          ) : (
            <NoDataCell />
          )}
        </div>
      ),
    },
    {
      accessor: 'date',
      Header: 'Date & Time',
      disabled: true,
      disableFilters: true,
      disableSortBy: false,
      Cell: ({ row }) =>
        row.original?.date ? (
          <div title={`${displayDateTime(row.original?.date)}`}>
            {displayDateTime(row.original?.date)}
          </div>
        ) : (
          <NoDataCell />
        )
    }];
    let columns = generateColumns(renderedFrom, fields)?.map((col) => {
      const { Footer, ...rest } = col;
      return rest;
    });
    const newColumns: any = [...extraColumn, ...columns];
    setColumns(newColumns);
  }, [fields]);


  useEffect(() => {
    if (rentalJob && asset) {
      fetchData();
    }
  }, [rentalJob, asset]);


  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .get(`/history/rental-asset-data-history?rentalJob=${rentalJob}&asset=${asset}`)
      .then(({ data: { data } }) => {
        data = data?.map((u) => {
          let finalRow: any = prepareDataForGrid(u);
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
      fullScreen={fullScreen}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      onClose={onClose}
      fullWidth
      maxWidth="md"
    >
      <CustomDialogHeader
        title={`Rental Asset Data History`}
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
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            showFilters={false}
            hideSelection={true}
            isClientSideGrid={true}
            showArrangeView={false}
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

export default RentalAssetHistoryDialog;
