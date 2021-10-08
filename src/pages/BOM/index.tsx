import { useState, useEffect } from 'react';
import MaterialTable from 'material-table';
import { Box, Chip } from '@material-ui/core';
import { Link, useParams, useLocation } from 'react-router-dom';
import { materialTableIcons } from '../../constants/helpers';
import axiosInstance from '../../axios/axiosInstance';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import routes from '../../components/Helpers/Routes';

const BOMTable = () => {
  const { id } = useParams();
  const { state } = useLocation()
  const [loadingBOMData, setLoadingBOMData] = useState(false);
  const [productData, setProductData] = useState(null);
  const [customizedRoutes, setCustomizedRoutes] = useState([]);
  const [BOMData, setBOMData] = useState([]);

  const options: any = {
    search: false,
    paging: false,
    sorting: false,
    draggable: false,
    defaultExpanded: true,
    toolbar: false
  };

  const columns = [
    {
      title: 'Product Name',
      field: 'productName',
      render: (rowData: any) => (
        <div style={{ width: 150 }}>
          <Link className="link" to={`/product/detail/${rowData?._id}`}>
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
          <span className="text-truncate">{rowData?.productDetail.longDescription || '- - -'}</span>
        </div>
      )
    },
    {
      title: 'Product Image',
      field: 'productImage',
      render: (rowData: any) => (
        <div style={{ width: 100 }}>
          <span className="text-truncate">{rowData?.productDetail.productImage || '- - -'}</span>
        </div>
      )
    },
    {
      title: 'Product Number',
      field: 'productNumber',
      render: (rowData: any) => (
        <div style={{ width: 100 }}>
          <span className="text-truncate">{rowData?.productDetail.productNumber || '- - -'}</span>
        </div>
      )
    },
    {
      title: 'Standard Price',
      field: 'standardPrice',
      render: (rowData: any) => (
        <div style={{ width: 80 }}>
          <span className="text-truncate">{rowData?.productDetail.mrp || '- - -'}</span>
        </div>
      )
    },
    {
      title: 'Serialized Product',
      field: 'serializedProduct',
      render: (rowData: any) => (
        <div style={{ width: 80 }}>
          <span className="text-truncate">{rowData?.productDetail.serializedProduct ? 'Yes' : 'No'}</span>
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
            style={{ backgroundColor: rowData?.productDetail.productCategory.chipColour }}
            label={rowData?.productDetail.productCategory.optionLabel}
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
      .get(`/product/bom/${id}`)
      .then(({ data: { data } }) => {
        data = data.map((o) => {
          if (o?.parent) {
            o.type = 'child';
          }
          return o;
        });
        setBOMData([...data]);
        setLoadingBOMData(false);
      })
      .catch((err) => {
        setLoadingBOMData(false);
      });
  };

  return (
    <div>
      <div className="headerbox">
        <CustomBreadCrumbs routes={customizedRoutes} />
      </div>
      <div className="main-container">
        {BOMData.length === 1 ? (
          <MaterialTable icons={materialTableIcons} data={BOMData} columns={columns} options={options} />
        ) : (
          <Box margin={1}>
            <MaterialTable
              isLoading={loadingBOMData}
              icons={materialTableIcons}
              data={BOMData}
              columns={columns}
              parentChildData={(row, rows) => {
                return rows.find((a) => a._id === row.parent);
              }}
              options={options}
            />
          </Box>
        )}
      </div>
    </div>
  );
};

export default BOMTable;
