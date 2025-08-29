import { useState, useContext, useEffect } from 'react';
import { Dialog, Box, TextField, Chip } from '@mui/material';
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

const SettingsDialog = ({ 
  open, 
  onClose, 
  step, 
  onboardingTemplateId, 
  tabId, 
  fetchData 
}: SettingsDialogProps) => {
  const toastConfig = useContext(CustomToastContext);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  useEffect(() => {
    if (open) {
      setSelectedUsers(step?.properties?.users || []);
      setSelectedRoles(step?.properties?.roles || []);
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

  const handleSettingsSave = async (Properties: { users: string[]; roles: string[] }) => {
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
        properties: Properties
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

  const handleSave = () => {
    const Properties = {
      users: selectedUsers,
      roles: selectedRoles
    };
    handleSettingsSave(Properties);
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
      <CustomDialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
          <Autocomplete
            multiple
            options={users}
            loading={loading}
            getOptionLabel={(option) => option.optionLabel || ''}
            value={users.filter(user => selectedUsers.includes(user.optionValue)) || []}
            onChange={(e, newValue) => {
              setSelectedUsers(newValue.map(user => user.optionValue));
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
            value={roles.filter(role => selectedRoles.includes(role.optionValue)) || []}
            onChange={(e, newValue) => {
              setSelectedRoles(newValue.map(role => role.optionValue));
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
        </Box>
      </CustomDialogContent>
      <CustomDialogFooter>
        <ThemeButton onClick={onClose} buttonType="transparent">
          Cancel
        </ThemeButton>
        <ThemeButton 
          onClick={handleSave} 
          buttonType="theme"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          Save
        </ThemeButton>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default SettingsDialog;