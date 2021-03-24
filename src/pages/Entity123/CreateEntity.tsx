import React, { useState, useEffect } from "react";
import clsx from "clsx";
import { Formik, Form } from "formik";
import {
  Box,
  Button,
  CircularProgress,
  Checkbox,
  Typography,
  Paper,
  TextField,
  Grid,
  makeStyles,
  useTheme,
} from "@material-ui/core";
import { People, Settings } from "@material-ui/icons";
import { DataGrid, GridToolbar } from "@material-ui/data-grid";
import { useLocation, useHistory, Redirect } from "react-router-dom";
import moment from "moment";

import Layout from "../../components/Layout";
import Container from "../../components/Container";
import Loader from "../../components/Loader";
import InputField from "../../components/Helpers/InputField";
import CustomStepper from "../../components/Helpers/CustomStepper";
import CustomToast from "../../components/Helpers/CustomToast";
import RolesTable from "../../components/Helpers/RolesTable";
import FullScreenDialog from "../../components/Helpers/FullScreenDialog";
import RoleEngine from "../../components/BrandCreation/RoleEngine";
import {
  getObjKeys,
  removeEmptyKeys,
  yupSchema,
} from "../../constants/helpers";
import {
  GetFields,
  PostEntity,
  GetUsers,
  UpdateEntity,
  PostUsers,
  PostRoles,
} from "../../axios";
import NoDataCell from '../../components/Helpers/NoDataCell'
import DataGridCustomToolbar from '../../components/Helpers/DataGridCustomToolbar';

const useStyles = makeStyles((theme) => ({
  tab: {
    minWidth: "200px",
    display: "flex",
    background: theme.palette.background.default,
    padding: theme.spacing(1.2),
    marginRight: "10px",
    cursor: "pointer",
    borderRadius: 0,
    borderBottom: `4px solid #ddd`,
    color: "#aaa",

    "&:hover": {
      borderBottom: `4px solid ${theme.palette.primary.main}`,
      background: theme.palette.background.default,
    },

    "&;last-child": {
      marginRight: 0,
    },
  },
  activeTab: {
    borderBottom: `4px solid ${theme.palette.primary.main}`,
    background: theme.palette.background.default,
    color: theme.palette.primary.main,
  },
}));

