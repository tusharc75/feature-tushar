import TextField from '@material-ui/core/TextField';
import Checkbox from '@material-ui/core/Checkbox';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import ListItemText from '@material-ui/core/ListItemText';
import Autocomplete from '@material-ui/lab/Autocomplete';
import Chip from '@material-ui/core/Chip';
import { makeStyles } from '@material-ui/core/styles';

const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: 300,
        },
    },
};

const useStyles = makeStyles(() => ({
    tdWidth: {
        maxWidth: 100,
        minWidth: 100
    },
}));


export const Converter = ({ fields, values, setFieldValue, }) => {

    const onChangeValue = (index, fieldName, value) => {
        let data = values["option"] ? [...values["option"]] : []
        data[index][fieldName] = value
        setFieldValue("option", data)
    };


    const handleChangeUnit = (value) => {
        setFieldValue("units", value.map((_f) => _f.trim()))
        let data = values["option"] ? [...values["option"]] : []
        if (data.length > value.length) {
            let index = 0;
            let deleteindex = 0;
            for (var x in data[0]) {
                if (!value.includes(x)) {
                    deleteindex = index;
                }
                index = index + 1
            }
            data.splice(deleteindex, 1);
        }

        let newOptions = []
        value.forEach((_unit, index) => {
            let row = {}
            value.forEach((__unit, i) => {
                row[__unit] = (data && data[index] && data[index][__unit]) ? data[index][__unit] : ""
            })
            newOptions.push(row)
        });
        setFieldValue("option", newOptions)
        if (values["displayUnits"]) {
            const result = []
            values["displayUnits"].forEach((_unit) => {
                if (value.includes(_unit)) {
                    result.push(_unit)
                }
            })
            setFieldValue("displayUnits", result)
        }
        if (values["formulaUnits"]) {
            const result = []
            values["formulaUnits"].forEach((_unit) => {
                if (value.includes(_unit)) {
                    result.push(_unit)
                }
            })
            setFieldValue("formulaUnits", result)
        }
    }


    const classes = useStyles();
    return (
        <Box marginTop={2}>
            <Autocomplete
                multiple
                disableCloseOnSelect={true}
                id="units"
                options={[]}
                value={values["units"] ? values["units"] : []}
                freeSolo
                renderTags={(value: string[], getTagProps) =>
                    value.map((option: string, index: number) => (
                        <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                    ))
                }
                onChange={(e, value) => handleChangeUnit(value)}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        margin="dense"
                        variant="outlined"
                        label="Units"
                        placeholder="Units" />
                )}
            />
            {(values["units"] && values["units"].length > 0) &&
                <Box marginTop={1} border={1} p={1} borderColor="grey.300" maxHeight={300} style={{ overflow: "auto" }} >
                    <table>
                        <thead>
                            <tr>
                                <th>
                                </th>
                                {values["units"] && values["units"].map((_unit, index) => (
                                    <th key={index} className={classes.tdWidth}>{_unit}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {values["units"] && values["units"].map((_unit, i) => (
                                <tr key={i}>
                                    <th style={{ paddingRight: 10 }}>
                                        {_unit}
                                    </th>
                                    {values["units"] && values["units"].map((_unit, index) => (
                                        <td className={classes.tdWidth} key={index}>
                                            <TextField
                                                name={_unit + "_" + index}
                                                variant="outlined"
                                                margin="dense"
                                                fullWidth
                                                style={{ margin: 0 }}
                                                value={values["option"] && values["option"][i] && values["option"][i][_unit]}
                                                onChange={(event) => onChangeValue(i, _unit, event.target.value)}
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Box>}
            {(values["units"] && values["units"].length > 0) && <Box mt={1}>
                <Grid spacing={3} container>
                    <Grid item xs={12} sm={4} md={4}>
                        <FormControl variant="outlined" fullWidth margin="dense">
                            <InputLabel htmlFor="displayUnits">Display Units</InputLabel>
                            <Select
                                inputProps={{
                                    name: 'displayUnits',
                                    id: "displayUnits"
                                }}
                                margin="dense"
                                label="Display Units"
                                multiple
                                name="displayUnits"
                                value={values["displayUnits"] ? values["displayUnits"] : []}
                                onChange={(e) => setFieldValue("displayUnits", e.target.value)}
                                renderValue={(selected: any) => selected.join(', ')}
                                MenuProps={MenuProps}
                            >
                                {values["units"] && values["units"].map((_unit) => (
                                    <MenuItem key={_unit} value={_unit}>
                                        <Checkbox color="primary" checked={values["displayUnits"] && values["displayUnits"].indexOf(_unit) > -1} />
                                        <ListItemText primary={_unit} />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4} md={4}>
                        <FormControl variant="outlined" fullWidth margin="dense">
                            <InputLabel htmlFor="formulaUnits">Formula Units</InputLabel>
                            <Select
                                inputProps={{
                                    name: 'formulaUnits',
                                    id: "formulaUnits"
                                }}
                                margin="dense"
                                label="Formula Units"
                                multiple
                                name="formulaUnits"
                                value={values["formulaUnits"] ? values["formulaUnits"] : []}
                                onChange={(e) => setFieldValue("formulaUnits", e.target.value)}
                                renderValue={(selected: any) => selected.join(', ')}
                                MenuProps={MenuProps}
                            >
                                {values["units"] && values["units"].map((_unit) => (
                                    <MenuItem key={_unit} value={_unit}>
                                        <Checkbox color="primary" checked={values["formulaUnits"] && values["formulaUnits"].indexOf(_unit) > -1} />
                                        <ListItemText primary={_unit} />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    {values["isFormula"] &&
                        <Grid item xs={12} sm={4} md={4}>
                            <FormControl fullWidth margin="dense" variant="outlined">
                                <InputLabel id="formulaOnConverter">Formula applied on converter</InputLabel>
                                <Select
                                    labelId="formulaOnConverter"
                                    id="formulaOnConverter"
                                    value={values["formulaOnConverter"]}
                                    onChange={(e) => setFieldValue("formulaOnConverter", e.target.value)}
                                    label="Formula applied on converter"
                                    name="formulaOnConverter"
                                >
                                    {values["formulaUnits"] && values["formulaUnits"].map((_unit) => (
                                        <MenuItem value={_unit}>{_unit}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>}
                </Grid>
            </Box>}
        </Box>
    );
}