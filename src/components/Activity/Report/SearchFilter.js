import React, { useState, useEffect } from "react";
import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';
import Chip from '@material-ui/core/Chip';
import { SearchActivity } from "../../../axios/activity";
import parse from 'autosuggest-highlight/parse';
import Grid from '@material-ui/core/Grid';
import LocationOnIcon from '@material-ui/icons/LocationOn';
import Typography from '@material-ui/core/Typography';


const capitalize = (s) => {
    if (typeof s !== 'string') return ''
    return s.charAt(0).toUpperCase() + s.slice(1)
}


export const SearchFilter = ({ handleChangeFilter, filter }) => {


    const [options, setOptions] = React.useState([]);
    const [inputValue, setInputValue] = React.useState('');
    const [value, setValue] = React.useState([]);

    useEffect(() => {
        setValue(filter)
    }, [filter]);

    useEffect(() => {
        SearchActivity(inputValue)
            .then(({ data }) => {
                setOptions(data)
            })
            .catch((err) => {
            });
    }, [inputValue]);


    const handleChangeValue = (newValue) => {
        setValue(newValue);
        handleChangeFilter(newValue)
    }

    return (<Autocomplete
        multiple={true}
        name="search"
        options={options}
        getOptionLabel={(option) => (option ? option.name : "")}
        filterSelectedOptions={false}
        onChange={(event, newValue) => handleChangeValue(newValue)}
        onInputChange={(event, newInputValue) => {
            setInputValue(newInputValue);
        }}
        renderTags={(value, getTagProps) =>
            value.map((option, index) => (
                <Chip variant="outlined" label={option && (capitalize(option.type) + " - " + option.name)} {...getTagProps({ index })} />
            ))
        }
        renderInput={(params) => (
            <TextField
                {...params}
                variant="outlined"
                label="Search"
                placeholder="Search"
                margin="dense"
            />
        )}
        value={value}
        renderOption={(option) => {
            return (
                <Grid container alignItems="center" spacing={3}>
                    <Grid item>
                        <Chip variant="outlined" color="primary" label={capitalize(option.type)} />
                    </Grid>
                    <Grid item xs>
                        <Typography variant="body2">
                            {option.name}
                        </Typography>
                    </Grid>
                </Grid>
            );
        }}
    />

    );
}
