import { useState, useContext, useEffect, Fragment } from 'react';
import Grid from '@mui/material/Grid2';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import { Add, Cancel, Delete } from '@mui/icons-material';
import Typography from '@mui/material/Typography';
import axiosInstance from 'src/axios/axiosInstance';

export default function customTable({ id, classes, entity, table, setTable }) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [resource, setResource] = useState([]);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [field, setField] = useState([]);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    fetchCustomField();
  }, [entity]);

  async function fetchCustomField() {
    const data = await axiosInstance().get(`/sa-formbuilder/resource`);
    setResource(data?.data?.data);
  }
  async function fetchFieldData(resource) {
    const fields = await axiosInstance().get(`/field?resource=${resource}&entity=${entity}&view=true`);
    return fields?.data?.data?.map((field) => {
      return { label: field?.fieldData?.fieldLabel, name: field?.fieldData?.fieldName };
    });
  }
  return (
    <>
      <Grid size={{xs:12}} className="mt-4">
        <Box className={classes.tinyMCEContainer}>
          <Typography className={classes.headingLabel} variant="h5" component="h5">
            Tables
          </Typography>
          <Box border={1} borderColor={'var(--common-border-color)'} padding={1}>
            <Fragment>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  setTable((tables) => [...tables, { resourceName: null, columns: [''], fieldsOptions: [] }]);
                }}
              >
                <Add />
                Add Table
              </Button>
              <Fragment>
                {table.map((data, index) => {
                  return (
                    <Box key={index} border={1} borderColor={'grey.300'} borderRadius={1} padding={0.8} marginTop={1}>
                      <Box style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Autocomplete
                          getOptionLabel={(resource: any) => (resource ? resource?.resourceLabel : '')}
                          value={
                            resource?.filter((d) => d.resource === data.resourceName).length
                              ? resource?.filter((d) => d.resource === data.resourceName)[0]
                              : ''
                          }
                          options={resource}
                          onChange={async (e, val) => {
                            const fieldsOptions = await fetchFieldData(val?.resource);
                            setTable((prevState) => {
                              const newTable = [...prevState];
                              newTable[index].resourceName = val.resource;
                              newTable[index].fieldOptions = fieldsOptions ?? [];
                              return newTable;
                            });
                          }}
                          renderOption={(props, option, state, ownerState) => {
                            const { key, ...optionProps } = props;
                            return (
                              <Box component="li" key={key} {...optionProps}>
                                {ownerState.getOptionLabel(option)}
                              </Box>
                            );
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              required={true}
                              margin="dense"
                              size="small"
                              name="resourceName"
                              label="Resource Name"
                              variant="outlined"
                              fullWidth
                            />
                          )}
                          fullWidth
                        />
                        <Button
                          onClick={() => {
                            setTable((table) => [...table.slice(0, index), ...table.slice(index + 1)]);
                          }}
                        >
                          <Delete color="inherit" />
                        </Button>
                      </Box>
                      <Box border={1} borderColor={'grey.100'} padding={0.5}>
                        {data.columns.map((column, indexCol) => {
                          return (
                            <Box key={'column' + indexCol + index} style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Autocomplete
                                getOptionLabel={(option: any) => (option ? option?.label : '')}
                                value={
                                  table[index].fieldOptions?.filter((d) => d.name === column).length
                                    ? table[index].fieldOptions?.filter((d) => d.name === column)[0]
                                    : ''
                                }
                                options={table[index].fieldOptions ?? []}
                                onChange={(e, val) => {
                                  setTable((prevState) => {
                                    const newTable = [...prevState];
                                    newTable[index].columns[indexCol] = val?.name;
                                    return newTable;
                                  });
                                }}
                                renderOption={(props, option, state, ownerState) => {
                                  const { key, ...optionProps } = props;
                                  return (
                                    <Box component="li" key={key} {...optionProps}>
                                      {ownerState.getOptionLabel(option)}
                                    </Box>
                                  );
                                }}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    required={true}
                                    margin="dense"
                                    size="small"
                                    variant="outlined"
                                    name="fieldName"
                                    label="Field Name"
                                    fullWidth
                                  />
                                )}
                                fullWidth
                              />
                              <Button
                                onClick={() => {
                                  setTable((table) => {
                                    const newTable = [...table];
                                    newTable[index].columns.push('');
                                    return newTable;
                                  });
                                }}
                              >
                                <Add />
                              </Button>
                              <Button
                                onClick={() => {
                                  setTable((table) => {
                                    const newTable = [...table];
                                    newTable[index].columns = [
                                      ...newTable[index].columns.slice(0, indexCol),
                                      ...newTable[index].columns.slice(indexCol + 1)
                                    ];
                                    return newTable;
                                  });
                                }}
                              >
                                <Cancel />
                              </Button>
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                  );
                })}
              </Fragment>
            </Fragment>
          </Box>
        </Box>
      </Grid>
    </>
  );
}
