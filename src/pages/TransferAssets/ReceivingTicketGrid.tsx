import React, { useState, useReducer, Fragment, useContext, useEffect, FC } from 'react';
import { Button, Box } from '@material-ui/core';
import { Link, useHistory } from 'react-router-dom';

import axiosInstance from '../../axios/axiosInstance';
import routes from '../../components/Helpers/Routes';
import NoDataCell from '../../components/Helpers/NoDataCell';
import { receivingTicket, sidebarResource } from '../../constants/helpers';
import { isMobile } from 'react-device-detect';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import { groupBy } from 'lodash';
import ManageDeliveryTicket from '../DeliveryTicket/ManageDeliveryTicket';
import { CommonRenderer, DateRenderer } from '../../components/AgGridComponents/CustomAgGridCellRenderers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import CustomSwipableList from '../../components/SwipableListComponents/CustomSwipableList';
import { AiFillFilePdf } from 'react-icons/ai';

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
  updateTransferStatus?: any;
  handleViewPdf?: any;
  fileDownloading?: boolean;
}

const ReceivingTicketGrid: FC<ReceivingGridProps> = (props) => {
  const {
    permissions,
    fetchAssets,
    transferAssetId,
    setPrevStep,
    transferAssetData,
    setTickets,
    setNextStep,
    setTransferIsEnded,
    updateTransferStatus,
    handleViewPdf,
    fileDownloading
  } = props;
  const toastConfig = useContext(CustomToastContext);

  const [openReceivingTicketDialog, setOpenReceivingTicketDialog] = useState(false);
  const [assetWithNoTicket, setAssetWithNoTicket] = useState([]);
  const [assetsDelivered, setAssetsDelivered] = useState([]);
  const [loadingTicketsNotDelivered, setLoadingTicketsDelivered] = useState([]);

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

  const history = useHistory();

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
      fetchAssetsData(true);
    }
  }, [transferAssetId]);

  const fetchAssetsData = async (forceRefresh) => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }

    try {
      let assetData = await fetchAssets(forceRefresh);
      let ticketData: any = await fetchReceivingTickets();
      let loadingTicketData: any = await fetchLoadingTickets();

      for (let i = 0; i < ticketData.length; i++) {
        for (let j = 0; j < assetData.length; j++) {
          if (ticketData[i]?.productInventory.some((asset: any) => assetData[j]._id === (typeof asset === 'object' ? asset.optionValue : asset))) {
            assetData[j].receivingTicket = ticketData[i].receivingJobName;
            assetData[j].receivingTicketId = ticketData[i]._id;
            assetData[j].receivingTicketStatus = ticketData[i].status;
          }
        }
      }

      for (let i = 0; i < loadingTicketData.length; i++) {
        for (let j = 0; j < assetData.length; j++) {
          if (
            loadingTicketData[i]?.productInventory.some((asset: any) => assetData[j]._id === (typeof asset === 'object' ? asset.optionValue : asset))
          ) {
            assetData[j].deliveryTicket = loadingTicketData[i].ticketName;
            assetData[j].deliveryTicketId = loadingTicketData[i]._id;
            assetData[j].deliveryTicketStatus = loadingTicketData[i].status;
          }
        }
      }

      assetData = assetData?.map((d: any, index) => ({
        ...d,
        assetNumber: `${index + 1}. ${d.assetNumber}`
      }));

      dispatch({ type: 'initialize', data: assetData, count: assetData.length });
      dispatch({ type: 'loading', loading: false });
    } catch (error) {
      dispatch({ type: 'loading', loading: false });
      toastConfig.setToastConfig(error);
    }
  };

  const fetchReceivingTickets = () =>
    new Promise((resolve, reject) => {
      axiosInstance()
        .get(`${routes.transferAsset.path}/${transferAssetId}/receiving-ticket`)
        .then(({ data: { data } }) => {
          resolve(data);
          setTickets(data);
        })
        .catch((err) => {
          reject(err);
        });
    });
  const fetchLoadingTickets = () =>
    new Promise((resolve, reject) => {
      axiosInstance()
        .get(`${routes.transferAsset.path}/${transferAssetId}/loading-ticket`)
        .then(({ data: { data } }) => {
          resolve(data);
        })
        .catch((err) => {
          reject(err);
        });
    });

  useEffect(() => {
    if (selectedRecords.length > 0) {
      const inventoryWithNoTicket = selectedRecords.filter(
        (asset: any) => !asset?.hasOwnProperty('receivingTicket') && asset?.deliveryTicketStatus === 'Delivered'
      );
      const loadingTicketsNotDelivered = selectedRecords.filter((asset: any) => asset?.deliveryTicketStatus !== 'Delivered');
      const selectedInventoryDelivered = selectedRecords.filter(
        (asset: any) => asset?.receivingTicketStatus === 'Delivered' || asset?.receivingTicketStatus === 'In-Transit'
      );

      setLoadingTicketsDelivered(loadingTicketsNotDelivered);
      setAssetsDelivered(selectedInventoryDelivered);
      setAssetWithNoTicket(inventoryWithNoTicket);
    }

    if (dataRows.length > 0) {
      const inventoryWithNoTicket = dataRows.filter((asset: any) => !asset?.hasOwnProperty('receivingTicket'));
      const inventoryDelivered = dataRows.filter((asset: any) => asset?.receivingTicketStatus === 'Delivered');
      if (inventoryWithNoTicket.length > 0) {
        setNextStep(false);
      } else {
        setNextStep(true);
      }
      if (transferAssetData?.transferType.includes('External')) {
        if (inventoryDelivered.length === dataRows.filter(d => d.status !== "Lost").length) {
          setTransferIsEnded(true);
          updateTransferStatus('Completed');
        } else {
          setTransferIsEnded(false);
        }
      }
    }
  }, [dataRows, selectedRecords]);

  const handleRemoveTicket = () => {
    setRemovingTicket(true);
    const groupByCalls = groupBy(selectedRecords, 'receivingTicketId');
    let apiCalls = [];

    Object.keys(groupByCalls).forEach((key) => {
      apiCalls.push(axiosInstance().put(`${receivingTicket.receivingTicketApi}/${key}/remove-assets`, { ids: groupByCalls[key].map((m) => m._id) }));
    });

    Promise.all(apiCalls)
      .then(() => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `Selected records removed from assiged ${sidebarResource.deliveryTicket}(s)`
        });
        fetchAssetsData(true);
        setRemovingTicket(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      })
      .finally(() => {
        setRemovingTicket(false);
        setShowConfirmBox(false);
      });
  };

  return (
    <Fragment>
      <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} justifyContent="space-between" mx="4px">
        <Box>
          {permissions?.transferAsset?.isRead && (
            <Button
              variant="outlined"
              color="primary"
              type="button"
              size="small"
              startIcon={<AiFillFilePdf />}
              disabled={fileDownloading}
              onClick={() => {
                handleViewPdf(false);
              }}
            >
              {fileDownloading ? 'Please wait...' : 'Preview'}
            </Button>
          )}
          <Box component="span" mx={1} />
          {permissions?.transferAsset?.isRead && (
            <Button
              variant="outlined"
              color="primary"
              type="button"
              size="small"
              startIcon={<AiFillFilePdf />}
              disabled={fileDownloading}
              onClick={() => {
                handleViewPdf(true);
              }}
            >
              {fileDownloading ? 'Please wait...' : 'Download'}
            </Button>
          )}
        </Box>

        <Box marginTop={isMobile ? 2 : 0}>
          {permissions?.transferAsset.isUpdate && permissions?.receivingTicket.isCreate && (
            <Button
              variant="contained"
              size="small"
              color="primary"
              disabled={
                selectedRecords.length === 0 ||
                assetWithNoTicket.length === 0 ||
                loadingTicketsNotDelivered.length > 0 ||
                selectedRecords.filter((asset: any) => asset?.status === 'Lost').length > 0
              }
              onClick={() => setOpenReceivingTicketDialog(true)}
            >
              Create Receiving Ticket
            </Button>
          )}
          <Box component="span" mx={1} />
          {permissions?.transferAsset.isUpdate && permissions?.receivingTicket.isUpdate && (
            <Button
              variant="contained"
              size="small"
              color="primary"
              disabled={assetsDelivered.length > 0 || selectedRecords.filter((asset) => asset?.hasOwnProperty('receivingTicket')).length === 0}
              onClick={() => setShowConfirmBox(true)}
            >
              Remove Receiving Ticket
            </Button>
          )}
        </Box>
      </Box>

      <Box mt={1}>
        {isMobile ? (
          <CustomSwipableList
            allowSelection={true}
            allowSwipe={true}
            permissions={permissions}
            primaryField={columns?.find((d) => d.field)}
            onClick={(data) => {
              history.push(`${routes.productInventoryDetail.path}/${data._id}`);
            }}
            dataRows={dataRows}
            selectedRecords={selectedRecords}
            dispatch={dispatch}
            onEdit={(data) => {
              // history.push(`${routes.rentalManagementDetail.path}/${data._id}?openEdit=true`)
            }}
            extraParamsToCheckDelete={true}
            onDelete={(data) => { }}
            rowCount={rowCount}
            page={page}
            loading={loading}
            chips={[
              {
                label: 'Status : ',
                field: 'status'
              }
            ]}
            additionalDetails={[]}
            owerCollaboratorInitialsOrImages="owerCollaboratorInitialsOrImages"
            onCreate={false}
            showClone={false}
            onClone={(data) => { }}
            renderedFrom="transferAssetPage"
          />
        ) : (
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
        )}
      </Box>

      {/* Receiving ticket create dialog */}
      {openReceivingTicketDialog && (
        <ManageDeliveryTicket
          ticketType="Receiving"
          refrenceType="Transfer Asset"
          refrenceData={transferAssetData}
          onClose={() => setOpenReceivingTicketDialog(false)}
          productInventory={assetWithNoTicket}
          transferData={transferAssetData}
          warehouseId={transferAssetData?.transferFromPlant?.optionValue}
          onSuccess={() => {
            setOpenReceivingTicketDialog(false);
            fetchAssetsData(true);
          }}

        />
      )}
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
    </Fragment>
  );
};

export default ReceivingTicketGrid;
