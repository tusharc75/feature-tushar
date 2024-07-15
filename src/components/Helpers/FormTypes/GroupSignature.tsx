import { Fragment, useEffect, useState } from 'react';
import { Typography, TextField, Box } from '@material-ui/core';
import axiosInstance from 'src/axios/axiosInstance';
import { Autocomplete } from '@material-ui/lab';
import Signature from 'src/components/Helpers/FormTypes/Signature';
import { useData } from 'src/StateProvider/Provider';

const GroupSignature = ({ label, values, name, setFieldValue, fieldData }) => {
  const {
    state: { user }
  }: any = useData();
  const [users, setUsers] = useState([]);
  const [selectedSignatureUsers, setSelectedSignatureUsers] = useState([]);
console.log(user)
  useEffect(() => {
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=User`)
      .then(({ data: { data } }) => {
        setUsers(data['User']);
        let selectedUsers = []
        if (!values[name]) {
          selectedUsers = data['User']?.filter((user) => [...fieldData?.signatureUsers].includes(user.optionValue)) || [];
          setSelectedSignatureUsers(selectedUsers);
          const fieldValue = selectedUsers.map((ele) => {
            return {
              user: ele.optionValue,
              signature: ''
            }
          })
          setFieldValue(name, fieldValue);
        } else {
          const userIds = values[name]?.map((ele) => ele.user);
          selectedUsers = data['User']?.filter((user) => [...userIds].includes(user.optionValue));
          setSelectedSignatureUsers(selectedUsers);
        }

      })
      .catch((error) => { });
  }, []);

  return (
    <Box>
      <Typography style={{ color: '#656565', marginBottom: '12px', fontWeight: '500' }}>{label}</Typography>
      <div className="mt-1 flex flex-col justify-center gap-3">
        <Autocomplete
          disableCloseOnSelect={false}
          options={users}
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
                }
              }
            })
            setFieldValue(name, [...updatedFieldValue]);
            setSelectedSignatureUsers(newVal);
          }}
          renderInput={(params) => <TextField {...params} label="Signature Users" name="signatureUsers" variant="outlined" />}
        />
        <div className="flex flex-col flex-wrap gap-2">
          {values[name]?.length ?
            values[name]?.map((value) => {
              const userName = selectedSignatureUsers?.find((ele)=> ele.optionValue===value.user)?.optionLabel;
              return (
                <Box className="flex gap- items-center">
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
                    disable={user?.user?._id!==value.user}
                  />
                </Box>
              );
            }) : null}
        </div>
      </div>
    </Box>
  );
};
export default GroupSignature;
