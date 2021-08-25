import { useState, useContext, useEffect } from 'react';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
import { makeStyles } from '@material-ui/core/styles';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import FormControlLabel from "@material-ui/core/FormControlLabel"
import Checkbox from "@material-ui/core/Checkbox"
import { useParams, useHistory } from 'react-router-dom';
import routes from '../../components/Helpers/Routes';
import Box from "@material-ui/core/Box"
import Typography from "@material-ui/core/Typography"
import TinyMce from "./../../components/TinyMCE/index"
import CircularProgress from "@material-ui/core/CircularProgress"
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import CustomContainer from '../../components/CustomContainer';
import { Autocomplete } from "@material-ui/lab";
import { useData } from '../../StateProvider/Provider';

const PdfTemplateSchema = Yup.object().shape({
    name: Yup.string().min(3, 'Too Short!').max(50, 'Too Long').required('name is required'),
    owner: Yup.string().required('Owner is required'),
    showPageNumberInFooter: Yup.boolean()
});

const useStyles = makeStyles((theme) => ({
    root: {
        flexGrow: 1,
    },
    paper: {
        width: "100%",
        padding: theme.spacing(2),
        textAlign: 'center',
        color: theme.palette.text.secondary
    },
    saveButtonContainer: {
        textAlign: 'end',
        marginTop: '5px'
    },
    tinyMCEContainer: {
        width: "725px",
    },
    headingLabel: {
        marginBottom: '7px'
    }
}));

