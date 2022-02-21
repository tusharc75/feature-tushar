import React, { useState, useReducer, Fragment, useContext, useEffect, FC } from 'react';
import { Button, Box } from '@material-ui/core';
import { Link, useHistory } from 'react-router-dom';

import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { deliveryTicket, sidebarResource } from 'src/constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { groupBy } from 'lodash';
import ManageDeliveryTicket from '../DeliveryTicket/ManageDeliveryTicket';
import { CommonRenderer, DateRenderer } from 'src/components/AgGridComponents/CustomAgGridCellRenderers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CustomAgGrid, { reducer, intialState } from 'src/components/AgGridComponents/CustomAgGrid';
import CustomSwipableList from 'src/components/SwipableListComponents/CustomSwipableList';
import { AiFillFilePdf } from 'react-icons/ai';
import { IoMdDownload } from 'react-icons/io';

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
  isTransferEnded: boolean;
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
    fileDownloading,
    isTransferEnded
  } = props;
  const toastConfig = useContext(CustomToastContext);

  const [openReceivingTicketDialog, setOpenReceivingTicketDialog] = useState(false);
  const [assetWithNoTicket, setAssetWithNoTicket] = useState([]);
  const [assetsDelivered, setAssetsDelivered] = useState([]);
  const [loadingTicketsNotDelivered, setLoadingTicketsNotDelivered] = useState([]);

  const [isRemovingTicket, setRemovingTicket] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);

  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;
  const columns = [
    { field: 'assetNumber', headerName: 'Asset Number', show: true, disabled: true, cellRenderer: 'assetRenderer' },
    { field: 'serialNumber', headerName: 'Serial Number', show: true, disabled: true, cellRenderer: 'commonRenderer' },
    { field: 'loadingTicket', headerName: 'Loading Ticket', show: true, disabled: true, cellRenderer: 'ticketRenderer' },
    { field: 'status', headerName: 'Status', show: true, cellRenderer: 'commonRenderer' },
    { field: 'receivingTicket', headerName: 'Receiving Ticket', show: true, disabled: true, cellRenderer: 'receivingRenderer' },
    { field: 'receivingTicketStatus', headerName: 'Receiving Ticket Status', show: true, cellRenderer: 'commonRenderer' },
    { field: 'loadingTicketStatus', headerName: 'Loading Ticket Status', show: true, cellRenderer: 'commonRenderer' }
  ];

  const history = useHistory();

  const AssetRenderer = (params) =>
    params.value ? (
      <Link className="link cursor-pointer" to={`${routes.serializedAssetDetail.path}/${params.data._id}`}>
        <p title={params.value}>{params.value}</p>
      </Link>
    ) : (
      <NoDataCell />
    );

  const LoadingTicketRenderer = (params) =>
    params.value ? (
      <Link className="link cursor-pointer" to={`${routes.deliveryTicketDetail.path}/${params.data.loadingTicketId}`}>
        <p title={params.value}>{params.value}</p>
      </Link>
    ) : (
      <NoDataCell />
    );

  const ReceivingTicketRenderer = (params) =>
    params.value ? (
      <Link className="link cursor-pointer" to={`${routes.deliveryTicketDetail.path}/${params.data.receivingTicketId}`}>
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
      let ticketData: any = await fetchLoadingTickets();
      const loadingTicket = ticketData.filter((ticket: any) => ticket.ticketType === "Loading")
      const receivingTicket = ticketData.filter((ticket: any) => ticket.ticketType === "Receiving")

      for (let i = 0; i < receivingTicket.length; i++) {
        for (let j = 0; j < assetData.length; j++) {
          if (receivingTicket[i]?.productInventory.some((asset: any) => assetData[j]._id === (typeof asset === 'object' ? asset.optionValue : asset))) {
            assetData[j].receivingTicket = receivingTicket[i].ticketName;
            assetData[j].receivingTicketId = receivingTicket[i]._id;
            assetData[j].receivingTicketStatus = receivingTicket[i].status;
          }
        }
      }

      for (let i = 0; i < loadingTicket.length; i++) {
        for (let j = 0; j < assetData.length; j++) {
          if (
            loadingTicket[i]?.productInventory.some((asset: any) => assetData[j]._id === (typeof asset === 'object' ? asset.optionValue : asset))
          ) {
            assetData[j].loadingTicket = loadingTicket[i].ticketName;
            assetData[j].loadingTicketId = loadingTicket[i]._id;
            assetData[j].loadingTicketStatus = loadingTicket[i].status;
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

  const fetchLoadingTickets = () =>
    new Promise((resolve, reject) => {
      axiosInstance()
        .get(`${routes.deliveryTicket.path}/typewise?refrenceType=Transfer Asset&refrenceId=${transferAssetId}`)
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
        (asset: any) => !asset?.hasOwnProperty('receivingTicket') && asset?.loadingTicketStatus === 'Delivered'
      );
      const loadingTicketsNotDelivered = selectedRecords.filter((asset: any) => asset?.loadingTicketStatus !== 'Delivered');
      const selectedInventoryDelivered = selectedRecords.filter(
        (asset: any) => asset?.receivingTicketStatus === 'Delivered' || asset?.receivingTicketStatus === 'In-Transit'
      );

      setLoadingTicketsNotDelivered(loadingTicketsNotDelivered);
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
      apiCalls.push(axiosInstance().put(`${deliveryTicket.api}/${key}/remove-assets`, { ids: groupByCalls[key].map((m) => m._id) }));
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
              variant={isMobile && !isTablet ? "text" : "outlined"}
              color="primary"
              type="button"
              size="small"
              style={isMobile && !isTablet ? { color: "var(--info-dark)" } : {}}
              startIcon={isMobile ? '' : <AiFillFilePdf />}
              disabled={fileDownloading}
              onClick={() => {
                handleViewPdf(false);
              }}
            >
              {isMobile && !isTablet ? <AiFillFilePdf size={18} /> : fileDownloading ? 'Please wait...' : 'Preview'}
            </Button>
          )}
          <Box component="span" mx={1} />
          {permissions?.transferAsset?.isRead && (
            <Button
              variant={isMobile && !isTablet ? 'text' : 'outlined'}
              color="primary"
              type="button"
              size="small"
              style={isMobile && !isTablet ? { color: "var(--warning-darken)" } : {}}
              startIcon={isMobile ? '' : <IoMdDownload />}
              disabled={fileDownloading}
              onClick={() => {
                handleViewPdf(true);
              }}
            >
              {isMobile && !isTablet ? <IoMdDownload size={20} /> : fileDownloading ? 'Please wait...' : 'Download'}
            </Button>
          )}
        </Box>

        {!isTransferEnded && <Box marginTop={isMobile ? 2 : 0}>
          {permissions?.transferAsset.isUpdate && permissions?.deliveryTicket.isCreate && (
            <Button
              variant="contained"
              size="small"
              color="primary"
              disabled={
                selectedRecords.length === 0 ||
                assetWithNoTicket.length === 0 ||
                loadingTicketsNotDelivered.length > 0 ||
                selectedRecords.filter((asset: any) => asset?.status === 'Lost').length > 0 ||
                selectedRecords.filter((asset: any) => asset.hasOwnProperty('receivingTicket')).length > 0
              }
              onClick={() => setOpenReceivingTicketDialog(true)}
            >
              Create Receiving Ticket
            </Button>
          )}
          <Box component="span" mx={1} />
          {permissions?.transferAsset.isUpdate && permissions?.deliveryTicket.isUpdate && (
            <Button
              variant="contained"
              size="small"
              color="primary"
              disabled={assetsDelivered.length > 0
                || selectedRecords.filter((asset) => asset?.hasOwnProperty('receivingTicket')).length === 0
                || selectedRecords.filter((asset) => !asset?.hasOwnProperty('receivingTicket')).length > 0
              }
              onClick={() => setShowConfirmBox(true)}
            >
              Remove Receiving Ticket
            </Button>
          )}
        </Box>}
      </Box>

      <Box mt={1}>
        {isMobile && !isTablet ? (
          <CustomSwipableList
            allowSelection={true}
            allowSwipe={true}
            permissions={permissions}
            primaryField={columns?.find((d) => d.field)}
            onClick={(data) => {
              history.push(`${routes.serializedAssetDetail.path}/${data._id}`);
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
                label: "Status: ",
                field: "status",
              },
              {
                label: 'Loading Ticket : ',
                field: 'loadingTicket',
                onClick: (data: any) => history.push(`${routes.deliveryTicketDetail.path}/${data.loadingTicketId}`),
              },
              {
                label: 'Receiving Ticket : ',
                field: 'receivingTicket',
                onClick: (data: any) => history.push(`${routes.deliveryTicketDetail.path}/${data.receivingTicketId}`),
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
