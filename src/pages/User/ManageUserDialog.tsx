import React, { useEffect, useState, useContext, useCallback } from "react";
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
import {
  getObjKeys,
  yupSchema,
  getObjKeysWithValues,
  setFieldsInAscendingOrder,
  isFieldNotTouched
} from "../../constants/helpers";
import { useLocation, useHistory } from "react-router-dom";
import FormTypes from "../../components/Helpers/FormTypes";
import ConfirmCancelDialog from "../../components/ConfirmCancelDialog"

interface InitialData {
  fields: any[];
  values: object;
}

export default function ManageUserDialog({
  open,
  close,
  onSuccess,
  isNew,
  userId = null,
  dataToUpdate,
  redirectToDetailsScreen = true,
}) {
  const { setToastConfig } = useContext(CustomToastContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("xs"));
  const [isSubmitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState<InitialData>({
    fields: [],
    values: dataToUpdate ? dataToUpdate : {},
  });
  const location = useLocation();
  const history = useHistory();
  const [formsData, setFormsData] = useState([]);
  const [reportsToDataSource, setReportsToDataSource] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] =
    useState(0);
  const [formValues, setFormValues] = useState(dataToUpdate ? dataToUpdate : {})

  const getInitialData = useCallback(() => {
    setLoading(true);
    axiosInstance()
      .get("/field?resource=User")
      .then(({ data: { data } }) => {
        const newFields = [];

        data
          .filter((d) => (isNew ? d.isCreate : d.isUpdate))
          .map((_f) => newFields.push(_f.fieldData));

        setInitialData({
          fields: newFields,
          values: isNew
            ? getObjKeys("", newFields)
            : getObjKeysWithValues(dataToUpdate, newFields),
        });
        setFormValues(isNew ? getObjKeys("", newFields) : getObjKeysWithValues(dataToUpdate, newFields))

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

  useEffect(() => {
    if (initialData.fields.length > 0) {
      const reportsToDropdownData = initialData.fields.find(
        (d) => d.fieldName === "reportsTo"
      );
      if (reportsToDropdownData) {
        if (isNew) {
          setReportsToDataSource(reportsToDropdownData.option);
        } else {
          let currentContactRemovedDataSource =
            reportsToDropdownData.option.filter(
              (d) => d?.optionValue !== userId
            );
          setReportsToDataSource(currentContactRemovedDataSource);
        }
      }
      setFormsData(setFieldsInAscendingOrder(initialData.fields));
    }
  }, [initialData.fields]);

  const handleSubmit = (values) => {
    setSubmitting(true);

    if (isNew) {
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

          // if (redirectToDetailsScreen) {
          history.push({
            pathname: `/user/detail/${newId}`,
            state: { location: location },
          });
          close();
          // }
          // else {
          //     onSuccess(data.data[0])
          // }
        })
        .catch((error) => {
          setToastConfig(error);
          setSubmitting(false);
        });
    } else {
      axiosInstance()
        .put(`/user`, { ...values, _id: userId })
        .then(({ data }) => {
          setToastConfig({
            open: true,
            type: "success",
            message: data.message,
          });
          setSubmitting(false);
          onSuccess(data.permissions);
        })
        .catch((error) => {
          setToastConfig(error);
          setSubmitting(false);
        });
    }
  };
  const handleScroll = (errors) => {
    const err = Object.keys(errors);
    if (err.length) {
      const input = document.querySelector(
        `input[name=${err[0]}]`,
      );

      input.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'start',
      });
    }
  }

  const handleValuesChange = (data) => {
    setFormValues((prevState) => ({
      ...prevState,
      ...data
    }))
  }

  return (
    <Dialog
      open={open}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true)
        }
      }}
    >
      <CustomDialogHeader
        title={
          isNew
            ? "Create New User"
            : `Updating ${[dataToUpdate.firstName, dataToUpdate.lastName]
              .filter((f) => f)
              .join(" ")}`
        }
        onClose={() => {
          if (isFieldNotTouched({
            initialValues: initialData.values,
            fields: initialData.fields
          }, formValues)) close()
          else setShowConfirmDialog(true)
        }}
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
            <Button
              size="small"
              variant="outlined"
              color="primary"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              size="small"
              variant="contained"
              color="primary"
              disabled={loading}
            >
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
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  <h2 className="form-label-style" style={{ borderBottom: "none" }}>* Required Fields</h2>

                  {formsData &&
                    formsData.map((form, i) => (
                      <div key={i}>
                        <h2 className="form-label-style">{form.name}</h2>
                        <Box marginY={2}>
                          <Grid spacing={3} container>
                            {form.sectionFields.map((field) => (
                              <Grid
                                key={field.fieldName}
                                item
                                xs={12}
                                sm={6}
                                md={6}
                              >
                                {field.fieldName === "reportsTo" ? (
                                  <FormTypes
                                    values={values}
                                    errors={errors}
                                    touched={touched}
                                    label={field.fieldLabel}
                                    name={field.fieldName}
                                    type={field.type}
                                    options={reportsToDataSource}
                                    setFieldValue={(name, value) => {
                                      handleValuesChange({ [name]: value })
                                      setFieldValue(name, value)
                                    }}
                                    onChange={(e, val) => {
                                      setFieldValue(
                                        field.fieldName,
                                        val && val.optionValue
                                          ? val.optionValue
                                          : ""
                                      );
                                    }}
                                    required={field.required}
                                    fullWidth
                                    isTooltip={field?.isTooltip || false}
                                    tooltipMessage={field?.tooltipMessage}
                                    size="small"
                                  />
                                ) : (
                                  <FormTypes
                                    values={values}
                                    errors={errors}
                                    touched={touched}
                                    label={field.fieldLabel}
                                    name={field.fieldName}
                                    type={field.type}
                                    options={field.option}
                                    setFieldValue={(name, value) => {
                                      handleValuesChange({ [name]: value })
                                      setFieldValue(name, value)
                                    }}
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
                    ))}
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  disabled={isSubmitting || loading}
                  onClick={() => {
                    if (isFieldNotTouched({
                      initialValues: initialData.values,
                      fields: initialData.fields
                    }, values)) close()
                    else setShowConfirmDialog(true)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={() => {
                    handleScroll(errors)
                    submitForm()
                  }}
                  disabled={
                    isSubmitting || loading || uploadingImageOrFileProgress > 0
                  }
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
                      handleScroll(errors)
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
}
