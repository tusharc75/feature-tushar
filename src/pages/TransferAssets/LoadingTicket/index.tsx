import { useState, useReducer, Fragment, useContext, useEffect, FC } from 'react';
import { Button, Box, MenuItem, Menu, IconButton } from '@material-ui/core';
import { useHistory } from 'react-router-dom';
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
  serializedAsset,
  prepareDataForGrid,
  ASSET_STATUS
} from 'src/constants/helpers';
import { isMobile } from 'react-device-detect';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import ManageDeliveryTicket from 'src/pages/DeliveryTicket/ManageDeliveryTicket';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { uniq, map, groupBy } from 'lodash';
import { ExpandMore } from '@material-ui/icons';
import AddSerializedAsset from 'src/pages/RentalManagement/SerializedAsset/AddSerializedAsset';
import ReplaceAssetReason from '../../../components/RentalManagment/ReplaceAssetReason';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import PreviewDownload from 'src/components/PreviewDownload';
import useColumns from 'src/components/CustomReactTableNew/useColumnsReactTable';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import InfoIcon from '@material-ui/icons/Info';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';

interface LoadingGridProps {
  permissions: any;
  transferAssetData?: any;
  transferAssetId: string | any;
  setNextStep: any;
  currentStep: number;
  setTickets?: any;
  setExistingAssets?: any;
  setTransferIsEnded?: any;
  updateTransferStatus?: any;
  isTransferEnded: boolean;
  renderedFrom?: string;
  allowedToEdit: boolean;
  canReceive: boolean;
  stepFullScreen: any;
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
    isTransferEnded,
    renderedFrom,
    allowedToEdit,
    canReceive,
    stepFullScreen
  } = props;
  const toastConfig = useContext(CustomToastContext);

  const [assetWithNoTicket, setAssetWithNoTicket] = useState([]);
  const [isRemovingTicket, setRemovingTicket] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [showConfirmBoxReceive, setShowConfirmBoxReceive] = useState(false);

  const history = useHistory();

  const [showTicketDialog, setShowTicketDialog] = useState({ open: false, data: {} });
  const [anchorActionEl, setAnchorActionEl] = useState(null);
  const [dataRows, setDataRows] = useState(null);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [addSerializedAssetDialog, setAddSerializedAssetDialog] = useState({ open: false, products: [] });
  const [showReplaceReason, setShowReplaceReason] = useState({ open: false, data: {} });
  const [replaceLoading, setReplaceLoading] = useState(false);
  const [columns, setColumns] = useState(null);

  const { getColumnData } = useColumns();

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
    if (dataRows?.length) {
      const inventoryDelivered = dataRows?.filter((asset: any) => asset['loadingTicketStatus'] === 'Delivered');
      const inventoryLost = dataRows?.filter((asset: any) => asset?.status === 'Lost');
      if (inventoryDelivered.length > 0) {
        setNextStep(true);
      } else {
        setNextStep(false);
      }
      if (transferAssetData?.transferType === 'Internal') {
        if (inventoryDelivered.length === dataRows?.filter((d) => d.status !== 'Lost').length || inventoryLost.length === dataRows?.length) {
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
    axiosInstance()
      .get(`/field?resource=${serializedAsset.resource}`)
      .then(({ data: { data } }) => {
        let columns = [];
        data
          ?.filter((d) => ['assetNumber', 'serialNumber', 'product', 'productDescription', 'status']?.includes(d?.fieldData?.fieldName))
          ?.forEach((o) => {
            let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.serializedAssetDetail.path);
            if (currentColumn !== null) {
              if (o?.fieldData?.fieldName === 'assetNumber') {
                const assetNumberColumn = {
                  accessor: o?.fieldData?.fieldName,
                  Header: o?.fieldData?.fieldLabel,
                  width: 300,
                  sticky: isMobile ? 'none' : 'left',
                  primaryField: true,
                  Cell: ({ row }) =>
                    row?.original?.assetNumber ? (
                      <div className="d-flex gap-2 align-items-center">
                        <p> {row.original[o?.fieldData?.fieldName]}</p>
                        <Box ml={1}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              window.open(`${routes.serializedAssetDetail.path}/${row.original?._id}`);
                            }}
                          >
                            <OpenInNewIcon fontSize="small" color="primary" />
                          </IconButton>
                        </Box>
                        {row?.original?.isReplaced && (
                          <Box>
                            <HtmlTooltip
                              enterTouchDelay={0}
                              title={`Replaced Asset ${row?.original?.replaceAsset} Reason-${row?.original?.replaceReason}`}
                            >
                              <InfoIcon fontSize="small" color={'primary'} />
                            </HtmlTooltip>
                          </Box>
                        )}
                      </div>
                    ) : (
                      <NoDataCell />
                    ),
                  setCellClassNames: (row) => {
                    if ([ASSET_STATUS.lost, ASSET_STATUS.scrap, ASSET_STATUS.needRepair, ASSET_STATUS.needRecert].includes(row?.status)) {
                      return 'error';
                    }
                    if (row?.isReplaced) {
                      return 'isPurchaseOrder';
                    }
                  }
                };
                columns = [...columns, assetNumberColumn];
              } else if (o?.fieldData?.fieldName === 'product') {
                const productTypeColumn = {
                  accessor: o?.fieldData?.fieldName,
                  Header: o?.fieldData?.fieldLabel,
                  width: 300,
                  Cell: ({ row }) =>
                    row?.original[o?.fieldData?.fieldName] ? (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <p> {row.original[o?.fieldData?.fieldName]}</p>
                        <Box ml={1}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              window.open(`${routes.productDetail.path}/${row.original?.productId}`);
                            }}
                          >
                            <OpenInNewIcon fontSize="small" color="primary" />
                          </IconButton>
                        </Box>
                      </div>
                    ) : (
                      <NoDataCell />
                    )
                };
                columns = [...columns, productTypeColumn];
              } else {
                columns = [...columns, currentColumn?.columnData];
              }
            }
          });
        const column = [
          {
            accessor: 'index',
            Header: 'Index',
            width: 70,
            sticky: isMobile ? 'none' : 'left',
            Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>
          },
          ...columns,
          {
            accessor: 'loadingTicket',
            Header: 'Loading Ticket',
            width: 200,
            Cell: ({ row }) =>
              row?.original?.loadingTicket ? (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <p> {row?.original?.loadingTicket}</p>
                  <Box ml={1}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        window.open(`${routes.deliveryTicketDetail.path}/${row.original?.loadingTicketId}`);
                      }}
                    >
                      <OpenInNewIcon fontSize="small" color="primary" />
                    </IconButton>
                  </Box>
                </div>
              ) : (
                <NoDataCell />
              )
          },
          {
            accessor: 'loadingTicketStatus',
            Header: 'Loading Ticket Status',
            primaryField: true,
            width: 200,
            Cell: ({ row }) => <p className="text-truncate">{row?.original?.loadingTicketStatus || <NoDataCell />}</p>
          }
        ];
        setColumns(column);
      });
  };

  const fetchAssetsData = async () => {
    await fetchFields();
    try {
      const result = await axiosInstance().get(`${routes.transferAsset.path}/get-asset/${transferAssetData?._id}`);

      let assetData = result?.data?.data?.assets;

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

      assetData = assetData?.map((d: any, index: number) => {
        let finalObject: any = prepareDataForGrid(d);
        return {
          index: index + 1,
          ...finalObject
        };
      });
      setExistingAssets(assetData);
      setDataRows(assetData);
      setSelectedRecords(assetData?.filter((f) => f.isChecked === true));
    } catch (error) {
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
      const result = rows.filter((f) => f.productId === element?.productId && !f.isCounted);
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
          fileName={`${routes.transferAsset.title}-${transferAssetData?.transferAssetNumber}`}
          resource={sidebarResource.transferAsset}
          referenceId={transferAssetId}
          columns={columns?.filter((e) => ['assetNumber', 'serialNumber', 'product', 'productDescription', 'status']?.includes(e?.accessor))}
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
                        const foundProduct = products.filter((e) => e._id === element?.productId);
                        if (foundProduct.length) {
                          foundProduct[0].qty += 1;
                        } else {
                          products.push({
                            _id: element?.productId,
                            id: element?.productId,
                            productName: element?.product,
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
        {columns && dataRows ? (
          <Box zIndex={5} width={'100%'}>
            <CustomReactTable
              height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
              columns={columns}
              data={dataRows}
              onSelect={setSelectedRecords}
              childrenProperty="subRows"
              uniqueKey="_id"
              hideSelection={!allowedToEdit}
              hideAction={true}
              renderedFrom={renderedFrom}
              isClientSideGrid={true}
              hideExpander={true}
            />
          </Box>
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
          filterByPlant={transferAssetData?.transferFromPlant}
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
