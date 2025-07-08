import { useState, useContext, useEffect } from 'react';
import Grid from '@mui/material/Grid2';
import TextField from '@mui/material/TextField';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { Formik, Form } from 'formik';
import { object, string } from 'yup';
import { useParams, useHistory } from 'react-router-dom';
import routes from '../../components/Helpers/Routes';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import { Autocomplete } from '@mui/material';
import { useData } from '../../StateProvider/Provider';
import { sidebarResource, checkIsAllowedToEdit, customPdfTemplate } from '../../constants/helpers';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import DeviceMessage from 'src/components/ScreenMessages/DeviceMessage';
import { isEqual } from 'lodash';
import PdfEditor from './PdfEditor';
import { CUSTOM_A4_PDF } from '@pdfme/common';
import { generate } from '@pdfme/generator';
import { getPlugins } from './PdfEditor/plugin';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import VisibilityIcon from '@mui/icons-material/Visibility';

const PdfTemplateSchema = object().shape({
  name: string().min(3, 'Too Short!').max(50, 'Too Long').required('PDF template Name is required'),
  owner: string().required('Owner is required'),
  type: string().required('Type is required')
});
const PDF_ME_TEMPLATE_STORAGE_KEY = 'pdfme_current_template';

const DEFAULT_EMPTY_PDFME_TEMPLATE = { schemas: [[]], basePdf: CUSTOM_A4_PDF };

export default function CreateCustomPdfTemplate() {
  const { id } = useParams();
  const history = useHistory();
  const [initialValues, setInitialValues] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const toastConfig = useContext(CustomToastContext);
  const [isClone] = useState(history.location.state?.isClone ? true : false);

  const {
    state: { user, selectedEntity }
  }: any = useData();

  const [isEdit, setIsEdit] = useState(id === '0' ? true : false);
  const [allowedToEdit, setAllowedToEdit] = useState(id === '0' ? true : false);
  const [ownerCollaboratorData, setOwnerCollaboratorData] = useState([]);
  const [ownerCollaboratorDataConst, setOwnerCollaboratorDataConst] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isBreakCrumbPath, setIsBreakCrumbPath] = useState('');
  const [formValues, setFormValues] = useState(null);
  const [btnLoading, setBtnLoading] = useState(false);

  const [template, setTemplate] = useState<any>(() => {
    if (id === '0') {
      return DEFAULT_EMPTY_PDFME_TEMPLATE;
    }
    try {
      const storedTemplate = localStorage.getItem(PDF_ME_TEMPLATE_STORAGE_KEY);
      if (storedTemplate) {
        const parsed: any = JSON.parse(storedTemplate);
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.schemas) && parsed.basePdf) {
          return parsed as any;
        }
      }
    } catch (error) {
      localStorage.removeItem(PDF_ME_TEMPLATE_STORAGE_KEY);
    }
    return DEFAULT_EMPTY_PDFME_TEMPLATE;
  });

  const handleTemplateChange = (tpl: any) => {
    setTemplate(tpl);
  };

  useEffect(() => {
    if (template) {
      localStorage.setItem(PDF_ME_TEMPLATE_STORAGE_KEY, JSON.stringify(template));
    } else {
      localStorage.removeItem(PDF_ME_TEMPLATE_STORAGE_KEY);
    }
  }, [template]);

  useEffect(() => {
    fetchData();
    fetchUser();
    return () => {
      localStorage.removeItem(PDF_ME_TEMPLATE_STORAGE_KEY);
    };
  }, [id]);

  const fetchData = async () => {
    const initialValuesData = {
      name: '',
      entity: selectedEntity ? [selectedEntity] : [],
      type: '',
      owner: user.user._id,
      collaborator: []
    };

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

        if (data?.template) {
          setTemplate(data.template);
          localStorage.setItem(PDF_ME_TEMPLATE_STORAGE_KEY, JSON.stringify(data.template));
        } else {
          setTemplate(DEFAULT_EMPTY_PDFME_TEMPLATE);
          localStorage.removeItem(PDF_ME_TEMPLATE_STORAGE_KEY);
        }

        setAllowedToEdit(
          checkIsAllowedToEdit(user, sidebarResource.CustomPdfTemplate, {
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
        setTemplate(DEFAULT_EMPTY_PDFME_TEMPLATE);
        localStorage.removeItem(PDF_ME_TEMPLATE_STORAGE_KEY);
      }
    } else {
      setTemplate(DEFAULT_EMPTY_PDFME_TEMPLATE);
      localStorage.removeItem(PDF_ME_TEMPLATE_STORAGE_KEY);
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
      const inputsForPreview = template?.schemas?.map((pageSchema) => {
        const pageInput = {};
        pageSchema.forEach((field) => {
          if (field.name && field.content !== undefined) {
            pageInput[field.name] = field.content;
          }
        });
        return pageInput;
      });

      const finalInputs = inputsForPreview?.length > 0 ? inputsForPreview : [{}];
      const pdf = await generate({ template: template, inputs: finalInputs, plugins: getPlugins() });

      const pdfBytes = new Uint8Array(pdf.buffer);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setBtnLoading(false);
      window.open(URL.createObjectURL(blob));
    } catch (error) {
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
      template: template
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

  return (
    initialValues && (
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
                      routes={[
                        {
                          title: 'Custom Pdf Templates',
                          path: routes.customPdfTemplate.path
                        },
                        {
                          title: id === '0' ? 'New' : isClone === true ? 'Clone' : initialValues && initialValues.name
                        }
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
                    {!isEdit && (
                      <ThemeButton
                        mobileTooltip="Preview"
                        iconForMobile={<VisibilityIcon />}
                        startIcon={<VisibilityIcon />}
                        disabled={btnLoading}
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
                    <Grid container spacing={2} direction={'column'}>
                      <Grid>
                        <Grid container spacing={2}>
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
                              options={[{ title: 'Work Order', value: 'Work Order' }]}
                              getOptionLabel={(option) => option.title}
                              isOptionEqualToValue={(option, value) => option.value === value.value}
                              value={
                                values.type
                                  ? [{ title: 'Work Order', value: 'Work Order' }].find((option) => option.value === values.type) || null
                                  : null
                              }
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
                    </Grid>
                  </div>
                  <div className="mt-4">
                    <PdfEditor initialTemplate={template} onTemplateChange={handleTemplateChange} disabled={!isEdit || !allowedToEdit} />
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
              </div>
            </Form>
          )}
        </Formik>
      </>
    )
  );
}
