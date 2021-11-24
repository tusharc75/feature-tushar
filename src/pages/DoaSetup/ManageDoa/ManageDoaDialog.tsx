import { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
    Box,
    Button,
    TextField,
    Grid,
    Container,
    DialogContent,
    IconButton,
    ButtonGroup,
    makeStyles,
    InputAdornment,
    Chip
} from "@material-ui/core";
import { Autocomplete, ToggleButton, ToggleButtonGroup } from "@material-ui/lab";
import { Formik, Form, Field, FieldArray, FormikProps } from 'formik';
import { Add, Delete } from "@material-ui/icons";
import CustomDialogHeader from "../../../components/CustomDialog/CustomDialogHeader";
import axiosInstance from "../../../axios/axiosInstance";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import { getUniqueCurrencies, removeEmptyKeys } from "../../../constants/helpers";
import CustomDialogFooter from "../../../components/CustomDialog/CustomDialogFooter";
import React from "react";

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
const DoaDialog = ({ selectedEntity, onSuccess, userList, doa, doaCurrency, minLimit = 0, doaType = null, open, onClose, from = "EntityDetailPage", isRenderedFromUserSetUp = false }) => {
    const toastConfig = useContext(CustomToastContext);
    const classes = useStyles();
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [check, setCheck] = useState(false);
    const [doaLowerLimit, setDoaLowerLimit] = useState(minLimit);
    const [currencyData, setCurrencyData] = useState<any[]>([]);
    const [currency, setCurrency] = useState(doaCurrency ? doaCurrency : "");
    const [currencySymbol, setCurrencySymbol] = useState(
        getUniqueCurrencies().some((data) => data?.currencyCode === currency)
            ? getUniqueCurrencies().find(
                (data) => data?.currencyCode === currency
            ).symbolNative
            : null);

    const tempUserList = from === "EntityDetailPage" ? userList.filter(v => v.id !== selectedEntity[0]) : userList.filter(v => v.id !== "self")
    const fetchDoa = useCallback(() => {
        doa.length > 0 ?
            setUsers(doa.map(d => ({ ...d, user: d.user.map(e => e._id).toString() }))) :
            setUsers(([{ user: tempUserList ? tempUserList[0]?.name : "", amount: 0 }]))
    }, []);

    useEffect(() => {
        fetchDoa();
    }, [fetchDoa]);

    const handleSubmit = async (values) => {
        let doaArray;
        if (selectedType === 2) {
            doaArray = values.sort((a, b) => a.amount - b.amount).filter(item => item.user !== "" && item.user !== undefined).map(item => {
                return {
                    user: item.user.split(","),
                    amount: item.amount ? Number(item.amount) : 0
                };
            })
            let self_index = doaArray.findIndex(x => x.user === selectedEntity[0] || x.user === "self");
            if (self_index > 0) {
                var element = doaArray[self_index];
                doaArray.splice(self_index, 1);
                doaArray.splice(0, 0, element);
            }
        }
        else {
            doaArray = values.filter(item => item.user !== "" && item.user !== undefined).map(item => {
                return {
                    user: item.user.split(","),
                };
            });
        }


        const userDoa = { _ids: selectedEntity, doaCurrency: selectedType === 2 ? currency : "", doa: doaArray, doaType: selectedType, minLimit: selectedType === 2 ? doaLowerLimit : 0 };
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
    const formikRef = useRef<FormikProps<{ users: any[]; }>>();
    const handleFilter = (event, newFilter) => {
        if (newFilter !== null) {
            setFilter(newFilter);
            setSelectedType(DOAType.find((d) => d.key === newFilter).value);
            if (newFilter === "Sequence") {
                doa.length > 0 ?
                    setUsers(doa.map(d => ({ ...d, user: d.user.map(e => e._id).toString() }))) :
                    setUsers(([{ user: tempUserList ? tempUserList[0]?.id : "", amount: 0 }]))
            }
            else {
                doa.length > 0 ?
                    setUsers(doa.map(d => ({ ...d, user: d.user.map(e => e._id).toString() }))) :
                    setUsers(([{ user: tempUserList ? tempUserList[0]?.id : "", amount: 0 }]))

            }
            formikRef.current?.resetForm()
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

    const validate = (values) => {
        let errors = null;
        let minTemp = values.users.reduce(function (previous, current) {
            return previous.amount < current.amount ? previous : current;
        });

        if (values.users.length > 0) {
            let tempUser = values.users.find(item => item.id === selectedEntity[0] || item.id === "self")
            if (tempUser && tempUser.amount !== minTemp.amount) {
                errors = "Too many characters!";
            }

        }

        return errors;
    };

    return (
        // <Dialog
        //     open={open}
        //     onClose={onClose}
        //     scroll="body"
        //     maxWidth="md"
        //     fullWidth
        // >
        <>
            {!loading &&
                <>
                    {!isRenderedFromUserSetUp && <CustomDialogHeader title={doa?.length > 0 ? "Edit DOA" : "Add DOA"} />}
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
                                <>
                                    <TextField
                                        fullWidth
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    {currencySymbol ? currencySymbol : ""}
                                                </InputAdornment>
                                            ),
                                        }}
                                        variant="outlined"
                                        type="text"
                                        size="small"
                                        name="amount"
                                        placeholder="Enter minimum DOA amount"
                                        label="Enter minimum DOA amount"
                                        value={doaLowerLimit}
                                        onChange={(e) => {
                                            setDoaLowerLimit(Number(e.target.value.replace(/[^0-9]/g, '')))
                                        }}
                                        required
                                    />
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
                                </>
                            }
                        </Grid>
                    </Grid>
                    <div className={classes.doaUsersStyle}>
                        <Formik
                            initialValues={{ users: users }}
                            enableReinitialize={true}
                            innerRef={formikRef}
                            onSubmit={() => { }}>
                            {({ values }) => (
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
                                                                                            // options={userList}
                                                                                            options={(selectedType === 2) ? userList?.filter(element => !values?.users?.some(e => e?.user?.split(",").some(d => d === element.id))) : tempUserList?.filter(element => !values?.users?.some(e => e?.user?.split(",").some(d => d === element.id)))}
                                                                                            getOptionLabel={(option: any) => option?.name ? option?.name : ""}
                                                                                            onChange={(event, newValue) => {
                                                                                                arrayHelpers.replace(index, {
                                                                                                    ...values.users[index],
                                                                                                    ["user"]: newValue?.map(d => d.id).toString(),
                                                                                                });
                                                                                            }}
                                                                                            multiple
                                                                                            value={userList?.filter(element => userVal?.user?.split(",")?.some(d => d === element?.id))}
                                                                                            renderOption={(option) => (
                                                                                                <React.Fragment>
                                                                                                    {option?.name}
                                                                                                </React.Fragment>
                                                                                            )}
                                                                                            renderInput={(params) => <TextField
                                                                                                {...params}
                                                                                                variant="outlined"
                                                                                                name="userField"
                                                                                                error={userVal?.user?.length <= 0}
                                                                                                helperText={userVal?.user?.length <= 0 ? " User is Required" : ""}
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
                                                                                                // error={userList.find(v => v.name === userVal.name) === "" || userList.find(v => v.name === userVal.name) === undefined}
                                                                                                // helperText={userList.find(v => v.name === userVal.name) === "" || userList.find(v => v.name === userVal.name) === undefined ? " User is Required" : ""}
                                                                                                required
                                                                                            />
                                                                                            {validate(values) && check && (userVal.id === selectedEntity[0] || userVal.id === "self") && (
                                                                                                <span style={{ color: 'red' }}>{`${userVal.name} should have minimum amount`}</span>
                                                                                            )}
                                                                                        </Grid>
                                                                                    }
                                                                                    <Grid item md={2}>
                                                                                        <ButtonGroup size="small" aria-label="small outlined button group">
                                                                                            <IconButton
                                                                                                size="small"
                                                                                                aria-label="add"
                                                                                                disabled={values.users.length === userList.length}
                                                                                                onClick={() => {
                                                                                                    arrayHelpers.push({ "user": "", "amount": 0 })
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
                                                                                        arrayHelpers.push({ "user": "", "amount": 0 })
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

                                        {!isRenderedFromUserSetUp &&
                                            <Button
                                                size="small"
                                                onClick={onClose}
                                                variant="contained"
                                            >
                                                Cancel
                                            </Button>}
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            type="submit"
                                            size="small"
                                            disabled={
                                                currency === "" && selectedType === 2
                                                // ||values.users.filter(item => item.name === "" || item.name === undefined || item.id === "" || item.id === undefined).length > 0
                                            }
                                            onClick={() => {
                                                if (values.users.length === 0) {
                                                    handleSubmit(values.users)
                                                }
                                                else {
                                                    validate(values) ? setCheck(true)
                                                        : handleSubmit(values.users)
                                                }
                                            }}
                                        >
                                            {isRenderedFromUserSetUp ? "Save & Continue" : "Save"}
                                        </Button>
                                    </CustomDialogFooter>
                                </>
                            )}
                        </Formik>
                    </div>
                </>
            }
            {/* </Dialog> */}
        </>
    )
}

export { DoaDialog as default };