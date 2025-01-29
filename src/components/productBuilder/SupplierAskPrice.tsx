import { Box } from '@mui/material';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import Dialog from '@mui/material/Dialog';
import Grid from '@mui/material/Grid2';
import { sortBy } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../axios/axiosInstance';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import NoDataCell from '../../components/Helpers/NoDataCell';
import {
  CustomDialogTransition,
  displayDateTime,
  getLocalStorageArrayData,
  gridLoadingTimeout,
  prepareDataForGrid,
  removeLocalStorage,
  sidebarResource
} from '../../constants/helpers';
import AskSupplierPriceDialog from './AskSupplierPriceDialog';
import CustomReactTable, { useColumns, useTableReducer } from '../CustomReactTable';

const renderedFrom = 'quoteSupplierPrice';
const localStorageSelectedRecords = `${renderedFrom}_selected`;
const displayColumns = ['qty', 'productName', 'productDescription', 'unit', 'supplierAccount', 'responseDate', 'supplierContact', 'status'];
let levalOrderBy = ['product', 'product-custom', 'product-template', 'price-template', 'product-builder-custom', 'price-builder-custom'];
const SupplierAskPrice = (props) => {
  const toastConfig = useContext(CustomToastContext);
  const { handleClose, supplierData, productBuilderId, onSuccess } = props;

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { generateColumns } = useColumns();
  const { page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  const [columns, setColumns] = useState(null);
  const [askSupplierPriceDialog, setAskSupplierPriceDialog] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [page, limit, filters, sorting, search, showFilteredRecordsOnly]);

  const fetchProduct = () => {
    dispatch({ type: 'loading', loading: true });

    axiosInstance()
      .get(`/quote-builder/supplier-response/${supplierData?._id}`)
      .then(({ data: { data } }) => {
        let requiredFields = [];
        let rows = data.products.map((item, index) => {
          if (item?.requiredFields) requiredFields = [...requiredFields, ...item?.requiredFields];
          let res: any = {
            ...prepareDataForGrid(item),
            totalCost: item.totalCost || item.costPrice,
            supplierContact: item?.supplierContact?.optionLabel ? item?.supplierContact?.optionLabel : ''
          };
          res.hideSelection = item.status !== 'Submit' ? true : false;
          return res;
        });
        let columns = [];
        data?.fields?.forEach((ele) => {
          const filteredFields = ele?.fields?.filter((e) => !requiredFields.includes(e.fieldName));
          const newColumns = generateColumns(renderedFrom, filteredFields);
          columns = [...columns, ...newColumns];
        });
        columns = sortBy(
          [
            ...columns,
            {
              accessor: 'supplierContact',
              Header: 'Supplier Contact',
              width: 180,
              show: true,
              disabled: false,
              Cell: ({ row }) => (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <p>{row.original.supplierContact}</p>
                </div>
              ),
              leval: 'product',
              order: 3
            },
            {
              accessor: 'status',
              Header: 'Status',
              width: 180,
              show: true,
              disabled: false,
              Cell: ({ row }) => (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <p>{row.original.status}</p>
                </div>
              ),
              leval: 'product',
              order: 3
            },
            {
              accessor: 'responseDate',
              Header: 'Rate Submit Date',
              width: 180,
              show: true,
              disabled: false,
              Cell: ({ row }) =>
                row?.original?.responseDate ? (
                  <h5 className="createBy" title={`${displayDateTime(row?.original?.responseDate)}`}>
                    {displayDateTime(row?.original?.responseDate)}
                  </h5>
                ) : (
                  <NoDataCell />
                ),
              leval: 'product',
              order: 3
            }
          ],
          function (item: any) {
            return levalOrderBy.indexOf(item.leval);
          }
        );
        setColumns([...columns]);

        dispatch({ type: 'initialize', data: rows, count: rows.length });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  const handleAdd = () => {
    let tempData = {
      uniqueId: supplierData?._id,
      requestId: getLocalStorageArrayData(localStorageSelectedRecords)[0]?._id,
      productBuilder: productBuilderId
    };

    axiosInstance()
      .put(`/quote-builder/apply-supplier-price`, tempData)
      .then(({ data }) => {
        onSuccess();
        removeLocalStorage(localStorageSelectedRecords);
        toastConfig.setToastConfig({
          message: data?.message,
          type: 'success',
          open: true
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };
  const handleReject = (content) => {
    axiosInstance()
      .put(`/quote-builder/apply-reject/${getLocalStorageArrayData(localStorageSelectedRecords)[0]?._id}`, {
        body: content ? content : '',
        protected: true
      })
      .then(({ data }) => {
        removeLocalStorage(localStorageSelectedRecords);
        toastConfig.setToastConfig({
          message: data?.message,
          type: 'success',
          open: true
        });
        fetchProduct();
        setAskSupplierPriceDialog(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Dialog fullScreen={true} TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true}>
      <CustomDialogHeader title={'Select Supplier Price'} onClose={handleClose}></CustomDialogHeader>
      <div className="listing-grid p-3">
        <Box mb={2}>
          <Grid container>
            <Grid size={{ xs: 12, sm: 12, md: 12 }} container justifyContent="flex-end">
              <Box ml={1} mt={1}>
                <ThemeButton
                  buttonType='theme'
                  onClick={handleAdd}
                  disabled={getLocalStorageArrayData(localStorageSelectedRecords).length === 1 ? false : true}
                >
                  Apply
                </ThemeButton>
              </Box>
              <Box ml={1} mt={1}>
                <ThemeButton
                  buttonType='red'
                  onClick={() => setAskSupplierPriceDialog(true)}
                  disabled={getLocalStorageArrayData(localStorageSelectedRecords).length === 1 ? false : true}
                >
                  Reject
                </ThemeButton>
              </Box>
            </Grid>
          </Grid>
        </Box>
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            onSelect={() => { }}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchProduct}
            showOnlyShowFilteredRecordSwitch={true}
            isClientSideGrid={false}
            hideAction={true}
            resource={sidebarResource.product}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </div>
      {askSupplierPriceDialog && (
        <AskSupplierPriceDialog
          setAskSupplierPriceDialog={setAskSupplierPriceDialog}
          askSupplierPriceDialog={askSupplierPriceDialog}
          from="SupplierAskPrice"
          handleReject={handleReject}
        />
      )}
    </Dialog>
  );
};

export default SupplierAskPrice;
