import React, { useCallback, useContext, useEffect, useState } from "react";
import {
    Box,
    Button,
    TextField,
    Grid,
    Container,
    Dialog,
    DialogContent,
    IconButton,
    ButtonGroup,
    makeStyles,
    Typography,
    Avatar,
    InputAdornment
} from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import { Formik, Form, Field, FieldArray } from 'formik';
import { Add, Delete } from "@material-ui/icons";
import CustomDialogHeader from "../../../components/CustomDialog/CustomDialogHeader";
import axiosInstance from "../../../axios/axiosInstance";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import { removeEmptyKeys } from "../../../constants/helpers";
import CustomDialogFooter from "../../../components/CustomDialog/CustomDialogFooter";
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import currencies from "../../../constants/currency_with_country.json";


const useStyles = makeStyles((theme) => ({
    root: {
        margin: 0,
        padding: theme.spacing(1.5, 1.5, 1.5, 2),
        // borderBottom: `1px solid #daf5ff`
    },
    currencyStyle: {
        width: 200,
        position: "absolute",
        right: theme.spacing(1.5),
        top: theme.spacing(1.5),
    },
    dialogTitle: {
        fontSize: "1.2rem"
    }
}));
const DoaDialog = ({ userSelected, onSuccess, userList, doa, doaCurrency, open, onClose }) => {
    const toastConfig = useContext(CustomToastContext);
    const classes = useStyles();
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [currencyData, setCurrencyData] = useState<any[]>([]);
    const [currency, setCurrency] = useState(doaCurrency ? doaCurrency : null);
    const [currencySymbol, setCurrencySymbol] = useState(
        currencies.filter((data) => data?.currencyCode === currency).length
            ? currencies.filter(
                (data) => data?.currencyCode === currency
            )[0].symbolNative
            : null);

    const fetchDoa = useCallback(() => {
        doa.length > 0 ?
            setUsers(doa) :
            setUsers(([{ id: userList[0].id, name: userList[0].name, amount: 0 }]))
    }, [open]);

    useEffect(() => {
        fetchDoa();
    }, [fetchDoa]);

    const handleSubmit = async (values) => {
        values.sort((a, b) => a.amount - b.amount)
        const doaArray = values.filter(item => item.name != "" && item.name != undefined && item.id != "" && item.id != undefined).map(item => {
            return {
                user: item.id,
                amount: Number(item.amount)
            };
        });
        const userDoa = { _id: userSelected, doaCurrency: currency, doa: doaArray };
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
    useEffect(() => {
        const sortedArr = currencies.sort((a, b) =>
            a.name.toUpperCase() < b.name.toUpperCase()
                ? -1
                : a.name.toUpperCase() > b.name.toUpperCase()
                    ? 1
                    : 0
        );
        setCurrencyData(sortedArr);
    }, []);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            scroll="body"
            maxWidth="md"
            fullWidth
        >
            {!loading &&
                <>
                    <CustomDialogHeader title={doa?.length > 0 ? "Edit DOA" : "Add DOA"} />

                    <Autocomplete className={classes.currencyStyle}
                        fullWidth
                        size="small"
                        value={
                            currencyData.filter((data) => data?.currencyCode === currency)
                                .length
                                ? currencyData.filter(
                                    (data) => data?.currencyCode === currency
                                )[0]
                                : ""
                        }
                        options={currencyData}
                        getOptionLabel={(option: any) =>
                            option ? `${option.currencyCode} (${option.symbolNative}) - ${option.name}` : ""
                        }
                        getOptionSelected={(option: any, val) => option?.currencyCode === val}
                        onChange={(e, val) => {
                            setCurrency(val?.currencyCode ? val?.currencyCode : "")
                            setCurrencySymbol(val?.symbolNative)
                        }
                        }
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                variant="outlined"
                                name={"currency"}
                                label={"Currency"}

                            />
                        )}
                        renderOption={(option) => {
                            const { currencyCode, name, countryCode, symbolNative } = option;
                            return (
                                <Grid container alignItems="center">
                                    <Grid item>
                                        <Avatar
                                            variant="rounded"
                                            src={`https://lipis.github.io/flag-icon-css/flags/4x3/${countryCode.toLowerCase()}.svg`}
                                            style={{ marginRight: 20, width: "40px", height: "30px" }}
                                        />
                                    </Grid>
                                    <Grid item xs>
                                        <Typography>{currencyCode} ({symbolNative})</Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            {name}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            );
                        }}
                    />
                    <Formik
                        initialValues={{ users: users }}
                        onSubmit={() => { }}
                        render={({ values,
                            errors }) => (
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
                                                                                        size="small"
                                                                                        style={{ minWidth: 200 }}
                                                                                        value={userList.find(v => v.name == userVal.name)}
                                                                                        options={userList.filter(element => !values.users.map(e => e.name).includes(element.name))}
                                                                                        getOptionLabel={(option: any) => option.name}
                                                                                        onChange={(event, newValue) => {
                                                                                            arrayHelpers.replace(index, {
                                                                                                ...values.users[index],
                                                                                                ["name"]: newValue?.name,
                                                                                                ["id"]: newValue?.id,
                                                                                            });
                                                                                        }}

                                                                                        renderInput={(params) => <TextField
                                                                                            {...params}
                                                                                            variant="outlined"
                                                                                            name="amountField"
                                                                                            error={userList.find(v => v.name == userVal.name) === "" || userList.find(v => v.name == userVal.name) === undefined}
                                                                                            helperText={userList.find(v => v.name == userVal.name) === "" || userList.find(v => v.name == userVal.name) === undefined ? " User is Required" : ""}
                                                                                            required
                                                                                        />}
                                                                                    />

                                                                                </Grid>

                                                                                <Grid item md={4}>
                                                                                    <Field
                                                                                        fullWidth
                                                                                        InputProps={{
                                                                                            startAdornment: (
                                                                                                <InputAdornment position="start">
                                                                                                    {currencySymbol ? currencySymbol : ""}
                                                                                                </InputAdornment>
                                                                                            ),
                                                                                        }}
                                                                                        startAdornment={currencySymbol ? <InputAdornment position="start">{currencySymbol}</InputAdornment> : ""}
                                                                                        variant="outlined"
                                                                                        type="text"
                                                                                        size="small"
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
                                                                                        <IconButton
                                                                                            size="small"
                                                                                            aria-label="add"
                                                                                            disabled={values.users.length == userList.length}
                                                                                            onClick={() => {
                                                                                                arrayHelpers.push({ "id": "", "name": "", "amount": 0 })
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
                                                                                    arrayHelpers.push({ "id": "", "name": "", "amount": 0 })
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