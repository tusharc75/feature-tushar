import React, { useEffect, useState, useContext } from 'react';
import { Box, Checkbox, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton } from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const ACTIONS = ['create', 'update', 'delete'];
const NOTIFY_TYPES = ['portal', 'email'];

const getDefaultPref = (resourceName, resourceLabel) => ({
  resource: resourceName,
  resourceLabel,
  create: { portal: false, email: false },
  update: { portal: false, email: false },
  delete: { portal: false, email: false }
});

export default function ResourceWiseNotificationPreference() {
  const toastConfig = useContext(CustomToastContext);
  const [prefs, setPrefs] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [isEdit, setIsEdit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [resourcesList, setResourcesList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      try {
        // resources
        const res = await axiosInstance().get('/notification-setup/user-notification-resource');
        const resources = res.data?.data || [];
        setResourcesList(resources);

        // preferences
        const prefRes = await axiosInstance().get('/notification-setup');
        const resourceArr = prefRes.data?.data[0]?.resources || [];

        const mergedPrefs = resources.map((r) => {
          const found = resourceArr.find((p) => p.resource === r.resource);
          if (found) {
            const { create, update, delete: del } = found;
            return { resource: r.resource, resourceLabel: r.resourceLabel, create, update, delete: del };
          }
          return getDefaultPref(r.resource, r.resourceLabel);
        });

        setPrefs(mergedPrefs);
        setExpanded(Object.fromEntries(resources.map((k) => [k.resource, false])));
      } catch (err) {
        toastConfig.setToastConfig({ open: true, type: 'error', message: 'Failed to load resources or preferences.' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleEdit = () => setIsEdit(true);
  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      await axiosInstance().post('/notification-setup', { preferences: prefs });
      toastConfig.setToastConfig({ open: true, type: 'success', message: 'Preferences updated!' });
      setIsEdit(false);
    } catch (err) {
      toastConfig.setToastConfig({ open: true, type: 'error', message: 'Failed to update preferences.' });
    } finally {
      setIsSaving(false);
    }
  };

  const getSelectAllState = (notifyType) => {
    const all = prefs.length > 0 && prefs.every((pref) => ACTIONS.every((action) => pref[action][notifyType]));
    const none = prefs.length > 0 && prefs.every((pref) => ACTIONS.every((action) => !pref[action][notifyType]));
    return {
      checked: all,
      indeterminate: !all && !none
    };
  };

  const handleSelectAll = (notifyType, checked) => {
    setPrefs((prev) =>
      prev.map((pref) => ({
        ...pref,
        create: { ...pref.create, [notifyType]: checked },
        update: { ...pref.update, [notifyType]: checked },
        delete: { ...pref.delete, [notifyType]: checked }
      }))
    );
  };

  const handleParentCheckbox = (resourceName, notifyType, checked) => {
    setPrefs((prev) =>
      prev.map((p) =>
        p.resource === resourceName
          ? {
            ...p,
            create: { ...p.create, [notifyType]: checked },
            update: { ...p.update, [notifyType]: checked },
            delete: { ...p.delete, [notifyType]: checked }
          }
          : p
      )
    );
  };

  const handleCheckbox = (resourceName, action, notifyType, checked) => {
    setPrefs((prev) =>
      prev.map((p) =>
        p.resource === resourceName
          ? { ...p, [action]: { ...p[action], [notifyType]: checked } }
          : p
      )
    );
  };

  const getParentCheckboxState = (pref, notifyType) => {
    const values = ACTIONS.map((action) => !!pref[action][notifyType]);
    const allChecked = values.every(Boolean);
    const noneChecked = values.every((v) => !v);
    return {
      checked: allChecked,
      indeterminate: !allChecked && !noneChecked
    };
  };

  const handleExpand = (resourceName) => {
    setExpanded((prev) => ({ ...prev, [resourceName]: !prev[resourceName] }));
  };

  return (
    <Box className="mt-10">
      <Typography variant="h5" >Resource-wise Notification Preferences</Typography>
      <Box mb={2} display="flex" justifyContent="flex-end" gap={1}>
        {isEdit ? (
          <ThemeButton onClick={handleUpdate} disabled={isSaving || isLoading} isLoading={isSaving} buttonType='theme' style={{ minWidth: 100 }}>
            {isSaving ? 'Updating...' : 'Update'}
          </ThemeButton>
        ) : (
          <ThemeButton onClick={handleEdit} buttonType='theme' disabled={isLoading}>
            Edit
          </ThemeButton>
        )}
      </Box>
      <TableContainer component={Paper}>
        <Table
          sx={{
            '& .MuiTableCell-root': { py: 0.5, px: 1 },
            '& .MuiTableRow-root': { height: 32 }
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell style={{ paddingLeft: 14 }} className='h-12'><strong>Resource</strong></TableCell>
              {NOTIFY_TYPES.map((notifyType) => {
                const { checked, indeterminate } = getSelectAllState(notifyType);
                return (
                  <TableCell align="center" key={notifyType}>
                    <Checkbox
                      checked={checked}
                      indeterminate={indeterminate}
                      disabled={!isEdit || isLoading}
                      onChange={(e) => handleSelectAll(notifyType, e.target.checked)}
                    />
                    <strong>{notifyType.charAt(0).toUpperCase() + notifyType.slice(1)}</strong>
                  </TableCell>
                );
              })}
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell style={{ paddingLeft: 14 }} colSpan={4}>Loading...</TableCell></TableRow>
            ) : (
              prefs.map((pref) => (
                <React.Fragment key={pref.resource}>
                  <TableRow>
                    <TableCell style={{ paddingLeft: 14 }}>
                      <Box display="flex" alignItems="center">
                        <span>{pref.resourceLabel}</span>
                        <IconButton size="small" onClick={() => handleExpand(pref.resource)}>
                          {expanded[pref.resource] ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                        </IconButton>
                      </Box>
                    </TableCell>
                    {NOTIFY_TYPES.map((notifyType) => {
                      const { checked, indeterminate } = getParentCheckboxState(pref, notifyType);
                      return (
                        <TableCell align="center" key={notifyType}>
                          <Checkbox
                            checked={checked}
                            indeterminate={indeterminate}
                            disabled={!isEdit || isLoading}
                            onChange={(e) => handleParentCheckbox(pref.resource, notifyType, e.target.checked)}
                          />
                        </TableCell>
                      );
                    })}
                    <TableCell />
                  </TableRow>
                  {expanded[pref.resource] &&
                    ACTIONS.map((action) => (
                      <TableRow key={pref.resource + '-' + action}>
                        <TableCell style={{ paddingLeft: 50 }}>{action.charAt(0).toUpperCase() + action.slice(1)}</TableCell>
                        {NOTIFY_TYPES.map((notifyType) => (
                          <TableCell align="center" key={notifyType}>
                            <Checkbox
                              checked={!!pref[action][notifyType]}
                              disabled={!isEdit || isLoading}
                              onChange={(e) => handleCheckbox(pref.resource, action, notifyType, e.target.checked)}
                            />
                          </TableCell>
                        ))}
                        <TableCell />
                      </TableRow>
                    ))}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
