import { useState, useReducer, Fragment, useContext, useEffect, FC } from 'react';
import { Button, Box } from '@material-ui/core';
import { Link } from 'react-router-dom';

import axiosInstance from '../../axios/axiosInstance';
import routes from '../../components/Helpers/Routes';
import NoDataCell from '../../components/Helpers/NoDataCell';
import { receivingTicket, sidebarResource } from '../../constants/helpers';
import { isMobile } from 'react-device-detect';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import { groupBy } from 'lodash';
import ManageReceivingTicket from '../ReceivingTicket/ManageReceivingTicket';
import { CommonRenderer, DateRenderer } from '../../components/AgGridComponents/CustomAgGridCellRenderers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';

interface ReceivingGridProps {
  fetchAssets: any;
  permissions: any;
  transferAssetData: any;
  transferAssetId: string | any;
  setNextStep: any;
  setPrevStep: any;
  setTransferIsEnded?: any;
  currentStep: number;
  setTickets: any;
}

const ReceivingTicketGrid: FC<ReceivingGridProps> = (props) => {
  const { fetchAssets, transferAssetId, setPrevStep, transferAssetData, setTickets, setNextStep, setTransferIsEnded } = props;
  const toastConfig = useContext(CustomToastContext);

  const [openReceivingTicketDialog, setOpenReceivingTicketDialog] = useState(false);
  const [assetWithNoTicket, setAssetWithNoTicket] = useState([]);
  const [isRemovingTicket, setRemovingTicket] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);

  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;
  const columns = [
    { field: 'assetNumber', headerName: 'Asset Number', show: true, disabled: true, cellRenderer: 'assetRenderer' },
    { field: 'serialNumber', headerName: 'Serial Number', show: true, disabled: true, cellRenderer: 'commonRenderer' },
    { field: 'deliveryTicket', headerName: 'Loading Ticket', show: true, disabled: true, cellRenderer: 'ticketRenderer' },
    { field: 'status', headerName: 'Status', show: true, cellRenderer: 'commonRenderer' },
    { field: 'receivingTicket', headerName: 'Receiving Ticket', show: true, disabled: true, cellRenderer: 'receivingRenderer' },
    { field: 'receivingTicketStatus', headerName: 'Receiving Ticket Status', show: true, cellRenderer: 'commonRenderer' },
    { field: 'deliveryTicketStatus', headerName: 'Loading Ticket Status', show: true, cellRenderer: 'commonRenderer' }
  ];

  const AssetRenderer = (params) =>
    params.value ? (
      <Link className="link cursor-pointer" to={`${routes.productInventoryDetail.path}/${params.data._id}`}>
        <p title={params.value}>{params.value}</p>
      </Link>
    ) : (
      <NoDataCell />
    );

  const LoadingTicketRenderer = (params) =>
    params.value ? (
      <Link className="link cursor-pointer" to={`${routes.deliveryTicketDetail.path}/${params.data.deliveryTicketId}`}>
        <p title={params.value}>{params.value}</p>
      </Link>
    ) : (
      <NoDataCell />
    );

  const ReceivingTicketRenderer = (params) =>
    params.value ? (
      <Link className="link cursor-pointer" to={`${routes.receivingTicketDetail.path}/${params.data.receivingTicketId}`}>
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
    ticketRenderer: LoadingTicketRenderer,
    receivingRenderer: ReceivingTicketRenderer,
    productRenderer: ProductRenderer,
    assetRenderer: AssetRenderer,
    commonRenderer: CommonRenderer,
    dateRenderer: DateRenderer
  };

  useEffect(() => {
    if (transferAssetId) {
      fetchAssetsData(false)
    }
  }, [transferAssetId])

  const fetchAssetsData = async (forceRefresh) => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }

    try {
      let assetData = await fetchAssets(forceRefresh);
      let ticketData: any = await fetchReceivingTickets()
      let loadingTicketData: any = await fetchLoadingTickets()
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
            assetData[j].receivingTicket = ticketData[i].receivingJobName
            assetData[j].receivingTicketId = ticketData[i]._id
            assetData[j].receivingTicketStatus = ticketData[i].status
          }
        }
      }

      for (let i = 0; i < loadingTicketData.length; i++) {
        for (let j = 0; j < assetData.length; j++) {
          if (loadingTicketData[i]?.productInventory.some((asset: any) => (
            assetData[j]._id === (typeof asset === 'object' ? asset.optionValue : asset)
          ))) {
            assetData[j].deliveryTicket = loadingTicketData[i].deliveryJobName
            assetData[j].deliveryTicketId = loadingTicketData[i]._id
            assetData[j].deliveryTicketStatus = loadingTicketData[i].status
          }
        }
      }

      dispatch({ type: 'initialize', data: assetData, count: assetData.length });
      dispatch({ type: 'loading', loading: false });
    } catch (error) {
      dispatch({ type: 'loading', loading: false });
      toastConfig.setToastConfig(error);
    }
  };


  const fetchReceivingTickets = () => new Promise((resolve, reject) => {
    axiosInstance().get(`${routes.transferAsset.path}/${transferAssetId}/receiving-ticket`)
      .then(({ data: { data } }) => {
        resolve(data);
        setTickets(data)
      })
      .catch(err => {
        reject(err);
      })

  })
  const fetchLoadingTickets = () => new Promise((resolve, reject) => {
    axiosInstance().get(`${routes.transferAsset.path}/${transferAssetId}/loading-ticket`)
      .then(({ data: { data } }) => {
        resolve(data);

      })
      .catch(err => {
        reject(err);
      })

  })


  useEffect(() => {
    if (selectedRecords.length > 0) {
      const inventoryWithNoTicket = selectedRecords.filter((asset: any) => !asset?.hasOwnProperty("receivingTicket"))
      setAssetWithNoTicket(inventoryWithNoTicket)
    }
    setNextStep(true)
    const inventoryWithNoTicket = dataRows.filter((asset: any) => !asset?.hasOwnProperty("receivingTicket"));
    const inventoryWithTicket = dataRows.filter((asset: any) => asset?.hasOwnProperty("receivingTicket"));

    if (inventoryWithNoTicket.length > 0) {
      setNextStep(false)
    } else {
      setNextStep(true)
    }

    if (inventoryWithTicket.length > 0) {
      setPrevStep(false)
    } else {
      setPrevStep(true)
    }

    if (inventoryWithTicket.length === dataRows.length) {
      setTransferIsEnded(true)
    } else {
      setTransferIsEnded(false)
    }


  }, [dataRows, selectedRecords])

  const handleRemoveTicket = () => {
    setRemovingTicket(true)
    const groupByCalls = groupBy(selectedRecords, "receivingTicketId");
    let apiCalls = [];

    Object.keys(groupByCalls).forEach((key) => {
      apiCalls.push(axiosInstance().put(`${receivingTicket.receivingTicketApi}/${key}/remove-assets`, { ids: groupByCalls[key].map(m => m._id) }));
    })

    Promise.all(apiCalls).then(() => {
      toastConfig.setToastConfig({ open: true, type: "success", message: `Selected records removed from assiged ${sidebarResource.deliveryTicket}(s)` });
      fetchAssetsData(false);
      setRemovingTicket(false)
    }).catch((error) => {
      toastConfig.setToastConfig(error);
    }).finally(() => {
      setRemovingTicket(false)
      setShowConfirmBox(false)
    });
  }


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
            onClick={() => setOpenReceivingTicketDialog(true)}
          >
            Create Receiving Ticket
          </Button>
          <Box component="span" mx={1} />
          <Button
            variant="contained"
            size="small"
            color="primary"
            disabled={selectedRecords.filter(asset => asset?.hasOwnProperty("receivingTicket")).length === 0}
            onClick={() => setShowConfirmBox(true)}
          >
            Remove Receiving Ticket
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

      {/* Receiving ticket create dialog */}
      {
        openReceivingTicketDialog && (
          <ManageReceivingTicket
            receivingTicketId={null}
            open={true}
            isClone={false}
            isRedirectToDetailPage={false}
            onClose={() => setOpenReceivingTicketDialog(false)}
            productInventoryForReceivingTicket={assetWithNoTicket}
            transferData={transferAssetData}
            onSuccess={() => {
              setOpenReceivingTicketDialog(false);
              fetchAssetsData(true)
            }}
          />
        )
      }
      {/* Confirm Delete Dialog */}
      {showConfirmBox && (
        <ConfirmationDialog
          okBtnLoading={isRemovingTicket}
          open={showConfirmBox}
          message={`Are you sure you want to remove asset(s)?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleRemoveTicket}
        />
      )}

    </Fragment >
  );
};

export default ReceivingTicketGrid;
