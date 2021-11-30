import { useReducer, useState, useEffect, Fragment, FC, useContext } from 'react'
import { Button, Box, } from '@material-ui/core'
import { Link } from 'react-router-dom'

import routes from '../../components/Helpers/Routes';
import GridDeleteIcon from '../../components/Helpers/GridDeleteIcon';
import NoDataCell from '../../components/Helpers/NoDataCell';
import { isMobile } from 'react-device-detect';
import { CommonRenderer, DateRenderer } from '../../components/AgGridComponents/CustomAgGridCellRenderers';
import AddAssetsDialog from './AddAssetsDialog';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import CustomAgGrid, { reducer as gridReducer, intialState as gridState } from '../../components/AgGridComponents/CustomAgGrid';
import axiosInstance from '../../axios/axiosInstance';

interface AssetsGridProps {
  permissions?: any;
  user?: any;
  currentStep: number | any;
  plantId: string | any;
  setNextStep?: any;
  fetchAssets: any;
  transferAssetId: string | any;
}

const AssetsGrid: FC<AssetsGridProps> = (props) => {
  const { permissions, user, plantId, fetchAssets, transferAssetId } = props
  const toastConfig = useContext(CustomToastContext);


  const [isRemovingAssets, setRemovingAssets] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [removeData, setRemoveData] = useState([])
  const [openAddNewAssets, setOpenAddNewAssets] = useState(false);
  const [gridApi, setGridApi] = useState(null);
  const [agGridState, gridDispatch] = useReducer(gridReducer, gridState);
  const { dataRows, rowCount, loading: gridLoading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = agGridState;
  const columns = [
    { field: 'assetNumber', headerName: 'Asset Number', show: true, disabled: true, cellRenderer: 'assetRenderer' },
    { field: 'serialNumber', headerName: 'Serial Number', show: true, disabled: true, cellRenderer: 'commonRenderer' },
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

  const ProductRenderer = (params) =>
    params.value ? (
      <Link className="link cursor-pointer" to={`${routes.productDetail.path}/${params.data.productId}`}>
        <p title={params.value}>{params.value}</p>
      </Link>
    ) : (
      <NoDataCell />
    );

  const ActionsRenderer = (params) => (
    <>
      <GridDeleteIcon
        hasDeletePermission={permissions?.transferAsset?.isUpdate}
        ownerId={user?.user?._id}
        userId={user?.user?._id}
        onDelete={() => {
          setShowConfirmBox(true);
          setRemoveData([params.data._id])
        }}
        entity=""
      />
    </>
  );

  const frameworkComponents = {
    productRenderer: ProductRenderer,
    assetRenderer: AssetRenderer,
    commonRenderer: CommonRenderer,
    actionsRenderer: ActionsRenderer,
    dateRenderer: DateRenderer
  };

  useEffect(() => {
    if (transferAssetId) {
      fetchAssetsData(true);
    }
    // eslint-disable-next-line
  }, [transferAssetId]);

  const fetchAssetsData = async (forceRefresh) => {
    gridDispatch({ type: "loading", loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }

    try {
      let data = await fetchAssets(forceRefresh)
      data = data?.map((d: any) => ({
        ...d,
        product: d.product.optionLabel,
        productId: d.product.optionValue,
      }))
      gridDispatch({ type: "initialize", data: data, count: data.length })
      gridDispatch({ type: "loading", loading: false });
    } catch (error) {
      gridDispatch({ type: "loading", loading: false });
      toastConfig.setToastConfig(error)
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

  /**
   * Handle Remove Assets
   */
  const handleRemoveAssets = async () => {
    if (removeData.length > 0) {
      setRemovingAssets(true)
      try {
        await axiosInstance().put(`${routes.transferAsset.path}/remove-asset/${transferAssetId}`, {
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

  return (
    <Fragment>
      <Box display="flex" justifyContent="space-between" mx="4px">
        <Button
          variant={isMobile ? 'outlined' : 'contained'}
          color="primary"
          size="small"
          onClick={() => {
            setOpenAddNewAssets(true);
          }}
        >
          {`Add ${routes.productInventory.title}`}
        </Button>
        <Button
          variant="contained"
          size="small"
          color="primary"
          disabled={selectedRecords.length === 0}
          onClick={() => {
            setShowConfirmBox(true);
            setRemoveData(selectedRecords.map((asset: any) => asset?._id))
          }}
        >
          Remove Assets
        </Button>
      </Box>

      <Box mt={1}>
        <CustomAgGrid
          columns={columns}
          dataRows={dataRows}
          frameworkComponents={frameworkComponents}
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
        />
      </Box>

      {/* Add Assets Dialog */}
      {openAddNewAssets &&
        <AddAssetsDialog
          transferAssetId={transferAssetId ?? ""}
          plantId={plantId ?? ""}
          closeDialog={() => setOpenAddNewAssets(false)}
          fetchAssets={() => fetchAssetsData(true)}
          existingAssets={dataRows.map(asset => asset._id)}
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
