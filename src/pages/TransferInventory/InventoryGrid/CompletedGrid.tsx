import React, { useReducer, useState, useEffect, useContext } from 'react';
import { Box } from '@material-ui/core';
import { useHistory, Link } from 'react-router-dom';
import routes from 'src/components/Helpers/Routes';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { CommonRenderer } from 'src/components/AgGridComponents/CustomAgGridCellRenderers';
import CustomAgGrid, { reducer as gridReducer, intialState as gridState } from 'src/components/AgGridComponents/CustomAgGrid';
import axiosInstance from 'src/axios/axiosInstance';
import CustomSwipableList from 'src/components/SwipableListComponents/CustomSwipableList';
import { useData } from 'src/StateProvider/Provider';
import { gridLoadingTimeout, prepareDataForGrid } from 'src/constants/helpers';

const CompletedGrid = (props) => {
  const { transferData, setTransferIsEnded } = props;
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions }
  } = useData();
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(gridReducer, gridState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;
  const columns = [
    { field: 'productName', headerName: 'Product Description', show: true, cellRenderer: 'productNameRenderer', primaryField: true },
    {
      field: 'qty',
      headerName: 'Quantity',
      show: true,
      disabled: false,
      cellRenderer: 'commonRenderer',
      cellEditor: 'numericCellEditor',
      editable: true
    }
  ];

  const history = useHistory();

  useEffect(() => {
    if (!transferData) return;
    fetchInventories();
  }, [transferData]);

  const fetchInventories = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    axiosInstance()
      .get(`${routes.transferInventory.path}/${transferData._id}/product`)
      .then(({ data: { data } }) => {
        dispatch({ type: 'loading', loading: true });
        let rows = data?.map((u: any) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['productId'] = u._id;
          finalObject['productName'] = u.productDetail.productName;
          finalObject['qty'] = u.qty;

          setTransferIsEnded(true)

          return {
            ...finalObject
          };
        });

        dispatch({ type: 'initialize', data: rows, count: data.count });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const ProductNameRenderer = (params) => (
    <Link className="link" title={params.value} to={`/product/detail/${params.data._id}`}>
      {params.value}
    </Link>
  );

  const frameworkComponents = {
    commonRenderer: CommonRenderer,
    productNameRenderer: ProductNameRenderer
  };

  return (
    <React.Fragment>
      <Box mt={1}>
        {isMobile && !isTablet ? (
          <CustomSwipableList
            allowSelection={false}
            allowSwipe={false}
            permissions={permissions?.transferInventory}
            primaryField={columns?.find((d: any) => d.primaryField)}
            onClick={(data: any) => {
              history.push(`${routes.productInventory.path}/${data._id}`);
            }}
            dataRows={dataRows}
            selectedRecords={selectedRecords}
            dispatch={dispatch}
            onEdit={() => {}}
            extraParamsToCheckDelete={true}
            onDelete={() => {}}
            rowCount={rowCount}
            page={page}
            loading={loading}
            chips={[
              {
                label: "Quantity: ",
                field: "qty",
              },
            ]}
            additionalDetails={[]}
            owerCollaboratorInitialsOrImages="owerCollaboratorInitialsOrImages"
            onCreate={false}
            showClone={false}
            onClone={() => {}}
            renderedFrom="transferInentoryPage"
          />
        ) : (
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
            actionWidth={120}
            allowSelection={false}
            isClientSideGrid={true}
            loading={loading}
            renderedFrom="transferInentory_completedInventory"
            refreshGrid={() => {}}
          />
        )}
      </Box>
    </React.Fragment>
  );
};

export default CompletedGrid;
