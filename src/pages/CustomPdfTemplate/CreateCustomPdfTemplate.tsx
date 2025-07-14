import { useState, useContext, useEffect, useRef } from 'react';
import Grid from '@mui/material/Grid2';
import TextField from '@mui/material/TextField';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { Formik, Form } from 'formik';
import { object, string } from 'yup';
import { useParams, useHistory } from 'react-router-dom';
import routes from '../../components/Helpers/Routes';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import { Autocomplete, IconButton } from '@mui/material';
import { useData } from '../../StateProvider/Provider';
import { sidebarResource, checkIsAllowedToEdit, customPdfTemplate, PDF_RESOURCE_LIST } from '../../constants/helpers';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import DeviceMessage from 'src/components/ScreenMessages/DeviceMessage';
import { isEqual, template } from 'lodash';
import PdfEditor from './PdfEditor';
import { CUSTOM_A4_PDF, Template } from '@pdfme/common';
import { generate } from '@pdfme/generator';
import { getPlugins } from './PdfEditor/plugin';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

const PdfTemplateSchema = object().shape({
  name: string().min(3, 'Too Short!').max(50, 'Too Long').required('PDF template Name is required'),
  owner: string().required('Owner is required'),
  type: string().required('Type is required'),
});

const PDF_ME_TEMPLATE_STORAGE_KEY = 'pdfme_current_template';
const DEFAULT_EMPTY_PDFME_TEMPLATE: Template = { schemas: [[]], basePdf: CUSTOM_A4_PDF };

