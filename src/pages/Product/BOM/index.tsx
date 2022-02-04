import { useState, useEffect, useContext, Fragment, useReducer } from 'react';
import MaterialTable from 'material-table';
import { Link } from 'react-router-dom'
import {IconButton,Tooltip} from "@material-ui/core"
import { materialTableIcons,  product } from '../../../constants/helpers';
import { Box } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { Delete } from '@material-ui/icons';
import { CommonRenderer, CreatedByRenderer, UpdatedByRenderer } from '../../../components/AgGridComponents/CustomAgGridCellRenderers';
import CustomAgGrid, { reducer, intialState } from '../../../components/AgGridComponents/CustomAgGrid';

function ProductHierarchy({ data, permissions, unassignProduct, fetchData = () => { } }) {

    const [state, dispatch] = useReducer(reducer, intialState);
    const { setToastConfig } = useContext(CustomToastContext);
    const [showConfirmBox, setShowConfirmBox] = useState({ open: false, data: null })
    const [isDeleting, setIsDeleting] =useState(false)
    const [gridApi, setGridApi] = useState(null);
    const [columns, setColumns] = useState([]);
    const { dataRows, rowCount, loading: gridLoading, page,  pageSizes, search, filters, sorting, selectedRecords,limit } = state;
    const actions: any = [{
        icon: () => <Delete fontSize='small' color='error' />,
        tooltip: "Delete product",
        onClick: (_, rowData) => setShowConfirmBox({ open: true, data: rowData })
    }]
 
   
  
    useEffect(() => {
       
          getColumns();
        
      }, []);
    


    const getColumns = () => {
        if (gridApi) {
            gridApi.setRowData([]);
          }
          dispatch({ type: 'loading', loading: true });
          let newColumns = [];
          let rowsData = [];

          if(data){
             rowsData = data ?  data.map((p)=>({
                  ...p,
                  productName: p?.productName, 
                  qty:p?.qty,
              }))
              :[];

              newColumns=[
                { field: 'productName', headerName: 'Product Description', show: true, cellRenderer: 'productNameRenderer' },
                { field: 'qty', headerName: 'Quantity', show: true, disabled: false, cellRenderer: 'commonRenderer' },
                
                
              ];

              setColumns(newColumns);
              dispatch({ type: 'initialize', data: rowsData, count: rowsData.length });
              dispatch({ type: 'loading', loading: false });

              
          }
    }



    const ActionsRenderer = (params) => (
        <Tooltip title="Delete">
        <IconButton
            onClick={()=>{
                setShowConfirmBox({ open: true, data: params.data })
            }}
        >
             <Delete fontSize='small' color='error' />
        </IconButton>
        </Tooltip>
    )


    const ProductNameRenderer = (params) => (
        
        <Link className="link" title={params.value} to={`/product/detail/${params.data._id}`}>
        {params.value}
        </Link>
      
    )

  
    
  const frameworkComponents = {
    actionsRenderer: ActionsRenderer,
    productNameRenderer: ProductNameRenderer,
    commonRenderer: CommonRenderer,
   
   
  };
  


    const handleRemove = () => {
        setIsDeleting(true)
        const { data } = showConfirmBox
        axiosInstance().put(`${product.api}/${data.product}/bom/remove`, {
            ids: [data._id]
        })
            .then(({ data }) => {
                setIsDeleting(false)
                setShowConfirmBox({ open: false, data: null });
                setToastConfig({ open: true, message: "Successfully Deleted", type: "success" })
                fetchData()
            })
            .catch(err => {
                setToastConfig(err)
                setIsDeleting(false)
            })
    }




  

    return (
        <>
           

             <CustomAgGrid
                  allowSelection={true}
                  allowAction={true}
                  columns={columns}
                  dataRows={dataRows}
                  frameworkComponents={frameworkComponents}
                  setGridApi={setGridApi}
                  dispatch={dispatch}
                  rowCount={rowCount}
                  limit={limit}
                  pageSizes={pageSizes}
                  page={page}
                  actionWidth={100}
                  loading={gridLoading}
                  renderedFrom="productMasterDetailsPage"
                  refreshGrid={getColumns}
                />


            {showConfirmBox.open && <ConfirmationDialog
                open={true}
                message={`Are you sure you want to delete this product?`}
                okBtnLoading={isDeleting}
                onClose={() => {
                    setShowConfirmBox({ open: false, data: null });
                }}
                onOk={handleRemove}
            />}
        </>
    );
}

export default ProductHierarchy