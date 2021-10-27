import React, { useEffect, useState, useContext, useCallback } from "react";
import {
  Dialog,
  Button,
  CircularProgress,
  Grid,
  useTheme,
  useMediaQuery,
} from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import { Formik, Form } from "formik";
import axiosInstance from "../../axios/axiosInstance";
import CustomDialogHeader from "../../components/CustomDialog/CustomDialogHeader";
import CustomDialogContent from "../../components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "../../components/CustomDialog/CustomDialogFooter";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import InputField from "../../components/Helpers/InputField";
import { getObjKeys, yupSchema, isFieldNotTouched } from "../../constants/helpers";
import { useLocation, useHistory } from "react-router-dom";
import ConfirmCancelDialog from "../../components/ConfirmCancelDialog"
import { isMobile , isTablet } from 'react-device-detect';
interface InitialData {
  fields: any[];
  values: object;
}

const CreateUser = ({ open, close, fetchData }) => {
  const { setToastConfig } = useContext(CustomToastContext);
  const theme = useTheme();
  const [isSubmitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState<InitialData>({
    fields: [],
    values: {},
  });
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const location = useLocation();
  const history = useHistory();
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const getInitialData = useCallback(() => {
    setLoading(true);
    axiosInstance()
      .get("/field?resource=User")
      .then(({ data: { data } }) => {
        const fieldsData = data.map((d: any) => d.fieldData);
        setInitialData({
          fields: fieldsData,
          values: getObjKeys("", fieldsData),
        });
        setLoading(false);
      })
      .catch((err) => {
        setToastConfig(err);
        setLoading(false);
      });
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    getInitialData();
  }, [getInitialData]);



  const handleSubmit = (values) => {
    setSubmitting(true);
    axiosInstance()
      .post("/user", values)
      .then(({ data }) => {
        const newId = data.data[0]._id;
        setToastConfig({
          open: true,
          type: "success",
          message: data.message,
        });
        setSubmitting(false);
        fetchData();
        history.push({
          pathname: `/user/detail/${newId}`,
          state: { location: location }
        });
        close();
      })
      .catch((error) => {
        setToastConfig(error);
        setSubmitting(false);
      });

  };

  return (
    <Dialog
      open={open}
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen || (isMobile || isTablet)}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true)
        }
      }}
    >
      <CustomDialogHeader title="CCCreate New User"
        onClose={() => {
          setShowConfirmDialog(true)
        }}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen(prevState => !prevState)
        }}
        showManimizeMaximize={true}
      />

      {loading || !initialData.fields.length ? (
        <>
          <CustomDialogContent>
            <Skeleton width="100%" height="70px" />
            <Grid container spacing={2}>
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <Grid key={i} item xs={12} sm={6} md={6}>
                  <Skeleton width="100%" height="60px" />
                </Grid>
              ))}
            </Grid>
          </CustomDialogContent>
          <CustomDialogFooter>
            <Button variant="outlined" size="small" color="primary" disabled={loading}>
              Cancel
            </Button>
            <Button variant="contained" size="small" color="primary" disabled={loading}>
              Submit
            </Button>
          </CustomDialogFooter>
        </>
      ) : (
        <Formik
          initialValues={initialData.values}
          validationSchema={yupSchema(initialData.fields)}
          onSubmit={handleSubmit}
        >
          {({ values, errors, setFieldValue, touched, submitForm }) => (
            <>
              <CustomDialogContent>
                <Form noValidate>
                  <InputField
                    errors={errors}
                    values={values}
                    setFieldValue={setFieldValue}
                    touched={touched}
                    fieldsData={initialData.fields}
                    size="small"
                    fullWidth
                    onImageUploadCompletePercentage={setUploadingImageOrFileProgress}
                  />
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  disabled={isSubmitting || loading}
                  onClick={() => {
                    if (isFieldNotTouched(initialData, values)) close()
                    else setShowConfirmDialog(true)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={submitForm}
                  disabled={isSubmitting || loading || uploadingImageOrFileProgress > 0}
                >
                  {isSubmitting ? <CircularProgress size={22} /> : "Submit"}
                </Button>
              </CustomDialogFooter>
              {
                showConfirmDialog ?
                  <ConfirmCancelDialog
                    open={showConfirmDialog}
                    onSave={() => {
                      setShowConfirmDialog(false)
                      submitForm();
                    }}
                    onClose={() => {
                      setShowConfirmDialog(false)
                      close()
                    }}
                  /> : null
              }
            </>
          )}
        </Formik>
      )}
    </Dialog>
  );
};

export default CreateUser;
