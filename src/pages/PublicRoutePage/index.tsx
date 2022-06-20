import { useParams, useLocation } from "react-router-dom";
import axios from 'axios'
import { backendApi } from './../../config';
import { Grid, Box, Button, Typography, Paper, makeStyles, Dialog, TextField, AppBar, Toolbar } from "@material-ui/core";
import { Fragment, useContext, useEffect, useState } from "react";
import { SVG } from '../../assets';
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import QuoteSupplierPrice from "./QuoteSupplierPrice";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";

const useStyles = makeStyles((theme) => ({

    header: {
        background: "#163340",
        textAlign: "center",
        paddingLeft: "22px",
        paddingTop: "5px",
        paddingBottom: "5px",
        color: "white",
        boxShadow: "1px 4px 5px #7c7979",
    },
    logo: {
        paddingTop: "8px",
        width: '120px'
    },
    brandLogo: {
        height: "45px",
        borderRadius: "3px",
    },
    footer: {
        position: "fixed",
        bottom: "7px",
        background: "#ecfcef",
        width: "100%",
        padding: "10px",
        display: "flex",
        alignItems: "center",
    },
    gridContent: {
        height: "calc(100vh - 24vh)",
        width: "100%",
        marginTop: "10px",
        overflow: "auto"
    },
    warningIcon: {
        display: 'inline-flex'
    }
}));

const PublicRoutePage = () => {
    const { id } = useParams();
    const toastConfig = useContext(CustomToastContext);
    const classes = useStyles();
    const [loading, setLoading] = useState(false);
    const [valid, setValid] = useState(true);
    const [resourceData, setResourceData] = useState(null);
    const [passwordVerification, setPasswordVerification] = useState(false);
    const [password, setPassword] = useState(null);

    useEffect(() => {
        if (id) {
            fetchLinkData();
        }
    }, [id]);

    const fetchLinkData = async () => {
        setLoading(true);
        axios.get(backendApi + `/public/check-link/${id}`)
            .then(async ({ data }) => {
                if (data?.data?.valid) {
                    if (data?.data?.protected) {
                        setPasswordVerification(true)
                    }
                    else {
                        fetchResourceData()
                    }
                }
                else {
                    setValid(false)
                    toastConfig.setToastConfig({
                        message: `Link is not valid`,
                        type: "error",
                        open: true,
                    });
                }
            })
            .catch((error) => {
                toastConfig.setToastConfig({
                    message: `Link is not valid`,
                    type: "error",
                    open: true,
                });
                setValid(false)
            });
    };

    const fetchResourceData = () => {
        let tempData = {
            "id": id
        }
        if (password) tempData["password"] = password
        axios.post(backendApi + `/public/get-data`, tempData)
            .then(async ({ data }) => {
                setResourceData(data.data)
                setPasswordVerification(false)
                setLoading(false)
            })
            .catch((error) => {
                setPasswordVerification(false)
                toastConfig.setToastConfig({
                    message: `Password is wrong`,
                    type: "error",
                    open: true,
                });
            });
    };


    return (
        <>

            {/* <AppBar position="fixed" className={classes.appBar} color="primary">
                <Toolbar className={classes.toolbar}>
                    <Box component="div" display="flex" alignItems="center" flexGrow={1}>
                        <img className={classes.logo} src={SVG('LogoNew')} alt="equip logo" title="eQuipt Logo" />
                    </Box>
                </Toolbar>
            </AppBar> */}
            <Grid container className={classes.header}>
                <Grid item xs={12} md={1} sm={2}>
                    <img
                        className={classes.logo}
                        src={SVG('LogoNew')}
                        alt="equip logo"
                        title="eQuipt Logo"
                    />
                </Grid>
                <Grid item xs={6} md={2} sm={2} className="pull-right">
                </Grid>
            </Grid>
            {passwordVerification ?
                <>
                    <Box style={{ padding: "10px", display: "flex", justifyContent: "center" }}>
                        <Box style={{ marginTop:"50px",width: "400px" }} boxShadow={3}>

                            <Grid spacing={1} style={{ padding: "10px", display: "flex", justifyContent: "center" }} container>
                                <Grid item xs={12} sm={12} md={12} >
                                    <h1 style={{ padding: "10px", display: "flex", justifyContent: "center", color: "#047d1c" }} title={"Authentication Required"}>
                                        Authentication Required
                                    </h1>
                                </Grid>

                                <Grid item xs={10} sm={10} md={10} >
                                    <TextField
                                        id="outlined-full-width"
                                        margin="normal"
                                        variant="outlined"
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                        label="Password"
                                        name="Password"
                                        type="password"
                                        placeholder="Please enter password"
                                        onChange={(e) => setPassword(e.target.value)}
                                        fullWidth
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={10} sm={10} md={10} >
                                    <Button
                                        style={{ marginBottom: "20px"}}
                                        variant="contained"
                                        color="primary"
                                        size="medium"
                                        fullWidth
                                        onClick={fetchResourceData}
                                    >
                                        Submit
                                    </Button>
                                </Grid>
                            </Grid>
                        </Box>
                    </Box>
                </>
                : !valid ?
                    <h1 style={{ padding: "10px", display: "flex", justifyContent: "center", color: "#047d1c" }} title={" Thanks for your submission"}>
                        Link is expired or already used
                    </h1>
                    : loading || resourceData ?
                        resourceData?.referenceIdType === "Quotes" ? <QuoteSupplierPrice quoteData={resourceData} openAuthId={id} />
                            : <Box p={2} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>
                        : <Box p={2} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>
            }


        </>
    );
}

export default PublicRoutePage;