const CreateEntity = () => {
  const classes = useStyles();
  const theme = useTheme();
  const history = useHistory();
  const { state } = useLocation();

  const [selectedTab, setSelectedTab] = useState("Details");
  const [option, setOption] = useState(null);

  const [newUsers, setNewUsers] = useState([]);
  const [newRoleUsers, setNewRoleUsers] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [postingRoles, setPostingRoles] = useState(false);

  const [openDialog, setOpenDialog] = useState(false);

  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(false);
  const [errorMsg, setErroMsg] = useState("");
  const [msgType, setMsgType] = useState("");

  const [loadingTableData, setLoadingTableData] = useState(true);
  const [brandUsersRows, setBrandUsersRows] = useState([]);
  const [selectedUsers, setSelectedUser] = useState([]);
  const [checkAllUsers, setCheckAllUsers] = useState(false);

  const [field, setField] = useState([]);
  const [resource, setResource] = useState([]);
  const [roleValues, setRoleValues] = useState({
    name: "",
    description: "",
  });

  const [isSubmitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingFields, setLoadingFields] = useState(true);
  const [createdEntity, setCreatedEntity] = useState(null);
  const [entityData, setEntityData] = useState({
    fields: [],
    initialValues: {},
  });

  const [steps, setSteps] = useState([{ label: "Details", valid: true }, { label: "Roles", valid: true }]);

  useEffect(() => {
    if (state) {
      GetFields("Entity", state.brand_id).then(({ data }) => {
        const newFields = [];
        data.map((_f) => newFields.push(_f.fieldData));

        setEntityData({
          fields: newFields,
          initialValues: getObjKeys("", newFields),
        });
        setLoading(false);
      });

      fetchRoleData();
    }

    return () => {
      setCreatedEntity(null);
    };

    // eslint-disable-next-line
  }, []);

  const fetchRoleData = () => {
    setLoadingFields(true);
    GetFields("Role", state.brand_id)
      .then(({ data }) => {
        setField(data.field);
        setResource(data.resource);
        setLoadingFields(false);
      })
      .catch((err) => {
        setLoadingFields(false);
        console.log(err);
      });
  };

  // ****** FOR BRAND USERS ********
  const brandUserCols = [
    {
      field: "isChecked",
      headerName: "Checkbox",
      renderHeader: () => (
        <Checkbox
          color="primary"
          checked={checkAllUsers}
          onChange={(ev) => {
            setCheckAllUsers(ev.target.checked);
            const gridData = brandUsersRows;
            gridData.map((d) => {
              d.isChecked = ev.target.checked;

              return d;
            });
            setBrandUsersRows([...gridData]);
          }}
        />
      ),
      renderCell: (params) => (
        <Checkbox
          color="primary"
          checked={params.value}
          onChange={(ev) => {
            const gridData = brandUsersRows;
            const indexOfRecord = gridData.findIndex(
              (d) => d.id === params.row.id
            );
            gridData[indexOfRecord].isChecked = ev.target.checked;

            setBrandUsersRows([...gridData]);

            const checkedRecords = gridData.filter((d) => d.isChecked === true);

            if (checkedRecords.length === gridData.length) {
              setCheckAllUsers(true);
            } else {
              setCheckAllUsers(false);
            }

            setSelectedUser(checkedRecords);
          }}
        />
      ),
      disableColumnMenu: true,
      sortable: false,
      filterable: false,
      width: 75,
    },
    {
      field: "name", headerName: "Name", width: 150,
      renderCell: (params) => (
        <>
          {
            params?.value ?? <NoDataCell />
          }
        </>
      )
    },
    {
      field: "email", headerName: "Email", width: 300,
      renderCell: (params) => (
        <>
          {
            params?.value ?? <NoDataCell />
          }
        </>
      )
    },
    {
      field: "createdAt", headerName: "Created At", width: 150,
      renderCell: (params) => (
        <>
          {
            params?.value ?? <NoDataCell />
          }
        </>
      )
    },
  ];
  // ****** CREATE ROWS FOR BRAND USERS ********
  const getBrandUsersRow = (rowsData) => {
    const selectedOnes = brandUsersRows.filter((row) => row.isChecked === true);
    if (selectedOnes.length === brandUsersRows.length) {
      setCheckAllUsers(true);
    } else {
      setCheckAllUsers(false);
    }
    let rows = rowsData?.map((row) => ({
      id: row._id,
      isChecked: newRoleUsers.find((user) => user.id === row._id),
      name: `${row.firstName} ${row.lastName}`,
      email: row.email,
      createdAt: moment(row.createdAt).format("MM/DD/YYYY"),
    }));
    setBrandUsersRows(rows);
  };

  // *** ROLES USERS COLUMN ****
  const roleUsersCols = [
    { field: "name", headerName: "Name", width: 150 },
    { field: "email", headerName: "Email", width: 200 },
  ];

  // ******** GET ALL USERS FOR SELECTED BRAND ********
  const getBrandUsers = () => {
    GetUsers(state.brand_id)
      .then(({ data }) => {
        getBrandUsersRow(data);

        setLoadingTableData(false);
      })
      .catch((err) => {
        setLoadingTableData(false);
        console.log(err);
      });
  };

  // ****** SAVE ENTITY TO DB ********
  const saveEntity = (values) => {
    setSubmitting(true);
    // const vals = removeEmptyKeys(values);

    const postData = {
      brand: state.brand_id,
      ...values,
    };

    PostEntity(postData)
      .then(({ data }) => {
        setCreatedEntity(data);
        setSubmitting(false);
        setStep((prevState) => prevState + 1);
      })
      .catch((err) => {
        setSubmitting(false);
        openSnackbar("Something went wrong", "error");
        console.log(err);
      });
  };

  //  *****UPDATE******
  const updateEntity = (values) => {
    setSubmitting(true);
    // const vals = removeEmptyKeys(values);

    const postData = {
      _id: createdEntity._id,
      ...values,
    };

    UpdateEntity(postData)
      .then(({ data }) => {
        console.log(data);
        setSubmitting(false);
        setStep((prevState) => prevState + 1);
      })
      .catch((err) => {
        setSubmitting(false);
        openSnackbar("Something went wrong", "error");
        console.log(err);
      });
  };

  // ***** HANDLE NEXT BUTTON ******
  const handleClickNext = (errors, setFieldTouched, values) => {
    if (step === 0) {
      if (!Object.keys(errors).length) {
        setEntityData({ ...entityData, initialValues: values });
        if (createdEntity) {
          updateEntity(values);
          handleSubmitRole();
        } else {
          saveEntity(values);
        }
      } else {
        entityData.fields.forEach((field) => {
          if (field.required) {
            setFieldTouched(field.fieldName, true);
          }
        });
      }
    }
  };

  // **** HANDLE CLICK STEPS *****
  const handleClickStep = (val) => {
    if (createdEntity) {
      setStep(val);
    } else {
      openSnackbar("First save an entity", "info");
    }
  };

  // **** OPEN SNACK ***** :)
  const openSnackbar = (msg, type) => {
    setErroMsg(msg);
    setMsgType(type);
    setOpen(true);
  };
  const closeSnackbar = () => {
    setOpen(false);
  };

  // ***** CLOSE DIALOG *****
  const closeDialog = () => {
    setOpenDialog(false);
    setOption(null);
  };

  // ***** OPENS DIALOG ******
  const handleClickOpen = (opt) => () => {
    setOption(opt);
    setOpenDialog(true);
  };

  // **** HANDLE CLICK SAVE ****
  const clickSave = () => {
    if (option === "existing") {
      const _users = selectedUsers.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
      }));
      setNewRoleUsers([...newRoleUsers, ..._users]);
      closeDialog();
    }

    if (option === "addNew") {
      if (newUsers.length) {
        if (newUsers.length > 5) {
          openSnackbar("You cannot add more then 5 users", "warning");
        } else {
          const filteredUsers = newUsers.map((_u) => {
            if (_u.client_id) {
              delete _u.client_id;
            }
            return _u;
          });

          const userPostData = {
            brand: state.brand_id,
            user: filteredUsers,
          };
          setIsSaving(true);
          PostUsers(userPostData)
            .then(({ data }) => {
              const users = data.map((_u) => ({
                id: _u._id,
                name: `${_u.firstName} ${_u.lastName}`,
                email: _u.email,
              }));
              setNewRoleUsers([...newRoleUsers, ...users]);
              setIsSaving(false);
              closeDialog();
              setNewUsers([]);
              openSnackbar(
                "Users have been created successfully and saved to the brand",
                "success"
              );
            })
            .catch((err) => {
              openSnackbar(
                "Something went wrong while creating users",
                "error"
              );
              console.log(err);
              setIsSaving(false);
            });
        }
      }
    }
  };

  // ******* SAVE ROLES TO DATABASE ********
  const handleSubmitRole = async () => {
    if (entityData.initialValues["entityName"]) {
      if (roleValues.name && roleValues.description) {
        const usersIds = await newRoleUsers.map((user) => user.id);
        const rolePostData = {
          brand: state.brand_id,

          role: {
            entity: createdEntity._id,
            name: roleValues.name,
            description: roleValues.description,
            field,
            resource,
            user: usersIds,
          },
        };
        setPostingRoles(true);
        PostRoles(rolePostData)
          .then(({ data }) => {
            console.log(data);

            openSnackbar("Role has been created", "success");
            setPostingRoles(true);
            history.push({ pathname: "/entities" });
          })
          .catch((err) => {
            openSnackbar("Something went wrong whole saving role", "error");
            console.log(err);
            setPostingRoles(true);
          });
      } else {
        openSnackbar(" Role name and description must not be empty", "warning");
      }
    } else {
      openSnackbar("First create an entity", "warning");
    }
  };

  /*
   * (**__**)
   **/
  const tabs = ["Details", "Users"];

  return !state ? (
    <Redirect to="/brand" />
  ) : (
    <>
      <FullScreenDialog
        heading="Add Users"
        loading={isSaving}
        open={openDialog}
        close={closeDialog}
        save={clickSave}
      >
        {option === "addNew" && (
          <Container maxWidth="lg">
            {/* <CreateUserForm
              openSnackbar={openSnackbar}
              brand_id={state.brand_id}
              users={newUsers}
              setUsers={setNewUsers}
              isSubmitting={isSubmitting}
            /> */}
          </Container>
        )}
        {option === "existing" && (
          <RolesTable
            loading={loadingTableData}
            columns={brandUserCols}
            rows={brandUsersRows}
            getTableData={getBrandUsers}
          />
        )}
      </FullScreenDialog>
      <CustomToast
        open={open}
        close={closeSnackbar}
        errorMsg={errorMsg}
        type={msgType}
      />
      <Layout>
        <CustomStepper
          steps={steps}
          handleClickStep={handleClickStep}
          value={step}
        />
        <Container styles={{ marginTop: 0 }}>
          <Container maxWidth="md" styles={{ marginTop: 0 }}>
            {loading ? (
              <Loader style={{ height: "50vh" }} text="Loading Fields" />
            ) : (
              <Box marginY={4}>
                <Formik
                  initialValues={entityData.initialValues}
                  validationSchema={yupSchema(entityData.fields)}
                  validateOnMount
                  onSubmit={() => { }}
                >
                  {({
                    setFieldTouched,
                    values,
                    errors,
                    touched,
                    setFieldValue,
                  }) => (
                    <Form>
                      {step === 0 ? (
                        <InputField
                          errors={errors}
                          values={values}
                          setFieldValue={setFieldValue}
                          touched={touched}
                          fieldsData={entityData.fields}
                          size="small"
                          fullWidth
                        />
                      ) : (
                        <Container
                          maxWidth="md"
                          styles={{ marginTop: 0, minHeight: "100%" }}
                        >
                          <Box display="flex" marginY={5}>
                            {tabs.map((item, i) => (
                              <Paper
                                key={i}
                                className={clsx(classes.tab, {
                                  [classes.activeTab]: selectedTab === item,
                                })}
                                onClick={() => setSelectedTab(item)}
                              >
                                {item === "Details" ? <Settings /> : <People />}
                                <Box marginX={1} />
                                <Typography variant="subtitle1">
                                  {item}
                                </Typography>
                              </Paper>
                            ))}
                          </Box>
                          {selectedTab === "Details" ? (
                            <Box height="500px">
                              <Box display="flex" marginBottom={2}>
                                <TextField
                                  variant="outlined"
                                  size="small"
                                  fullWidth
                                  label="Role Name"
                                  value={roleValues.name}
                                  onChange={(e) =>
                                    setRoleValues({
                                      ...roleValues,
                                      name: e.target.value,
                                    })
                                  }
                                />
                                <Box marginX={4} />
                                <TextField
                                  variant="outlined"
                                  size="small"
                                  fullWidth
                                  label="Role Description"
                                  value={roleValues.description}
                                  onChange={(e) =>
                                    setRoleValues({
                                      ...roleValues,
                                      description: e.target.value,
                                    })
                                  }
                                />
                              </Box>
                              <Paper>
                                <Box
                                  bgcolor={theme.palette.background.default}
                                  padding={2}
                                >
                                  <Grid container>
                                    <Grid item md={4}>
                                      <h3>Names</h3>
                                    </Grid>
                                    <Grid item md={2}>
                                      <h3>Read</h3>
                                    </Grid>
                                    <Grid item md={2}>
                                      <h3>Create</h3>
                                    </Grid>
                                    <Grid item md={2}>
                                      <h3>Update</h3>
                                    </Grid>
                                    <Grid item md={2}>
                                      <h3>Delete</h3>
                                    </Grid>
                                  </Grid>
                                </Box>
                                <Box height="450px" overflow="auto">
                                  {loadingFields ? (
                                    <Loader
                                      style={{ height: "100%" }}
                                      text="Loading..."
                                    />
                                  ) : (
                                    field.length &&
                                    resource.length && (
                                      <RoleEngine
                                        field={field}
                                        resource={resource}
                                        setField={setField}
                                        setResource={setResource}
                                      />
                                    )
                                  )}
                                </Box>
                              </Paper>
                            </Box>
                          ) : (
                            <Box>
                              <div style={{ height: "400px" }}>
                                <DataGrid
                                  components={{
                                    Toolbar: DataGridCustomToolbar,
                                  }}
                                  columns={roleUsersCols}
                                  rows={newRoleUsers}
                                  pageSize={10}
                                  density="compact"
                                  checkboxSelection
                                />
                              </div>
                              <Box marginTop={2} display="flex">
                                <Button
                                  variant="contained"
                                  color="primary"
                                  onClick={handleClickOpen("addNew")}
                                >
                                  Create Users
                                </Button>
                                <Box marginX={1} />
                                <Button
                                  variant="outlined"
                                  color="primary"
                                  onClick={handleClickOpen("existing")}
                                >
                                  Add Existing Users
                                </Button>
                              </Box>
                            </Box>
                          )}
                        </Container>
                      )}

                      <Box
                        display="flex"
                        justifyContent="flex-end"
                        marginTop={4}
                      >
                        {isSubmitting ? (
                          <Box display="flex" alignItems="center">
                            <CircularProgress />
                            <Box marginX={1} />
                            Submitting
                          </Box>
                        ) : (
                          <Box display="flex" marginTop={5} marginRight={2}>
                            {/* {step === 1 && (
                              <Button
                                disabled={step === 0}
                                variant="contained"
                                color="primary"
                                onClick={() =>
                                  setStep((prevState) => prevState - 1)
                                }
                              >
                                Prev
                              </Button>
                            )} */}
                            <Box marginX={1} />
                            {step === 0 ? (
                              <Button
                                disabled={
                                  !Object.entries(values).filter(
                                    ([k, v], i) => k === "entityName" && !!v
                                  ).length
                                }
                                variant="contained"
                                color="primary"
                                onClick={() =>
                                  handleClickNext(
                                    errors,
                                    setFieldTouched,
                                    values
                                  )
                                }
                              >
                                {createdEntity ? "Update" : "Save"}
                              </Button>
                            ) : postingRoles ? (
                              <Box display="flex" alignItems="center">
                                <CircularProgress />
                                <Box marginX={1} />
                                Submitting
                              </Box>
                            ) : (
                              <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSubmitRole}
                              >
                                Save
                              </Button>
                            )}
                          </Box>
                        )}
                      </Box>
                    </Form>
                  )}
                </Formik>
              </Box>
            )}
          </Container>
        </Container>
      </Layout>
    </>
  );
};

export default CreateEntity;
