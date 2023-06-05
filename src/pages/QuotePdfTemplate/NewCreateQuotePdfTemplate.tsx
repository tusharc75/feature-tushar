import { useState, useContext, useEffect, Fragment } from 'react';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
import { makeStyles } from '@material-ui/core/styles';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { Formik, Form } from 'formik';
import { object, string, boolean } from 'yup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import { useParams, useHistory } from 'react-router-dom';
import routes from '../../components/Helpers/Routes';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import TinyMce from './../../components/TinyMCE/index';
import CircularProgress from '@material-ui/core/CircularProgress';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import { Autocomplete } from '@material-ui/lab';
import { useData } from '../../StateProvider/Provider';
import { quoteBuilder, PDF_RESOURCE_LIST } from '../../constants/helpers';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import CustomTable from './customTable/customTable';
import { useLocation } from 'react-router-dom';
import queryString from 'query-string';
import { quotation } from '../../constants/helpers';

const defaultProductColumns = 7;

const PdfTemplateSchema = object().shape({
  name: string().min(3, 'Too Short!').max(50, 'Too Long').required('PDF template Name  is required'),
  owner: string().required('Owner is required'),
  type: string().required('Type is required'),
  showPageNumberInFooter: boolean()
});

const useStyles = makeStyles((theme) => ({
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
    width: '725px'
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
    belowTable: ''
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
    state: { user, selectedEntity, permissions }
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
        options.push({ title: routes[item.key] ? routes[item.key]?.title : item.title, value: item.value });
      }
    });
    setpdfResourceOption(options);
  }, []);

  useEffect(() => {
    if (formValues && formValues.type) {
      // let type: any = formValues.type;
      // type = type.split('');
      // if (type[type.length - 1] === 's' && type.join('') !== 'Quotes') {
      //   type.pop();
      // }
      // type = type.join('');
      // if (type === 'Rental Job') {
      //   resource = 'Rental Management';
      // } else {
      //   resource = type;
      // }
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
            showPageNumberInFooter: tempPdfTemplate.pageNumberInFooter,
            header: tempPdfTemplate.header,
            footer: tempPdfTemplate.footer,
            aboveTable: tempPdfTemplate.aboveTable,
            belowTable: tempPdfTemplate.belowTable,
            entity: tempPdfTemplate.entity ? tempPdfTemplate.entity : [],
            type: tempPdfTemplate.type,
            owner: tempPdfTemplate.owner && tempPdfTemplate.owner !== undefined ? tempPdfTemplate.owner : user.user._id,
            collaborator: tempPdfTemplate.collaborator ? tempPdfTemplate.collaborator : []
          });
          setDetails({
            header: tempPdfTemplate.header,
            footer: tempPdfTemplate.footer,
            aboveTable: tempPdfTemplate.aboveTable,
            belowTable: tempPdfTemplate.belowTable
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
              showPageNumberInFooter: data?.pageNumberInFooter,
              header: data?.header,
              footer: data?.footer,
              aboveTable: data?.aboveTable,
              belowTable: data?.belowTable,
              entity: data?.entity ? data?.entity : [],
              type: data?.type,
              owner: data?.owner && data.owner !== undefined ? data?.owner : user.user._id,
              collaborator: data?.collaborator ? data?.collaborator : []
            });
            setDetails({
              header: data?.header,
              footer: data?.footer,
              aboveTable: data?.aboveTable,
              belowTable: data?.belowTable
            });
            if (quoteData?._id) {
              setHasPermissionToUpdate(true);
            } else if (
              data?.owner &&
              data?.owner !== undefined &&
              user.user._id !== data?.owner &&
              !data?.collaborator?.some((d) => d === user.user._id)
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
        showPageNumberInFooter: false,
        header: '',
        footer: '',
        aboveTable: '',
        belowTable: '',
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
      hideDuration: null,
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
    if (isPreview === true) {
      setIsUpdatingAndPreview(true);
    } else {
      setIsUpdating(true);
    }

    if (id === '0' || isClone === true) {
      axiosInstance()
        .post('/quote-pdf-template', {
          ...details,
          name: values.name,
          pageNumberInFooter: values.showPageNumberInFooter,
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
        .then(({ data: { data } }) => {
          if (isPreview === true) {
            previewPdfTemplate(data._id);
            setIsUpdatingAndPreview(false);
            history.push(`${routes.quotePdfTemplateDetail.path}/${data._id}`);
          } else {
            history.push({ pathname: isBreakCrumbPath ? isBreakCrumbPath : routes.quotePdfTemplate.path });
            setIsUpdating(false);
          }
        })
        .catch((error) => {
          setIsUpdating(false);
          setIsUpdatingAndPreview(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      let api = quoteData
        ? `${queryParams.quotation ? quotation.api : '/ quote - builder'}/pdf-template/${quoteData._id}/${version}`
        : '/quote-pdf-template';
      axiosInstance()
        .put(api, {
          _id: id,
          ...details,
          name: values.name,
          pageNumberInFooter: values.showPageNumberInFooter,
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
        .then(({ data: { data } }) => {
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
              history.push({ pathname: isBreakCrumbPath ? isBreakCrumbPath : routes.quotePdfTemplate.path });
            }
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

  return (
    <div className={classes.root}>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs
            routes={[
              {
                title: routes.quotePdfTemplate.title,
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
        </Grid>
      </Grid>
      <div className={`main-container ${classes.mainContainer}`}>
        <Box className={classes.paper}>
          {initialValues && pdfResourceOption ? (
            <Formik
              innerRef={(ref) => ref && setFormValues(ref.values)}
              initialValues={initialValues}
              validationSchema={PdfTemplateSchema}
              onSubmit={handleSubmit}
            >
              {({ submitForm, touched, errors, setFieldValue, values }) => (
                <Form>
                  <Grid container>
                    <Grid item xs={12} md={6}>
                      <TextField
                        disabled={!isClone && (!hasPermissionToUpdate || Boolean(quoteData?._id))}
                        variant="outlined"
                        type="text"
                        label="PDF Template Name"
                        required={true}
                        name="name"
                        fullWidth
                        margin="dense"
                        value={values['name']}
                        error={touched['name'] && Boolean(errors['name'])}
                        helperText={touched['name'] && errors['name']}
                        onChange={(e) => setFieldValue('name', e.target.value.trimStart())}
                      />
                    </Grid>
                    <Grid item xs={12} md={6} className={`${classes.saveButtonContainer} gap-2`}>
                      <Button
                        disabled={isUpdating || (!isClone && !hasPermissionToUpdate)}
                        size="small"
                        color="primary"
                        onClick={submitForm}
                        variant="contained"
                        endIcon={isUpdating && <CircularProgress color="inherit" size={18} />}
                      >
                        Save
                      </Button>

                      {!quoteData && (
                        <Button
                          disabled={!isClone && (isUpdatingAndPreview || !hasPermissionToUpdate)}
                          size="small"
                          color="primary"
                          onClick={() => {
                            setIsPreview(true);
                            submitForm();
                          }}
                          variant="contained"
                          endIcon={isUpdatingAndPreview && <CircularProgress color="inherit" size={18} />}
                        >
                          Save & Preview
                        </Button>
                      )}

                      <Button
                        size="small"
                        color="primary"
                        variant="contained"
                        onClick={() => {
                          if (quoteData?._id) {
                            history.push(`/quotes/detail/${quoteData?._id}`, {
                              versionNumber: `${version}`,
                              tabValue: 1
                            });
                          } else {
                            history.push({ pathname: isBreakCrumbPath ? isBreakCrumbPath : routes.quotePdfTemplate.path });
                          }
                        }}
                      >
                        Close
                      </Button>
                    </Grid>
                    {showConfirmDialog ? (
                      <ConfirmCancelDialog
                        close={() => setShowConfirmDialog(false)}
                        open={showConfirmDialog}
                        onSave={() => {
                          setShowConfirmDialog(false);
                          submitForm();
                        }}
                        onClose={() => {
                          //  This condition is to check either user is redirected from quote details screen or not
                          if (history.location?.state?.redirectTo) {
                            if (isBreakCrumbPath) {
                              history.push({ pathname: routes.quotePdfTemplate.path });
                              setIsBreakCrumbPath('');
                            } else {
                              history.push(history.location?.state?.redirectTo);
                            }
                          } else {
                            setShowConfirmDialog(false);
                            history.push({ pathname: isBreakCrumbPath ? isBreakCrumbPath : routes.quotePdfTemplate.path });
                            setIsBreakCrumbPath('');
                          }
                        }}
                      />
                    ) : null}
                  </Grid>
                  {!Boolean(quoteData?._id) && (
                    <Grid container spacing={1}>
                      <Grid item xs={12} sm={3}>
                        {
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
                                margin="dense"
                                name="entity"
                                label="Entity"
                                variant="outlined"
                                error={touched['entity'] && Boolean(errors['entity'])}
                                helperText={touched['entity'] && errors['entity']}
                                fullWidth
                              />
                            )}
                          />
                        }
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        {
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
                                margin="dense"
                                name="owner"
                                label="Owner"
                                variant="outlined"
                                error={touched['owner'] && Boolean(errors['owner'])}
                                helperText={touched['owner'] && errors['owner']}
                                fullWidth
                              />
                            )}
                          />
                        }
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        {
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
                                margin="dense"
                                name="collaborator"
                                label="Collaborator"
                                variant="outlined"
                                error={touched['collaborator'] && Boolean(errors['collaborator'])}
                                helperText={touched['collaborator'] && errors['collaborator']}
                                fullWidth
                              />
                            )}
                          />
                        }
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        {
                          <Autocomplete
                            disabled={!isClone && !hasPermissionToUpdate}
                            getOptionLabel={(option) => option.title}
                            getOptionSelected={(option, value) => option.value === value.value}
                            value={
                              pdfResourceOption.find((data) => data.value === values['type'])
                                ? pdfResourceOption.find((data) => data.value === values['type'])
                                : ''
                            }
                            options={pdfResourceOption}
                            onChange={(e, val: any) => {
                              setFieldValue('type', val ? val.value : '');
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                required={true}
                                margin="dense"
                                name="type"
                                label="Type"
                                variant="outlined"
                                error={touched['type'] && Boolean(errors['type'])}
                                helperText={touched['type'] && errors['type']}
                                fullWidth
                              />
                            )}
                          />
                        }
                      </Grid>
                    </Grid>
                  )}

                  <Grid container spacing={1}>
                    <Grid item xs={12} sm={3} style={{ textAlign: 'left' }}>
                      <FormControlLabel
                        disabled={!isClone && !hasPermissionToUpdate}
                        value={values['showPageNumberInFooter']}
                        control={
                          <Checkbox
                            name="showPageNumberInFooter"
                            checked={values['showPageNumberInFooter']}
                            onChange={(e) => {
                              setFieldValue('showPageNumberInFooter', e.target.checked);
                            }}
                            color="primary"
                          />
                        }
                        label="Show page number in footer"
                      />
                    </Grid>
                    <Grid item xs={12} sm={3} style={{ textAlign: 'left' }}>
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
                    </Grid>
                    <Grid item xs={12} sm={3} style={{ textAlign: 'left' }}>
                      <TextField
                        name="productColumns"
                        label="No. of Product Columns"
                        value={values['productColumns']}
                        type="number"
                        fullWidth
                        variant="outlined"
                        size="small"
                        InputProps={{ inputProps: { min: 5, max: 20 } }}
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
                    </Grid>
                  </Grid>
                </Form>
              )}
            </Formik>
          ) : null}
          <Grid item xs={12} className="mt-4">
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
          <Grid item xs={12} className="mt-4">
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
          <Grid item xs={12} className="mt-4">
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
          <Grid item xs={12} className="mt-4">
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
          <CustomTable id={id} classes={classes} entity={selectedEntity} table={table} setTable={setTable} />
        </Box>
      </div>
    </div>
  );
}
