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
import { IconButton, Tooltip } from '@material-ui/core';
import AddIcon from '@material-ui/icons/AddCircle';
import InfoIcon from '@material-ui/icons/Info';
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
import { useData } from '../../StateProvider/Provider';
import { isMobile , isTablet } from 'react-device-detect';
import {FaDiceOne} from "react-icons/fa";
import ManageAddressDialog from "../../components/Address/ManageAddressDialog"
interface InitialData {
  fields: any[];
  values: object;
}

const ManageEntity = ({ open, close, fetchData, isNew, values = {}, isClone = false,
  entityId = null, fetchEntities = null }) => {
  const theme = useTheme();
  const [isSubmitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState<InitialData>({
    fields: [],
    values: values,
  });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [cloneHeading, setCloneHeading] = useState('');
  //  Owner, Collaborator Code - Start
  const [formsData, setFormsData] = useState([]);
  const [parentEntityDataSource, setParentEntityDataSource] = useState([]);
  const [addressOptions, setAddressOptions] = useState([]);
  const [addressOpen, setAddressOpen] = useState({open:false, isClone: false})
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [formValues, setFormValues] = useState({})
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();


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
      .then(async ({ data: { data } }) => {
      
        const fieldsData = isNew ? data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData)
          : data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
          let tempData = getObjKeys("", fieldsData)
        if (isClone) {
          const { data: { data } } = await axiosInstance().get(`/entity/${entityId}`);
          const { entityName, ...rest } = data
          setCloneHeading(entityName);
          tempData = getObjKeysWithValues({ ...rest }, fieldsData)
        }

        setInitialData({
          fields: fieldsData,
          values: isNew ? tempData : getObjKeysWithValues(values, fieldsData),
        });
        setFormValues(isNew ? tempData : getObjKeysWithValues(values, fieldsData))
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
          fetchData(true);
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
          close();
          fetchData();
        })
        .catch((error) => {
          setSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleValuesChange = (data) => {
    setFormValues((prevState) => ({
      ...prevState,
      ...data
    }))
  }

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
      fullScreen={fullScreen || (isMobile || isTablet)}
    >
      <CustomDialogHeader title={isClone ? `Clone - [${cloneHeading}]`: isNew ? "Create New Entities" : "Update Entity"}
        onClose={() => {
          if (isFieldNotTouched({
            ...initialData,
            initialValues: initialData.values,
          }, formValues)) close()
          else setShowConfirmDialog(true)
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
                  {/*<h2 className="form-label-style" style={{ borderBottom: "none" }}>* Required Fields</h2>*/}
                  {
                    formsData &&
                    formsData.map((form, i) => (
                      <div key={i}>
                          <div className={"detail-box-content"}>
                              <FaDiceOne size={16} color={"var(--white)"} style={{marginRight:"5px"}}/>
                              <h2 className={`${"form-label-style"} ${"form-label-quotes"}`}>{form.name}</h2>
                          </div>
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
                                      setFieldValue={(name, value) => {
                                        handleValuesChange({ [name]: value })
                                        setFieldValue(name, value)
                                      }}
                                      required={field.required}
                                      fullWidth
                                      isTooltip={field?.isTooltip || false}
                                      tooltipMessage={field?.tooltipMessage}
                                      size="small"
                                    />
                                  ) :field.fieldName === 'address' ? (
                                    <Grid key={field.fieldName} item xs={12} sm={12} md={12}>
                                      <Grid container spacing={1}>
                                        <Grid item xs={permissions?.entity?.isCreate ? 10 : 11} sm={permissions?.entity?.isCreate ? 10 : 11} md={permissions?.entity?.isCreate ? 10 : 11}>
                                        <FormTypes
                                      isNew={isNew}
                                      {...field}
                                      values={values}
                                      errors={errors}
                                      touched={touched}
                                      label={field.fieldLabel}
                                      name={field.fieldName}
                                      type={field.type}
                                      // options={addressOptions}
                                      setFieldValue={(name, value) => {
                                        // handleValuesChange({ [name]: value })
                                        setFieldValue(name, value)
                                      }}
                                      required={field.required}
                                      fullWidth
                                      isTooltip={field?.isTooltip || false}
                                      tooltipMessage={field?.tooltipMessage}
                                      size="small"
                                      
                                    />
                                        </Grid>
                                        {permissions?.entity?.isCreate && (
                                        <Grid item xs={1} sm={1} md={1}>
                                          <Tooltip title="Add Address" className="mt-1">
                                            <IconButton
                                              onClick={() => {
                                                setAddressOpen({ open: true, isClone: false });
                                              }}
                                              // disabled={!isNew && field.disableOnEdit}
                                              size="small"
                                            >
                                              <AddIcon color={'primary'} />
                                            </IconButton>
                                          </Tooltip>
                                        </Grid>
                                        )}
                
                                        {field?.tooltipMessage ? (
                                          <Grid item xs={1} sm={1} md={1}>
                                            <Tooltip title={field?.tooltipMessage ?? ''}>
                                              <InfoIcon color="disabled" />
                                            </Tooltip>
                                          </Grid>
                                        ) : null}
                                      </Grid>
                                    </Grid>
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
                    ))
                  }
                </Form>
                {addressOpen?.open && (
                  <ManageAddressDialog
                  open={addressOpen?.open}
                  onClose={() => setAddressOpen({open:false,isClone:false}) }
                  onSuccess={(data) => {
            
                    setAddressOpen({open:false,isClone:false})
                    setFieldValue("address",data.fullAddress)
                    setAddressOptions((prevState) => {
                      return [
                        ...prevState,
                        {
                          optionValue: data?.brand,
                          optionLabel: data?.fullAddress,
                          order: addressOptions.length,
                          default: false
                        }
                      ]
                    })
                  }}
               
                  />
                )}
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  disabled={isSubmitting || loading}

                  onClick={() => {
                    if (isFieldNotTouched({
                      ...initialData,
                      initialValues: initialData.values
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
                  onClick={submitForm}
                  disabled={isSubmitting || loading || 
                    uploadingImageOrFileProgress > 0}
                >
                  {isSubmitting ? <CircularProgress size={22} /> : "Submit"}
                </Button>
              </CustomDialogFooter>
              {
                showConfirmDialog ?
                  <ConfirmCancelDialog
                    close={() => setShowConfirmDialog(false)}
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
