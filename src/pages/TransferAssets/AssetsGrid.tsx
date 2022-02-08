import { useReducer, useState, useEffect, Fragment, FC, useContext } from 'react'
import { Button, Box, } from '@material-ui/core'
import { useHistory } from 'react-router-dom'
import routes from '../../components/Helpers/Routes';
import GridDeleteIcon from '../../components/Helpers/GridDeleteIcon';
import { isMobile, isTablet } from 'react-device-detect';
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import AddAssetsDialog from './AddAssetsDialog';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import CustomAgGrid, { reducer as gridReducer, intialState as gridState } from '../../components/AgGridComponents/CustomAgGrid';
import axiosInstance from '../../axios/axiosInstance';
import { prepareDataForGrid, deliveryTicket, DELIVERY_TICKET_REFRENCE_TYPE, DELIVERY_TICKET_TYPE } from "../../constants/helpers"
import useColumns, { getStaticFields, getFrameworkComponents } from "../../constants/useColumns"
import CustomSwipableList from "../../components/SwipableListComponents/CustomSwipableList";
import { FaSuitcase } from "react-icons/fa";
import { IoRemoveCircleOutline } from 'react-icons/io5';
import { MdAdd } from 'react-icons/md';

interface AssetsGridProps {
  permissions?: any;
  user?: any;
  currentStep: number | any;
  setNextStep?: any;
  fetchAssets: any;
  updateTransferStatus?: any;
  transferAssetData?: any;
  handleViewPdf?: any;
  fileDownloading?: boolean
}

