import React, { useRef, useState, useEffect, Fragment, useContext } from "react";
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import { Formik, Form, Field } from "formik";
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import Dialog from '@material-ui/core/Dialog'
import axiosInstance from '../../axios/axiosInstance'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import CustomButton from '../../components/Helpers/CustomButton'
import TextField from '@material-ui/core/TextField';
import * as Yup from "yup";
import { useHistory } from "react-router-dom";
import AxiosInstance from '../../axios/axiosInstance'
import Autocomplete from '@material-ui/lab/Autocomplete';
import routes from "../../components/Helpers/Routes";
import { stubTrue } from "lodash";


const ProductBuilderSchema = Yup.object().shape({
    subject: Yup.string()
        .required("please enter email subject"),
    body: Yup.string()
        .required("please enter email body"),
    account:Yup.object()
    .required("please select Account"),
    contact:Yup.object()
    .required("please select Contact")
});


const EmailDialog = (props) => {

    const toastConfig = useContext(CustomToastContext)
    const { handleClose,success,id,version} = props;
    const [loading, setLoading] = useState(false);
    const [initialData, setInitialData] = useState({ subject: "",body:"",cc:"",bcc:"",account:"",contact:"" });
    const [accounts,setAccounts]=useState([]);
    const [contacts,setContacts]=useState([])
    const [validEmail,setValidEmail]=useState(true);
    const [email,setEmail]=useState("");
    const history = useHistory();

    useEffect(()=>{
        fetchAccounts();
    },[])

    const handleSubmit = (values) => {
        const body={
            email:email,
            version:version,
            emailBody:values.body,
            emailSubject:values.subject,
            cc:values.cc,
            bcc:values.bcc,
            id:id
        }
        axiosInstance()
        .post(`/quote-builder/sendQuoteEmail`,body)
        .then(({ data: { data } }) => {
            success();
        })
        .catch((error) => {
            toastConfig.setToastConfig(error);
            setLoading(false);
            handleClose();
        });
    };

    const fetchAccounts=()=>{
        setLoading(true);
        axiosInstance()
        .get(`/customer-account`)
        .then(({ data: { data } }) => {
            setAccounts(data);
            setLoading(false);
        })
        .catch((error) => {
            toastConfig.setToastConfig(error);
            setLoading(false);
        });

    }
    
    const fetchContacts=(event,value)=>{
        
        setLoading(stubTrue);
        console.log(value);
        if(value!==null){
        axiosInstance()
        .get(`/customer-contact`)
        .then(({ data: { data } }) => {
            setContacts(data);
            setLoading(false);
        })
        .catch((error) => {
            toastConfig.setToastConfig(error);     
            setLoading(false);
        });
        }
    }

    const fetchemailAddress=(event,value)=>{
        console.log(value)
        if(value!==null){
        if(!value.email && value.email===""){
            setValidEmail(false);
        }
        else{
            setEmail(value.email);
        }
        }
        
    }

    return (<Dialog
        maxWidth="sm"
        aria-labelledby="customized-dialog-title"
        open={true}
        fullWidth
    >
        <Formik
            enableReinitialize={true}
            initialValues={initialData}
            validationSchema={ProductBuilderSchema}
            validateOnMount
            onSubmit={handleSubmit}>
            {({ values,
                errors,
                touched,
                setFieldValue,
                submitForm,
            }) => (
                <Fragment>
                    <CustomDialogHeader title={"Choose contact to email"} onClose={handleClose}></CustomDialogHeader>
                    <CustomDialogContent>
                        <Form autoComplete="off" autoCorrect="off" noValidate >
                            <Box p={1}>
                            <Autocomplete
                                id="accounts"
                                options={accounts}
                                fullWidth
                                getOptionLabel={(option) => option.accountName}
                                style={{ width: 300 }}
                                onChange={(e,value)=>{fetchContacts(e,value); setFieldValue("account",value);}}
                                renderInput={(params) => 
                                <TextField {...params} 
                                label="Account" 
                                variant="outlined" 
                                name="cc"
                                fullWidth
                                required 
                                margin="dense"
                                value={values["cc"]}
                                error={touched["account"] && Boolean(errors["account"])}
                                helperText={touched["account"] && errors["account"]}/>}
                                />
                                </Box>
                                <Box p={1}>
                                <Autocomplete
                                id="contacts"
                                options={contacts}
                                getOptionLabel={(option) => option.firstName}
                                style={{ width: 300 }}
                                onChange={(e,value)=>{fetchemailAddress(e,value); setFieldValue("contact",value);}}
                                renderInput={(params) => 
                                <TextField {...params} 
                                label="Contact" 
                                variant="outlined"
                                name="contact"
                                fullWidth
                                required 
                                margin="dense"
                                value={values["contact"]}
                                error={touched["contact"] && Boolean(errors["contact"])}
                                helperText={touched["contact"] && errors["contact"]}
                                 />}
                                />
                            </Box>
                            <Box p={1}>
                                <TextField
                                    variant="outlined"
                                    type="text"
                                    label="CC"
                                    name="cc"
                                    fullWidth
                                    margin="dense"
                                    value={values["cc"]}
                                    error={touched["cc"] && Boolean(errors["cc"])}
                                    helperText={touched["cc"] && errors["cc"]}
                                    onChange={(e) => setFieldValue("cc", e.target.value.trimStart())}
                                />
                            </Box>
                            <Box p={1}>
                                <TextField
                                    variant="outlined"
                                    type="text"
                                    label="BCC"
                                    name="bcc"
                                    fullWidth
                                    margin="dense"
                                    value={values["bcc"]}
                                    error={touched["bcc"] && Boolean(errors["bcc"])}
                                    helperText={touched["bcc"] && errors["bcc"]}
                                    onChange={(e) => setFieldValue("bcc", e.target.value.trimStart())}
                                />
                            </Box>
                            
                            <Box p={1}>
                                <TextField
                                    variant="outlined"
                                    type="text"
                                    label="Email Subject"
                                    required={true}
                                    name="subject"
                                    fullWidth
                                    margin="dense"
                                    value={values["subject"]}
                                    error={touched["subject"] && Boolean(errors["subject"])}
                                    helperText={touched["subject"] && errors["subject"]}
                                    onChange={(e) => setFieldValue("subject", e.target.value.trimStart())}
                                />
                            </Box>
                            <Box p={1}>
                                <TextField
                                    variant="outlined"
                                    multiline
                                    rows={4}
                                    label="Email Body"
                                    required={true}
                                    name="body"
                                    fullWidth
                                    margin="dense"
                                    value={values["body"]}
                                    error={touched["body"] && Boolean(errors["body"])}
                                    helperText={touched["body"] && errors["body"]}
                                    onChange={(e) => setFieldValue("body", e.target.value.trimStart())}
                                />
                            </Box>
                        </Form>
                    </CustomDialogContent>
                    <CustomDialogFooter>
                        <Button color="primary" onClick={handleClose}>Cancel</Button>
                        <CustomButton
                            loading={loading}
                            variant="contained"
                            color="primary"
                            type="submit"
                            onClick={submitForm}
                        >Send</CustomButton>
                    </CustomDialogFooter>
                </Fragment>
            )}
        </Formik>
    </Dialog>
    );
}

export default EmailDialog;
