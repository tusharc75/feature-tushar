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
import { PDF_RESOURCE_LIST, sidebarResource, checkIsAllowedToEdit, customPdfTemplate } from '../../constants/helpers';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import DeviceMessage from 'src/components/ScreenMessages/DeviceMessage';
import { isEqual } from 'lodash';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import PdfEditor from './PdfEditor.tsx';
import { CUSTOM_A4_PDF } from '@pdfme/common';

const PdfTemplateSchema = object().shape({
  name: string().min(3, 'Too Short!').max(50, 'Too Long').required('PDF template Name is required'),
  owner: string().required('Owner is required'),
  type: string().required('Type is required')
});
  const PDF_ME_TEMPLATE_STORAGE_KEY = 'pdfme_current_template';


export default function CreateCustomPdfTemplate() {
  const { id } = useParams();
  const history = useHistory();
  const [initialValues, setInitialValues] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const toastConfig = useContext(CustomToastContext);
  const [isClone] = useState(history.location.state?.isClone ? true : false);

  const {
    state: { user, selectedEntity, permissions, resources }
  }: any = useData();

  const [ownerCollaboratorData, setOwnerCollaboratorData] = useState([]);
  const [ownerCollaboratorDataConst, setOwnerCollaboratorDataConst] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isBreakCrumbPath, setIsBreakCrumbPath] = useState('');
  // const [pdfResourceOption, setPdfResourceOption] = useState(null);

  const [formValues, setFormValues] = useState(null);

  const [template, setTemplate] = useState<any>(() => {
    try {
      const storedTemplate = localStorage.getItem(PDF_ME_TEMPLATE_STORAGE_KEY);
      if (storedTemplate) {
        // Parse as 'any' first to avoid strict type issues with JSON.parse
        const parsed: any = JSON.parse(storedTemplate);
        // Basic check to ensure it loosely resembles a Template type
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.schemas) && parsed.basePdf) {
          return parsed as any; // Cast to Template if basic structure is there
        }
      }
    } catch (error) {
      // Handle parsing errors gracefully
      console.error('Failed to parse template from localStorage:', error);
      localStorage.removeItem(PDF_ME_TEMPLATE_STORAGE_KEY); // Clear potentially corrupted data
    }
    // Fallback to initialTemplate prop or default empty template
    return { schemas: [[]], basePdf: CUSTOM_A4_PDF };
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


  const [isEdit, setIsEdit] = useState(id === '0' ? true : false);
  const [allowedToEdit, setAllowedToEdit] = useState(id === '0' ? true : false);

  // useEffect(() => {
  //   const options = [];
  //   PDF_RESOURCE_LIST?.forEach((item) => {
  //     if (permissions[item.key] && permissions[item.key]?.isRead === true) {
  //       options.push({ title: resources[item.key] ? resources[item.key]?.titleSingular : item.title, value: item.value });
  //     }
  //   });
  //   for (const [key] of Object.entries(permissions)) {
  //     let result = key?.replace(/ /g, '').toLowerCase();
  //     let foundFlag = false;
  //     for (const [key2, value2] of Object.entries(sidebarResource)) {
  //       if (value2?.replace(/ /g, '').toLowerCase() === result) {
  //         foundFlag = true;
  //         break;
  //       }
  //     }
  //     if (!foundFlag) {
  //       options.push({ title: startCase(camelCase(key)), value: startCase(camelCase(key)) });
  //     }
  //   }
  //   setPdfResourceOption(options);
  // }, []);

  useEffect(() => {
    fetchData();
    fetchUser();
  }, [id]);

  const fetchData = async () => {
    const initialValues = {
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

        initialValues.name = !isClone ? data?.name : '';
        initialValues.entity = data?.entity ? data?.entity : [];
        initialValues.type = data?.type;
        initialValues.owner = isClone ? user.user._id : data?.owner || user.user._id;
        initialValues.collaborator = data?.collaborator ? data?.collaborator : [];

        setAllowedToEdit(
          checkIsAllowedToEdit(user, sidebarResource.CustomPdfTemplate, {
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
      } catch (e) {
        toastConfig.setToastConfig(e);
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

  const handleSubmit = (values) => {
    const trimmedName = values.name.trim();
    setIsUpdating(true);

    const submitData = {
      name: trimmedName,
      entity: values?.entity,
      type: values?.type,
      owner: values?.owner,
      collaborator: values?.collaborator
    };

    if (id === '0' || isClone === true) {
      axiosInstance()
        .post(`${customPdfTemplate.api}`, submitData)
        .then(({ data: { data, message } }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: message
          });
          setIsUpdating(false);
          history.push(routes.customPdfTemplate.path);
        })
        .catch((error) => {
          setIsUpdating(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      axiosInstance()
        .put(`${customPdfTemplate.api}`, {
          _id: id,
          ...submitData
        })
        .then(({ data: { data, message } }) => {
          if (isBreakCrumbPath) {
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
          history.push(routes.customPdfTemplate.path);
        })
        .catch((error) => {
          setIsUpdating(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleClose = () => {
    history.push({ pathname: isBreakCrumbPath ? isBreakCrumbPath : routes.customPdfTemplate.path });
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
                    routes={[
                      {
                        title: "Custom Pdf Templates",
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
              <div className={`main-container`}>
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
                            value={{ title: 'Work Order', value: 'Work Order' }} // force-fixed
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
                <div className='mt-4'>
                  <PdfEditor
                    template={template}
                    onTemplateChange={handleTemplateChange}
                  />
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
}