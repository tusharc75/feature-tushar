import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import { Box, Button, IconButton } from '@mui/material';
import { Fragment, useContext, useEffect, useState } from 'react';
import { MdAddShoppingCart } from 'react-icons/md';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import QuantityDialog from './index';

const QtyButton = ({ cart, fetchCart, product, warehouse, onSucess }) => {
  const toastConfig = useContext(CustomToastContext);
  const [qtyDialog, setQtyDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cartProduct, setCartProduct] = useState(null);

  useEffect(() => {
    if (cart?.find((d) => d.product.optionValue === product?._id)) {
      setCartProduct(cart?.find((d) => d.product.optionValue === product?._id));
    } else {
      setCartProduct(null);
    }
  }, [cart]);

  const handleAddToPickup = (product, qty = null) => {
    if (product?.length === 1) {
      let data = [
        {
          product: product[0]._id,
          qty: parseInt(qty || 1),
          warehouse: warehouse
        }
      ];
      setLoading(true);
      axiosInstance()
        .post(`/pos/cart`, data)
        .then(({ data }) => {
          setLoading(false);
          setQtyDialog(false);
          fetchCart();
          onSucess();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleUpdateCart = (operation) => {
    let data = {
      _id: cartProduct?._id,
      qty: operation === 'add' ? parseInt(cartProduct?.qty || 0) + 1 : parseInt(cartProduct?.qty || 0) - 1
    };
    if (data?.qty) {
      axiosInstance()
        .put(`/pos/cart`, data)
        .then(({ data }) => {
          fetchCart();
          onSucess();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    } else {
      axiosInstance()
        .put(`/pos/cart/remove`, { ids: [cartProduct?._id] })
        .then(({ data }) => {
          fetchCart();
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleDeleteCart = () => {
    axiosInstance()
      .put(`/pos/cart/remove`, { ids: [cartProduct?._id] })
      .then(({ data }) => {
        fetchCart();
        onSucess();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Fragment>
      {cartProduct ? (
        <Box>
          {/* <IconButton
                    color="secondary"
                    size="small"
                    style={{ border: "1px solid" }}
                    disabled={cartProduct?.qty >= product?.availableInventory}
                    onClick={() => { handleUpdateCart("add") }}>
                    <AddIcon fontSize="small" />
                </IconButton > */}
          <IconButton disabled size="small">
            <Box pl={1} pr={1}>
              {`${cartProduct?.qty}`}
            </Box>
          </IconButton>
          {/* <IconButton
                    style={{ border: "1px solid" }}
                    color="secondary"
                    size="small"
                    onClick={() => { handleUpdateCart("subtract") }}>
                    <RemoveIcon fontSize="small" />
                </IconButton> */}
          <IconButton
            className="ml-3"
            style={{ border: '1px solid', color: 'red' }}
            color="secondary"
            size="small"
            onClick={() => {
              handleDeleteCart();
            }}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Box>
      ) : (
        <Button
          variant="outlined"
          size="small"
          disabled={!product?.availableInventory}
          aria-label="Add to cart"
          onClick={() => {
            setQtyDialog(true);
          }}
          color={product?.availableInventory ? 'secondary' : 'inherit'}
          startIcon={<MdAddShoppingCart />}
        >
          Add to cart
        </Button>
      )}
      {qtyDialog ? (
        <QuantityDialog
          handleAddToPickup={handleAddToPickup}
          product={product}
          handleCloseDialog={() => {
            setQtyDialog(false);
          }}
          cartQty={cartProduct?.qty}
          loading={loading}
        />
      ) : null}
    </Fragment>
  );
};

export default QtyButton;
