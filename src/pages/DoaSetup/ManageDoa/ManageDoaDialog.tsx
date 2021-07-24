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
import { Autocomplete, ToggleButton, ToggleButtonGroup } from "@material-ui/lab";
import { Formik, Form, Field, FieldArray } from 'formik';
import { Add, Delete } from "@material-ui/icons";
import CustomDialogHeader from "../../../components/CustomDialog/CustomDialogHeader";
import axiosInstance from "../../../axios/axiosInstance";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import { getUniqueCurrencies, removeEmptyKeys } from "../../../constants/helpers";
import CustomDialogFooter from "../../../components/CustomDialog/CustomDialogFooter";

const DOAType = [
    {
        key: "Sequence",
        value: 1,
    },
    {
        key: "Amount",
        value: 2,
    }
];

const useStyles = makeStyles((theme) => ({
    root: {
        margin: 0,
        padding: theme.spacing(1.5, 1.5, 1.5, 2),
        // borderBottom: `1px solid #daf5ff`
    },
    currencyStyle: {
        width: 400,
    },
    dialogTitle: {
        fontSize: "1.2rem"
    },
    doaUsersStyle: {
        padding: "0"
    },
    doaBox: {
        background: "#eeeeee",
        borderBottom: "2px solid lightgrey",
        padding: "10px"
    },
    doaHeader: {
        background: "#f3f3f3",
        padding: "8px 14px",
        fontWeight: "bold"
    },
    contentBox: {
        margin: "10px",
        border: "1px solid #ded8d8",
        borderRadius: "4px",
        padding: "4px !important"
    }
}));
const DoaDialog = ({ userSelected, onSuccess, userList, doa, doaCurrency, doaType = null, open, onClose, from = "UserDetailPage" }) => {
    const toastConfig = useContext(CustomToastContext);
    const classes = useStyles();
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [currencyData, setCurrencyData] = useState<any[]>([]);
    const [currency, setCurrency] = useState(doaCurrency ? doaCurrency : "");
    const [currencySymbol, setCurrencySymbol] = useState(
        getUniqueCurrencies().some((data) => data?.currencyCode === currency)
            ? getUniqueCurrencies().find(
                (data) => data?.currencyCode === currency
            ).symbolNative
            : null);

    const tempUserList = from === "UserDetailPage" ? userList.filter(v => v.id !== userSelected[0]) : userList.filter(v => v.id !== "self")
    const fetchDoa = useCallback(() => {
        doa.length > 0 ?
            setUsers(doa) :
            setUsers(([{ id: tempUserList[0].id, name: tempUserList[0].name, amount: 0 }]))
    }, [open]);

    useEffect(() => {
        fetchDoa();
    }, [fetchDoa]);

    const handleSubmit = async (values) => {
        let doaArray;
        selectedType === 2 ?
            doaArray = values.sort((a, b) => a.amount - b.amount).filter(item => item.name != "" && item.name != undefined && item.id != "" && item.id != undefined).map(item => {
                return {
                    user: item.id,
                    amount: item.amount ? Number(item.amount) : 0
                };
            })

            :
            doaArray = values.filter(item => item.name != "" && item.name != undefined && item.id != "" && item.id != undefined).map(item => {
                return {
                    user: item.id,
                };
            });

        const userDoa = { _ids: userSelected, doaCurrency: selectedType === 2 ? currency : "", doa: doaArray, doaType: selectedType };
        setLoading(true)
        axiosInstance().put('/doa/setups', removeEmptyKeys(userDoa))
            .then(({ data }) => {
                toastConfig.setToastConfig({ open: true, type: "success", message: data.message });
                setLoading(false)
                onSuccess()
            }).catch((error) => {
                toastConfig.setToastConfig(error);
                setLoading(false);
            });

    }

    const [filter, setFilter] = useState(doaType ? DOAType.find((d) => d.value === doaType).key : "Sequence");
    const [selectedType, setSelectedType] = useState(doaType ? doaType : DOAType.find((d) => d.key === "Sequence").value);

    const handleFilter = (event, newFilter) => {
        if (newFilter !== null) {
            setFilter(newFilter);
            setSelectedType(DOAType.find((d) => d.key === newFilter).value);
        }
    };

    useEffect(() => {
        const sortedArr = getUniqueCurrencies().sort((a, b) =>
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
                    <Grid container className={classes.doaBox}>
                        <Grid item xs={6} md={6} sm={6}>
                            <ToggleButtonGroup size="small"
                                value={filter}
                                exclusive
                                onChange={handleFilter}>
                                {DOAType.map((k, index) => {
                                    return (
                                        <ToggleButton value={k.key} key={index}>{k.key}
                                        </ToggleButton>
                                    );
                                })}
                            </ToggleButtonGroup>
                        </Grid>
                        <Grid item xs={6} md={6} sm={6} className="d-flex justify-content-end">
                            {(selectedType === 2) &&
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
                                        option ? `${option.currencyCode} - ${option.currencyName} - (${option.symbolNative})` : ""
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
                                        const { currencyCode, currencyName, symbolNative } = option;
                                        return `${currencyCode} - ${currencyName} - (${symbolNative})`
                                    }}
                                />
                            }
                        </Grid>
                    </Grid>
                    <div className={classes.doaUsersStyle}>
                        <Formik
                            initialValues={{ users: users }}
                            onSubmit={() => { }}
                            render={({ values,
                                errors }) => (
                                <>
                                    <DialogContent className={classes.contentBox}>
                                        <Form>
                                            <Container className="p-0">
                                                <Grid
                                                    container
                                                    direction="row"
                                                    justify="space-evenly"
                                                    alignItems="center"
                                                >
                                                    <Grid item md={12}>
                                                        {values.users && values.users.length > 0 && (

                                                            <Box className={classes.doaHeader}>
                                                                <Grid
                                                                    container
                                                                    spacing={2}
                                                                    direction="row"
                                                                    justify="flex-start"
                                                                    alignItems="center"
                                                                >
                                                                    <Grid item md={1}> # </Grid>
                                                                    <Grid item md={5}> Users </Grid>
                                                                    {(selectedType === 2) && <Grid item md={4}> Amount </Grid>}
                                                                    <Grid item md={2}></Grid>

                                                                </Grid>
                                                            </Box>
                                                        )}
                                                        <Box className="p-1">
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
                                                                                            value={userList.find(v => v.name == userVal.name) ? userList.find(v => v.name == userVal.name) : ""}
                                                                                            options={(selectedType === 2) ? userList.filter(element => !values.users.map(e => e.name).includes(element.name)) : tempUserList.filter(element => !values.users.map(e => e.name).includes(element.name))}
                                                                                            getOptionLabel={(option: any) => option?.name ? option?.name : ""}
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
                                                                                                name="nameField"
                                                                                                error={userList.find(v => v.name == userVal.name) === "" || userList.find(v => v.name == userVal.name) === undefined}
                                                                                                helperText={userList.find(v => v.name == userVal.name) === "" || userList.find(v => v.name == userVal.name) === undefined ? " User is Required" : ""}
                                                                                                required
                                                                                            />}
                                                                                        />

                                                                                    </Grid>
                                                                                    {(selectedType === 2) &&
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
                                                                                                onChange={(e) => {
                                                                                                    arrayHelpers.replace(index, {
                                                                                                        ...values.users[index],
                                                                                                        ["amount"]: e.target.value.replace(/[^0-9]/g, '')
                                                                                                    })
                                                                                            }}
                                                                                            />
                                                                                        </Grid>
                                                                                    }
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
                                                                                            <IconButton size="small" aria-label="delete" style={{ color: "#f44336" }} onClick={() => arrayHelpers.remove(index)} >
                                                                                                <Delete />
                                                                                            </IconButton>
                                                                                        </ButtonGroup>
                                                                                    </Grid>
                                                                                </Grid>
                                                                            ))
                                                                        ) : (
                                                                            <Grid item md={12} className="d-flex  align-items-center justify-content-center">
                                                                                <Button
                                                                                    variant="contained"
                                                                                    color="primary"
                                                                                    size="large"
                                                                                    onClick={() => {
                                                                                        arrayHelpers.push({ "id": "", "name": "", "amount": 0 })
                                                                                    }}
                                                                                >
                                                                                    Add Users
                                                                                </Button>
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
                                            size="small"
                                            onClick={onClose}
                                            variant="contained"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            type="submit"
                                            size="small"
                                            disabled={
                                                currency === "" && selectedType === 2 ||
                                                values.users.filter(item => item.name === "" || item.name === undefined || item.id == "" || item.id === undefined).length > 0
                                            }
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
                    </div>
                </>
            }
        </Dialog>
    )
}

export { DoaDialog as default };