import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Box,
  Button,
  TextField,
  Grid,
  MenuItem,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
} from "@material-ui/core";
import { Formik, Form, Field, FieldArray } from 'formik';
import { Add, Delete } from "@material-ui/icons";

const DoaDialog = ({userSelected, user, open, setOpen, updatedUser}) => {

    const useStyles = makeStyles((theme) => ({
        backgroundBlue: {
            background: "#EEF9FD"
        },
        btnPadding: {
            padding: theme.spacing(0, 2)
        },
        addIcon: {
          width: 18,
          height: 20,
          color:  "#09445A",
          cursor:"pointer"
        },
      
        deleteIcon: {
          width: 18,
          height: 20,
          color:  "#91A2A9",
          cursor:"pointer"
        }
      }));

    const classes = useStyles(),
    users = userSelected.length > 0 ? userSelected: [{id: user[0].id, name: user[0].name, limit: 0}];

    return (
    <Dialog
        open={open}
        onClose={setOpen}
        scroll="body"
    >
        <Formik
            initialValues={{ users: users }}
            onSubmit={values =>
            setTimeout(() => {
                updatedUser(JSON.parse(JSON.stringify(values)));
                setOpen(false)
            }, 500)
            }
            render={({ values }) => (
            <Form>
                <DialogTitle className={classes.backgroundBlue}>Add Doa</DialogTitle>
                <DialogContent>
                    <Container>
                        <Grid
                            container
                            direction="row"
                            justify="space-evenly"
                            alignItems="center"
                        >
                            <Grid item md={12}>
                                <Box>
                                    <Grid
                                        container
                                        spacing={2}
                                        direction="row"
                                        justify="flex-start"
                                        alignItems="center"
                                    >
                                        <Grid item md={1}> Sr </Grid>
                                        <Grid item md={5}> Users </Grid>
                                        <Grid item md={4}> Amount </Grid>
                                        <Grid item md={2}></Grid>
                                    </Grid>
                                </Box>
                                <Box>
                                    <FieldArray
                                        name="users"
                                        render={arrayHelpers => (
                                            <div>
                                            {values.users && values.users.length > 0 ? (
                                                values.users.map((userVal, index) => (
                                                <Grid
                                                    container
                                                    spacing={2}
                                                    direction="row"
                                                    justify="flex-start"
                                                    alignItems="center"
                                                    key={index}
                                                >
                                                <Grid item md={1}>{index+ 1}</Grid> 
                                                <Grid item md={5}>
                                                    <Field
                                                        fullWidth
                                                        variant="outlined"
                                                        component={TextField}
                                                        type="text"
                                                        select
                                                        name="name"
                                                        defaultValue={userVal.name}
                                                        onChange={(e) => arrayHelpers.replace(index, {
                                                            ...values.users[index],
                                                            ["name"]: e.target.value
                                                        })}
                                                    >
                                                    {user
                                                    ? user.map((option, i) => (
                                                        <MenuItem
                                                            key={i}
                                                            placeholder="Select Users"
                                                            value={option.name}
                                                            selected={userVal.selected}
                                                        >
                                                            {option.name}
                                                        </MenuItem>
                                                        ))
                                                    : null}
                                                    </Field>
                                                </Grid>
                                                <Grid item md={4}>
                                                    <Field
                                                        fullWidth
                                                        variant="outlined"
                                                        type="text"
                                                        component={TextField}
                                                        name="limit"
                                                        placeholder="Enter Amount"
                                                        value={userVal.limit}
                                                        onChange={(e) => arrayHelpers.replace(index, {
                                                            ...values.users[index],
                                                            ["limit"]: e.target.value
                                                        })}
                                                    />
                                                </Grid>
                                                    <span><Add className={classes.addIcon} onClick={() => arrayHelpers.push({"name": "", "limit": 0})}/></span>
                                                    <span><Delete className={classes.deleteIcon} onClick={() => arrayHelpers.remove(index)}/></span>
                                                </Grid>
                                                ))
                                            ) : (
                                                <Grid item md={2}>
                                                <div>
                                                    <span><Add className={classes.addIcon}/></span>
                                                    <span><Delete className={classes.deleteIcon}/></span>
                                                </div>
                                                </Grid>
                                            )}
                                        </div>
                                        )}
                                    />
                                </Box>
                            </Grid>
                        </Grid>
                    </Container>
                </DialogContent>
                <DialogActions
                    className={classes.backgroundBlue}
                >
                    <Grid
                        container
                        direction="row"
                        justify="space-between"
                        alignItems="flex-start"
                        className={classes.btnPadding}
                    >
                        <Button
                            onClick={() => setOpen(false)}
                            variant="contained"
                        >
                            Close
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            type="submit"
                        >
                            Save
                        </Button>
                    </Grid>
                </DialogActions>
            </Form>
            )}
        />
    </Dialog>
)}

export {DoaDialog as default};