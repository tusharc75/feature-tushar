import { Box, Typography } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import { sortBy } from 'lodash';
import moment from 'moment';
import { useContext, useEffect, useState } from 'react';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { DeleteButton } from 'src/components/Helpers/Buttons';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { dateTimeFormat, gridLoadingTimeout, prepareDataForGrid, sidebarResource } from '../../../constants/helpers';
import CommonSkeleton from '../../Helpers/CommonSkeleton';

const displayColumns = ['qty', 'productName', 'productDescription', 'unit', 'responseDate', 'status'];

let levalOrderBy = ['product', 'product-custom', 'product-template', 'price-template', 'product-builder-custom', 'price-builder-custom'];
const ProductGridSupplierAskPrice = (props) => {
  const toastConfig = useContext(CustomToastContext);
  const { productData, handleAdd, handleReject } = props;
  const renderedFrom = 'quoteSupplierPrice' + productData?._id;
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { generateColumns } = useColumns();

  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  const [columns, setColumns] = useState(null);

  useEffect(() => {
    fetchProduct();
  }, [page, limit, filters, sorting, search, showFilteredRecordsOnly]);

  const fetchProduct = () => {
    dispatch({ type: 'loading', loading: true });

    let rows = productData?.products.map((item, index) => {
      let res: any = {
        ...prepareDataForGrid(item),
        totalCost: item.totalCost || item.costPrice,
        supplierContact: item?.supplierContact?.optionLabel ? item?.supplierContact?.optionLabel : '',
        status: productData?.status
      };
      res.hideSelection = item.status !== 'Submit' ? true : false;
      return res;
    });
    let columns = [];
    productData?.fields?.forEach((ele) => {
      const filteredFields = ele?.filter((e) => !productData?.requiredFields.includes(e.fieldName));
      const newColumns = generateColumns(renderedFrom, filteredFields);
      columns = [...columns, ...newColumns];
    });
    columns = sortBy([...columns], function (item: any) {
      return levalOrderBy.indexOf(item.leval);
    });
    setColumns([...columns]);
    dispatch({ type: 'initialize', data: rows, count: rows.length });
    setTimeout(() => {
      dispatch({ type: 'loading', loading: false });
    }, gridLoadingTimeout);
  };

  return (
    <>
      <Box padding={2} style={{ border: '1px solid #D4D6D7', borderRadius: 4 }}>
        <Grid container>
          <Grid item xs={12} sm={3} md={3} container justify="flex-start">
            {productData?.supplierContact?.optionLabel && (
              <Grid item xs={12} sm={12} md={12}>
                <Typography variant="subtitle2">{`Supplier Contact : ${productData?.supplierContact?.optionLabel}`}</Typography>
              </Grid>
            )}
          </Grid>
          <Grid item xs={12} sm={3} md={3} container justify="flex-start">
            {productData?.requestDate && (
              <Grid item xs={12} sm={12} md={12}>
                <Typography variant="subtitle2">{`Request Date : ${moment(productData?.requestDate)?.format(dateTimeFormat)}`}</Typography>
              </Grid>
            )}
            {productData?.responseDate && (
              <Grid item xs={12} sm={12} md={12}>
                <Typography variant="subtitle2">{`Response Date : ${moment(productData?.responseDate)?.format(dateTimeFormat)}`}</Typography>
              </Grid>
            )}
          </Grid>
          {productData?.status === 'Submit' && (
            <Grid item xs={12} sm={6} md={6} container justify="flex-end">
              <Box ml={1} mt={1}>
                <Button
                  size="small"
                  color="primary"
                  onClick={() => {
                    handleAdd(productData?._id);
                  }}
                  variant="contained"
                >
                  Apply
                </Button>
              </Box>
              <Box ml={1} mt={1}>
                <DeleteButton
                  id="detailDeleteButton"
                  text={'Reject'}
                  onClick={() => {
                    handleReject(productData?._id);
                  }}
                />
              </Box>
            </Grid>
          )}
        </Grid>
        <Box marginTop={1} />
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            onSelect={() => {}}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchProduct}
            showOnlyShowFilteredRecordSwitch={true}
            isClientSideGrid={false}
            hideAction={false}
            hideSelection={false}
            resource={sidebarResource.product}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Box>
    </>
  );
};

export default ProductGridSupplierAskPrice;
