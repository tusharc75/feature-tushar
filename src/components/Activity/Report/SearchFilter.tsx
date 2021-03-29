import React, { useEffect } from "react";
import { Grid, TextField, Typography } from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import Chip from '@material-ui/core/Chip';
import { SearchActivity } from "../../../axios/activity";

const allSearch = [
    { type: "account", name: "All", isAll: true },
    { type: "contact", name: "All", isAll: true },
    { type: "lead", name: "All", isAll: true },
    { type: "opportunity", name: "All", isAll: true }
]

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

    return (<Autocomplete
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
                <Chip variant="outlined" className="text-capitalize" label={option && (option.type + " - " + option.name)} {...getTagProps({ index })} />
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
                        <Chip variant="outlined" className="text-capitalize" color="primary" label={option.isAll ? option.name + " " + option.type : option.type} />
                    </Grid>
                    <Grid item xs>
                        {!option.isAll &&
                            <Typography variant="body2">
                                {option.name}
                            </Typography>}
                    </Grid>
                </Grid>
            );
        }}
    />

    );
}
