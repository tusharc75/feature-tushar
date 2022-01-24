import * as React from 'react';
import './MobileFilterDialog.scss';
import TextField from '@material-ui/core/TextField';
import { Add, Delete } from '@material-ui/icons';
import { MdAdd } from 'react-icons/all';
import { Autocomplete } from '@material-ui/lab';
import { Grid, Button, ButtonGroup, IconButton, Dialog, DialogContent, Slide } from '@material-ui/core';
import { v4 as uuidv4 } from 'uuid';
import { makeStyles } from '@material-ui/core/styles';
import { TransitionProps } from '@material-ui/core/transitions';
import { Formik, Form, FieldArray } from 'formik';
import { CustomToastContext } from '../StateProvider/CustomToastContext/CustomToastContext';
import Container from '@material-ui/core/Container';
import RemoveIcon from '@material-ui/icons/Remove';
import AddIcon from '@material-ui/icons/Add';
import Icon from '@material-ui/core/Icon';

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const useStyles = makeStyles((theme) => ({
  root: {
    '& .MuiTextField-root': {
      margin: theme.spacing(1)
    }
  },
  button: {
    margin: theme.spacing(1)
  }
}));

export default function MobileFilterDialog({ isOpen, handleClose, contentPart, secHeading, columns, dispatch }) {
  const [showFilter, setShowFilter] = React.useState(false);
  const [open, setOpen] = React.useState(isOpen);
  const [close, setClose] = React.useState(handleClose);
  const toastConfig = React.useContext(CustomToastContext);
  const classes = useStyles();
  const [inputFields, setInputFields] = React.useState([{ id: uuidv4(), firstName: '', lastName: '' }]);
  const [fieldData, setFieldData] = React.useState([null]);

  const handleAddFilter = () => {
    if (!showFilter) {
      setShowFilter(true);
    } else {
      setShowFilter(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    var result = Object.assign.apply(
      {},
      inputFields.map((v, i) => ({ [v.firstName]: { filter: v.lastName } }))
    );
    dispatch({ type: 'filter', filters: result });

    toastConfig.setToastConfig({
      open: true,
      type: 'success',
      message: 'Filtered Successfully'
    });

    handleClose();
    setInputFields([{ id: uuidv4(), firstName: '', lastName: '' }]);
    setFieldData(columns);
  };

  const handleChangeInput = (id, event) => {
    const newInputFields = inputFields.map((i) => {
      if (id === i.id) {
        i[event.target.name] = event.target.value;
      }
      return i;
    });

    setInputFields(newInputFields);
  };

  const handleChangeAutocomplete = (id, value) => {
    const newInputFields = inputFields.map((i) => {
      if (id === i.id) {
        i.firstName = value?.field;
      }
      return i;
    });
    let inputedValue = newInputFields.map((i,index)=>{return i.firstName});
  
    if(inputedValue?.length === 1){
      let newColumns = columns.filter((item)=> item.field !== inputedValue[0])
      setFieldData(newColumns)
  }
  if(inputedValue?.length === 0){
  setFieldData(columns)
}
    if(inputedValue?.length > 1){
      let newColumns = []
      for(let i = 0; i < inputedValue.length; i++){
        newColumns = (i === 0 ? columns : newColumns).filter((item)=> item.field !== inputedValue[i])
        setFieldData(newColumns)
      }
     
       
  }
    setInputFields(newInputFields);
  };

  const handleAddFields = () => {
    setInputFields([...inputFields, { id: uuidv4(), firstName: '', lastName: '' }]);
  };

  const handleRemoveFields = (id) => {
    const values = [...inputFields];
    values.splice(
      values.findIndex((value) => value.id === id),
      1
    );
    setInputFields(values);
      let newValues = values.map((i,id)=>{return i.firstName});
      
      if(newValues?.length === 1){
          let newColumns = columns.filter((item)=> item.field !== newValues[0])
    setFieldData(newColumns)
      }
      if(newValues?.length === 0){
      setFieldData(columns)
    }
    if(newValues?.length > 1){
      let newColumns = []
      for(let i = 0; i < newValues.length; i++){
        newColumns = (i === 0 ? columns : newColumns).filter((item)=> item.field !== newValues[i])
        setFieldData(newColumns)
      }
     
       
  }

  };

  React.useEffect(() => {
    if (columns) {
      setFieldData(columns);
    }
  }, [columns]);

  return (
    <div>
      <Dialog
        open={isOpen}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleClose}
        aria-describedby="alert-dialog-slide-description"
        className="mobile-filter-root"
      >
        <DialogContent className="mobile-filter-content">
          <h3 className="pb-3 sub-filter-heading">{secHeading}</h3>
          {contentPart}
          {inputFields?.length > 0 ? (
            <form className={classes.root} onSubmit={handleSubmit}>
              {inputFields.map((inputField) => (
                <div key={inputField.id}>
                  <Grid container spacing={2}>
                    <Grid item xs={8}>
                      <Autocomplete
                        id="country-select-demo"
                        style={{ marginTop: '20px' }}
                        options={fieldData}
                     
                        autoHighlight
                        getOptionLabel={(option: any) => (option?.headerName ? option?.headerName : '')}
                        renderOption={(option) => <React.Fragment>{option?.headerName}</React.Fragment>}
                     
                        onChange={(event, value) => {
                          
                        
                          if(value !== null){
                         
                            handleChangeAutocomplete(inputField.id, value);
                            let newCloumn = fieldData?.filter((item) => item.field !== value?.field);
                            setFieldData(newCloumn);
                          }else{
                            handleChangeAutocomplete(inputField.id, '');
                          }
                         
                        }}
                        renderInput={(params) => <TextField {...params} name="" label="Choose a Field" variant="filled"  />}
                      />

                   
                      <TextField
                        name="lastName"
                        label="Filter Text"
                        variant="filled"
                        value={inputField.lastName}
                        onChange={(event) => handleChangeInput(inputField.id, event)}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <div style={{ marginTop: '50px' }}>
                        <IconButton aria-label="delete" style={{ color:'#f44336' }} onClick={() => handleRemoveFields(inputField.id)}>
                          <Delete />
                        </IconButton>
                        <IconButton onClick={handleAddFields}>
                          <Add />
                        </IconButton>
                      </div>
                    </Grid>
                  </Grid>
                </div>
              ))}
              <div className="submit_filter_button">
                <Button type="submit" color="primary" size="large" className="mobile_button submit" variant="text" onClick={handleSubmit}>
                  Submit
                </Button>
              </div>
            </form>
          ) : (
            <div className="filter_add_button">
              <Button
                variant="text"
                color="primary"
                size="small"
                className="mobile_button add"
                onClick={handleAddFields}            
              >
                <MdAdd size={25} />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
