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
import { CreatedByRenderer, UpdatedByRenderer } from '../../components/AgGridComponents/CustomAgGridCellRenderers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
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
}

const AddAssetsDialog: FC<AssetDialogProps> = (props) => {
  const { plantId, closeDialog, fetchAssets, existingAssets, transferAssetId } = props
  const toastConfig = useContext(CustomToastContext);

  const [isAdding, setAdding] = useState(false)

  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  const {
    state: { permissions }
  }: any = useData();

  useEffect(() => {
    fetchProductInventory();
  }, [page, limit, filters, sorting, search, showFilteredRecordsOnly]);

  const columns = [
    { field: 'assetNumber', headerName: 'Asset Number', show: true, cellRenderer: 'commonRenderer' },
    { field: 'serialNumber', headerName: 'Serial Number', show: true, cellRenderer: 'commonRenderer' },
    { field: 'productName', headerName: 'Product Description', show: true, disabled: true, cellRenderer: 'commonRenderer' },
    { field: 'status', headerName: 'Status', show: true, cellRenderer: 'commonRenderer' },
    { field: 'plant', headerName: 'Plant', show: true, disabled: true, cellRenderer: 'commonRenderer' },
    { field: 'productCategory', headerName: 'Product Category', show: true, disabled: true, cellRenderer: 'commonRenderer' }
  ];

  const NameRenderer = (params) => (
    <Link className="link" title={params.value} to={`${routes.productInventoryDetail.path}/${params.data._id}`}>
      {params.value}
    </Link>
  );

  const frameworkComponents = {
    createdByRenderer: CreatedByRenderer,
    updatedByRenderer: UpdatedByRenderer,
    nameRenderer: NameRenderer
  };

  const fetchProductInventory = () => {
    dispatch({ type: 'loading', loading: true });

    if (gridApi) {
      gridApi.setRowData([]);
    }

    let queryString = getQueryString();
    queryString = `${queryString}&filterById=${JSON.stringify([{ field: 'warehouse', term: plantId }])}&repairable=true&filterByIdType=or`;

    axiosInstance()
      .get(`${productInventory.api}${queryString}`)
      .then(({ data: { data } }) => {
        data = data.filter((asset: any) => !existingAssets.includes(asset._id))
          .map((u: any) => ({
            ...u,
            id: u._id,
            productName: u.product?.optionLabel,
            productCategory: u?.productCategory?.optionLabel,
            warehouse: u?.warehouse?.optionLabel,
          }));

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

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}`;

    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify(getLocalStorageArrayData(localStorageSelectedRecords)?.map((m) => m._id))}`;
    }

    if (!isObjectEmpty(filters)) {
      const updatedFilters = [];

      Object.keys(filters).forEach((field) => {
        updatedFilters.push({
          field: replaceFieldName(field),
          term: filters[field].filter
        });
      });
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}&filterType=and`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${search}`;
    }
    return deepFilter;
  };



  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };



  const replaceFieldName = (field) => {
    switch (field) {
      case 'createdBy':
        return 'createdBy.user.concatedName';

      case 'updatedBy':
        return 'updatedBy.user.concatedName';

      default:
        return field;
    }
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
                        {getLocalStorageArrayData(`${addSerializedAssetsRenderedFrom}_selected`).length
                          ? '(' + getLocalStorageArrayData(`${addSerializedAssetsRenderedFrom}_selected`).length + ')  '
                          : ''}
                        Add
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
              {columns ? (
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
                  loading={loading}
                  customGridOptions={{ getRowStyle: getRowStyleScheduled }}
                  // selectedRecords={selectedRecords}
                  renderedFrom={addSerializedAssetsRenderedFrom}
                  showOnlyShowFilteredRecordSwitch={true}
                // allowHeaderSelection={false}
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
