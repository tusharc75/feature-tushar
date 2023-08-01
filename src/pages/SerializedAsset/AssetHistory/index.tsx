import { useState, useEffect, useContext, useReducer } from 'react';
import { Box } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomAgGrid, { intialState, reducer } from '../../../components/AgGridComponents/CustomAgGrid';
import { CommonRenderer, DateTimeRenderer } from '../../../components/AgGridComponents/CustomAgGridCellRenderers';
import { Link } from 'react-router-dom';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import { camelCase } from 'lodash';

const AssetHistory = ({ id }) => {
  const toastConfig = useContext(CustomToastContext);

  const [gridApi, setGridApi] = useState(null);

  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

  const NameRenderer = (params: { value: any; data: { type: string; referenceId: any } }) => (
    <>
      {params.value ? (
        params.data.type === 'Loading Ticket' ||
          params.data.type === 'Receiving Ticket' ||
          params.data.type === 'Return Ticket' ||
          params.data.type === 'Delivery Ticket' ? (
          <Link
            className="link"
            title={params.value}
            to={`${routes.deliveryTicketDetail.path}/${params.data.referenceId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {params.value}
          </Link>
        ) : params.data.type?.toLowerCase() === 'repair' ? (
          <Link
            className="link"
            title={params.value}
            to={`${routes.repairJobDetail.path}/${params.data.referenceId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {params.value}
          </Link>
        ) : params.data.type === 'Work Order' ? (
          <Link
            className="link"
            title={params.value}
            to={`${routes.workOrderDetail.path}/${params.data.referenceId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {params.value}
          </Link>
        ) : params.data.type === 'Repair Order' ? (
          <Link
            className="link"
            title={params.value}
            to={`${routes.repairOrderDetail.path}/${params.data.referenceId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {params.value}
          </Link>
        ) : params.data.type?.toLowerCase() === 'rental' ? (
          <Link
            className="link"
            title={params.value}
            to={`${routes.rentalManagementDetail.path}/${params.data.referenceId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {params.value}
          </Link>
        ) : params.data.type === 'Transfer Assets' ? (
          <Link
            className="link"
            title={params.value}
            to={`${routes.transferAssetDetail.path}/${params.data.referenceId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {params.value}
          </Link>
        ) : params.data.type?.toLowerCase().includes('purchase') ? (
          <Link
            className="link"
            title={params.value}
            to={`${routes.purchaseOrderDetail.path}/${params.data.referenceId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {params.value}
          </Link>
        ) : params.data.type?.toLowerCase().includes('sublease') ? (
          <Link
            className="link"
            title={params.value}
            to={`${routes.subleaseDetail.path}/${params.data.referenceId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {params.value}
          </Link>
        ) : params.data?.type === 'Bulk Asset Creation' ? (
          <Link
            className="link"
            title={params.value}
            to={`${routes.bulkAssetCreationDetail.path}/${params.data.referenceId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {params.value}
          </Link>
        ) : params.data?.type === 'Transfer Inventory' ? (
          <Link
            className="link"
            title={params.value}
            to={`${routes.transferInventoryDetail.path}/${params.data.referenceId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {params.value}
          </Link>
        )  : params.data?.type === 'Job' ? (
          <Link
            className="link"
            title={params.value}
            to={`${routes.jobDetail.path}/${params.data.referenceId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {params.value}
          </Link>
        ) : (
          params.value
        )
      ) : (
        <NoDataCell />
      )}
    </>
  );

  const DaysRenderer = (params: any) => (
    <>
      {params.value ? (
        <span>{params.value}</span>
      ) : (
        <span>Less than a day</span>
      )}
    </>
  );

  const frameworkComponents = {
    nameRenderer: NameRenderer,
    commonRenderer: CommonRenderer,
    daysRenderer: DaysRenderer,
    dateTimeRenderer: DateTimeRenderer
  };

  const columns = [
    { field: 'reference', headerName: 'Reference', show: true, cellRenderer: 'nameRenderer' },
    { field: 'type', headerName: 'Type', show: true, disabled: true, cellRenderer: 'commonRenderer' },
    { field: 'date', headerName: 'Date & Time', show: true, disabled: true, filter: false, cellRenderer: 'dateTimeRenderer' },
    { field: 'days', headerName: 'Days', show: true, disabled: true, filter: false, cellRenderer: 'daysRenderer' },
    { field: 'status', headerName: 'Status', show: true, cellRenderer: 'commonRenderer' },
    { field: 'comments', headerName: 'Comment', show: true, cellRenderer: 'commonRenderer' },
    { field: 'location', headerName: 'Location', show: true, cellRenderer: 'commonRenderer' },
    { field: 'ownerType', headerName: 'Owner Type', show: true, cellRenderer: 'commonRenderer' },
    { field: 'owner', headerName: 'Owner', show: true, cellRenderer: 'commonRenderer' }
  ];

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    axiosInstance()
      .get(`/history/inventory/${id}`)
      .then(({ data: { data } }) => {
        data = data?.map((u, index) => ({
          ...u,
          _id: index + 1,
          id: index + 1,
          reference: u?.reference?.optionLabel,
          referenceId: u?.reference?.optionValue
        }));
        dispatch({ type: 'initialize', data: data, count: data.length });
        dispatch({ type: 'loading', loading: false });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  return (
    <Box>
      {columns ? (
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
          allowAction={false}
          allowSelection={false}
          isClientSideGrid={true}
          loading={loading}
          renderedFrom={`${camelCase(routes?.serializedAsset.title)}_assetHistory`}
          refreshGrid={fetchData}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Box>
  );
};

export default AssetHistory;
