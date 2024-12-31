import { Box, IconButton, InputAdornment } from '@mui/material';
import Grid from '@mui/material/Grid2';
import Dialog from '@mui/material/Dialog';
import AddIcon from '@mui/icons-material/AddCircle';
import GetAppIcon from '@mui/icons-material/GetApp';
import InfoIcon from '@mui/icons-material/Info';
import { Form, Formik } from 'formik';
import { isEqual } from 'lodash';
import PropTypes from 'prop-types';
import { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { FaDiceOne } from 'react-icons/fa';
import { useHistory } from 'react-router-dom';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import FormTypes from '../../../components/Helpers/FormTypes';
import routes from '../../../components/Helpers/Routes';
import {
  CustomDialogTransition,
  GenerateResourceLineNumber,
  customerAccount,
  formFieldNames,
  getObjKeys,
  getObjKeysWithValues,
  getUniqueCurrencies,
  initializeDropdownById,
  quoteBuilder,
  setFieldsInAscendingOrder,
  yupSchema
} from '../../../constants/helpers';
import ManageOpportunityDialog from '../../Opportunities/ManageOpportunityDialog';
import CreateProjectSales from '../../ProjectSales/CreateProjectSales';
import { ThemeButton } from 'src/components/Helpers/Buttons';
export default function ManageQuoteDialog({
  open,
  onSuccess,
  onClose,
  isNew,
  isClone = false,
  dataToUpdate,
  accountId,
  resource, // either called from customer account or supplier account
  contactId = null,
  opportunityId = null,
  accountResource = null,
  isRedirectTodetailPage,
  userId = null,
  disableOwnerDropDown = false,
  isRenderedFromOpportunity = false,
  opportunityName = null,
  isRenderedFromCustomerAccount = false,
  contacts = null,
  marketSegmentId = null,
  subMarketSegmentId = null,
  currency = null,
  estimatedAmount = null,
  doaCollaboratorResources = null,
  editCurrency = false,
  quoteApproved = false,
  isRenderedFromProjectSales = false,
  cloneQuoteWithVersionNumber = 0,
  isCreateQuoteFromCart = false,
  onHandleSubmit = null,
  isFromProjectSales = false,
  projectSalesTeam = []
}) {
  const { qbApi } = quoteBuilder;
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();

  const {
    state: { user, selectedEntity, permissions }
  }: any = useData();
  const [initialData, setInitialData] = useState({
    fields: [],
    values: {}
  });

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formsData, setFormsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState(null);
  const [showAddProjectSalesDialog, setShowAddProjectSalesDialog] = useState(false);
  const [showCreateOpportunity, setShowCreateOpportunity] = useState(false);
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);
  const [opportunityMainDataSource, setOpportunityMainDataSource] = useState([]);
  const [projectSalesMainDataSource, setProjectSalesMainDataSource] = useState([]);
  const [opportunityDataSource, setOpportunityDataSource] = useState([]);
  const [projectSalesDataSource, setProjectSalesDataSource] = useState([]);
  const [customError, setCustomError] = useState({});

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const ref = useRef(null);

  useEffect(() => {
    if (initialData.fields.length === 0 && Object.keys(customError).length > 0) {
      setCustomError({});
    }
  }, [initialData]);

  useEffect(() => {
    const opportunityDropDownData = initialData.fields.find((field) => field.fieldName === 'opportunity');

    const projectSalesDropDownData = initialData.fields.find((field) => field.fieldName === 'projectSales');

    if (projectSalesDropDownData) {
      setProjectSalesMainDataSource(projectSalesDropDownData.option);
      if (isNew) {
        setProjectSalesDataSource(
          projectSalesDropDownData.option.filter(
            (d) => d?.customerAccount && d?.customerAccount.indexOf(initialData.values['customerAccountName']) >= 0
          )
        );
      }

      if (!isNew) {
        setProjectSalesDataSource(
          projectSalesDropDownData.option.filter(
            (d) => d?.customerAccount && d?.customerAccount.indexOf(dataToUpdate.customerAccountName.optionValue) >= 0
          )
        );
      }
    }

    if (opportunityDropDownData) {
      setOpportunityMainDataSource(opportunityDropDownData.option);

      if (!isNew) {
        setOpportunityDataSource(
          opportunityDropDownData.option.filter((d) => d.customerAccountName === dataToUpdate.customerAccountName.optionValue)
        );
      }

      if (isNew && opportunityId) {
        setOpportunityDataSource(opportunityDropDownData.option.filter((d) => d.customerAccountName === initialData.values['customerAccount']));
      }
    }

    setFormsData(setFieldsInAscendingOrder(initialData.fields));
  }, [initialData.fields]);

  const onOpportunityDropDownOpen = (selectedAccount) => {
    setOpportunityDataSource(opportunityMainDataSource.filter((opportunity) => opportunity.customerAccountName === selectedAccount));
  };

  const onProjectSalesDropDownOpen = (selectedAccount) => {
    setProjectSalesDataSource(
      projectSalesMainDataSource.filter(
        (projectSales) => projectSales?.customerAccount && projectSales?.customerAccount.indexOf(selectedAccount) >= 0
      )
    );
  };

  useEffect(() => {
    getQuoteFields();
    return () => {
      setCurrencySymbol(null);
      setInitialData({
        fields: [],
        values: {}
      });
    };
  }, []);

  const getQuoteFields = () => {
    axiosInstance()
      .get(`/field?resource=Quotes&entity=${selectedEntity}`)
      .then(({ data: { data } }) => {
        if (!quoteApproved) {
          data = data.filter((_f) => _f.fieldData.sectionName !== 'Post-Quote Information');
        }

        const newFields = [];

        const filterData = isNew ? data.filter((d) => d?.isCreate) : data.filter((d) => d?.isUpdate);

        filterData.map((_f) => {
          //  If this dialog opens from account details screen, make that account preselected

          if (accountId && _f.fieldData.fieldName === 'customerAccountName') {
            _f = initializeDropdownById(_f, _f.fieldData.fieldName, accountId);
          }

          if (contactId && _f.fieldData.fieldName === 'customerContactName') {
            _f = initializeDropdownById(_f, _f.fieldData.fieldName, contactId);
          }

          if (opportunityId && _f.fieldData.fieldName === 'opportunity') {
            _f = initializeDropdownById(_f, _f.fieldData.fieldName, opportunityId);
          }

          if (marketSegmentId && _f.fieldData.fieldName === formFieldNames.marketSegment) {
            _f = initializeDropdownById(_f, _f.fieldData.fieldName, marketSegmentId);
          }
          if (subMarketSegmentId && _f.fieldData.fieldName === formFieldNames.subMarketSegment) {
            _f = initializeDropdownById(_f, _f.fieldData.fieldName, subMarketSegmentId);
          }

          if (!isNew && _f.fieldData.fieldName === 'currency') {
            setCurrencySymbol(getUniqueCurrencies().find((d) => d.currencyCode === dataToUpdate['currency'])?.symbolNative);
          }
          if (isNew && userId && _f.fieldData.fieldName === 'owner') {
            _f = initializeDropdownById(_f, _f.fieldData.fieldName, userId);
          }

          if (_f.fieldData.fieldName !== 'supplierAccountName') {
            newFields.push(_f.fieldData);
          }
        });
        let initialData = getObjKeys('', newFields);
        if (
          (isRenderedFromOpportunity || isRenderedFromProjectSales) &&
          (filterData?.some((e) => e.fieldData.fieldName === 'opportunity') || filterData?.some((e) => e.fieldData.fieldName === 'projectSales'))
        ) {
          if (opportunityName) {
            initialData['quoteName'] = opportunityName;
          }
          initialData['currency'] = currency || '';
        } else {
          if (isNew) {
            const selectedEntityDetails = user?.entity?.find((d) => d?._id === selectedEntity);
            const defaultQuotePdfTemplateId = user.user?.quotePDFTemplate ?? '';

            if (selectedEntityDetails && filterData?.some((e) => e.fieldData.fieldName === 'currency')) {
              initialData['currency'] = selectedEntityDetails.currency || '';
              setCurrencySymbol(getUniqueCurrencies().find((d) => d.currencyCode === initialData['currency'])?.symbolNative);
            }
            if (filterData?.some((e) => e.fieldData.fieldName === 'pDFTemplate')) {
              initialData['pDFTemplate'] = defaultQuotePdfTemplateId;
            }
          }
        }

        if (isClone) {
          let tempQuoteData = JSON.parse(JSON.stringify(dataToUpdate));
          const { _id, createdBy, updatedBy, quoteName, versions, ...rest } = tempQuoteData;
          rest.owner = user?.user?._id;
          rest['quoteName'] = GenerateResourceLineNumber(newFields);
          setInitialData({
            fields: newFields,
            values: {
              ...getObjKeysWithValues(rest, newFields, true, user)
            }
          });
        } else {
          setInitialData({
            fields: newFields,
            values: isNew ? initialData : getObjKeysWithValues(dataToUpdate, newFields)
          });
        }
      });
  };

  const onSubmit = (values) => {
    isCreateQuoteFromCart
      ? onHandleSubmit(values)
      : isClone
        ? handleCloneQuote(values)
        : isNew
          ? handleCreateQuote(values)
          : handleUpdateQuote(values);
  };

  const handleCloneQuote = (values) => {
    setLoading(true);
    if (
      accountId &&
      accountResource !== customerAccount.accountResource &&
      !isRenderedFromOpportunity &&
      initialData?.fields?.some((e) => e.fieldName === 'supplierAccountName')
    )
      values['supplierAccountName'] = [accountId];
    if (values.customerContactName === '' && initialData?.fields?.some((e) => e.fieldName === 'customerContactName')) {
      values.customerContactName = [];
    }
    if (cloneQuoteWithVersionNumber > 0) {
      values = {
        ...values,
        quoteId: dataToUpdate._id,
        versionNumber: `${cloneQuoteWithVersionNumber}`
      };
    }
    const apiUrl = cloneQuoteWithVersionNumber > 0 ? `${qbApi}/create/clone-v` : `${qbApi}?entity=${selectedEntity}`;
    axiosInstance()
      .post(apiUrl, values)
      .then(({ data }) => {
        const newId = data.data._id;
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });

        history.push(`${routes.quoteBuilder.path}/detail/${newId}`);

        setLoading(false);
        // onSuccess(newId);
        onClose();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setLoading(false);
      });
  };

  const handleCreateQuote = (values) => {
    // values.closeDate = "03/03/2021"
    if (
      accountId &&
      accountResource !== customerAccount.accountResource &&
      !isRenderedFromOpportunity &&
      initialData?.fields?.some((e) => e.fieldName === 'supplierAccountName')
    )
      values['supplierAccountName'] = [accountId];
    setLoading(true);
    if (values.customerContactName === '' && initialData?.fields?.some((e) => e.fieldName === 'customerContactName')) {
      values.customerContactName = [];
    }
    axiosInstance()
      .post(`${qbApi}?entity=${selectedEntity}`, values)
      .then(({ data }) => {
        const newId = data.data._id;
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        if (isRedirectTodetailPage) history.push(`${routes.quoteBuilder.path}/detail/${newId}`);
        setLoading(false);
        onSuccess(newId);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setLoading(false);
      });
  };

  const handleUpdateQuote = (values) => {
    values = { ...values, _id: dataToUpdate._id };
    setLoading(true);

    axiosInstance()
      .put(`${qbApi}?entity=${selectedEntity}`, values)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setLoading(false);
        onSuccess();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setLoading(false);
      });
  };

  const updateOpportunityDropdown = (data) => {
    const entityFields = initialData.fields;
    const opportunityFieldIndex = entityFields.findIndex((d) => d.fieldName === 'opportunity');

    if (opportunityFieldIndex > -1) {
      let newOpportunity = {
        optionValue: data._id,
        optionLabel: data.opportunityName,
        order: entityFields[opportunityFieldIndex].option.length,
        default: false,
        customerAccountName: data.customerAccountName
      };
      entityFields[opportunityFieldIndex].option = [...entityFields[opportunityFieldIndex].option, newOpportunity];

      setOpportunityMainDataSource(entityFields[opportunityFieldIndex].option);

      setOpportunityDataSource((prevState) => [...prevState, newOpportunity]);
    }
  };

  const updateProjectSalesDropdown = (data) => {
    const entityFields = initialData.fields;
    const projectSalesFieldIndex = entityFields.findIndex((d) => d.fieldName === 'projectSales');

    if (projectSalesFieldIndex > -1) {
      let newProjectSales = {
        optionValue: data._id,
        optionLabel: data.projectName,
        order: entityFields[projectSalesFieldIndex].option.length,
        default: false,
        customerAccount: data?.accountId ? [data?.accountId] : []
      };
      entityFields[projectSalesFieldIndex].option = [...entityFields[projectSalesFieldIndex].option, newProjectSales];

      setProjectSalesMainDataSource(entityFields[projectSalesFieldIndex].option);
      setProjectSalesDataSource((prevState) => [...prevState, newProjectSales]);
    }
  };

  const handleErrors = (values) => {
    let tempErrors = customError;

    if (values?.quoteAcceptDate && values?.salesOrderCreationDate && new Date(values?.quoteAcceptDate) > new Date(values?.salesOrderCreationDate)) {
      tempErrors['quoteAcceptDate'] = 'Quote Accept Date should be less than Sales Order Creation Date';
    } else if (tempErrors['quoteAcceptDate']) {
      delete tempErrors['quoteAcceptDate'];
    }

    if (
      values?.salesOrderCreationDate &&
      values?.invoiceCreationDate &&
      new Date(values?.salesOrderCreationDate) > new Date(values?.invoiceCreationDate)
    ) {
      tempErrors['salesOrderCreationDate'] = 'Sales Order Creation Date should be less than Invoice Creation Date';
    } else if (tempErrors['salesOrderCreationDate']) {
      delete tempErrors['salesOrderCreationDate'];
    }

    if (values?.invoiceCreationDate && values?.invoicedDate && new Date(values?.invoiceCreationDate) > new Date(values?.invoicedDate)) {
      tempErrors['invoiceCreationDate'] = 'Invoice Creation Date should be less than Invoiced Date';
    } else if (tempErrors['invoiceCreationDate']) {
      delete tempErrors['invoiceCreationDate'];
    }
    setCustomError({ ...tempErrors });
  };

  const previewPdfTemplate = (templateId) => {
    toastConfig.setToastConfig({
      // hideDuration: null,
      open: true,
      type: 'info',
      message: `Downloading preview file, Please wait...`
    });

    axiosInstance()
      .get(`${qbApi}/getdummy/${templateId}`, {
        responseType: 'blob'
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'File downloaded Successfully'
        });

        const file = new Blob([data], { type: 'application/pdf' });
        const fileURL = URL.createObjectURL(file);
        const pdfWindow = window.open();
        pdfWindow.location.href = fileURL;
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleScroll = (errors) => {
    const err = Object.keys(errors);
    if (err.length) {
      const input = document.querySelector(`input[name=${err[0]}]`);

      input.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'start'
      });
    }
  };

  return (
    <>
      <Dialog
        maxWidth="md"
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {
            setShowConfirmDialog(true);
          }
        }}
        open={open}
        fullWidth
        fullScreen={fullScreen || isMobile || isTablet}
      >
        {initialData?.fields?.length ? (
          <Formik
            initialValues={initialData.values}
            validationSchema={yupSchema(initialData.fields)}
            validateOnMount
            innerRef={ref}
            onSubmit={onSubmit}
          >
            {({ submitForm, values, errors, touched, setFieldValue }) => (
              <Fragment>
                <CustomDialogHeader
                  title={isNew ? 'Create Quote' : isClone ? `Clone - ${dataToUpdate.quoteName}` : `Editing ${dataToUpdate.quoteName}`}
                  onClose={() => {
                    if (isEqual(initialData.values, values)) onClose();
                    else setShowConfirmDialog(true);
                  }}
                  isMinimized={!fullScreen}
                  onMinimizeMaximize={() => {
                    setFullScreen((prevState) => !prevState);
                  }}
                  showManimizeMaximize={true}
                />
                <CustomDialogContent>
                  <Form autoComplete="off" autoCorrect="off" noValidate>
                    {formsData &&
                      formsData.map((form, index1) => {
                        return (
                          form.name && (
                            <div key={index1}>
                              <div className={'detail-box-content'}>
                                <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                                <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>{form.name}</h2>
                              </div>
                              <Box marginY={2}>
                                <Grid spacing={3} container>
                                  {form.sectionFields.map((field, index2) => (
                                    <Grid key={index2} size={{ xs: 12, sm: 6, md: 6 }}>
                                      {field.fieldName === 'quoteName' ? (
                                        <FormTypes
                                          {...field}
                                          isNew={isNew}
                                          values={values}
                                          errors={errors}
                                          touched={touched}
                                          label={field.fieldLabel}
                                          name={field.fieldName}
                                          type={field.type}
                                          disabled={field.isUneditable || isRenderedFromOpportunity || (!isNew && field.disableOnEdit)}
                                          options={field.option}
                                          setFieldValue={(name, value) => {
                                            setFieldValue(name, value);
                                          }}
                                          required={field.required}
                                          fullWidth
                                          isTooltip={field?.isTooltip || false}
                                          tooltipMessage={field?.tooltipMessage}
                                          size="small"
                                        // doNotShowInfoTooltip={true}
                                        // onChange={(e, value) => {
                                        //   setFieldValue(field.fieldName, value && value.optionValue ? value.optionValue : "");
                                        //   setFieldValue("customerContactName", [])
                                        // }}
                                        />
                                      ) : field.fieldName === 'opportunity' ? (
                                        <Grid container spacing={1}>
                                          <Grid
                                            size={{
                                              xs: permissions.opportunity?.isCreate && !isRenderedFromOpportunity ? 11 : 11,
                                              sm: permissions.opportunity?.isCreate && !isRenderedFromOpportunity ? 11 : 11,
                                              md: permissions.opportunity?.isCreate && !isRenderedFromOpportunity ? 11 : 11
                                            }}
                                          >
                                            <FormTypes
                                              {...field}
                                              isNew={isNew}
                                              values={values}
                                              errors={errors}
                                              touched={touched}
                                              label={field.fieldLabel}
                                              name={field.fieldName}
                                              type={field.type}
                                              options={opportunityDataSource}
                                              disabled={!isClone ? isRenderedFromOpportunity || (!isNew && field.disableOnEdit) : false}
                                              setFieldValue={(name, value) => {
                                                setFieldValue(name, value);
                                              }}
                                              required={field.required}
                                              fullWidth
                                              isTooltip={field?.isTooltip || false}
                                              tooltipMessage={field?.tooltipMessage}
                                              doNotShowInfoTooltip={true}
                                              size="small"
                                              onOpen={() => onOpportunityDropDownOpen(values.customerAccountName)}
                                            />
                                          </Grid>
                                          {permissions.opportunity?.isCreate && !isRenderedFromOpportunity && (
                                            <Grid size={{ xs: 1, sm: 1, md: 1 }}>
                                              <HtmlTooltip title="Create Opportunity" className="mt-1">
                                                <IconButton
                                                  onClick={() => {
                                                    setShowCreateOpportunity(true);
                                                  }}
                                                  disabled={!isClone ? isRenderedFromOpportunity || (!isNew && field.disableOnEdit) : false}
                                                  size="small"
                                                >
                                                  <AddIcon
                                                    color={
                                                      isClone
                                                        ? 'primary'
                                                        : isRenderedFromOpportunity || (!isNew && field.disableOnEdit)
                                                          ? 'disabled'
                                                          : 'primary'
                                                    }
                                                  />
                                                </IconButton>
                                              </HtmlTooltip>
                                            </Grid>
                                          )}
                                          {field?.tooltipMessage ? (
                                            <Grid size={{ xs: 1, sm: 1, md: 1 }}>
                                              <HtmlTooltip title={field?.tooltipMessage ?? ''}>
                                                <InfoIcon color="disabled" />
                                              </HtmlTooltip>
                                            </Grid>
                                          ) : null}
                                        </Grid>
                                      ) : field.fieldName === 'pDFTemplate' ? (
                                        <Grid container spacing={1}>
                                          <Grid size={{ xs: 11, sm: 11, md: 11 }}>
                                            <FormTypes
                                              {...field}
                                              isNew={isNew}
                                              disabled={!isClone ? !isNew && field.disableOnEdit : false}
                                              values={values}
                                              errors={errors}
                                              touched={touched}
                                              label={field.fieldLabel}
                                              name={field.fieldName}
                                              type={field.type}
                                              options={field.option}
                                              setFieldValue={(name, value) => {
                                                setFieldValue(name, value);
                                              }}
                                              required={field.required}
                                              fullWidth
                                              isTooltip={field?.isTooltip || false}
                                              tooltipMessage={field?.tooltipMessage}
                                              doNotShowInfoTooltip={true}
                                              size="small"
                                            />
                                          </Grid>
                                          <Grid size={{ xs: 1, sm: 1, md: 1 }}>
                                            <HtmlTooltip title="Preview PDF Template" className="mt-1">
                                              <IconButton
                                                disabled={!values.pDFTemplate}
                                                onClick={() => {
                                                  previewPdfTemplate(values.pDFTemplate);
                                                }}
                                                size="small"
                                              >
                                                <GetAppIcon color={values.pDFTemplate ? 'primary' : 'disabled'} />
                                              </IconButton>
                                            </HtmlTooltip>
                                          </Grid>
                                          {field?.tooltipMessage ? (
                                            <Grid size={{ xs: 1, sm: 1, md: 1 }}>
                                              <HtmlTooltip title={field?.tooltipMessage ?? ''}>
                                                <InfoIcon color="disabled" />
                                              </HtmlTooltip>
                                            </Grid>
                                          ) : null}
                                        </Grid>
                                      ) : field.fieldName === 'probability' ? (
                                        <FormTypes
                                          {...field}
                                          // {...rest}
                                          isNew={isNew}
                                          disabled={!isClone ? !isNew && field.disableOnEdit : false}
                                          values={values}
                                          errors={errors}
                                          touched={touched}
                                          label={field.fieldLabel}
                                          name={field.fieldName}
                                          type={field.type}
                                          options={field.option}
                                          setFieldValue={(name, value) => {
                                            setFieldValue(name, value);
                                          }}
                                          required={field.required}
                                          fullWidth
                                          isTooltip={field?.isTooltip || false}
                                          tooltipMessage={field?.tooltipMessage}
                                          size="small"
                                          onChange={(e) => {
                                            if (e.target.value && parseFloat(e.target.value) > 100) {
                                              setFieldValue('probability', '100');
                                            } else {
                                              setFieldValue('probability', e.target.value);
                                            }
                                          }}
                                        />
                                      ) : field.fieldName === 'lostReason' ? (
                                        values['stage'] === 'Closed Lost' ? (
                                          <FormTypes
                                            {...field}
                                            isNew={isNew}
                                            disabled={!isClone ? !isNew && field.disableOnEdit : false}
                                            values={values}
                                            errors={errors}
                                            touched={touched}
                                            label={field.fieldLabel}
                                            name={field.fieldName}
                                            type={field.type}
                                            options={field.option}
                                            setFieldValue={(name, value) => {
                                              setFieldValue(name, value);
                                            }}
                                            required={field.required}
                                            fullWidth
                                            isTooltip={field?.isTooltip || false}
                                            tooltipMessage={field?.tooltipMessage}
                                            size="small"
                                          />
                                        ) : null
                                      ) : field.fieldName === 'currency' ? (
                                        <FormTypes
                                          {...field}
                                          isNew={isNew}
                                          disabled={!isClone && !isNew ? !editCurrency || field.disableOnEdit : false}
                                          values={values}
                                          errors={errors}
                                          touched={touched}
                                          label={field.fieldLabel}
                                          name={field.fieldName}
                                          type={field.type}
                                          options={field.option}
                                          setFieldValue={(name, value) => {
                                            setFieldValue(name, value);
                                          }}
                                          required={field.required}
                                          fullWidth
                                          isTooltip={field?.isTooltip || false}
                                          tooltipMessage={field?.tooltipMessage}
                                          size="small"
                                          onChange={(e, val) => {
                                            if (val && val.currencyCode) {
                                              setFieldValue(field.fieldName, val.currencyCode);
                                              setCurrencySymbol(val.symbolNative);
                                            } else {
                                              setFieldValue(field.fieldName, '');
                                              setCurrencySymbol(null);
                                            }
                                          }}
                                        />
                                      ) : field.fieldName === 'estimatedAmount' || field.fieldName === 'invoiceAmount' ? (
                                        <FormTypes
                                          {...field}
                                          // {...rest}
                                          isNew={isNew}
                                          disabled={!isClone ? !isNew && field.disableOnEdit : false}
                                          selectedCurrencyCode={values['currency']}
                                          startAdornment={currencySymbol ? <InputAdornment position="start">{currencySymbol}</InputAdornment> : ''}
                                          values={values}
                                          errors={errors}
                                          touched={touched}
                                          label={field.fieldLabel}
                                          name={field.fieldName}
                                          type={field.type}
                                          options={field.option}
                                          setFieldValue={(name, value) => {
                                            setFieldValue(name, value);
                                          }}
                                          required={field.required}
                                          fullWidth
                                          isTooltip={field?.isTooltip || false}
                                          tooltipMessage={field?.tooltipMessage}
                                          size="small"
                                        />
                                      ) : field.fieldName === 'expiryDate' ? (
                                        <FormTypes
                                          {...field}
                                          // {...rest}
                                          disablePast={true}
                                          isNew={isNew}
                                          disabled={!isClone ? !isNew && field.disableOnEdit : false}
                                          selectedCurrencyCode={values['currency']}
                                          values={values}
                                          errors={errors}
                                          touched={touched}
                                          label={field.fieldLabel}
                                          name={field.fieldName}
                                          type={field.type}
                                          options={field.option}
                                          setFieldValue={(name, value) => {
                                            setFieldValue(name, value);
                                          }}
                                          required={field.required}
                                          fullWidth
                                          isTooltip={field?.isTooltip || false}
                                          tooltipMessage={field?.tooltipMessage}
                                          size="small"
                                        />
                                      ) : ['quoteAcceptDate', 'salesOrderCreationDate', 'invoiceCreationDate', 'invoicedDate'].indexOf(
                                        field?.fieldName
                                      ) >= 0 ? (
                                        <FormTypes
                                          {...field}
                                          // {...rest}
                                          isNew={isNew}
                                          disabled={!isClone ? !isNew && field.disableOnEdit : false}
                                          values={values}
                                          errors={errors}
                                          touched={touched}
                                          label={field.fieldLabel}
                                          name={field.fieldName}
                                          type={field.type}
                                          options={field.option}
                                          setFieldValue={(name, value) => {
                                            setFieldValue(name, value);
                                          }}
                                          required={field.required}
                                          fullWidth
                                          isTooltip={field?.isTooltip || false}
                                          tooltipMessage={field?.tooltipMessage}
                                          size="small"
                                          imageOrFileUploadCompletePercentage={
                                            ['imageUpload', 'fileUpload'].some((s) => s === field.type)
                                              ? (completePercentage) => {
                                                setUploadingImageOrFileProgress(completePercentage);
                                              }
                                              : null
                                          }
                                          customError={customError}
                                          onChange={(date) => {
                                            setFieldValue(field.fieldName, date);
                                            handleErrors({
                                              ...values,
                                              [field.fieldName]: date
                                            });
                                          }}
                                        />
                                      ) : field.fieldName == 'projectSales' ? (
                                        <Grid container spacing={1}>
                                          <Grid
                                            size={{
                                              xs: permissions?.projectSales?.isCreate ? 10 : 11,
                                              sm: permissions?.projectSales?.isCreate ? 10 : 11,
                                              md: permissions?.projectSales?.isCreate ? 10 : 11
                                            }}
                                          >
                                            <FormTypes
                                              {...field}
                                              isNew={isNew}
                                              values={values}
                                              errors={errors}
                                              touched={touched}
                                              label={field.fieldLabel}
                                              name={field.fieldName}
                                              type={field.type}
                                              options={projectSalesDataSource}
                                              disabled={!isClone ? !isNew && field.disableOnEdit : false}
                                              setFieldValue={(name, value) => {
                                                setFieldValue(name, value);
                                              }}
                                              required={field.required}
                                              fullWidth
                                              isTooltip={field?.isTooltip || false}
                                              tooltipMessage={field?.tooltipMessage}
                                              doNotShowInfoTooltip={true}
                                              size="small"
                                              onOpen={() => onProjectSalesDropDownOpen(values.customerAccountName)}
                                            />
                                          </Grid>
                                          {permissions?.projectSales?.isCreate && (
                                            <Grid size={{ xs: 1, sm: 1, md: 1 }}>
                                              <HtmlTooltip title="Add Project List" className="mt-1">
                                                <IconButton
                                                  onClick={() => {
                                                    setShowAddProjectSalesDialog(true);
                                                  }}
                                                  disabled={!isClone ? !isNew && field.disableOnEdit : false}
                                                  size="small"
                                                >
                                                  <AddIcon color={isClone ? 'primary' : !isNew && field.disableOnEdit ? 'disabled' : 'primary'} />
                                                </IconButton>
                                              </HtmlTooltip>
                                            </Grid>
                                          )}
                                          {field?.tooltipMessage ? (
                                            <Grid size={{ xs: 1, sm: 1, md: 1 }}>
                                              <HtmlTooltip title={field?.tooltipMessage ?? ''}>
                                                <InfoIcon color="disabled" />
                                              </HtmlTooltip>
                                            </Grid>
                                          ) : null}
                                        </Grid>
                                      ) : (
                                        <FormTypes
                                          {...field}
                                          isNew={isNew}
                                          disabled={!isClone ? !isNew && field.disableOnEdit : false}
                                          values={values}
                                          errors={errors}
                                          touched={touched}
                                          label={field.fieldLabel}
                                          name={field.fieldName}
                                          type={field.type}
                                          options={field.option}
                                          setFieldValue={(name, value) => {
                                            setFieldValue(name, value);
                                          }}
                                          required={field.required}
                                          fullWidth
                                          isTooltip={field?.isTooltip || false}
                                          tooltipMessage={field?.tooltipMessage}
                                          size="small"
                                          imageOrFileUploadCompletePercentage={
                                            ['imageUpload', 'fileUpload'].some((s) => s === field.type)
                                              ? (completePercentage) => {
                                                setUploadingImageOrFileProgress(completePercentage);
                                              }
                                              : null
                                          }
                                          fieldData={field}
                                          fields={initialData?.fields}
                                        />
                                      )}
                                    </Grid>
                                  ))}
                                </Grid>
                              </Box>
                            </div>
                          )
                        );
                      })}
                  </Form>
                </CustomDialogContent>
                <CustomDialogFooter>
                  <ThemeButton
                    buttonType="transparent"
                    onClick={() => {
                      if (isEqual(initialData.values, values)) onClose();
                      else setShowConfirmDialog(true);
                    }}
                  >
                    Cancel
                  </ThemeButton>

                  <ThemeButton
                    isLoading={loading}
                    buttonType="theme"
                    disabled={loading || uploadingImageOrFileProgress > 0}
                    onClick={(e) => {
                      e.preventDefault();
                      handleScroll({ ...errors, ...customError });
                      submitForm();
                    }}
                  >
                    Save
                  </ThemeButton>
                </CustomDialogFooter>
                {showConfirmDialog ? (
                  <ConfirmCancelDialog
                    open={showConfirmDialog}
                    onSave={() => {
                      setShowConfirmDialog(false);
                      handleScroll({ ...errors, ...customError });
                      submitForm();
                    }}
                    onClose={() => {
                      setShowConfirmDialog(false);
                      onClose();
                    }}
                  />
                ) : null}
                {showCreateOpportunity && (
                  <ManageOpportunityDialog
                    isNew={true}
                    opportunityId={null}
                    isRedirectTodetailPage={false}
                    open={showCreateOpportunity}
                    onClose={() => setShowCreateOpportunity(false)}
                    onSuccess={({ data }) => {
                      setShowCreateOpportunity(false);
                      updateOpportunityDropdown(data);
                      setFieldValue('opportunity', data._id);
                    }}
                    accountId={values['customerAccountName'] ? values['customerAccountName'] : accountId}
                    resource={accountResource}
                    dataToUpdate={null}
                    disableOwnerAndAccount={values['customerAccountName'] ? true : false}
                  />
                )}
                {showAddProjectSalesDialog && (
                  <CreateProjectSales
                    open={showAddProjectSalesDialog}
                    isClone={false}
                    projectSalesId={null}
                    close={() => {
                      setShowAddProjectSalesDialog(false);
                    }}
                    onSuccess={({ data }) => {
                      setShowAddProjectSalesDialog(false);
                      if (initialData?.fields?.some((e) => e.fieldName === 'customerAccountName')) {
                        let tempAccountId = values['customerAccountName'] ? values['customerAccountName'] : accountId;
                        updateProjectSalesDropdown({ ...data, accountId: tempAccountId });
                      } else {
                        updateProjectSalesDropdown({ ...data, accountId: '' });
                      }
                      setFieldValue('projectSales', data._id);
                    }}
                    accountId={values['customerAccountName'] ? values['customerAccountName'] : accountId}
                    resource={accountResource}
                    fetchData={null}
                  />
                )}
              </Fragment>
            )}
          </Formik>
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Dialog>
    </>
  );
}

ManageQuoteDialog.propTypes = {
  open: PropTypes.bool,
  onSuccess: PropTypes.func,
  onClose: PropTypes.any,
  isNew: PropTypes.bool,
  dataToUpdate: PropTypes.any,
  accountId: PropTypes.string,
  contactId: PropTypes.string,
  accountResource: PropTypes.string,
  isRedirectToDetailPage: PropTypes.bool,
  disableOwnerDropDown: PropTypes.bool,
  isRenderedFromOpportunity: PropTypes.bool,
  opportunityName: PropTypes.string,
  contacts: PropTypes.any
};
