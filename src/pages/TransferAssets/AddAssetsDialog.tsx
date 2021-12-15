import { useState, useEffect, useContext, useReducer, Fragment, FC } from 'react';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { Link } from 'react-router-dom';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../axios/axiosInstance';
import { Box, CircularProgress } from '@material-ui/core';
import SearchBox from '../../components/Helpers/SearchBox';
import routes from '../../components/Helpers/Routes';
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import { productInventory, isObjectEmpty, gridLoadingTimeout, CustomDialogTransition, getLocalStorageArrayData } from '../../constants/helpers';
import { prepareDataForGrid } from "../../constants/helpers"
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import useColumns, { getStaticFields, getFrameworkComponents } from "../../constants/useColumns"
import { useData } from '../../StateProvider/Provider';
import Dialog from '@material-ui/core/Dialog/Dialog';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';

const addSerializedAssetsRenderedFrom = 'addSerializedAssetsTransferAsset';
const localStorageSelectedRecords = `${addSerializedAssetsRenderedFrom}_selected`;

interface AssetDialogProps {
  plantId: string;
  closeDialog?: VoidFunction;
  fetchAssets?: VoidFunction;
  existingAssets: any[];
  transferAssetId: string | any;
  updateTransferStatus?: any;
}

const AddAssetsDialog: FC<AssetDialogProps> = (props) => {
  const { plantId, closeDialog, fetchAssets, existingAssets, transferAssetId, updateTransferStatus } = props
  const toastConfig = useContext(CustomToastContext);

  const [isAdding, setAdding] = useState(false)

  const [gridApi, setGridApi] = useState(null);
  const [frameWorkComponent, setFrameWorkComponent] = useState({})
  const [columns, setColumns] = useState([])

  const { getColumnData } = useColumns();
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  const {
    state: { permissions }
  }: any = useData();

  useEffect(() => {
    fetchGridColumns()
  }, [])
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
        }
        setFrameWorkComponent({ ...tempFrameworkComponent })
        columns = [...columns, ...getStaticFields()]
        setColumns([...columns])
      })
  }
  const fetchProductInventory = () => {
    dispatch({ type: 'loading', loading: true });

    if (gridApi) {
      gridApi.setRowData([]);
    }

    let queryString = `?&filterById=${JSON.stringify([{ field: 'warehouse', term: plantId }])}&repairable=true&filterByIdType=or`;

    axiosInstance()
      .get(`${productInventory.api}${queryString}`)
      .then(({ data: { data } }) => {
        data = data.filter((asset: any) => !existingAssets.includes(asset._id))
          .map((u: any) => {
            let finalObject = prepareDataForGrid(u);
            return finalObject

          });

        dispatch({ type: 'initialize', data: data, count: data.length });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  useEffect(() => {
    fetchProductInventory();
  }, []);


  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const getRowStyleScheduled = (params) => {
    if (['Available', 'New'].indexOf(params?.data?.status) >= 0) {
      return {
        'background-color': '#d3ffe0'
      };
    }
    return null;
  };

  /**
   * ADD ASSETS FOR TRANSFERRING THEM 
   */

  const handleAddAssetsForTransfer = () => {
    const ids = selectedRecords.map(rec => rec.id);
    if (ids.length > 0) {
      setAdding(true)
      axiosInstance().put(`${routes.transferAsset.path}/add-asset/${transferAssetId}`, { assets: ids })
        .then(() => {
          setAdding(false)
          fetchAssets()
          closeDialog()
          updateTransferStatus("In Progress")
        }).catch(err => {
          setAdding(false)
          toastConfig.setToastConfig(err)
        })
    }
  }

  return (
    <Fragment>
      {
        <Dialog fullScreen={true} TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true} onClose={closeDialog}>
          <CustomDialogHeader title={`Add ${routes.productInventory.title}`} onClose={closeDialog} />
          <CustomDialogContent>
            <div className="listing-grid p-3">
              <Box mb={2}>
                <Grid container>
                  <Grid item xs={12} sm={6}></Grid>
                  <Grid item xs={12} sm={6} container justify="flex-end">
                    <SearchBox onSearch={handleSearch} searchbox="terms_header_search_bar" width="300px" value={search} />
                    <Box ml={1} mt={1}>
                      <Button
                        size="small"
                        color="primary"
                        onClick={handleAddAssetsForTransfer}
                        variant="contained"
                        disabled={selectedRecords.length === 0 || isAdding}
                        endIcon={isAdding && <CircularProgress size={20} />}
                      >
                        {selectedRecords.length > 0 ? `(${selectedRecords.length}) ` : ""}Add
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
              {Object.keys(frameWorkComponent).length > 0 ? (
                <CustomAgGrid
                  columns={columns}
                  dataRows={dataRows}
                  frameworkComponents={frameWorkComponent}
                  setGridApi={setGridApi}
                  dispatch={dispatch}
                  rowCount={rowCount}
                  limit={limit}
                  pageSizes={pageSizes}
                  page={page}
                  allowAction={false}
                  loading={loading}
                  customGridOptions={{ getRowStyle: getRowStyleScheduled }}
                  isClientSideGrid={true}
                  renderedFrom={addSerializedAssetsRenderedFrom}
                />
              ) : (
                <Box p={2} height={500} bgcolor="white">
                  <CommonSkeleton lenArray={[...Array(10).keys()]} />
                </Box>
              )}
            </div>
          </CustomDialogContent>
        </Dialog>
      }
    </Fragment>
  );
};

export default AddAssetsDialog;
