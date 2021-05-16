import React, { useState, useEffect } from "react";
import {
  Checkbox,
  Typography,
  Table,
  TableContainer,
  TableHead,
  TableBody,
} from "@material-ui/core";
import TableCell from "@material-ui/core/TableCell";
import TableRow from "@material-ui/core/TableRow";
import FormControlLabel from '@material-ui/core/FormControlLabel';

const RoleEngine = (props) => {
  const { field, resource, setField, setResource, isDisable } = props;

  const [isReadChecked, setIsReadChecked] = useState(false);
  const [isCreateChecked, setIsCreateChecked] = useState(false);
  const [isUpdateChecked, setIsUpdateChecked] = useState(false);
  const [isDeleteChecked, setIsDeleteChecked] = useState(false);

  useEffect(() => {
    let isAnyReadFoundUnchecked = false;
    let isAnyCreateFoundUnchecked = false;
    let isAnyUpdateFoundUnchecked = false;
    let isAnyDeleteFoundUnchecked = false;

    resource.forEach((_resource) => {

      if (_resource.isRead === false && isAnyReadFoundUnchecked === false) {
        field.filter(d => d.fieldData.resource === _resource.name).forEach((_field) => {
          if (_field.isRead === false && isAnyReadFoundUnchecked === false) {
            isAnyReadFoundUnchecked = true
          }
        })
        isAnyReadFoundUnchecked = true
      }

      if (_resource.isCreate === false && isAnyCreateFoundUnchecked === false) {
        field.filter(d => d.fieldData.resource === _resource.name).forEach((_field) => {
          if (_field.isCreate === false && isAnyCreateFoundUnchecked === false) {
            isAnyCreateFoundUnchecked = true
          }
        })
        isAnyCreateFoundUnchecked = true
      }

      if (_resource.isUpdate === false && isAnyUpdateFoundUnchecked === false) {
        field.filter(d => d.fieldData.resource === _resource.name).forEach((_field) => {
          if (_field.isUpdate === false && isAnyUpdateFoundUnchecked === false) {
            isAnyUpdateFoundUnchecked = true
          }
        })
        isAnyUpdateFoundUnchecked = true
      }

      if (_resource.isDelete === false && isAnyDeleteFoundUnchecked === false) {
        isAnyDeleteFoundUnchecked = true
      }
    });

    setIsReadChecked(!isAnyReadFoundUnchecked);
    setIsCreateChecked(!isAnyCreateFoundUnchecked);
    setIsUpdateChecked(!isAnyUpdateFoundUnchecked);
    setIsDeleteChecked(!isAnyDeleteFoundUnchecked);

  }, [field, resource])

  const updateRoles = (propertyToUpdate, isChecked) => {
    const newResource = [...resource];
    const newField = [...field];
    newResource.forEach((_resource) => {
      _resource[propertyToUpdate] = isChecked;

      if (propertyToUpdate !== "isDelete") {
        newField.filter(d => d.fieldData.resource === _resource.name).forEach((_field) => {
          _field[propertyToUpdate] = isChecked;
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
          const isCreateUpdateSelected = newField
            .filter((_field) => _field.fieldData.resource === _resource.name)
            .some((_field) => _field["isCreate"] || _field["isUpdate"]);

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
    <TableContainer style={{ height: 440 }}>
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
          </TableRow>
        </TableHead>
        <TableBody>
          {/* <Container maxWidth={"md"}> */}
          {resource.map((_resource, outerIndex) => {
            const resourceFields = field
              .filter((_field) => _field.fieldData.resource === _resource.name)
              .sort((a, b) => a.order - b.order);

            const fieldCheckbox = resourceFields.map((_field, innerIndex) => (
              // <Grid container key={_field.fieldData._id}>
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
                    disabled={isDisable}
                    checked={_field.isRead}
                    onChange={handleChange("field", _field.fieldData._id, "isRead")}
                  />
                </TableCell>
                <TableCell align="center">
                  <Checkbox
                    disabled={isDisable}
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
                    disabled={isDisable}
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
              // </Grid>
            ));

            return (
              <React.Fragment key={outerIndex}>
                <TableRow>
                  <TableCell style={{ minWidth: 300 }}>
                    <Typography className="tableMainHeader">{_resource.name}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Checkbox
                      disabled={isDisable}
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
                      disabled={isDisable}
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
                      disabled={isDisable}
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
                      disabled={isDisable}
                      checked={_resource.isDelete}
                      onChange={handleChange(
                        "resource",
                        _resource.resourceId,
                        "isDelete"
                      )}
                    />
                  </TableCell>
                </TableRow>
                {fieldCheckbox}
              </React.Fragment>
            );
          })}
          {/* </Container> */}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default React.memo(RoleEngine);
