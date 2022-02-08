import { useState, useEffect, useContext, Fragment, useReducer } from 'react';
import MaterialTable from 'material-table';
import { Avatar, Box, Chip,Grid,Button} from '@material-ui/core';
import { Link, useParams, useLocation } from 'react-router-dom';
import { materialTableIcons, product } from '../../constants/helpers';
import axiosInstance from '../../axios/axiosInstance';
import styles from '../Leads/Header.module.scss';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import routes from '../../components/Helpers/Routes';
import {GiLetterBomb} from "react-icons/gi";
import {MdAdd} from "react-icons/md"
import { isMobile, isTablet } from 'react-device-detect';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import SearchBox from '../../components/Helpers/SearchBox';
import { Delete } from '@material-ui/icons';
import {IconButton,Tooltip} from "@material-ui/core"
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import { CommonRenderer, CreatedByRenderer, UpdatedByRenderer } from '../../components/AgGridComponents/CustomAgGridCellRenderers';

import ConfirmationDialogRaw from '../../components/Helpers/ConfirmationDialog';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';

const BOMTable = () => {
  const { id } = useParams();

  const {setToastConfig} = useContext(CustomToastContext);
  const [loadingBOMData, setLoadingBOMData] = useState(false);
  const [productData, setProductData] = useState(null);
  const [customizedRoutes, setCustomizedRoutes] = useState([]);
  const [BOMData, setBOMData] = useState([]);
  const [showConfirmBox, setShowConfirmBox] = useState({open: false, data: null})
  const [isDeleting, setIsDeleting] = useState(false);
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const [columns, setColumns] = useState([]);
  const { dataRows, rowCount, loading: gridLoading, page,  pageSizes, search, filters, sorting, selectedRecords,limit } = state;




 

  useEffect(() => {
    if (id) {
      fetchBOMData();
      fetchProduct()
    }
  }, []);

  useEffect(()=>{
    if(BOMData){
      getColumns();
    }
    
  },[BOMData])
  

  const fetchProduct = () => {
    axiosInstance().get(`${routes.product.path}/` + id)
      .then(({ data: { data } }) => {
        const { productData } = data;
        setProductData(productData);
        setCustomizedRoutes([
          { title: "Product Master", path: routes.product.path },
          { title: productData?.productName, path: `${routes.productDetail.path}/${id}` },
          { title: 'BOM' }
        ]);
      })
  }

  const fetchBOMData = () => {
    setLoadingBOMData(true);
    axiosInstance()
      .get(`/product/${id}/bom`)
      .then(({ data: { data } }) => {
        data = data.map((o) => {
          return {
            ...o, 
            productName: o.childProductDetail.productName, 
            productId: o.childProductDetail._id
          };
        });
        setBOMData([...data]);
        setLoadingBOMData(false);
      })
      .catch((err) => {
        setLoadingBOMData(false);
      });
  };

  const handleRemove = () => {
    setIsDeleting(true)
    const {data} = showConfirmBox
    axiosInstance().put(`${product .api}/${data.productId}/bom/remove`, {
        ids: [data._id]
    })
    .then(({data}) => {
        setIsDeleting(false)
        setToastConfig({open:true, message: "Successfully Deleted", type:"success"})
        setShowConfirmBox({open: false, data: null});
        fetchBOMData()
    })
    .catch(err => {
        setToastConfig(err)
        setIsDeleting(false)
    })
}



const getColumns = () => {
  if (gridApi) {
      gridApi.setRowData([]);
    }
    dispatch({ type: 'loading', loading: true });
    let newColumns = [];
    let rowsData = [];

    if(BOMData){
      
       rowsData = BOMData ?  BOMData.map((p)=>({
         
            ...p,
            productName: p?.productName, 
            qty:p?.qty,
            productCategory: p?.childProductDetail?.productCategory?.optionLabel,
            createdBy: p?.createdBy?.user?.concatedName
        }))
        :[];

        newColumns=[
          { field: 'productName', headerName: 'Product Description', show: true, cellRenderer: 'productNameRenderer' },
          { field: 'qty', headerName: 'Quantity', show: true, disabled: false, cellRenderer: 'commonRenderer' },
          { field: 'productCategory', headerName: 'ProductCategory', show: true, disabled: false, cellRenderer: 'commonRenderer' },
          { field: 'createdBy', headerName: 'createdBy', show: true, disabled: false, cellRenderer: 'CreatedByRenderer' },

          
          
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



  return (
    <div>
      <div className="headerbox">
        <CustomBreadCrumbs routes={customizedRoutes} />
      </div>
      <div className="main-container">
      <div className="header-panel">
      <Grid className={styles.filter_side_container} container justify="space-between">
      <Grid item xs={12} md={6} sm={12} className={isMobile ? styles.mobile_panel : "d-flex align-items-center gap-1"}>
      <div className="d-flex align-items-center">  
                <GiLetterBomb className="headerLogo" />
                <span className="listingHeader">Bom</span>
                </div>
               

      </Grid>
      <Grid className={styles.filter_side} item md={6} sm={12} xs={12}>
                <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">
                  <SearchBox
                    onSearch={'condo'}
                    searchbox={styles.search_box_input}
                    value={search}
                    size="small"
                    placeholder="Search Bom"
                    width="242px"
                    style={isMobile ? { flex: 1 } : {}}
                  />
                  
                  <Grid style={{ display: 'flex', gap: '5px' }}>
                  <>
                    <Button
                      variant={isMobile && !isTablet ? 'text' : 'contained'}
                      color="primary"
                      size="small"
                      startIcon={isMobile && !isTablet ? null : <AddOutlined />}
                      className={isMobile && !isTablet ? 'mobile_button' : styles.add_submit_btn}
                      onClick={() => {
                        "condo"
                        // setShowManageBudgetDialog({ show: true, id: null, isClone: false });
                      }}
                    >
                      {isMobile && !isTablet ? <MdAdd size={23} /> : 'Add'}
                    </Button>
                  </>

                  <>
                    <Button
                      variant={isMobile && !isTablet ? 'text' : 'outlined'}
                      color="default"
                      size="small"
                      className={isMobile && !isTablet ? 'mobile_button' : `${styles.add_submit_btn} ${styles.action_new_submit_btn}`}
                      // onClick={"condo"}
                      disabled={selectedRecords.length ? false : true}
                      aria-controls="action-menu"
                    >
                      {isMobile && !isTablet ? '' : 'Actions'} <ExpandMore />
                    </Button>

                    {/* <Menu
                      anchorEl={anchorEl}
                      keepMounted
                      getContentAnchorEl={null}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left'
                      }}
                      id="action-menu"
                      open={Boolean(anchorEl)}
                      onClose={closeActions}
                    >
                      <MenuItem onClick={() => setShowDeleteConfirmBox(true)}>Delete</MenuItem>
                    </Menu> */}
                    
                  </>
                  </Grid>
                </Box>
              </Grid>

      </Grid>
      </div>
      <Box component="div">
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
                actionWidth={100}
                loading={gridLoading}
                renderedFrom={routes.productDetail.title}
                refreshGrid={fetchBOMData}
              />
      </Box>
      </div>
      {showConfirmBox.open &&  <ConfirmationDialogRaw
              open={true}
              message={`Are you sure you want to delete this product?`}
              okBtnLoading={isDeleting}
              onClose={() => {
                setShowConfirmBox({open: false, data: null});
              }}
              onOk={handleRemove}
            />}
    </div>
  );
};

export default BOMTable;
