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
import { getObjKeys, yupSchema, setFieldsInAscendingOrder, getObjKeysWithValues, formFieldNames, getUniqueCurrencies } from "../../constants/helpers";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { useData } from "../../StateProvider/Provider";
import FormTypes from "../../components/Helpers/FormTypes";
import AddIcon from "@material-ui/icons/AddCircle";
import InfoIcon from "@material-ui/icons/Info";
import ManageMarketSegmentDialog from "../MarketSegment/ManageMarketSegmentDialog";

interface InitialData {
  fields: any[];
  values: object;
}

const CreateProjectSales = ({ open, close, fetchData, type = null, projectSalesId = null, fields = null }) => {
  const {
    state: {
      user: { user }, permissions
    },
  } = useData();
  const theme = useTheme();
  const toastConfig = useContext(CustomToastContext);
  const isMobile = useMediaQuery(theme.breakpoints.down("xs"));
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
          : data.filter((d) => d.isCreate);


        // const fieldsData = projectSalesId ?
        //   data.filter(d => d.isUpdate).map((d: any) => d.fieldData) :
        //   data.filter(d => d.isCreate).map((d: any) => d.fieldData);

        //  Initialize market segment dropdown which have parentMarketSegment === "" or that record have child
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

            setInitialData({
              fields: newFields,
              values: getObjKeysWithValues(data, newFields),
            });
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
          setInitialData({
            fields: createFields,
            values: getObjKeys("", createFields),
          });
        }

        setTimeout(() => setLoading(false), 500);
      })
      .catch((err) => {
        setLoading(false);
      });
  };

  const handleSubmit = (values) => {
    if (projectSalesId) {
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
        (d) => d.optionValue === newMarketSegmentId
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
        (d) => d.optionValue === newSubMarketSegmentId
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

  return (
    <Dialog
      open={open}
      onClose={close}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
    >
      <CustomDialogHeader title={`${projectSalesId ? `Update ${productSalesName}` : "Create New Project Sales"}`} onClose={close} />

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
            <Button variant="outlined" size="small" color="primary" disabled>
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
                  {formsData &&
                    formsData.map((form, index1) => {
                      return form.name ? (
                        <div key={index1}>
                          <h2 className="form-label-style">{form.name}</h2>
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
                                              permissions.marketSegment.isCreate ? 10
                                                : 11
                                            }
                                            sm={
                                              permissions.marketSegment.isCreate ? 10
                                                : 11
                                            }
                                            md={
                                              permissions.marketSegment.isCreate ? 10
                                                : 11
                                            }
                                          >
                                            <FormTypes
                                              {...field}
                                              disabled={!Boolean(projectSalesId) && field.disableOnEdit}
                                              isNew={Boolean(projectSalesId)}
                                              fields={initialData.fields}
                                              fieldData={field}
                                              errors={errors}
                                              touched={touched}
                                              label={field.fieldLabel}
                                              name={field.fieldName}
                                              type={field.type}
                                              setFieldValue={setFieldValue}
                                              required={field.required}
                                              fullWidth
                                              isTooltip={field.isTooltip}
                                              tooltipMessage={field.tooltipMessage}
                                              onChange={(e, val) => {
                                                setNewMarketSegmentId(null);
                                                setFieldValue(field.fieldName, val && val.optionValue ? val.optionValue : "")
                                                setNewSubMarketSegmentId(null);
                                                setFieldValue(formFieldNames.subMarketSegment, "")
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
                                                    disabled={!Boolean(projectSalesId) && field.disableOnEdit}
                                                    size="small"
                                                  >
                                                    <AddIcon color="primary" />
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
                                                permissions.marketSegment.isCreate ? 10
                                                  : 11
                                              }
                                              sm={
                                                permissions.marketSegment.isCreate ? 10
                                                  : 11
                                              }
                                              md={
                                                permissions.marketSegment.isCreate ? 10
                                                  : 11
                                              }
                                            >
                                              <FormTypes
                                                {...field}
                                                disabled={!Boolean(projectSalesId) && field.disableOnEdit}
                                                isNew={Boolean(projectSalesId)}
                                                fields={initialData.fields}
                                                fieldData={field}
                                                errors={errors}
                                                touched={touched}
                                                label={field.fieldLabel}
                                                name={field.fieldName}
                                                type={field.type}
                                                setFieldValue={setFieldValue}
                                                required={field.required}
                                                fullWidth
                                                isTooltip={field.isTooltip}
                                                tooltipMessage={field.tooltipMessage}
                                                onChange={(e, val) => {
                                                  setNewSubMarketSegmentId(null);
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
                                                      disabled={!Boolean(projectSalesId) && field.disableOnEdit}
                                                      size="small"
                                                    >
                                                      <AddIcon color="primary" />
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
                                        </Grid> : field.fieldName === "currency" ? (
                                          <FormTypes
                                            {...field}
                                            disabled={!Boolean(projectSalesId) && field.disableOnEdit}
                                            isNew={Boolean(projectSalesId)}
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
                                            onChange={(e, val) => {
                                              if (val && val.currencyCode) {
                                                setFieldValue(
                                                  field.fieldName,
                                                  val.currencyCode
                                                );
                                                setCurrencySymbol(val.symbolNative);
                                              } else {
                                                setFieldValue(field.fieldName, "");
                                                setCurrencySymbol(null);
                                              }
                                            }}
                                          />
                                        ) : field.fieldName.trim() === "amount" ? (
                                          <FormTypes
                                           disabled={!Boolean(projectSalesId) && field.disableOnEdit}
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
                                            setFieldValue={setFieldValue}
                                            required={field.required}
                                            fullWidth
                                            isTooltip={field?.isTooltip || false}
                                            tooltipMessage={field?.tooltipMessage}
                                            size="small"
                                          />
                                        ) : <FormTypes
                                          {...field}
                                          isNew={Boolean(projectSalesId)}
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
                            disabled={!Boolean(projectSalesId) && field.disableOnEdit}
                            isNew={Boolean(projectSalesId)}
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
                            style={{ visibility: "hidden" }}
                          />
                        ))
                      );
                    })}
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  disabled={isSubmitting || loading}
                  onClick={close}
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
                if (marketSegmentDataSource.some(d => d.optionValue === data.parentMarketSegment)) {
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
                    const getMarketSegment = mainMarketSegmentDataSource.find(d => d.optionValue === data.parentMarketSegment);

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
