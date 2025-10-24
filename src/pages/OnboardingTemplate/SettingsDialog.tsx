import { useState, useContext, useEffect } from 'react';
import { useFormik } from 'formik';
import { Dialog, Box, TextField, Chip, Checkbox, FormControlLabel } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import routes from 'src/components/Helpers/Routes';
import { sidebarResource } from 'src/constants/helpers';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  step: any;
  onboardingTemplateId?: string;
  tabId?: string;
  fetchData?: () => void;
}

interface FormValues {
  users: string[];
  roles: string[];
  filledByCandidate: boolean;
  createEquiptAccount: boolean;
  accountCreateRole: string[];
  accountCreateEntity: string[];
}

const SettingsDialog = ({
  open,
  onClose,
  step,
  onboardingTemplateId,
  tabId,
  fetchData
}: SettingsDialogProps) => {
  const toastConfig = useContext(CustomToastContext);
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const formik = useFormik<FormValues>({
    initialValues: {
      users: [],
      roles: [],
      filledByCandidate: false,
      createEquiptAccount: false,
      accountCreateRole: [],
      accountCreateEntity: []
    },
    onSubmit: async (values) => {
      await handleSettingsSave(values);
    },
  });

  useEffect(() => {
    if (open) {
      formik.setValues({
        users: step?.properties?.users || [],
        roles: step?.properties?.roles || [],
        filledByCandidate: step?.properties?.filledByCandidate || false,
        createEquiptAccount: step?.properties?.createEquiptAccount || false,
        accountCreateRole: step?.properties?.accountCreateRole || [],
        accountCreateEntity: step?.properties?.accountCreateEntity || []
      });
      fetchUsersRolesAndEntities();
    }
  }, [open, step]);

  const fetchUsersRolesAndEntities = async () => {
    setLoading(true);
    axiosInstance().get(`/sa-formbuilder/lookup?lookupResource=${sidebarResource.user},${sidebarResource.role},${sidebarResource.entity}`).then(
      ({ data: { data } }) => {
        setUsers(data?.[sidebarResource.user] || []);
        setRoles(data?.[sidebarResource.role] || []);
        setEntities(data?.[sidebarResource.entity] || []);
      }
    ).catch((error) => {
      setLoading(false);
      toastConfig.setToastConfig(error);
    });
  };

  const handleSettingsSave = async (properties: FormValues) => {
    if (!onboardingTemplateId || !tabId) {
      toastConfig.setToastConfig({
        open: true,
        type: 'error',
        message: 'Missing required parameters'
      });
      return;
    }
    setIsSubmitting(true);
    const api = `${routes.onboardingTemplate.path}/tabs/steps/${onboardingTemplateId}/${tabId}/settings`;
    axiosInstance().put(api, {
      stepId: step?._id,
      properties
    }).then(({ data }) => {
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: data.message
      });
      if (fetchData) {
        fetchData();
      }
      onClose();
    }).catch((error) => {
      setIsSubmitting(false);
      toastConfig.setToastConfig(error);
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullScreen={fullScreen} fullWidth>
      <CustomDialogHeader
        onClose={onClose}
        title={'Settings'}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
        showRequiredLabel={false}
      />
      <form onSubmit={formik.handleSubmit}>
        <CustomDialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formik.values.filledByCandidate}
                  onChange={(e) => {
                    formik.setFieldValue('filledByCandidate', e.target.checked)
                    if (e.target.checked) {
                      formik.setFieldValue('users', [])
                      formik.setFieldValue('roles', [])
                    }
                  }}
                  name="filledByCandidate"
                />
              }
              label="Filled By Candidate"
            />
            {!formik.values.filledByCandidate &&
              <>
                <Autocomplete
                  multiple
                  options={users}
                  loading={loading}
                  getOptionLabel={(option) => option.optionLabel || ''}
                  value={users.filter(user => formik.values.users.includes(user.optionValue)) || []}
                  onChange={(e, newValue) => {
                    formik.setFieldValue('users',
                      newValue.map(user => user.optionValue)
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Users"
                      variant="outlined"
                      size="small"
                    />
                  )}
                  renderTags={(tagValue, getTagProps) =>
                    tagValue.map((option, index) => (
                      <Chip
                        label={option.optionLabel}
                        {...getTagProps({ index })}
                        size="small"
                        key={option.optionValue}
                      />
                    ))
                  }
                />
                <Autocomplete
                  multiple
                  options={roles}
                  loading={loading}
                  getOptionLabel={(option) => option.optionLabel || ''}
                  value={roles.filter(role => formik.values.roles.includes(role.optionValue)) || []}
                  onChange={(e, newValue) => {
                    formik.setFieldValue(
                      'roles',
                      newValue.map(role => role.optionValue)
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Roles"
                      variant="outlined"
                      size="small"
                    />
                  )}
                  renderTags={(tagValue, getTagProps) =>
                    tagValue.map((option, index) => (
                      <Chip
                        label={option.optionLabel}
                        {...getTagProps({ index })}
                        size="small"
                        key={option.optionValue}
                      />
                    ))
                  }
                />
              </>
            }
            <FormControlLabel
              control={
                <Checkbox
                  checked={formik.values.createEquiptAccount}
                  onChange={(e) =>
                    formik.setFieldValue('createEquiptAccount', e.target.checked)
                  }
                  name="createEquiptAccount"
                />
              }
              label="Create Equipt Account"
            />
            {formik.values.createEquiptAccount && (
              <>
                <Autocomplete
                  multiple
                  options={entities}
                  loading={loading}
                  getOptionLabel={(option) => option.optionLabel || ''}
                  value={entities.filter(entity => formik.values.accountCreateEntity.includes(entity.optionValue)) || []}
                  onChange={(e, newValue) => {
                    formik.setFieldValue(
                      'accountCreateEntity',
                      newValue.map(entity => entity.optionValue)
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Entity"
                      variant="outlined"
                      size="small"
                    />
                  )}
                  renderTags={(tagValue, getTagProps) =>
                    tagValue.map((option, index) => (
                      <Chip
                        label={option.optionLabel}
                        {...getTagProps({ index })}
                        size="small"
                        key={option.optionValue}
                      />
                    ))
                  }
                />
                <Autocomplete
                  multiple
                  options={roles}
                  loading={loading}
                  getOptionLabel={(option) => option.optionLabel || ''}
                  value={roles.filter(role => formik.values.accountCreateRole.includes(role.optionValue)) || []}
                  onChange={(e, newValue) => {
                    formik.setFieldValue(
                      'accountCreateRole',
                      newValue.map(role => role.optionValue)
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Roles"
                      variant="outlined"
                      size="small"
                    />
                  )}
                  renderTags={(tagValue, getTagProps) =>
                    tagValue.map((option, index) => (
                      <Chip
                        label={option.optionLabel}
                        {...getTagProps({ index })}
                        size="small"
                        key={option.optionValue}
                      />
                    ))
                  }
                />
              </>
            )}
          </Box>
        </CustomDialogContent>

        <CustomDialogFooter>
          <ThemeButton
            onClick={onClose}
            buttonType="transparent"
            type="button"
          >
            Cancel
          </ThemeButton>
          <ThemeButton
            type="submit"
            buttonType="theme"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Save
          </ThemeButton>
        </CustomDialogFooter>
      </form>
    </Dialog>
  );
};

export default SettingsDialog;