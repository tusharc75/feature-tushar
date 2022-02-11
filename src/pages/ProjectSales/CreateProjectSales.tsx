import { useContext, useEffect, useState } from "react";
import {
  Dialog,
  Button,
  CircularProgress,
  Grid,
  useTheme,
  useMediaQuery,
  Box,
  IconButton,
  Tooltip,
  InputAdornment
} from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import { Formik, Form } from "formik";
import axiosInstance from "../../axios/axiosInstance";
import CustomDialogHeader from "../../components/CustomDialog/CustomDialogHeader";
import CustomDialogContent from "../../components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "../../components/CustomDialog/CustomDialogFooter";
import { useHistory } from "react-router-dom";
import { getObjKeys, yupSchema, setFieldsInAscendingOrder, getObjKeysWithValues, formFieldNames, getUniqueCurrencies, initializeDropdownById, RESOURCE_LABEL } from "../../constants/helpers";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { useData } from "../../StateProvider/Provider";
import FormTypes from "../../components/Helpers/FormTypes";
import AddIcon from "@material-ui/icons/AddCircle";
import InfoIcon from "@material-ui/icons/Info";
import ManageMarketSegmentDialog from "../MarketSegment/ManageMarketSegmentDialog";
import ConfirmCancelDialog from "../../components/ConfirmCancelDialog"
import { simplifyValues } from "../../constants/helpers"
import { isMobile, isTablet } from 'react-device-detect';
import { FaDiceOne } from "react-icons/fa";
import ManageAddressDialog from "../../components/Address/ManageAddressDialog";
interface InitialData {
  fields: any[];
  values: object;
}

