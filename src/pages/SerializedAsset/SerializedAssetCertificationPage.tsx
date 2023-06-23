import React, { useState, useEffect, useContext, Fragment, useReducer } from 'react';
import { Grid, Box} from '@material-ui/core';
import axiosInstance from '../../axios/axiosInstance';
import routes from '../../components/Helpers/Routes';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { serializedAsset, ASSET_STATUS, repairJob, INVENTORY_OWNER_TYPE, INVENTORY_HISTORY_TYPE } from '../../constants/helpers';
import CustomAgGrid, { intialState, reducer } from '../../components/AgGridComponents/CustomAgGrid';
import { CommonRenderer, DateTimeRenderer } from '../../components/AgGridComponents/CustomAgGridCellRenderers';
import { Link } from 'react-router-dom';
import NoDataCell from '../../components/Helpers/NoDataCell';

const SerializedAssetCertificationPage = ({id}) => {
  const toastConfig = useContext(CustomToastContext);
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

  const NameRenderer = (params: { value: any; data: { type: string; referenceId: any; }; }) => (
    <>
      {params.value ? (
        params.data.type === 'Loading Ticket' ||
        params.data.type === 'Receiving Ticket' ||
        params.data.type === 'Return Ticket' ||
        params.data.type === 'Delivery Ticket' ? (
          <Link className="link" title={params.value} to={`${routes.deliveryTicketDetail.path}/${params.data.referenceId}`}>
            {params.value}
          </Link>
        ) : params.data.type?.toLowerCase() === 'repair' ? (
          <Link className="link" title={params.value} to={`${routes.repairJobDetail.path}/${params.data.referenceId}`}>
            {params.value}
          </Link>
        ) : params.data.type === 'Work Order' ? (
          <Link className="link" title={params.value} to={`${routes.workOrderDetail.path}/${params.data.referenceId}`}>
            {params.value}
          </Link>
        ) : params.data.type === 'Repair Order' ? (
          <Link className="link" title={params.value} to={`${routes.repairOrderDetail.path}/${params.data.referenceId}`}>
            {params.value}
          </Link>
        ) : params.data.type?.toLowerCase() === 'rental' ? (
          <Link className="link" title={params.value} to={`${routes.rentalManagementDetail.path}/${params.data.referenceId}`}>
            {params.value}
          </Link>
        ) : params.data.type === 'Transfer Assets' ? (
          <Link className="link" title={params.value} to={`${routes.transferAssetDetail.path}/${params.data.referenceId}`}>
            {params.value}
          </Link>
        ) : params.data.type?.toLowerCase().includes('purchase') ? (
          <Link className="link" title={params.value} to={`${routes.purchaseOrderDetail.path}/${params.data.referenceId}`}>
            {params.value}
          </Link>
        ) : params.data.type?.toLowerCase().includes('sublease') ? (
          <Link className="link" title={params.value} to={`${routes.subleaseDetail.path}/${params.data.referenceId}`}>
            {params.value}
          </Link>
        ) : params.data?.type === 'Bulk Asset Creation' ? (
          <Link className="link" title={params.value} to={`${routes.bulkAssetCreationDetail.path}/${params.data.referenceId}`}>
            {params.value}
          </Link>
        ) : params.data?.type === 'Transfer Inventory' ? (
          <Link className="link" title={params.value} to={`${routes.transferInventoryDetail.path}/${params.data.referenceId}`}>
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

  const frameworkComponents = {
    nameRenderer: NameRenderer,
    commonRenderer: CommonRenderer,
    dateTimeRenderer: DateTimeRenderer
  };

  const columns = [
    { field: 'supplierAccount', headerName: 'Supplier Account', show: true, cellRenderer: 'commonRenderer' },
    { field: 'issueDate', headerName: 'Issue Date', show: true, cellRenderer: 'dateTimeRenderer' },
    { field: 'expiryDate', headerName: 'Expiry Date', show: true, cellRenderer: 'dateTimeRenderer' }
  ];

  useEffect(() => {
    if (id) {
      fetchProductCertificateHistory();
    }
  }, [id]);


  const fetchProductCertificateHistory = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    axiosInstance()
      .get(`${serializedAsset.api}/${id}/certificate`)
      .then(({ data: { data } }) => {
        data = data?.map((u: { supplierAccount: { optionLabel: any; }; }, index: number) => ({
          ...u,
          _id: index + 1,
          id: index + 1,
          supplierAccount: u?.supplierAccount?.optionLabel
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
    <Box className={`detail-container-v1`}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={12} md={12} lg={12}>
          <div className="form-v1 mt-4">
            <div className="single-form-v1">
              <div className="form-head-v1">
                <h3 className="form-label-style-v1" title="Certification History">
                  Certification History
                </h3>
              </div>
              <Grid item xs={12} sm={12} md={12} lg={12} className="formdata-v1">
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
                    renderedFrom="rentalManagementDetailsPageInventory"
                    refreshGrid={fetchProductCertificateHistory}
                  />
                ) : (
                  <Box p={2} height={500}>
                    <CommonSkeleton lenArray={[...Array(10).keys()]} />
                  </Box>
                )}
              </Grid>
            </div>
          </div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SerializedAssetCertificationPage;
