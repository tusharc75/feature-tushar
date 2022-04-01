import { useContext, useEffect, useReducer, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory } from 'react-router-dom';
import { Box, Button } from '@material-ui/core';

import CustomAgGrid from 'src/components/AgGridComponents/CustomAgGridEditable';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { reducer, intialState } from 'src/components/AgGridComponents/CustomAgGrid';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { prepareDataForGrid, packages } from 'src/constants/helpers';
import useColumns, { getFrameworkComponents, getStaticFields } from 'src/constants/useColumns';
import CustomSwipableList from 'src/components/SwipableListComponents/CustomSwipableList';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import { useData } from 'src/StateProvider/Provider';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import DeleteButton from 'src/components/Helpers/DeleteButton';
import Loader from 'src/components/Loader';

interface Props {
  packageId: string;
  renderedFrom: string;
}

const ProductsTable = (props: Props) => {
  const { packageId, renderedFrom } = props;
  const { setToastConfig } = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { permissions }
  }: any = useData();
  const hasPermissions = permissions && permissions[packages.permissions]?.isUpdate
  const [columns, setColumns] = useState([]);
  const [showProductConfirmBox, setShowProductConfirmBox] = useState(false);
  const [gridApi, setGridApi] = useState(null);
  const [showProductAssignDialog, setShowProductAssignDialog] = useState(false);
  const [isRemovingProducts, setRemovingProducts] = useState(false);
  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const { getColumnData } = useColumns();
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;

  useEffect(() => {
    fetchGridColumns();
    getProducts();
  }, []);

  const getProducts = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }

    axiosInstance()
      .get(`${packages.packageApi}/get-products/${packageId}`)
      .then(({ data: { data } }) => {
        let rows = data.map((u) => {
          let res = {
            ...prepareDataForGrid(u),
            inventoryCount: u?.qty,
            warehouses: u.warehouse?.map((w) => w.warehouseName).join(', '),
            productCategoryChipColor: u.productCategory?.chipColour
          };
          for (let col in res) {
            if (res[col] && res[col].optionLabel) {
              res[col] = res[col].optionLabel;
            }
          }
          return res;
        });
        dispatch({ type: 'initialize', data: rows, count: data.length });
        dispatch({ type: 'loading', loading: false });
      })
      .catch((err) => {
        dispatch({ type: 'loading', loading: false });
        setToastConfig(err);
      });
  };

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=Product`)
      .then(({ data: { data } }) => {
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          let currentColumn = getColumnData(routes.product.title, o?.fieldData, routes.productDetail.path);

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
        setFrameWorkComponent({
          ...tempFrameworkComponent,
          actionsRenderer: ActionsRenderer
        });
        columns = [...columns, ...getStaticFields()];
        setColumns([...columns]);
      });
  };

  const handleUpdateQuantity = (row) => {
    axiosInstance()
      .put(`${packages.packageApi}/${packageId}/update-product`, {
        ids: [row.data._id],
        qty: Number(row.data.qty)
      })
      .then(() => {
        getProducts();
      })
      .catch((err) => setToastConfig(err));
  };

  const removeProducts = () => {
    setRemovingProducts(true);
    const Ids = selectedRecords.map((d) => d._id);
    axiosInstance()
      .put(`${packages.packageApi}/${packageId}/remove-product`, {
        ids: Ids
      })
      .then(() => {
        setRemovingProducts(false);
        setShowProductConfirmBox(false);
        getProducts();
      })
      .catch((err) => {
        setRemovingProducts(false);
        setShowProductConfirmBox(false);
        setToastConfig(err);
      });
  };

  const ActionsRenderer = (params) => <span>{params?.data?.qty}</span>;

  return (
    <Box mt={2} className="bg-white">
      <Box mb={1} p={1} display="flex" justifyContent="space-between" alignItems="center">
        <Box width={'118px'}>
          {hasPermissions && <Button variant="contained" color="primary" size="small" onClick={() => setShowProductAssignDialog(true)}>
            Add Products
          </Button>}
        </Box>
        <>
          <ImportExportLinks
            permissions={permissions?.packages}
            module="packages-products"
            api={`${packages.packageApi}/package-products`}
            afterImportCompleted={() => {
              getProducts();
            }}
            isExportAllOrSomeFeature={true}
            total={rowCount}
            recordsToExport={selectedRecords.length}
            ids={[]}
            additionalParams={`refrenceId=${packageId}`}
            isBackgroundWhite={true}
          />
          {hasPermissions && <Box ml={1}>
            <DeleteButton
              disabled={selectedRecords.length === 0 || isRemovingProducts}
              text={'Delete'}
              onClick={() => {
                setShowProductConfirmBox(true);
              }}
            />
          </Box>}
        </>
      </Box>
      {isMobile && !isTablet ? (
        <CustomSwipableList
          allowSelection={hasPermissions}
          allowSwipe={hasPermissions}
          permissions={hasPermissions && permissions[packages.permissions]}
          primaryField={columns?.find((d) => d.primaryField)}
          onClick={(data) => {
            history.push(`${routes.productDetail.path}/${data._id}`);
          }}
          dataRows={dataRows}
          selectedRecords={[]}
          dispatch={dispatch}
          onEdit={(data) => { }}
          extraParamsToCheckDelete={true}
          onDelete={(data) => { }}
          rowCount={rowCount}
          page={page}
          loading={loading}
          additionalDetails={[]}
          chips={[
            {
              label: 'Quantity : ',
              field: 'qty'
            }
          ]}
          owerCollaboratorInitialsOrImages="owerCollaboratorInitialsOrImages"
          onCreate={() => {
            setShowProductAssignDialog(true);
          }}
          showClone={true}
          onClone={(data) => { }}
          renderedFrom={renderedFrom}
        />
      ) : Object.keys(frameWorkComponent).length > 0 ? (
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
          isClientSideGrid={true}
          actionWidth={150}
          loading={loading}
          allowSelection={hasPermissions}
          actionLabel="Qty"
          renderedFrom={renderedFrom}
          actionEditable={hasPermissions}
          onCellValueChanged={handleUpdateQuantity}
        />
      ) : (
        <Loader noLoader={false} minHeight={'400px'} text="Loading..." />
      )}
      {showProductAssignDialog && (
        <AssignProductDialog
          reference="package"
          productsDialogOpen={true}
          productId={packageId}
          handleCloseDialog={() => setShowProductAssignDialog(false)}
          assignedProducts={[...dataRows?.map((e) => e._id)]}
          renderedFrom={`${renderedFrom}_sub-1`}
          onSuccess={() => {
            getProducts();
            setShowProductAssignDialog(false);
          }}
        />
      )}
      {showProductConfirmBox && (
        <ConfirmationDialog
          open={showProductConfirmBox}
          message={`Are you sure you want to delete the product(s) ?`}
          onClose={() => {
            setShowProductConfirmBox(false);
          }}
          okBtnLoading={isRemovingProducts}
          onOk={removeProducts}
        />
      )}
    </Box>
  );
};

export default ProductsTable;
