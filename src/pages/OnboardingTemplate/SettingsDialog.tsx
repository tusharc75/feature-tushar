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
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const formik = useFormik<FormValues>({
    initialValues: {
      users: [],
      roles: [],
      filledByCandidate: false
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
        filledByCandidate: step?.properties?.filledByCandidate || false
      });
      fetchUsersAndRoles();
    }
  }, [open, step]);

  const fetchUsersAndRoles = async () => {
    setLoading(true);
    try {
      const [usersResponse, rolesResponse] = await Promise.all([
        axiosInstance().get('/sa-formbuilder/lookup?lookupResource=User'),
        axiosInstance().get('/sa-formbuilder/lookup?lookupResource=Role')
      ]);
      setUsers(usersResponse.data.data?.User || []);
      setRoles(rolesResponse.data.data?.Role || []);
    } catch (error) {
      toastConfig.setToastConfig({
        open: true,
        type: 'error',
        message: 'Failed to fetch users and roles'
      });
    }
    setLoading(false);
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
    try {
      const api = `${routes.onboardingTemplate.path}/tabs/steps/${onboardingTemplateId}/${tabId}/settings`;
      await axiosInstance().put(api, {
        stepId: step?._id,
        properties
      });
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: 'Properties saved successfully'
      });
      if (fetchData) {
        fetchData();
      }
      onClose();
    } catch (error) {
      toastConfig.setToastConfig(error);
    } finally {
      setIsSubmitting(false);
    }
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <Autocomplete
              multiple
              options={users}
              loading={loading}
              getOptionLabel={(option) => option.optionLabel || ''}
              value={users.filter(user => formik.values.users.includes(user.optionValue)) || []}
              onChange={(e, newValue) => {
                formik.setFieldValue(
                  'users', 
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
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={formik.values.filledByCandidate}
                  onChange={(e) => 
                    formik.setFieldValue('filledByCandidate', e.target.checked)
                  }
                  name="filledByCandidate"
                />
              }
              label="Filled By Candidate"
            />
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