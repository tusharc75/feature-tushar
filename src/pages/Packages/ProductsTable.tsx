import { useEffect, useReducer, useState } from 'react'
import CustomAgGrid from "../../components/AgGridComponents/CustomAgGrid";
import { reducer, intialState } from "../../components/AgGridComponents/CustomAgGrid";
import axiosInstance from '../../axios/axiosInstance'
import routes from "../../components/Helpers/Routes";
import { getColumnData, getFrameworkComponents, getStaticFields } from "../../constants/columns"

const ProductsTable = ({ productList = [] }) => {

  const [columns, setColumns] = useState([])
  const [gridApi, setGridApi] = useState(null);
  const [frameWorkComponent, setFrameWorkComponent] = useState({})
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

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
      const { createdBy, entity, history, ...restProperties } = u;
      const [firstEntity, ...restEntity] = entity ? entity : [];
      let res = {
        ...restProperties,
        id: u._id,
        inventoryCount: u?.qty,
        warehouses: u.warehouse?.map(w => w.warehouseName).join(", "),
        createdBy: u.createdBy?.user?.concatedName,
        createdByDate: u.createdBy?.date,
        updatedBy: u.updatedBy?.user?.concatedName,
        updatedByDate: u.updatedBy?.date,
        entity: firstEntity?.optionLabel,
        entityId: firstEntity?.optionValue,
        productCategoryChipColor: u.productCategory?.chipColour,
        restEntity: restEntity,
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
  const ActionsRenderer = (params) => (<span>{params.data?.qty ?? "0"}</span>)
  return (
    <>
      {
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
            loading={loading}
            allowSelection={false}
            actionLabel="Quantity"
            renderedFrom="productPage"
          /> : null}
    </ >
  );
};

export default ProductsTable;
