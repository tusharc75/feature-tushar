import { useState, Fragment, useContext } from "react";
import { Box, Button, TextField } from "@material-ui/core";
import CustomDialogHeader from "../../../components/CustomDialog/CustomDialogHeader";
import CustomButton from "../../../components/Helpers/CustomButton";
import CustomDialogContent from "../../../components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "../../../components/CustomDialog/CustomDialogFooter";
import {
  CustomDialogTransition
} from "../../../constants/helpers";
import Dialog from "@material-ui/core/Dialog";
import { Formik, Form, Field } from "formik";

const ConsumeProduct = ({ handleClose, type, loading, handleSucess, products }) => {


  const [initialValues, setInitialValues] = useState({
    qty: products?.length ? type === "revert" ? (products[0].consumeQty) : (products[0].qty - products[0].consumeQty - products[0].returnQty) : 0
  });

  function validate(values) {
    const errors = {};
    var qty = products?.length ? type === "revert" ? (products[0].consumeQty) : (products[0].qty - products[0].consumeQty - products[0].returnQty) : 0
    if (!values.qty || values.qty === "") {
      errors['qty'] = 'Please enter qty';
    }
    if (values.qty > qty) {
      errors['qty'] = "Enter a valid qty, make sure it’s not more than ordered qty";
    }
    return errors;
  }


  return (<Dialog
    maxWidth="sm"
    fullWidth
    TransitionComponent={CustomDialogTransition}
    aria-labelledby="customized-dialog-title"
    open={true}
  >
    <CustomDialogHeader
      title={type === "revert" ? "Revert Consumed Qty" : "Consume Qty"}
      showRequiredLabel={false}
      onClose={handleClose}
    />
    <Formik
      initialValues={initialValues}
      onSubmit={handleSucess}
      validate={validate}
    >
      {({ submitForm, touched, errors, setFieldValue, values }) => (
        <Fragment>
          <CustomDialogContent>
            <Box className="my-2">
              <TextField
                variant="outlined"
                type="number"
                onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                label={"Qty"}
                required={true}
                name="qty"
                fullWidth
                margin="dense"
                value={values["qty"]}
                error={touched["qty"] && Boolean(errors["qty"])}
                helperText={touched["qty"] && errors["qty"]}
                onChange={(e) =>
                  setFieldValue("qty", e.target.value)
                }
              />
            </Box>
          </CustomDialogContent>
          <CustomDialogFooter>
            <Button
              size="small"
              variant="outlined"
              onClick={handleClose}
              color="primary">
              Cancel
            </Button>
            <CustomButton
              loading={loading}
              variant="contained"
              color="primary"
              type="button"
              disabled={loading}
              onClick={submitForm}
            >
              Save
            </CustomButton>
          </CustomDialogFooter>
        </Fragment>
      )}
    </Formik>
  </Dialog>
  );
};

export default ConsumeProduct;