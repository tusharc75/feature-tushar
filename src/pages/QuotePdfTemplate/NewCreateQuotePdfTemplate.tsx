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
import { Autocomplete, Theme } from '@mui/material';
import { useData } from '../../StateProvider/Provider';
import { quoteBuilder, PDF_RESOURCE_LIST, sidebarResource, checkSuperAdminAccess } from '../../constants/helpers';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import CustomTable from './customTable/customTable';
import { useLocation } from 'react-router-dom';
import queryString from 'query-string';
import { quotation } from '../../constants/helpers';
import DeviceMessage from 'src/components/ScreenMessages/DeviceMessage';
import { camelCase, isEqual, startCase } from 'lodash';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import VariablesDialog from './Variables';
import FormTypes from 'src/components/Helpers/FormTypes';

const defaultProductColumns = 7;

const PdfTemplateSchema = object().shape({
  name: string().min(3, 'Too Short!').max(50, 'Too Long').required('PDF template Name  is required'),
  owner: string().required('Owner is required'),
  type: string().required('Type is required'),
  pageNumberInFooter: boolean()
});

const useStyles = makeStyles((theme: Theme) => ({
  mainContainer: {
    overflowY: 'scroll'
  },
  root: {
    flexGrow: 1
  },
  paper: {
    width: '100%',
    textAlign: 'center',
    color: theme.palette.text.secondary
  },
  saveButtonContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'end'
  },
  tinyMCEContainer: {
    width: '725px',
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  headingLabel: {
    marginBottom: '7px'
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
  const [hasPermissionToUpdate, setHasPermissionToUpdate] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isLandscapChecked, setIsLandscapChecked] = useState(false);
  const [isBreakCrumbPath, setIsBreakCrumbPath] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [table, setTable] = useState([]);

  const [variables, setVariables] = useState([]);
  const [allFields, setAllFields] = useState(null);
  const [formValues, setFormValues] = useState(null);

  const [pdfResourceOption, setpdfResourceOption] = useState(null);
  const [variableDialog, setVariableDialog] = useState(false);

  const onBackButtonEvent = (e) => {
    if (hasPermissionToUpdate) {
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
    if (formValues && formValues.type) {
      let resource: string = formValues.type;
      if (resource) {
        axiosInstance()
          .get(`/field?resource=${resource}`)
          .then(({ data: { data } }) => {
            const vars = data.map((field) => field.fieldData.fieldName);
            setVariables(['entity', ...vars]);
            setAllFields(data);
          })
          .catch((err) => {
            toastConfig.setToastConfig(err);
          });
      }
    }
  }, [formValues]);

  async function fetchFieldData(resource) {
    const fields = await axiosInstance().get(`/field?resource=${resource}&entity=${selectedEntity}&view=true`);
    return fields?.data?.data?.map((field) => {
      return { label: field?.fieldData?.fieldLabel, name: field?.fieldData?.fieldName };
    });
  }

  useEffect(() => {
    fetchData();
    fetchUser();
  }, [id]);

  const fetchData = async () => {
    const initialValues = {
      landscape: false,
      hideAmountTotalSection: false,
      tableTotalAtBottom: false,
      tableFontSize: '',
      belowTableTotalFontSize: '',
      pdfFontSize: '',
      tableHeaderBackgroundColor: '',
      tableHeaderFontColor: '',
      productColumns: defaultProductColumns,
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
      collaborator: []
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
            setHasPermissionToUpdate(true);
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
            setHasPermissionToUpdate(true);
          }
          tempPdfTemplate = data?.versions[Number(queryParams?.version)]?.pdfTemplate;
          tempQuoteData = data;
        } catch (e) {
          toastConfig.setToastConfig(e);
        }
      }
      if (tempPdfTemplate) {
        setIsLandscapChecked(tempPdfTemplate?.landscape);
        initialValues.landscape = tempPdfTemplate?.landscape;
        initialValues.hideAmountTotalSection = tempPdfTemplate?.hideAmountTotalSection;
        initialValues.tableTotalAtBottom = tempPdfTemplate?.tableTotalAtBottom;
        initialValues.tableFontSize = tempPdfTemplate?.tableFontSize;
        initialValues.belowTableTotalFontSize = tempPdfTemplate?.belowTableTotalFontSize;
        initialValues.pdfFontSize = tempPdfTemplate?.pdfFontSize;
        initialValues.tableHeaderBackgroundColor = tempPdfTemplate?.tableHeaderBackgroundColor;
        initialValues.tableHeaderFontColor = tempPdfTemplate?.tableHeaderFontColor;
        initialValues.productColumns = tempPdfTemplate?.productColumns;
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
          initialValues.landscape = data?.landscape;
          initialValues.hideAmountTotalSection = data?.hideAmountTotalSection;
          initialValues.tableTotalAtBottom = data?.tableTotalAtBottom;
          initialValues.tableFontSize = data?.tableFontSize;
          initialValues.belowTableTotalFontSize = data?.belowTableTotalFontSize;
          initialValues.pdfFontSize = data?.pdfFontSize;
          initialValues.tableHeaderBackgroundColor = data?.tableHeaderBackgroundColor;
          initialValues.tableHeaderFontColor = data?.tableHeaderFontColor;
          initialValues.productColumns = data?.productColumns;
          initialValues.name = !isClone ? data?.name : '';
          initialValues.pageNumberInFooter = data?.pageNumberInFooter;
          initialValues.header = data?.header;
          initialValues.footer = data?.footer;
          initialValues.aboveTable = data?.aboveTable;
          initialValues.belowTable = data?.belowTable;
          initialValues.tabelSummaryLeftSide = data?.tabelSummaryLeftSide;
          initialValues.entity = data?.entity ? data?.entity : [];
          initialValues.type = data?.type;
          initialValues.owner = data?.owner && data?.owner !== undefined ? data?.owner : user.user._id;
          initialValues.collaborator = data?.collaborator ? data?.collaborator : [];
          setDetails({
            header: data?.header,
            footer: data?.footer,
            aboveTable: data?.aboveTable,
            belowTable: data?.belowTable,
            tabelSummaryLeftSide: data?.tabelSummaryLeftSide
          });
          if (tempQuoteData?._id) {
            setHasPermissionToUpdate(true);
          } else if (
            data?.owner &&
            data?.owner !== undefined &&
            user.user._id !== data?.owner &&
            !data?.collaborator?.some((d) => d === user.user._id) &&
            !checkSuperAdminAccess(user, sidebarResource.quotePdfTemplate)
          ) {
            setHasPermissionToUpdate(false);
          }
          if (data?.tables && data?.tables?.length) {
            const tableData = data?.tables?.map(async (d) => {
              const fetchedFieldData = await fetchFieldData(d?.resourceName);
              return {
                ...d,
                fieldOptions: fetchedFieldData ?? []
              };
            });
            const allTableData = await Promise.all(tableData);
            if (allTableData.length) {
              setTable(allTableData);
            }
          }
        } catch (e) {
          toastConfig.setToastConfig(e);
        }
      }
    }
    setInitialValues({ ...initialValues });
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
    const { entity, owner, collaborator, ...rest } = initialValues;

    const exportData = {
      ...rest,
      details,
      table
    };

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

            setIsLandscapChecked(importedData.landscape);

            const newInitialValues = {
              landscape: importedData.landscape,
              hideAmountTotalSection: importedData.hideAmountTotalSection,
              tableTotalAtBottom: importedData.tableTotalAtBottom,
              tableFontSize: importedData.tableFontSize ? importedData.tableFontSize : '',
              belowTableTotalFontSize: importedData.belowTableTotalFontSize ? importedData.belowTableTotalFontSize : '',
              pdfFontSize: importedData.pdfFontSize ? importedData.pdfFontSize : '',
              tableHeaderBackgroundColor: importedData.tableHeaderBackgroundColor ? importedData.tableHeaderBackgroundColor : '',
              tableHeaderFontColor: importedData.tableHeaderFontColor ? importedData.tableHeaderFontColor : '',
              productColumns: importedData.productColumns ? importedData.productColumns : defaultProductColumns,
              pageNumberInFooter: importedData.pageNumberInFooter,
              header: importedData.header,
              footer: importedData.footer,
              aboveTable: importedData.aboveTable,
              belowTable: importedData.belowTable,
              tabelSummaryLeftSide: importedData.tabelSummaryLeftSide,
            };

            setInitialValues(newInitialValues);

            setDetails({
              header: importedData.header,
              footer: importedData.footer,
              aboveTable: importedData.aboveTable,
              belowTable: importedData.belowTable,
              tabelSummaryLeftSide: importedData.tabelSummaryLeftSide
            });

            if (importedData.table) {
              setTable(importedData.table);
            }

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
          tables: table?.map((item) => {
            return {
              resourceName: item.resourceName,
              columns: item.columns
            };
          }),
          collaborator: values?.collaborator,
          landscape: values?.landscape,
          hideAmountTotalSection: values?.hideAmountTotalSection,
          tableTotalAtBottom: values?.tableTotalAtBottom,
          tableFontSize: parseInt(values?.tableFontSize),
          belowTableTotalFontSize: parseInt(values?.belowTableTotalFontSize),
          pdfFontSize: parseInt(values?.pdfFontSize),
          tableHeaderBackgroundColor: values?.tableHeaderBackgroundColor,
          tableHeaderFontColor: values?.tableHeaderFontColor,
          productColumns: parseInt(values?.productColumns)
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
          tables: table?.map((item) => {
            return {
              resourceName: item.resourceName,
              columns: item.columns
            };
          }),
          collaborator: values?.collaborator,
          landscape: values?.landscape,
          hideAmountTotalSection: values?.hideAmountTotalSection,
          tableTotalAtBottom: values?.tableTotalAtBottom,
          tableFontSize: parseInt(values?.tableFontSize),
          belowTableTotalFontSize: parseInt(values?.belowTableTotalFontSize),
          pdfFontSize: parseInt(values?.pdfFontSize),
          tableHeaderBackgroundColor: values?.tableHeaderBackgroundColor,
          tableHeaderFontColor: values?.tableHeaderFontColor,
          productColumns: parseInt(values?.productColumns)
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
      <DeviceMessage />
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
                    isConfirmBeforeClick={hasPermissionToUpdate}
                    onBreadCrumbClick={(path) => {
                      setIsBreakCrumbPath(path);
                      if (hasPermissionToUpdate) {
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
                  <ThemeButton disabled={isUpdating || (!isClone && !hasPermissionToUpdate)} onClick={handleImport} isLoading={isUpdating}>
                    Import
                  </ThemeButton>
                  <ThemeButton disabled={isUpdating || (!isClone && !hasPermissionToUpdate)} onClick={handleExport} isLoading={isUpdating}>
                    Export
                  </ThemeButton>
                  <ThemeButton
                    disabled={isUpdating || (!isClone && !hasPermissionToUpdate)}
                    onClick={submitForm}
                    buttonType="theme"
                    isLoading={isUpdating}
                  >
                    Save
                  </ThemeButton>

                  {!quoteData && (
                    <ThemeButton
                      disabled={!isClone && (isUpdatingAndPreview || !hasPermissionToUpdate)}
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
                      if (hasPermissionToUpdate && !isEqual({ ...values, ...details }, initialValues)) {
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
                <Box className={classes.paper} mt={1}>
                  <Grid container>
                    <Grid size={{ xs: 12, md: 6 }}></Grid>
                  </Grid>

                  <div className="grid grid-cols-1 gap-x-2 gap-y-3 sm:grid-cols-2 md:grid-cols-3">
                    {!Boolean(quoteData?._id) && (
                      <>
                        <TextField
                          disabled={!isClone && (!hasPermissionToUpdate || Boolean(quoteData?._id))}
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
                        <Autocomplete
                          disabled={!isClone && !hasPermissionToUpdate}
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
                            val && val.length !== 0
                              ? setOwnerCollaboratorData(
                                  ownerCollaboratorDataConst.filter((data) => val?.some((d) => data.entities?.some((e) => e.entity === d._id)))
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
                        <Autocomplete
                          disabled={!isClone && !hasPermissionToUpdate}
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
                                    values['entity']?.some((d) => data.entities?.some((e) => e.entity === d))
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
                        <Autocomplete
                          disabled={!isClone && !hasPermissionToUpdate}
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
                                    values['entity']?.some((d) => data.entities?.some((e) => e.entity === d))
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
                        <Autocomplete
                          disabled={!isClone && !hasPermissionToUpdate}
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
                      </>
                    )}

                    <TextField
                      name="productColumns"
                      label="No. of Product Columns"
                      value={values['productColumns']}
                      type="number"
                      fullWidth
                      variant="outlined"
                      margin="none"
                      size="small"
                      slotProps={{
                        input: {
                          inputProps: { min: 5, max: 20 }
                        }
                      }}
                      onChange={(e) => {
                        setFieldValue('productColumns', e.target.value);
                      }}
                      onBlur={(e) => {
                        const val = parseInt(e.target.value);
                        if (!(val >= 5 && val <= 20)) {
                          setFieldValue('productColumns', defaultProductColumns.toString());
                        }
                      }}
                      helperText="Value must be between 5 to 20"
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <div className="flex gap-2">
                      <FormControlLabel
                        disabled={!isClone && !hasPermissionToUpdate}
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
                        disabled={!isClone && !hasPermissionToUpdate}
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
                      <FormControlLabel
                        disabled={!isClone && !hasPermissionToUpdate}
                        value={values['hideAmountTotalSection']}
                        control={
                          <Checkbox
                            name="hideAmountTotalSection"
                            checked={values['hideAmountTotalSection']}
                            onChange={(e) => {
                              setFieldValue('hideAmountTotalSection', e.target.checked);
                            }}
                            color="primary"
                          />
                        }
                        label="Hide Amount Total Section"
                      />
                      <FormControlLabel
                        disabled={!isClone && !hasPermissionToUpdate}
                        value={values['tableTotalAtBottom']}
                        control={
                          <Checkbox
                            name="tableTotalAtBottom"
                            checked={values['tableTotalAtBottom']}
                            onChange={(e) => {
                              setFieldValue('tableTotalAtBottom', e.target.checked);
                            }}
                            color="primary"
                          />
                        }
                        label="Show Table Total At Bottom"
                      />
                    </div>
                    {allFields?.length && id && id !== '0' && !isClone && (
                      <ThemeButton onClick={() => setVariableDialog(true)}>Variables</ThemeButton>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex gap-2">
                      <TextField
                        variant="outlined"
                        label={'Table Font Size'}
                        name="tableFontSize"
                        type="number"
                        margin="none"
                        size={'small'}
                        value={values['tableFontSize']}
                        error={touched['tableFontSize'] && Boolean(errors['tableFontSize'])}
                        helperText={touched['tableFontSize'] && errors['tableFontSize']}
                        onChange={(e) => {
                          setFieldValue('tableFontSize', parseInt(e.target.value.trimStart()));
                        }}
                        sx={{ width: 220 }}
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
                        margin="none"
                        size={'small'}
                        sx={{ width: 220 }}
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
                      <TextField
                        variant="outlined"
                        label={'Pdf Font Size'}
                        name="pdfFontSize"
                        type="number"
                        margin="none"
                        size={'small'}
                        value={values['pdfFontSize']}
                        error={touched['pdfFontSize'] && Boolean(errors['pdfFontSize'])}
                        helperText={touched['pdfFontSize'] && errors['pdfFontSize']}
                        sx={{ width: 220 }}
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
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex gap-8">
                      <FormTypes
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
                      <FormTypes
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
                  </div>
                  <Grid size={{ xs: 12 }} className="mt-4">
                    <Box className={classes.tinyMCEContainer}>
                      <Typography className={classes.headingLabel} variant="h5" component="h5">
                        Header
                      </Typography>
                      <TinyMce
                        disabledEditor={!hasPermissionToUpdate}
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
                        variables={variables}
                        isCheckHeight={true}
                      />
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12 }} className="mt-4">
                    <Box className={classes.tinyMCEContainer}>
                      <Typography className={classes.headingLabel} variant="h5" component="h5">
                        Above Table
                      </Typography>
                      <TinyMce
                        disabledEditor={!hasPermissionToUpdate}
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
                        variables={variables}
                        showVariableDropdown={true}
                      />
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12 }} className="mt-4">
                    <Box className={classes.tinyMCEContainer}>
                      <Typography className={classes.headingLabel} variant="h5" component="h5">
                        Below Table
                      </Typography>
                      <TinyMce
                        disabledEditor={!hasPermissionToUpdate}
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
                        variables={variables}
                        showVariableDropdown={true}
                      />
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12 }} className="mt-4">
                    <Box className={classes.tinyMCEContainer}>
                      <Typography className={classes.headingLabel} variant="h5" component="h5">
                        Footer
                      </Typography>
                      <TinyMce
                        disabledEditor={!hasPermissionToUpdate}
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
                        variables={variables}
                        isCheckHeight={true}
                      />
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12 }} className="mt-4">
                    <Box className={classes.tinyMCEContainer}>
                      <Typography className={classes.headingLabel} variant="h5" component="h5">
                        Tabel Summary Left Side
                      </Typography>
                      <TinyMce
                        disabledEditor={!hasPermissionToUpdate}
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
                        variables={variables}
                        isCheckHeight={true}
                      />
                    </Box>
                  </Grid>
                  <CustomTable id={id} classes={classes} entity={selectedEntity} table={table} setTable={setTable} />
                </Box>
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
              {variableDialog ? <VariablesDialog fields={allFields} handleClose={() => setVariableDialog(false)} id={id} /> : null}
            </div>
          </Form>
        )}
      </Formik>
    </>
  ) : null;
}