export default function CreateCustomPdfTemplate() {
  const { id } = useParams();
  const history = useHistory();
  const [initialValues, setInitialValues] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const toastConfig = useContext(CustomToastContext);
  const [isClone] = useState(history.location.state?.isClone ? true : false);
  const {
    state: { user, selectedEntity, resources, permissions }
  }: any = useData();
  const [isEdit, setIsEdit] = useState(id === '0' ? true : false);
  const [allowedToEdit, setAllowedToEdit] = useState(id === '0' ? true : false);
  const [ownerCollaboratorData, setOwnerCollaboratorData] = useState([]);
  const [ownerCollaboratorDataConst, setOwnerCollaboratorDataConst] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isBreakCrumbPath, setIsBreakCrumbPath] = useState('');
  const [formValues, setFormValues] = useState(null);
  const [btnLoading, setBtnLoading] = useState(false);
  const [pdfResourceOption, setpdfResourceOption] = useState(null);
  const [showProps, setShowProps] = useState<boolean>(false);
  const [noOfPages, setNoOfPages] = useState<number>(1);
  const noOfPagesInputRef = useRef<HTMLInputElement>(null);
  const [showConfirmNoOfPages, setShowConfirmNoOfpages] = useState<boolean>(false);
  const [serviceOptions, setServiceOptions] = useState([]);
  const [variables, setVariables] = useState([]);

  useEffect(() => {
    const options = [];
    PDF_RESOURCE_LIST?.forEach((item) => {
      if (permissions[item.key] && permissions[item.key]?.isRead === true) {
        options.push({ title: resources[item.key] ? resources[item.key]?.titleSingular : item.title, value: item.value });
      }
    });
    setpdfResourceOption(options);
  }, []);

  useEffect(() => {
    if (formValues?.template) {
      localStorage.setItem(PDF_ME_TEMPLATE_STORAGE_KEY, JSON.stringify(formValues?.template));
    }
  }, [formValues?.template]);

  useEffect(() => {
    if (formValues && formValues.type) {
      let resource: string = formValues.type;
      if (resource) {
        axiosInstance()
          .get(`/field?resource=${resource}`)
          .then(({ data: { data } }) => {
            const vars = data.map((field) => field.fieldData.fieldName);
            setVariables(['entity', 'currentDate', ...vars]);
          })
          .catch((err) => {
            toastConfig.setToastConfig(err);
          });
      }
    }
    if (formValues && formValues.type === sidebarResource.workOrder) {
      fetchServiceOptions();
    }
  }, [formValues?.type]);

  useEffect(() => {
    fetchData();
    fetchUser();
  }, [id]);

  const fetchServiceOptions = async () => {
    await axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=${sidebarResource?.serviceMaster}`)
      .then(({ data: { data } }) => {
        setServiceOptions(data[sidebarResource?.serviceMaster] || []);
      })
      .catch((e) => {
        toastConfig.setToastConfig(e);
      });
  };

  const generateInitialTemplate = (numPages: number): Template => {
    if (numPages <= 0) {
      return DEFAULT_EMPTY_PDFME_TEMPLATE;
    }
    const A4_WIDTH = 215;
    const A4_HEIGHT = 300;
    const DEFAULT_PADDING: [number, number, number, number] = [0, 0, 0, 0];
    const schemas: any[][] = Array.from({ length: numPages }, () => []);
    const newTemplate: Template = {
      basePdf: {
        width: A4_WIDTH,
        height: A4_HEIGHT,
        padding: DEFAULT_PADDING,
      },
      schemas: schemas,
    };
    return newTemplate;
  };

  const fetchData = async () => {
    const initialValuesData = {
      name: '',
      entity: selectedEntity ? [selectedEntity] : [],
      type: '',
      owner: user.user._id,
      collaborator: [],
      services: [],
      noOfPages: 1,
      template: null,
    };
    const stored = localStorage.getItem(PDF_ME_TEMPLATE_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.schemas) && parsed.basePdf) {
        console.log('Using stored template:', parsed);
        initialValuesData.template = parsed;
      } else {
        localStorage.removeItem(PDF_ME_TEMPLATE_STORAGE_KEY);
      }
    }
    if (id && id !== '0') {
      try {
        const res = await axiosInstance().get(`${customPdfTemplate.api}/${id}`);
        const {
          data: { data }
        } = res;
        initialValuesData.name = !isClone ? data?.name : '';
        initialValuesData.entity = data?.entity ? data?.entity : [];
        initialValuesData.type = data?.type;
        initialValuesData.owner = isClone ? user.user._id : data?.owner || user.user._id;
        initialValuesData.collaborator = data?.collaborator ? data?.collaborator : [];
        initialValuesData.noOfPages = data?.noOfPages ? data?.noOfPages : 1;
        initialValuesData.services = data?.services ? data?.services : [];
        if (data?.template && !initialValuesData?.template) {
          initialValuesData.template = data?.template;
          setNoOfPages(data.template.schemas.length > 0 ? data.template.schemas.length : 1);
        } else {
          if (!initialValuesData.template) {
            const newTemplate = generateInitialTemplate(initialValuesData.noOfPages);
            initialValuesData.template = newTemplate;
            setNoOfPages(initialValuesData.noOfPages);
          }
        }
        setAllowedToEdit(
          checkIsAllowedToEdit(user, sidebarResource.customPdfTemplate, {
            owner: {
              optionValue: initialValuesData.owner
            },
            collaborator: initialValuesData.collaborator?.map((e) => {
              return { optionValue: e };
            })
          })
        );
        if (isClone) {
          setAllowedToEdit(true);
          setIsEdit(true);
        }
      } catch (e) {
        toastConfig.setToastConfig(e);
        setNoOfPages(0);
        localStorage.removeItem(PDF_ME_TEMPLATE_STORAGE_KEY);
      }
    } else {
      if (!initialValuesData.template) {
        const newTemplate = generateInitialTemplate(initialValuesData.noOfPages);
        initialValuesData.template = newTemplate;
        setNoOfPages(initialValuesData.noOfPages);
      }
    }
    setInitialValues({ ...initialValuesData });
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

  const generatePreviewPdf = async () => {
    try {
      setBtnLoading(true);
      const singleInput: { [key: string]: any } = {};
      if (!formValues || !formValues?.template) {
        throw new Error("No template available for preview.");
      }
      formValues?.template.schemas.forEach(pageSchema => {
        pageSchema.forEach(field => {
          if (field.name && field.content !== undefined) {
            singleInput[field.name] = field.content;
          }
        });
      });
      const finalInputs = [singleInput];
      const pdf = await generate({
        template: formValues?.template,
        inputs: finalInputs,
        plugins: getPlugins(variables)
      });
      const pdfBytes = new Uint8Array(pdf.buffer);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setBtnLoading(false);
      window.open(URL.createObjectURL(blob));

    } catch (error: any) {
      setBtnLoading(false);
      toastConfig.setToastConfig({
        open: true,
        type: 'error',
        message: `Failed to generate PDF preview: ${error.message || 'An unknown error occurred.'}`
      });
    }
  };

  const handleSubmit = async (values) => {
    const trimmedName = values.name.trim();
    setIsUpdating(true);
    const submitData = {
      name: trimmedName,
      entity: values?.entity,
      type: values?.type,
      owner: values?.owner,
      collaborator: values?.collaborator,
      template: values?.template || generateInitialTemplate(values?.noOfPages),
      services: values?.services,
      noOfPages: noOfPages
    };
    try {
      let response;
      if (id === '0' || isClone === true) {
        response = await axiosInstance().post(`${customPdfTemplate.api}`, submitData);
      } else {
        response = await axiosInstance().put(`${customPdfTemplate.api}`, {
          _id: id,
          ...submitData
        });
      }
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: response.data.message
      });
      localStorage.removeItem(PDF_ME_TEMPLATE_STORAGE_KEY);
      setIsUpdating(false);
      if (isBreakCrumbPath && !isClone) {
        history.push({ pathname: isBreakCrumbPath });
      } else {
        history.push(routes.customPdfTemplate.path);
      }
      setIsEdit(false);
    } catch (error) {
      setIsUpdating(false);
      toastConfig.setToastConfig(error);
    }
  };

  const handleClose = () => {
    history.push({ pathname: isBreakCrumbPath ? isBreakCrumbPath : routes.customPdfTemplate.path });
    localStorage.removeItem(PDF_ME_TEMPLATE_STORAGE_KEY);
  };

  return initialValues && (
    <>
      <DeviceMessage backPath={routes.customPdfTemplate.path} />
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
                    routes={[{ title: resources?.customPdfTemplate?.titlePlural, path: routes.customPdfTemplate.path },
                    { title: id === '0' ? 'New' : isClone === true ? 'Clone' : initialValues && initialValues.name }
                    ]}
                    isConfirmBeforeClick={allowedToEdit}
                    onBreadCrumbClick={(path) => {
                      setIsBreakCrumbPath(path);
                      if (allowedToEdit) {
                        if (!isEqual(values, initialValues)) {
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
                    <ThemeButton disabled={isUpdating || !allowedToEdit} onClick={submitForm} buttonType="theme" isLoading={isUpdating}>
                      Save
                    </ThemeButton>
                  )}
                  {!isEdit && allowedToEdit && (
                    <ThemeButton buttonType="theme" onClick={() => setIsEdit(true)}>
                      Edit
                    </ThemeButton>
                  )}
                  {formValues?.template && (
                    <ThemeButton
                      mobileTooltip="Preview"
                      iconForMobile={<VisibilityIcon />}
                      startIcon={<VisibilityIcon />}
                      disabled={btnLoading || !formValues?.template}
                      onClick={generatePreviewPdf}
                    >
                      {btnLoading ? 'Please wait...' : 'Preview'}
                    </ThemeButton>
                  )}
                  <ThemeButton
                    onClick={() => {
                      if (allowedToEdit && !isEqual(values, initialValues)) {
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
              <div className="main-container">
                <div className="mt-4">
                  <Grid container spacing={1} >
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                      <TextField
                        disabled={!allowedToEdit || !isEdit}
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
                        options={pdfResourceOption}
                        getOptionLabel={(option) => option.title}
                        isOptionEqualToValue={(option, value) => option.value === value.value}
                        value={values.type ? pdfResourceOption.find((option) => option.value === values.type) || null : null}
                        onChange={(e, val) => {
                          setFieldValue('type', val ? val.value : '');
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            required
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
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                      <Autocomplete
                        disabled={!allowedToEdit || !isEdit}
                        multiple
                        options={user?.entity}
                        getOptionLabel={(option: any) => (option ? option?.entityName : '')}
                        value={user?.entity.filter((data) => values['entity']?.some((d) => d === data._id)).length
                          ? user?.entity.filter((data) => values['entity']?.some((d) => d === data._id))
                          : []
                        }
                        onChange={(e, val) => {
                          setFieldValue('entity', val && val?.map((d) => d._id));
                          setFieldValue('owner', '');
                          setFieldValue('collaborator', []);
                          val && val.length !== 0 ? setOwnerCollaboratorData(
                            ownerCollaboratorDataConst.filter((data) =>
                              val?.some((d) => data.entities?.some((e) => e?.entity?._id === d._id))
                            )
                          ) : setOwnerCollaboratorData(ownerCollaboratorDataConst);
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
                                values['entity']?.some((d) => data.entities?.some((e) => e?.entity?._id === d))
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
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                      <TextField
                        disabled={!allowedToEdit || !isEdit || (id !== '0' && !isClone)}
                        variant="outlined"
                        type="number"
                        label="No of Pages"
                        required
                        name="noOfPages"
                        fullWidth
                        margin="none"
                        size="small"
                        value={noOfPagesInputRef.current ? noOfPagesInputRef.current.value : noOfPages}
                        inputRef={noOfPagesInputRef}
                        onChange={(e) => {
                          setShowProps(true);
                          setFieldValue('noOfPages', parseInt(e.target.value || '0', 10));
                        }}
                        InputProps={{
                          endAdornment: showProps && (
                            <>
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => {
                                  const newPageCount = parseInt(noOfPagesInputRef.current?.value || '0', 10);
                                  if (newPageCount !== noOfPages) {
                                    setShowConfirmNoOfpages(true);
                                  } else {
                                    setShowProps(false);
                                  }
                                }}
                              >
                                <CheckIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  if (noOfPagesInputRef.current) {
                                    noOfPagesInputRef.current.value = String(noOfPages);
                                  }
                                  setFieldValue('noOfPages', noOfPages);
                                  setShowProps(false);
                                }}
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </>
                          )
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                      {values.type === 'Work Order' && serviceOptions.length > 0 &&
                        <Autocomplete
                          limitTags={2}
                          disabled={!allowedToEdit || !isEdit}
                          multiple
                          options={serviceOptions}
                          getOptionLabel={(option: any) => option?.optionLabel || ''}
                          isOptionEqualToValue={(option, value) => option.optionValue === value.optionValue}
                          value={
                            serviceOptions.filter((opt) =>
                              values['services']?.some((s) => s === opt.optionValue)
                            )
                          }
                          onChange={(e, val) => {
                            const selectedIds = val?.map((d) => d.optionValue) || [];
                            setFieldValue('services', selectedIds);
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Services"
                              variant="outlined"
                              size="small"
                              fullWidth
                              margin="none"
                              name="services"
                            />
                          )}
                        />}
                    </Grid>
                  </Grid>
                </div>
                {values?.template &&
                  <div className='mt-4'>
                    <PdfEditor
                      template={values?.template as Template}
                      onTemplateChange={(values: Template) => { setFieldValue('template', values); }}
                      disabled={!isEdit || !allowedToEdit}
                      noOfPages={noOfPages}
                      variables={variables}
                    />
                  </div>}
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
              {showConfirmNoOfPages && (
                <ConfirmationDialog
                  open={showConfirmNoOfPages}
                  message={'Changing the number of pages will discard your current template design. Do you want to proceed?'}
                  onClose={() => {
                    setShowConfirmNoOfpages(false);
                    if (noOfPagesInputRef.current) {
                      noOfPagesInputRef.current.value = String(noOfPages);
                    }
                    setFieldValue('noOfPages', noOfPages);
                  }}
                  onOk={() => {
                    const newPageCount = parseInt(noOfPagesInputRef.current?.value || '0', 10);
                    const newTemplate = generateInitialTemplate(newPageCount);
                    values.template = newTemplate;
                    setNoOfPages(newPageCount);
                    setShowConfirmNoOfpages(false);
                    setShowProps(false);
                  }}
                />
              )}
            </div >
          </Form >
        )
        }
      </Formik >
    </>
  );
}