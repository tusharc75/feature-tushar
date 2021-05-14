import React, { useEffect } from "react";
import { Grid, TextField, Typography } from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import Chip from '@material-ui/core/Chip';
import { SearchActivity } from "../../../axios/activity";
import { UnCamelCase } from "../../../constants/helpers";
import { BsSearch } from 'react-icons/bs'
import InputAdornment from '@material-ui/core/InputAdornment';

const allSearch = [
    { type: "customerAccount", name: "All", isAll: true },
    { type: "customerContact", name: "All", isAll: true },
    { type: "supplierAccount", name: "All", isAll: true },
    { type: "supplierContact", name: "All", isAll: true },
    { type: "lead", name: "All", isAll: true },
    { type: "opportunity", name: "All", isAll: true }
]

export const capitalize = (string) => {
    return string && typeof string === "string" ? string.charAt(0).toUpperCase() + string.slice(1) : string;
};

export const SearchFilter = ({ handleChangeFilter, filter }) => {
    const [options, setOptions] = React.useState([]);
    const [inputValue, setInputValue] = React.useState('');
    const [value, setValue] = React.useState([]);

    useEffect(() => {
        setValue(filter)
    }, [filter]);

    useEffect(() => {
        if (inputValue === "") {
            setOptions(allSearch)
        }
        else {
            SearchActivity(inputValue)
                .then(({ data }) => {
                    setOptions(data)
                })
                .catch((err) => {
                });
        }
    }, [inputValue]);


    const handleChangeValue = (newValue) => {
        setValue(newValue);
        handleChangeFilter(newValue)
    }

    return (<Autocomplete className="custom-autocomplete"
        style={{ borderRadius: '7px', }}
        multiple={true}
        options={options}
        getOptionLabel={(option) => (option ? option.name : "")}
        filterSelectedOptions={false}
        onChange={(event, newValue) => handleChangeValue(newValue)}
        onInputChange={(event, newInputValue) => {
            setInputValue(newInputValue);
        }}
        renderTags={(value, getTagProps) =>
            value.map((option, index) => (
                <Chip variant="outlined" label={option && (capitalize(UnCamelCase(option.type)) + " - " + option.name)} {...getTagProps({ index })} />
            ))
        }
        renderInput={(params) => (
            <TextField
                {...params}
                variant="outlined"
                placeholder="Search"
                margin="dense"
                InputProps={{
                    startAdornment: <InputAdornment position="start"><BsSearch /></InputAdornment>,
                }}
            />
        )}
        value={value}
        renderOption={(option) => {
            return (
                <Grid container alignItems="center" spacing={3}>
                    <Grid item>
                        <Chip variant="outlined" color="primary" label={option.isAll ? option.name + " " + capitalize(UnCamelCase(option.type)) : capitalize(UnCamelCase(option.type))} />
                    </Grid>
                    <Grid item xs>
                        {!option.isAll &&
                            <Typography variant="body2" >
                                {option.name}
                            </Typography>}
                    </Grid>
                </Grid>
            );
        }}
    />

    );
}
