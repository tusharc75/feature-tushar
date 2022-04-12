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
    TextField,
    Typography,
} from "@material-ui/core";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "src/axios/axiosInstance";
import CustomDialogHeader from "src/components/CustomDialog/CustomDialogHeader";
import CustomDialogContent from "src/components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "src/components/CustomDialog/CustomDialogFooter";
import { MdAdd, MdOutlineHorizontalRule } from "react-icons/md";

const QuantityDialog = ({ handleCloseDialog, handleAddToCart, product }) => {
    const [productQty, setProductQty] = useState(1)


    return (<Dialog
        fullWidth
        maxWidth="sm"
        open={true}
        onClose={handleCloseDialog}
        aria-labelledby="assign-roles-dialog"
    >
        <CustomDialogHeader title="Add To Cart" showRequiredLabel={false} onClose={handleCloseDialog} />
        <CustomDialogContent>
            <List style={{ padding: 0 }}>
                <ListItem divider key={product._id}>
                    <ListItemAvatar>
                        <Avatar
                            src={product?.productImage}
                            alt={product?.productName ?? ''}
                        />
                    </ListItemAvatar>
                    <ListItemText
                        primary={product?.productName}
                    />
                    <TextField
                        variant="outlined"
                        type="text"
                        required={true}
                        name="qty"
                        margin="dense"
                        value={productQty}
                        onChange={(e) =>
                            setProductQty(parseInt(e.target.value.replace(/[^0-9]/g, '')))
                        }
                    />
                </ListItem>
            </List>
        </CustomDialogContent>
        <CustomDialogFooter>
            <Button
                onClick={() => { handleAddToCart([product], productQty) }}
                color="primary"
                size="small"
                variant="contained"
            >
                {"Add to cart"}
            </Button>
        </CustomDialogFooter>
    </Dialog>
    );
};

export default QuantityDialog;
