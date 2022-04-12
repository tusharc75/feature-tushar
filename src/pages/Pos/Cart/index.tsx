import { useState, useEffect, useContext } from "react";
import {
    Avatar,
    Button,
    Checkbox,
    CircularProgress,
    Dialog,
    FormControl,
    FormControlLabel,
    Grid,
    IconButton,
    List,
    ListItem,
    ListItemAvatar,
    ListItemIcon,
    ListItemText,
    Typography,
} from "@material-ui/core";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "src/axios/axiosInstance";
import CustomDialogHeader from "src/components/CustomDialog/CustomDialogHeader";
import CustomDialogContent from "src/components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "src/components/CustomDialog/CustomDialogFooter";
import { MdAdd, MdOutlineHorizontalRule } from "react-icons/md";

const AssignCartDialog = ({ handleCloseDialog, fetchCart, products }) => {

    const toastConfig = useContext(CustomToastContext);

    const handleUpdateCart = (product, operation) => {
        let data = {
            "_id": product._id,
            "qty": operation === "add" ? parseInt(product?.qty || 0) + 1 : parseInt(product?.qty || 0) - 1,
        }
        if (data?.qty) {
            axiosInstance().put(`/pos/cart`, data)
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
        else {
            axiosInstance().put(`/pos/cart/remove`, { ids: [data._id] })
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
    
    return (<Dialog
        fullWidth
        maxWidth="sm"
        open={true}
        onClose={handleCloseDialog}
        aria-labelledby="assign-roles-dialog"
    >
        <CustomDialogHeader title="Cart" showRequiredLabel={false} onClose={handleCloseDialog} />
        <CustomDialogContent>
            {products?.length ? (
                <List style={{ padding: 0 }}>
                    {products?.map((product) => (
                        <ListItem divider key={product._id}>
                            <ListItemAvatar>
                                <Avatar
                                    src={product?.product?.productImage}
                                    alt={product?.product?.optionLabel ?? ''}
                                />
                            </ListItemAvatar>
                            <ListItemText
                                primary={product?.product?.optionLabel}
                            />
                            <Button variant="outlined" color="primary" onClick={() => { handleUpdateCart(product, "add") }}>
                                <MdAdd color="primary" fontSize="small" />
                            </Button>
                            <Button color="primary" disabled>
                                {`${product?.qty}`}
                            </Button>
                            <Button variant="outlined" color="primary" onClick={() => { handleUpdateCart(product, "subtract") }}>
                                <MdOutlineHorizontalRule fontSize="small" color="primary" />
                            </Button>
                        </ListItem>
                    ))}
                </List>
            ) : (
                <Typography>No Products</Typography>
            )}
        </CustomDialogContent>
        <CustomDialogFooter>
            {/* {(products?.length > 0) &&
                <Button
                    onClick={() => { }}
                    color="primary"
                    size="small"
                    variant="contained"
                >
                    {"Place your order"}
                </Button>
            } */}
        </CustomDialogFooter>
    </Dialog>
    );
};

export default AssignCartDialog;
