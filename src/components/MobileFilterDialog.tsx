import * as React from 'react';
import './MobileFilterDialog.scss';
import { AddOutlined } from '@material-ui/icons';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import TextField from '@material-ui/core/TextField';
import { Add, Delete } from '@material-ui/icons';
import {
  FaUserTie,
  IoFilterCircle,
  MdAccountBalanceWallet,
  MdAdd,
  MdFilterList,
  MdSort,
  FaCalendarDay,
  RiTicketFill,
  RiArrowUpDownFill,
  RiArrowUpDownLine,
  BsArrowUpShort,
  BsArrowUp,
  BsArrowDown
} from 'react-icons/all';
import {
  Box,
  Grid,
  Button,
  ButtonGroup,
  IconButton,
  styled,
  alpha,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Slide,
  createStyles,
  makeStyles,
  Theme,
  Transitions
} from '@material-ui/core';
import { TransitionProps } from '@material-ui/core/transitions';
import { Formik, Form, Field, FieldArray } from 'formik';

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function MobileFilterDialog({ isOpen, handleClose, contentPart, secHeading, columns,dispatch }) {
  const [showFilter, setShowFilter] = React.useState(false);

  const handleAddFilter = () => {
    if (!showFilter) {
      setShowFilter(true);
    } else {
      setShowFilter(false);
    }
  };

  React.useEffect(()=>{
    if(columns){
     
      sessionStorage.setItem('columns', JSON.stringify(columns))
    }
  },[columns])

  

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

          <Formik
            initialValues={{ filters:[""],fields:[""]}}
            onSubmit={(values) =>{
            
              const {fields,filters} = values
              let savedFilters = Object.assign.apply({},fields.map((field,index)=>(
                {[field]:{filterType:'text',type:'contains',filter:filters[index]}}
              )))
             
             
              setTimeout(() => {
                dispatch({ type: 'filter', filters: savedFilters });
              }, 500)
            }
              
            }
            render={({ values, }) => (
              <Form>
                <FieldArray
                  name="filters"
                  render={(arrayHelpers) => {                
                   return <div className="form-secion" style={{marginTop:"-5px"}}>
                      {values.filters && values.filters.length > 0 ? (
                        values.filters.map((filter, index) => (
                          <div key={index}>
                              <ButtonGroup size="small" aria-label="small outlined button group" style={{marginTop:"20px"}}>
                                              <IconButton
                                                size="small"
                                                aria-label="add"
                                                onClick={() => arrayHelpers.push('')} // insert an empty string at a position
                                               
                                              >
                                                <Add />
                                              </IconButton>
                                              
                                              <IconButton
                                                size="small"
                                                aria-label="delete"
                                                style={{ color: '#f44336' }}
                                                onClick={() => arrayHelpers.remove(index)} // remove a friend from the list
                                              >
                                                <Delete />
                                              </IconButton>
                                            </ButtonGroup>     
                            <FormControl fullWidth>
                            {/* <InputLabel id="demo-simple-select-label">Select Filter Field</InputLabel>         */}
                              <Field component="select" name={`fields.${index}`}>
                              <option   value=''>Select a Field</option>
                              {JSON.parse(sessionStorage.getItem('columns')) !== null && JSON.parse(sessionStorage.getItem('columns'))?.map((column, index)=>{                           
                                return <option key={index}  value={column.field}>{column.headerName}</option>
                              })}              
                             </Field>
                            <Field   name={`filters[${index}]`} id="standard-basic" label="Enter Filter Field" variant="standard" />
                            </FormControl>
                           

                        
                          </div>
                        ))
                      ) : (
                        
                        <div className="filter_add_button">
                          <Button
                            variant="text"
                            color="primary"
                            size="small"
                            className="mobile_button add"
                            onClick={() => arrayHelpers.push('')}
                            // startIcon={ <AddOutlined />}
                          >
                            <MdAdd size={25} />
                          </Button>
                        </div>
                      )}
                      <div className="submit_filter_button">
                        <Button type="submit" color="primary" size="small" className="mobile_button submit" variant="text">
                          Submit
                        </Button>
                      </div>
                    </div>
            }}
                />
              </Form>
            )}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
