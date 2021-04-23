import { useCallback, useContext, useEffect, useState } from "react";
import {
    Box,
    Button,
    TextField,
    Grid,
    Container,
    Dialog,
    DialogContent,
    IconButton,
    ButtonGroup
} from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import { Formik, Form, Field, FieldArray } from 'formik';
import { Add, Delete } from "@material-ui/icons";
import CustomDialogHeader from "../../../components/CustomDialog/CustomDialogHeader";
import axiosInstance from "../../../axios/axiosInstance";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import { removeEmptyKeys } from "../../../constants/helpers";
import CustomDialogFooter from "../../../components/CustomDialog/CustomDialogFooter";

const DoaDialog = ({ userSelected, onSuccess, userList, doa, open, onClose }) => {
    const toastConfig = useContext(CustomToastContext);
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const fetchDoa = useCallback(() => {
        doa.length > 0 ?
            setUsers(doa) :
            setUsers(([{ id: userList[0].id, name: userList[0].name, currency: "USD", amount: 0 }]))
    }, [open]);

    useEffect(() => {
        fetchDoa();
    }, [fetchDoa]);

    const handleSubmit = async (values) => {
        values.sort((a, b) => a.amount - b.amount)
        const doaArray = values.map(item => {
            if (item.amount != 0 && item.name != '')
                return {
                    user: item.id,
                    amount: Number(item.amount)
                };
        });
        const userDoa = { _id: userSelected, doa: doaArray };
        setLoading(true)
        axiosInstance().put('/doa/setup', removeEmptyKeys(userDoa))
            .then(({ data }) => {
                toastConfig.setToastConfig({ open: true, type: "success", message: data.message });
                setLoading(false)
                onSuccess()
            }).catch((error) => {
                toastConfig.setToastConfig(error);
                setLoading(false);
            });

    }
    const currencies = [
        { label: "USD", sign: "$", groupStyle: "thousand" },
        { label: "AUD", sign: "$", groupStyle: "thousand" },
        { label: "INR", sign: "₹", groupStyle: "lakh" }
    ];



    return (
        <Dialog
            open={open}
            onClose={onClose}
            scroll="body"
            maxWidth="sm"
            fullWidth
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
                                                            <Grid item md={3}> Users </Grid>
                                                            <Grid item md={3}> Currency </Grid>
                                                            <Grid item md={3}> Amount </Grid>
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
                                                                                <Grid item md={3}>

                                                                                    <Autocomplete
                                                                                        id="combo-box-demo"
                                                                                        value={userList.find(v => v.name == userVal.name)}
                                                                                        options={userList.filter(element => !values.users.map(e => e.name).includes(element.name))}
                                                                                        getOptionLabel={(option: any) => option.name}
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

                                                                                </Grid>
                                                                                <Grid item md={3}>
                                                                                    <Autocomplete
                                                                                        id="combo-box-demo"
                                                                                        value={currencies.find(v => v.label == userVal.currency)}
                                                                                        options={currencies}
                                                                                        getOptionLabel={(option: any) => option.label}
                                                                                        onChange={(event, newValue) => {
                                                                                            arrayHelpers.replace(index, {
                                                                                                ...values.users[index],
                                                                                                ["currency"]: newValue?.label
                                                                                            });

                                                                                        }}

                                                                                        renderInput={(params) => <TextField {...params} variant="outlined"
                                                                                        />}
                                                                                    />
                                                                                </Grid>
                                                                                <Grid item md={3}>
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
                                                                                <Grid item md={2}>
                                                                                    <ButtonGroup size="small" aria-label="small outlined button group">
                                                                                        <IconButton size="small" aria-label="add" onClick={() => {
                                                                                            values.users.sort((a, b) => a.amount - b.amount)
                                                                                            arrayHelpers.push({ "id": "", "name": "", "currency": "USD", "amount": 0 })
                                                                                        }
                                                                                        } >
                                                                                            <Add />
                                                                                        </IconButton>
                                                                                        <IconButton size="small" aria-label="delete" onClick={() => arrayHelpers.remove(index)} >
                                                                                            <Delete />
                                                                                        </IconButton>
                                                                                    </ButtonGroup>
                                                                                </Grid>
                                                                            </Grid>
                                                                        ))
                                                                    ) : (
                                                                        <Grid item md={2}>
                                                                            <ButtonGroup size="small" aria-label="small outlined button group">
                                                                                <IconButton size="small" aria-label="add" onClick={() => {
                                                                                    values.users.sort((a, b) => a.amount - b.amount)
                                                                                    arrayHelpers.push({ "id": "", "name": "", "currency": "USD", "amount": 0 })
                                                                                }
                                                                                } >
                                                                                    <Add />
                                                                                </IconButton>
                                                                                <IconButton size="small" aria-label="delete" >
                                                                                    <Delete />
                                                                                </IconButton>
                                                                            </ButtonGroup>
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

                                <CustomDialogFooter>

                                    <Button
                                        onClick={onClose}
                                        variant="contained"
                                    >
                                        Cancel
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
                                </CustomDialogFooter>
                            </>
                        )}
                    />

                </>
            }
        </Dialog>
    )
}

export { DoaDialog as default };