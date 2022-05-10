import { Fragment, useState, useEffect, useContext } from "react";
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
import { Formik, Form, Field } from 'formik';
import { TextField as TextFieldFormik, Select } from 'formik-material-ui';
import CustomButton from 'src/components/Helpers/CustomButton';

const QuantityDialog = ({ handleCloseDialog, handleAddToPickup, product, cartQty = 0, loading }) => {

    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

    const handleSubmit = (values) => {
        handleAddToPickup([product], parseInt(values?.qty))
    }

    function validate(values) {
        const errors = {};
        if (values.qty <= 0) {
            errors["qty"] = "Please enter valid qty"
        }
        if (parseInt(values.qty) > (product?.availableInventory)) {
            errors["qty"] = "qty not more than inventory"
        }
        return errors;
    }

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
        <Formik initialValues={{ qty: 1 }} onSubmit={handleSubmit} validateOnMount validate={validate}>
            {({ submitForm, touched, errors, setFieldValue, values }) => (
                <Form autoComplete="off" autoCorrect="off" noValidate>
                    <CustomDialogHeader
                        title="Add To Pickup"
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
                                <ListItemText
                                    primary={product?.productName}
                                    secondary={`Inventory - ${product?.availableInventory}`}
                                />
                                {product?.availableInventory ?
                                    <Field
                                        component={TextFieldFormik}
                                        margin="dense"
                                        type="number"
                                        label="Qty"
                                        name="qty"
                                        variant="outlined"
                                        value={values['qty']}
                                        error={touched['qty'] && Boolean(errors['qty'])}
                                        helperText={touched['qty'] && errors['qty']}
                                        onChange={(e) => {
                                            setFieldValue('qty', e.target.value);
                                        }}
                                    />
                                    :
                                    <span>No inventory</span>
                                }
                            </ListItem>
                        </List>
                    </CustomDialogContent>
                    <CustomDialogFooter>
                        {product?.availableInventory &&
                            <CustomButton
                                loading={loading}
                                disabled={loading}
                                variant="contained"
                                color="primary"
                                type="submit"
                                onClick={submitForm}>
                                Add to Pickup
                            </CustomButton>
                        }
                    </CustomDialogFooter>
                </Form>
            )}
        </Formik>
    </Dialog>
    );
};

export default QuantityDialog;
