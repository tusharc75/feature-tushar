import { useState, useReducer, Fragment, useContext, useEffect, FC } from 'react';
import { Button, Box, MenuItem, Menu } from '@material-ui/core';
import { Link, useHistory } from 'react-router-dom';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import {
  deliveryTicket,
  sidebarResource,
  DELIVERY_TICKET_STATUS,
  DELIVERY_TICKET_TYPE,
  DELIVERY_TICKET_REFERENCE_TYPE,
  DELIVERY_FROM_TO_TYPE,
  ASSET_STATUS,
  COLOUR_MASTER
} from 'src/constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import ManageDeliveryTicket from 'src/pages/DeliveryTicket/ManageDeliveryTicket';
import { CommonRenderer, DateRenderer } from 'src/components/AgGridComponents/CustomAgGridCellRenderers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CustomAgGrid, { reducer, intialState } from 'src/components/AgGridComponents/CustomAgGrid';
import CustomSwipableList from 'src/components/SwipableListComponents/CustomSwipableList';
import { uniq, map, groupBy } from 'lodash';
import { ExpandMore } from '@material-ui/icons';
import AddSerializedAsset from 'src/pages/RentalManagement/SerializedAsset/AddSerializedAsset';
import ReplaceAssetReason from '../../../components/RentalManagment/ReplaceAssetReason';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import InfoIcon from '@material-ui/icons/Info';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import PreviewDownload from 'src/components/PreviewDownload';

interface LoadingGridProps {
  permissions: any;
  transferAssetData?: any;
  transferAssetId: string | any;
  setNextStep: any;
  setPrevStep: any;
  currentStep: number;
  setTickets?: any;
  setExistingAssets?: any;
  setTransferIsEnded?: any;
  updateTransferStatus?: any;
  handleViewPdf?: any;
  fileDownloading?: boolean;
  isTransferEnded: boolean;
  renderedFrom?: string;
  allowedToEdit: boolean;
  canReceive: boolean;
}

