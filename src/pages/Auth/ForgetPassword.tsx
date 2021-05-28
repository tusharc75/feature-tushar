import { useContext, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
    Box,
    Button,
    Container,
    CssBaseline,
    Grid,
    LinearProgress,
    Paper,
    Typography,
} from '@material-ui/core';
import { Field, Form, Formik } from 'formik';
import { TextField } from 'formik-material-ui';
import * as Yup from 'yup';
import { Link } from 'react-router-dom';
import axiosInstance from '../../axios/axiosInstance';
import demoImg from '../../assets/clip-hardworking-man.png';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';

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
        marginTop: theme.spacing(5),
        [theme.breakpoints.up('xs')]: {
            marginTop: theme.spacing(10),
        },
    },
    formContainer: {
        textAlign: 'center',
        padding: theme.spacing(10, 5),
    },
    form: {
        marginTop: theme.spacing(5),
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
    fields: {
        marginBottom: theme.spacing(3),
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
}));

const emailValidationSchema = Yup.object().shape({
    email: Yup.string().email().required(),
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
            <Box className={classes.root}>
                <Container maxWidth='md'>
                    <Paper elevation={1} className={classes.container}>
                        <Grid container>
                            <Grid
                                item
                                xs={12}
                                sm={12}
                                md={6}
                                className={classes.formContainer}>
                                <h2>Enter Your Email</h2>
                                <Formik
                                    initialValues={{
                                        email: '',
                                    }}
                                    validationSchema={emailValidationSchema}
                                    onSubmit={handleSubmit}>
                                    {({ submitForm }) => (
                                        <Form className={classes.form}>
                                            <Field
                                                className={classes.fields}
                                                component={TextField}
                                                name='email'
                                                type='email'
                                                label='Email'
                                                variant='outlined'
                                            />

                                            {isSubmitting && <LinearProgress />}

                                            <Button
                                                variant='contained'
                                                color='primary'
                                                size="small" 
                                                disabled={isSubmitting}
                                                onClick={submitForm}>
                                                Submit
                                            </Button>
                                        </Form>
                                    )}
                                </Formik>
                                <Box className={classes.bottomLinks}>
                                    <Link to='/login'>
                                        Go To Login
                                </Link>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={12} md={6} className={classes.image}>
                                <img
                                    src={demoImg}
                                    alt='illustration'
                                    style={{ width: '100%' }}
                                />
                            </Grid>
                        </Grid>
                    </Paper>
                </Container>
                <Box className={classes.footer}>
                    <Typography variant='subtitle2' color='textSecondary'>
                        eQuip-T &copy; 2021
          </Typography>
                </Box>
            </Box>
        </>
    );
};

export default ForgetPassword;
