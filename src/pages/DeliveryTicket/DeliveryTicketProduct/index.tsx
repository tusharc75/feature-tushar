import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import { Box, CircularProgress, TextField } from '@material-ui/core';
import SearchBox from '../../../components/Helpers/SearchBox';
import CustomAgGrid, { reducer, intialState } from '../../../components/AgGridComponents/CustomAgGrid';
import {
  gridLoadingTimeout,
  CustomDialogTransition,
  packages,
  isObjectEmpty,
  prepareDataForGrid,
  getLocalStorageArrayData,
  deliveryTicket
} from '../../../constants/helpers';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import Dialog from '@material-ui/core/Dialog/Dialog';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomAgGridEditable from '../../../components/AgGridComponents/CustomAgGridEditable';
import { startCase } from 'lodash';
import useColumns, { getStaticFields, getFrameworkComponents } from '../../../constants/useColumns';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import { findOne, objectStore } from 'src/constants/indexdbhelper';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import { isMobile, isTablet } from 'react-device-detect';
import CustomSwipableList from 'src/components/SwipableListComponents/CustomSwipableList';

const DeliveryTicketProduct = ({ renderedFrom, deliveryTicketId }) => {
  const toastConfig = useContext(CustomToastContext);

  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting } = state;
  const [columns, setColumns] = useState(null);
  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const {
    state: { user, permissions }
  }: any = useData();
  const { isOffline } = useContext(CustomOfflineContext);
  const { getColumnData } = useColumns();

  const defaultColumns = [{ field: 'qty', headerName: 'Qty', show: true, order: 1, disabled: true, cellRenderer: 'commonRenderer' }];
  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    fetchProduct();
  }, [page, limit, filters, sorting, search]);

  const fetchProduct = async () => {
    try {
      dispatch({ type: 'loading', loading: true });
      if (gridApi) {
        gridApi.setRowData([]);
      }
      let data;
      if (isOffline) {
        const deliveryTicket = await findOne(objectStore.deliveryTicket, deliveryTicketId);
        const response = await findOne(objectStore.rentalManagement, deliveryTicket?.rentalJob?.optionValue);
        const product = deliveryTicket?.products?.map((e) => e.product);
        data = response?.material?.filter((d) => product?.includes(d.materialId)).map((obj) => obj.productDetail);
        data?.forEach((ele) => {
          const res = deliveryTicket?.products?.filter((e) => e.product === ele._id);
          if (res.length) {
            ele.qty = res[0].qty;
          }
        });
      } else {
        const response = await axiosInstance().get(`${deliveryTicket.api}/${deliveryTicketId}/products`);
        data = response?.data?.data;
      }
      let rows = data.map((u) => {
        let res = {
          ...prepareDataForGrid(u, user)
        };
        return res;
      });
      dispatch({ type: 'initialize', data: rows, count: rows.length });
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    } catch (error) {
      toastConfig.setToastConfig(error);
      dispatch({ type: 'loading', loading: false });
    }
  };

  const fetchGridColumns = async () => {
    var fields = [];
    if (isOffline) {
      fields = await findOne(objectStore.resource, 'Product');
    } else {
      const response = await axiosInstance().get('/field?resource=Product&view=true');
      fields = response?.data?.data;
    }
    let columns = [];
    let rendererNames = [];
    fields.forEach((o) => {
      let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.productDetail.path);
      if (currentColumn !== null) {
        columns = [...columns, currentColumn?.columnData];
        if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
          rendererNames.push(currentColumn?.rendererName);
        }
      }
    });
    let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
    tempFrameworkComponent = {
      ...tempFrameworkComponent
    };
    setFrameWorkComponent({ ...tempFrameworkComponent });
    columns = [...columns, ...getStaticFields()];
    setColumns([...defaultColumns, ...columns]);
  };

  return (
    <Box mt={2}>
      {isMobile && !isTablet ? (
        <CustomSwipableList
          allowSelection={false}
          allowSwipe={false}
          permissions={permissions}
          primaryField={columns?.find((d) => d.field === 'productName')}
          onClick={(data) => {}}
          selectedRecords={[]}
          dataRows={dataRows}
          dispatch={dispatch}
          onEdit={() => {}}
          extraParamsToCheckDelete={true}
          onDelete={() => {}}
          rowCount={rowCount}
          page={page}
          loading={loading}
          onCreate={null}
          showClone={false}
          fullHeight={true}
          renderedFrom={renderedFrom}
          onClone={() => {}}
          chips={[
            {
              label: 'Qty: ',
              field: 'qty'
            }
          ]}
        />
      ) : columns ? (
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
          allowSelection={false}
          showOnlyShowFilteredRecordSwitch={true}
          refreshGrid={fetchProduct}
          renderedFrom={renderedFrom}
          isClientSideGrid={true}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Box>
  );
};

export default DeliveryTicketProduct;
