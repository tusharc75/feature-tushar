
import React, { useState, useEffect } from "react";
import Box from '@material-ui/core/Box';
import axiosInstance from '../../../axios/axiosInstance'
import Autocomplete from "@material-ui/lab/Autocomplete";
import TextField from "@material-ui/core/TextField";
import { map } from 'lodash';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';

export const ResourceDropdown = ({ type, lookupResource, value, setFieldValue }) => {

    const [lookupOption, setlookupOption] = useState(null);

    useEffect(() => {
        GetLookupOption()
    }, [lookupResource]);

    const GetLookupOption = () => {
        axiosInstance().get(`/sa-formbuilder/lookup?lookupResource=` + lookupResource).then(({ data: { data } }) => {
            setlookupOption(data[lookupResource])
        })
    }

    return (
        <Box>
            {lookupOption ?
                <Autocomplete
                    id="tags-filled"
                    options={lookupOption}
                    getOptionLabel={(option: any) =>
                        option ? option.optionLabel : ""
                    }
                    value={value && type === "multiSelect" ? lookupOption?.filter((data) => map(value, (optionValue) => { return optionValue; })?.includes(data?.optionValue))
                        : lookupOption?.filter((data) => data?.optionValue === value)?.length > 0 ? lookupOption?.filter((data) => data?.optionValue === value)[0]
                            : type === "multiSelect" ? [] : ""
                    }
                    multiple={type === "multiSelect" ? true : false}
                    onChange={(e, val) => {
                        if (type === "multiSelect") {
                            const res = [];
                            val?.forEach((e) => {
                                res.push(e.optionValue ? e.optionValue : e)
                            })
                            setFieldValue('defaultValue', res);
                        }
                        else {
                            setFieldValue('defaultValue', (val && val?.optionValue) ? val?.optionValue : "");
                        }
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            margin="dense"
                            variant="outlined"
                            label="Default Value"
                            placeholder="Default Value"
                        />
                    )}
                />
                :
                <CommonSkeleton lenArray={[...Array(1).keys()]} />
            }
        </Box>
    );
};
