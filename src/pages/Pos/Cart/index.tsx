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
import Loader from "src/components/Loader";
import CustomDialogFooter from "src/components/CustomDialog/CustomDialogFooter";
import { MdAdd, MdOutlineHorizontalRule } from "react-icons/md";

const AssignCartDialog = ({ handleCloseDialog }) => {
    const toastConfig = useContext(CustomToastContext);
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);

    useEffect(() => {
        fetchCart()
    }, []);

    const fetchCart = () => {
        setLoadingProducts(true);
        axiosInstance().get(`/pos/cart`)
            .then(({ data: { data } }) => {
                setProducts(data)
                setLoadingProducts(false);
            })
            .catch((error) => {
                setLoadingProducts(false);
                toastConfig.setToastConfig(error);
            });
    }

    const handleUpdateCart = (product, operation) => {
        let tempProduct = {
            "_id": product._id,
            "qty": operation === "add" ? parseInt(product?.qty || 0) + 1 : parseInt(product?.qty || 0) - 1,
        }
        axiosInstance().put(`/pos/cart`, tempProduct)
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

    return (<Dialog
        fullWidth
        maxWidth="sm"
        open={true}
        onClose={handleCloseDialog}
        aria-labelledby="assign-roles-dialog"
    >
        <CustomDialogHeader title="Cart" showRequiredLabel={false} onClose={handleCloseDialog} />
        <CustomDialogContent>
            {loadingProducts ? (
                <Loader text="Loading Products" />
            ) : products?.length ? (
                <List style={{ padding: 0 }}>
                    {products.map((product) => (
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
            <Button
                disabled={isAssigning}
                onClick={() => { }}
                color="primary"
                size="small"
                variant="contained"
            >
                {isAssigning ? <CircularProgress size={22} /> : "Place your order"}
            </Button>
        </CustomDialogFooter>
    </Dialog>
    );
};

export default AssignCartDialog;
