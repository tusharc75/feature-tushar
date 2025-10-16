import { useState, useEffect, Fragment } from 'react';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import Dialog from '@mui/material/Dialog';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from '../../../constants/helpers';
import { TextField, List, ListItem, ListItemButton, ListItemText, Typography, IconButton } from '@mui/material';
import { ThemeButton } from '../../../components/Helpers/Buttons';
import { Search, ExpandMore, ExpandLess } from '@mui/icons-material';
import { useData } from 'src/StateProvider/Provider';
import { camelCase } from 'lodash';

interface FilterFieldSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onFieldSelect: (field: any) => void;
  availableFields: any[];
}

const FilterFieldSelectionDialog = ({ open, onClose, onFieldSelect, availableFields }: FilterFieldSelectionDialogProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [resourcesSet, setResourcesSet] = useState<Set<string>>(new Set());
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set());

  const {
    state: { resources }
  }: any = useData();

  useEffect(() => {
    const resources = new Set<string>();
    availableFields?.forEach((field) => {
      resources.add(field?.resource);
    });
    setResourcesSet(resources);
    setExpandedResources(new Set(resources));
  }, [availableFields]);

  const getFieldsForResource = (resourceName: string) => {
    return availableFields?.filter((field) => {
      const matchesResource = field?.resource === resourceName;
      const matchesSearch =
        !searchTerm ||
        field?.fieldLabel?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
        field?.fieldName?.toLowerCase().includes(searchTerm?.toLowerCase());
      return matchesResource && matchesSearch;
    });
  };

  const toggleResourceExpansion = (resourceName: string) => {
    const newExpanded = new Set(expandedResources);
    if (newExpanded?.has(resourceName)) {
      newExpanded.delete(resourceName);
    } else {
      newExpanded.add(resourceName);
    }
    setExpandedResources(newExpanded);
  };

  const handleFieldSelect = (field: any) => {
    onFieldSelect(field);
    setSearchTerm('');
  };

  const handleClose = () => {
    setSearchTerm('');
    onClose();
  };

  return (
    <Dialog
      maxWidth="sm"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="filter-field-selection-dialog"
      open={open}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          handleClose();
        }
      }}
      fullWidth
    >
      <Fragment>
        <CustomDialogHeader
          title="Select Field"
          onClose={handleClose}
          isMinimized={!fullScreen}
          onMinimizeMaximize={() => {
            setFullScreen((prevState) => !prevState);
          }}
          showManimizeMaximize={true}
          showRequiredLabel={false}
        />
        <CustomDialogContent>
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
            {Array.from(resourcesSet)?.map((resourceName) => {
              const fieldsForResource = getFieldsForResource(resourceName);
              const isExpanded = expandedResources?.has(resourceName);

              return (
                <div key={resourceName} className="mb-2">
                  <div
                    className="flex cursor-pointer items-center rounded p-2"
                    onClick={() => toggleResourceExpansion(resourceName)}
                  >
                    <Typography variant="subtitle2" className="text-primary flex items-center gap-2 font-semibold mr-2">
                      {resources?.[camelCase(resourceName)]?.titlePlural || resourceName}
                    </Typography>
                    <IconButton size="small">{isExpanded ? <ExpandLess /> : <ExpandMore />}</IconButton>
                  </div>

                  {isExpanded && (
                    <List dense className="ml-4">
                      {fieldsForResource.map((field) => (
                        <ListItem key={field.fieldName} disablePadding>
                          <ListItemButton onClick={() => handleFieldSelect(field)} className="rounded hover:bg-gray-100">
                            <ListItemText primary={field?.fieldLabel} />
                          </ListItemButton>
                        </ListItem>
                      ))}
                      {!fieldsForResource?.length && searchTerm && <div className="p-2 text-sm text-gray-500">No matching fields found</div>}
                    </List>
                  )}
                </div>
              );
            })}

            {resourcesSet?.size === 0 && <div className="py-8 text-center text-gray-500">No fields available</div>}
          </div>
        </CustomDialogContent>
        <CustomDialogFooter>
          <ThemeButton buttonType="transparent" onClick={handleClose}>
            Cancel
          </ThemeButton>
        </CustomDialogFooter>
      </Fragment>
    </Dialog>
  );
};

export default FilterFieldSelectionDialog;
