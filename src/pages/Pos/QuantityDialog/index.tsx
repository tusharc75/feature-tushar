import { useState, useEffect, useContext } from "react";
import {
    Avatar, Button, Dialog, List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    TextField,
} from "@material-ui/core";
import CustomDialogHeader from "src/components/CustomDialog/CustomDialogHeader";
import CustomDialogContent from "src/components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "src/components/CustomDialog/CustomDialogFooter";
import { isMobile, isTablet } from 'react-device-detect';

const QuantityDialog = ({ handleCloseDialog, handleAddToCart, product }) => {

    const [productQty, setProductQty] = useState(1)
    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

    return (<Dialog
        fullWidth
        maxWidth="sm"
        open={true}
        fullScreen={fullScreen || (isMobile || isTablet)}
        onClose={(e, reason) => {
            if (reason !== 'backdropClick') {
                handleCloseDialog()
            }
        }}
        aria-labelledby="assign-roles-dialog"
    >
        <CustomDialogHeader
            title="Add To Cart"
            showRequiredLabel={true}
            onClose={handleCloseDialog}
            isMinimized={!fullScreen}
            onMinimizeMaximize={() => {
                setFullScreen(prevState => !prevState)
            }}
            showManimizeMaximize={true}
        />
        <CustomDialogContent>
            <List style={{ padding: 0 }}>
                <ListItem divider key={product?._id}>
                    <ListItemAvatar>
                        <Avatar
                            src={product?.productImage}
                            alt={product?.productName ?? ''}
                        />
                    </ListItemAvatar>
                    <ListItemText primary={product?.productName} />
                    <TextField
                        label="Qty"
                        variant="outlined"
                        type="number"
                        required={true}
                        name="qty"
                        margin="dense"
                        value={productQty}
                        onChange={(e) =>
                            setProductQty(parseInt(e.target.value))
                        }
                    />
                </ListItem>
            </List>
        </CustomDialogContent>
        <CustomDialogFooter>
            <Button
                onClick={() => {
                    if (productQty) {
                        handleAddToCart([product], productQty)
                    }
                }}
                color="primary"
                size="small"
                variant="contained"
                disabled={productQty > 0 ? false : true}
            >
                Add to cart
            </Button>
        </CustomDialogFooter>
    </Dialog>
    );
};

export default QuantityDialog;
