import { useReducer, useState, useEffect, Fragment, FC, useContext } from 'react';
import { Button, Box } from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import routes from 'src/components/Helpers/Routes';
import GridDeleteIcon from 'src/components/Helpers/GridDeleteIcon';
import { isMobile, isTablet } from 'react-device-detect';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import CustomAgGrid, { reducer as gridReducer, intialState as gridState } from 'src/components/AgGridComponents/CustomAgGrid';
import axiosInstance from 'src/axios/axiosInstance';
import {
  prepareDataForGrid,
  deliveryTicket,
  DELIVERY_TICKET_REFERENCE_TYPE,
  DELIVERY_TICKET_TYPE,
  transferAsset,
  serializedAsset
} from 'src/constants/helpers';
import useColumns, { getStaticFields, getFrameworkComponents } from 'src/constants/useColumns';
import CustomSwipableList from 'src/components/SwipableListComponents/CustomSwipableList';
import { FaSuitcase } from 'react-icons/fa';
import AddSerializedAsset from 'src/pages/RentalManagement/SerializedAsset/AddSerializedAsset';

interface AssetsGridProps {
  permissions?: any;
  user?: any;
  currentStep: number | any;
  setNextStep?: any;
  fetchAssets: any;
  updateTransferStatus?: any;
  transferAssetData?: any;
  handleViewPdf?: any;
  fileDownloading?: boolean;
  renderedFrom?: string;
  allowedToEdit: boolean;
}

