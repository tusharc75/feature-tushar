import React, { useCallback, useContext, useEffect, useState } from "react";
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
import { Autocomplete } from "@material-ui/lab";
import { Formik, Form, Field, FieldArray } from 'formik';
import { Add, Delete } from "@material-ui/icons";
import NumberFormat from "react-number-format";
import CustomDialogHeader from "../../../components/CustomDialog/CustomDialogHeader";
import axiosInstance from "../../../axios/axiosInstance";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import { removeEmptyKeys } from "../../../constants/helpers";

const DoaDialog = ({ userSelected, user, open, setOpen, updatedUser }) => {

    const useStyles = makeStyles((theme) => ({
        btnPadding: {
            padding: theme.spacing(0, 2)
        },
        addIcon: {
            width: 18,
            height: 20,
            color: "#09445A",
            cursor: "pointer"
        },

        deleteIcon: {
            width: 18,
            height: 20,
            color: "#91A2A9",
            cursor: "pointer"
        }
    }));
    const toastConfig = useContext(CustomToastContext);
    const classes = useStyles();
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([{ id: user[0].id, name: user[0].name, amount: 0 }]);
    const fetchDoa = useCallback(() => {
        setLoading(true);
        setUsers(([{ id: user[0].id, name: user[0].name, amount: 0 }]))
        axiosInstance()
            .get(`/doa/${userSelected.id}`)
            .then(({ data: { data, count } }) => {

                setUsers(data?.doa?.map(item => {
                    return {
                        id: item.user?._id,
                        name: `${item.user.firstName} ${item.user.lastName}`,
                        amount: item.amount
                    };
                })
                );
                setLoading(false);
            })
            .catch((err) => {
                setLoading(false);
            });
    }, [open]);

    useEffect(() => {
        fetchDoa();
    }, [fetchDoa]);

    const handleSubmit = async (values) => {
        const doaArray = values.map(item => {
            if (item.amount != 0 && item.name != '')
                return {
                    user: item.id,
                    amount: Number(item.amount)
                };
        });
        const userDoa = { _id: userSelected.id, doa: doaArray };
        setLoading(true)
        axiosInstance().put('/doa/setup', removeEmptyKeys(userDoa))
            .then(({ data }) => {
                toastConfig.setToastConfig({ open: true, type: "success", message: data.message });
                setLoading(false)
                setOpen(false)
            }).catch((error) => {
                toastConfig.setToastConfig(error);
                setLoading(false);
            });

    }


    return (
        <Dialog
            open={open}
            onClose={setOpen}
            scroll="body"
        >
            {!loading &&
                <>
                    <CustomDialogHeader title="Add Doa" />
                    <Formik
                        initialValues={{ users: users }}
                        onSubmit={() => { }}
                        render={({ values }) => (
                            <>
                                <DialogContent>
                                    <Form>
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
                                                                                <Grid item md={1}>{index + 1}</Grid>
                                                                                <Grid item md={5}>

                                                                                    <Autocomplete
                                                                                        id="combo-box-demo"
                                                                                        value={user.find(v => v.name == userVal.name)}
                                                                                        options={user.filter(element => !values.users.map(e=>e.name).includes(element.name))}
                                                                                        getOptionLabel={(option: any) => option.name}
                                                                                        style={{ width: 200 }}
                                                                                        onChange={(event, newValue) => {
                                                                                            arrayHelpers.replace(index, {
                                                                                                ...values.users[index],
                                                                                                ["name"]: newValue.name,
                                                                                                ["id"]: newValue.id,
                                                                                            });
                                                                                        }}
                                                                                        
                                                                                        renderInput={(params) => <TextField {...params} variant="outlined" 
                                                                                        />}
                                                                                    />
                                                                                    {/* <Field
                                                                                        fullWidth
                                                                                        variant="outlined"
                                                                                        component={TextField}
                                                                                        type="text"
                                                                                        select
                                                                                        name="name"
                                                                                        defaultValue={userVal.name}
                                                                                        onChange={(e) => {

                                                                                            arrayHelpers.replace(index, {
                                                                                                ...values.users[index],
                                                                                                ["name"]: e.target.value,
                                                                                                ["id"]: user.find(d => d.name == (e.target.value))?.id,
                                                                                            });

                                                                                        }
                                                                                        }
                                                                                    >
                                                                                        {user
                                                                                            // ? user.filter(element => !values.users.map(e=>e.name).includes(element.name)).map((option, i) => (
                                                                                            ? user.map((option, i) => (
                                                                                                !values.users.map(e=>e.name).includes(option.name)?(
                                                                                                <MenuItem
                                                                                                    key={i}
                                                                                                    placeholder="Select Users"
                                                                                                    value={option.name}
                                                                                                    selected={userVal.selected}
                                                                                                >
                                                                                                    {option.name}
                                                                                                </MenuItem>
                                                                                                ):null
                                                                                            ))
                                                                                            : null}
                                                                                    </Field> */}
                                                                                </Grid>
                                                                                <Grid item md={4}>
                                                                                    <Field
                                                                                        fullWidth
                                                                                        variant="outlined"
                                                                                        type="text"
                                                                                        component={TextField}
                                                                                        name="amount"
                                                                                        placeholder="Enter Amount"
                                                                                        value={userVal.amount}
                                                                                        onChange={(e) => arrayHelpers.replace(index, {
                                                                                            ...values.users[index],
                                                                                            ["amount"]: e.target.value.replace(/[^0-9]/g, '')
                                                                                        })}

                                                                                    />
                                                                                </Grid>
                                                                                <span><Add className={classes.addIcon} onClick={() => arrayHelpers.push({ "id": "", "name": "", "amount": 0 })} /></span>
                                                                                <span><Delete className={classes.deleteIcon} onClick={() => arrayHelpers.remove(index)} /></span>
                                                                            </Grid>
                                                                        ))
                                                                    ) : (
                                                                        <Grid item md={2}>
                                                                            <div>
                                                                                <span><Add className={classes.addIcon} /></span>
                                                                                <span><Delete className={classes.deleteIcon} /></span>
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
                                    </Form>

                                </DialogContent>

                                <DialogActions>
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
                                            onClick={() => {
                                                handleSubmit(values.users)
                                            }}
                                        >
                                            Save
                                </Button>
                                    </Grid>
                                </DialogActions>
                            </>
                        )}
                    />

                </>
            }
        </Dialog>
    )
}

export { DoaDialog as default };