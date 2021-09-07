import { useEffect, useState, useContext } from "react";
import PropTypes from "prop-types";
import { Box, Button, Dialog, Grid, IconButton, InputAdornment, Tooltip } from "@material-ui/core";
import { Formik, Form } from "formik";
import { useHistory } from "react-router-dom";
import axiosInstance from "../../axios/axiosInstance";

import {
  getObjKeys,
  yupSchema,
  initializeDropdownById,
  opportunity,
  simplifyValues,
  setFieldsInAscendingOrder,
  formFieldNames,
  getCollaboratorDropdownDataSource,
  getOwnerDropdownDataSource,
} from "../../constants/helpers";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import CustomDialogHeader from "../../components/CustomDialog/CustomDialogHeader";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import FormTypes from "../../components/Helpers/FormTypes";
import CustomButton from "../../components/Helpers/CustomButton";
import AddIcon from "@material-ui/icons/AddCircle";
import InfoIcon from "@material-ui/icons/Info";
import CustomDialogContent from "../../components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "../../components/CustomDialog/CustomDialogFooter";
import { useData } from "../../StateProvider/Provider";
import { isMobile, isTablet } from "react-device-detect";
import { CustomDialogTransition } from "./../../constants/helpers";
import ManageMarketSegmentDialog from "../MarketSegment/ManageMarketSegmentDialog";

const arr = [...Array(9).keys()];

