import { useEffect, useState, useContext } from "react";
import {
  Dialog,
  Button,
  CircularProgress,
  Grid,
  useTheme,
  useMediaQuery,
  Box,
} from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import { Formik, Form } from "formik";
import axiosInstance from "../../axios/axiosInstance";
import CustomDialogHeader from "../../components/CustomDialog/CustomDialogHeader";
import CustomDialogContent from "../../components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "../../components/CustomDialog/CustomDialogFooter";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { useHistory } from "react-router-dom";
import { getObjKeys, yupSchema, isFieldNotTouched, setFieldsInAscendingOrder, getObjKeysWithValues } from "../../constants/helpers";
import ConfirmCancelDialog from "../../components/ConfirmCancelDialog"
import FormTypes from "../../components/Helpers/FormTypes";

interface InitialData {
  fields: any[];
  values: object;
}

const ManageEntity = ({ open, close, fetchData, isNew, values = {} }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("xs"));
  const [isSubmitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState<InitialData>({
    fields: [],
    values: values,
  });

  //  Owner, Collaborator Code - Start
  const [formsData, setFormsData] = useState([]);
  const [parentEntityDataSource, setParentEntityDataSource] = useState([]);

  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);

  useEffect(() => {
    getInitialData();
  }, []);

  useEffect(() => {

    const parentEntityDropdownData = initialData.fields.find(
      (d) => d.fieldName === "parentEntity" || d.fieldName === "parent"
    );
    if (parentEntityDropdownData) {
      setParentEntityDataSource(
        isNew
          ? parentEntityDropdownData.option
          : parentEntityDropdownData.option.filter(
            (d) => d?.optionValue !== values["_id"]
          )
      );
    }

    setFormsData(setFieldsInAscendingOrder(initialData.fields));

  }, [initialData.fields]);


  const getInitialData = () => {
    setLoading(true);
    axiosInstance()
      .get("/field?resource=Entity")
      .then(({ data: { data } }) => {

        const fieldsData = isNew ? data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData)
          : data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

        setInitialData({
          fields: fieldsData,
          values: isNew ? getObjKeys("", fieldsData) : getObjKeysWithValues(values, fieldsData),
        });
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
      });
  };

  const handleSubmit = (enteredValues) => {
    setSubmitting(true);

    if (isNew) {
      axiosInstance()
        .post("/entity", enteredValues)
        .then(({ data }) => {
          const newId = data.data._id;
          setSubmitting(false);
          fetchData();
          toastConfig.setToastConfig({
            type: "success",
            open: true,
            message: data.message
          })
          history.push(`/entity/detail/${newId}`);
          close();
        })
        .catch((err) => {
          setSubmitting(false);
          toastConfig.setToastConfig(err)
        });
    }
    else {
      const { createdBy, updatedBy, ...rest } = enteredValues;
      axiosInstance()
        .put(`/entity`, { _id: values["_id"], ...rest })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: data.message,
          });
          setSubmitting(false);
          fetchData();
        })
        .catch((error) => {
          setSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true)
        }
      }}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
    >
      <CustomDialogHeader title={isNew ? "Create New Entities" : "Update Entity"}
        onClose={() => setShowConfirmDialog(true)} />

      {loading || !initialData.fields.length ? (
        <>
          <CustomDialogContent>
            <Skeleton width="100%" height="70px" />
            <Grid container spacing={2}>
              {[1, 2, 3].map((i) => (
                <Grid key={i} item xs={12} sm={6} md={6}>
                  <Skeleton width="100%" height="60px" />
                </Grid>
              ))}
            </Grid>
          </CustomDialogContent>
          <CustomDialogFooter>
            <Button size="small" variant="outlined" color="primary" disabled>
              Cancel
            </Button>
            <Button size="small" variant="contained" color="primary" disabled>
              {isNew ? "Submit" : "Update"}
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
                  <h2 className="form-label-style" style={{ borderBottom: "none" }}>* Required Fields</h2>
                  {
                    formsData &&
                    formsData.map((form, i) => (
                      <div key={i}>
                        <h2 className="form-label-style">{form.name}</h2>
                        <Box marginY={2}>
                          <Grid spacing={3} container>
                            {form.sectionFields.map((field, index2) => (
                              <Grid key={index2} item xs={12} sm={6} md={6}>
                                {
                                  (field.fieldName === "parent" || field.fieldName === "parentEntity") ? (
                                    <FormTypes
                                      isNew={isNew}
                                      {...field}
                                      values={values}
                                      errors={errors}
                                      touched={touched}
                                      label={field.fieldLabel}
                                      name={field.fieldName}
                                      type={field.type}
                                      options={parentEntityDataSource}
                                      setFieldValue={setFieldValue}
                                      required={field.required}
                                      fullWidth
                                      isTooltip={field?.isTooltip || false}
                                      tooltipMessage={field?.tooltipMessage}
                                      size="small"
                                    />
                                  ) : (
                                    <FormTypes
                                      isNew={isNew}
                                      {...field}
                                      values={values}
                                      errors={errors}
                                      touched={touched}
                                      label={field.fieldLabel}
                                      name={field.fieldName}
                                      type={field.type}
                                      options={field.option}
                                      setFieldValue={setFieldValue}
                                      required={field.required}
                                      fullWidth
                                      isTooltip={field?.isTooltip || false}
                                      tooltipMessage={field?.tooltipMessage}
                                      size="small"
                                      imageOrFileUploadCompletePercentage={
                                        ["imageUpload", "fileUpload"].some(
                                          (s) => s === field.type
                                        )
                                          ? (completePercentage) => {
                                            setUploadingImageOrFileProgress(
                                              completePercentage
                                            );
                                          }
                                          : null
                                      }
                                    />
                                  )}
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      </div>
                    ))
                  }
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

export default ManageEntity;
