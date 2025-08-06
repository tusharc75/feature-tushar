import { useState, useContext, useEffect } from 'react';
import Grid from '@mui/material/Grid2';
import TextField from '@mui/material/TextField';
import { makeStyles } from '@mui/styles';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { Formik, Form } from 'formik';
import { object, string, boolean } from 'yup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { useParams, useHistory } from 'react-router-dom';
import routes from '../../components/Helpers/Routes';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TinyMce from './../../components/TinyMCE/index';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import { Autocomplete, CircularProgress, Theme } from '@mui/material';
import { useData } from '../../StateProvider/Provider';
import { quoteBuilder, PDF_RESOURCE_LIST, sidebarResource, checkIsAllowedToEdit, serviceMaster, CHILD_RESOURCE } from '../../constants/helpers';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import { useLocation } from 'react-router-dom';
import queryString from 'query-string';
import { quotation } from '../../constants/helpers';
import DeviceMessage from 'src/components/ScreenMessages/DeviceMessage';
import { camelCase, isEqual, startCase } from 'lodash';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import VariablesDialog from './Variables';
import FormTypes from 'src/components/Helpers/FormTypes';
import { CheckBoxOutlineBlank, CheckBox } from '@mui/icons-material';
import ArrangeChildResourceFieldView from 'src/pages/QuotePdfTemplate/ArrangeChildResourceFieldView';

const icon = <CheckBoxOutlineBlank fontSize="small" />;
const checkedIcon = <CheckBox fontSize="small" />;

const resourceChildResourceMap: any = {
  [sidebarResource.rentalManagement]: CHILD_RESOURCE.rentalManagementProduct,
  [sidebarResource.purchaseOrder]: CHILD_RESOURCE.purchaseOrderProduct
};

const PdfTemplateSchema = object().shape({
  name: string().min(3, 'Too Short!').max(50, 'Too Long').required('PDF template Name  is required'),
  owner: string().required('Owner is required'),
  type: string().required('Type is required'),
  pageNumberInFooter: boolean()
});

const useStyles = makeStyles((theme: Theme) => ({
  tinyMCEContainer: {
    width: '725px',
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: '10px'
  }
}));

