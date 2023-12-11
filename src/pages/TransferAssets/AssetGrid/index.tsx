import { useState, useEffect, Fragment, FC, useContext } from 'react';
import { Button, Box, IconButton } from '@material-ui/core';
import routes from 'src/components/Helpers/Routes';
import GridDeleteIcon from 'src/components/Helpers/GridDeleteIcon';
import { isMobile, isTablet } from 'react-device-detect';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import axiosInstance from 'src/axios/axiosInstance';
import {
  prepareDataForGrid,
  deliveryTicket,
  DELIVERY_TICKET_REFERENCE_TYPE,
  DELIVERY_TICKET_TYPE,
  transferAsset,
  serializedAsset,
  dateFormat,
  TRANSFER_ASSET_STATUS
} from 'src/constants/helpers';
import AddSerializedAsset from 'src/pages/RentalManagement/SerializedAsset/AddSerializedAsset';
import { useColumns } from 'src/components/CustomReactTableNew';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { Delete } from '@material-ui/icons';

interface AssetsGridProps {
  permissions?: any;
  setNextStep?: any;
  updateTransferStatus?: any;
  transferAssetData?: any;
  renderedFrom?: string;
  allowedToEdit: boolean;
  stepFullScreen: any;
}

const AssetsGrid: FC<AssetsGridProps> = ({
  allowedToEdit,
  permissions,
  setNextStep,
  updateTransferStatus,
  transferAssetData,
  renderedFrom,
  stepFullScreen
}) => {
  const toastConfig = useContext(CustomToastContext);

  const [isRemovingAssets, setRemovingAssets] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [removeData, setRemoveData] = useState([]);
  const [columns, setColumns] = useState(null);
  const [dataRows, setDataRows] = useState(null);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [openAddNewAssets, setAddSerializedAssetDialog] = useState(false);
  const { getColumnData } = useColumns();

  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (transferAssetData) {
      fetchGridColumns();
      fetchData();
    }
  }, [transferAssetData]);

  const ActionsRenderer = [
    {
      accessor: 'action',
      Header: 'Actions',
      minWidth: 100,
      width: 100,
      sticky: 'right',
      disableFilters: true,
      disableSortBy: true,
      canDrag: false,
      Cell: ({ row }) => (
        <div>
          <HtmlTooltip title={`Remove`}>
            <IconButton
              size="small"
              disabled={allowedToEdit && !row?.original?.deliveryTicketId ? false : true}
              onClick={() => {
                setShowConfirmBox(true);
                setRemoveData([row.original?._id]);
              }}
            >
              <Delete fontSize="small" color={allowedToEdit && !row?.original?.deliveryTicketId ? 'error' : 'disabled'} />
            </IconButton>
          </HtmlTooltip>
        </div>
      )
    }
  ];

  const fetchGridColumns = () => {
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
                const assetNumberRenderer = {
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
                              window.open(`${routes.serializedAssetDetail.path}/${row.original?._id}`);
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
                columns = [...columns, assetNumberRenderer];
              } else if (o?.fieldData?.fieldName === 'product') {
                const productTypeRenderer = {
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
                columns = [...columns, productTypeRenderer];
              } else {
                columns = [...columns, currentColumn?.columnData];
              }
            }
          });

        setColumns([
          {
            accessor: 'index',
            Header: 'Index',
            width: 70,
            sticky: isMobile ? 'none' : 'left',
            Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
            Footer: () => {
              return <>Total</>;
            }
          },
          ...columns,
          ...ActionsRenderer
        ]);
      });
  };

  const fetchData = async () => {
    try {
      const assetResponce = await axiosInstance().get(`${routes.transferAsset.path}/get-asset/${transferAssetData?._id}`);
      let assets = assetResponce?.data?.data?.assets;

      const ticketResponce = await axiosInstance().get(
        `${deliveryTicket.api}/typewise?referenceType=${DELIVERY_TICKET_REFERENCE_TYPE.transferAsset}&referenceId=${transferAssetData?._id}&ticketType=${DELIVERY_TICKET_TYPE.loading}`
      );
      let ticketData: any = ticketResponce?.data?.data;

      for (let i = 0; i < ticketData.length; i++) {
        for (let j = 0; j < assets.length; j++) {
          if (ticketData[i]?.productInventory.some((asset: any) => assets[j]._id === (typeof asset === 'object' ? asset.optionValue : asset))) {
            assets[j].deliveryTicket = ticketData[i].ticketName;
            assets[j].deliveryTicketId = ticketData[i]._id;
            assets[j].deliveryTicketStatus = ticketData[i].status;
          }
        }
      }
      assets = assets?.map((d: any, index: number) => {
        let finalObject: any = prepareDataForGrid(d);
        return {
          index: index + 1,
          ...finalObject
        };
      });
      setDataRows(assets);
      if (assets?.length > 0) {
        setNextStep(true);
      } else {
        setNextStep(false);
      }

      if (assets.length === 0 && transferAssetData?.status !== TRANSFER_ASSET_STATUS.new) {
        updateTransferStatus(TRANSFER_ASSET_STATUS.new);
      } else if (assets.length > 0 && transferAssetData?.status !== TRANSFER_ASSET_STATUS.inProgress) {
        updateTransferStatus(TRANSFER_ASSET_STATUS.inProgress);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleRemoveAssets = async () => {
    if (removeData.length > 0) {
      setRemovingAssets(true);
      try {
        await axiosInstance().put(`${routes.transferAsset.path}/remove-asset/${transferAssetData?._id}`, {
          assets: removeData
        });
        setRemoveData([]);
        setShowConfirmBox(false);
        setRemovingAssets(false);
        fetchData();
      } catch (error) {
        setShowConfirmBox(false);
        setRemovingAssets(false);
        setRemoveData([]);
        toastConfig.setToastConfig(error);
      }
    }
  };

  return (
    <Fragment>
      {allowedToEdit && (
        <Box display="flex" justifyContent="space-between" m={1} mx={1}>
          {permissions?.transferAsset?.isUpdate && (
            <Button
              variant={'contained'}
              color="primary"
              size="small"
              style={isMobile && !isTablet ? { color: 'var(--secondary)' } : {}}
              onClick={() => {
                setAddSerializedAssetDialog(true);
              }}
            >
              {`Add Existing ${routes.serializedAsset.title}`}
            </Button>
          )}
          {permissions?.transferAsset?.isUpdate && (
            <Button
              variant={isMobile ? 'outlined' : 'contained'}
              size="small"
              color="primary"
              style={isMobile && !isTablet ? { color: 'var(--danger-light)' } : {}}
              disabled={selectedRecords.length === 0 || selectedRecords.filter((asset) => asset?.hasOwnProperty('deliveryTicket')).length > 0}
              onClick={() => {
                setShowConfirmBox(true);
                setRemoveData(selectedRecords.map((asset: any) => asset?._id));
              }}
            >
              {isMobile && !isTablet ? 'Remove' : 'Remove Assets'}
            </Button>
          )}
        </Box>
      )}
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
              hideAction={!allowedToEdit}
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
      {openAddNewAssets && (
        <AddSerializedAsset
          addSerializedAsset={(newRecordsToAdd) => {
            setIsAdding(true);
            axiosInstance()
              .put(`${transferAsset.api}/add-asset/${transferAssetData?._id}`, {
                assets: newRecordsToAdd.map((m) => {
                  return {
                    _id: m._id ?? m.id,
                    currentStatus: m?.status
                  };
                })
              })
              .then(({ data }) => {
                setAddSerializedAssetDialog(false);
                updateTransferStatus(TRANSFER_ASSET_STATUS.inProgress);
                fetchData();
                setIsAdding(false);
                toastConfig.setToastConfig({
                  open: true,
                  type: 'success',
                  message: data.message
                });
              })
              .catch((error) => {
                setIsAdding(false);
                toastConfig.setToastConfig(error);
              });
          }}
          handleSerializedAssetClose={() => {
            setAddSerializedAssetDialog(false);
          }}
          referenceType="Transfer Asset"
          isAdding={isAdding}
          selectedProducts={[]}
          filterByPlant={transferAssetData?.transferFromPlant}
        />
      )}
      {showConfirmBox && (
        <ConfirmationDialog
          okBtnLoading={isRemovingAssets}
          open={showConfirmBox}
          message={`Are you sure you want to remove asset(s)?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleRemoveAssets}
        />
      )}
    </Fragment>
  );
};

export default AssetsGrid;
