import React, { useState, useEffect } from "react";
import {
  Box,
  Checkbox,
  Typography,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  FormControlLabel,
  Collapse,
  IconButton
} from "@material-ui/core";
import { KeyboardArrowDown, KeyboardArrowUp } from '@material-ui/icons';

interface RoleProps {
  field: any[];
  resource: any[];
  setField?: any;
  setResource?: any;
  isDisable?: boolean;
  style?: React.CSSProperties;
}


const RoleEngine = (props: RoleProps) => {
  const { field, resource, setField, setResource, isDisable, style } = props;

  const [isReadChecked, setIsReadChecked] = useState(false);
  const [isCreateChecked, setIsCreateChecked] = useState(false);
  const [isUpdateChecked, setIsUpdateChecked] = useState(false);
  const [isDeleteChecked, setIsDeleteChecked] = useState(false);
  const [isHiddenChecked, setIsHiddenChecked] = useState(false);

  useEffect(() => {
    let isAnyReadFoundUnchecked = false;
    let isAnyCreateFoundUnchecked = false;
    let isAnyUpdateFoundUnchecked = false;
    let isAnyDeleteFoundUnchecked = false;
    let isAnyHiddenFoundUnchecked = false

    resource.forEach((_resource) => {

      if (_resource.isRead === false && !_resource.isReadDisabled && isAnyReadFoundUnchecked === false) {
        field.filter(d => d.fieldData.resource === _resource.name && !d.isReadDisabled).forEach((_field) => {
          if (_field.isRead === false && isAnyReadFoundUnchecked === false) {
            isAnyReadFoundUnchecked = true
          }
        })
        isAnyReadFoundUnchecked = true
      } else if (!_resource.isReadDisabled && isAnyReadFoundUnchecked === false) {
        isAnyReadFoundUnchecked = field.filter(d => d.fieldData.resource === _resource.name && !d.isReadDisabled).some((_field) => {
          return _field.isRead === false;
        })
      }

      if (_resource.isCreate === false && !_resource.isCreateDisabled && isAnyCreateFoundUnchecked === false) {
        field.filter(d => d.fieldData.resource === _resource.name && !d.isCreateDisabled).forEach((_field) => {
          if (_field.isCreate === false && isAnyCreateFoundUnchecked === false) {
            isAnyCreateFoundUnchecked = true
          }
        })
        isAnyCreateFoundUnchecked = true
      } else if (!_resource.isCreateDisabled && isAnyCreateFoundUnchecked === false) {
        isAnyCreateFoundUnchecked = field.filter(d => d.fieldData.resource === _resource.name && !d.isCreateDisabled).some((_field) => {
          return _field.isCreate === false;
        })
      }

      if (_resource.isUpdate === false && !_resource.isUpdateDisabled && isAnyUpdateFoundUnchecked === false) {
        field.filter(d => d.fieldData.resource === _resource.name && !d.isUpdateDisabled).forEach((_field) => {
          if (_field.isUpdate === false && isAnyUpdateFoundUnchecked === false) {
            isAnyUpdateFoundUnchecked = true
          }
        })
        isAnyUpdateFoundUnchecked = true
      } else if (!_resource.isUpdateDisabled && isAnyUpdateFoundUnchecked === false) {
        isAnyUpdateFoundUnchecked = field.filter(d => d.fieldData.resource === _resource.name && !d.isUpdateDisabled).some((_field) => {
          return _field.isUpdate === false;
        })
      }

      if (_resource.isDelete === false && !_resource.isDeleteDisabled && isAnyDeleteFoundUnchecked === false) {
        isAnyDeleteFoundUnchecked = true
      }

      if (!_resource.isHidden && isAnyHiddenFoundUnchecked === false) {
        isAnyHiddenFoundUnchecked = true
      }


    });

    setIsReadChecked(!isAnyReadFoundUnchecked);
    setIsCreateChecked(!isAnyCreateFoundUnchecked);
    setIsUpdateChecked(!isAnyUpdateFoundUnchecked);
    setIsDeleteChecked(!isAnyDeleteFoundUnchecked);
    setIsHiddenChecked(!isAnyHiddenFoundUnchecked);

  }, [field, resource])

  const updateRoles = (propertyToUpdate, isChecked) => {
    const newResource = [...resource];
    const newField = [...field];
    newResource.forEach((_resource) => {
      if (isChecked === true) {
        _resource[propertyToUpdate] = !_resource[`${propertyToUpdate}Disabled`] && isChecked;
      } else {
        _resource[propertyToUpdate] = isChecked;
      }

      if (propertyToUpdate !== "isDelete") {
        newField.filter(d => d.fieldData.resource === _resource.name).forEach((_field) => {
          if (isChecked === true) {
            _field[propertyToUpdate] = !_resource[`${propertyToUpdate}Disabled`] && !_field[`${propertyToUpdate}Disabled`] && isChecked;
          } else {
            _field[propertyToUpdate] = isChecked;
          }
        })
      }
    })

    setResource(newResource);
    setField(newField);
  }

  const handleChange = (type, id, access) => (event) => {
    //Checking for the type if it is resource or field
    if (type === "resource") {
      const newResource = [...resource];
      const newField = [...field];
      newResource.forEach((_resource) => {
        if (_resource.resourceId === id) {
          let isCreateUpdateSelected;
          const isSubResourcePresent = newField
            .filter((_field) => _field.fieldData.resource === _resource.name);
          if (isSubResourcePresent.length === 0) {
            isCreateUpdateSelected = _resource["isCreate"] || _resource["isUpdate"];
          } else {
            isCreateUpdateSelected = isSubResourcePresent.some((_field) => _field["isCreate"] || _field["isUpdate"]);
          }

          if (access === "isRead" && isCreateUpdateSelected) {
          } else {
            _resource[access] = event.target.checked;
          }
          if (event.target.checked) {
            _resource["isRead"] = event.target.checked;
          }

          if (access !== "isDelete") {
            newField.forEach((_field) => {
              if (_field.fieldData.resource === _resource.name) {
                if (
                  access === "isRead" &&
                  !event.target.value &&
                  isCreateUpdateSelected
                ) {
                } else {
                  _field[access] = event.target.checked;
                }

                if (event.target.checked) {
                  _field["isRead"] = event.target.checked;
                }
              }
            });
          }

          if (access === "isDelete") {
            newField.forEach((_field) => {
              if (
                _field.fieldData.resource === _resource.name &&
                _field.fieldData.required
              ) {
                if (event.target.checked) {
                  _field["isRead"] = event.target.checked;
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
          if (
            !event.target.checked &&
            access === "isRead" &&
            (_field["isUpdate"] || _field["isCreate"])
          ) {
            // _field[access] = event.target.checked;
          } else if (
            !event.target.checked &&
            access === "isCreate" &&
            _field.fieldData.required
          ) {
          } else {
            _field[access] = event.target.checked;
          }

          if (
            ["isUpdate", "isCreate"].includes(access) &&
            event.target.checked
          ) {
            _field["isRead"] = true;
          }

          selectedResource = _field.fieldData.resource;

          if (event.target.checked) {
            newResource.forEach((_resource) => {
              if (_field.fieldData.resource === _resource.name) {
                _resource[access] = true;
                if (
                  ["isUpdate", "isCreate"].includes(access) &&
                  event.target.checked
                ) {
                  _resource["isRead"] = true;
                }
              }
            });
          } else {
            const isAllFalse = newField
              .filter(
                (__field) =>
                  __field.fieldData.resource === _field.fieldData.resource
              )
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

      if (access === "isCreate" && event.target.checked) {
        newField.forEach((_field) => {
          if (
            _field.fieldData.resource === selectedResource &&
            _field.fieldData.required
          ) {
            _field["isCreate"] = true;
            _field["isRead"] = true;
          }
        });
      }

      setResource(newResource);
      setField(newField);
    }
  };


  return (
    <TableContainer style={{ height: 400, minHeight: 400, ...style }}>
      <Table
        stickyHeader
        aria-label="roles"
        className="roles-table"
      >
        <TableHead>
          <TableRow>
            <TableCell>Names</TableCell>
            <TableCell align="center">
              <FormControlLabel
                control={<Checkbox
                  disabled={isDisable}
                  checked={isReadChecked}
                  onChange={(e) => {
                    setIsReadChecked(e.target.checked)
                    updateRoles("isRead", e.target.checked)
                  }}
                />}
                label="Read"
              />
            </TableCell>
            <TableCell align="center">
              <FormControlLabel
                control={<Checkbox
                  disabled={isDisable}
                  checked={isCreateChecked}
                  onChange={(e) => {
                    setIsCreateChecked(e.target.checked)
                    updateRoles("isCreate", e.target.checked)

                    if (e.target.checked && !isReadChecked) {
                      setIsReadChecked(e.target.checked)
                      updateRoles("isRead", e.target.checked)
                    }
                  }}
                />}
                label="Create"
              />
            </TableCell>
            <TableCell align="center">
              <FormControlLabel
                control={<Checkbox
                  disabled={isDisable}
                  checked={isUpdateChecked}
                  onChange={(e) => {
                    setIsUpdateChecked(e.target.checked)
                    updateRoles("isUpdate", e.target.checked)

                    if (e.target.checked && !isReadChecked) {
                      setIsReadChecked(e.target.checked)
                      updateRoles("isRead", e.target.checked)
                    }
                  }}
                />}
                label="Update"
              />
            </TableCell>
            <TableCell align="center">
              <FormControlLabel
                control={<Checkbox
                  disabled={isDisable}
                  checked={isDeleteChecked}
                  onChange={(e) => {
                    setIsDeleteChecked(e.target.checked)
                    updateRoles("isDelete", e.target.checked)

                    if (e.target.checked && !isReadChecked) {
                      setIsReadChecked(e.target.checked)
                      updateRoles("isRead", e.target.checked)
                    }
                  }}
                />}
                label="Delete"
              />
            </TableCell>
            <TableCell align="center">
              <FormControlLabel
                control={<Checkbox
                  disabled={isDisable}
                  checked={isHiddenChecked}
                  onChange={(e) => {
                    setIsHiddenChecked(e.target.checked)
                    updateRoles("isHidden", e.target.checked)
                  }}
                />}
                label="Hidden"
              />
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {resource.map((_resource, outerIndex) => {
            const resourceFields = field.filter((_field) => _field.fieldData.resource === _resource.name).sort((a, b) => a.order - b.order);
            return (
              <React.Fragment key={outerIndex}>
                <Row
                  _resource={_resource}
                  isDisable={isDisable}
                  handleChange={handleChange}
                  fieldCheckbox={resourceFields}
                />
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const Row = ({ _resource, isDisable, handleChange, fieldCheckbox }) => {
  const [open, setOpen] = useState(false)
  const isReadAllChecked = fieldCheckbox.length > 0 === fieldCheckbox.filter(f => f.isRead).length > 0
    && fieldCheckbox.filter(f => f.isRead).length > 0 && fieldCheckbox.filter(f => f.isRead).length !== fieldCheckbox.length

  const isCreateAllChecked = fieldCheckbox.length > 0 === fieldCheckbox.filter(f => f.isCreate).length > 0
    && fieldCheckbox.filter(f => f.isCreate).length > 0 && fieldCheckbox.filter(f => f.isCreate).length !== fieldCheckbox.length

  const isUpdateAllChecked = fieldCheckbox.length > 0 === fieldCheckbox.filter(f => f.isUpdate).length > 0
    && fieldCheckbox.filter(f => f.isUpdate).length > 0 && fieldCheckbox.filter(f => f.isUpdate).length !== fieldCheckbox.length

  return (
    <React.Fragment>
      <TableRow>
        <TableCell style={{ minWidth: 300 }}>
          <Box display='flex' justifyContent={'flex-start'} alignItems={'center'}>
            <Typography className="tableMainHeader">{_resource?.resourceLabel}</Typography>
            {fieldCheckbox.length > 0 && <Box ml={1}>
              <IconButton
                size="small"
                aria-label="expand row"
                onClick={() => setOpen(!open)}
              >
                {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
              </IconButton>
            </Box>}
          </Box>
        </TableCell>
        <TableCell align="center">
          <Checkbox
            indeterminate={isReadAllChecked}
            disabled={isDisable || _resource.isReadDisabled}
            checked={_resource.isRead}
            onChange={handleChange(
              "resource",
              _resource.resourceId,
              "isRead"
            )}
          />
        </TableCell>
        <TableCell align="center">
          <Checkbox
            indeterminate={isCreateAllChecked}
            disabled={isDisable || _resource.isCreateDisabled}
            checked={_resource.isCreate}
            onChange={handleChange(
              "resource",
              _resource.resourceId,
              "isCreate"
            )}
          />
        </TableCell>
        <TableCell align="center">
          <Checkbox
            indeterminate={isUpdateAllChecked}
            disabled={isDisable || _resource.isUpdateDisabled}
            checked={_resource.isUpdate}
            onChange={handleChange(
              "resource",
              _resource.resourceId,
              "isUpdate"
            )}
          />
        </TableCell>
        <TableCell align="center">
          <Checkbox
            disabled={isDisable || _resource.isDeleteDisabled}
            checked={_resource.isDelete}
            onChange={handleChange(
              "resource",
              _resource.resourceId,
              "isDelete"
            )}
          />
        </TableCell>
        <TableCell align="center">
          <Checkbox
            disabled={isDisable}
            checked={!!_resource.isHidden}
            onChange={handleChange(
              'resource',
              _resource.resourceId,
              'isHidden',
            )}
          />
        </TableCell>
      </TableRow>
      {open && fieldCheckbox.map((_field, innerIndex) => (
        <TableRow key={innerIndex}>
          <TableCell>
            <Typography variant="body1">
              &emsp;{" "}
              {_field.fieldData.fieldLabel +
                (_field.fieldData.required ? " *" : "")}
            </Typography>
          </TableCell>
          <TableCell align="center">
            <Checkbox
              disabled={isDisable || _resource.isReadDisabled || _field.isReadDisabled}
              checked={_field.isRead}
              onChange={handleChange("field", _field.fieldData._id, "isRead")}
            />
          </TableCell>
          <TableCell align="center">
            <Checkbox
              disabled={isDisable || _resource.isCreateDisabled || _field.isCreateDisabled}
              checked={_field.isCreate}
              onChange={handleChange(
                "field",
                _field.fieldData._id,
                "isCreate"
              )}
            />
          </TableCell>
          <TableCell align="center">
            <Checkbox
              disabled={isDisable || _resource.isUpdateDisabled || _field.isUpdateDisabled}
              checked={_field.isUpdate}
              onChange={handleChange(
                "field",
                _field.fieldData._id,
                "isUpdate"
              )}
            />
          </TableCell>
          <TableCell />
        </TableRow>
      ))}
    </React.Fragment>
  )
}

export default React.memo(RoleEngine);