export default function NewOpportunityProjectSales({
  open,
  onSuccess,
  onClose,
  accountId,
  isRedirectTodetailPage,
  collaborators,
  users,
}) {
  const { opportunityApi } = opportunity;
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();

  const {
    state: { user, selectedEntity, permissions },
  }: any = useData();

  const [opportunityData, setOpportunityData] = useState({
    fields: [],
    initialValues: {},
  });

  const [additionalFieldName, setAdditionalFieldName] = useState("")

  const [formsData, setFormsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState(null);
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] =
    useState(0);

  const [showAddMarketSegmentDialog, setShowAddMarketSegmentDialog] = useState(false);
  const [mainMarketSegmentDataSource, setMainMarketSegmentDataSource] = useState([]);
  const [marketSegmentDataSource, setMarketSegmentDataSource] = useState([]);
  const [newMarketSegmentId, setNewMarketSegmentId] = useState(null);
  const [subMarketSegmentDataSource, setSubMarketSegmentDataSource] = useState([]);
  const [newSubMarketSegmentId, setNewSubMarketSegmentId] = useState(null);

  const [
    ownerCollaboratorCommonDataSource,
    setOwnerCollaboratorCommonDataSource,
  ] = useState([]);
  const [ownerDataSource, setOwnerDataSource] = useState([]);
  const [collaboratorDataSource, setCollaboratorDataSource] = useState([]);

  useEffect(() => {
    const processSteps = opportunityData.fields.find(
      (d) => d.type.toLowerCase() === "process"
    );
    if (processSteps) {
      opportunityData.fields.map((d) => {
        if (d.sectionName == processSteps.additionalInfoSection) {
          setAdditionalFieldName(d.sectionName)
        }
      });
    }

    if (users && collaborators) {
      setOwnerCollaboratorCommonDataSource(users);
      setOwnerDataSource(users);
      setCollaboratorDataSource(collaborators);
    } else {
      let ownerCollaboratorDropdownData = opportunityData.fields.filter(
        (d) => ["owner", "collaborator"].indexOf(d.fieldName) !== -1
      );
      if (ownerCollaboratorDropdownData.length > 0) {
        setOwnerCollaboratorCommonDataSource(ownerCollaboratorDropdownData[0].option);
        setOwnerDataSource(ownerCollaboratorDropdownData[0].option);
        setCollaboratorDataSource(ownerCollaboratorDropdownData[0].option);
      }
    }

    setFormsData(setFieldsInAscendingOrder(opportunityData.fields));
  }, [opportunityData.fields]);

  useEffect(() => {
    getOpportunityFields();
  }, []);

  const getOpportunityFields = () => {
    axiosInstance()
      .get(`/field?resource=Opportunity&entity=${selectedEntity}`)
      .then(({ data: { data } }) => {
        const newFields = [];
        const filterData = data.filter((d) => d.isCreate);

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

        filterData.forEach((_f) => {
          //  If this dialog opens from account details screen, make that account preselected

          if (
            accountId &&
            ["customerAccountName", "supplierAccountName"].some(
              (d) => d === _f.fieldData.fieldName
            )
          ) {
            _f = initializeDropdownById(_f, _f.fieldData.fieldName, accountId);
          }

          if (!(_f.fieldData.fieldName === "supplierAccountName")) {
            newFields.push(_f.fieldData);
          }
        });

        setOpportunityData({
          fields: newFields,
          initialValues: getObjKeys("", newFields),
        });
      });
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

  const handleSubmit = async (errors, setTouched, values, setErrors) => {
    if (Object.keys(errors).length) {
      opportunityData.fields.forEach((input) => {
        if (input.required || values[input.fieldName]) {
          setTouched(input.fieldName, true);
        }
      });
      setErrors({ ...errors });
    } else {
      handleCreateOpportunity(values);
    }
  };

  const handleCreateOpportunity = (values) => {
    if (accountId) values["supplierAccountName"] = [accountId];
    setLoading(true);
    axiosInstance()
      .post(`${opportunityApi}?entity=${selectedEntity}`, values)
      .then(({ data }) => {
        const newId = data.data._id;
        toastConfig.setToastConfig({
          open: true,
          type: "success",
          message: data.message,
        });
        if (isRedirectTodetailPage)
          history.push(`${opportunityApi}/detail/${newId}`);
        setLoading(false);
        onSuccess(newId);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setLoading(false);
      });
  };

  const onOwnerDropdownOpen = (selectedCollaborator) => {
    setOwnerDataSource(
      getOwnerDropdownDataSource(
        selectedCollaborator,
        ownerCollaboratorCommonDataSource
      )
    );
  };

  const onCollaboratorMultiselectOpen = (selectedOwnerId) => {
    setCollaboratorDataSource(
      getCollaboratorDropdownDataSource(
        selectedOwnerId,
        ownerCollaboratorCommonDataSource
      )
    );
  };

  return (
    <>
      <Dialog
        maxWidth="md"
        fullWidth
        fullScreen={isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        onClose={onClose}
        open={open}
        disableBackdropClick={true}
      >
        <CustomDialogHeader title="Create Opportunity" onClose={onClose} />

        {opportunityData.fields.length === 0 && (
          <CustomDialogContent>
            <CommonSkeleton lenArray={arr} />
          </CustomDialogContent>
        )}
        {opportunityData.fields.length > 0 && (
          <Formik
            initialValues={opportunityData.initialValues}
            validationSchema={yupSchema(opportunityData.fields)}
            validateOnMount
            onSubmit={() => { }}
          >
            {({
              values,
              errors,
              touched,
              setFieldValue,
              setFieldTouched,
              setErrors,
            }) => (
              <>
                <CustomDialogContent>
                  <Form>
                    {formsData &&
                      formsData
                        .filter((item) => item.name !== additionalFieldName)
                        .map((form, i) => {
                          return form.name ? (
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
                                      {field.fieldName === "owner" ? (
                                        <FormTypes
                                          values={values}
                                          errors={errors}
                                          touched={touched}
                                          label={field.fieldLabel}
                                          name={field.fieldName}
                                          type={field.type}
                                          options={ownerDataSource}
                                          setFieldValue={setFieldValue}
                                          required={field.required}
                                          fullWidth
                                          isTooltip={field?.isTooltip || false}
                                          tooltipMessage={field?.tooltipMessage}
                                          size="small"
                                          onChange={(e, val) => {
                                            setFieldValue(
                                              field.fieldName,
                                              val && val.optionValue
                                                ? val.optionValue
                                                : ""
                                            );

                                            if (
                                              val &&
                                              val.optionValue !== user?.user?._id
                                            ) {
                                              const checkOwnerAddedInCollaborator =
                                                values["collaborator"].find(
                                                  (d) =>
                                                    d?.optionValue ===
                                                    user?.user?._id
                                                );
                                              if (
                                                !checkOwnerAddedInCollaborator
                                              ) {
                                                setFieldValue("collaborator", [
                                                  ...values["collaborator"],
                                                  collaboratorDataSource.find(
                                                    (d) =>
                                                      d?.optionValue ===
                                                      user?.user?._id
                                                  ).optionValue,
                                                ]);
                                              }
                                            }
                                          }}
                                          onOpen={() => {
                                            onOwnerDropdownOpen(
                                              values["collaborator"]
                                            );
                                          }}
                                        />
                                      ) : field.fieldName === "collaborator" ? (
                                        <FormTypes
                                          values={values}
                                          errors={errors}
                                          touched={touched}
                                          label={field.fieldLabel}
                                          name={field.fieldName}
                                          type={field.type}
                                          options={collaboratorDataSource}
                                          setFieldValue={setFieldValue}
                                          required={field.required}
                                          fullWidth
                                          isTooltip={field?.isTooltip || false}
                                          tooltipMessage={field?.tooltipMessage}
                                          size="small"
                                          onOpen={() =>
                                            onCollaboratorMultiselectOpen(
                                              values["owner"]
                                            )
                                          }
                                        />
                                      ) : field.fieldName === "probability" ? (
                                        <FormTypes
                                          // {...rest}
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
                                          onChange={(e) => {
                                            if (
                                              e.target.value &&
                                              parseFloat(e.target.value) > 100
                                            ) {
                                              setFieldValue("probability", "100");
                                            } else {
                                              setFieldValue(
                                                "probability",
                                                e.target.value
                                              );
                                            }
                                          }}
                                        />
                                      ) : field.fieldName === "lostReason" ? (
                                        values["stage"] === "Closed Lost" ? (
                                          <FormTypes
                                            // {...rest}
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
                                        ) : null
                                      ) : field.fieldName === "currency" ? (
                                        <FormTypes
                                          // {...rest}
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
                                      ) : field.fieldName === "amount" ? (
                                        <FormTypes
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
                                      ) : field.fieldName === formFieldNames.marketSegment ? <Grid key={field.fieldName} item xs={12} sm={12} md={12}>
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
                                              fields={opportunityData.fields}
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
                                            // permissions.productCategory
                                            //     .isCreate
                                            permissions.marketSegment.isCreate && (
                                              <Grid item xs={1} sm={1} md={1}>
                                                <Tooltip
                                                  title="Add Market Segment"
                                                  className="mt-1"
                                                >
                                                  <IconButton
                                                    onClick={() => { setShowAddMarketSegmentDialog(true); }}
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
                                        : field.fieldName === formFieldNames.subMarketSegment ? <Grid key={field.fieldName} item xs={12} sm={12} md={12}>
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
                                                fields={opportunityData.fields}
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
                                          : (
                                            <FormTypes
                                              // {...rest}
                                              disabled={
                                                field.fieldName ===
                                                "customerAccountName"
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
                          ) : (
                            form.sectionFields.map((field) => (
                              <FormTypes
                                // {...rest}
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
                    type="button"
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={onClose}
                  >
                    Cancel
                  </Button>

                  <CustomButton
                    loading={loading}
                    variant="contained"
                    color="primary"
                    disabled={
                      uploadingImageOrFileProgress > 0 ||
                      Object.values(
                        simplifyValues(
                          opportunityData.initialValues,
                          opportunityData.fields
                        )
                      ).toString() ===
                      Object.values(
                        simplifyValues(values, opportunityData.fields)
                      ).toString()
                    }
                    onClick={(e) => {
                      e.preventDefault();
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
                      handleSubmit(
                        errors,
                        setFieldTouched,
                        values,

                        setErrors
                      );
                    }}
                  >
                    Save
                  </CustomButton>
                </CustomDialogFooter>
              </>
            )}
          </Formik>
        )}
      </Dialog>
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
    </>
  );
}

NewOpportunityProjectSales.propTypes = {
  open: PropTypes.bool,
  onSuccess: PropTypes.func,
  onClose: PropTypes.any,
  isNew: PropTypes.bool,
  dataToUpdate: PropTypes.any,
  accountId: PropTypes.string,
  isRedirectToDetailPage: PropTypes.bool,
};
