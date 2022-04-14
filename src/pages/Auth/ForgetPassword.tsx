import { useContext, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
    Box,
    Button,
    CssBaseline,
    Grid,
    LinearProgress,
    Paper,
    Link as MuiLink,
} from '@material-ui/core';
import { Field, Form, Formik } from 'formik';
import { TextField } from 'formik-material-ui';
import { object, string } from "yup";
import { Link } from 'react-router-dom';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { SVG } from "../../assets";

const useStyles = makeStyles((theme) => ({
    root: {
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 55px)',
        justifyContent: 'space-between',
    },
    title: {
        flexGrow: 0.2,
    },
    container: {
        height: "90vh",
        width: "90vw",
        overflow: "hidden",
    },
    formContainer: {
        textAlign: 'center',
        padding: theme.spacing(10, 5),
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
    },
    image: {
        display: 'none',
        [theme.breakpoints.up('md')]: {
            display: 'grid',
            placeItems: 'center',
        },
    },
    button: {
        marginTop: theme.spacing(2),
        background: theme.palette.secondary.main,
        color: '#fff',

        '&:hover': {
            backgroundColor: theme.palette.secondary.main,
        },
    },

    bottomLinks: {
        marginTop: theme.spacing(2),
        display: 'flex',
        justifyContent: 'space-between',
    },
    footer: {
        textAlign: 'center',
        margin: theme.spacing(2),
    },
    formSide: {
        height: "100%",
        width: "100%",
        padding: "30px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    },
    grid: {
        height: "100%",
    },
    logo: {
        width: "150px",
        height: "100%",
    },
}));

const emailValidationSchema = object().shape({
    email: string().email().required(),
});

const ForgetPassword = () => {
    const toastConfig = useContext(CustomToastContext);
    const classes = useStyles();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (values) => {
        setIsSubmitting(true);
        axiosInstance()
            .post(`/user/forget-password`, {
                email: values.email,
            })
            .then(({ data }) => {
                setIsSubmitting(false);
                toastConfig.setToastConfig({
                    message: data.message,
                    type: 'success',
                    open: true,
                });
            })
            .catch((err) => {
                setIsSubmitting(false);
                toastConfig.setToastConfig(err);
            });
    };

    return (
        <>
            <CssBaseline />
            <div className="login-bg">
                <Paper elevation={10} className={classes.container}>
                    <Grid container className={classes.grid}>
                        <Grid item sm={6} md={5} className="loginSidebar">
                            <Box display={{ xs: 'none', sm: 'block', md: 'block' }}>
                                <img alt="image" className="imgLogin" src={SVG("imgComputer")}></img>
                            </Box>
                        </Grid>
                        <Grid item sm={6} md={7} xs={12} className={classes.formSide}>
                            <Box textAlign="center">
                                <img
                                    className={classes.logo}
                                    src={SVG("LogoNew")}
                                    alt="equip logo"
                                    title="eQuipt Logo"
                                />
                                <Box my={4} />
                                <Formik
                                    initialValues={{
                                        email: '',
                                    }}
                                    validationSchema={emailValidationSchema}
                                    onSubmit={handleSubmit}>
                                    {({ submitForm }) => (
                                        <Form className={classes.form}>
                                            <Field
                                                component={TextField}
                                                name='email'
                                                type='email'
                                                size="small"
                                                label='Email'
                                                variant='outlined'
                                                style={{ width: 260 }}
                                            />
                                            {isSubmitting && <LinearProgress />}
                                            <Box textAlign="right" className="p-2">
                                                <MuiLink component={Link} to="/login">
                                                    Go To Login
                                                </MuiLink>
                                            </Box>
                                            <Button
                                                variant='contained'
                                                color='secondary'
                                                size="small"
                                                disabled={isSubmitting}
                                                onClick={submitForm}>
                                                Submit
                                            </Button>
                                        </Form>
                                    )}
                                </Formik>

                            </Box>
                        </Grid>
                    </Grid>
                </Paper >
            </div >
        </>
    );
};

export default ForgetPassword;
