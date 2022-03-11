import { useState, useEffect, useContext, Fragment, useReducer } from 'react';
import { Box, Grid, Button, } from '@material-ui/core';
import { Link, useParams, useLocation } from 'react-router-dom';
import { product, isObjectEmpty, prepareDataForGrid } from '../../../constants/helpers';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { Delete } from '@material-ui/icons';
import { IconButton, Tooltip } from "@material-ui/core";
import { useData } from "../../../StateProvider/Provider";
import CustomAgGrid, { reducer, intialState } from '../../../components/AgGridComponents/CustomAgGrid';
import { CommonRenderer, CreatedByRenderer, UpdatedByRenderer } from '../../../components/AgGridComponents/CustomAgGridCellRenderers';
import AssignProductDialog from '../../../components/AssignRolesDialog/AssignProductDialog';
import ConfirmationDialogRaw from '../../../components/Helpers/ConfirmationDialog';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { camelCase } from 'lodash';
import { getColumnData, getFrameworkComponents, getStaticFields } from "src/constants/columns";
import Loader from 'src/components/Loader';

function Parts({ id }) {

  const renderedFrom = `${camelCase(routes?.product.title)}_bom`
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  const { state: { permissions, user, selectedEntity } }: any = useData();
  const { setToastConfig } = useContext(CustomToastContext);

  const [parts, setParts] = useState([]);
  const [showConfirmBox, setShowConfirmBox] = useState({ open: false, data: null })
  const [isDeleting, setIsDeleting] = useState(false);
  const [openAssignProductDialog, setOpenAssignProductDialog] = useState(false);

  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const [columns, setColumns] = useState([]);
  const [frameWorkComponent, setFrameWorkComponent] = useState(null)
  const { dataRows, rowCount, loading: gridLoading, page, pageSizes, search, filters, sorting, selectedRecords, limit, appendRows } = state;
  const defaultColumns = [
    { field: 'productName', headerName: 'Product Description', show: true, cellRenderer: 'productNameRenderer' },
    { field: 'qty', headerName: 'Qty', show: true, cellRenderer: 'commonRenderer', cellEditor: "numericCellEditor", editable: true },
] 


  useEffect(() => {
    if (id) {
      fetchBOMData();
    }
  }, [id, page, limit, filters, sorting, selectedEntity]);

  // useEffect(() => {
  //   if (parts) {
  //     getColumns();
  //   }
  // }, [parts])
  useEffect(() => {
    fetchGridColumns()
  }, [])

  const fetchBOMData = () => {
    dispatch({ type: "loading", loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    axiosInstance()
      .get(`/product/${id}/bom`)
      .then(({ data: { data } }) => {
        data = data.map((o:any) => {
         let finalObject = {
            ...o?.childProductDetail,
            ...o,
          };

          return prepareDataForGrid(finalObject)

        });
        if (appendRows) {
          dispatch({
            type: "initialize", data: [...dataRows, ...data],
            count: data.count, selectedRecords: [...dataRows, ...data].filter(f => f.isChecked === true)
          });
        } else {
          dispatch({
            type: "initialize", data: data, count: data.count,
            selectedRecords: data.filter(f => f.isChecked === true)
          });
        }
        if (gridApi) {
          try {
            let oldSelectedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : []
            if (oldSelectedRecords.length > 0) {
              gridApi.forEachNode(function (node) {
                node.setSelected(
                  oldSelectedRecords.some((o) => o === node.data._id)
                );
              });
            }
          } catch (ex) {
            console.error("Error in getting selected records from local storage")
          }
        }
        setParts([...data]);
         dispatch({ type: 'loading', loading: false });
        })
        .catch((err) => {
        dispatch({ type: 'loading', loading: false });
      });
  };

  const fetchGridColumns = () => {
    axiosInstance()
        .get("/field?resource=Product&view=true")
        .then(({ data: { data } }) => {
            let columns = []
            let rendererNames = []
            data.forEach(o => {
                let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.productDetail.path)
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
            setFrameWorkComponent({ ...tempFrameworkComponent, actionsRenderer: ActionsRenderer, productNameRenderer: ProductNameRenderer, })
            columns = [...columns, ...getStaticFields()]
            setColumns([...defaultColumns, ...columns ])
        })
}


  const handleRemove = () => {
    setIsDeleting(true)
    const { data } = showConfirmBox
    if (data.length > 1) {
      data.forEach((p:any) => {
        axiosInstance().put(`${product.api}/${p.product}/bom/remove`, {
          ids: [p._id]
        })
          .then(() => {
            setIsDeleting(false)
            setShowConfirmBox({ open: false, data: null });
            fetchBOMData()
          })
          .catch(err => {
            setToastConfig(err)
            setIsDeleting(false)
          })
      })
    } else {
      let d = data[0]
      axiosInstance().put(`${product.api}/${d.product}/bom/remove`, {
        ids: [d._id]
      })
        .then(() => {
          setIsDeleting(false)
          setShowConfirmBox({ open: false, data: null });
          fetchBOMData()
        })
        .catch(err => {
          setToastConfig(err)
          setIsDeleting(false)
        })
    }
  }

  // const getColumns = () => {
  //   if (gridApi) {
  //     gridApi.setRowData([]);
  //   }
  //   dispatch({ type: 'loading', loading: true });
  //   let newColumns = [];
  //   let rowsData = [];
  //   if (parts) {
  //     rowsData = parts ? parts?.map((p) => ({
  //       ...p,
  //       productName: p?.productName,
  //       qty: p?.qty,
  //       productCategory: p?.childProductDetail?.productCategory?.optionLabel,
  //       pricingMethod: p?.childProductDetail?.pricingMethod?.join(", "),
  //       unit: p?.childProductDetail?.unit?.join(", "),
  //       serializedProduct: p?.childProductDetail?.serializedProduct === true ? "Yes" : "No",
  //       createdBy: p?.createdBy?.user?.concatedName
  //     }))
  //       : [];
  //     newColumns = [
  //       { field: 'productName', headerName: 'Product Type', show: true, cellRenderer: 'productNameRenderer' },
  //       { field: 'qty', headerName: 'Quantity', show: true, disabled: false, cellRenderer: 'commonRenderer' },
  //       { field: 'productCategory', headerName: 'Product Category', show: true, disabled: false, cellRenderer: 'commonRenderer' },
  //       { field: 'pricingMethod', headerName: 'Pricing Method', show: true, disabled: false, cellRenderer: 'commonRenderer' },
  //       { field: 'unit', headerName: 'Unit', show: true, disabled: false, cellRenderer: 'commonRenderer' },
  //       { field: 'serializedProduct', headerName: 'Serialized Product', show: true, disabled: false, cellRenderer: 'commonRenderer' },
  //       { field: 'createdBy', headerName: 'Created By', show: true, disabled: false, cellRenderer: 'commonRenderer' },
  //     ];
  //     setColumns(newColumns);
  //     dispatch({ type: 'initialize', data: rowsData, count: rowsData.length });
  //     dispatch({ type: 'loading', loading: false });
  //   }
  // }

  const ActionsRenderer = (params) => (
    <Tooltip title="Delete">
      <IconButton
        onClick={() => {
          setShowConfirmBox({ open: true, data: [params.data] })
        }}
      >
        <Delete fontSize='small' color='error' />
      </IconButton>
    </Tooltip>
  )

  const ProductNameRenderer = (params) => (
    <Link className="link" title={params.value} to={`/product/detail/${params.data.childProduct}`}>
      {params.value}
    </Link>
  )

  // const frameworkComponents = {
  //   actionsRenderer: ActionsRenderer,
  //   productNameRenderer: ProductNameRenderer,
  //   commonRenderer: CommonRenderer,
  // };

  return (
    <div>
      <Box p={1}>
        <Grid container>
          <Grid item xs={6} md={6} sm={6}>
            <Button
              variant='contained'
              color="primary"
              size="small"
              onClick={() => {
                setOpenAssignProductDialog(true);
              }}
            >
              Add Product
            </Button>
          </Grid>
          <Grid item xs={6} md={6} sm={6} >
            {selectedRecords?.length > 0 &&
            <Box display={'flex'} justifyContent={'flex-end'}>
                <Button
                  variant='contained'
                  color="primary"
                  size="small"
                  onClick={() => {
                    setShowConfirmBox({ open: true, data: selectedRecords});
                  }}
                  >
                  Delete
                </Button>
              </Box>
              }
          </Grid>
        </Grid>
      </Box>
     {frameWorkComponent ?  <CustomAgGrid
        columns={columns}
        dataRows={dataRows}
        isClientSideGrid={true}
        frameworkComponents={frameWorkComponent}
        setGridApi={setGridApi}
        dispatch={dispatch}
        rowCount={rowCount}
        limit={limit}
        pageSizes={pageSizes}
        page={page}
        actionWidth={150}
        loading={gridLoading}
        renderedFrom={renderedFrom}
        refreshGrid={fetchBOMData}
      /> : <Loader text="Loading..." minHeight={"100%"} my={5} /> }
      {showConfirmBox.open && <ConfirmationDialogRaw
        open={true}
        message={`Are you sure you want to delete this product(s)?`}
        okBtnLoading={isDeleting}
        onClose={() => {
          setShowConfirmBox({ open: false, data: null });
        }}
        onOk={handleRemove}
      />}
      {openAssignProductDialog && (
        <AssignProductDialog
          productsDialogOpen={openAssignProductDialog}
          productId={id}
          handleCloseDialog={() => setOpenAssignProductDialog(false)}
          assignedProducts={parts}
          renderedFrom={`${renderedFrom}_grid-sub-1`}
          onSuccess={() => {
            if (permissions?.serializedAsset) {
              fetchBOMData();
            }
            setOpenAssignProductDialog(false);
          }}
        />
      )}
    </div>
  );
};


export default Parts