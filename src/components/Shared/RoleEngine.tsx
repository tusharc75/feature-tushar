import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@material-ui/icons';
import React, { useEffect, useState } from 'react';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { TableData } from 'src/components/Shared/types';
import { ROLE_TIER } from 'src/constants/helpers';

function sortByFieldLabel<T>(data: T[], accessorfn: (data: T) => string, sort: 'asc' | 'des'): T[] {
  if (sort === 'asc') {
    return [...data].sort((a, b) => {
      if (accessorfn(a) < accessorfn(b)) {
        return -1;
      }
      if (accessorfn(a) > accessorfn(b)) {
        return 1;
      }
      return 0;
    });
  }
  return [...data].sort((a, b) => {
    if (accessorfn(b) < accessorfn(a)) {
      return -1;
    }
    if (accessorfn(b) > accessorfn(a)) {
      return 1;
    }
    return 0;
  });
}

interface RoleProps {
  field: any[];
  resource: any[];
  setField?: any;
  setResource?: any;
  isDisable?: boolean;
  style?: React.CSSProperties;
  tier?: string;
  child?: boolean;
  updateChildResource?: (resource: string, access: string, checked: boolean) => void;
}

type SortingType = 'asc' | 'des' | '';

type TableSearchFilterState = {
  search: string;
  sort: SortingType;
};

