import { useState, useCallback, useRef, useEffect } from "react";
import Typography from "@material-ui/core/Typography";
import TextField from "@material-ui/core/TextField";
import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import AddCircleOutlineIcon from "@material-ui/icons/AddCircleOutline";
import RemoveCircleOutlineIcon from "@material-ui/icons/RemoveCircleOutline";
import Autocomplete from "@material-ui/lab/Autocomplete";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import { read, utils, writeFile } from "xlsx";
import { useDrag, useDrop, DropTargetMonitor } from "react-dnd";
import { XYCoord } from "dnd-core";
import update from "immutability-helper";
import { DragIndicator } from "@material-ui/icons";
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

export const Option = ({ values, setFieldValue, fields, _id }) => {

  const [options, setOptions] = useState(values.option || [{"optionLabel":"Option 1","optionValue":"Option 1"}]);

  const onChangeValue = (index, field, value) => {
    let data = [...values["option"]];
    if (field === "optionLabel") {
      data[index].optionLabel = value;
      data[index].optionValue = value;
    } else {
      data[index][field] = value;
    }
    setFieldValue("option", data);
    setOptions(data);
  };

  const AddRemoveValue = (type, index) => {
    let data = [...values["option"]];
    if (type === "add") {
      data.splice(index + 1, 0, {
        optionLabel: "Option " + (data.length + 1),
        optionValue: "Option " + (data.length + 1),
      });
    } else {
      if (data.length !== 1) {
        data.splice(index, 1);
      }
    }
    setFieldValue("option", data);
    setOptions(data);
  };

  const handleImportExcel = (e) => {
    e.preventDefault();
    var files = e.target.files,
      f = files[0];
    var reader = new FileReader();
    reader.onload = function (e) {
      var data = e.target.result;
      let readedData = read(data, { type: "binary" });
      const wsname = readedData.SheetNames[0];
      const ws = readedData.Sheets[wsname];
      const dataParse = utils.sheet_to_json(ws, { header: 1 });
      if (dataParse.length > 1) {
        dataParse.splice(0, 1);
        let option = [];
        dataParse.forEach((row) => {
          let rowInsert = {};
          rowInsert["optionLabel"] = row[0] ? row[0].toString() : "";
          rowInsert["optionValue"] = row[0] ? row[0].toString() : "";
          if (
            values["isDependentDropdown"] &&
            values["dropdowDependentOn"] !== ""
          ) {
            rowInsert[values["dropdowDependentOn"]] = row[1]
              ? row[1].toString()
              : "";
          }
          option.push(rowInsert);
        });
        setFieldValue("option", option);
        setOptions(option);
      }
    };
    reader.readAsBinaryString(f);
  };

  const handleExportExcel = () => {
    var export_json = [...values["option"]];
    let json_data = [];
    export_json.forEach((_d) => {
      let ele: any = {};
      ele.option = _d.optionLabel;
      if (
        values["isDependentDropdown"] &&
        values["dropdowDependentOn"] !== ""
      ) {
        ele[values["dropdowDependentOn"]] = _d[values["dropdowDependentOn"]];
      }
      json_data.push(ele);
    });
    var ws = utils.json_to_sheet(json_data);
    var wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Sheet1");
    writeFile(wb, "dropdown options.xlsx");
  };

  const moveCard = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const dragCard = options[dragIndex];
      setOptions(
        update(options, {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, dragCard],
          ],
        })
      );
    },

    [options]
  );

  useEffect(() => {
    setFieldValue("option", options);
  }, [options]);

  return (<DndProvider backend={HTML5Backend}>
    <Box pt={2} pb={2}>
      {values["type"] === "dropDown" && (
        <Grid spacing={3} container>
          <Grid item xs={12} sm={6} md={6}>
            <FormControlLabel
              control={
                <Checkbox
                  name="isDependentDropdown"
                  checked={values["isDependentDropdown"]}
                  onChange={(e) =>
                    setFieldValue("isDependentDropdown", e.target.checked)
                  }
                  color="primary"
                />
              }
              label="Dependent Dropdown"
            />
          </Grid>
          {values["isDependentDropdown"] && (
            <Grid item xs={12} sm={6} md={6}>
              <Autocomplete
                id="tags-filled"
                options={
                  fields &&
                  fields.filter(
                    (_f) => _f._id !== _id && _f.type === "dropDown" && !_f.lookup
                  )
                }
                getOptionLabel={(option: any) =>
                  option ? option.fieldLabel : ""
                }
                getOptionSelected={(option: any, val) =>
                  option.fieldName === val
                }
                value={
                  fields &&
                    fields.filter(
                      (data) => data.fieldName === values["dropdowDependentOn"]
                    ).length
                    ? fields &&
                    fields.filter(
                      (data) =>
                        data.fieldName === values["dropdowDependentOn"]
                    )[0]
                    : ""
                }
                onChange={(e, val) => {
                  setFieldValue(
                    "dropdowDependentOn",
                    val && val.fieldName ? val.fieldName : ""
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    margin="dense"
                    variant="outlined"
                    label="Dropdow Dependent On"
                    placeholder="Dropdow Dependent On"
                  />
                )}
              />
            </Grid>
          )}
        </Grid>
      )}
      <Grid spacing={3} container>
        <Grid item xs={12} sm={6} md={6}>
          <Typography variant="body2">Options</Typography>
        </Grid>
        <Grid item xs={12} sm={6} md={6} container justify="flex-end">
          <label
            htmlFor="optionimportFromExcel"
            className={`cursor-pointer mr-3`}
          >
            Import from Excel
          </label>
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
          <label className={`cursor-pointer`} onClick={handleExportExcel}>
            Export to Excel
          </label>
        </Grid>
      </Grid>
      <Box
        border={1}
        mt={1}
        p={1}
        bgcolor="grey.100"
        borderColor="grey.300"
        maxHeight={300}
        style={{ overflow: "auto" }}
      >
        {options.length > 0 &&
          options.map((data, index) => (
            <Card
              key={index}
              index={index}
              id={index}
              data={data}
              moveCard={moveCard}
              onChangeValue={onChangeValue}
              values={values}
              AddRemoveValue={AddRemoveValue}
              fields={fields}
            />
          ))}
      </Box>
      {values["type"] === "dropDown" && !values["lookup"] && (
        <Box mt={1}>
          <Autocomplete
            id="tags-filled"
            options={values["option"] && values["option"]}
            getOptionLabel={(option: any) => (option ? option.optionLabel : "")}
            getOptionSelected={(option: any, val) => option.optionValue === val}
            value={
              values["option"] &&
                values["option"].filter(
                  (data) => data.optionValue === values["defaultDropdownOption"]
                ).length
                ? values["option"] &&
                values["option"].filter(
                  (data) =>
                    data.optionValue === values["defaultDropdownOption"]
                )[0]
                : ""
            }
            onChange={(e, val) => {
              setFieldValue(
                "defaultDropdownOption",
                val && val.optionValue ? val.optionValue : ""
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                margin="dense"
                variant="outlined"
                label="Default Option"
                placeholder="Default Option"
              />
            )}
          />
        </Box>
      )}
    </Box>
  </DndProvider>
  );
};

interface DragItem {
  index: number;
  id: string;
  type: string;
}

const Card = (props) => {
  const { index, id, data, moveCard, onChangeValue, values, AddRemoveValue, fields } = props;

  const ref = useRef<HTMLDivElement>(null);
  const [{ handlerId }, drop] = useDrop({
    accept: "card",
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: DragItem, monitor: DropTargetMonitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      moveCard(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: "card",
    item: () => {
      return { id, index };
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const opacity = isDragging ? 0.4 : 1;

  drag(drop(ref));
  return (
    <div ref={ref} style={{ opacity }} data-handler-id={handlerId}>
      <Box bgcolor="white" border={1} mb={1} p={1} borderColor="grey.300">
        <Grid container spacing={1}>
          <Grid item xs={1}>
            <IconButton>
              <DragIndicator />
            </IconButton>
          </Grid>
          <Grid item xs={5}>
            <TextField
              id="standard-basic"
              variant="outlined"
              margin="dense"
              fullWidth
              style={{ margin: 0 }}
              value={data.optionLabel}
              onChange={(e) =>
                onChangeValue(index, "optionLabel", e.target.value)
              }
            />
          </Grid>
          {values["isDependentDropdown"] &&
            values["dropdowDependentOn"] !== "" && (
              <Grid item xs={4}>
                <Select
                  id="demo-simple-select-outlined"
                  fullWidth
                  variant="outlined"
                  margin="dense"
                  value={data[values["dropdowDependentOn"]]}
                  onChange={(e) =>
                    onChangeValue(
                      index,
                      values["dropdowDependentOn"],
                      e.target.value
                    )
                  }
                >
                  {(values["dropdowDependentOn"] && fields.filter((_f) => _f.fieldName === values["dropdowDependentOn"]).length) &&
                    fields.filter((_f) => _f.fieldName === values["dropdowDependentOn"])[0].option &&
                    fields.filter((_f) => _f.fieldName === values["dropdowDependentOn"])[0].option.map((_option) => {
                      return (<MenuItem key={_option.optionLabel} value={_option.optionLabel}>
                        {_option.optionLabel}
                      </MenuItem>
                      );
                    })
                  }
                </Select>
                {/* <TextField
                  id="standard-basic"
                  variant="outlined"
                  margin="dense"
                  fullWidth
                  style={{ margin: 0 }}
                  value={data[values["dropdowDependentOn"]]}
                  onChange={(e) =>
                    onChangeValue(
                      index,
                      values["dropdowDependentOn"],
                      e.target.value
                    )
                  }
                /> */}
              </Grid>
            )}
          <Grid item xs={2}>
            <IconButton
              aria-label="setting"
              onClick={() => AddRemoveValue("add", index)}
            >
              <AddCircleOutlineIcon fontSize="small" />
            </IconButton>
            <IconButton
              aria-label="setting"
              onClick={() => AddRemoveValue("remove", index)}
            >
              <RemoveCircleOutlineIcon fontSize="small" />
            </IconButton>
          </Grid>
        </Grid>
      </Box>
    </div>
  );
};
