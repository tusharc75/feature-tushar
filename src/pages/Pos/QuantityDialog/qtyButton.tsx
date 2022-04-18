import { Fragment, useState, useEffect, useContext } from "react";
import { Button } from "@material-ui/core";
import { Box, Grid, makeStyles, Paper, IconButton } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import RemoveIcon from '@material-ui/icons/Remove';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import { MdAddShoppingCart } from 'react-icons/md';
import axiosInstance from "src/axios/axiosInstance";
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import QuantityDialog from "./index";


const QtyButton = ({ cart, fetchCart, product, warehouse }) => {

    const toastConfig = useContext(CustomToastContext);
    const [qtyDialog, setQtyDialog] = useState(false)
    const [cartQty, setCartQty] = useState(0)

    useEffect(() => {
        if (cart?.find(d => d.product.optionValue === product?._id)) {
            setCartQty(cart?.find(d => d.product.optionValue === product?._id)?.qty)
        }
        else {
            setCartQty(0)
        }
    }, [cart]);

    const handleAddToCart = (product, qty = null) => {
        if (product?.length === 1) {
            let data = [{
                "product": product[0]._id,
                "qty": parseInt(qty || 1),
                "warehouse": warehouse
            }]
            axiosInstance().post(`/pos/cart`, data)
                .then(({ data }) => {
                    setQtyDialog(false)
                    fetchCart()
                }).catch((error) => {
                    toastConfig.setToastConfig(error)
                });
        }
    }

    const handleUpdateCart = (operation) => {
        let data = {
            "_id": product?._id,
            "qty": operation === "add" ? parseInt(product?.qty || 0) + 1 : parseInt(product?.qty || 0) - 1,
        }
        if (data?.qty) {
            axiosInstance().put(`/pos/cart`, data)
                .then(({ data }) => {
                    fetchCart()
                }).catch((error) => {
                    toastConfig.setToastConfig(error)
                });
        }
        else {
            axiosInstance().put(`/pos/cart/remove`, { ids: [product?._id] })
                .then(({ data }) => {
                    fetchCart()
                    toastConfig.setToastConfig({
                        open: true,
                        type: 'success',
                        message: data.message
                    });
                }).catch((error) => {
                    toastConfig.setToastConfig(error)
                });
        }
    };

    const handleDeleteCart = () => {
        axiosInstance().put(`/pos/cart/remove`, { ids: [product?._id] })
            .then(({ data }) => {
                fetchCart()
                toastConfig.setToastConfig({
                    open: true,
                    type: 'success',
                    message: data.message
                });
            }).catch((error) => {
                toastConfig.setToastConfig(error)
            });
    };

    return (<Fragment>
        {cartQty ?
            <Box>
                <IconButton
                    color="secondary"
                    size="small"
                    style={{ border: "1px solid" }}
                    disabled={cartQty >= product?.inventory}
                    onClick={() => { handleUpdateCart("add") }}>
                    <AddIcon fontSize="small" />
                </IconButton >
                <IconButton
                    disabled
                    size="small">
                    <Box pl={1} pr={1}>
                        {`${cartQty}`}
                    </Box>
                </IconButton>
                <IconButton
                    style={{ border: "1px solid" }}
                    color="secondary"
                    size="small"
                    onClick={() => { handleUpdateCart("subtract") }}>
                    <RemoveIcon fontSize="small" />
                </IconButton>
                <IconButton
                    className="ml-3"
                    style={{ border: "1px solid", color: "red" }}
                    color="secondary"
                    size="small"
                    onClick={() => { handleDeleteCart() }}>
                    <DeleteOutlineIcon fontSize="small" />
                </IconButton>
            </Box>
            : <Button
                variant="outlined"
                size="small"
                disabled={!product?.inventory}
                aria-label="Add to cart"
                onClick={() => {
                    setQtyDialog(true)
                }}
                color={product?.inventory ? "secondary" : "inherit"}
                startIcon={<MdAddShoppingCart />}
            >
                Add to cart
            </Button>
        }
        {qtyDialog &&
            <QuantityDialog
                handleAddToCart={handleAddToCart}
                product={product}
                handleCloseDialog={() => { setQtyDialog(false) }}
                cartQty={cartQty}
                loading={false}
            />
        }
    </Fragment>
    );
};

export default QtyButton;