export default function NewCreateQuotePdfTemplate() {
  const { qbApi } = quoteBuilder;
  const { id } = useParams();
  const history = useHistory();
  const location = useLocation();
  let queryParams = queryString.parse(location.search);
  const [details, setDetails] = useState({
    header: '',
    footer: '',
    aboveTable: '',
    belowTable: '',
    tabelSummaryLeftSide: ''
  });
  const [initialValues, setInitialValues] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdatingAndPreview, setIsUpdatingAndPreview] = useState(false);
  const classes = useStyles();
  const toastConfig = useContext(CustomToastContext);
  const [isClone] = useState(history.location.state?.isClone ? true : false);
  const [quoteData, setQuoteData] = useState(null);
  const [version, setVersion] = useState(null);
  const {
    state: { user, selectedEntity, permissions, resources }
  }: any = useData();
  const [ownerCollaboratorData, setOwnerCollaboratorData] = useState([]);
  const [ownerCollaboratorDataConst, setOwnerCollaboratorDataConst] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isLandscapChecked, setIsLandscapChecked] = useState(false);
  const [isBreakCrumbPath, setIsBreakCrumbPath] = useState('');
  const [isPreview, setIsPreview] = useState(false);

  const [variables, setVariables] = useState([]);
  const [allFields, setAllFields] = useState(null);
  const [childResourceFields, setChildResourceFields] = useState(null);
  const [belowTableFields, setBelowTableFields] = useState([]);
  const [formValues, setFormValues] = useState(null);

  const [pdfResourceOption, setpdfResourceOption] = useState(null);
  const [variableDialog, setVariableDialog] = useState(false);

  const [isEdit, setIsEdit] = useState(id === '0' ? true : false);
  const [allowedToEdit, setAllowedToEdit] = useState(id === '0' ? true : false);

  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [stepFields, setStepFields] = useState([]);
  const [loading, setLoading] = useState(false);

  const onBackButtonEvent = (e) => {
    if (allowedToEdit) {
      e.preventDefault();
      window.history.pushState(null, null, window.location.pathname);
      setShowConfirmDialog(true);
    }
  };

  useEffect(() => {
    window.history.pushState(null, null, window.location.pathname);
    window.addEventListener('popstate', onBackButtonEvent);
    return () => {
      window.removeEventListener('popstate', onBackButtonEvent);
    };
  }, []);

  useEffect(() => {
    const options = [];
    PDF_RESOURCE_LIST?.forEach((item) => {
      if (permissions[item.key] && permissions[item.key]?.isRead === true) {
        options.push({ title: resources[item.key] ? resources[item.key]?.titleSingular : item.title, value: item.value });
      }
    });
    for (const [key] of Object.entries(permissions)) {
      let result = key?.replace(/ /g, '').toLowerCase();
      let foundFlag = false;
      for (const [key2, value2] of Object.entries(sidebarResource)) {
        if (value2?.replace(/ /g, '').toLowerCase() === result) {
          foundFlag = true;
          break;
        }
      }
      if (!foundFlag) {
        options.push({ title: startCase(camelCase(key)), value: startCase(camelCase(key)) });
      }
    }
    setpdfResourceOption(options);
  }, []);

  useEffect(() => {
    if (selectedServices?.length > 0) {
      axiosInstance()
        .get(`${serviceMaster.api}/fields?serviceIds=${selectedServices}`)
        .then(({ data: { data } }) => {
          setStepFields(data);
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
        });
    }
  }, [selectedServices]);

  useEffect(() => {
    if (formValues && formValues.type) {
      let resource: string = formValues.type;
      if (resource) {
        axiosInstance()
          .get(`/field?resource=${resource}`)
          .then(({ data: { data } }) => {
            const vars = data.map((field) => field.fieldData.fieldName);
            setVariables(['entity', 'currentDate', ...vars]);
            setAllFields(data);
          })
          .catch((err) => {
            toastConfig.setToastConfig(err);
          });
        if (resourceChildResourceMap[resource]) {
          axiosInstance()
            .get(`/field?resource=${resourceChildResourceMap[resource]}`)
            .then(({ data: { data } }) => {
              const filteredData = data?.filter((e) => e?.fieldData?.type === 'currencyAmount')?.map((e) => e.fieldData) || [];
              setChildResourceFields(filteredData);
            })
            .catch((err) => {
              toastConfig.setToastConfig(err);
            });
        }
      }
      if (resource === sidebarResource.workOrder) {
        setLoading(true);
        axiosInstance()
          .get(`${serviceMaster.api}`)
          .then(({ data: { data } }) => {
            const services =
              data?.map((service) => {
                return {
                  optionValue: service._id,
                  optionLabel: service.serviceName
                };
              }) || [];
            setServices(services);
          })
          .catch((err) => {
            toastConfig.setToastConfig(err);
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
  }, [formValues?.type]);

  console.log(childResourceFields, 'childResourceFields');

  useEffect(() => {
    fetchData();
    fetchUser();
  }, [id]);

  const fetchData = async () => {
    const initialValues = {
      landscape: false,
      tableFontSize: '',
      belowTableTotalFontSize: '',
      pdfFontSize: '',
      tableHeaderBackgroundColor: '',
      tableHeaderFontColor: '',
      tableHeaderFontWeight: '',
      name: '',
      pageNumberInFooter: false,
      header: '',
      footer: '',
      aboveTable: '',
      belowTable: '',
      tabelSummaryLeftSide: '',
      entity: selectedEntity ? [selectedEntity] : [],
      type: '',
      owner: user.user._id,
      collaborator: [],
      services: []
    };
    if (id && id !== '0') {
      let tempPdfTemplate = null;
      let tempQuoteData = null;
      if (queryParams.quote && queryParams.version) {
        history.replace(`?quote=${queryParams.quote}&version=${queryParams.version}`);
        try {
          const res = await axiosInstance().get(`${qbApi}/${queryParams?.quote}?entity=${selectedEntity}`);
          const {
            data: { data }
          } = res;
          setQuoteData(data);
          setVersion(queryParams.version);
          if (data?._id) {
            setAllowedToEdit(true);
          }
          tempPdfTemplate = data?.versions[Number(queryParams?.version)]?.pdfTemplate;
          tempQuoteData = data;
        } catch (e) {
          toastConfig.setToastConfig(e);
        }
      } else if (queryParams.quotation && queryParams.version) {
        history.replace(`?quotation=${queryParams.quotation}&version=${queryParams.version}`);
        try {
          const res = await axiosInstance().get(`${quotation.api}/${queryParams?.quotation}?entity=${selectedEntity}`);
          const {
            data: { data }
          } = res;
          setQuoteData(data);
          setVersion(queryParams.version);
          if (data?._id) {
            setAllowedToEdit(true);
          }
          tempPdfTemplate = data?.versions[Number(queryParams?.version)]?.pdfTemplate;
          tempQuoteData = data;
        } catch (e) {
          toastConfig.setToastConfig(e);
        }
      }

      if (tempPdfTemplate) {
        setIsLandscapChecked(tempPdfTemplate?.landscape);
        setBelowTableFields(tempPdfTemplate?.belowTableFields || []);
        initialValues.landscape = tempPdfTemplate?.landscape;
        initialValues.tableFontSize = tempPdfTemplate?.tableFontSize;
        initialValues.belowTableTotalFontSize = tempPdfTemplate?.belowTableTotalFontSize;
        initialValues.pdfFontSize = tempPdfTemplate?.pdfFontSize;
        initialValues.tableHeaderBackgroundColor = tempPdfTemplate?.tableHeaderBackgroundColor;
        initialValues.tableHeaderFontColor = tempPdfTemplate?.tableHeaderFontColor;
        initialValues.tableHeaderFontWeight = tempPdfTemplate?.tableHeaderFontWeight;
        initialValues.name = tempPdfTemplate?.name;
        initialValues.pageNumberInFooter = tempPdfTemplate?.pageNumberInFooter;
        initialValues.header = tempPdfTemplate?.header;
        initialValues.footer = tempPdfTemplate?.footer;
        initialValues.aboveTable = tempPdfTemplate?.aboveTable;
        initialValues.belowTable = tempPdfTemplate?.belowTable;
        initialValues.tabelSummaryLeftSide = tempPdfTemplate?.tabelSummaryLeftSide;
        initialValues.entity = tempPdfTemplate?.entity ? tempPdfTemplate?.entity : [];
        initialValues.type = tempPdfTemplate?.type;
        initialValues.owner = tempPdfTemplate?.owner && tempPdfTemplate?.owner !== undefined ? tempPdfTemplate?.owner : user.user._id;
        initialValues.collaborator = tempPdfTemplate?.collaborator ? tempPdfTemplate?.collaborator : [];
        initialValues.services = tempPdfTemplate?.services ? tempPdfTemplate?.services : [];

        setDetails({
          header: tempPdfTemplate?.header,
          footer: tempPdfTemplate?.footer,
          aboveTable: tempPdfTemplate?.aboveTable,
          belowTable: tempPdfTemplate?.belowTable,
          tabelSummaryLeftSide: tempPdfTemplate?.tabelSummaryLeftSide
        });
      } else {
        try {
          const res = await axiosInstance().get(`/quote-pdf-template/${id}`);
          const {
            data: { data }
          } = res;
          setIsLandscapChecked(data?.landscape);
          setBelowTableFields(data?.belowTableFields || []);
          initialValues.landscape = data?.landscape;
          initialValues.tableFontSize = data?.tableFontSize;
          initialValues.belowTableTotalFontSize = data?.belowTableTotalFontSize;
          initialValues.pdfFontSize = data?.pdfFontSize;
          initialValues.tableHeaderBackgroundColor = data?.tableHeaderBackgroundColor;
          initialValues.tableHeaderFontColor = data?.tableHeaderFontColor;
          initialValues.tableHeaderFontWeight = data?.tableHeaderFontWeight;
          initialValues.name = !isClone ? data?.name : '';
          initialValues.pageNumberInFooter = data?.pageNumberInFooter;
          initialValues.header = data?.header;
          initialValues.footer = data?.footer;
          initialValues.aboveTable = data?.aboveTable;
          initialValues.belowTable = data?.belowTable;
          initialValues.tabelSummaryLeftSide = data?.tabelSummaryLeftSide;
          initialValues.entity = data?.entity ? data?.entity : [];
          initialValues.type = data?.type;
          initialValues.owner = isClone ? user.user._id : data?.owner || user.user._id;
          initialValues.collaborator = data?.collaborator ? data?.collaborator : [];
          initialValues.services = data?.services ? data?.services : [];
          setDetails({
            header: data?.header,
            footer: data?.footer,
            aboveTable: data?.aboveTable,
            belowTable: data?.belowTable,
            tabelSummaryLeftSide: data?.tabelSummaryLeftSide
          });
          if (tempQuoteData?._id) {
            setIsEdit(true);
            setAllowedToEdit(true);
          } else {
            setAllowedToEdit(
              checkIsAllowedToEdit(user, sidebarResource.quotePdfTemplate, {
                owner: {
                  optionValue: initialValues.owner
                },
                collaborator: initialValues.collaborator?.map((e) => {
                  return { optionValue: e };
                })
              })
            );
            if (isClone) {
              setAllowedToEdit(true);
              setIsEdit(true);
            }
          }
        } catch (e) {
          toastConfig.setToastConfig(e);
        }
      }
    }
    setInitialValues({ ...initialValues });
    setSelectedServices(initialValues?.services);
  };

  const fetchUser = () => {
    axiosInstance()
      .get(`/user`)
      .then(({ data: { data } }) => {
        setOwnerCollaboratorData(data);
        setOwnerCollaboratorDataConst(data);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleExport = () => {
    const exportData = { ...initialValues, ...details };
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const fileName = `${initialValues.name || 'untitled'}-pdf-template.json`;
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    toastConfig.setToastConfig({
      open: true,
      type: 'success',
      message: 'Exported Successfully.'
    });
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const file = target.files[0];
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
          const result = e.target?.result;
          let fileContent: string;
          if (typeof result === 'string') {
            fileContent = result;
          } else if (result instanceof ArrayBuffer) {
            fileContent = new TextDecoder('utf-8').decode(result);
          } else {
            toastConfig.setToastConfig({
              open: true,
              type: 'error',
              message: 'Unexpected file content format.'
            });
            return;
          }
          try {
            const importedData = JSON.parse(fileContent);
            const newInitialValues = {
              landscape: importedData?.landscape,
              tableFontSize: importedData?.tableFontSize,
              belowTableTotalFontSize: importedData?.belowTableTotalFontSize,
              pdfFontSize: importedData?.pdfFontSize,
              tableHeaderBackgroundColor: importedData?.tableHeaderBackgroundColor,
              tableHeaderFontColor: importedData?.tableHeaderFontColor,
              tableHeaderFontWeight: importedData?.tableHeaderFontWeight,
              pageNumberInFooter: importedData?.pageNumberInFooter,
              name: initialValues?.name ? initialValues?.name : 'New',
              header: importedData?.header,
              footer: importedData?.footer,
              aboveTable: importedData?.aboveTable,
              belowTable: importedData?.belowTable,
              type: importedData?.type,
              owner: initialValues?.owner,
              collaborator: initialValues?.collaborator,
              services: initialValues?.services,
              entity: initialValues?.entity,
              tabelSummaryLeftSide: importedData?.tabelSummaryLeftSide
            };
            setInitialValues(newInitialValues);
            setSelectedServices(newInitialValues?.services);
            setIsLandscapChecked(importedData?.landscape);
            setBelowTableFields(importedData?.belowTableFields || []);
            setDetails({
              header: importedData?.header,
              footer: importedData?.footer,
              aboveTable: importedData?.aboveTable,
              belowTable: importedData?.belowTable,
              tabelSummaryLeftSide: importedData?.tabelSummaryLeftSide
            });
            toastConfig.setToastConfig({
              open: true,
              type: 'success',
              message: 'Imported successfully.'
            });
          } catch (error) {
            toastConfig.setToastConfig({
              open: true,
              type: 'error',
              message: 'Failed to import file. Please check the file format.'
            });
          }
        };
        reader.readAsText(file);
      }
    };

    input.click();
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
        setIsPreview(false);
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
        setIsPreview(false);
      });
  };

  const handleSubmit = (values) => {
    const trimmedName = values.name.trim();
    if (isPreview === true) {
      setIsUpdatingAndPreview(true);
    } else {
      setIsUpdating(true);
    }

    if (id === '0' || isClone === true) {
      axiosInstance()
        .post('/quote-pdf-template', {
          ...details,
          name: trimmedName,
          pageNumberInFooter: values.pageNumberInFooter,
          entity: values?.entity,
          type: values?.type,
          owner: values?.owner,
          collaborator: values?.collaborator,
          services: values?.services,
          landscape: values?.landscape,
          belowTableFields: belowTableFields,
          tableFontSize: parseInt(values?.tableFontSize),
          belowTableTotalFontSize: parseInt(values?.belowTableTotalFontSize),
          pdfFontSize: parseInt(values?.pdfFontSize),
          tableHeaderBackgroundColor: values?.tableHeaderBackgroundColor,
          tableHeaderFontColor: values?.tableHeaderFontColor,
          tableHeaderFontWeight: values?.tableHeaderFontWeight
        })
        .then(({ data: { data, message } }) => {
          if (isPreview === true) {
            previewPdfTemplate(data._id);
            setIsUpdatingAndPreview(false);
            history.push(`${routes.quotePdfTemplateDetail.path}/${data._id}`);
          } else {
            if (isBreakCrumbPath) {
              history.push({ pathname: isBreakCrumbPath });
            } else {
              history.push(`${routes.quotePdfTemplateDetail.path}/${data._id}`);
            }
            setIsUpdating(false);
            setIsEdit(false);
            toastConfig.setToastConfig({
              open: true,
              type: 'success',
              message: message
            });
          }
        })
        .catch((error) => {
          setIsUpdating(false);
          setIsUpdatingAndPreview(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      let api = quoteData
        ? `${queryParams.quotation ? quotation.api : '/quote-builder'}/pdf-template/${quoteData._id}/${version}`
        : '/quote-pdf-template';
      axiosInstance()
        .put(api, {
          _id: id,
          ...details,
          name: trimmedName,
          pageNumberInFooter: values.pageNumberInFooter,
          entity: values?.entity,
          type: values?.type,
          owner: values?.owner,
          collaborator: values?.collaborator,
          services: values?.services,
          landscape: values?.landscape,
          belowTableFields: belowTableFields,
          tableFontSize: parseInt(values?.tableFontSize),
          belowTableTotalFontSize: parseInt(values?.belowTableTotalFontSize),
          pdfFontSize: parseInt(values?.pdfFontSize),
          tableHeaderBackgroundColor: values?.tableHeaderBackgroundColor,
          tableHeaderFontColor: values?.tableHeaderFontColor,
          tableHeaderFontWeight: values?.tableHeaderFontWeight
        })
        .then(({ data: { data, message } }) => {
          if (isPreview === true) {
            previewPdfTemplate(data._id);
            setIsUpdatingAndPreview(false);
          }
          if (quoteData?._id) {
            history.push(`${queryParams.quotation ? routes.quotationDetail.path : '/quotes/detail'}/${quoteData?._id}`, {
              versionNumber: `${version}`,
              tabValue: 1
            });
          } else if (isBreakCrumbPath) {
            history.push({ pathname: isBreakCrumbPath });
          } else {
            fetchData();
          }
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: message
          });
          setIsUpdating(false);
          setIsEdit(false);
        })
        .catch((error) => {
          setIsUpdating(false);
          setIsUpdatingAndPreview(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleClose = () => {
    if (quoteData?._id) {
      if (queryParams.quotation) {
        history.push(`${routes.quotationDetail.path}/${quoteData._id}`);
      } else {
        history.push(`/quotes/detail/${quoteData?._id}`, {
          versionNumber: `${version}`,
          tabValue: 1
        });
      }
    } else {
      history.push({ pathname: isBreakCrumbPath ? isBreakCrumbPath : routes.quotePdfTemplate.path });
    }
  };

  return initialValues && pdfResourceOption ? (
    <>
      <DeviceMessage backPath={queryParams.quotation ? `${routes.quotationDetail.path}/${quoteData._id}` : routes.quotePdfTemplate.path} />
      <Formik
        innerRef={(ref) => ref && setFormValues(ref.values)}
        initialValues={initialValues}
        validationSchema={PdfTemplateSchema}
        onSubmit={handleSubmit}
        enableReinitialize={true}
      >
        {({ submitForm, touched, errors, setFieldValue, values }) => (
          <Form>
            <div className="main-container-v1">
              <div className="headerbox-v1">
                <div className="nav-v1">
                  <CustomBreadCrumbs
                    routes={[
                      {
                        title: resources?.quotePdfTemplate?.titlePlural,
                        path: routes.quotePdfTemplate.path
                      },
                      {
                        title: id === '0' ? 'New' : isClone === true ? 'Clone' : initialValues && initialValues.name
                      }
                    ]}
                    isConfirmBeforeClick={allowedToEdit}
                    onBreadCrumbClick={(path) => {
                      setIsBreakCrumbPath(path);
                      if (allowedToEdit) {
                        if (!isEqual({ ...values, ...details }, initialValues)) {
                          setShowConfirmDialog(true);
                        } else {
                          handleClose();
                        }
                      }
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {isEdit && (
                    <ThemeButton disabled={isUpdating || !allowedToEdit} onClick={handleImport} isLoading={isUpdating}>
                      Import
                    </ThemeButton>
                  )}
                  <ThemeButton disabled={isUpdating} onClick={handleExport} isLoading={isUpdating}>
                    Export
                  </ThemeButton>
                  {isEdit && (
                    <ThemeButton disabled={isUpdating || !allowedToEdit} onClick={submitForm} buttonType="theme" isLoading={isUpdating}>
                      Save
                    </ThemeButton>
                  )}
                  {!isEdit && allowedToEdit && (
                    <ThemeButton buttonType="theme" onClick={() => setIsEdit(true)}>
                      Edit
                    </ThemeButton>
                  )}
                  {!quoteData && isEdit && (
                    <ThemeButton
                      disabled={!isClone && (isUpdatingAndPreview || !allowedToEdit)}
                      onClick={() => {
                        setIsPreview(true);
                        submitForm();
                      }}
                      buttonType="theme"
                      isLoading={isUpdatingAndPreview}
                    >
                      Save & Preview
                    </ThemeButton>
                  )}
                  <ThemeButton
                    onClick={() => {
                      if (allowedToEdit && !isEqual({ ...values, ...details }, initialValues)) {
                        setShowConfirmDialog(true);
                      } else {
                        handleClose();
                      }
                    }}
                  >
                    Close
                  </ThemeButton>
                </div>
              </div>
              <div className={`main-container`}>
                <div className="mt-4">
                  <Grid container spacing={2} direction={'column'}>
                    {!Boolean(quoteData?._id) && (
                      <>
                        <Grid>
                          <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                              <TextField
                                disabled={!allowedToEdit || Boolean(quoteData?._id) || !isEdit}
                                variant="outlined"
                                type="text"
                                label="PDF Template Name"
                                required={true}
                                name="name"
                                fullWidth
                                margin="none"
                                size="small"
                                value={values['name']}
                                error={touched['name'] && Boolean(errors['name'])}
                                helperText={touched['name'] && errors['name']}
                                onChange={(e) => setFieldValue('name', e.target.value.trimStart())}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                              <Autocomplete
                                disabled={!allowedToEdit || !isEdit}
                                getOptionLabel={(option) => option.title}
                                isOptionEqualToValue={(option, value) => option.value === value.value}
                                value={
                                  pdfResourceOption.find((data) => data.value === values['type'])
                                    ? pdfResourceOption.find((data) => data.value === values['type'])
                                    : null
                                }
                                options={pdfResourceOption}
                                onChange={(e, val: any) => {
                                  setFieldValue('type', val ? val.value : '');
                                }}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    required={true}
                                    margin="none"
                                    size="small"
                                    name="type"
                                    label="Type"
                                    variant="outlined"
                                    error={touched['type'] && Boolean(errors['type'])}
                                    helperText={touched['type'] && errors['type']}
                                    fullWidth
                                  />
                                )}
                              />
                            </Grid>
                          </Grid>
                        </Grid>
                        <Grid>
                          <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                              <Autocomplete
                                disabled={!allowedToEdit || !isEdit}
                                multiple
                                options={user?.entity}
                                getOptionLabel={(option: any) => (option ? option?.entityName : '')}
                                value={
                                  user?.entity.filter((data) => values['entity']?.some((d) => d === data._id)).length
                                    ? user?.entity.filter((data) => values['entity']?.some((d) => d === data._id))
                                    : []
                                }
                                onChange={(e, val) => {
                                  setFieldValue('entity', val && val?.map((d) => d._id));
                                  setFieldValue('owner', '');
                                  setFieldValue('collaborator', []);
                                  val && val.length !== 0
                                    ? setOwnerCollaboratorData(
                                        ownerCollaboratorDataConst.filter((data) =>
                                          val?.some((d) => data.entities?.some((e) => e?.entity?._id === d._id))
                                        )
                                      )
                                    : setOwnerCollaboratorData(ownerCollaboratorDataConst);
                                }}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    margin="none"
                                    size="small"
                                    name="entity"
                                    label="Entity"
                                    variant="outlined"
                                    error={touched['entity'] && Boolean(errors['entity'])}
                                    helperText={touched['entity'] && errors['entity']}
                                    fullWidth
                                  />
                                )}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                              <Autocomplete
                                disabled={!allowedToEdit || !isEdit}
                                getOptionLabel={(option: any) => (option ? option?.concatedName : '')}
                                value={
                                  ownerCollaboratorData.filter((data) => data._id === values['owner']).length
                                    ? ownerCollaboratorData.filter((data) => data._id === values['owner'])[0]
                                    : ''
                                }
                                options={ownerCollaboratorData.filter((user) => !values['collaborator']?.some((d) => user._id === d))}
                                onChange={(e, val) => {
                                  setFieldValue('owner', val && val._id ? val._id : '');
                                }}
                                onOpen={() =>
                                  values['entity'] && values['entity'].length !== 0
                                    ? setOwnerCollaboratorData(
                                        ownerCollaboratorDataConst.filter((data) =>
                                          values['entity']?.some((d) => data.entities?.some((e) => e.entity?._id === d))
                                        )
                                      )
                                    : setOwnerCollaboratorData(ownerCollaboratorDataConst)
                                }
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    required={true}
                                    margin="none"
                                    size="small"
                                    name="owner"
                                    label="Owner"
                                    variant="outlined"
                                    error={touched['owner'] && Boolean(errors['owner'])}
                                    helperText={touched['owner'] && errors['owner']}
                                    fullWidth
                                  />
                                )}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                              <Autocomplete
                                disabled={!allowedToEdit || !isEdit}
                                multiple
                                options={ownerCollaboratorData.filter((d) => d._id !== values['owner'])}
                                getOptionLabel={(option: any) => (option ? option?.concatedName : '')}
                                value={
                                  ownerCollaboratorData.filter((data) => values['collaborator']?.some((d) => d === data._id)).length
                                    ? ownerCollaboratorData.filter((data) => values['collaborator']?.some((d) => d === data._id))
                                    : []
                                }
                                onChange={(e, val) => {
                                  setFieldValue('collaborator', val && val?.map((d) => d._id));
                                }}
                                onOpen={() =>
                                  values['entity'] && values['entity'].length !== 0
                                    ? setOwnerCollaboratorData(
                                        ownerCollaboratorDataConst.filter((data) =>
                                          values['entity']?.some((d) => data.entities?.some((e) => e?.entity?._id === d))
                                        )
                                      )
                                    : setOwnerCollaboratorData(ownerCollaboratorDataConst)
                                }
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    margin="none"
                                    size="small"
                                    name="collaborator"
                                    label="Collaborator"
                                    variant="outlined"
                                    error={touched['collaborator'] && Boolean(errors['collaborator'])}
                                    helperText={touched['collaborator'] && errors['collaborator']}
                                    fullWidth
                                  />
                                )}
                              />
                            </Grid>
                          </Grid>
                        </Grid>
                        {values?.type === sidebarResource.workOrder && (
                          <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12 }}>
                              <Autocomplete
                                multiple
                                disabled={!allowedToEdit || !isEdit || loading}
                                getOptionLabel={(option) => option?.optionLabel}
                                isOptionEqualToValue={(option, value) => option?.optionValue === value?.optionValue}
                                value={
                                  services?.length > 0 ? services?.filter((data) => selectedServices?.some((d) => d === data?.optionValue)) || [] : []
                                }
                                options={services || []}
                                onChange={(e, val: any) => {
                                  setSelectedServices(val && val?.map((d) => d.optionValue));
                                  setFieldValue('services', val && val?.map((d) => d.optionValue));
                                }}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    margin="none"
                                    size="small"
                                    name="services"
                                    label="Services"
                                    variant="outlined"
                                    error={touched['services'] && Boolean(errors['services'])}
                                    helperText={touched['services'] && errors['services']}
                                    fullWidth
                                    slotProps={{
                                      input: {
                                        ...params.InputProps,
                                        endAdornment: (
                                          <>
                                            {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                            {params.InputProps.endAdornment}
                                          </>
                                        )
                                      }
                                    }}
                                  />
                                )}
                              />
                            </Grid>
                          </Grid>
                        )}
                      </>
                    )}
                    <Grid>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                          <div className="flex flex-col rounded-sm border border-gray-300 p-2">
                            <Typography variant="body2">PDF Property</Typography>
                            <FormControlLabel
                              disabled={!allowedToEdit || !isEdit}
                              value={values['pageNumberInFooter']}
                              control={
                                <Checkbox
                                  name="pageNumberInFooter"
                                  checked={values['pageNumberInFooter']}
                                  onChange={(e) => {
                                    setFieldValue('pageNumberInFooter', e.target.checked);
                                  }}
                                  color="primary"
                                />
                              }
                              label="Show page number in footer"
                            />
                            <FormControlLabel
                              disabled={!allowedToEdit || !isEdit}
                              value={values['landscape']}
                              control={
                                <Checkbox
                                  name="landscape"
                                  checked={values['landscape']}
                                  onChange={(e) => {
                                    setIsLandscapChecked(e.target.checked);
                                    setFieldValue('landscape', e.target.checked);
                                  }}
                                  color="primary"
                                />
                              }
                              label="Landscape"
                            />
                            <TextField
                              variant="outlined"
                              label={'Pdf Font Size'}
                              name="pdfFontSize"
                              type="number"
                              disabled={!isEdit}
                              margin="dense"
                              size={'small'}
                              value={values['pdfFontSize']}
                              error={touched['pdfFontSize'] && Boolean(errors['pdfFontSize'])}
                              helperText={touched['pdfFontSize'] && errors['pdfFontSize']}
                              sx={{ width: 270 }}
                              onChange={(e) => {
                                setFieldValue('pdfFontSize', parseInt(e.target.value.trimStart()));
                              }}
                              slotProps={{
                                input: {
                                  endAdornment: 'pt'
                                }
                              }}
                            />
                          </div>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 8, lg: 8 }}>
                          <div className="rounded-sm border border-gray-300 p-2">
                            <Typography variant="body2">Table Property</Typography>
                            <Grid container spacing={2}>
                              <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6 }}>
                                <div className="flex flex-col">
                                  {childResourceFields?.length > 0 && (
                                    <Box className="mb-2 mt-3 flex items-center justify-between">
                                      <Box width="94%">
                                        <Autocomplete
                                          id="demo-mutiple-chip"
                                          disabled={!allowedToEdit || !isEdit}
                                          fullWidth
                                          size="small"
                                          multiple
                                          value={belowTableFields}
                                          onChange={(e, val) => {
                                            if (
                                              val.find((e) => e.fieldName === 'Select All') &&
                                              ['Select All', ...childResourceFields?.map((e) => e?.fieldName)].sort().toString() !==
                                                val
                                                  ?.map((e) => e?.fieldName)
                                                  .sort()
                                                  .toString()
                                            ) {
                                              setBelowTableFields(childResourceFields);
                                            } else if (
                                              ['Select All', ...childResourceFields?.map((e) => e?.fieldName)].sort().toString() ===
                                              val
                                                ?.map((e) => e?.fieldName)
                                                .sort()
                                                .toString()
                                            ) {
                                              setBelowTableFields([]);
                                            } else {
                                              setBelowTableFields(val);
                                            }
                                          }}
                                          options={[{ fieldLabel: 'Select All', fieldName: 'Select All' }, ...childResourceFields]}
                                          getOptionLabel={(option) => option?.fieldLabel}
                                          isOptionEqualToValue={(option: any, value: any) => option.fieldName === value.fieldName}
                                          disableCloseOnSelect
                                          renderOption={(props, option, state, ownerState) => {
                                            const { key, ...optionProps } = props;
                                            return (
                                              <Box
                                                key={key}
                                                component="li"
                                                {...optionProps}
                                                display={'flex'}
                                                alignItems={'center'}
                                                justifyContent={'space-between'}
                                              >
                                                <Checkbox
                                                  icon={icon}
                                                  checkedIcon={checkedIcon}
                                                  style={{ marginRight: 8 }}
                                                  checked={
                                                    ['Select All', ...childResourceFields?.map((e) => e?.fieldName)].sort().toString() ===
                                                    ['Select All', ...belowTableFields?.map((e) => e?.fieldName)].sort().toString()
                                                      ? true
                                                      : state.selected
                                                  }
                                                />
                                                {ownerState.getOptionLabel(option)}
                                              </Box>
                                            );
                                          }}
                                          renderInput={(params) => (
                                            <TextField {...params} variant="outlined" label={`Select Below Table Fields`} placeholder="Select" />
                                          )}
                                        />
                                      </Box>
                                      <Box width="5%">
                                        <ArrangeChildResourceFieldView
                                          columns={belowTableFields}
                                          setColumns={setBelowTableFields}
                                          disabled={!allowedToEdit || !isEdit}
                                        />
                                      </Box>
                                    </Box>
                                  )}
                                  <FormTypes
                                    disabled={!allowedToEdit || !isEdit}
                                    values={values}
                                    errors={errors}
                                    touched={touched}
                                    label={'Table Header Background Color'}
                                    name={'tableHeaderBackgroundColor'}
                                    type={'colorPicker'}
                                    setFieldValue={(name, value) => {
                                      setFieldValue(name, value);
                                    }}
                                    isTooltip={false}
                                  />
                                  <Box mt={1}></Box>
                                  <FormTypes
                                    disabled={!allowedToEdit || !isEdit}
                                    values={values}
                                    errors={errors}
                                    touched={touched}
                                    label={'Table Header Font Color'}
                                    name={'tableHeaderFontColor'}
                                    type={'colorPicker'}
                                    setFieldValue={(name, value) => {
                                      setFieldValue(name, value);
                                    }}
                                    isTooltip={false}
                                  />
                                </div>
                              </Grid>
                              <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6 }}>
                                <div className="flex flex-col">
                                  <TextField
                                    variant="outlined"
                                    label={'Table Font Size'}
                                    name="tableFontSize"
                                    type="number"
                                    disabled={!allowedToEdit || !isEdit}
                                    margin="dense"
                                    size={'small'}
                                    value={values['tableFontSize']}
                                    error={touched['tableFontSize'] && Boolean(errors['tableFontSize'])}
                                    helperText={touched['tableFontSize'] && errors['tableFontSize']}
                                    onChange={(e) => {
                                      setFieldValue('tableFontSize', parseInt(e.target.value.trimStart()));
                                    }}
                                    sx={{ width: 300 }}
                                    slotProps={{
                                      input: {
                                        endAdornment: 'pt'
                                      }
                                    }}
                                  />
                                  <TextField
                                    variant="outlined"
                                    label={'Table Total Font Size'}
                                    name="belowTableTotalFontSize"
                                    type="number"
                                    disabled={!allowedToEdit || !isEdit}
                                    margin="dense"
                                    size={'small'}
                                    sx={{ width: 300 }}
                                    value={values['belowTableTotalFontSize']}
                                    error={touched['belowTableTotalFontSize'] && Boolean(errors['belowTableTotalFontSize'])}
                                    helperText={touched['belowTableTotalFontSize'] && errors['belowTableTotalFontSize']}
                                    onChange={(e) => {
                                      setFieldValue('belowTableTotalFontSize', parseInt(e.target.value.trimStart()));
                                    }}
                                    slotProps={{
                                      input: {
                                        endAdornment: 'pt'
                                      }
                                    }}
                                  />
                                  <Autocomplete
                                    style={{ maxWidth: '300px' }}
                                    size="small"
                                    fullWidth
                                    disabled={!allowedToEdit || !isEdit}
                                    options={['normal']}
                                    getOptionLabel={(option) => startCase(option)}
                                    isOptionEqualToValue={(option: any, val) => option === val}
                                    value={values['tableHeaderFontWeight']}
                                    renderInput={(params) => (
                                      <TextField
                                        {...params}
                                        placeholder="Table Header Font Weight"
                                        variant="outlined"
                                        margin="dense"
                                        label="Table Header Font Weight"
                                      />
                                    )}
                                    onChange={(_, newValue) => {
                                      setFieldValue('tableHeaderFontWeight', newValue);
                                    }}
                                  />
                                </div>
                              </Grid>
                            </Grid>
                          </div>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                  {allFields?.length && id && id !== '0' && (
                    <div className="mt-2 flex justify-end">
                      <ThemeButton onClick={() => setVariableDialog(true)}>Variables</ThemeButton>
                    </div>
                  )}
                  <div className="mt-2 flex flex-col gap-2">
                    <Box className={classes.tinyMCEContainer}>
                      <Typography variant="h6">Header</Typography>
                      <TinyMce
                        disabledEditor={!allowedToEdit || !isEdit}
                        id="header"
                        onChange={(value) => {
                          setDetails((prevState) => ({
                            ...prevState,
                            header: value
                          }));
                        }}
                        them
                        width={isLandscapChecked ? 793 : 725}
                        height={300}
                        initialValue={initialValues?.header}
                        imageOrFileUploadCompletePercentage={(completePercentage) => null}
                        showVariableDropdown={true}
                        doNotShowUploadFile={true}
                        variables={[...variables, ...stepFields]}
                      />
                    </Box>
                    <Box className={classes.tinyMCEContainer}>
                      <Typography variant="h6">Above Table</Typography>
                      <TinyMce
                        disabledEditor={!allowedToEdit || !isEdit}
                        id="aboveTable"
                        onChange={(value) => {
                          setDetails((prevState) => ({
                            ...prevState,
                            aboveTable: value
                          }));
                        }}
                        width={isLandscapChecked ? 793 : 725}
                        height={400}
                        initialValue={initialValues?.aboveTable}
                        imageOrFileUploadCompletePercentage={(completePercentage) => null}
                        variables={[...variables, ...stepFields]}
                        doNotShowUploadFile={true}
                        showVariableDropdown={true}
                      />
                    </Box>
                    <Box className={classes.tinyMCEContainer}>
                      <Typography variant="h6">Below Table</Typography>
                      <TinyMce
                        disabledEditor={!allowedToEdit || !isEdit}
                        id="belowTable"
                        onChange={(value) => {
                          setDetails((prevState) => ({
                            ...prevState,
                            belowTable: value
                          }));
                        }}
                        width={isLandscapChecked ? 793 : 725}
                        height={400}
                        initialValue={initialValues?.belowTable}
                        imageOrFileUploadCompletePercentage={(completePercentage) => null}
                        variables={[...variables, ...stepFields]}
                        doNotShowUploadFile={true}
                        showVariableDropdown={true}
                      />
                    </Box>
                    <Box className={classes.tinyMCEContainer}>
                      <Typography variant="h6">Footer </Typography>
                      <TinyMce
                        disabledEditor={!allowedToEdit || !isEdit}
                        id="footer"
                        onChange={(value) => {
                          setDetails((prevState) => ({
                            ...prevState,
                            footer: value
                          }));
                        }}
                        width={isLandscapChecked ? 793 : 725}
                        height={300}
                        initialValue={initialValues?.footer}
                        imageOrFileUploadCompletePercentage={(completePercentage) => null}
                        showVariableDropdown={true}
                        doNotShowUploadFile={true}
                        variables={[...variables, ...stepFields]}
                      />
                    </Box>
                    <Box className={classes.tinyMCEContainer}>
                      <Typography variant="h6">Tabel Summary Left Side</Typography>
                      <TinyMce
                        disabledEditor={!allowedToEdit || !isEdit}
                        id="tabelSummaryLeftSide"
                        onChange={(value) => {
                          setDetails((prevState) => ({
                            ...prevState,
                            tabelSummaryLeftSide: value
                          }));
                        }}
                        width={isLandscapChecked ? 793 : 725}
                        height={300}
                        initialValue={initialValues?.tabelSummaryLeftSide}
                        imageOrFileUploadCompletePercentage={(completePercentage) => null}
                        showVariableDropdown={true}
                        doNotShowUploadFile={true}
                        variables={[...variables, ...stepFields]}
                      />
                    </Box>
                  </div>
                </div>
              </div>
              {showConfirmDialog ? (
                <ConfirmCancelDialog
                  open={showConfirmDialog}
                  onSave={() => {
                    setShowConfirmDialog(false);
                    submitForm();
                  }}
                  onClose={() => {
                    handleClose();
                  }}
                />
              ) : null}
              {variableDialog ? (
                <VariablesDialog isDisable={!isEdit} fields={allFields} handleClose={() => setVariableDialog(false)} id={id} />
              ) : null}
            </div>
          </Form>
        )}
      </Formik>
    </>
  ) : null;
}
