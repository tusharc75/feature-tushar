import { useState, useEffect, Fragment, useContext } from "react";
import Grid from '@material-ui/core/Grid';
import { Box, Typography, Button, CircularProgress } from "@material-ui/core";
import { useHistory, useParams } from "react-router-dom";
import CustomBreadCrumbs from "./../../components/CustomBreadCrumbs";
import routes from "./../../components/Helpers/Routes";
import { camelCase } from "../../constants/helpers";
import { FormBuilder } from "../../components/FormBuilder";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from '../../axios/axiosInstance';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton'
import CustomContainer from "../../components/CustomContainer";
import { useData } from "../../StateProvider/Provider";
import { checkFormulaLoop, checkUniqueValidation } from "../../constants/formulaUtility";
import ConfirmCancelDialog from "../../components/ConfirmCancelDialog"
import { isEqual } from "lodash";

const CreateFormBuilder = () => {

    const { state: { permissions } }: any = useData();
    const [formBuilderPermissions, setFormBuilderPermissions] = useState({
        isCreate: false,
        isUpdate: false,
        isRead: false,
        isDelete: false,
    });

    const history = useHistory();
    const { resource } = useParams();
    const toastConfig = useContext(CustomToastContext)
    const [orisection, setOriSection] = useState(null);
    const [section, setSection] = useState(null);
    const [brandName, setBrandName] = useState("");
    const [deleteField, setDeleteField] = useState([]);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)

    useEffect(() => {
        if (permissions && permissions.formBuilder) {
            setFormBuilderPermissions(permissions.formBuilder);
        }
    }, [permissions]);

    const onBackButtonEvent = (e) => {
        e.preventDefault();
        window.history.pushState(null, null, window.location.pathname);
        if (formBuilderPermissions.isUpdate) setShowConfirmDialog(true)
    }

    useEffect(() => {
        window.history.pushState(null, null, window.location.pathname);
        window.addEventListener('popstate', onBackButtonEvent);
        return () => {
            window.removeEventListener('popstate', onBackButtonEvent);
        };
    }, []);

    useEffect(() => {
        fetchBrandResourceData()
    }, []);

    const fetchBrandResourceData = async () => {
        axiosInstance().get(`/sa-formbuilder/resourcedata/` + resource).then(({ data: { data } }) => {
            setSection(data.section)
            setOriSection(JSON.parse(JSON.stringify(data.section)))
            setBrandName(data.brandName)
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    };

    const handleSave = async () => {
        let data = []
        let order = 0;
        section.forEach(_section => {
            _section.field.forEach(_field => {
                let _field_data = _field
                _field_data._id = _field_data._id.toString();
                _field_data.sectionName = _section.sectionName
                if (!isNaN(_field._id)) {
                    _field_data.fieldName = camelCase(_field.fieldLabel.replace(/[^a-zA-Z0-9]/g, ''))
                }
                _field_data.order = ++order
                data.push(_field_data)
            })
        })
        if ((resource.toString()).toLowerCase() === "product") {
            if (data.filter((e) => e.fieldName === "productTemplate").length) {
                var otherField = []
                await axiosInstance().get(`/product-template/allfields`).then(({ data: { data } }) => {
                    otherField = data;
                }).catch((error) => {
                });
                const result = checkUniqueValidation(data, otherField);
                if (result.error) {
                    toastConfig.setToastConfig({
                        open: true,
                        type: "error",
                        message: result.message,
                    });
                    return false;
                }
            }
        }
        const result = checkFormulaLoop(data);
        if (result.error) {
            toastConfig.setToastConfig({
                open: true,
                type: "error",
                message: result.message,
            });
            return false;
        }

        let sendData: any = {}
        sendData.resource = resource;
        sendData.field = data;
        sendData.deleteField = deleteField;
        setIsUpdating(true)
        axiosInstance().put(`/sa-formbuilder/resourcedata`, sendData).then(({ data: { data } }) => {
            setIsUpdating(false)
            history.push({ pathname: routes.formBuilder.path });
        }).catch((error) => {
            setIsUpdating(false)
            toastConfig.setToastConfig(error);
        });
    };

    const handleExportFields = () => {
        var dataStr =
            "data:text/json;charset=utf-8," +
            encodeURIComponent(JSON.stringify(section));
        var dlAnchorElem = document.getElementById("downloadAnchorElem");
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", "template_field.json");
        dlAnchorElem.click();
    };

    const handleImportFields = (e) => {
        e.preventDefault();
        var files = e.target.files,
            f = files[0];
        var reader = new FileReader();
        reader.onload = function (e) {
            var data: any = e.target.result;
            setSection(JSON.parse(data));
        };
        reader.readAsBinaryString(f);
    };

    return (<Fragment>
        <Grid container className="headerbox">
            <Grid item md={4} sm={11} xs={10}>
                <CustomBreadCrumbs routes={[routes.formBuilder, { title: resource }]}
                    isConfirmBeforeClick={true}
                    onBreadCrumbClick={(path) => {
                        if ((!isEqual(orisection, section)) && formBuilderPermissions.isUpdate) {
                            setShowConfirmDialog(true)
                        }
                        else history.push({ pathname: routes.formBuilder.path })
                    }}
                />
            </Grid>
            <Grid container justify="flex-end" item md={8} sm={1} xs={2}>
                <label
                    htmlFor="importField"
                    style={{ color: "white" }}
                    className="cursor-pointer mr-3"
                >
                    Import Fields
                    <input
                        onClick={(e: any) => (e.target.value = null)}
                        id="importField"
                        name="importField"
                        onChange={handleImportFields}
                        style={{
                            opacity: "0",
                            position: "absolute",
                            zIndex: -1,
                        }}
                        type="file"
                    />
                </label>
                <label
                    style={{ color: "white" }}
                    className="cursor-pointer"
                    onClick={handleExportFields}
                >
                    Export Fields
                </label>
                <a id="downloadAnchorElem" style={{ display: "none" }}></a>
            </Grid>
        </Grid>
        <CustomContainer>
            {section ?
                <Fragment>
                    <Box p={1} pb={0} ml={1} bgcolor="white" >
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
                                    {formBuilderPermissions.isUpdate &&
                                        <Button disabled={isUpdating} color="primary" size="small" onClick={handleSave} variant="contained" >
                                            Save
                                            {isUpdating && <CircularProgress size={24} />}
                                        </Button>
                                    }
                                </Box>
                                <Box ml={1} >
                                    <Button color="primary" variant="contained" size="small"
                                        onClick={() => {
                                            if ((!isEqual(orisection, section)) && formBuilderPermissions.isUpdate) {
                                                setShowConfirmDialog(true)
                                            }
                                            else {
                                                history.push({ pathname: routes.formBuilder.path })
                                            }
                                        }} > Close</Button>
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
                            isCustomField={false}
                            extraFields={[]}
                            module="form-builder"
                            resource={resource}
                        />
                    </Box>
                    {
                        showConfirmDialog ?
                            <ConfirmCancelDialog
                                open={showConfirmDialog}
                                onSave={() => {
                                    setShowConfirmDialog(false)
                                    handleSave();
                                }}
                                onClose={() => {
                                    setShowConfirmDialog(false)
                                    history.push({ pathname: routes.formBuilder.path })
                                }}
                            /> : null
                    }
                </Fragment>
                :
                <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>
            }
        </CustomContainer>
    </Fragment >
    );
}

export default CreateFormBuilder;
