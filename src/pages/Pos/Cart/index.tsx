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
    Box
} from "@material-ui/core";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "src/axios/axiosInstance";
import CustomDialogHeader from "src/components/CustomDialog/CustomDialogHeader";
import CustomDialogContent from "src/components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "src/components/CustomDialog/CustomDialogFooter";
import { MdAdd, MdOutlineHorizontalRule } from "react-icons/md";
import { isMobile, isTablet } from 'react-device-detect';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import AddIcon from '@material-ui/icons/Add';
import RemoveIcon from '@material-ui/icons/Remove';
import { CustomDialogTransition } from "../../../constants/helpers";

const AssignCartDialog = ({ handleCloseDialog, fetchCart, products, handleDeleteCart }) => {

    const toastConfig = useContext(CustomToastContext);
    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

    const handleUpdateCart = (product, operation) => {
        let data = {
            "_id": product._id,
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
        fullScreen={fullScreen || (isMobile || isTablet)}
        maxWidth="sm"
        TransitionComponent={CustomDialogTransition}
        open={true}
        onClose={(e, reason) => {
            if (reason !== 'backdropClick') {
                handleCloseDialog()
            }
        }}
        aria-labelledby="assign-roles-dialog"
    >
        <CustomDialogHeader
            title={`Cart (${products?.length})`}
            showRequiredLabel={false}
            onClose={handleCloseDialog}
            isMinimized={!fullScreen}
            onMinimizeMaximize={() => {
                setFullScreen(prevState => !prevState)
            }}
            showManimizeMaximize={true}
        />
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
                                secondary={`Inventory - ${product?.inventory?.availableInventory}`} />
                            <Box display="flex" flexDirection="row"  >
                                <IconButton
                                    color="secondary"
                                    size="small"
                                    style={{ border: "1px solid" }}
                                    disabled={product?.qty >= product?.inventory?.availableInventory}
                                    onClick={() => { handleUpdateCart(product, "add") }}>
                                    <AddIcon fontSize="small" />
                                </IconButton >
                                <IconButton
                                    disabled
                                    size="small">
                                    <Box pl={1} pr={1}>
                                        {`${product?.qty}`}
                                    </Box>
                                </IconButton>
                                <IconButton
                                    style={{ border: "1px solid" }}
                                    color="secondary"
                                    size="small"
                                    onClick={() => { handleUpdateCart(product, "subtract") }}>
                                    <RemoveIcon fontSize="small" />
                                </IconButton>
                                <Box pl={1}>
                                    <IconButton
                                        style={{ border: "1px solid", color: "red" }}
                                        color="secondary"
                                        size="small"
                                        onClick={() => { handleDeleteCart(product) }}>
                                        <DeleteOutlineIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            </Box>
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
