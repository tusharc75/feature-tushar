import React, { useState, useEffect, Fragment, useContext } from "react";
import Grid from '@material-ui/core/Grid';
import Layout from "../../components/Layout";
import { makeStyles } from '@material-ui/core/styles';
import { Box, Typography, Divider, TextField, Button, Menu, MenuItem, CircularProgress, Checkbox } from "@material-ui/core";
import { useHistory } from "react-router-dom";
import Loader from "../../components/Loader";
import queryString from "query-string";
import CustomBreadCrumbs from "./../../components/CustomBreadCrumbs";
import routes from "./../../components/Helpers/Routes";
import { camelCase } from "../../constants/helpers";
import { FormBuilder } from "../../components/FormBuilder";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from '../../axios/axiosInstance';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton'
import CustomContainer from "../../components/CustomContainer";


const useStyles = makeStyles((theme) => ({
    root: {
        flexGrow: 1,
        margin: 10
    },
    screenHeightAuto: {
        minHeight: window.innerHeight - 220,
        maxHeight: window.innerHeight - 220,
        overflow: "auto"
    },
    screenHeight: {
        minHeight: window.innerHeight - 200,
        maxHeight: window.innerHeight - 200,
    },
}));



const CreateFormBuilder = (props) => {

    const history = useHistory();
    const parsed = queryString.parse(history.location.search);
    const toastConfig = useContext(CustomToastContext)

    const { resource } = parsed;
    const [section, setSection] = useState(null);
    const [brandName, setBrandName] = useState("");
    const [deleteField, setDeleteField] = useState([]);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        fetchBrandResourceData()
    }, []);

    const fetchBrandResourceData = async () => {
        axiosInstance().get(`/sa-formbuilder/resourcedata/` + resource).then(({ data: { data } }) => {
            setSection(data.section)
            setBrandName(data.brandName)
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    };

    const handleSave = () => {
        let data = []
        let order = 0;
        section.forEach(_section => {
            _section.field.forEach(_field => {
                let _field_data = _field
                _field_data._id = _field_data._id.toString();
                _field_data.sectionName = _section.sectionName
                if (!isNaN(_field._id)) {
                    _field_data.fieldName = camelCase(_field.fieldLabel.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, ''))
                }
                _field_data.order = ++order
                data.push(_field_data)
            })
        })

        let sendData: any = {}
        sendData.resource = resource;
        sendData.field = data;
        sendData.deleteField = deleteField;
        setIsUpdating(true)
        axiosInstance().put(`/sa-formbuilder/resourcedata`, sendData).then(({ data: { data } }) => {
            setIsUpdating(false)
            history.push({ pathname: "/form-builder" });
        }).catch((error) => {
            setIsUpdating(false)
            toastConfig.setToastConfig(error);
        });
    };

    const classes = useStyles();
    return (<Layout>
        <Grid container direction="row">
            <CustomBreadCrumbs routes={[routes.formBuilder, { title: "Resource" }]} />
        </Grid>
        <CustomContainer>
        {section ?
            <Fragment>
                <Box p={1} pb={0} bgcolor="white" >
                    <Grid container spacing={1}>
                        <Grid item xs={3}>
                            <Typography variant="caption">Brand </Typography>
                            <Typography variant="body1">{brandName}</Typography>
                        </Grid>
                        <Grid item xs={3}>
                            <Typography variant="caption">Resource </Typography>
                            <Typography variant="body1">{resource}</Typography>
                        </Grid>
                        <Grid item xs={6} container justify="flex-end">
                            <Box>
                                <Button disabled={isUpdating} color="primary" size="small" onClick={handleSave} variant="contained" >
                                    Save
                                    {isUpdating && <CircularProgress size={24} />}
                                </Button>
                            </Box>
                            <Box ml={1} >
                                <Button color="primary" variant="contained" size="small" onClick={() => history.push({ pathname: "/form-builder" })} >Close</Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
                <Box >
                    <FormBuilder
                        section={section}
                        setSection={setSection}
                        deleteField={deleteField}
                        setDeleteField={setDeleteField}
                        isCustomField={false} />
                </Box>
            </Fragment>
            :
            <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>
        }
        </CustomContainer>
    </Layout >
    );
}

export default CreateFormBuilder;