const CreateProjectSales = ({ isClone = false, open, close, fetchData, type = null, projectSalesId = null, fields = null,
  onSuccess = null, accountId = null, resource = null }) => {
  const {
    state: {
      user: { user }, permissions
    },
  } = useData();
  const theme = useTheme();
  const toastConfig = useContext(CustomToastContext);
  const [isSubmitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState<InitialData>({
    fields: [],
    values: {},
  });
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0)
  const history = useHistory();
  const [formsData, setFormsData] = useState([]);

  const [productSalesName, setProductSalesName] = useState("");
  const [currencySymbol, setCurrencySymbol] = useState(null);

  const [showAddMarketSegmentDialog, setShowAddMarketSegmentDialog] = useState(false);

  const [mainMarketSegmentDataSource, setMainMarketSegmentDataSource] = useState([]);
  const [marketSegmentDataSource, setMarketSegmentDataSource] = useState([]);
  const [newMarketSegmentId, setNewMarketSegmentId] = useState(null);
  const [subMarketSegmentDataSource, setSubMarketSegmentDataSource] = useState([]);
  const [newSubMarketSegmentId, setNewSubMarketSegmentId] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [formValues, setFormValues] = useState({})
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [showAddAddresstDialog, setShowAddAddresstDialog] = useState(false);
  const [addressDataSource, setAddressDataSource] = useState([]);

  useEffect(() => {
    if (initialData.fields.length > 0) {
      setFormsData(setFieldsInAscendingOrder(initialData.fields));
    }
  }, [initialData.fields]);

  useEffect(() => {
    getInitialData();
  }, []);

  const getInitialData = () => {
    setLoading(true);
    axiosInstance()
      .get("/field?resource=Project Sales")
      .then(({ data: { data } }) => {

        const newFields = [];

        const filterData = projectSalesId
          ? data.filter((d) => d.isUpdate)
          : data.filter((d) => {
            if (accountId && ["customerAccountName", "supplierAccountName"].some(
              (_f) => _f === d.fieldData.fieldName
            )
            ) {
              d = initializeDropdownById(d, d.fieldData.fieldName, accountId);
            }
            return d.isCreate
          });


        // const fieldsData = projectSalesId ?
        //   data.filter(d => d.isUpdate).map((d: any) => d.fieldData) :
        //   data.filter(d => d.isCreate).map((d: any) => d.fieldData);

        //  Initialize market segment dropdown which have parentMarketSegment === "" or that record have child
        const addressDropdownData = filterData.map(m => m.fieldData).find(
          (d) => d.fieldName === "finalDestination"
        );
        if (addressDropdownData) {
          setAddressDataSource(addressDropdownData.option);
        }

        const marketSegmentDropdownData = filterData.map(m => m.fieldData).find(
          (d) => d.fieldName === formFieldNames.marketSegment
        );
        if (marketSegmentDropdownData) {
          setMainMarketSegmentDataSource(marketSegmentDropdownData.option);

          let initializeMarketSegmentDataSource = [];
          marketSegmentDropdownData.option.forEach(option => {
            if (option.parentMarketSegment === "" || marketSegmentDropdownData.option.some(s => s.parentMarketSegment === option.optionValue)) {
              initializeMarketSegmentDataSource.push(option);
            }
          })
          setMarketSegmentDataSource(initializeMarketSegmentDataSource);
        }

        if (projectSalesId) {
          axiosInstance().get("project-sales/" + projectSalesId).then(({ data: { data } }) => {

            filterData.map((_f) => {
              if (_f.fieldData.fieldName === "currency") {
                setCurrencySymbol(
                  getUniqueCurrencies().find(
                    (d) => d.currencyCode === data["currency"]
                  )?.symbolNative
                );
              }
              newFields.push(_f.fieldData);
            });

            if (isClone) {

              const { projectName, ...rest } = data

              let tempData = { ...rest }
              let tempObjKeysWithValues = getObjKeysWithValues(tempData, newFields)
              tempObjKeysWithValues["projectManager"] = user._id
              setInitialData({
                fields: newFields,
                values: tempObjKeysWithValues,
              });
              setFormValues(tempObjKeysWithValues)
            }
            else {
              setInitialData({
                fields: newFields,
                values: getObjKeysWithValues(data, newFields),
              });
              setFormValues(getObjKeysWithValues(data, newFields))
            }
            setProductSalesName(data.projectName)

            if (marketSegmentDropdownData && data.marketSegment) {
              setSubMarketSegmentDataSource(marketSegmentDropdownData.option.filter(d => d.parentMarketSegment === data.marketSegment.optionValue));
            }

          }).catch((error) => {
            toastConfig.setToastConfig(error);
          });
        }
        else {
          const createFields = filterData.map(m => m.fieldData)
          let tempObjKeysWithValues = getObjKeys("", createFields);
          tempObjKeysWithValues["projectManager"] = user._id;
          setInitialData({
            fields: createFields,
            values: tempObjKeysWithValues,
          });
          setFormValues(tempObjKeysWithValues)
        }

        setTimeout(() => setLoading(false), 500);
      })
      .catch((err) => {
        setLoading(false);
      });
  };

  const handleSubmit = (values) => {
    if (projectSalesId && !isClone) {
      setSubmitting(true);

      axiosInstance()
        .put("/project-Sales", { ...values, _id: projectSalesId })
        .then(({ data }) => {
          fetchData();
          toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: data.message,
          });
          setSubmitting(false);
          close();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setSubmitting(false);
        });
    } else {
      setSubmitting(true);
      var tempStaticData = {};
      if (type) {
        type.map((d: any) => {
          tempStaticData[d.type] = [d.id];
        });
      }
      tempStaticData["user"] = [values?.projectManager, user._id];
      values.staticData = tempStaticData;
      axiosInstance()
        .post("/project-Sales", values)
        .then(({ data }) => {
          if (accountId) {
            axiosInstance()
              .put("/project-sales/add-customer-account", {
                _id: data?.data._id,
                customerAccount: [accountId]
              })
          }
          if (onSuccess) {
            onSuccess(data)
          }

          const newId = data.data?._id;
          setSubmitting(false);
          fetchData();
          if (type) {
            close();
          } else {
            history.push(`/project-sales/detail/${newId}`, {
              managerId: data.data?.projectManager,
            });
            close();
          }
          toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: data.message,
          });
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setSubmitting(false);
        });
    }
  };

  const initializeMarketSegmentDropdown = (values, marketSegmentSource) => {
    if (values && values.hasOwnProperty(formFieldNames.marketSegment)) {
      const getNewAddedMarketSegment = marketSegmentSource.find(
        (d) => d?.optionValue === newMarketSegmentId
      );
      if (getNewAddedMarketSegment) {
        values[formFieldNames.marketSegment] = getNewAddedMarketSegment.optionValue;
      }
      return values;
    }
    return values;
  };

  const initializeSubMarketSegmentDropdown = (values, subMarketSegmentSource) => {
    if (values && values.hasOwnProperty(formFieldNames.subMarketSegment)) {
      const getNewAddedSubMarketSegment = subMarketSegmentSource.find(
        (d) => d?.optionValue === newSubMarketSegmentId
      );
      if (getNewAddedSubMarketSegment) {
        values[formFieldNames.subMarketSegment] = getNewAddedSubMarketSegment.optionValue;
      }
      return values;
    }
    return values;
  };

  const marketSegmentChange = (marketSegmentId: string) => {
    setSubMarketSegmentDataSource(marketSegmentId ? mainMarketSegmentDataSource.filter(d => d.parentMarketSegment === marketSegmentId) : []);
  }

  const isFieldNotTouched = (initialData, values) => {
    return Object.values(
      simplifyValues(
        initialData.values,
        initialData.fields
      )
    ).toString() ===
      Object.values(
        simplifyValues(values, initialData.fields)
      ).toString()
  }
  const handleValuesChange = (data) => {
    setFormValues((prevState) => ({
      ...prevState,
      ...data
    }))
  }
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
      <CustomDialogHeader
        onClose={() => {
          if (isFieldNotTouched(initialData, formValues)) close()
          else setShowConfirmDialog(true)
        }}
        title={`${isClone ? `Clone - [${productSalesName}]` : projectSalesId ? `Update ${productSalesName}` : `New ${RESOURCE_LABEL.projectStrategy}`}`}
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
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
                <Grid key={i} item xs={12} sm={6} md={6}>
                  <Skeleton width="100%" height="60px" />
                </Grid>
              ))}
            </Grid>
          </CustomDialogContent>
          <CustomDialogFooter>
            <Button variant="outlined" size="small" color="primary" disabled
            >
              Cancel
            </Button>
            <Button variant="contained" size="small" color="primary" disabled>
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
                  {/*<h2 className="form-label-style" style={{ borderBottom: "none" }}>* Required Fields</h2>*/}

                  {formsData &&
                    formsData.map((form, index1) => {
                      return form.name ? (
                        <div key={index1}>
                          <div className={"detail-box-content"}>
                            <FaDiceOne size={16} color={"var(--white)"} style={{ marginRight: "5px" }} />
                            <h2 className={`${"form-label-style"} ${"form-label-quotes"}`}>{form.name}</h2>
                          </div>

                          <Box marginY={2}>
                            <Grid spacing={3} container>
                              {form.sectionFields.map((field, index2) => (
                                <Grid key={index2} item xs={12} sm={6} md={6}>
                                  {
                                    field.fieldName === formFieldNames.marketSegment ?
                                      <Grid key={field.fieldName} item xs={12} sm={12} md={12}>
                                        <Grid container spacing={1}>
                                          <Grid
                                            item
                                            xs={
                                              permissions.marketSegment.isCreate ? 11
                                                : 11
                                            }
                                            sm={
                                              permissions.marketSegment.isCreate ? 11
                                                : 11
                                            }
                                            md={
                                              permissions.marketSegment.isCreate ? 11
                                                : 11
                                            }
                                          >
                                            <FormTypes
                                              {...field}
                                              disabled={Boolean(projectSalesId) && field.disableOnEdit}
                                              isNew={Boolean(projectSalesId)}
                                              fields={initialData.fields}
                                              fieldData={field}
                                              errors={errors}
                                              touched={touched}
                                              label={field.fieldLabel}
                                              name={field.fieldName}
                                              type={field.type}
                                              setFieldValue={(name, value) => {
                                                handleValuesChange({ [name]: value })
                                                setFieldValue(name, value)
                                              }}
                                              required={field.required}
                                              fullWidth
                                              isTooltip={field.isTooltip}
                                              tooltipMessage={field.tooltipMessage}
                                              onChange={(e, val) => {
                                                setNewMarketSegmentId(null);
                                                setFieldValue(field.fieldName, val && val.optionValue ? val.optionValue : "")
                                                setNewSubMarketSegmentId(null);
                                                setFieldValue(formFieldNames.subMarketSegment, "")
                                                handleValuesChange({
                                                  [field.fieldName]: val && val.optionValue ? val.optionValue : "",
                                                  [formFieldNames.subMarketSegment]: ""
                                                })
                                                marketSegmentChange(val && val.optionValue ? val.optionValue : "");
                                              }}
                                              size="small"
                                              values={
                                                newMarketSegmentId
                                                  ? initializeMarketSegmentDropdown(
                                                    values,
                                                    marketSegmentDataSource
                                                  )
                                                  : values
                                              }
                                              options={marketSegmentDataSource}
                                              doNotShowInfoTooltip={true}
                                            />
                                          </Grid>
                                          {
                                            permissions.marketSegment.isCreate && (
                                              <Grid item xs={1} sm={1} md={1}>
                                                <Tooltip
                                                  title="Add Market Segment"
                                                  className="mt-1"
                                                >
                                                  <IconButton
                                                    onClick={() => { setShowAddMarketSegmentDialog(true); }}
                                                    disabled={Boolean(projectSalesId) && field.disableOnEdit}
                                                    size="small"
                                                  >
                                                    <AddIcon color={(Boolean(projectSalesId) && field.disableOnEdit) ? "disabled" : "primary"} />
                                                  </IconButton>
                                                </Tooltip>
                                              </Grid>
                                            )
                                          }
                                          {field?.tooltipMessage ? (
                                            <Grid item xs={1} sm={1} md={1}>
                                              <Tooltip
                                                title={
                                                  field?.tooltipMessage ?? ""
                                                }
                                              >
                                                <InfoIcon color="disabled" />
                                              </Tooltip>
                                            </Grid>
                                          ) : null}
                                        </Grid>
                                      </Grid>
                                      : field.fieldName === formFieldNames.subMarketSegment ?
                                        <Grid key={field.fieldName} item xs={12} sm={12} md={12}>
                                          <Grid container spacing={1}>
                                            <Grid
                                              item
                                              xs={
                                                permissions.marketSegment.isCreate ? 11
                                                  : 11
                                              }
                                              sm={
                                                permissions.marketSegment.isCreate ? 11
                                                  : 11
                                              }
                                              md={
                                                permissions.marketSegment.isCreate ? 11
                                                  : 11
                                              }
                                            >
                                              <FormTypes
                                                {...field}
                                                disabled={Boolean(projectSalesId) && field.disableOnEdit}
                                                isNew={Boolean(projectSalesId)}
                                                fields={initialData.fields}
                                                fieldData={field}
                                                errors={errors}
                                                touched={touched}
                                                label={field.fieldLabel}
                                                name={field.fieldName}
                                                type={field.type}
                                                setFieldValue={(name, value) => {
                                                  handleValuesChange({ [name]: value })
                                                  setFieldValue(name, value)
                                                }}
                                                required={field.required}
                                                fullWidth
                                                isTooltip={field.isTooltip}
                                                tooltipMessage={field.tooltipMessage}
                                                onChange={(e, val) => {
                                                  setNewSubMarketSegmentId(null);
                                                  handleValuesChange({ [field.fieldName]: val && val.optionValue ? val.optionValue : "" })
                                                  setFieldValue(field.fieldName, val && val.optionValue ? val.optionValue : "")
                                                }}
                                                size="small"
                                                values={
                                                  newSubMarketSegmentId
                                                    ? initializeSubMarketSegmentDropdown(
                                                      values,
                                                      subMarketSegmentDataSource
                                                    )
                                                    : values
                                                }
                                                options={subMarketSegmentDataSource}
                                                doNotShowInfoTooltip={true}
                                              />
                                            </Grid>
                                            {
                                              permissions.marketSegment.isCreate && (
                                                <Grid item xs={1} sm={1} md={1}>
                                                  <Tooltip
                                                    title="Add Sub Market Segment"
                                                    className="mt-1"
                                                  >
                                                    <IconButton
                                                      onClick={() => {
                                                        setShowAddMarketSegmentDialog(true);
                                                      }}
                                                      disabled={Boolean(projectSalesId) && field.disableOnEdit}
                                                      size="small"
                                                    >
                                                      <AddIcon color={(Boolean(projectSalesId) && field.disableOnEdit) ? "disabled" : "primary"} />
                                                    </IconButton>
                                                  </Tooltip>
                                                </Grid>
                                              )
                                            }
                                            {field?.tooltipMessage ? (
                                              <Grid item xs={1} sm={1} md={1}>
                                                <Tooltip
                                                  title={
                                                    field?.tooltipMessage ?? ""
                                                  }
                                                >
                                                  <InfoIcon color="disabled" />
                                                </Tooltip>
                                              </Grid>
                                            ) : null}
                                          </Grid>
                                        </Grid> : field.fieldName === "projectCategory" ? (
                                          <FormTypes
                                            {...field}
                                            disabled={Boolean(projectSalesId) && field.disableOnEdit}
                                            isNew={Boolean(projectSalesId)}
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
                                            imageOrFileUploadCompletePercentage={null}
                                          />
                                        ) :
                                          field.fieldName === "startDate" ? (
                                            <FormTypes
                                              {...field}
                                              disabled={Boolean(projectSalesId) && field.disableOnEdit}
                                              isNew={Boolean(projectSalesId)}
                                              values={values}
                                              errors={errors}
                                              touched={touched}
                                              label={field.fieldLabel}
                                              name={field.fieldName}
                                              type={field.type}
                                              options={field.option}
                                              maxDate={values.endDate}
                                              setFieldValue={(name, value) => {
                                                handleValuesChange({ [name]: value })
                                                setFieldValue(name, value)
                                              }}
                                              required={field.required}
                                              fullWidth
                                              isTooltip={field?.isTooltip || false}
                                              tooltipMessage={field?.tooltipMessage}
                                              size="small"
                                              imageOrFileUploadCompletePercentage={null}
                                            />
                                          ) :
                                            field.fieldName === "endDate" ? (
                                              <FormTypes
                                                {...field}
                                                disabled={Boolean(projectSalesId) && field.disableOnEdit}
                                                isNew={Boolean(projectSalesId)}
                                                values={values}
                                                errors={errors}
                                                touched={touched}
                                                label={field.fieldLabel}
                                                name={field.fieldName}
                                                type={field.type}
                                                options={field.option}
                                                minDate={values.startDate}
                                                setFieldValue={(name, value) => {
                                                  handleValuesChange({ [name]: value })
                                                  setFieldValue(name, value)
                                                }}
                                                required={field.required}
                                                fullWidth
                                                isTooltip={field?.isTooltip || false}
                                                tooltipMessage={field?.tooltipMessage}
                                                size="small"
                                                imageOrFileUploadCompletePercentage={null}
                                              />
                                            )

                                              : field.fieldName === "entity" ? (
                                                <FormTypes
                                                  disabled={Boolean(projectSalesId) && field.disableOnEdit}
                                                  multiple
                                                  values={values}
                                                  errors={errors}
                                                  touched={touched}
                                                  label={field.fieldLabel}
                                                  name={field.fieldName}
                                                  type={field.type}
                                                  options={field.option}
                                                  fullWidth
                                                  isTooltip={field?.isTooltip || false}
                                                  tooltipMessage={field?.tooltipMessage}
                                                  size="small"
                                                  onChange={(e, value) => {
                                                    setFieldValue(
                                                      field.fieldName,
                                                      value ? value.filter((v) => v.optionValue).map((val) => val.optionValue) : []
                                                    );
                                                    setFieldValue("projectManager", "");
                                                    handleValuesChange({
                                                      [field.fieldName]: value ? value.filter((v) => v.optionValue).map((val) => val.optionValue) : [],
                                                      "projectManager": ""
                                                    })
                                                  }}
                                                />
                                              ) : field.fieldName === "projectManager" ? (
                                                <FormTypes
                                                  {...field}
                                                  disabled={Boolean(projectSalesId) && !isClone}
                                                  values={values}
                                                  errors={errors}
                                                  touched={touched}
                                                  label={field.fieldLabel}
                                                  name={field.fieldName}
                                                  type={field.type}
                                                  options={values["entity"] && values["entity"].length ?
                                                    field.option.filter(data => values["entity"]?.some(d => data.entities?.some(e => e.entity === d)))
                                                    : field.option}
                                                  fullWidth
                                                  isTooltip={field?.isTooltip || false}
                                                  tooltipMessage={field?.tooltipMessage}
                                                  size="small"
                                                  onChange={(e, value) => {
                                                    setFieldValue(
                                                      field.fieldName,
                                                      value && value.optionValue
                                                        ? value.optionValue
                                                        : ""
                                                    );
                                                    handleValuesChange({
                                                      [field.fieldName]: value && value.optionValue ? value.optionValue : ""
                                                    })
                                                  }}
                                                />
                                              ) : field.fieldName === "currency" ? (
                                                <FormTypes
                                                  {...field}
                                                  disabled={Boolean(projectSalesId) && field.disableOnEdit}
                                                  isNew={Boolean(projectSalesId)}
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
                                                  onChange={(e, val) => {
                                                    if (val && val.currencyCode) {
                                                      setFieldValue(
                                                        field.fieldName,
                                                        val.currencyCode
                                                      );
                                                      handleValuesChange({ [field.fieldName]: val.currencyCode })
                                                      setCurrencySymbol(val.symbolNative);
                                                    } else {
                                                      handleValuesChange({ [field.fieldName]: "" })
                                                      setFieldValue(field.fieldName, "");
                                                      setCurrencySymbol(null);
                                                    }
                                                  }}
                                                />
                                              ) : field.fieldName.trim() === "amount" ? (
                                                <FormTypes
                                                  disabled={Boolean(projectSalesId) && field.disableOnEdit}
                                                  isNew={Boolean(projectSalesId)}
                                                  fieldId={field._id}
                                                  lookup={field.lookup}
                                                  // {...rest}
                                                  selectedCurrencyCode={values["currency"]}
                                                  startAdornment={
                                                    currencySymbol ? (
                                                      <InputAdornment position="start">
                                                        {currencySymbol}
                                                      </InputAdornment>
                                                    ) : (
                                                      ""
                                                    )
                                                  }
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
                                                />
                                              ) : field.fieldName === "finalDestination" ?
                                                <Grid key={field.fieldName} item xs={12} sm={12} md={12}>
                                                  <Grid container spacing={1}>
                                                    <Grid
                                                      item
                                                      xs={
                                                        permissions?.projectStrategy?.isCreate ? 11
                                                          : 12
                                                      }
                                                      sm={
                                                        permissions?.projectStrategy?.isCreate ? 11
                                                          : 12
                                                      }
                                                      md={
                                                        permissions?.projectStrategy?.isCreate ? 11
                                                          : 12
                                                      }
                                                    >
                                                      <FormTypes
                                                        {...field}
                                                        values={values}
                                                        errors={errors}
                                                        touched={touched}
                                                        label={field.fieldLabel}
                                                        name={field.fieldName}
                                                        type={field.type}
                                                        options={addressDataSource}
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
                                                    </Grid>
                                                    {
                                                      permissions?.projectStrategy?.isCreate && (
                                                        <Grid item xs={1} sm={1} md={1}>
                                                          <Tooltip
                                                            title="Add Address"
                                                            className="mt-1"
                                                          >
                                                            <IconButton
                                                              onClick={() => {
                                                                setShowAddAddresstDialog(true);
                                                              }}
                                                              disabled={field.disableOnEdit}
                                                              size="small"
                                                            >
                                                              <AddIcon color={field.disableOnEdit ? "disabled" : "primary"} />
                                                            </IconButton>
                                                          </Tooltip>
                                                        </Grid>
                                                      )
                                                    }
                                                    {field?.tooltipMessage ? (
                                                      <Grid item xs={1} sm={1} md={1}>
                                                        <Tooltip
                                                          title={
                                                            field?.tooltipMessage ?? ""
                                                          }
                                                        >
                                                          <InfoIcon color="disabled" />
                                                        </Tooltip>
                                                      </Grid>
                                                    ) : null}
                                                  </Grid>
                                                </Grid>
                                                : <FormTypes
                                                  {...field}
                                                  isNew={Boolean(projectSalesId)}
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
                                                  imageOrFileUploadCompletePercentage={null}
                                                  disabled={projectSalesId && field.fieldName === "projectManager" || (!projectSalesId && field.disableOnEdit)}
                                                />
                                  }
                                </Grid>
                              ))}
                            </Grid>
                          </Box>
                        </div>
                      ) : (
                        form.sectionFields.map((field) => (
                          <FormTypes
                            {...field}
                            disabled={Boolean(projectSalesId) && field.disableOnEdit}
                            isNew={Boolean(projectSalesId)}
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
                            style={{ visibility: "hidden" }}
                          />
                        ))
                      );
                    })}
                </Form>
                {
                  showAddAddresstDialog && <ManageAddressDialog
                    onClose={() => {
                      setShowAddAddresstDialog(false);
                    }}
                    onSuccess={(obj) => {
                      if (obj) {
                        setShowAddAddresstDialog(false);
                        if (obj?.isAlreadyExist === true) {
                          let tempAddress = addressDataSource.find(d => d?.optionLabel === obj?.fullAddress)
                          setFieldValue("finalDestination", [...values[`finalDestination`], tempAddress.optionValue]);
                        }
                        else {
                          setAddressDataSource((prevState) => [...prevState,
                          {
                            default: false,
                            optionLabel: obj?.fullAddress,
                            optionValue: obj._id,
                            order: addressDataSource.length + 1,
                          }]);
                          setFieldValue("finalDestination", [...values[`finalDestination`], obj._id]);
                        }
                      }
                    }}
                  />
                }
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
                  onClick={() => {
                    submitForm()
                    handleScroll(errors)
                  }}
                  disabled={isSubmitting || loading || uploadingImageOrFileProgress > 0}
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


      {
        showAddMarketSegmentDialog && <ManageMarketSegmentDialog
          marketSegmentId={null}
          onClose={() => {
            setShowAddMarketSegmentDialog(false);
          }}
          onSuccess={(data) => {
            if (data?._id) {
              setMainMarketSegmentDataSource((prevState) => {
                return [
                  ...prevState,
                  {
                    optionValue: data._id,
                    optionLabel: data.name,
                    order: mainMarketSegmentDataSource.length,
                    default: false,
                    parentMarketSegment: data.parentMarketSegment
                  }
                ];
              });

              //  If no parent selected, consider that as parent and add it in Market Segment
              if (data.parentMarketSegment === "") {
                setMarketSegmentDataSource((prevState) => {
                  return [
                    ...prevState,
                    {
                      optionValue: data._id,
                      optionLabel: data.name,
                      order: marketSegmentDataSource.length,
                      default: false,
                      parentMarketSegment: data.parentMarketSegment
                    }
                  ];
                });
                setSubMarketSegmentDataSource([]);
                setNewMarketSegmentId(data._id);
                setNewSubMarketSegmentId(null);
              } else {
                //  If parent selected, consider that as a child
                if (marketSegmentDataSource.some(d => d?.optionValue === data.parentMarketSegment)) {
                  setSubMarketSegmentDataSource([
                    ...mainMarketSegmentDataSource.filter(s => s.parentMarketSegment === data.parentMarketSegment),
                    {
                      optionValue: data._id,
                      optionLabel: data.name,
                      order: subMarketSegmentDataSource.length,
                      default: false,
                      parentMarketSegment: data.parentMarketSegment
                    }]
                  );
                } else {

                  let initializeMarketSegmentDataSource = [];
                  mainMarketSegmentDataSource.forEach(option => {
                    if (option.parentMarketSegment === "" || mainMarketSegmentDataSource.some(s => s.parentMarketSegment === option.optionValue)) {
                      initializeMarketSegmentDataSource.push(option);
                    }
                  })

                  if (!initializeMarketSegmentDataSource.some(s => s.optionValue === data.parentMarketSegment)) {
                    const getMarketSegment = mainMarketSegmentDataSource.find(d => d?.optionValue === data.parentMarketSegment);

                    initializeMarketSegmentDataSource.push({
                      optionValue: getMarketSegment.optionValue,
                      optionLabel: getMarketSegment.optionLabel,
                      order: initializeMarketSegmentDataSource.length,
                      default: false,
                      parentMarketSegment: getMarketSegment.parentMarketSegment
                    })
                  }
                  setMarketSegmentDataSource(initializeMarketSegmentDataSource);

                  setSubMarketSegmentDataSource([
                    ...mainMarketSegmentDataSource.filter(s => s.parentMarketSegment === data.parentMarketSegment),
                    {
                      optionValue: data._id,
                      optionLabel: data.name,
                      order: subMarketSegmentDataSource.length,
                      default: false,
                      parentMarketSegment: data.parentMarketSegment
                    }]
                  );
                }
                setNewMarketSegmentId(data.parentMarketSegment);
                setNewSubMarketSegmentId(data._id);
              }
            }
            setShowAddMarketSegmentDialog(false);
          }}
        />
      }
    </Dialog>
  );
};

export default CreateProjectSales;