const AssetsGrid: FC<AssetsGridProps> = (props) => {
  const { allowedToEdit, permissions, user, fetchAssets, currentStep, setNextStep, updateTransferStatus, transferAssetData, renderedFrom } = props;
  const toastConfig = useContext(CustomToastContext);

  const [isRemovingAssets, setRemovingAssets] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [removeData, setRemoveData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [openAddNewAssets, setAddSerializedAssetDialog] = useState(false);
  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const [gridApi, setGridApi] = useState(null);
  const [agGridState, gridDispatch] = useReducer(gridReducer, gridState);
  const { getColumnData } = useColumns();
  const { dataRows, rowCount, loading: gridLoading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = agGridState;

  const [isAdding, setIsAdding] = useState(false);

  const history = useHistory();

  useEffect(() => {
    if (currentStep === 0) {
      if (transferAssetData) {
        fetchGridColumns();
      }
    }
  }, [transferAssetData, currentStep]);

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${serializedAsset.resource}`)
      .then(({ data: { data } }) => {
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.serializedAssetDetail.path);
          if (currentColumn !== null) {
            columns = [...columns, currentColumn?.columnData];
            if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
              rendererNames.push(currentColumn?.rendererName);
            }
          }
        });

        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
        tempFrameworkComponent = {
          ...tempFrameworkComponent,
          actionsRenderer: ActionsRenderer
        };
        setFrameWorkComponent({ ...tempFrameworkComponent });
        columns = [...columns, ...getStaticFields()];
        setColumns([...columns]);
      });
  };

  const ActionsRenderer = (params) =>
    !params.data.hasOwnProperty('deliveryTicket') && (
      <>
        <GridDeleteIcon
          hasDeletePermission={permissions?.transferAsset?.isUpdate}
          ownerId={transferAssetData?.createdBy.user._id}
          userId={user?.user?._id}
          onDelete={() => {
            setShowConfirmBox(true);
            setRemoveData([params.data._id]);
          }}
          entity=""
        />
      </>
    );

  useEffect(() => {
    if (currentStep === 0) {
      if (transferAssetData) {
        fetchAssetsData(true);
      }
    }
    // eslint-disable-next-line
  }, [currentStep, transferAssetData]);

  const fetchLoadingTickets = () =>
    new Promise((resolve, reject) => {
      axiosInstance()
        .get(
          `${deliveryTicket.api}/typewise?referenceType=${DELIVERY_TICKET_REFERENCE_TYPE.transferAsset}&referenceId=${transferAssetData?._id}&ticketType=${DELIVERY_TICKET_TYPE.loading}`
        )
        .then(({ data: { data } }) => {
          resolve(data);
        })
        .catch((err) => {
          reject(err);
        });
    });

  const fetchAssetsData = async (forceRefresh) => {
    gridDispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    try {
      let data = await fetchAssets(forceRefresh);
      let ticketData: any = await fetchLoadingTickets();
      if (currentStep === 0) {
        if (data.length === 0 && transferAssetData?.status !== 'New') {
          updateTransferStatus('New');
        } else if (data.length > 0 && transferAssetData?.status !== 'In Progress') {
          updateTransferStatus('In Progress');
        }
      }
      for (let i = 0; i < ticketData.length; i++) {
        for (let j = 0; j < data.length; j++) {
          if (ticketData[i]?.productInventory.some((asset: any) => data[j]._id === (typeof asset === 'object' ? asset.optionValue : asset))) {
            data[j].deliveryTicket = ticketData[i].ticketName;
            data[j].deliveryTicketId = ticketData[i]._id;
            data[j].deliveryTicketStatus = ticketData[i].status;
          }
        }
      }
      data = data?.map((d: any, index) => {
        let finalObject: any = prepareDataForGrid(d);
        return {
          ...finalObject
        };
      });
      gridDispatch({ type: 'initialize', data: data, count: data.length });
      gridDispatch({ type: 'loading', loading: false });
    } catch (error) {
      gridDispatch({ type: 'loading', loading: false });
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
        fetchAssetsData(true);
      } catch (error) {
        setShowConfirmBox(false);
        setRemovingAssets(false);
        setRemoveData([]);
        toastConfig.setToastConfig(error);
      }
    }
  };

  useEffect(() => {
    if (currentStep === 0) {
      if (dataRows.length > 0) {
        setNextStep(true);
      } else {
        setNextStep(false);
      }
    }
  }, [dataRows, currentStep]);

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
              {isMobile && !isTablet ? 'Add assets' : `Add ${routes.serializedAsset.title}`}
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
        {Object.keys(frameWorkComponent).length > 0 ? (
          isMobile && !isTablet ? (
            <CustomSwipableList
              allowSelection={allowedToEdit}
              allowSwipe={allowedToEdit}
              permissions={permissions?.transferAsset}
              primaryField={columns?.find((d) => d.primaryField)}
              onClick={(data) => {
                history.push(`${routes.serializedAssetDetail.path}/${data._id}`);
              }}
              dataRows={dataRows}
              selectedRecords={selectedRecords}
              dispatch={gridDispatch}
              onEdit={(data) => {
              }}
              extraParamsToCheckDelete={true}
              onDelete={(data) => {}}
              rowCount={rowCount}
              page={page}
              loading={gridLoading}
              chips={[
                {
                  label: 'Product Desc : ',
                  field: 'productCategory'
                }
              ]}
              additionalDetails={[
                {
                  icon: <FaSuitcase size={18} />,
                  field: 'customerAccount'
                }
              ]}
              owerCollaboratorInitialsOrImages="owerCollaboratorInitialsOrImages"
              onCreate={false}
              showClone={false}
              onClone={(data) => {}}
              renderedFrom={renderedFrom}
            />
          ) : (
            <CustomAgGrid
              columns={columns}
              dataRows={dataRows}
              frameworkComponents={frameWorkComponent}
              setGridApi={setGridApi}
              dispatch={gridDispatch}
              rowCount={rowCount}
              limit={limit}
              pageSizes={pageSizes}
              page={page}
              allowAction={allowedToEdit}
              actionWidth={100}
              allowSelection={allowedToEdit}
              isClientSideGrid={true}
              loading={gridLoading}
              renderedFrom={renderedFrom}
              refreshGrid={() => fetchAssetsData(true)}
            />
          )
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
                updateTransferStatus('In Progress');
                fetchAssetsData(true);
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
          filterByPlant={transferAssetData?.transferFromPlant.optionValue}
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
