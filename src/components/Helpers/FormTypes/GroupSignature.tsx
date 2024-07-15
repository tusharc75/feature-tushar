import { Fragment, useEffect, useState } from 'react';
import { Typography, TextField } from '@material-ui/core';
import axiosInstance from 'src/axios/axiosInstance';
import { Autocomplete } from '@material-ui/lab';
import Signature from 'src/components/Helpers/FormTypes/Signature';

const GroupSignature = ({ label, values, name, touched, errors, setFieldValue, signatureUsers, required }) => {
  const [users, setUsers] = useState([]);
  const [selectedSignatureUsers, setSelectedSignatureUsers] = useState([]);
  // const [error, setError] = useState({});
  // const [touch, setTouch] = useState({});

  useEffect(() => {
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=User`)
      .then(({ data: { data } }) => {
        setUsers(data['User']);
        let selectedUsers = []
        if(!values[name]){
         
         selectedUsers = data['User']?.filter((user) => [...signatureUsers].includes(user.optionValue)) || [];
       
        setSelectedSignatureUsers(selectedUsers);
          const fieldData = selectedUsers.map((ele)=> {
            return {
              user: ele.optionValue,
              signature: ''
            }
          })
          setFieldValue(name, fieldData);
        }else{
          const userIds = values[name]?.map((ele)=> ele.user);
           selectedUsers = data['User']?.filter((user) => [...userIds].includes(user.optionValue));
           setSelectedSignatureUsers(selectedUsers);
        }  
     
      })
      .catch((error) => {});
  }, []);

//   useEffect(() => {
//     validate();
//   }, [values[name]]);

//   useEffect(() => {
//     if (touched[name] && Boolean(errors[name])) {
//       validate();
//     }
//   }, [values[name], errors, touched]);

//   const validate = () => {
//     const err: any = {};
//     const tch: any = {};
//    if(values[name]?.length>0){
//     values[name]?.forEach((v, i) => {
//       if (required) {
//         if (!v['signature']) {
//           err[`${i}`] = { ['signature']: `Signature is required` };
//           tch[`${i}`] = {  ['signature']: true };
//         }
//       }
//   });
// }
//     setError(err);
//     setTouch(tch);
//   };


  return (
    <Fragment>
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
            const updatedFieldValue = newVal?.map((ele)=>{
              const data = values[name]?.find((e)=> e.user===ele.optionValue);
              if(data && data.signature){
                return data;
              }else{
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
        <div className="flex flex-row flex-wrap items-center gap-2">
          {values[name]?.length ?
            values[name]?.map((value, idx) => {
              return (
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
                />
              );
            }) : null}
        </div>
      </div>
    </Fragment>
  );
};
export default GroupSignature;