export default function NewCreateQuotePdfTemplate(props) {

    const { id } = useParams();
    const history = useHistory();
    const [details, setDetails] = useState({
        header: "",
        footer: "",
        aboveTable: "",
        belowTable: ""
    })
    const [initialValues, setInitialValues] = useState(null)
    const [isUpdating, setIsUpdating] = useState(false);
    const classes = useStyles();
    const toastConfig = useContext(CustomToastContext);
    const [isClone] = useState(history.location.state?.isClone ? true : false);
    const {
        state: { user },
    }: any = useData();
    const [ownerCollaboratorData, setOwnerCollaboratorData] = useState([]);
    const [disableSaveButton, setDisableSaveButton] = useState(false)

    useEffect(() => {
        if (id && id !== '0') {
            (async () => {
                try {
                    const res = await axiosInstance().get(`/quote-pdf-template/${id}`);
                    const {
                        data: { data }
                    } = res;
                    setInitialValues({
                        name: data?.name,
                        showPageNumberInFooter: data?.pageNumberInFooter,
                        header: data?.header,
                        footer: data?.footer,
                        aboveTable: data?.aboveTable,
                        belowTable: data?.belowTable,
                        entity: data?.entity ? data?.entity : [],
                        owner: data?.owner,
                        collaborator: data?.collaborator ? data?.collaborator : [],
                    });
                    setDetails({
                        header: data?.header,
                        footer: data?.footer,
                        aboveTable: data?.aboveTable,
                        belowTable: data?.belowTable
                    })
                    if (user.user._id !== data?.owner && !data?.collaborator.some(d => d === user.user._id)) {
                        setDisableSaveButton(true)
                    }

                } catch (e) {
                    toastConfig.setToastConfig(e);
                }
            })();
        }
        else {
            setInitialValues({
                name: "",
                showPageNumberInFooter: false,
                header: "",
                footer: "",
                aboveTable: "",
                belowTable: "",
                entity: [],
                owner: user.user._id,
                collaborator: [],
            })
        }
        fetchUser()
    }, [id]);

    const fetchUser = () => {
        axiosInstance().get(`/user`).then(({ data: { data } }) => {
            setOwnerCollaboratorData(data);
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    };

    const handleSubmit = (values) => {
        setIsUpdating(true);
        if (id === '0' || isClone === true) {
            axiosInstance()
                .post('/quote-pdf-template', {
                    ...details, name: values.name,
                    pageNumberInFooter: values.showPageNumberInFooter,
                    entity: values?.entity,
                    owner: values?.owner,
                    collaborator: values?.collaborator,
                })
                .then(({ data: { data } }) => {
                    history.push({ pathname: routes.quotePdfTemplate.path });
                    setIsUpdating(false);
                })
                .catch((error) => {
                    setIsUpdating(false);
                    toastConfig.setToastConfig(error);
                });
        }
        else {
            axiosInstance()
                .put('/quote-pdf-template', {
                    _id: id,
                    ...details, name: values.name,
                    pageNumberInFooter: values.showPageNumberInFooter,
                    entity: values?.entity,
                    owner: values?.owner,
                    collaborator: values?.collaborator,
                })
                .then(({ data: { data } }) => {
                    setIsUpdating(false);
                    history.push({ pathname: routes.quotePdfTemplate.path });
                })
                .catch((error) => {
                    setIsUpdating(false);
                    toastConfig.setToastConfig(error);
                });
        }
    }


    return <div className={classes.root}>
        <Grid container className="headerbox">
            <Grid item md={4} sm={11} xs={10}>
                <CustomBreadCrumbs
                    routes={[
                        {
                            title: routes.quotePdfTemplate.title,
                            path: routes.quotePdfTemplate.path
                        },
                        {
                            title: id === '0' || isClone === true ? 'New' : initialValues && initialValues.name
                        }
                    ]}
                />
            </Grid>
        </Grid>
        <div className="main-container">
            <Paper className={classes.paper}>
                {initialValues ? (
                    <Formik
                        initialValues={initialValues}
                        validationSchema={PdfTemplateSchema} onSubmit={handleSubmit}>
                        {({ submitForm, touched, errors, setFieldValue, values }) => (
                            <Form>
                                <Grid container>
                                    <Grid item xs={4}>
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
                                    <Grid item xs={3} className={classes.saveButtonContainer}>
                                        <Button disabled={isUpdating || disableSaveButton} size="small" color="primary"
                                            onClick={submitForm} variant="contained">
                                            Save{isUpdating && <CircularProgress size={24} />}
                                        </Button>
                                    </Grid>
                                </Grid>
                                <Grid container spacing={1}>
                                    <Grid item xs={12} sm={3}>
                                        {<Autocomplete
                                            multiple
                                            options={user?.entity}
                                            getOptionLabel={(option: any) => (option ? option?.entityName : "")}
                                            value={user?.entity.filter((data) => values["entity"]?.some(d => d === data._id)).length
                                                ? user?.entity.filter((data) => values["entity"]?.some(d => d === data._id))
                                                : []}
                                            onChange={(e, val) => {
                                                setFieldValue("entity", val && val?.map(d => d._id))
                                            }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    margin="dense"
                                                    name="entity"
                                                    label="Entity"
                                                    variant="outlined"
                                                    error={touched["entity"] && Boolean(errors["entity"])}
                                                    helperText={touched["entity"] && errors["entity"]}
                                                    fullWidth
                                                />
                                            )}
                                        />}
                                    </Grid>
                                    <Grid item xs={12} sm={3}>
                                        {<Autocomplete
                                            getOptionLabel={(option: any) => (option ? option?.concatedName : "")}
                                            value={ownerCollaboratorData.filter((data) => data._id === values["owner"]).length
                                                ? ownerCollaboratorData.filter((data) => data._id === values["owner"])[0]
                                                : ""}
                                            options={ownerCollaboratorData.filter(user => !values["collaborator"]?.some((d) => (user._id === d)))}
                                            onChange={(e, val) => {
                                                setFieldValue("owner", val && val._id ? val._id : "");
                                            }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    margin="dense"
                                                    name="owner"
                                                    label="Owner"
                                                    variant="outlined"
                                                    error={touched["owner"] && Boolean(errors["owner"])}
                                                    helperText={touched["owner"] && errors["owner"]}
                                                    fullWidth
                                                />
                                            )}
                                        />}
                                    </Grid>
                                    <Grid item xs={12} sm={3}>
                                        {<Autocomplete
                                            multiple
                                            options={ownerCollaboratorData.filter(d => d._id !== values["owner"])}
                                            getOptionLabel={(option: any) => (option ? option?.concatedName : "")}
                                            value={ownerCollaboratorData.filter((data) => values["collaborator"]?.some(d => d === data._id)).length
                                                ? ownerCollaboratorData.filter((data) => values["collaborator"]?.some(d => d === data._id))
                                                : []}
                                            onChange={(e, val) => {
                                                setFieldValue("collaborator", val && val?.map(d => d._id))
                                            }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    margin="dense"
                                                    name="collaborator"
                                                    label="Collaborator"
                                                    variant="outlined"
                                                    error={touched["collaborator"] && Boolean(errors["collaborator"])}
                                                    helperText={touched["collaborator"] && errors["collaborator"]}
                                                    fullWidth
                                                />
                                            )}
                                        />}
                                    </Grid>
                                </Grid>
                                <Grid item xs={12} style={{ textAlign: 'left' }}>
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
                            </Form>
                        )}
                    </Formik>) : null}
                <Grid item xs={12} className="mt-4">
                    <Box className={classes.tinyMCEContainer}>
                        <Typography className={classes.headingLabel} variant="h5" component="h5">Header</Typography>
                        <TinyMce
                            id="header"
                            onChange={(value) => {
                                setDetails((prevState) => ({
                                    ...prevState,
                                    header: value
                                }))
                            }}
                            width={725}
                            height={300}
                            initialValue={initialValues?.header}
                            imageOrFileUploadCompletePercentage={(
                                completePercentage
                            ) => null}
                            showVariableDropdown={true}
                        />
                    </Box>
                </Grid>


                <Grid item xs={12} className="mt-4">
                    <Box className={classes.tinyMCEContainer}>
                        <Typography className={classes.headingLabel} variant="h5" component="h5">Above Table</Typography>
                        <TinyMce
                            id="aboveTable"
                            onChange={(value) => {
                                setDetails((prevState) => ({
                                    ...prevState,
                                    aboveTable: value
                                }))
                            }}
                            width={725}
                            height={400}
                            initialValue={initialValues?.aboveTable}
                            imageOrFileUploadCompletePercentage={(
                                completePercentage
                            ) => null}
                            showVariableDropdown={true}
                        />
                    </Box>
                </Grid >
                <Grid item xs={12} className="mt-4">
                    <Box className={classes.tinyMCEContainer}>
                        <Typography className={classes.headingLabel} variant="h5" component="h5">Below Table</Typography>
                        <TinyMce
                            id="belowTable"
                            onChange={(value) => {
                                setDetails((prevState) => ({
                                    ...prevState,
                                    belowTable: value
                                }))
                            }}
                            width={725}
                            height={300}
                            initialValue={initialValues?.belowTable}
                            imageOrFileUploadCompletePercentage={(
                                completePercentage
                            ) => null}
                            showVariableDropdown={true}
                        />
                    </Box>
                </Grid>

                <Grid item xs={12} className="mt-4">
                    <Box className={classes.tinyMCEContainer}>
                        <Typography className={classes.headingLabel} variant="h5" component="h5">Footer</Typography>
                        <TinyMce
                            id="footer"
                            onChange={(value) => {
                                setDetails((prevState) => ({
                                    ...prevState,
                                    footer: value
                                }))
                            }}
                            width={725}
                            height={400}
                            initialValue={initialValues?.footer}
                            imageOrFileUploadCompletePercentage={(
                                completePercentage
                            ) => null}
                            showVariableDropdown={true}
                        />
                    </Box>
                </Grid>
            </Paper>
        </div>
    </div >
}


