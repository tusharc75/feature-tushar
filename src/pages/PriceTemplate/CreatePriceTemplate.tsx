import { useState, useEffect, useContext, Fragment, useRef } from "react";
import {
  Box,
  Grid,
  Typography,
  Button,
  CircularProgress,
  Menu,
  MenuItem,
  IconButton,
  makeStyles,
  useMediaQuery
} from "@material-ui/core";
import { useParams, useHistory } from "react-router-dom";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import { FormBuilder } from "../../components/FormBuilder";
import { Formik, Form } from "formik";
import { object, string } from "yup";
import TextField from "@material-ui/core/TextField";
import { camelCase } from "../../constants/helpers";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../axios/axiosInstance";
import routes from "../../components/Helpers/Routes";
import { Autocomplete } from "@material-ui/lab";
import { uniq, map, isEqual } from "lodash";
import { extractFields, checkFormulaLoop } from "../../constants/formulaUtility";
import { useData } from "../../StateProvider/Provider";
import HistoryButton from "../../components/Helpers/HistoryButton";
import HistoryDialog from "../../components/Activity/History"
import { priceTemplate } from "../../constants/helpers"
import ConfirmCancelDialog from "../../components/ConfirmCancelDialog"
import { IoIosArrowDropdown } from "react-icons/io";


const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
    flexGrow: 1,
    display: "flex",
    justifyContent: "flex-end",
  },
  linksContainer: {
    display: "flex",
    justifyContent: "flex-end",
    ["@media (max-width: 960px)"]: {
      display: "none",
    },
  },
  menuButtonList: {
    alignItems: "flex-start",
    padding: "1px"
  },
  delBtn: {
    color: "red",
  },
  expandIcon: {
    position: "absolute",
    right: "0",
    color: "white"
  }

}));

const PriceTemplateSchema = object().shape({
  name: string()
    .min(3, "Too Short!")
    .max(50, "Too Long")
    .required("name is required"),
  productTemplate: string().required("product template is required"),
  owner: string().required('Owner is required'),
});

