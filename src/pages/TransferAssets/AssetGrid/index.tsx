import { Box, IconButton, MenuItem } from '@material-ui/core';
import { Delete } from '@material-ui/icons';
import { FC, Fragment, useContext, useEffect, useState } from 'react';
import { FiExternalLink } from 'react-icons/fi';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import {
  DELIVERY_TICKET_REFERENCE_TYPE,
  DELIVERY_TICKET_TYPE,
  TRANSFER_ASSET_STATUS,
  deliveryTicket,
  prepareDataForGrid,
  serializedAsset,
  transferAsset
} from 'src/constants/helpers';
import AddSerializedAsset from 'src/pages/RentalManagement/SerializedAsset/AddSerializedAsset';

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
  const { generateColumns } = useColumns();
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;

  const [isRemovingAssets, setRemovingAssets] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [removeData, setRemoveData] = useState([]);
  const [columns, setColumns] = useState(null);
  const [openAddNewAssets, setAddSerializedAssetDialog] = useState(false);

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
        const newColumns = generateColumns(
          renderedFrom,
          data?.filter((d) => ['assetNumber', 'serialNumber', 'product', 'productDescription', 'status']?.includes(d?.fieldData?.fieldName))
        );
        newColumns?.forEach((o) => {
          if (o.accessor === 'assetNumber') {
            o.cell = ({ row }) =>
              row?.original?.assetNumber ? (
                <div className="flex items-center gap-2">
                  <p> {row.original?.assetNumber}</p>
                  <IconButton
                    size="small"
                    onClick={() => {
                      window.open(`${routes.serializedAssetDetail.path}/${row.original?._id}`);
                    }}
                  >
                    <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                  </IconButton>
                </div>
              ) : (
                <NoDataCell />
              );
          } else if (o.accessor === 'product') {
            o.cell = ({ row }) =>
              row?.original?.product ? (
                <div className="flex items-center gap-2">
                  <p> {row.original?.product}</p>
                  <IconButton
                    size="small"
                    onClick={() => {
                      window.open(`${routes.productDetail.path}/${row.original?.productId}`);
                    }}
                  >
                    <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                  </IconButton>
                </div>
              ) : (
                <NoDataCell />
              );
          }
        });

        setColumns([
          {
            accessor: 'index',
            Header: 'Index',
            width: 70,
            sticky: 'left',
            Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
            Footer: () => {
              return <>Total</>;
            }
          },
          ...newColumns,
          ...ActionsRenderer
        ]);
      });
  };

  const fetchData = async () => {
    try {
      dispatch({ type: 'loading', loading: true });
      dispatch({ type: 'selection', selectedRecords: [] });
      const assetResponce = await axiosInstance().get(`${routes.transferAsset.path}/get-asset/${transferAssetData?._id}`);
      let assets = assetResponce?.data?.data?.assets;

      const ticketResponce = await axiosInstance().get(
        `${deliveryTicket.api}/typewise?referenceType=${DELIVERY_TICKET_REFERENCE_TYPE.transferAsset}&referenceId=${transferAssetData?._id}&ticketType=${DELIVERY_TICKET_TYPE.loading}`
      );
      let ticketData: any = ticketResponce?.data?.data;

      for (let i = 0; i < ticketData.length; i++) {
        for (let j = 0; j < assets.length; j++) {
          if (ticketData[i]?.assets.some((e: any) => assets[j]._id === e.asset)) {
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
      dispatch({ type: 'initialize', data: assets, count: assets?.length });
      dispatch({ type: 'loading', loading: false });
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

  const AddButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={!permissions?.transferAsset?.isUpdate}
          onClick={() => {
            setAddSerializedAssetDialog(true);
          }}
        >
          Add Existing {routes.serializedAsset.title}
        </MenuItem>
      </>
    );
  };

  const ActionButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={selectedRecords.length === 0 || selectedRecords.filter((asset) => asset?.hasOwnProperty('deliveryTicket')).length > 0}
          onClick={() => {
            setShowConfirmBox(true);
            setRemoveData(selectedRecords.map((asset: any) => asset?._id));
          }}
        >
          Remove Assets
        </MenuItem>
      </>
    );
  };

  return (
    <Fragment>
      {allowedToEdit && (
        <>
          <DetailsPageHeader
            isAddButtonVisible={true}
            addButtonMenuItems={<AddButtonMenuItems />}
            isActionButtonVisible={permissions?.transferAsset?.isUpdate}
            actionButtonMenuItems={<ActionButtonMenuItems />}
            actionButtonProps={{
              disabled: selectedRecords.length === 0 || selectedRecords.filter((asset) => asset?.hasOwnProperty('deliveryTicket')).length > 0
            }}
            hasXpadding={true}
          />
        </>
      )}
      <Box mt={1}>
        {columns ? (
          <Box zIndex={5} width={'100%'}>
            <CustomReactTable
              height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              refreshGrid={fetchData}
              hideSelection={!allowedToEdit}
              hideAction={!allowedToEdit}
              renderedFrom={renderedFrom}
              isClientSideGrid={true}
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
          referenceData={transferAssetData}
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
          message={
            transferAssetData?.rentalJob
              ? 'Are you sure you want to remove asset(s)?. In order to free the assets, please remove from the rental job as well.'
              : `Are you sure you want to remove asset(s)?`
          }
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
