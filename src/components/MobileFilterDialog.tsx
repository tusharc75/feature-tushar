import * as React from 'react';
import './MobileFilterDialog.scss';
import TextField from '@material-ui/core/TextField';
import { Add, Delete } from '@material-ui/icons';
import {
  MdAdd
} from 'react-icons/all';
import { Autocomplete } from '@material-ui/lab';
import {
  Grid,
  Button,
  ButtonGroup,
  IconButton,
  Dialog,
  DialogContent,
  Slide
} from '@material-ui/core';
import { TransitionProps } from '@material-ui/core/transitions';
import { Formik, Form, FieldArray } from 'formik';
import { CustomToastContext } from "../StateProvider/CustomToastContext/CustomToastContext"

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function MobileFilterDialog({ isOpen, handleClose, contentPart, secHeading, columns, dispatch }) {
  const [showFilter, setShowFilter] = React.useState(false);
  const [open, setOpen] = React.useState(isOpen);
  const [close, setClose] = React.useState(handleClose)
  const toastConfig = React.useContext(CustomToastContext)


  const handleAddFilter = () => {
    if (!showFilter) {
      setShowFilter(true);
    } else {
      setShowFilter(false);
    }
  };


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
            initialValues={{ filters: [""], fields: [''] }}
            enableReinitialize={true}

            onSubmit={(values) => {

              const { fields, filters } = values
              let newFields = fields.splice(1);
              let savedFilters = Object.assign.apply({}, newFields.map((field, index) => (
                { [field]: { filterType: 'text', type: 'contains', filter: filters[index] } }
              )))


              setTimeout(() => {
                dispatch({ type: 'filter', filters: savedFilters });

              }, 500)

              setClose(true)

              toastConfig.setToastConfig({
                open: true,
                type: "success",
                message: 'Filtered Successfully',
              });

              handleClose();
            }


            }
            render={({ values, }) => (
              <Form>
                <FieldArray
                  name="filters"
                  render={(arrayHelpers) => (
                    <div className="form-secion" style={{ marginTop: "35px" }}>
                      {values.filters && values.filters.length > 0 ? (
                        values.filters.map((filter, index) => (
                          <div key={index} style={{ marginTop: "30px" }}>

                            <Grid container spacing={2}>

                              <Grid item xs={8} md={8}>
                                {/* <InputLabel id="demo-simple-select-label" style={{marginBottom:"10px"}}>Filter Field</InputLabel>      */}
                                <Autocomplete
                                  id="country-select-demo"
                                  style={{ height: "30px", marginBottom: "20px" }}
                                  options={columns}
                                  autoHighlight
                                  getOptionLabel={(option: any) => (option?.headerName ? option?.headerName : '')}
                                  renderOption={(option) => (

                                    <React.Fragment>{option?.headerName}</React.Fragment>

                                  )}
                                  onChange={(event, newValue) => {

                                    let field = newValue?.field
                                    values?.fields?.push(field)



                                    //  arrayHelpers.replace(index,{
                                    //    ...values.fields[index] as {},field
                                    //  })
                                  }}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      label="Choose a Field"
                                      variant="outlined"
                                      name="FilterField"


                                    />
                                  )}
                                />




                                <TextField
                                  style={{ height: "30px" }}
                                  variant="outlined"
                                  name="FilterField"
                                  label="Filter Text"
                                  onChange={(e) => {

                                    let filterText = e.target.value
                                    arrayHelpers.replace(index, filterText)


                                    // arrayHelpers.replace(index,{
                                    //   ...values.filters[index] as {},filterText
                                    // })
                                  }
                                  }

                                />
                              </Grid>
                              <Grid item xs={2} md={4}>

                                <ButtonGroup size="small" aria-label="small outlined button group" style={{ marginTop: "40px" }}>
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
                              </Grid>
                            </Grid>





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
                  )}
                />
              </Form>
            )}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