const LoadingTicketGrid: FC<LoadingGridProps> = (props) => {
  const {
    permissions,
    transferAssetId,
    transferAssetData,
    setTickets,
    setNextStep,
    setExistingAssets,
    setTransferIsEnded,
    updateTransferStatus,
    handleViewPdf,
    fileDownloading,
    isTransferEnded,
    renderedFrom,
    allowedToEdit,
    canReceive
  } = props;
  const toastConfig = useContext(CustomToastContext);

  const [assetWithNoTicket, setAssetWithNoTicket] = useState([]);
  const [isRemovingTicket, setRemovingTicket] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [showConfirmBoxReceive, setShowConfirmBoxReceive] = useState(false);

  const history = useHistory();

  const [showTicketDialog, setShowTicketDialog] = useState({ open: false, data: {} });
  const [anchorActionEl, setAnchorActionEl] = useState(null);

  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;

  const [addSerializedAssetDialog, setAddSerializedAssetDialog] = useState({ open: false, products: [] });
  const [showReplaceReason, setShowReplaceReason] = useState({ open: false, data: {} });
  const [replaceLoading, setReplaceLoading] = useState(false);
  const [columns, setColumns] = useState(null);

  useEffect(() => {
    if (transferAssetId) {
      fetchAssetsData();
    }
  }, [transferAssetId]);

  useEffect(() => {
    if (selectedRecords.length > 0) {
      const inventoryWithNoTicket = selectedRecords.filter((asset: any) => !asset?.hasOwnProperty('loadingTicket'));
      setAssetWithNoTicket(inventoryWithNoTicket);
    }
    if (dataRows.length) {
      const inventoryDelivered = dataRows.filter((asset: any) => asset['loadingTicketStatus'] === 'Delivered');
      const inventoryLost = dataRows.filter((asset: any) => asset?.status === 'Lost');
      if (inventoryDelivered.length > 0) {
        setNextStep(true);
      } else {
        setNextStep(false);
      }
      if (transferAssetData?.transferType === 'Internal') {
        if (inventoryDelivered.length === dataRows.filter((d) => d.status !== 'Lost').length || inventoryLost.length === dataRows.length) {
          setTransferIsEnded(true);
          updateTransferStatus('Completed');
        } else {
          setTransferIsEnded(false);
        }
      }
    }
  }, [dataRows, selectedRecords]);

  const fetchFields = () => {
    setColumns(null);
    const column = [
      {
        field: 'assetNumber',
        headerName: 'Asset Number',
        show: true,
        disabled: true,
        cellRenderer: 'assetRenderer',
        cellStyle: (params) => {
          if ([ASSET_STATUS.lost, ASSET_STATUS.scrap, ASSET_STATUS.needRepair, ASSET_STATUS.needRecert].includes(params?.data?.status)) {
            return { backgroundColor: COLOUR_MASTER.lostAssets.background };
          }
          if (params?.data?.isReplaced) {
            return { backgroundColor: COLOUR_MASTER.replaceAssetColor.background };
          }
          return null;
        }
      },
      { field: 'serialNumber', headerName: 'Serial Number', show: true, cellRenderer: 'commonRenderer' },
      { field: 'loadingTicket', headerName: 'Loading Ticket', show: true, cellRenderer: 'ticketRenderer' },
      { field: 'productName', headerName: 'Product Type', show: true, cellRenderer: 'productRenderer' },
      { field: 'productDescription', headerName: 'Product Description', show: true, cellRenderer: 'commonRenderer' },
      { field: 'status', headerName: 'Status', show: true, cellRenderer: 'commonRenderer' },
      { field: 'loadingTicketStatus', headerName: 'Loading Ticket Status', show: true, cellRenderer: 'commonRenderer' }
    ];
    setColumns(column);
  };

  const fetchAssetsData = async () => {
    await fetchFields();
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    try {
      const result = await axiosInstance().get(`${routes.transferAsset.path}/get-asset/${transferAssetData?._id}`);
      let assetData = result?.data?.data?.assets?.map((d: any) => ({
        ...d,
        productName: d?.product?.optionLabel || '',
        productDescription: d?.productDescription?.optionLabel || '',
        productId: d?.product?.optionValue ?? '',
        isChecked: false
      }));
      let replaceAssetLog = result?.data?.data?.replaceAssetLog ? result?.data?.data?.replaceAssetLog : [];
      let ticketData: any = await fetchLoadingTickets();
      ticketData = ticketData.filter((ticket: any) => ticket.ticketType === DELIVERY_TICKET_TYPE.loading);
      for (let i = 0; i < ticketData.length; i++) {
        for (let j = 0; j < assetData.length; j++) {
          if (ticketData[i]?.productInventory.some((asset: any) => assetData[j]._id === (typeof asset === 'object' ? asset.optionValue : asset))) {
            assetData[j].loadingTicket = ticketData[i].ticketName;
            assetData[j].loadingTicketId = ticketData[i]._id;
            assetData[j].loadingTicketStatus = ticketData[i].status;
          }
        }
      }
      if (replaceAssetLog?.length) {
        assetData?.forEach((element) => {
          const logRes = replaceAssetLog?.filter((e) => e.assetId == element._id);
          if (logRes.length) {
            element.isReplaced = true;
            element.replaceReason = logRes[0]?.replaceReason;
            element.replaceAsset = logRes[0]?.replaceAsset;
          }
        });
      }
      setExistingAssets(assetData);
      dispatch({
        type: 'initialize',
        data: assetData,
        count: assetData.length,
        selectedRecords: assetData.filter((f) => f.isChecked === true)
      });
      dispatch({ type: 'loading', loading: false });
    } catch (error) {
      dispatch({ type: 'loading', loading: false });
      toastConfig.setToastConfig(error);
    }
  };

  const fetchLoadingTickets = () =>
    new Promise((resolve, reject) => {
      axiosInstance()
        .get(`${routes.deliveryTicket.path}/typewise?referenceType=${DELIVERY_TICKET_REFERENCE_TYPE.transferAsset}&referenceId=${transferAssetId}`)
        .then(({ data: { data } }) => {
          resolve(data);
          setTickets(data);
        })
        .catch((err) => {
          reject(err);
        });
    });

  const AssetRenderer = (params) =>
    params.value ? (
      <Fragment>
        <p className="link cursor-pointer" title={params.value} onClick={() => window.open(`${routes.serializedAssetDetail.path}/${params.data._id}`)}>
          {params.value}
        </p>
        {params?.data?.isReplaced && (
          <Box ml={1}>
            <HtmlTooltip title={`Replaced Asset ${params?.data?.replaceAsset} Reason-${params?.data?.replaceReason}`}>
              <InfoIcon fontSize="small" color={'primary'} />
            </HtmlTooltip>
          </Box>
        )}
      </Fragment>
    ) : (
      <NoDataCell />
    );

  const TicketRenderer = (params) =>
    params.value ? (
      <p title={params.value} className="link cursor-pointer" onClick={() => window.open(`${routes.deliveryTicketDetail.path}/${params.data.loadingTicketId}`)}>
        {params.value}
      </p>
    ) : (
      <NoDataCell />
    );

  const ProductRenderer = (params) =>
    params.value ? (
      <p className="link cursor-pointer" title={params.value} onClick={() => window.open(`${routes.productDetail.path}/${params.data.productId}`)}>
        {params.value}
      </p>
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

  const handleRemoveTicket = () => {
    setRemovingTicket(true);
    const groupByCalls = groupBy(selectedRecords, 'loadingTicketId');
    let apiCalls = [];

    Object.keys(groupByCalls).forEach((key) => {
      apiCalls.push(axiosInstance().put(`${deliveryTicket.api}/${key}/assets`, { ids: groupByCalls[key].map((m) => m._id) }));
    });

    Promise.all(apiCalls)
      .then(() => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `Selected records removed from assiged ${sidebarResource.deliveryTicket}(s)`
        });
        fetchAssetsData();
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

  const handelReceiveAssets = () => {
    let data = {};
    const loadingTicketIds = uniq(map(selectedRecords, 'loadingTicketId'));
    if (loadingTicketIds.length) {
      data['_ids'] = loadingTicketIds?.map((e) => e);
      data['status'] = DELIVERY_TICKET_STATUS.delivered;
      data['signatures'] = [];
      axiosInstance()
        .post(`${deliveryTicket.api}/updatebulk`, data)
        .then(({ data: { data } }) => {
          fetchAssetsData();
          setShowConfirmBoxReceive(false);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: `Assets Received Successfully`
          });
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const openActions = (event) => {
    setAnchorActionEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorActionEl(null);
  };

  const handleOpenReplaceAssetReason = (rows) => {
    const data: any = {};
    data.referenceType = 'transferAsset';
    data.referenceId = transferAssetId;
    const assets: any = [];
    selectedRecords?.forEach((element: any) => {
      const result = rows.filter((f) => f.productId === element?.product?.optionValue && !f.isCounted);
      if (result.length) {
        assets.push({ _id: element._id, status: element.status, deliveryTicketId: element.loadingTicketId, newId: result[0]._id });
        result[0].isCounted = true;
      }
    });
    data.assets = assets;
    setShowReplaceReason({ open: true, data: data });
  };

  const handleReplaceAsset = (reason) => {
    setReplaceLoading(true);
    axiosInstance()
      .post(`${deliveryTicket.api}/replace-assets`, { ...showReplaceReason.data, reason: reason })
      .then(({ data }) => {
        setShowReplaceReason({ open: false, data: [] });
        setAddSerializedAssetDialog({ open: false, products: [] });
        setReplaceLoading(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `Assets Replaced Successfully`
        });
        fetchAssetsData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Fragment>
      <Box display="flex" flexDirection={'row'} justifyContent={'flex-end'} mx={1} my={1}>
        <PreviewDownload
          resource={sidebarResource.transferAsset}
          referenceId={transferAssetId}
          columns={columns?.filter((e) => ['assetNumber', 'productName', 'productDescription', 'status']?.includes(e.field))}
          hideDetailButton={true}
        />
        {allowedToEdit && !isTransferEnded && (
          <Box pl={1}>
            {permissions?.transferAsset?.isUpdate && (
              <Fragment>
                <Button
                  variant="outlined"
                  color="default"
                  size="small"
                  onClick={openActions}
                  aria-controls="action-menu"
                  disabled={selectedRecords.length === 0}
                  endIcon={<ExpandMore />}
                  className="new-dropdown-v1"
                >
                  Actions
                </Button>
                <Menu
                  anchorEl={anchorActionEl}
                  keepMounted
                  getContentAnchorEl={null}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left'
                  }}
                  id="action-menu"
                  open={Boolean(anchorActionEl)}
                  onClose={closeActions}
                >
                  <MenuItem
                    disabled={
                      selectedRecords.length === 0 ||
                      selectedRecords.filter((asset) => asset?.hasOwnProperty('loadingTicket')).length > 0 ||
                      selectedRecords.filter((asset: any) => asset?.status === 'Lost').length > 0
                    }
                    onClick={() => {
                      const data: any = {};
                      data['referenceId'] = transferAssetData._id;
                      data['ticketName'] = transferAssetData.transferAssetNumber;
                      data['pickupFromType'] = DELIVERY_FROM_TO_TYPE.plant;
                      data['pickupFrom'] = transferAssetData?.transferFromPlant?.optionValue;
                      data['pickupFromAddress'] = transferAssetData?.transferFromPlant?.address;
                      if (transferAssetData?.transferType === 'Internal') {
                        data['deliveryToType'] = DELIVERY_FROM_TO_TYPE.plant;
                        data['deliveryTo'] = transferAssetData?.transfertoPlant?.optionValue;
                        data['deliveryToLabel'] = transferAssetData?.transfertoPlant?.optionLabel;
                        data['deliveryToAddress'] = transferAssetData?.plantShipTo?.optionValue;
                        data['status'] = DELIVERY_TICKET_STATUS.indTransit;
                      } else if (transferAssetData?.transferType === 'External Customer') {
                        data['deliveryToType'] = DELIVERY_FROM_TO_TYPE.customer;
                        data['deliveryTo'] = transferAssetData?.transfertoCustomer?.optionValue;
                        data['deliveryToAddress'] = transferAssetData?.customerShipTo?.optionValue;
                      } else if (transferAssetData?.transferType === 'External Supplier') {
                        data['deliveryToType'] = DELIVERY_FROM_TO_TYPE.supplier;
                        data['deliveryTo'] = transferAssetData?.transfertoSupplier?.optionValue;
                        data['deliveryToAddress'] = transferAssetData?.supplierShipTo?.optionValue;
                      }
                      data['wellName'] = transferAssetData?.wellName?.optionValue;
                      if (transferAssetData?.wellNumber) {
                        if (transferAssetData?.wellNumber?.optionValue) {
                          data['wellNumber'] = transferAssetData?.wellNumber?.optionValue;
                        } else {
                          data['wellNumber'] = transferAssetData?.wellNumber?.map((e) => e?.optionValue);
                        }
                      }
                      data['afeNumber'] = transferAssetData?.afeNumber;
                      if (transferAssetData?.processor?.optionValue) {
                        data['processor'] = transferAssetData?.processor?.optionValue;
                      }
                      data['isPickupFromDisable'] = true;
                      data['isDeliveryToDisable'] = true;
                      setShowTicketDialog({ open: true, data: data });
                      closeActions();
                    }}
                  >
                    Create Loading Ticket
                  </MenuItem>
                  <MenuItem
                    disabled={
                      !canReceive ||
                      selectedRecords.length === 0 ||
                      selectedRecords.filter((e: any) => e?.loadingTicketStatus === DELIVERY_TICKET_STATUS.indTransit).length !==
                      selectedRecords.length
                    }
                    onClick={() => {
                      setShowConfirmBoxReceive(true);
                      closeActions();
                    }}
                  >
                    Receive Assets
                  </MenuItem>

                  <MenuItem
                    disabled={
                      selectedRecords.length === 0 ||
                      selectedRecords.filter((e: any) => e?.loadingTicketStatus === DELIVERY_TICKET_STATUS.indTransit).length !==
                      selectedRecords.length
                    }
                    onClick={() => {
                      const products = [];
                      selectedRecords?.forEach((element) => {
                        const foundProduct = products.filter((e) => e._id === element?.product?.optionValue);
                        if (foundProduct.length) {
                          foundProduct[0].qty += 1;
                        } else {
                          products.push({
                            _id: element?.product?.optionValue,
                            id: element?.product?.optionValue,
                            productName: element?.product?.optionLabel,
                            qty: 1
                          });
                        }
                      });
                      setAddSerializedAssetDialog({ open: true, products: products });
                      closeActions();
                    }}
                  >
                    Replace Assets
                  </MenuItem>

                  {permissions?.transferAsset?.isUpdate &&
                    selectedRecords.length &&
                    selectedRecords?.filter((f) => f.hasOwnProperty('loadingTicket') && f?.loadingTicketStatus === DELIVERY_TICKET_STATUS.new)
                      ?.length === selectedRecords?.length ? (
                    <MenuItem
                      onClick={() => {
                        setShowConfirmBox(true);
                        closeActions();
                      }}
                    >
                      Receive Assets
                    </MenuItem>
                  ) : null}
                </Menu>
              </Fragment>
            )}
          </Box>
        )}
      </Box>
      <Box mt={1}>
        {columns ? (
          isMobile && !isTablet ? (
            <CustomSwipableList
              allowSelection={allowedToEdit}
              allowSwipe={true}
              permissions={permissions?.transferAsset}
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
                  label: 'Status: ',
                  field: 'status'
                },
                {
                  label: 'Loading Ticket : ',
                  field: 'loadingTicket',
                  onClick: (data: any) => history.push(`${routes.deliveryTicketDetail.path}/${data.loadingTicketId}`)
                }
              ]}
              additionalDetails={[]}
              owerCollaboratorInitialsOrImages="owerCollaboratorInitialsOrImages"
              onCreate={false}
              showClone={false}
              onClone={(data) => { }}
              renderedFrom={renderedFrom}
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
              allowSelection={allowedToEdit}
              isClientSideGrid={true}
              loading={loading}
              renderedFrom={renderedFrom}
              refreshGrid={() => fetchAssetsData()}
            />
          )
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Box>
      {showTicketDialog.open && (
        <ManageDeliveryTicket
          ticketType={DELIVERY_TICKET_TYPE.loading}
          referenceType={DELIVERY_TICKET_REFERENCE_TYPE.transferAsset}
          referenceData={showTicketDialog.data}
          productInventory={assetWithNoTicket}
          onClose={() => setShowTicketDialog({ open: false, data: {} })}
          onSuccess={() => {
            setShowTicketDialog({ open: false, data: {} });
            fetchAssetsData();
          }}
        />
      )}
      {showConfirmBox && (
        <ConfirmationDialog
          okBtnLoading={isRemovingTicket}
          open={showConfirmBox}
          message={`Are you sure you want to remove loading ticket(s)?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleRemoveTicket}
        />
      )}
      {showConfirmBoxReceive && (
        <ConfirmationDialog
          okBtnLoading={isRemovingTicket}
          open={showConfirmBoxReceive}
          message={`Are you sure you want to receive assets?`}
          onClose={() => {
            setShowConfirmBoxReceive(false);
          }}
          onOk={handelReceiveAssets}
        />
      )}
      {addSerializedAssetDialog.open && (
        <AddSerializedAsset
          addSerializedAsset={handleOpenReplaceAssetReason}
          handleSerializedAssetClose={() => {
            setAddSerializedAssetDialog({ open: false, products: [] });
          }}
          referenceType={'ReplaceAsset'}
          referenceData={{
            _id: transferAssetData?._id,
            warehouse: transferAssetData?.transferFromPlant.optionValue
          }}
          isAdding={replaceLoading}
          selectedProducts={addSerializedAssetDialog.products}
          filterByPlant={transferAssetData?.transferFromPlant.optionValue}
        />
      )}
      {showReplaceReason.open && (
        <ReplaceAssetReason
          handleClose={() => setShowReplaceReason({ open: false, data: {} })}
          loading={replaceLoading}
          handleSucess={(data) => {
            handleReplaceAsset(data?.reason);
          }}
        />
      )}
    </Fragment>
  );
};

export default LoadingTicketGrid;
