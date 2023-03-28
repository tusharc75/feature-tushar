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
import { Formik } from "formik";
import { object, string } from "yup";


const schema = object().shape({
  reason: string().required("Please enter the reason for replacement").min(3, "Too Short"),
});

const ReplaceAssetReason = ({ handleClose, loading, handleSucess }) => {

  const [initialValues, setInitialValues] = useState({ reason: "" });

  return (<Dialog
    maxWidth="sm"
    fullWidth
    TransitionComponent={CustomDialogTransition}
    aria-labelledby="customized-dialog-title"
    open={true}
  >
    <CustomDialogHeader
      title="Do you want to replace?"
      showRequiredLabel={false}
      onClose={handleClose}
    />
    <Formik
      initialValues={initialValues}
      validationSchema={schema}
      onSubmit={handleSucess}
    >
      {({ submitForm, touched, errors, setFieldValue, values }) => (
        <Fragment>
          <CustomDialogContent>
            <Box className="my-2">
              <TextField
                variant="outlined"
                type="text"
                label={`Reason For Replacement`}
                required={true}
                name="reason"
                fullWidth
                multiline
                rows={4}
                margin="dense"
                value={values["reason"]}
                error={touched["reason"] && Boolean(errors["reason"])}
                helperText={touched["reason"] && errors["reason"]}
                onChange={(e) =>
                  setFieldValue("reason", e.target.value)
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

export default ReplaceAssetReason;