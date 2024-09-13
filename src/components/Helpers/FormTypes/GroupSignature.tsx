import { Fragment, useEffect, useState } from 'react';
import { Typography, TextField, Box } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import Signature from 'src/components/Helpers/FormTypes/Signature';
import { useData } from 'src/StateProvider/Provider';
import { isObject } from 'lodash';

const GroupSignature = ({ label, values, name, setFieldValue, fieldData, touched = {}, errors = {} }) => {
  const {
    state: { user }
  }: any = useData();

  const [selectedSignatureUsers, setSelectedSignatureUsers] = useState([]);

  useEffect(() => {
    let selectedUsers = [];
    let fieldValue = [];
    const userIds = values[name]?.map((ele) => (isObject(ele?.user) ? ele?.user?._id : ele?.user));
    fieldValue = values[name]?.map((ele) => {
      return {
        ...ele,
        user: isObject(ele?.user) ? ele?.user?._id : ele?.user
      };
    });
    selectedUsers = fieldData?.option?.filter((user) => [...userIds].includes(user.optionValue));
    setSelectedSignatureUsers(selectedUsers);
    setFieldValue(name, fieldValue);
  }, []);

  return (
    <Box>
      <Typography style={{ color: '#656565', marginBottom: '12px', fontWeight: '500' }}>{label}</Typography>
      <div className="mt-1 flex flex-col justify-center gap-3">
        <Autocomplete
          disableCloseOnSelect={false}
          options={fieldData?.option}
          fullWidth
          multiple
          size="small"
          value={selectedSignatureUsers ? selectedSignatureUsers : []}
          getOptionLabel={(option) => option.optionLabel}
          getOptionSelected={(option: any, val: any) => option.optionValue === val.optionValue}
          onChange={(_, newVal: any) => {
            const updatedFieldValue = newVal?.map((ele) => {
              const data = (values[name] || [])?.find((e) => e.user === ele.optionValue);
              if (data && data.signature) {
                return data;
              } else {
                return {
                  user: ele.optionValue,
                  signature: ''
                };
              }
            });
            setFieldValue(name, [...updatedFieldValue]);
            setSelectedSignatureUsers(newVal);
          }}
          renderInput={(params) => (
            <TextField
              error={touched[name] && Boolean(errors[name])}
              helperText={touched[name] && errors[name]}
              {...params}
              label="Signature Users"
              name={name}
              variant="outlined"
            />
          )}
        />
        <div className="flex flex-col flex-wrap gap-2">
          {values[name]?.length
            ? values[name]?.map((value) => {
                const userName = selectedSignatureUsers?.find((ele) => ele.optionValue === value.user)?.optionLabel;
                return (
                  <Box className="flex items-center justify-between">
                    <Typography>{userName}</Typography>
                    <Signature
                      label={''}
                      name={`signature`}
                      touched={{}}
                      errors={{}}
                      values={value ?? {}}
                      isTooltip={false}
                      tooltipMessage={''}
                      setFieldValue={(_, dataUrl: string) => {
                        const updatedData = [...(values[name] ?? [])];
                        updatedData.forEach((data) => {
                          if (data.user === value.user) {
                            data.signature = dataUrl;
                          }
                        });
                        setFieldValue(name, updatedData);
                      }}
                      disable={user?.user?._id !== value.user}
                    />
                  </Box>
                );
              })
            : null}
        </div>
      </div>
    </Box>
  );
};
export default GroupSignature;
