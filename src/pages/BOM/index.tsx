import { useState, useEffect, useContext } from 'react';
import MaterialTable from 'material-table';
import { Avatar, Box, Chip } from '@material-ui/core';
import { Link, useParams, useLocation } from 'react-router-dom';
import { materialTableIcons, product } from '../../constants/helpers';
import axiosInstance from '../../axios/axiosInstance';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import routes from '../../components/Helpers/Routes';
import ConfirmationDialogRaw from '../../components/Helpers/ConfirmationDialog';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';

const BOMTable = () => {
  const { id } = useParams();
  const { state } = useLocation()
  const {setToastConfig} = useContext(CustomToastContext);
  const [loadingBOMData, setLoadingBOMData] = useState(false);
  const [productData, setProductData] = useState(null);
  const [customizedRoutes, setCustomizedRoutes] = useState([]);
  const [BOMData, setBOMData] = useState([]);
  const [showConfirmBox, setShowConfirmBox] = useState({open: false, data: null})
  const [isDeleting, setIsDeleting] = useState(false)

  const options: any = {
    search: true,
    paging: false,
    sorting: false,
    draggable: false,
    defaultExpanded: true,
    toolbar: false
  };

  const columns = [
    {
      title: 'Product Description',
      field: 'productName',
      render: (rowData: any) => (
        <div style={{ width: 150 }}>
          <Link className="link" to={`/product/detail/${rowData?.productId}`}>
            {rowData?.productName || '- - -'}
          </Link>
        </div>
      )
    },
    {
      title: 'Description',
      field: 'description',
      render: (rowData: any) => (
        <div style={{ width: 250 }}>
          <span className="text-truncate">{rowData?.childProductDetail.longDescription || '- - -'}</span>
        </div>
      )
    },
    {
      title: 'Product Image',
      field: 'productImage',
      render: (rowData: any) => (
        <div style={{ width: 100 }}>
          <span className="text-truncate"><Avatar src={rowData?.childProductDetail.productImage}>
              {rowData?.productName.charAt(0)}
            </Avatar></span>
        </div>
      )
    },
    {
      title: 'Product Number',
      field: 'productNumber',
      render: (rowData: any) => (
        <div style={{ width: 100 }}>
          <span className="text-truncate">{rowData?.childProductDetail.productNumber || '- - -'}</span>
        </div>
      )
    },
    {
      title: 'Standard Price',
      field: 'standardPrice',
      render: (rowData: any) => (
        <div style={{ width: 80 }}>
          <span className="text-truncate">{rowData?.childProductDetail.mrp || '- - -'}</span>
        </div>
      )
    },
    {
      title: 'Serialized Product',
      field: 'serializedProduct',
      render: (rowData: any) => (
        <div style={{ width: 80 }}>
          <span className="text-truncate">{rowData?.childProductDetail.serializedProduct ? 'Yes' : 'No'}</span>
        </div>
      )
    },
    {
      title: 'Product Category',
      field: 'productCategory',
      render: (rowData: any) => (
        <div style={{ width: 80 }}>
          <Chip
            className="ml-3"
            style={{ backgroundColor: rowData?.childProductDetail.productCategory.chipColour }}
            label={rowData?.childProductDetail.productCategory.optionLabel}
          />
        </div>
      )
    }
  ];

  useEffect(() => {
    if (id) {
      fetchBOMData();
      fetchProduct()
    }
  }, []);

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

  return (
    <div>
      <div className="headerbox">
        <CustomBreadCrumbs routes={customizedRoutes} />
      </div>
      <div className="main-container">
        {BOMData.length === 1 ? (
          <MaterialTable style={{height: "calc(100vh - 105px)"}} title={"Parts"} icons={materialTableIcons} data={BOMData} columns={columns}
            options={{
              search: true,
              filtering: true,
            }} />
        ) : (
          <Box margin={1} height={"calc(100vh - 105px)"}>
            <MaterialTable
              title={"Parts"}
              isLoading={loadingBOMData}
              icons={materialTableIcons}
              data={BOMData}
              columns={columns}
              // parentChildData={(row, rows) => {
              //   return rows.find((a) => a.treeId  === row.parent);
              // }}
              actions={ [{
                icon: "delete",
                tooltip: "Delete product",
                onClick: (_, rowData) => setShowConfirmBox({open: true, data: rowData})                      
            }]}
              style={{height: "100%"}}
              options={{
                search: true,
                filtering: true,
                actionsColumnIndex: -1,
              }}
            // options={options}
            />
          </Box>
        )}
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
