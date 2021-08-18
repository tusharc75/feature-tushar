import { useState, useContext } from 'react';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
import { makeStyles } from '@material-ui/core/styles';
import PDFTemplateSection from "./PdfTemplateSection"
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import FormControlLabel from "@material-ui/core/FormControlLabel"
import Checkbox from "@material-ui/core/Checkbox"

const PdfTemplateSchema = Yup.object().shape({
    name: Yup.string().min(3, 'Too Short!').max(50, 'Too Long').required('name is required'),
    showPageNumberInFooter: Yup.boolean()
});

const useStyles = makeStyles((theme) => ({
    root: {
        flexGrow: 1,
    },
    paper: {
        padding: theme.spacing(2),
        textAlign: 'center',
        color: theme.palette.text.secondary
    },
    saveButtonContainer: {
        textAlign: 'end',
        marginBottom: '6px'
    }
}));

export default function NewCreateQuotePdfTemplate(props) {

    const [details, setDetails] = useState({
        header: "",
        footer: "",
        aboveTable: "",
        belowTable: ""
    })
    const [initialValues, setInitialValues] = useState({})
    const [isLoading, setIsLoading] = useState(false)
    const classes = useStyles();
    const toastConfig = useContext(CustomToastContext);

    const handleSubmit = (values) => {
        console.log('values', values)
        axiosInstance()
            .post('/quote-pdf-template', {
                ...details, name: values.name,
                pageNumberInFooter: values.showPageNumberInFooter
            })
            .then(({ data: { data } }) => {
                setIsLoading(false);
                console.log(" line 41 ~ .then ~ data", data)
            })
            .catch((error) => {
                setIsLoading(false);
                toastConfig.setToastConfig(error);
            });
    }
    return <div className={classes.root}>
        <Grid container spacing={3}>
            <Paper className={classes.paper}>
                {initialValues ? (
                    <Formik
                        initialValues={initialValues}
                        validationSchema={PdfTemplateSchema} onSubmit={handleSubmit}>
                        {({ submitForm, touched, errors, setFieldValue, values }) => (
                            <Form>
                                <Grid container>
                                    <Grid item xs={6}>
                                        <TextField
                                            variant="outlined"
                                            type="text"
                                            label="Quote PDF Template Name"
                                            required={true}
                                            name="name"
                                            fullWidth
                                            margin="dense"
                                            value={values['name']}
                                            error={touched['name'] && Boolean(errors['name'])}
                                            helperText={touched['name'] && errors['name']}
                                            onChange={(e) => setFieldValue("name", e.target.value.trimStart())}
                                        />
                                    </Grid>
                                    <Grid item xs={6} className={classes.saveButtonContainer}>
                                        <Button
                                            onClick={submitForm}
                                            variant="contained" color="primary" >
                                            Save
                                        </Button>
                                    </Grid>
                                </Grid>
                                <Grid item xs={12} sm={3}>
                                    <FormControlLabel
                                        value={values['showPageNumberInFooter']}
                                        control={
                                            <Checkbox
                                                name="showPageNumberInFooter"
                                                checked={values['showPageNumberInFooter']}
                                                onChange={(e) => setFieldValue('showPageNumberInFooter', e.target.checked)}
                                                color="primary"
                                            />
                                        }
                                        label="Show page number in footer"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <PDFTemplateSection
                                        sectionName="header"
                                        label="Header"
                                        details={details}
                                        setValue={(sectionName, value) => {
                                            setDetails((prevState) => ({
                                                ...prevState,
                                                [sectionName]: value
                                            }))
                                        }
                                        }
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <PDFTemplateSection
                                        sectionName="footer"
                                        details={details}
                                        label="Footer"
                                        setValue={(sectionName, value) => setDetails((prevState) => ({
                                            ...prevState,
                                            [sectionName]: value
                                        }))}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <PDFTemplateSection
                                        sectionName="belowTable"
                                        details={details}
                                        label="Below Table"
                                        setValue={(sectionName, value) => setDetails((prevState) => ({
                                            ...prevState,
                                            [sectionName]: value
                                        }))}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <PDFTemplateSection
                                        sectionName="aboveTable"
                                        details={details}
                                        label="Above Table"
                                        setValue={(sectionName, value) => setDetails((prevState) => ({
                                            ...prevState,
                                            [sectionName]: value
                                        }))}
                                    />
                                </Grid >
                            </Form>
                        )}
                    </Formik>) : null}
            </Paper>
        </Grid >
    </div >
}