const AssetsGrid: FC<AssetsGridProps> = (props) => {
  const { permissions, user, fetchAssets, currentStep, setNextStep, updateTransferStatus, transferAssetData } = props
  const toastConfig = useContext(CustomToastContext);


  const [isRemovingAssets, setRemovingAssets] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [removeData, setRemoveData] = useState([])
  const [columns, setColumns] = useState([])
  const [openAddNewAssets, setOpenAddNewAssets] = useState(false);
  const [frameWorkComponent, setFrameWorkComponent] = useState({})
  const [gridApi, setGridApi] = useState(null);
  const [agGridState, gridDispatch] = useReducer(gridReducer, gridState);
  const { getColumnData } = useColumns();
  const { dataRows, rowCount, loading: gridLoading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = agGridState;

  const history = useHistory();

  useEffect(() => {
    if (currentStep === 0) {
      if (transferAssetData) {
        fetchGridColumns()
      }
    }
  }, [transferAssetData, currentStep])
  const fetchGridColumns = () => {
    axiosInstance()
      .get("/field?resource=Product Inventory")
      .then(({ data: { data } }) => {
        let columns = []
        let rendererNames = []
        data.forEach(o => {
          if (o?.fieldData?.fieldName === "serialNumber") {
            o.fieldData.primaryField = true
          }
          let currentColumn = getColumnData(routes.productInventory?.title, o?.fieldData, routes.productInventoryDetail.path)

          if (currentColumn !== null) {
            columns = [...columns, currentColumn?.columnData]
            if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
              rendererNames.push(currentColumn?.rendererName)
            }
          }
        })

        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true)
        tempFrameworkComponent = {
          ...tempFrameworkComponent,
          actionsRenderer: ActionsRenderer,
        }
        setFrameWorkComponent({ ...tempFrameworkComponent })
        columns = [...columns, ...getStaticFields()]
        setColumns([...columns])
      })
  }

  const ActionsRenderer = (params) => (
    !params.data.hasOwnProperty("deliveryTicket") && <>
      <GridDeleteIcon
        hasDeletePermission={permissions?.transferAsset?.isUpdate}
        ownerId={transferAssetData?.createdBy.user._id}
        userId={user?.user?._id}
        onDelete={() => {
          setShowConfirmBox(true);
          setRemoveData([params.data._id])
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
  }, [currentStep, transferAssetData])

  const fetchLoadingTickets = () =>
    new Promise((resolve, reject) => {
      axiosInstance().get(`${deliveryTicket.api}/typewise?refrenceType=${DELIVERY_TICKET_REFRENCE_TYPE.rentalJob}&refrenceId=${transferAssetData?._id}&ticketType=${DELIVERY_TICKET_TYPE.loading}`)
        .then(({ data: { data } }) => {
          resolve(data);
        })
        .catch((err) => {
          reject(err);
        });
    });
  ;

  const fetchAssetsData = async (forceRefresh) => {
    gridDispatch({ type: "loading", loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }

    try {
      let data = await fetchAssets(forceRefresh)
      let ticketData: any = await fetchLoadingTickets();

      if (currentStep === 0) {
        if (data.length === 0 && transferAssetData?.status !== "New") {
          updateTransferStatus("New")
        } else if (data.length > 0 && transferAssetData?.status !== "In Progress") {
          updateTransferStatus("In Progress")
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
          ...finalObject,
          assetNumber: `${index + 1}. ${finalObject.assetNumber}`
        }
      })



      gridDispatch({ type: "initialize", data: data, count: data.length })
      gridDispatch({ type: "loading", loading: false });
    } catch (error) {
      gridDispatch({ type: "loading", loading: false });
      toastConfig.setToastConfig(error)
    }
  };

  /**
   * Handle Remove Assets
   */
  const handleRemoveAssets = async () => {
    if (removeData.length > 0) {
      setRemovingAssets(true)
      try {
        await axiosInstance().put(`${routes.transferAsset.path}/remove-asset/${transferAssetData?._id}`, {
          assets: removeData
        })
        setRemoveData([])
        setShowConfirmBox(false);
        setRemovingAssets(false)
        fetchAssetsData(true)
      } catch (error) {
        setShowConfirmBox(false);
        setRemovingAssets(false)
        setRemoveData([])
        toastConfig.setToastConfig(error);
      }

    }
  }

  useEffect(() => {
    if (currentStep === 0) {
      if (dataRows.length > 0) {
        setNextStep(true)
      } else {
        setNextStep(false)
      }
    }
  }, [dataRows, currentStep])

  return (
    <Fragment>
      <Box display="flex" justifyContent="space-between" mx="4px">
        {permissions?.transferAsset.isUpdate && <Button
          variant={isMobile ? 'text' : 'contained'}
          color="primary"
          size="small"
          style={isMobile && !isTablet ? { color: "var(--secondary)" } : {}}
          onClick={() => {
            setOpenAddNewAssets(true);
          }}
        >
          {isMobile && !isTablet ? <MdAdd size={22} /> : `Add ${routes.productInventory.title}`}
        </Button>}
        {permissions?.transferAsset.isUpdate && <Button
          variant={isMobile ? 'text' : 'contained'}
          size="small"
          color="primary"
          style={isMobile && !isTablet ? { color: "var(--danger-light)" } : {}}
          disabled={selectedRecords.length === 0 || selectedRecords.filter((asset) => asset?.hasOwnProperty('deliveryTicket')).length > 0}
          onClick={() => {
            setShowConfirmBox(true);
            setRemoveData(selectedRecords.map((asset: any) => asset?._id))
          }}
        >

          {isMobile && !isTablet ? <IoRemoveCircleOutline size={22} /> : "Remove Assets"}

        </Button>}
      </Box>

      <Box mt={1}>
        {Object.keys(frameWorkComponent).length > 0 ?
          isMobile && !isTablet ?
            <CustomSwipableList
              allowSelection={true}
              allowSwipe={true}
              permissions={permissions.transferAsset}
              primaryField={columns?.find(d => d.primaryField)}
              onClick={(data) => {
                history.push(`${routes.productInventoryDetail.path}/${data._id}`)
              }}
              dataRows={dataRows}
              selectedRecords={selectedRecords}
              dispatch={gridDispatch}
              onEdit={(data) => {
                // history.push(`${routes.rentalManagementDetail.path}/${data._id}?openEdit=true`)
              }}
              extraParamsToCheckDelete={true}
              onDelete={(data) => {

              }}
              rowCount={rowCount}
              page={page}
              loading={gridLoading}
              chips={[
                {
                  label: "Product Desc : ",
                  field: "productCategory",
                }
              ]}
              additionalDetails={[
                {
                  icon: <FaSuitcase size={18} />,
                  field: "customerAccount"
                },
              ]}
              owerCollaboratorInitialsOrImages="owerCollaboratorInitialsOrImages"
              onCreate={false}
              showClone={false}
              onClone={(data) => { }}
              renderedFrom="transferAssetPage"
            /> :
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
              allowAction={true}
              actionWidth={100}
              allowSelection={true}
              isClientSideGrid={true}
              loading={gridLoading}
              renderedFrom="transferAssetPage"
              refreshGrid={() => fetchAssetsData(true)}
            /> : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>}
      </Box>

      {/* Add Assets Dialog */}
      {openAddNewAssets &&
        <AddAssetsDialog
          transferAssetId={transferAssetData?._id ?? ""}
          plantId={transferAssetData?.transferFromPlant.optionValue ?? ""}
          closeDialog={() => setOpenAddNewAssets(false)}
          fetchAssets={() => fetchAssetsData(true)}
          existingAssets={dataRows.map(asset => asset._id)}
          updateTransferStatus={updateTransferStatus}
        />
      }
      {/* Confirm Delete Dialog */}
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
  )
}

export default AssetsGrid
