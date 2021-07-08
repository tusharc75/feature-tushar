import React, { useContext, useEffect, useState } from "react";
import {
  TextField,
  Grid,
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from "@material-ui/core";

import { useParams, useHistory } from "react-router-dom";

import { Formik, Form } from "formik";
import * as Yup from "yup";

import { FormBuilder } from "../../components/FormBuilder";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import Layout from "../../components/Layout";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import { camelCase, map, uniq } from "lodash";
import axiosInstance from "../../axios/axiosInstance";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import routes from "../../components/Helpers/Routes";

const PdfTemplateSchema = Yup.object().shape({
  name: Yup.string()
    .min(3, "Too Short!")
    .max(50, "Too Long")
    .required("name is required"),
  showPageNumberInFooter: Yup.boolean(),
});

const seedData = [
  {
    _id: "60e57ae7801802b66486e326",
    fieldLabel: "Header Column 1",
    type: "singleLine",
    option: [],
    required: false,
    isTooltip: false,
    tooltipMessage: "",
    editAble: true,
    order: 4,
    hiddenField: false,
    isDefaultValue: true,
    defaultValue: "",
    fieldName: "headerColumn1",
    sectionName: "Header",
  },
  {
    _id: "60e57ae7801802b66486e327",
    fieldLabel: "Header Column 2",
    type: "imageUpload",
    option: [],
    required: false,
    isTooltip: false,
    tooltipMessage: "",
    editAble: true,
    order: 5,
    hiddenField: false,
    isDefaultValue: true,
    defaultValue:
      "",
    fieldName: "headerColumn2",
    sectionName: "Header",
  },
  {
    _id: "60e57ae7801802b66486e328",
    fieldLabel: "Footer Column 1",
    type: "multiLine",
    option: [],
    required: false,
    isTooltip: false,
    tooltipMessage: "",
    editAble: true,
    order: 6,
    hiddenField: false,
    isDefaultValue: true,
    defaultValue: "",
    fieldName: "footerColumn1",
    sectionName: "Footer",
  },
  {
    _id: "60e57ae7801802b66486e329",
    fieldLabel: "Footer Column 2",
    type: "singleLine",
    option: [],
    required: false,
    isTooltip: false,
    tooltipMessage: "",
    editAble: true,
    order: 7,
    hiddenField: false,
    isDefaultValue: true,
    defaultValue: "",
    fieldName: "footerColumn2",
    sectionName: "Footer",
  },
];

const CreateQuotePdfTemplate = () => {
  const history = useHistory();
  const { id } = useParams();
  const toastConfig = useContext(CustomToastContext);
  const [isUpdating, setIsUpdating] = useState(false);
  const [initialValues, setInitialValues] = useState(null);
  const [section, setSection] = useState([]);
  const [deleteField, setDeleteField] = useState([]);

  useEffect(() => {
    const _data = [];
    const _section = uniq(map(seedData, "sectionName"));
    _section.forEach((element: any, index: number) => {
      _data.push({
        sectionId: index,
        sectionName: element,
        field: seedData.filter((el: any) => el.sectionName === element),
      });
    });
    setSection(_data);
  }, []);
  useEffect(()=>{
    if(id && id != 0){
     (async ()=>{
       try{
         const res = await axiosInstance().get(`/quote-pdf-template/${id}`)
         const {data:{data}} = res;
         setInitialValues(data);
         setSection(data.section);
       }catch(e){
        toastConfig.setToastConfig(e);
       }
      })()
    }else{
      setInitialValues({
        name: "",
        showPageNumberInFooter: false,
      })
    }
  },[id])

  const handleSave = (values) => {
    const data: any = {};
    data.name = values.name;
    data.showPageNumberInFooter = values.showPageNumberInFooter;

    let fields: any = [];
    let order = 0;
    section.forEach((_section) => {
      _section.field.forEach((_field) => {
        let _field_data = _field;
        _field_data._id = _field_data._id.toString();
        _field_data.sectionName = _section.sectionName;
        if (!isNaN(_field._id)) {
          _field_data.fieldName = camelCase(
            _field.fieldLabel.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, "")
          );
        }
        _field_data.order = ++order;
        fields.push(_field_data);
      });
    });
    data.fields = fields;

    setIsUpdating(true);

    if (id === "0") {
      axiosInstance()
        .post("/quote-pdf-template", data)
        .then(({ data: { data } }) => {
          setIsUpdating(false);
          history.push({ pathname: routes.quotePdfTemplate.path });
        })
        .catch((error) => {
          setIsUpdating(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      data.templateId = id;
      data.deleteField = deleteField;
      axiosInstance()
        .put("/quote-pdf-template", data)
        .then(({ data: { data } }) => {
          setIsUpdating(false);
          history.push({ pathname: routes.quotePdfTemplate.path });
        })
        .catch((error) => {
          setIsUpdating(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  return (
    <Layout>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs
            routes={[
              {
                title: routes.quotePdfTemplate.title,
                path: routes.quotePdfTemplate.path,
              },
              {
                title: id === "0" ? "New" : initialValues && initialValues.name,
              },
            ]}
          />
        </Grid>
        <Grid container justify="flex-end" item md={8} sm={1} xs={2}></Grid>
      </Grid>
      <div className="main-container">
        {initialValues ? (
          <Formik
            initialValues={initialValues}
            validationSchema={PdfTemplateSchema}
            onSubmit={handleSave}
          >
            {({ submitForm, touched, errors, setFieldValue, values }) => (
              <Form>
                <Box p={1} ml={1} bgcolor="white">
                  <Grid container spacing={4} alignItems="center">
                    <Grid item xs={12} sm={3}>
                      <TextField
                        variant="outlined"
                        type="text"
                        label="Price Template Name"
                        required={true}
                        name="name"
                        fullWidth
                        margin="dense"
                        value={values["name"]}
                        error={touched["name"] && Boolean(errors["name"])}
                        helperText={touched["name"] && errors["name"]}
                        onChange={(e) =>
                          setFieldValue("name", e.target.value.trimStart())
                        }
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <FormControlLabel
                        value={values["showPageNumberInFooter"]}
                        control={
                          <Checkbox
                            name="showPageNumberInFooter"
                            checked={values["showPageNumberInFooter"]}
                            onChange={(e) =>
                              setFieldValue(
                                "showPageNumberInFooter",
                                e.target.checked
                              )
                            }
                            color="primary"
                          />
                        }
                        label="Show page number in footer"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} container justify="flex-end">
                      <Box>
                        <Button
                          disabled={isUpdating}
                          size="small"
                          color="primary"
                          onClick={submitForm}
                          variant="contained"
                        >
                          Save{isUpdating && <CircularProgress size={24} />}
                        </Button>
                      </Box>
                      <Box ml={1}>
                        <Button
                          color="primary"
                          size="small"
                          variant="contained"
                          onClick={() => {
                            history.push({
                              pathname: routes.quotePdfTemplate.path,
                            })
                          }}
                        >
                          Close
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
                <Box>
                  <FormBuilder
                    section={section}
                    setSection={setSection}
                    deleteField={deleteField}
                    setDeleteField={setDeleteField}
                    isCustomField={true}
                    extraFields={[]}
                    module="pdf-template"
                  />
                </Box>
              </Form>
            )}
          </Formik>
        ) : (
          <Box p={2} height={500} bgcolor="white">
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </div>
    </Layout>
  );
};

export default CreateQuotePdfTemplate;
