import { useState, useReducer, Fragment, useContext, useEffect, FC } from 'react';
import { Button, Box } from '@material-ui/core';
import { Link } from 'react-router-dom';

import axiosInstance from '../../axios/axiosInstance';
import routes from '../../components/Helpers/Routes';
import NoDataCell from '../../components/Helpers/NoDataCell';
import { isMobile } from 'react-device-detect';
import ManageDeliveryTicket from '../DeliveryTicket/ManageDeliveryTicket';
import { CommonRenderer, DateRenderer } from '../../components/AgGridComponents/CustomAgGridCellRenderers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';

interface LoadingGridProps {
  fetchAssets: any;
  plantId: string;
  permissions: any;
  warehouse: any;
  transferAssetData?: any;
  transferAssetId: string | any;
  setNextStep: any;
  setTransferIsEnded: any;
}

const LoadingTicketGrid: FC<LoadingGridProps> = (props) => {
  const { fetchAssets, transferAssetId, warehouse, plantId, transferAssetData, setNextStep, setTransferIsEnded } = props;
  const toastConfig = useContext(CustomToastContext);

  const [openLoadingTicketDialog, setOpenLoadingTicketDialog] = useState(false);
  const [assetWithNoTicket, setAssetWithNoTicket] = useState([]);

  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;
  const columns = [
    { field: 'assetNumber', headerName: 'Asset Number', show: true, disabled: true, cellRenderer: 'assetRenderer' },
    { field: 'serialNumber', headerName: 'Serial Number', show: true, disabled: true, cellRenderer: 'commonRenderer' },
    { field: 'deliveryTicket', headerName: 'Loading Ticket', show: true, disabled: true, cellRenderer: 'ticketRenderer' },
    { field: 'product', headerName: 'Product Description', show: true, cellRenderer: 'productRenderer' },
    { field: 'status', headerName: 'Status', show: true, cellRenderer: 'commonRenderer' }
  ];

  const AssetRenderer = (params) =>
    params.value ? (
      <Link className="link cursor-pointer" to={`${routes.productInventoryDetail.path}/${params.data._id}`}>
        <p title={params.value}>{params.value}</p>
      </Link>
    ) : (
      <NoDataCell />
    );

  const TicketRenderer = (params) =>
    params.value ? (
      <Link className="link cursor-pointer" to={`${routes.deliveryTicketDetail.path}/${params.data.deliveryTicketId}`}>
        <p title={params.value}>{params.value}</p>
      </Link>
    ) : (
      <NoDataCell />
    );

  const ProductRenderer = (params) =>
    params.value ? (
      <Link className="link cursor-pointer" to={`${routes.productDetail.path}/${params.data.productId}`}>
        <p title={params.value}>{params.value}</p>
      </Link>
    ) : (
      <NoDataCell />
    );

  const frameworkComponents = {
    ticketRenderer: TicketRenderer,
    productRenderer: ProductRenderer,
    assetRenderer: AssetRenderer,
    commonRenderer: CommonRenderer,
    dateRenderer: DateRenderer
  };

  useEffect(() => {
    if (transferAssetId) {
      fetchAssetsData(false)
      fetchLoadingTickets()
    }
  }, [transferAssetId])

  const fetchAssetsData = async (forceRefresh) => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }

    try {
      let assetData = await fetchAssets(forceRefresh);
      let ticketData: any = await fetchLoadingTickets()
      assetData = [...assetData?.map((d: any) => ({
        ...d,
        product: d.product.optionLabel,
        productId: d.product.optionValue
      }))]

      for (let i = 0; i < ticketData.length; i++) {
        for (let j = 0; j < assetData.length; j++) {
          if (ticketData[i]?.productInventory.some((asset: any) => (
            assetData[j]._id === (typeof asset === 'object' ? asset.optionValue : asset)
          ))) {
            assetData[j].deliveryTicket = ticketData[i].deliveryJobName
            assetData[j].deliveryTicketId = ticketData[i]._id
          }
        }
      }

      // console.log(assetData)


      dispatch({ type: 'initialize', data: assetData, count: assetData.length });
      dispatch({ type: 'loading', loading: false });
    } catch (error) {
      dispatch({ type: 'loading', loading: false });
      toastConfig.setToastConfig(error);
    }
    // axiosInstance().get(`${routes.transferAsset.path}/get-asset/${plantId}`)
    //   .then(({ data: { data } }) => {
    //     data = data?.map((d: any) => ({
    //       ...d,
    //       product: d.product.optionLabel,
    //       productId: d.product.optionValue,
    //     }))
    //     gridDispatch({ type: "initialize", data: data, count: data.length })
    //     gridDispatch({ type: "loading", loading: false });
    //   }).catch(err => {

    //   })
  };


  const fetchLoadingTickets = () => new Promise((resolve, reject) => {
    axiosInstance().get(`${routes.transferAsset.path}/${transferAssetId}/loading-ticket?limit=0`)
      .then(({ data: { data } }) => {
        resolve(data)
      })
      .catch(err => {
        reject(err);
      })

  })


  useEffect(() => {
    if (selectedRecords.length > 0) {
      const inventoryWithNoTicket = selectedRecords.filter((asset: any) => !asset?.hasOwnProperty("deliveryTicket"))
      setAssetWithNoTicket(inventoryWithNoTicket)
    }

    if (dataRows.length > 0) {
      const inventoryWithNoTicket = dataRows.filter((asset: any) => !asset?.hasOwnProperty("deliveryTicket"));

      if (inventoryWithNoTicket.length > 0) {
        setNextStep(false)
        setTransferIsEnded(false)

      } else {
        setTransferIsEnded(true)
        setNextStep(true)
      }
    }


  }, [dataRows, selectedRecords])


  return (
    <Fragment>
      <Box display="flex" justifyContent="space-between" mx="4px">
        <div></div>
        <Box>
          <Button
            variant="contained"
            size="small"
            color="primary"
            disabled={selectedRecords.length === 0 || assetWithNoTicket.length === 0}
            onClick={() => setOpenLoadingTicketDialog(true)}
          >
            Create Loading Ticket
          </Button>
        </Box>
      </Box>

      <Box mt={1}>
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
          actionWidth={100}
          allowSelection={true}
          isClientSideGrid={true}
          loading={loading}
          renderedFrom="transferAssetPage"
          refreshGrid={() => fetchAssetsData(true)}
        />
      </Box>

      {/* Loading ticket create dialog */}
      {openLoadingTicketDialog && (
        <ManageDeliveryTicket
          onClose={() => setOpenLoadingTicketDialog(false)}
          productInventoryForDeliveryTicket={assetWithNoTicket}
          warehouseId={warehouse}
          transferData={transferAssetData}
          onSuccess={() => {
            setOpenLoadingTicketDialog(false);
            fetchAssetsData(true)
          }}
        />
      )}


    </Fragment>
  );
};

export default LoadingTicketGrid;
