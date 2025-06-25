import React, { useEffect, useState, useContext } from 'react';
import { Box, Checkbox, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton } from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';

const ACTIONS = ['create', 'update', 'delete'];
const NOTIFY_TYPES = ['portal', 'email'];

const getDefaultPref = (resourceName) => ({
  resource: resourceName,
  create: { portal: false, email: false },
  update: { portal: false, email: false },
  delete: { portal: false, email: false }
});

export default function ResourceWiseNotificationPreference({ resourcesList }) {
  const toastConfig = useContext(CustomToastContext);
  const [prefs, setPrefs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  // Fetch preferences and merge with provided resourcesList
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const resPrefs = await axiosInstance().get('/notification-setup');
        const prefList = resPrefs.data.data || [];
        const mergedPrefs = Object.keys(resourcesList).map((resourceKey) => {
          const found = prefList.find((p) => p.resource === resourceKey);
          return found ? found : getDefaultPref(resourceKey);
        });
        setPrefs(mergedPrefs);
        setExpanded(Object.fromEntries(Object.keys(resourcesList).map((k) => [k, false])));
      } catch (err) {
        toastConfig.setToastConfig({ open: true, type: 'error', message: 'Failed to load preferences.' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [resourcesList]);

  const updateResourcePref = async (resourcePref) => {
    try {
      await axiosInstance().post('/notification-setup', {
        preferences: [resourcePref]
      });
      toastConfig.setToastConfig({ open: true, type: 'success', message: 'Preference updated!' });
    } catch (err) {
      toastConfig.setToastConfig({ open: true, type: 'error', message: 'Failed to update preference.' });
    }
  };

  const handleParentCheckbox = (resourceName, notifyType, checked) => {
    setPrefs((prev) => {
      const newPrefs = prev.map((p) =>
        p.resource === resourceName
          ? {
            ...p,
            create: { ...p.create, [notifyType]: checked },
            update: { ...p.update, [notifyType]: checked },
            delete: { ...p.delete, [notifyType]: checked }
          }
          : p
      );
      const updated = newPrefs.find((p) => p.resource === resourceName);
      updateResourcePref(updated);
      return newPrefs;
    });
  };

  // Handle sub-action checkbox change
  const handleCheckbox = (resourceName, action, notifyType, checked) => {
    setPrefs((prev) => {
      const newPrefs = prev.map((p) =>
        p.resource === resourceName
          ? { ...p, [action]: { ...p[action], [notifyType]: checked } }
          : p
      );
      const updated = newPrefs.find((p) => p.resource === resourceName);
      updateResourcePref(updated);
      return newPrefs;
    });
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
    <Box className="mt-8">
      <Typography variant="h5" mb={2}>Resource-wise Notification Preferences</Typography>
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
              {NOTIFY_TYPES.map((notifyType) => (
                <TableCell align="center" key={notifyType}><strong>{notifyType.charAt(0).toUpperCase() + notifyType.slice(1)}</strong></TableCell>
              ))}
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell style={{ paddingLeft: 14 }} colSpan={4}>Loading...</TableCell></TableRow>
            ) : (
              prefs.map((pref) => (
                <React.Fragment key={pref.resource}>
                  {/* Resource row with parent checkboxes and expand/collapse arrow on right */}
                  <TableRow>
                    <TableCell style={{ paddingLeft: 14 }}>
                      <Box display="flex" alignItems="center">
                        <span>{resourcesList[pref.resource]?.titleSingular || pref.resource}</span>
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
                            onChange={(e) => handleParentCheckbox(pref.resource, notifyType, e.target.checked)}
                          />
                        </TableCell>
                      );
                    })}
                    <TableCell />
                  </TableRow>
                  {/* Sub-action rows, only if expanded */}
                  {
                    expanded[pref.resource] &&
                    ACTIONS.map((action) => (
                      <TableRow key={pref.resource + '-' + action}>
                        <TableCell style={{ paddingLeft: 50 }}>{action.charAt(0).toUpperCase() + action.slice(1)}</TableCell>
                        {NOTIFY_TYPES.map((notifyType) => (
                          <TableCell align="center" key={notifyType}>
                            <Checkbox
                              checked={!!pref[action][notifyType]}
                              onChange={(e) => handleCheckbox(pref.resource, action, notifyType, e.target.checked)}
                            />
                          </TableCell>
                        ))}
                        <TableCell />
                      </TableRow>
                    ))
                  }
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box >
  );
}
