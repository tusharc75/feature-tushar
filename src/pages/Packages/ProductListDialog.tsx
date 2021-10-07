import { useState, useEffect } from 'react';
import { Dialog, Button, Box } from '@material-ui/core';

import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import axiosInstance from '../../axios/axiosInstance';
import ProductsTable from './ProductsTable';
import { packages } from '../../constants/helpers';

const ProductListDialog = ({ id, onClose, toastConfig }) => {
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    (() => {
      if (id) {
        setLoadingProducts(true);
        axiosInstance()
          .get(`${packages.packageApi}/get-products/${id}`)
          .then(({ data: { data } }) => {
            const newArr = data.length > 0 ? data.map((product: any) => ({ product: product.productId, qty: product.qty })) : [];
            setProducts(newArr);
            setLoadingProducts(false);
          })
          .catch((err) => {
            toastConfig.setToastConfig(err);
            setLoadingProducts(false);
          });
      }
    })();
  }, [id]);

  return (
    <Dialog open fullWidth maxWidth="md" onClose={onClose}>
      <CustomDialogHeader title="Products" onClose={onClose} />
      <CustomDialogContent>
        <Box p={2}>
          <ProductsTable products={products} loading={loadingProducts} />
        </Box>
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button onClick={onClose} variant="contained" color="primary">
          Close
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default ProductListDialog;
