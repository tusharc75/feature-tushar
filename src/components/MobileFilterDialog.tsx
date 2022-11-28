import * as React from 'react';
import './MobileFilterDialog.scss';
import TextField from '@material-ui/core/TextField';
import { Delete } from '@material-ui/icons';
import { MdClose } from 'react-icons/all';
import { Autocomplete } from '@material-ui/lab';
import { Button, IconButton, Dialog, DialogContent, Slide } from '@material-ui/core';
import { v4 as uuidv4 } from 'uuid';
import { makeStyles } from '@material-ui/core/styles';
import { TransitionProps } from '@material-ui/core/transitions';
import { CustomToastContext } from '../StateProvider/CustomToastContext/CustomToastContext';
import { isObjectEmpty } from "../constants/helpers";
import { Box } from "@material-ui/core";
import Card from '@material-ui/core/Card';

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function MobileFilterDialog({ isOpen, handleClose, contentPart, columns, dispatch, filters, title }) {

  const toastConfig = React.useContext(CustomToastContext);
  const [inputFields, setInputFields] = React.useState(null);

  React.useEffect(() => {
    if (!isObjectEmpty(filters)) {
      const data = [];
      Object.keys(filters).forEach((field) => {
        data.push({
          id: uuidv4(),
          fieldName: field,
          fieldValue: filters[field].filter,
        });
      });
      setInputFields(data)
    }
    else {
      setInputFields([])
    }
  }, [filters, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    var result = {};
    inputFields?.forEach((v) => {
      if (v.fieldValue && v.fieldValue !== "") {
        result[v.fieldName] = { filter: v.fieldValue };
      }
    })
    dispatch({ type: 'filter', filters: result });
    toastConfig.setToastConfig({
      open: true,
      type: 'success',
      message: 'Filtered Successfully'
    });
    handleClose();
    setInputFields([]);
  };

  const handleChangeInput = (id, event) => {
    const newInputFields = inputFields?.map((i) => {
      if (id === i.id) {
        i["fieldValue"] = event.target.value;
      }
      return i;
    });
    setInputFields(newInputFields);
  };

  const handleChangeAutocomplete = (id, value) => {
    const newInputFields = inputFields?.map((i) => {
      if (id === i.id) {
        i.fieldName = value?.field;
      }
      return i;
    });
    setInputFields(newInputFields);
  };

  const handleAddFields = () => {
    setInputFields([...inputFields, { id: uuidv4(), fieldName: '', fieldValue: '' }]);
  };

  const handleRemoveFields = (id) => {
    const values = [...inputFields];
    values.splice(
      values.findIndex((value) => value.id === id),
      1
    );
    setInputFields(values);
  };

  return (<Dialog
    open={isOpen}
    TransitionComponent={Transition}
    keepMounted
    onClose={handleClose}
    aria-describedby="alert-dialog-slide-description"
    className="mobile-filter-root"
  >
    <DialogContent className="mobile-filter-content">
      <div className='d-flex justify-content-space-between align-items-center pb-3'>
        <h3 className=" sub-filter-heading">{title ? `Filter ${title}` : `Filter`}</h3>
        <MdClose size={20} style={{ color: "rgb(244, 67, 54)" }} onClick={handleClose} />
      </div>
      {contentPart}
      <form onSubmit={handleSubmit}>
        {inputFields?.map((field) => (
          <Box mt={1} key={field.id}>
            <Card variant="outlined" >
              <Box p={1}>
                <Box display="flex">
                  <Box flexGrow={1}>
                    <Autocomplete
                      id={`fieldName_${field.id}`}
                      options={columns}
                      autoHighlight
                      getOptionLabel={(option: any) => option?.headerName}
                      renderOption={(option) => option?.headerName}
                      onChange={(event, value) => {
                        if (value !== null) {
                          handleChangeAutocomplete(field.id, value);
                        } else {
                          handleChangeAutocomplete(field.id, '');
                        }
                      }}
                      value={columns?.find(v => v.field === field?.fieldName) || {}}
                      renderInput={(params) => <TextField
                        {...params}
                        name={`fieldName_${field.id}`}
                        label="Select Field"
                        margin='dense'
                        variant="outlined"
                      />}
                    />
                  </Box>
                  <Box ml={1}>
                    <IconButton aria-label="delete" onClick={() => handleRemoveFields(field.id)}>
                      <Delete color="error" />
                    </IconButton>
                  </Box>
                </Box>
                <TextField
                  name={`fieldValue_${field.id}`}
                  label="Filter Text"
                  variant="outlined"
                  margin='dense'
                  fullWidth
                  value={field.fieldValue}
                  onChange={(event) => handleChangeInput(field.id, event)}
                />
              </Box>
            </Card>
          </Box>
        ))}
        <Box display="flex" mt={2} justifyContent="center">
          <Button
            variant="text"
            color="primary"
            size="small"
            className="mobile_button"
            onClick={handleAddFields}
          >
            Add Filter
          </Button>
        </Box>
        <Box display="flex" mt={2} justifyContent="center">
          <Button
            type="submit"
            color="primary"
            size="large"
            className="mobile_button"
            variant="text"
            onClick={handleSubmit}>
            Submit
          </Button>
        </Box>
      </form>
    </DialogContent>
  </Dialog>
  );
}
