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
import { camelCase, startCase } from 'lodash';
import { ThemeButton } from 'src/components/Helpers/Buttons';

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
  const [formValues, setFormValues] = useState(null);

  const [pdfResourceOption, setpdfResourceOption] = useState(null);

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
    if (id && id !== '0') {
      (async () => {
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
          setIsLandscapChecked(tempPdfTemplate.landscape);
          setInitialValues({
            landscape: tempPdfTemplate.landscape,
            productColumns: tempPdfTemplate.productColumns,
            name: tempPdfTemplate.name,
            pageNumberInFooter: tempPdfTemplate.pageNumberInFooter,
            header: tempPdfTemplate.header,
            footer: tempPdfTemplate.footer,
            aboveTable: tempPdfTemplate.aboveTable,
            belowTable: tempPdfTemplate.belowTable,
            tabelSummaryLeftSide: tempPdfTemplate?.tabelSummaryLeftSide,
            entity: tempPdfTemplate.entity ? tempPdfTemplate.entity : [],
            type: tempPdfTemplate.type,
            owner: tempPdfTemplate.owner && tempPdfTemplate.owner !== undefined ? tempPdfTemplate.owner : user.user._id,
            collaborator: tempPdfTemplate.collaborator ? tempPdfTemplate.collaborator : []
          });
          setDetails({
            header: tempPdfTemplate.header,
            footer: tempPdfTemplate.footer,
            aboveTable: tempPdfTemplate.aboveTable,
            belowTable: tempPdfTemplate.belowTable,
            tabelSummaryLeftSide: tempPdfTemplate?.tabelSummaryLeftSide
          });
        } else {
          try {
            const res = await axiosInstance().get(`/quote-pdf-template/${id}`);
            const {
              data: { data }
            } = res;
            setIsLandscapChecked(data?.landscape);
            setInitialValues({
              landscape: data?.landscape,
              productColumns: data?.productColumns,
              name: !isClone ? data?.name : '',
              pageNumberInFooter: data?.pageNumberInFooter,
              header: data?.header,
              footer: data?.footer,
              aboveTable: data?.aboveTable,
              belowTable: data?.belowTable,
              tabelSummaryLeftSide: data?.tabelSummaryLeftSide,
              entity: data?.entity ? data?.entity : [],
              type: data?.type,
              owner: data?.owner && data.owner !== undefined ? data?.owner : user.user._id,
              collaborator: data?.collaborator ? data?.collaborator : []
            });
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
      })();
    } else {
      setInitialValues({
        landscape: false,
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
      });
    }
    fetchUser();
  }, [id]);

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
          productColumns: parseInt(values?.productColumns)
        })
        .then(({ data: { data, message } }) => {
          if (isPreview === true) {
            previewPdfTemplate(data._id);
            setIsUpdatingAndPreview(false);
            if (quoteData?._id) {
              history.push(`${queryParams.quotation ? routes.quotationDetail.path : '/quotes/detail'}/${quoteData?._id}`, {
                versionNumber: `${version}`,
                tabValue: 1
              });
            } else {
              history.push(`${routes.quotePdfTemplateDetail.path}/${data._id}`);
            }
          } else {
            if (quoteData?._id) {
              history.push(`${queryParams.quotation ? routes.quotationDetail.path : '/quotes/detail'}/${quoteData?._id}`, {
                versionNumber: `${version}`,
                tabValue: 1
              });
            } else {
              if (isBreakCrumbPath) {
                history.push({ pathname: isBreakCrumbPath });
              }
            }
            toastConfig.setToastConfig({
              open: true,
              type: 'success',
              message: message
            });
            setIsUpdating(false);
          }
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
                        setShowConfirmDialog(true);
                      }
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <ThemeButton
                    disabled={isUpdating || (!isClone && !hasPermissionToUpdate)}
                    onClick={submitForm}
                    buttonType='theme'
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
                      buttonType='theme'
                      isLoading={isUpdatingAndPreview}
                    >
                      Save & Preview
                    </ThemeButton>
                  )}

                  <ThemeButton
                    onClick={() => {
                      handleClose();
                    }}
                    buttonType='transparent'
                  >
                    Close
                  </ThemeButton>
                </div>
              </div>
              <div className={`main-container ${classes.mainContainer}`}>
                <Box className={classes.paper}>
                  <Grid container>
                    <Grid size={{xs:12, md:6}}></Grid>
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
                  </div>

                  <Grid size={{xs:12}} className="mt-4">
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
                  <Grid size={{xs:12}} className="mt-4">
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
                  <Grid size={{xs:12}} className="mt-4">
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
                  <Grid size={{xs:12}} className="mt-4">
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
                  <Grid size={{xs:12}} className="mt-4">
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
            </div>
          </Form>
        )}
      </Formik>
    </>
  ) : null;
}
