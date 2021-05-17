import React, { useState, useEffect, useContext } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import FieldList from '../FieldList';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import ListItemText from '@material-ui/core/ListItemText';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import RemoveCircleOutlineIcon from '@material-ui/icons/RemoveCircleOutline';
import { camelCase, UnCamelCase } from "../../../constants/helpers";
import Autocomplete from '@material-ui/lab/Autocomplete';
import Chip from '@material-ui/core/Chip';
import { makeStyles } from '@material-ui/core/styles';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";


export const Currency = ({ values, setFieldValue }) => {

    const toastConfig = useContext(CustomToastContext)
    const [currency, setCurrency] = useState([]);

    useEffect(() => {
        axiosInstance().get(`/converter?type=currency`).then(({ data: { data } }) => {
            setCurrency(data.currency)
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    }, []);

    return (
        <Box>
            <Autocomplete
                multiple
                id="tags-filled"
                options={currency}
                value={values["displayCurrency"] ? values["displayCurrency"] : []}
                freeSolo
                renderTags={(value: string[], getTagProps) =>
                    value.map((option: string, index: number) => (
                        <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                    ))
                }
                onChange={(e, value) => setFieldValue("displayCurrency", value)}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        margin="dense"
                        variant="outlined"
                        label="Currency"
                        placeholder="Currency" />
                )}
            />
        </Box>
    );
}