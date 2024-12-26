import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { map } from 'lodash';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { getLookupOption } from '../helper';
import { sidebarResource } from 'src/constants/helpers';

export const ResourceDropdown = ({ type, lookupResource = '', value, options = [], setFieldValue, brandId, touched, errors }) => {
  const [lookupOption, setlookupOption] = useState(null);

  useEffect(() => {
    getData();
  }, [lookupResource]);

  const getData = async () => {
    if (lookupResource) {
      var data = await getLookupOption(brandId, lookupResource);
      if (lookupResource === sidebarResource.user) {
        data = [{ optionLabel: 'Current User', optionValue: 'Current User' }, ...data];
      }
      setlookupOption(data);
    } else {
      setlookupOption(options);
    }
  };

  return (
    <Box>
      {lookupOption ? (
        <Autocomplete
          id="tags-filled"
          options={lookupOption}
          getOptionLabel={(option: any) => (option ? option.optionLabel || '' : '')}
          value={
            value && type === 'multiSelect'
              ? lookupOption?.filter((data) =>
                  map(value, (optionValue) => {
                    return optionValue;
                  })?.includes(data?.optionValue)
                )
              : lookupOption?.filter((data) => data?.optionValue === value)?.length > 0
                ? lookupOption?.filter((data) => data?.optionValue === value)[0]
                : type === 'multiSelect'
                  ? []
                  : ''
          }
          multiple={type === 'multiSelect' ? true : false}
          onChange={(e, val) => {
            if (type === 'multiSelect') {
              const res = [];
              val?.forEach((e) => {
                res.push(e.optionValue ? e.optionValue : e);
              });
              setFieldValue('defaultValue', res);
            } else {
              setFieldValue('defaultValue', val && val?.optionValue ? val?.optionValue : '');
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              margin="dense"
              size='small'
              variant="outlined"
              label="Default Value"
              placeholder="Default Value"
              error={touched['defaultValue'] && Boolean(errors['defaultValue'])}
              helperText={touched['defaultValue'] && errors['defaultValue']}
            />
          )}
        />
      ) : (
        <CommonSkeleton lenArray={[...Array(1).keys()]} />
      )}
    </Box>
  );
};
