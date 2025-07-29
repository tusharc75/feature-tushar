import React, { useEffect, useState, useContext } from 'react';
import { Box, Checkbox, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton } from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { cn, UnCamelCase } from 'src/constants/helpers';

const NOTIFY_TYPES = ['portal', 'email'];

export default function ResourceWiseNotificationPreference() {
  const toastConfig = useContext(CustomToastContext);

  const [notificationPreferenceData, setNotificationPreferenceData] = useState([]);
  const [expanded, setExpanded] = useState({});

  const [isEdit, setIsEdit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance().get('/notification-setup');
      const resources = res.data?.data || [];
      setNotificationPreferenceData(resources);
      setExpanded(Object.fromEntries(resources.map((k) => [k.resource, false])));
    } catch (err) {
      toastConfig.setToastConfig({ open: true, type: 'error', message: 'Failed to load resources or preferences.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => setIsEdit(true);

  const handleUpdate = async () => {
    setIsSaving(true);
    const data = notificationPreferenceData.map(({ resourceLabel, ...rest }) => rest);
    axiosInstance()
      .post('/notification-setup', data)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
        setIsSaving(false);
        setIsEdit(false);
        fetchAll();
      })
      .catch((error) => {
        setIsSaving(false);
        toastConfig.setToastConfig(error);
      });
  };

  const getSelectAllState = (notifyType) => {
    const all =
      notificationPreferenceData.length > 0 &&
      notificationPreferenceData.every((element) => Object.keys(element?.actions).every((key) => element?.actions[key][notifyType]));
    const none =
      notificationPreferenceData.length > 0 &&
      notificationPreferenceData.every((element) => Object.keys(element?.actions).every((key) => !element?.actions[key][notifyType]));
    return {
      checked: all,
      indeterminate: !all && !none
    };
  };

  const handleSelectAll = (notifyType, checked) => {
    const temp = [...notificationPreferenceData];
    temp?.forEach((element) => {
      Object.keys(element?.actions)?.forEach((key) => {
        element.actions[key][notifyType] = checked;
      });
    });
    setNotificationPreferenceData(temp);
  };

  const handleParentCheckbox = (resource, notifyType, checked) => {
    const temp = [...notificationPreferenceData];
    temp?.forEach((element) => {
      if (element.resource === resource) {
        Object.keys(element?.actions)?.forEach((key) => {
          element.actions[key][notifyType] = checked;
        });
      }
    });
    setNotificationPreferenceData(temp);
  };

  const handleCheckbox = (resource, action, notifyType, checked) => {
    const temp = [...notificationPreferenceData];
    temp?.forEach((element) => {
      if (element.resource === resource) {
        Object.keys(element?.actions)?.forEach((key) => {
          if (key === action) {
            element.actions[key][notifyType] = checked;
          }
        });
      }
    });
    setNotificationPreferenceData(temp);
  };

  const getParentCheckboxState = (element, notifyType) => {
    const values = Object.keys(element?.actions)?.map((key) => !!element?.actions[key][notifyType]);
    const allChecked = values.every(Boolean);
    const noneChecked = values.every((v) => !v);
    return {
      checked: allChecked,
      indeterminate: !allChecked && !noneChecked
    };
  };

  const handleExpand = (resource) => {
    const container = document.querySelector('.notification-table-container');
    const scrollTop = container?.scrollTop || 0;
    setExpanded((prev) => ({ ...prev, [resource]: !prev[resource] }));
    setTimeout(() => {
      if (container) container.scrollTop = scrollTop;
    }, 0);
  };

  return (
    <Box className="mt-2">
      <Box mb={1} display="flex" justifyContent="flex-end" gap={1}>
        {isEdit ? (
          <ThemeButton onClick={handleUpdate} disabled={isSaving || isLoading} isLoading={isSaving} buttonType="theme">
            {isSaving ? 'Updating...' : 'Update'}
          </ThemeButton>
        ) : (
          <ThemeButton onClick={handleEdit} buttonType="theme" disabled={isLoading}>
            Edit
          </ThemeButton>
        )}
      </Box>
      <TableContainer
        className={cn('notification-table-container min-h-[300px] rounded-md border')}
        style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}
      >
        <Table
          sx={{
            '& .MuiTableCell-root': { py: 0.5, px: 1 },
            '& .MuiTableRow-root': { height: 32 }
          }}
          stickyHeader
        >
          <TableHead>
            <TableRow>
              <TableCell style={{ paddingLeft: 14 }} className="h-12">
                <strong>Resource</strong>
              </TableCell>
              {NOTIFY_TYPES.map((notifyType) => {
                const { checked, indeterminate } = getSelectAllState(notifyType);
                return (
                  <TableCell key={notifyType}>
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
              <TableRow>
                <TableCell style={{ paddingLeft: 14 }} colSpan={4}>
                  Loading...
                </TableCell>
              </TableRow>
            ) : (
              notificationPreferenceData?.map((element) => (
                <React.Fragment key={element.resource}>
                  <TableRow>
                    <TableCell style={{ paddingLeft: 14 }}>
                      <Box display="flex" alignItems="center">
                        <span>{element.resourceLabel}</span>
                        <IconButton size="small" onClick={() => handleExpand(element.resource)}>
                          {expanded[element.resource] ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                        </IconButton>
                      </Box>
                    </TableCell>
                    {NOTIFY_TYPES.map((notifyType) => {
                      const { checked, indeterminate } = getParentCheckboxState(element, notifyType);
                      return (
                        <TableCell key={notifyType}>
                          <Checkbox
                            checked={checked}
                            indeterminate={indeterminate}
                            disabled={!isEdit || isLoading}
                            onChange={(e) => handleParentCheckbox(element.resource, notifyType, e.target.checked)}
                          />
                        </TableCell>
                      );
                    })}
                    <TableCell />
                  </TableRow>
                  {expanded[element.resource] &&
                    Object.keys(element?.actions)?.map((key) => (
                      <TableRow key={element.resource + '-' + key}>
                        <TableCell style={{ paddingLeft: 50 }}>{UnCamelCase(key)}</TableCell>
                        {NOTIFY_TYPES.map((notifyType) => (
                          <TableCell key={notifyType}>
                            <Checkbox
                              checked={!!element?.actions[key][notifyType]}
                              disabled={!isEdit || isLoading}
                              onChange={(e) => handleCheckbox(element.resource, key, notifyType, e.target.checked)}
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
