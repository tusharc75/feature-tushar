import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import RemoveCircleOutlineIcon from '@material-ui/icons/RemoveCircleOutline';
import Autocomplete from '@material-ui/lab/Autocomplete';
import * as XLSX from 'xlsx';

export const Option = ({ values, setFieldValue }) => {

    const onChangeValue = (index, value) => {
        let data = [...values["option"]]
        data[index].optionLabel = value
        data[index].optionValue = value
        setFieldValue("option", data)
    };

    const AddRemoveValue = (type, index) => {
        let data = [...values["option"]]
        if (type === "add") {
            data.splice((index + 1), 0, { optionLabel: "Option " + (data.length + 1), optionValue: "Option " + (data.length + 1) });
        }
        else {
            if (data.length !== 1) {
                data.splice(index, 1);
            }
        }
        setFieldValue("option", data)
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
                let option = []
                dataParse.forEach((row) => {
                    let rowInsert = {}
                    rowInsert["optionLabel"] = row[0] ? row[0].toString() : ""
                    rowInsert["optionValue"] = row[0] ? row[0].toString() : ""
                    option.push(rowInsert)
                })
                setFieldValue("option", option)
            }
        };
        reader.readAsBinaryString(f)
    }

    const handleExportExcel = () => {
        var export_json = [...values["option"]];
        let json_data = []
        export_json.forEach((_d) => {
            json_data.push({ option: _d.optionLabel })
        })
        var ws = XLSX.utils.json_to_sheet(json_data);
        var wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        XLSX.writeFile(wb, "dropdown options.xlsx");
    }

    return (<Box pt={2} pb={2}>
        <Grid spacing={3} container>
            <Grid item xs={12} sm={6} md={6}>
                <Typography variant="body2">Options</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={6} container justify="flex-end">
                <label htmlFor="optionimportFromExcel" className={`cursor-pointer mr-3`}>Import from Excel</label>
                <input
                    onClick={(e: any) => (e.target.value = null)}
                    id="optionimportFromExcel"
                    name="optionimportFromExcel"
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
        <Box border={1} mt={1} p={1} bgcolor="grey.100" borderColor="grey.300" maxHeight={300} style={{ overflow: "auto" }}>
            {values["option"] && values["option"].map((data, index) => (
                <Box key={index} bgcolor="white" border={1} mb={1} p={1} borderColor="grey.300" >
                    <Grid container spacing={1}>
                        <Grid item xs={6}>
                            <TextField
                                id="standard-basic"
                                variant="outlined"
                                margin="dense"
                                fullWidth
                                style={{ margin: 0 }}
                                value={data.optionLabel}
                                onChange={(e) => onChangeValue(index, e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <IconButton aria-label="setting" onClick={() => AddRemoveValue("add", index)} >
                                <AddCircleOutlineIcon fontSize="small" />
                            </IconButton>
                            <IconButton aria-label="setting" onClick={() => AddRemoveValue("remove", index)} >
                                <RemoveCircleOutlineIcon fontSize="small" />
                            </IconButton>
                        </Grid>
                    </Grid>
                </Box>
            ))}
        </Box>
        {(values["type"] === "dropDown" && !values["lookup"]) &&
            <Box mt={1}>
                <Autocomplete
                    id="tags-filled"
                    options={values["option"] && values["option"]}
                    getOptionLabel={(option: any) => (option ? option.optionLabel : "")}
                    getOptionSelected={(option: any, val) => option.optionValue === val}
                    value={values["option"] && values["option"].filter((data) => data.optionValue === values["defaultDropdownOption"]).length
                        ? values["option"] && values["option"].filter((data) => data.optionValue === values["defaultDropdownOption"])[0]
                        : ""
                    }
                    onChange={(e, val) => { setFieldValue("defaultDropdownOption", val && val.optionValue ? val.optionValue : "") }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            margin="dense"
                            variant="outlined"
                            label="Default Option"
                            placeholder="Default Option" />
                    )}
                />
            </Box>
        }
    </Box>);
}