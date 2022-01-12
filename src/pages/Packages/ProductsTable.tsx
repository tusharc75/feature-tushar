import { useEffect, useReducer, useState } from 'react'
import CustomAgGrid from "../../components/AgGridComponents/CustomAgGrid";
import { reducer, intialState } from "../../components/AgGridComponents/CustomAgGrid";
import axiosInstance from '../../axios/axiosInstance'
import routes from "../../components/Helpers/Routes";
import { prepareDataForGrid } from "../../constants/helpers"
import useColumns, { getFrameworkComponents, getStaticFields } from "../../constants/useColumns"
import CustomSwipableList from '../../components/SwipableListComponents/CustomSwipableList';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory } from 'react-router-dom';
import { useData } from '../../StateProvider/Provider';

const ProductsTable = ({ productList = [], updateLoading = false, handleUpdateQuantity = null, handleAssignProduct = null }) => {
  const history = useHistory();
  const {
    state: { permissions }
  }: any = useData();
  const [columns, setColumns] = useState([])
  const [gridApi, setGridApi] = useState(null);
  const [frameWorkComponent, setFrameWorkComponent] = useState({})
  const { getColumnData } = useColumns();
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes } = state;

  useEffect(() => {
    if (productList) {
      if (gridApi) {
        gridApi.setRowData([]);
      }
      handleProductsColumnsAndData(productList)
    }
  }, [productList])

  const handleProductsColumnsAndData = (data) => {
    let rows = data.map(u => {
      let res = {
        ...prepareDataForGrid(u),
        inventoryCount: u?.qty,
        warehouses: u.warehouse?.map(w => w.warehouseName).join(", "),
        productCategoryChipColor: u.productCategory?.chipColour,
      }
      for (let col in res) {
        if (res[col] && res[col].optionLabel) {
          res[col] = res[col].optionLabel;
        }
      }
      return res;
    })
    dispatch({ type: 'initialize', data: rows, count: data.length });
  }

  useEffect(() => {
    fetchGridColumns()
  }, [])

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=Product`)
      .then(({ data: { data } }) => {
        let columns = []
        let rendererNames = []
        data.forEach(o => {

          let currentColumn = getColumnData(routes.product.title, o?.fieldData, routes.productDetail.path)

          if (currentColumn !== null) {
            columns = [...columns, currentColumn?.columnData]
            if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
              rendererNames.push(currentColumn?.rendererName)
            }
          }
        })
        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true)
        tempFrameworkComponent = {
          ...tempFrameworkComponent
        }
        setFrameWorkComponent({
          ...tempFrameworkComponent,
          actionsRenderer: ActionsRenderer
        })
        columns = [...columns, ...getStaticFields()]
        setColumns([...columns])
      })
  }
  const ActionsRenderer = (params) => (<span>{params?.data?.qty}</span>)
  return (
    <>
      {
        isMobile && !isTablet ? <CustomSwipableList
          allowSelection={true}
          allowSwipe={true}
          permissions={permissions.product}
          primaryField={columns?.find(d => d.primaryField)}
          onClick={(data) => {
            history.push(`${routes.productDetail.path}/${data._id}`)
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
          additionalDetails={[
          ]}
          chips={[
            {
              label: "Quantity : ",
              field: "qty",
            },
          ]}
          owerCollaboratorInitialsOrImages="owerCollaboratorInitialsOrImages"
          onCreate={() => { handleAssignProduct(true) }}
          showClone={true}
          onClone={(data) => { }}
          renderedFrom={"productPackageDetails"}
        /> :
          Object.keys(frameWorkComponent).length > 0 ?
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
              actionWidth={150}
              loading={loading || updateLoading}
              allowSelection={false}
              actionLabel="Quantity"
              renderedFrom="productPage"
              actionEditable={true}
              onCellValueChanged={handleUpdateQuantity}
            /> : null}
    </ >
  );
};

export default ProductsTable;