const RoleEngine = ({
  field,
  resource,
  setField,
  setResource,
  isDisable,
  style,
  tier = ROLE_TIER.tier1,
  child = false,
  updateChildResource = null
}: RoleProps) => {
  const [isReadChecked, setIsReadChecked] = useState(false);
  const [isCreateChecked, setIsCreateChecked] = useState(false);
  const [isUpdateChecked, setIsUpdateChecked] = useState(false);
  const [isDeleteChecked, setIsDeleteChecked] = useState(false);
  const [isHiddenChecked, setIsHiddenChecked] = useState(false);
  const [tableData, setTableData] = useState<TableData[]>([]);
  const [filteredAndSortedData, setFilteredAndSortedData] = useState<TableData[]>([]);
  // const [deepSearch, setDeepSearch] = useState(false);
  const [tableSearchFilterState, setTableSearchFilterState] = useState<TableSearchFilterState>({
    search: '',
    sort: 'asc'
  });

  useEffect(() => {
    const generateTableData = () => {
      const tableData = [];
      for (let i = 0; i < resource.length; i++) {
        const _resource = resource[i];
        const resourceFields = field.filter((_field) => _field.fieldData.resource === _resource.name).sort((a, b) => a.order - b.order);
        const tableRow = {
          resource: _resource,
          fields: resourceFields
        };
        tableData.push(tableRow);
      }
      setTableData(tableData);
      handleSearchFilter(tableSearchFilterState);
    };
    generateTableData();
  }, [field, resource]);

  const [renderCount, setRenderCount] = useState(0);

  const [selectedResource, setSelectedResource] = useState({
    id: '',
    type: ''
  });

  useEffect(() => {
    let isAnyReadFoundUnchecked = false;
    let isAnyCreateFoundUnchecked = false;
    let isAnyUpdateFoundUnchecked = false;
    let isAnyDeleteFoundUnchecked = false;
    let isAnyHiddenFoundUnchecked = false;

    resource.forEach((_resource) => {
      if (_resource.isRead === false && !_resource.isReadDisabled && isAnyReadFoundUnchecked === false) {
        field
          .filter((d) => d.fieldData.resource === _resource.name && !d.isReadDisabled)
          .forEach((_field) => {
            if (_field.isRead === false && isAnyReadFoundUnchecked === false) {
              isAnyReadFoundUnchecked = true;
            }
          });
        isAnyReadFoundUnchecked = true;
      } else if (!_resource.isReadDisabled && isAnyReadFoundUnchecked === false) {
        isAnyReadFoundUnchecked = field
          .filter((d) => d.fieldData.resource === _resource.name && !d.isReadDisabled)
          .some((_field) => {
            return _field.isRead === false;
          });
      }
      if (_resource.isCreate === false && !_resource.isCreateDisabled && isAnyCreateFoundUnchecked === false) {
        field
          .filter((d) => d.fieldData.resource === _resource.name && !d.isCreateDisabled)
          .forEach((_field) => {
            if (_field.isCreate === false && isAnyCreateFoundUnchecked === false) {
              isAnyCreateFoundUnchecked = true;
            }
          });
        isAnyCreateFoundUnchecked = true;
      } else if (!_resource.isCreateDisabled && isAnyCreateFoundUnchecked === false) {
        isAnyCreateFoundUnchecked = field
          .filter((d) => d.fieldData.resource === _resource.name && !d.isCreateDisabled)
          .some((_field) => {
            return _field.isCreate === false;
          });
      }

      if (_resource.isUpdate === false && !_resource.isUpdateDisabled && isAnyUpdateFoundUnchecked === false) {
        field
          .filter((d) => d.fieldData.resource === _resource.name && !d.isUpdateDisabled)
          .forEach((_field) => {
            if (_field.isUpdate === false && isAnyUpdateFoundUnchecked === false) {
              isAnyUpdateFoundUnchecked = true;
            }
          });
        isAnyUpdateFoundUnchecked = true;
      } else if (!_resource.isUpdateDisabled && isAnyUpdateFoundUnchecked === false) {
        isAnyUpdateFoundUnchecked = field
          .filter((d) => d.fieldData.resource === _resource.name && !d.isUpdateDisabled)
          .some((_field) => {
            return _field.isUpdate === false;
          });
      }

      if (_resource.isDelete === false && !_resource.isDeleteDisabled && isAnyDeleteFoundUnchecked === false) {
        isAnyDeleteFoundUnchecked = true;
      }

      if (!_resource.isHidden && isAnyHiddenFoundUnchecked === false) {
        isAnyHiddenFoundUnchecked = true;
      }
    });

    if (tier === ROLE_TIER.tier3) {
      isAnyCreateFoundUnchecked = true;
      isAnyUpdateFoundUnchecked = true;
      isAnyDeleteFoundUnchecked = true;
      isAnyHiddenFoundUnchecked = true;
    }

    setIsReadChecked(!isAnyReadFoundUnchecked);
    setIsCreateChecked(!isAnyCreateFoundUnchecked);
    setIsUpdateChecked(!isAnyUpdateFoundUnchecked);
    setIsDeleteChecked(!isAnyDeleteFoundUnchecked);
    setIsHiddenChecked(!isAnyHiddenFoundUnchecked);

    if (tier === ROLE_TIER.tier2 && renderCount === 0) {
      const temp = {
        id: '',
        type: ''
      };
      temp.id = resource?.filter?.((_r) => _r?.isRead || _r?.isCreate || _r?.isUpdate || _r?.isDelete || _r?.isHidden)[0]?.resourceId || '';
      temp.type = 'resource';

      if (!temp.id) {
        const resourceName = field?.filter?.((_f) => _f?.isRead || _f?.isCreate || _f?.isUpdate)[0]?.fieldData?.resource;
        temp.id = resource?.find((_r) => _r?.name === resourceName)?.resourceId || '';
        temp.type = 'field';
      }
      setSelectedResource(temp);
    }
  }, [field, resource]);

  const updateRoles = (propertyToUpdate, isChecked) => {
    const newResource = [...resource];
    const newField = [...field];
    newResource.forEach((_resource) => {
      if (isChecked === true) {
        _resource[propertyToUpdate] = !_resource[`${propertyToUpdate}Disabled`] && isChecked;
      } else {
        _resource[propertyToUpdate] = isChecked;
      }
      if (['isRead', 'isCreate', 'isUpdate']?.includes(propertyToUpdate)) {
        newField
          .filter((d) => d.fieldData.resource === _resource.name)
          .forEach((_field) => {
            if (isChecked === true) {
              _field[propertyToUpdate] = !_resource[`${propertyToUpdate}Disabled`] && !_field[`${propertyToUpdate}Disabled`] && isChecked;
            } else {
              _field[propertyToUpdate] = isChecked;
            }
          });
      }
    });
    setResource(newResource);
    setField(newField);
  };

  const handleChange = (type, id, access) => (event) => {
    //Checking for the type if it is resource or field
    setSelectedResource({
      id: id,
      type: type
    });
    if (type === 'resource') {
      const newResource = [...resource];
      const newField = [...field];
      newResource.forEach((_resource) => {
        if (_resource.resourceId === id) {
          let isCreateUpdateSelected;
          const isSubResourcePresent = newField.filter((_field) => _field.fieldData.resource === _resource.name);
          if (isSubResourcePresent.length === 0) {
            isCreateUpdateSelected = _resource['isCreate'] || _resource['isUpdate'];
          } else {
            isCreateUpdateSelected = isSubResourcePresent.some((_field) => _field['isCreate'] || _field['isUpdate']);
          }

          if (access === 'isRead' && isCreateUpdateSelected) {
          } else {
            _resource[access] = event.target.checked;
            if (!_resource?.parentResource) {
              if (updateChildResource) {
                updateChildResource(_resource.name, access, event.target.checked);
              }
            }
          }
          if (event.target.checked) {
            _resource['isRead'] = event.target.checked;
          }

          if (access !== 'isDelete') {
            newField.forEach((_field) => {
              if (_field.fieldData.resource === _resource.name) {
                if (access === 'isRead' && !event.target.value && isCreateUpdateSelected) {
                } else {
                  _field[access] = event.target.checked;
                }

                if (event.target.checked) {
                  _field['isRead'] = event.target.checked;
                }
              }
            });
          }

          if (access === 'isDelete') {
            newField.forEach((_field) => {
              if (_field.fieldData.resource === _resource.name && _field.fieldData.required) {
                if (event.target.checked) {
                  _field['isRead'] = event.target.checked;
                }
              }
            });
          }
        }
      });
      setResource(newResource);
      setField(newField);
    } else {
      const newResource = [...resource];
      const newField = [...field];

      let selectedResource;
      newField.forEach((_field) => {
        if (_field.fieldData._id === id) {
          if (!event.target.checked && access === 'isRead' && (_field['isUpdate'] || _field['isCreate'])) {
            // _field[access] = event.target.checked;
          } else if (!event.target.checked && access === 'isCreate' && _field.fieldData.required && !child) {
          } else {
            _field[access] = event.target.checked;
          }

          if (['isUpdate', 'isCreate'].includes(access) && event.target.checked) {
            _field['isRead'] = true;
          }

          selectedResource = _field.fieldData.resource;

          if (event.target.checked) {
            newResource.forEach((_resource) => {
              if (_field.fieldData.resource === _resource.name) {
                _resource[access] = true;
                if (['isUpdate', 'isCreate'].includes(access) && event.target.checked) {
                  _resource['isRead'] = true;
                }
              }
            });
          } else {
            const isAllFalse = newField
              .filter((__field) => __field.fieldData.resource === _field.fieldData.resource)
              .every((__field) => !__field[access]);

            if (isAllFalse) {
              newResource.forEach((_resource) => {
                if (_field.fieldData.resource === _resource.name) {
                  _resource[access] = event.target.checked;
                }
              });
            }
          }
        }
      });

      if (access === 'isCreate' && event.target.checked) {
        newField.forEach((_field) => {
          if (_field.fieldData.resource === selectedResource && _field.fieldData.required) {
            _field['isCreate'] = true;
            _field['isRead'] = true;
          }
        });
      }

      setResource(newResource);
      setField(newField);
    }
  };

  const validateRoleAndField = (resource: any[], field: any[]) => {
    if (setField) {
      setField(
        field?.map((f) => ({
          ...f,
          isCreate: renderCount === 0 ? f?.isCreate === true : false,
          isRead: renderCount === 0 ? f?.isRead === true : false,
          isUpdate: renderCount === 0 ? f?.isUpdate === true : false,
          isReadDisabled: false,
          isCreateDisabled: tier === ROLE_TIER?.tier3 ? true : false,
          isUpdateDisabled: tier === ROLE_TIER?.tier3 ? true : false,
          isDeleteDisabled: tier === ROLE_TIER?.tier3 ? true : false,
          isHiddenDisabled: tier === ROLE_TIER?.tier3 ? true : false
        }))
      );
    }
    if (setResource) {
      setResource(
        resource?.map((r) => ({
          ...r,
          isCreate: renderCount === 0 ? r?.isCreate === true : false,
          isDelete: renderCount === 0 ? r?.isDelete === true : false,
          isRead: renderCount === 0 ? r?.isRead === true : false,
          isUpdate: renderCount === 0 ? r?.isUpdate === true : false,
          isHidden: renderCount === 0 ? r?.isHidden === true : false,
          isReadDisabled: false,
          isCreateDisabled: tier === ROLE_TIER?.tier3 ? true : false,
          isUpdateDisabled: tier === ROLE_TIER?.tier3 ? true : false,
          isDeleteDisabled: tier === ROLE_TIER?.tier3 ? true : false,
          isHiddenDisabled: tier === ROLE_TIER?.tier3 ? true : false
        }))
      );
    }
    setRenderCount(renderCount + 1);
  };

  const validateTier2 = (resource: any[], field: any[], selectedResource: any) => {
    if (tier === ROLE_TIER?.tier2) {
      let checkedResource = [];
      let unCheckedResource = [];

      if (selectedResource.type === 'resource') {
        checkedResource = resource?.filter((_r) => _r?.resourceId === selectedResource.id);
        unCheckedResource = resource?.filter((_r) => _r?.resourceId !== selectedResource.id);
      } else {
        const resourceName = field?.filter((f) => f?.fieldData?._id === selectedResource?.id)[0]?.fieldData?.resource;
        checkedResource = resource?.filter((_r) => _r?.name === resourceName);
        unCheckedResource = resource?.filter((_r) => _r?.name !== resourceName);
      }

      let isChecked = false;
      if (
        checkedResource[0]?.isRead ||
        checkedResource[0]?.isCreate ||
        checkedResource[0]?.isUpdate ||
        checkedResource[0]?.isDelete ||
        checkedResource[0]?.isHidden
      ) {
        isChecked = true;
      }

      const index = resource?.findIndex((_r) => _r?.resourceId === checkedResource[0]?.resourceId);

      let newResource = [...resource];

      if (checkedResource[0]) {
        newResource = unCheckedResource?.map((_r) => ({
          ..._r,
          isCreateDisabled: isChecked ? true : false,
          isReadDisabled: isChecked ? true : false,
          isUpdateDisabled: isChecked ? true : false,
          isDeleteDisabled: isChecked ? true : false,
          isHiddenDisabled: isChecked ? true : false
        }));

        newResource.splice(index, 0, checkedResource[0]);
      }

      setResource(newResource);
      setField(field);

      setRenderCount(renderCount + 1);
    }
  };

  useEffect(() => {
    validateRoleAndField(resource, field);
  }, [tier]);

  useEffect(() => {
    validateTier2(resource, field, selectedResource);
  }, [selectedResource]);

  const handleSearchFilter = (
    tableSearchFilterState: TableSearchFilterState
    //  _deepSearch = deepSearch
  ) => {
    let data = [...tableData];
    const { search, sort } = tableSearchFilterState;
    if (search) {
      let tempData: TableData[] = [];
      for (const d of data) {
        const isTopLevelMatch = d.resource.resourceLabel.toLowerCase().includes(search.toLowerCase());
        // Run deep search inside field data
        // if (_deepSearch) {
        //   const deepLevelMatch = d.fields
        //     .map((f) => f.fieldData.fieldLabel)
        //     .join(',')
        //     .toLowerCase()
        //     .includes(search.toLowerCase());
        //   if (!deepLevelMatch && isTopLevelMatch) {
        //     tempData.push(d); // Push the top level data
        //   } else if (deepLevelMatch) {
        //     let newData = { ...d, fields: d.fields.filter((f) => f.fieldData.fieldLabel.toLowerCase().includes(search.toLowerCase())) };
        //     tempData.push(newData);
        //   }
        // } else if (isTopLevelMatch) {
        //   // Run top level searh
        //   tempData.push(d);
        // }
        if (isTopLevelMatch) {
          //! Run top level searh
          tempData.push(d);
        }
      }
      data = tempData;
    }

    if (sort) {
      const sortChildFunction = (d: TableData) => ({ ...d, fields: sortByFieldLabel(d.fields, (c) => c.fieldData.fieldLabel, sort) });
      const sortData = sortByFieldLabel(data, (d) => d.resource.resourceLabel, sort).map((d) => sortChildFunction(d));
      data = sortData;
    }
    setFilteredAndSortedData(data);
  };

  const handleApplySortSearchFilter = (value: SortingType | string, type: 'search' | 'sort') => {
    setTableSearchFilterState((prev) => {
      const newData = { ...prev, [type]: value };
      handleSearchFilter(newData);
      return newData;
    });
  };

  const handleSort = () => {
    if (tableSearchFilterState.sort === '') {
      handleApplySortSearchFilter('asc', 'sort');
    }
    if (tableSearchFilterState.sort === 'asc') {
      handleApplySortSearchFilter('des', 'sort');
    }
    if (tableSearchFilterState.sort === 'des') {
      handleApplySortSearchFilter('', 'sort');
    }
  };

  return (
    <div>
      <div className="flex justify-end gap-3 rounded-t border-b-0 border-l border-r border-t border-solid border-[var(--common-border-color)] bg-[var(--form-head-bg)] p-1 text-right">
        <TextField
          className="min-w-[300px]"
          variant="outlined"
          placeholder={'Search...'}
          size="small"
          type="search"
          value={tableSearchFilterState.search}
          onChange={(e) => handleApplySortSearchFilter(e.target.value, 'search')}
        />
      </div>
      <TableContainer
        style={{ height: 400, minHeight: 400, ...style }}
        className="rounded-[4px] border border-[var(--common-border-color)] shadow-[0px_20.3165px_40.6331px_rgba(0,0,0,0.03)]"
      >
        <Table stickyHeader aria-label="roles" className="roles-table">
          <TableHead>
            <TableRow>
              <TableCell className="bg-[var(--form-head-bg)_!important] text-[#2a3042_!important] dark:text-[white_!important]">
                <HtmlTooltip
                  className="block max-w-fit"
                  title={
                    tableSearchFilterState.sort
                      ? `Sorted by ${tableSearchFilterState.sort === 'asc' ? 'Ascending' : 'Descending'} order`
                      : 'Click to sort'
                  }
                >
                  <span className="-ml-1">
                    <Button
                      size="small"
                      onClick={handleSort}
                      endIcon={
                        <span>
                          <RenderSortIcon sortBy={tableSearchFilterState.sort} />
                        </span>
                      }
                    >
                      <span className="text-[14px] font-medium">Names</span>
                    </Button>
                  </span>
                </HtmlTooltip>
              </TableCell>
              <TableCell align="center" className="bg-[var(--form-head-bg)_!important]">
                <FormControlLabel
                  control={
                    <Checkbox
                      disabled={isDisable || tier === ROLE_TIER.tier2}
                      checked={isReadChecked}
                      onChange={(e) => {
                        setIsReadChecked(e.target.checked);
                        updateRoles('isRead', e.target.checked);
                      }}
                    />
                  }
                  label="Read"
                />
              </TableCell>
              <TableCell align="center" className="bg-[var(--form-head-bg)_!important]">
                <FormControlLabel
                  control={
                    <Checkbox
                      disabled={isDisable || tier === ROLE_TIER.tier2 || tier === ROLE_TIER.tier3}
                      checked={isCreateChecked}
                      onChange={(e) => {
                        setIsCreateChecked(e.target.checked);
                        updateRoles('isCreate', e.target.checked);

                        if (e.target.checked && !isReadChecked) {
                          setIsReadChecked(e.target.checked);
                          updateRoles('isRead', e.target.checked);
                        }
                      }}
                    />
                  }
                  label="Create"
                />
              </TableCell>
              <TableCell align="center" className="bg-[var(--form-head-bg)_!important]">
                <FormControlLabel
                  control={
                    <Checkbox
                      disabled={isDisable || tier === ROLE_TIER.tier2 || tier === ROLE_TIER.tier3}
                      checked={isUpdateChecked}
                      onChange={(e) => {
                        setIsUpdateChecked(e.target.checked);
                        updateRoles('isUpdate', e.target.checked);

                        if (e.target.checked && !isReadChecked) {
                          setIsReadChecked(e.target.checked);
                          updateRoles('isRead', e.target.checked);
                        }
                      }}
                    />
                  }
                  label="Update"
                />
              </TableCell>
              <TableCell align="center" className="bg-[var(--form-head-bg)_!important]">
                <FormControlLabel
                  control={
                    <Checkbox
                      disabled={isDisable || tier === ROLE_TIER.tier2 || tier === ROLE_TIER.tier3}
                      checked={isDeleteChecked}
                      onChange={(e) => {
                        setIsDeleteChecked(e.target.checked);
                        updateRoles('isDelete', e.target.checked);

                        if (e.target.checked && !isReadChecked) {
                          setIsReadChecked(e.target.checked);
                          updateRoles('isRead', e.target.checked);
                        }
                      }}
                    />
                  }
                  label="Delete"
                />
              </TableCell>
              <TableCell align="center" className="bg-[var(--form-head-bg)_!important]">
                <FormControlLabel
                  control={
                    <Checkbox
                      disabled={isDisable || tier === ROLE_TIER.tier2 || tier === ROLE_TIER.tier3}
                      checked={isHiddenChecked}
                      onChange={(e) => {
                        setIsHiddenChecked(e.target.checked);
                        updateRoles('isHidden', e.target.checked);
                      }}
                    />
                  }
                  label="Hidden"
                />
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAndSortedData.map(({ resource: _resource, fields }, outerIndex) => {
              return (
                <React.Fragment key={outerIndex}>
                  <Row _resource={_resource} isDisable={isDisable} handleChange={handleChange} fieldCheckbox={fields} />
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

const RenderSortIcon = ({ sortBy }: { sortBy: SortingType }) => {
  if (sortBy === 'asc') {
    return <KeyboardArrowUp />;
  }
  if (sortBy === 'des') {
    return <KeyboardArrowDown />;
  }
  return <></>;
};

const Row = ({ _resource, isDisable, handleChange, fieldCheckbox }) => {
  const [open, setOpen] = useState(false);

  const totalReadCheckboxCheckedLen = fieldCheckbox.filter((f) => f.isRead).length;
  const isReadAllChecked = fieldCheckbox.length > 0 && totalReadCheckboxCheckedLen > 0 && totalReadCheckboxCheckedLen !== fieldCheckbox.length;

  const totalIsCreateCheckboxCheckedLen = fieldCheckbox.filter((f) => f.isCreate).length;
  const isCreateAllChecked =
    fieldCheckbox.length > 0 && totalIsCreateCheckboxCheckedLen > 0 && totalIsCreateCheckboxCheckedLen !== fieldCheckbox.length;

  const totalIsUpdateCheckboxCheckedLen = fieldCheckbox.filter((f) => f.isUpdate).length;
  const isUpdateAllChecked =
    fieldCheckbox.length > 0 && totalIsUpdateCheckboxCheckedLen > 0 && totalIsUpdateCheckboxCheckedLen !== fieldCheckbox.length;

  return (
    <React.Fragment>
      <TableRow>
        <TableCell style={{ minWidth: 300 }}>
          <Box display="flex" justifyContent={'flex-start'} className="cursor-pointer" alignItems={'center'} onClick={() => setOpen(!open)}>
            <Typography className="tableMainHeader">{_resource?.resourceLabel}</Typography>
            {fieldCheckbox.length > 0 && (
              <Box ml={1}>
                <IconButton size="small" aria-label="expand row">
                  {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                </IconButton>
              </Box>
            )}
          </Box>
        </TableCell>
        <TableCell align="center">
          <Checkbox
            indeterminate={isReadAllChecked}
            disabled={isDisable || _resource.isReadDisabled}
            checked={_resource.isRead}
            onChange={handleChange('resource', _resource.resourceId, 'isRead')}
          />
        </TableCell>
        <TableCell align="center">
          <Checkbox
            indeterminate={isCreateAllChecked}
            disabled={isDisable || _resource.isCreateDisabled}
            checked={_resource.isCreate}
            onChange={handleChange('resource', _resource.resourceId, 'isCreate')}
          />
        </TableCell>
        <TableCell align="center">
          <Checkbox
            indeterminate={isUpdateAllChecked}
            disabled={isDisable || _resource.isUpdateDisabled}
            checked={_resource.isUpdate}
            onChange={handleChange('resource', _resource.resourceId, 'isUpdate')}
          />
        </TableCell>
        <TableCell align="center">
          <Checkbox
            disabled={isDisable || _resource.isDeleteDisabled}
            checked={_resource.isDelete}
            onChange={handleChange('resource', _resource.resourceId, 'isDelete')}
          />
        </TableCell>
        <TableCell align="center">
          <Checkbox
            disabled={isDisable || _resource?.isHiddenDisabled}
            checked={!!_resource.isHidden}
            onChange={handleChange('resource', _resource.resourceId, 'isHidden')}
          />
        </TableCell>
      </TableRow>
      {open &&
        fieldCheckbox.map((_field, innerIndex) => (
          <TableRow key={innerIndex}>
            <TableCell>
              <Typography variant="body1" style={{ fontWeight: '400' }}>
                &emsp; {_field.fieldData.fieldLabel + (_field.fieldData.required ? ' *' : '')}
              </Typography>
            </TableCell>
            <TableCell align="center">
              <Checkbox
                disabled={isDisable || _resource.isReadDisabled || _field.isReadDisabled}
                checked={_field.isRead}
                onChange={handleChange('field', _field.fieldData._id, 'isRead')}
              />
            </TableCell>
            <TableCell align="center">
              <Checkbox
                disabled={isDisable || _resource.isCreateDisabled || _field.isCreateDisabled}
                checked={_field.isCreate}
                onChange={handleChange('field', _field.fieldData._id, 'isCreate')}
              />
            </TableCell>
            <TableCell align="center">
              <Checkbox
                disabled={isDisable || _resource.isUpdateDisabled || _field.isUpdateDisabled}
                checked={_field.isUpdate}
                onChange={handleChange('field', _field.fieldData._id, 'isUpdate')}
              />
            </TableCell>
            <TableCell />
          </TableRow>
        ))}
    </React.Fragment>
  );
};

export default React.memo(RoleEngine);