const PriceTemplate = () => {

  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const { id } = useParams();
  const [isClone] = useState(history.location.state?.isClone ? true : false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [initialValues, setInitialValues] = useState(null);
  const [section, setSection] = useState([]);
  const [deleteField, setDeleteField] = useState([]);
  const [productTemplate, setProductTemplate] = useState([]);
  const [productField, setProductField] = useState([]);
  const [templateField, setTemplateField] = useState([]);
  const [showHistory, setShowHistory] = useState(false)
  const [ownerCollaboratorData, setOwnerCollaboratorData] = useState([]);
  const [ownerCollaboratorDataConst, setOwnerCollaboratorDataConst] = useState([]);
  const [hasPermissionToUpdate, setHasPermissionToUpdate] = useState(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isBreakCrumbPath, setIsBreakCrumbPath] = useState("")
  const ref = useRef(null);

  const classes = useStyles();
  const isMobile = useMediaQuery("(max-width: 960px)");


  const {
    state: { user, permissions, selectedEntity },
  }: any = useData();
  const [priceTemplatePermissions, setpriceTemplatePermissions] = useState({
    isCreate: false,
    isUpdate: false,
    isRead: false,
    isDelete: false,
  });

  const onBackButtonEvent = (e) => {
    if (hasPermissionToUpdate) {
      e.preventDefault();
      window.history.pushState(null, null, window.location.pathname);
      if (!isEqual(ref.current.values, initialValues) || !isEqual(initialValues.section, section)) {
        if ((id === "0" && priceTemplatePermissions.isCreate) ||
          (id !== "0" && priceTemplatePermissions.isUpdate)) {
          setShowConfirmDialog(true)
        }
        else {
          history.push({ pathname: isBreakCrumbPath ? isBreakCrumbPath : routes.priceTemplate.path })
        }
      }
      else {
        history.push({ pathname: isBreakCrumbPath ? isBreakCrumbPath : routes.priceTemplate.path })
      }
    }
  }




  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };


  useEffect(() => {
    window.history.pushState(null, null, window.location.pathname);
    window.addEventListener('popstate', onBackButtonEvent);
    return () => {
      window.removeEventListener('popstate', onBackButtonEvent);
    };
  }, []);

  useEffect(() => {
    if (permissions && permissions.priceTemplate) {
      setpriceTemplatePermissions(permissions.priceTemplate);
    }
  }, [permissions]);

  useEffect(() => {
    axiosInstance().get("/field?resource=Product").then(({ data: { data } }) => {
      const _productField: any = []
      data.forEach((_f) => {
        _productField.push(_f.fieldData)
      })
      setProductField([...extractFields(_productField)]);
    })
    axiosInstance()
      .get(`/product-template`)
      .then(({ data }) => {
        setProductTemplate(data.data);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
    fetchOnePriceTemplate();
    fetchUser();
  }, [id]);

  const fetchOnePriceTemplate = () => {
    if (id === "0") {
      let entities = selectedEntity ? [selectedEntity] : []
      setInitialValues({ name: "", productTemplate: "", entity: entities, owner: user.user._id, collaborator: [] });
      setHasPermissionToUpdate(true)
      axiosInstance()
        .get(`/price-template/default-field`)
        .then(({ data: { data } }) => {
          const _data = [];
          const _section = uniq(map(data.fields, "sectionName"));
          _section.forEach((element: any, index: number) => {
            _data.push({
              sectionId: index,
              sectionName: element,
              field: data.fields.filter(
                (el: any) => el.sectionName === element
              ),
            });
          });
          setSection(_data);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    } else {
      axiosInstance()
        .get(`/price-template/` + id)
        .then(({ data: { data } }) => {
          if (!data.owner) {
            data.owner = user.user._id
          }
          if (isClone) {
            data.name = "";
            setHasPermissionToUpdate(true);
            const { _id, name, createdBy, updatedBy, isSystem, ...rest } = data;
            setInitialValues(rest);
            handleProductTemplateField(data.productTemplate);
            setSection(data.section);
          }
          else {
            setInitialValues(data);
            handleProductTemplateField(data.productTemplate);
            setSection(JSON.parse(JSON.stringify(data.section)));
            if (data?.owner && data?.owner !== undefined && user.user._id !== data?.owner && !data?.collaborator?.some(d => d === user.user._id)) {
              setHasPermissionToUpdate(false)
            } else {
              setHasPermissionToUpdate(true)
            }
          }
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };


  const fetchUser = () => {
    axiosInstance().get(`/user`).then(({ data: { data } }) => {
      setOwnerCollaboratorData(data);
      setOwnerCollaboratorDataConst(data);
    }).catch((error) => {
      toastConfig.setToastConfig(error);
    });
  };

  const handleSave = (values) => {
    let data: any = {};
    data.name = values.name;
    data.productTemplate = values.productTemplate;
    data.entity = values?.entity;
    data.owner = values?.owner;
    data.collaborator = values?.collaborator;
    const resultproductTemplate = productTemplate.filter(
      (_f) => _f._id === values.productTemplate
    );
    if (resultproductTemplate.length) {
      data.isStandard = resultproductTemplate[0].isStandard;
      data.productCategory = resultproductTemplate[0].productCategory;
    }

    let fields: any = [];
    let order = 0;
    section.forEach((_section) => {
      _section.field.forEach((_field) => {
        let _field_data = _field;
        _field_data._id = _field_data._id.toString();
        _field_data.sectionName = _section.sectionName;
        if (!isNaN(_field._id)) {
          _field_data.fieldName = camelCase(
            _field.fieldLabel.replace(/[^a-zA-Z0-9]/g, "")
          );
        }
        _field_data.order = ++order;
        fields.push(_field_data);
      });
    });
    data.fields = fields;
    const result = checkFormulaLoop([...productField, ...templateField, ...data.fields]);
    if (result.error) {
      toastConfig.setToastConfig({
        open: true,
        type: "error",
        message: result.message,
      });
      return;
    }
    setIsUpdating(true);
    if (id === "0" || isClone) {
      axiosInstance()
        .post("/price-template", data)
        .then(({ data: { data } }) => {
          setIsUpdating(false);
          history.push({ pathname: isBreakCrumbPath ? isBreakCrumbPath : routes.priceTemplate.path });
        })
        .catch((error) => {
          setIsUpdating(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      data.templateId = id;
      data.deleteField = deleteField;
      axiosInstance()
        .put("/price-template", data)
        .then(({ data: { data } }) => {
          setIsUpdating(false);
          history.push({ pathname: isBreakCrumbPath ? isBreakCrumbPath : routes.priceTemplate.path });
        })
        .catch((error) => {
          setIsUpdating(false);
          toastConfig.setToastConfig(error);
        });
    }
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

  const handleProductTemplateField = (productTemplate_id) => {
    if (productTemplate_id && productTemplate_id !== "") {
      axiosInstance()
        .get(`/product-template/fields/` + productTemplate_id)
        .then(({ data: { data } }) => {
          setTemplateField([...extractFields(data.fields)]);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    } else {
      setTemplateField([]);
    }
  };

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs
            routes={[
              {
                title: routes.priceTemplate.title,
                path: routes.priceTemplate.path,
              },
              {
                title: id === "0" || isClone ? "New" : initialValues && initialValues.name,
              },
            ]}
            isConfirmBeforeClick={hasPermissionToUpdate}
            onBreadCrumbClick={(path) => {
              setIsBreakCrumbPath(path)
              if (hasPermissionToUpdate && (!isEqual(ref.current.values, initialValues) ||
                !isEqual(initialValues.section, section))) {
                if ((id === "0" && priceTemplatePermissions.isCreate) ||
                  (id !== "0" && priceTemplatePermissions.isUpdate)) {
                  setShowConfirmDialog(true)
                }
                else {
                  history.push({ pathname: isBreakCrumbPath ? isBreakCrumbPath : routes.priceTemplate.path })
                }
              }
              else history.push({ pathname: isBreakCrumbPath ? isBreakCrumbPath : path })
            }}
          />
        </Grid>
        <Grid container justify="flex-end" item md={8} sm={1} xs={2} className="pr-3">

          <div className={classes.linksContainer}>
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
          </div>

          <Menu
            id="importField"
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem
            >
              <label
                htmlFor="importField"
                className="cursor-pointer"
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

            </MenuItem>
            <MenuItem
              onClick={handleExportFields}
            >
              Export Fields
            </MenuItem>
            {/* <MenuItem>Email a Link</MenuItem> */}
          </Menu>
          {isMobile && (
            <IconButton onClick={handleClick} className={classes.menuButtonList}>
              <IoIosArrowDropdown className={classes.expandIcon} />
            </IconButton>
          )}

        </Grid>
      </Grid>
      <div className="main-container">
        {initialValues ? (
          <Formik
            innerRef={ref}
            initialValues={initialValues}
            validationSchema={PriceTemplateSchema}
            onSubmit={handleSave}
          >
            {({ submitForm, touched, errors, setFieldValue, values }) => (
              <Form>
                <h2 className="form-label-style" style={{ borderBottom: "none" }}>* Required Fields</h2>
                <Box p={1} ml={1} bgcolor="white">
                  <Grid container spacing={1}>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        disabled={!hasPermissionToUpdate}
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
                      <Autocomplete
                        disabled={!hasPermissionToUpdate}
                        options={productTemplate}
                        getOptionLabel={(option: any) =>
                          option ? option.name : ""
                        }
                        getOptionSelected={(option: any, val) =>
                          option._id === val
                        }
                        value={
                          productTemplate.filter(
                            (data) => data._id === values["productTemplate"]
                          ).length
                            ? productTemplate.filter(
                              (data) => data._id === values["productTemplate"]
                            )[0]
                            : ""
                        }
                        onChange={(e, val) => {
                          setFieldValue(
                            "productTemplate",
                            val && val._id ? val._id : ""
                          );
                          if (val && val.name) {
                            setFieldValue("name", val.name);
                          }
                          handleProductTemplateField(
                            val && val._id ? val._id : ""
                          );
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            margin="dense"
                            name="productTemplate"
                            label="Product Template"
                            variant="outlined"
                            error={
                              touched["productTemplate"] &&
                              Boolean(errors["productTemplate"])
                            }
                            helperText={
                              touched["productTemplate"] &&
                              errors["productTemplate"]
                            }
                            required={true}
                            fullWidth
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} container justify="flex-end">
                      <HistoryButton onClick={() => setShowHistory(true)} />
                      <Box>
                        {((id === "0" && priceTemplatePermissions.isCreate) ||
                          (id !== "0" && priceTemplatePermissions.isUpdate)
                        ) && (
                            <Button
                              disabled={isUpdating || !hasPermissionToUpdate}
                              size="small"
                              color="primary"
                              onClick={submitForm}
                              variant="contained"
                            >
                              Save{isUpdating && <CircularProgress size={24} />}
                            </Button>
                          )}
                      </Box>
                      <Box ml={1}>
                        <Button
                          color="primary"
                          size="small"
                          variant="contained"
                          onClick={() => {
                            if (hasPermissionToUpdate && (!isEqual(ref.current.values, initialValues) ||
                              !isEqual(initialValues.section, section))) {
                              if ((id === "0" && priceTemplatePermissions.isCreate) ||
                                (id !== "0" && priceTemplatePermissions.isUpdate)) {
                                setShowConfirmDialog(true)
                              }
                              else {
                                history.push(routes.priceTemplate.path)
                              }
                            }
                            else {
                              history.push(routes.priceTemplate.path)
                            }
                          }}  >
                          Close
                        </Button>
                      </Box>
                    </Grid>
                    <Grid container spacing={1}>
                      <Grid item xs={12} sm={3}>
                        {<Autocomplete
                          disabled={!hasPermissionToUpdate}
                          multiple
                          options={user?.entity}
                          getOptionLabel={(option: any) => (option ? option?.entityName : "")}
                          value={user?.entity.filter((data) => values["entity"]?.some(d => d === data._id)).length
                            ? user?.entity.filter((data) => values["entity"]?.some(d => d === data._id))
                            : []}
                          onChange={(e, val) => {
                            setFieldValue("entity", val && val?.map(d => d._id))
                            val && val.length !== 0 ?
                              setOwnerCollaboratorData(ownerCollaboratorDataConst.filter(data => val?.some(d => data.entities?.some(e => e.entity === d._id))))
                              : setOwnerCollaboratorData(ownerCollaboratorDataConst)
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
                          disabled={!hasPermissionToUpdate}
                          getOptionLabel={(option: any) => (option ? option?.concatedName : "")}
                          value={ownerCollaboratorData.filter((data) => data._id === values["owner"]).length
                            ? ownerCollaboratorData.filter((data) => data._id === values["owner"])[0]
                            : ""}
                          options={ownerCollaboratorData.filter(user => !values["collaborator"]?.some((d) => (user._id === d)))}
                          onChange={(e, val) => {
                            setFieldValue("owner", val && val._id ? val._id : "");
                          }}
                          onOpen={() =>
                            values["entity"] && values["entity"].length !== 0 ?
                              setOwnerCollaboratorData(ownerCollaboratorDataConst.filter(data => values["entity"]?.some(d => data.entities?.some(e => e.entity === d))))
                              : setOwnerCollaboratorData(ownerCollaboratorDataConst)
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              margin="dense"
                              name="owner"
                              label="Owner"
                              variant="outlined"
                              error={touched["owner"] && Boolean(errors["owner"])}
                              helperText={touched["owner"] && errors["owner"]}
                              required={true}
                              fullWidth
                            />
                          )}
                        />}
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        {<Autocomplete
                          disabled={!hasPermissionToUpdate}
                          multiple
                          options={ownerCollaboratorData.filter(d => d._id !== values["owner"])}
                          getOptionLabel={(option: any) => (option ? option?.concatedName : "")}
                          value={ownerCollaboratorData.filter((data) => values["collaborator"]?.some(d => d === data._id)).length
                            ? ownerCollaboratorData.filter((data) => values["collaborator"]?.some(d => d === data._id))
                            : []}
                          onChange={(e, val) => {
                            setFieldValue("collaborator", val && val?.map(d => d._id))
                          }}
                          onOpen={() =>
                            values["entity"] && values["entity"].length !== 0 ?
                              setOwnerCollaboratorData(ownerCollaboratorDataConst.filter(data => values["entity"]?.some(d => data.entities?.some(e => e.entity === d))))
                              : setOwnerCollaboratorData(ownerCollaboratorDataConst)
                          }
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
                  </Grid>
                </Box>
                <Box>
                  <FormBuilder
                    section={section}
                    setSection={setSection}
                    deleteField={deleteField}
                    setDeleteField={setDeleteField}
                    isCustomField={true}
                    extraFields={[...productField, ...templateField]}
                    module="price-template"
                    resource=""
                  />
                </Box>
                {
                  showConfirmDialog ?
                    <ConfirmCancelDialog
                      close={() => setShowConfirmDialog(false)}
                      open={showConfirmDialog}
                      onSave={() => {
                        setShowConfirmDialog(false)
                        submitForm();
                      }}
                      onClose={() => {
                        setShowConfirmDialog(false)
                        history.push({
                          pathname: isBreakCrumbPath ? isBreakCrumbPath : routes.priceTemplate.path,
                        })
                      }}
                    /> : null
                }
              </Form>
            )}
          </Formik>
        ) : (
          <Box p={2} height={500} bgcolor="white">
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
        {
          showHistory ? <HistoryDialog
            open={showHistory}
            resourceId={initialValues?._id}
            resource={priceTemplate.priceTemplateRoute}
            onClose={() => setShowHistory(false)}
          /> : null
        }
      </div>
    </Fragment >
  );
};

export default PriceTemplate;
