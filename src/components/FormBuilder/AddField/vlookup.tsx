import React, { useState, useEffect } from 'react';
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
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import ListItemText from '@material-ui/core/ListItemText';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import RemoveCircleOutlineIcon from '@material-ui/icons/RemoveCircleOutline';
import { camelCase, UnCamelCase } from "../../../constants/helpers";
import * as XLSX from 'xlsx';
import Autocomplete from '@material-ui/lab/Autocomplete';
import Chip from '@material-ui/core/Chip';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import { FixedSizeList } from 'react-window';

const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: 300,
        },
    },
};

export const Vlookup = ({ fields, values, setFieldValue, _id, touched, errors }) => {


    const [isUpdate, setUpdate] = useState(false);

    useEffect(() => {
        if (!values["option"] || values["option"].length === 0) {
            setFieldValue("option", [{ optionLabel: "Option 1", optionValue: "Option 1" }])
        }
    }, []);


    const onChangeValue = (index, fieldName, value) => {
        let data = [...values["option"]]
        data[index][fieldName] = value
        setFieldValue("option", data)
    };

    const AddRemoveValue = (type, index) => {
        let data = [...values["option"]]
        if (type === "add") {
            data.splice((index + 1), 0, { optionLabel: "" });
        }
        else {
            if (data.length !== 1) {
                data.splice(index, 1);
            }
        }
        setFieldValue("option", data)
        setUpdate(!isUpdate)
    };


    const handleImportExcel = (e) => {
        e.preventDefault();
        var files = e.target.files, f = files[0];
        var reader = new FileReader();
        reader.onload = function (e) {
            var data = e.target.result;
            let readedData = XLSX.read(data, { type: 'binary' });
            const wsname = readedData.SheetNames[0];
            const ws = readedData.Sheets[wsname];
            const dataParse = XLSX.utils.sheet_to_json(ws, { header: 1 });
            if (dataParse.length) {
                dataParse.splice(0, 1);
                let option = []
                dataParse.forEach((row) => {
                    let rowInsert = {}
                    rowInsert["optionLabel"] = row[0] ? row[0].toString() : ""
                    values["vlookupInputFields"] && values["vlookupInputFields"].forEach((coloum, index) => {
                        rowInsert[coloum] = row[index + 1] ? row[index + 1].toString() : ""
                    })
                    option.push(rowInsert)
                })
                setFieldValue("option", option)
            }
        };
        reader.readAsBinaryString(f)
    }

    const handleExportExcel = () => {
        var export_json = [...values["option"]];
        export_json.forEach((_d) => {
            delete _d.optionValue
        })
        var ws = XLSX.utils.json_to_sheet(export_json);
        var wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        XLSX.writeFile(wb, "vlookup dropdown options.xlsx");
    }


    const convertLabeltoValue = (value) => {
        const result = []
        value.forEach((_v) => {
            if (fields.filter((data) => data.fieldLabel === _v || data.fieldName === _v).length) {
                result.push(fields.filter((data) => data.fieldLabel === _v || data.fieldName === _v)[0].fieldName)
            }
            else {
                result.push(_v)
            }
        })
        return result;
    }

    const convertValuetoLabel = (value) => {
        const result = []
        value.forEach((_v) => {
            if (fields.filter((data) => data.fieldName === _v).length) {
                result.push(fields.filter((data) => data.fieldLabel === _v || data.fieldName === _v)[0].fieldLabel)
            }
            else {
                result.push(_v)
            }
        })
        return result;
    }

    const Row = React.useMemo(() => {
        return React.forwardRef(
            (props2: any, ref2: any) => <div style={props2.style} ref={ref2}>
                <Box bgcolor="white" border={1} p={1} borderColor="grey.300" width={"100%"} >
                    <Box display="flex" flexDirection="row" >
                        <Box minWidth={100}>
                            <IconButton aria-label="setting" onClick={() => AddRemoveValue("add", props2.index)} >
                                <AddCircleOutlineIcon fontSize="small" />
                            </IconButton>
                            <IconButton aria-label="setting" onClick={() => AddRemoveValue("remove", props2.index)} >
                                <RemoveCircleOutlineIcon fontSize="small" />
                            </IconButton>
                        </Box>
                        <Box minWidth={200} maxWidth={200} pl={1}>
                            <TextField
                                key={props2.index}
                                id="standard-basic"
                                variant="outlined"
                                margin="dense"
                                fullWidth
                                style={{ margin: 0 }}
                                value={values["option"][props2.index] && values["option"][props2.index].optionLabel}
                                onChange={(event) => {
                                    onChangeValue(props2.index, "optionLabel", event.target.value)
                                }}
                            />
                        </Box>
                        {values["vlookupInputFields"] && values["vlookupInputFields"].map((_row) => (
                            <Box minWidth={200} maxWidth={200} pl={1}>
                                {(fields.filter((_f) => _f.fieldName === _row).length) &&
                                    fields.filter((_f) => _f.fieldName === _row)[0].type === "dropDown" ||
                                    fields.filter((_f) => _f.fieldName === _row)[0].type === "vlookupDropdown" ?
                                    <Select
                                        id="demo-simple-select-outlined"
                                        fullWidth
                                        variant="outlined"
                                        margin="dense"
                                        value={values["option"][props2.index][_row]}
                                        onChange={(event) => onChangeValue(props2.index, _row, event.target.value)}
                                    >
                                        {fields.filter((_f) => _f.fieldName === _row)[0].option &&
                                            fields.filter((_f) => _f.fieldName === _row)[0].option.map((_option) => {
                                                return (<MenuItem key={_option.optionLabel} value={_option.optionLabel}>
                                                    {_option.optionLabel}
                                                </MenuItem>
                                                );
                                            })
                                        }
                                    </Select>
                                    :
                                    <TextField
                                        id="standard-basic"
                                        variant="outlined"
                                        margin="dense"
                                        fullWidth
                                        style={{ margin: 0 }}
                                        value={values["option"][props2.index][_row]}
                                        onChange={(event) => onChangeValue(props2.index, _row, event.target.value)}
                                    />
                                }
                            </Box>))}
                    </Box>
                </Box>
            </div>,
        );
    }, [isUpdate]);

    return (
        <Box marginTop={2}>
            <Autocomplete
                multiple
                disableCloseOnSelect={true}
                id="tags-filled"
                options={fields && (fields.filter((_f) => _f._id !== _id)).map((_field) => { return _field.fieldLabel })}
                getOptionLabel={(option) => option}
                value={values["vlookupInputFields"] ? convertValuetoLabel(values["vlookupInputFields"]) : []}
                renderTags={(value: string[], getTagProps) =>
                    value.map((option: string, index: number) => (
                        <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                    ))
                }
                onChange={(e, value) => {
                    setFieldValue("vlookupInputFields", convertLabeltoValue(value))
                    setUpdate(!isUpdate)
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        margin="dense"
                        variant="outlined"
                        label="Input Parameters"
                        placeholder="Input Parameters"
                        name="vlookupInputFields"
                        error={touched['vlookupInputFields'] && Boolean(errors['vlookupInputFields'])}
                        helperText={touched['vlookupInputFields'] && errors['vlookupInputFields']}
                    />
                )}
            />
            <Box marginTop={1} marginBottom={2}>
                <Box>
                    <Grid spacing={3} container>
                        <Grid item xs={12} sm={6} md={6}>
                            <Typography variant="body2">Options</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={6} container justify="flex-end">
                            <label htmlFor="vlookupimportFromExcel" className={`cursor-pointer mr-3`}>Import from Excel</label>
                            <input
                                onClick={(e: any) => (e.target.value = null)}
                                id="vlookupimportFromExcel"
                                name="vlookupimportFromExcel"
                                onChange={handleImportExcel}
                                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                                style={{
                                    opacity: "0",
                                    position: "absolute",
                                    zIndex: -1,
                                }}
                                type="file"
                            />
                            <label className={`cursor-pointer`} onClick={handleExportExcel} >Export to Excel</label>
                        </Grid>
                    </Grid>
                </Box>
                <Box border={1} mt={1} p={1} bgcolor="grey.100" borderColor="grey.300" >
                    <Box bgcolor="white" border={1} mb={1} p={1} borderColor="grey.300" width={"100%"} >
                        <Box display="flex" flexDirection="row">
                            <Box minWidth={100} pl={2}>
                                <Typography variant="body2">Action</Typography>
                            </Box>
                            <Box minWidth={200} pl={1}>
                                <Typography variant="body2">Option Label</Typography>
                            </Box>
                            {values["vlookupInputFields"] && convertValuetoLabel(values["vlookupInputFields"]).map((_row) => (
                                <Box minWidth={200} pl={1}>
                                    <Typography variant="body2">{_row}</Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                    <FixedSizeList
                        height={300}
                        width={"100%"}
                        itemSize={55}
                        itemData={values["option"] && values["option"]}
                        itemCount={values["option"] && values["option"].length}
                    >
                        {Row}
                    </FixedSizeList>
                    {/* 
                    {values["option"] && values["option"].map((data, index) => (
                        <Box key={index} bgcolor="white" border={1} mb={1} p={1} borderColor="grey.300" width={"100%"} >
                            <Box display="flex" flexDirection="row" >
                                <Box minWidth={100}>
                                    <IconButton aria-label="setting" onClick={() => AddRemoveValue("add", index)} >
                                        <AddCircleOutlineIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton aria-label="setting" onClick={() => AddRemoveValue("remove", index)} >
                                        <RemoveCircleOutlineIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                                <Box minWidth={200} maxWidth={200} pl={1}>
                                    <TextField
                                        id="standard-basic"
                                        variant="outlined"
                                        margin="dense"
                                        fullWidth
                                        style={{ margin: 0 }}
                                        value={data.optionLabel}
                                        onChange={(event) => onChangeValue(index, "optionLabel", event.target.value)}
                                    />
                                </Box>
                                {values["vlookupInputFields"] && values["vlookupInputFields"].map((_row) => (
                                    <Box minWidth={200} maxWidth={200} pl={1}>
                                        {(fields.filter((_f) => _f.fieldName === _row).length) &&
                                            fields.filter((_f) => _f.fieldName === _row)[0].type === "dropDown" ||
                                            fields.filter((_f) => _f.fieldName === _row)[0].type === "vlookupDropdown" ?
                                            <Select
                                                id="demo-simple-select-outlined"
                                                fullWidth
                                                variant="outlined"
                                                margin="dense"
                                                value={data[_row]}
                                                onChange={(event) => onChangeValue(index, _row, event.target.value)}
                                            >
                                                {fields.filter((_f) => _f.fieldName === _row)[0].option &&
                                                    fields.filter((_f) => _f.fieldName === _row)[0].option.map((_option) => {
                                                        return (<MenuItem key={_option.optionLabel} value={_option.optionLabel}>
                                                            {_option.optionLabel}
                                                        </MenuItem>
                                                        );
                                                    })
                                                }
                                            </Select>
                                            :
                                            <TextField
                                                id="standard-basic"
                                                variant="outlined"
                                                margin="dense"
                                                fullWidth
                                                style={{ margin: 0 }}
                                                value={data[_row]}
                                                onChange={(event) => onChangeValue(index, _row, event.target.value)}
                                            />
                                        }
                                    </Box>))}
                            </Box>
                        </Box>
                    ))} */}
                </Box>
            </Box>
            {!values["isVlookup"] &&
                <FormControlLabel
                    control={
                        <Checkbox
                            name="isvlookupReverse"
                            checked={values["isvlookupReverse"]}
                            onChange={(e) => setFieldValue("isvlookupReverse", e.target.checked)}
                            color="primary"
                        />
                    }
                    label="Vlookup Reverse"
                />}
        </Box>
    );
}