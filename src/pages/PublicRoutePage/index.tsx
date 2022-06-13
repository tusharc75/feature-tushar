import { useParams, useLocation } from "react-router-dom";
import axios from 'axios'
import { backendApi } from './../../config';
import { Grid, Box, Button, Typography, Paper, makeStyles, Dialog } from "@material-ui/core";
import { Fragment, useContext, useEffect, useState } from "react";
import { SVG } from '../../assets';
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import QuoteSupplierPrice from "./QuoteSupplierPrice";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import CustomDialogHeader from "src/components/CustomDialog/CustomDialogHeader";
import CustomDialogContent from "src/components/CustomDialog/CustomDialogContent";
import { CustomDialogTransition } from "src/constants/helpers";
import PasswordVerification from "./PasswordVerification";

const useStyles = makeStyles(() => ({
    header: {
        background: "#163340",
        textAlign: "center",
        padding: "10px",
        color: "white",
        boxShadow: "1px 4px 5px #7c7979",
    },
    logo: {
        width: "140px",
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
    const [passwordVerificationDialog, setPasswordVerificationDialog] = useState(false);

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
                        setPasswordVerificationDialog(true)
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

    const fetchResourceData = (password = null) => {
        let tempData = {
            "id": id
        }
        if (password) tempData["password"] = password
        axios.post(backendApi + `/public/get-data`, tempData)
            .then(async ({ data }) => {
                setResourceData(data.data)
                setPasswordVerificationDialog(false)
                setLoading(false)
            })
            .catch((error) => {
                setPasswordVerificationDialog(false)
                toastConfig.setToastConfig({
                    message: `Password is wrong`,
                    type: "error",
                    open: true,
                });
            });
    };


    return (
        <>
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
            {
                loading || resourceData ?
                    resourceData?.referenceIdType === "Quotes" ? <QuoteSupplierPrice quoteData={resourceData} />
                        : <Box p={2} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>
                    : <Box p={2} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>
            }
            {passwordVerificationDialog &&
                <PasswordVerification
                    open={passwordVerificationDialog}
                    title="Password Verification"
                    close={() => setPasswordVerificationDialog(false)}
                    handleSave={fetchResourceData}
                />
            }
            {!valid &&
                <Dialog
                    maxWidth="md"
                    fullWidth
                    TransitionComponent={CustomDialogTransition}
                    aria-labelledby="customized-dialog-title"
                    onClose={() => { }}
                    open={true}
                    disableBackdropClick={true}
                >
                    <CustomDialogHeader
                        title={"Invalid Link"}
                        showManimizeMaximize={false}
                        showRequiredLabel={false}
                    />
                    <CustomDialogContent>
                        <Typography variant="h5" component="h5" className="m-2 text-center" >
                            Not a valid link
                        </Typography>
                    </CustomDialogContent>
                </Dialog>
            }
        </>
    );
}

export default PublicRoutePage;