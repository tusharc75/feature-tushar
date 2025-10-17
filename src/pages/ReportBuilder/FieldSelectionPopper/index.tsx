import { useState, useEffect, useMemo } from 'react';
import { TextField, Typography, IconButton, Popper, Paper, ClickAwayListener, List, ListItem, ListItemButton, ListItemText } from '@mui/material';
import { Search, ExpandMore, ExpandLess } from '@mui/icons-material';
import { useData } from '../../../StateProvider/Provider';
import { camelCase } from 'lodash';

interface FieldSelectionPopperProps {
  isEdit: boolean;
  availableFields: any[];
  selectedField?: any;
  onFieldSelect: (field: any) => void;
  textFieldProps?: any;
  popperProps?: {
    width?: number;
    maxHeight?: number;
  };
}

const FieldSelectionPopper = ({
  isEdit,
  availableFields,
  selectedField,
  onFieldSelect,
  textFieldProps = {},
  popperProps = { width: 400, maxHeight: 400 }
}: FieldSelectionPopperProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const { state: { resources } } = useData();
  const open = Boolean(anchorEl);

  const resourcesSet = useMemo(() => {
    const resourceSet = new Set<string>();
    availableFields?.forEach((field) => {
      if (field?.resource) {
        resourceSet.add(field.resource);
      }
    });
    return resourceSet;
  }, [availableFields]);

  useEffect(() => {
    if (resourcesSet.size > 0) {
      setExpandedResources(new Set(resourcesSet));
    }
  }, [resourcesSet]);

  const handleToggle = (e) => {
    if (!isEdit) return;
    setAnchorEl(open ? null : e.currentTarget);
  };

  const handleClickAway = (event) => {
    if (anchorEl && !anchorEl.contains(event.target)) {
      setAnchorEl(null);
      setSearchTerm('');
    }
  };

  const getFieldsForResource = (resourceName: string) => {
    return availableFields?.filter((field) => {
      const matchesResource = field?.resource === resourceName;
      const matchesSearch = !searchTerm ||
        field?.fieldLabel?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
        field?.fieldName?.toLowerCase().includes(searchTerm?.toLowerCase());
      return matchesResource && matchesSearch;
    });
  };

  const toggleResourceExpansion = (resourceName: string) => {
    setExpandedResources(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(resourceName)) {
        newExpanded.delete(resourceName);
      } else {
        newExpanded.add(resourceName);
      }
      return newExpanded;
    });
  };

  const handleFieldSelect = (field: any) => {
    onFieldSelect(field);
    setAnchorEl(null);
    setSearchTerm('');
  };

  return (
    <>
      <TextField
        {...textFieldProps}
        value={selectedField?.fieldLabel || ''}
        onClick={handleToggle}
        slotProps={{
          input: {
            readOnly: true,
            style: {
              cursor: isEdit ? 'pointer' : 'default',
              color: isEdit ? 'var(--primary-text)' : 'var(--dark-secondary-text, #6c757d)'
            },
          }
        }}
      />

      <Popper
        open={open}
        anchorEl={anchorEl}
        placement="bottom-start"
        modifiers={[{ name: 'offset', options: { offset: [0, 8] } }]}
        sx={{ zIndex: (theme) => theme.zIndex.modal }}
      >
        <ClickAwayListener onClickAway={handleClickAway}>
          <Paper
            elevation={4}
            sx={{
              width: popperProps.width,
              maxHeight: popperProps.maxHeight,
              overflow: 'auto',
              p: 1,
              '&::-webkit-scrollbar': {
                display: 'none'
              }
            }}
          >
            <div className="mb-4">
              <TextField
                fullWidth
                size="small"
                placeholder="Find..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search className="mr-2 text-gray-500" />
                }}
              />
            </div>

            <div className="max-h-96 overflow-auto">
              {Array.from(resourcesSet).map((resourceName) => {
                const fieldsForResource = getFieldsForResource(resourceName);
                const isExpanded = expandedResources.has(resourceName);

                return (
                  <div key={resourceName}>
                    <div
                      className="flex cursor-pointer items-center rounded p-2"
                      onClick={() => toggleResourceExpansion(resourceName)}
                    >
                      <Typography variant="subtitle2" className="text-primary flex items-center gap-2 font-semibold mr-2">
                        {resources?.[camelCase(resourceName)]?.titlePlural || resourceName}
                      </Typography>
                      <IconButton size="small">
                        {isExpanded ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </div>

                    {isExpanded && (
                      <List dense>
                        {fieldsForResource.map((field) => (
                          <ListItem key={field.fieldName} disablePadding>
                            <ListItemButton
                              onClick={() => handleFieldSelect(field)}
                              className="rounded hover:bg-gray-100"
                            >
                              <ListItemText primary={field?.fieldLabel} />
                            </ListItemButton>
                          </ListItem>
                        ))}
                        {!fieldsForResource?.length && searchTerm && (
                          <div className="p-2 text-sm text-gray-500">No matching fields found</div>
                        )}
                      </List>
                    )}
                  </div>
                );
              })}

              {resourcesSet.size === 0 && (
                <div className="py-8 text-center text-gray-500">No fields available</div>
              )}
            </div>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </>
  );
};

export default FieldSelectionPopper;
