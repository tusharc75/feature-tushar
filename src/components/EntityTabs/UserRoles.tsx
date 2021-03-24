import React, { useState, useEffect } from "react";
import clsx from "clsx";
import {
  Box,
  Grid,
  Paper,
  TextField,
  List,
  ListItem,
  ListItemText,
  useTheme,
  Typography,
  Button,
  makeStyles,
} from "@material-ui/core";
import { DataGrid, GridToolbar } from "@material-ui/data-grid";
import { Settings, People } from "@material-ui/icons";
import moment from "moment";
import { useHistory, useLocation } from "react-router-dom";

import Loader from "../Loader";
import Container from "../Container";
import RoleEngine from "../BrandCreation/RoleEngine";
import { SVG } from "../../assets";
import NoDataCell from '../Helpers/NoDataCell'
import { GetAllRolesByType, GetRoleById } from "../../axios";
import DataGridCustomToolbar from './../../components/Helpers/DataGridCustomToolbar';

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

const UserRoles = (props) => {
  const { pathname } = useLocation();
  const history = useHistory();
  const classes = useStyles();
  const theme = useTheme();

  const { entity } = props;
  const [roles, setRoles] = useState([]);
  const [selectedTab, setSelectedTab] = useState("Details");

  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  const [rolesUserRow, setRolesUserRow] = useState([]);
  const [field, setField] = useState([]);
  const [resource, setResource] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [values, setValues] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    getEntityRoles();

    // eslint-disable-next-line
  }, []);

  // ****** GET ROLES FOR ENTITY ******
  const getEntityRoles = () => {
    setLoadingRoles(true);
    GetAllRolesByType("entity", entity._id)
      .then(({ data }) => {
        setRoles(data);
        setLoadingRoles(false);
      })
      .catch((err) => {
        setLoadingRoles(false);
        console.log(err);
      });
  };

  /**
   *  ROLE USERS COLUMN
   */
  const rolesExistingUserCols = [
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
      field: "email", headerName: "Email", width: 200,
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

  // ****** CREATE ROWS FOR ROLES USERS ********
  const getRolesUsersRow = (data) => {
    let rows = data?.map((u) => ({
      id: u._id,
      name: `${u.firstName} ${u.lastName}`,
      email: u.email,
      createdAt: moment(u.createdAt).format("MMM Do, YYYY"),
    }));

    setRolesUserRow(rows);
  };

  // Handle change for values
  const handleChange = (prop) => (e) => {
    setValues({ ...values, [prop]: e.target.value });
  };

  // ****** HANDLE SELECT IN EXISTING ROLES **********

  const handleClick = (id) => {
    const selectedRole = roles.find((role) => role._id === id);
    if (selectedRole) {
      if (selectedRole._id !== selectedRoleId) {
        setLoadingData(true);
        setSelectedRoleId(selectedRole._id);
        GetRoleById(selectedRole._id)
          .then(({ data }) => {
            getRolesUsersRow(data.user);
            setValues({
              name: data.name,
              description: data.description,
            });
            setField(data.field);
            setResource(data.resource);
            setLoadingData(false);
          })
          .catch((err) => {
            setLoadingData(false);
            console.log(err);
          });
      }
    }
  };

  /*
   * (**__**)
   **/
  const tabs = ["Details", "Users"];

  return (
    <>
      <Container maxWidth="lg" minHeight="100%" styles={{ marginTop: 0 }}>
        <Grid container spacing={5}>
          <Grid item sm={4} md={4} lg={4}>
            <Paper>
              <Box>
                <Box
                  bgcolor={theme.palette.background.default}
                  minHeight="600px"
                >
                  <Box padding={2}>
                    <TextField
                      fullWidth
                      label="Search"
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                  <Box>
                    <List component="nav">
                      {loadingRoles ? (
                        <Loader text="" />
                      ) : !roles.length ? (
                        <Box textAlign="center" component="p" marginTop={1}>
                          No roles to show
                        </Box>
                      ) : (
                        roles.map((role, i) => (
                          <ListItem
                            button
                            selected={selectedRoleId === role._id}
                            key={i}
                            onClick={() => handleClick(role._id)}
                          >
                            <ListItemText
                              primary={role.name}
                              secondary={role.description}
                            />
                          </ListItem>
                        ))
                      )}
                    </List>
                  </Box>
                </Box>
              </Box>
            </Paper>
            <Box display="flex" marginTop={2}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={() => {
                  history.push({
                    pathname: "/global-roles/new",
                    state: {
                      brandId: entity.brand,
                      entityId: entity._id,
                      name: entity.entityName,
                      prevPath: pathname,
                    },
                  });
                }}
              >
                Add New
              </Button>
            </Box>
          </Grid>
          <Grid item sm={8} md={8} lg={8}>
            {!selectedRoleId ? (
              <Box textAlign="center" marginTop={5}>
                <img src={SVG("Contacts Placeholder")} alt="Placeholder" />
                <Box marginY={2} />
                <Typography paragraph>
                  {loadingRoles ? "Loading roles..." : "Select a role."}
                </Typography>
              </Box>
            ) : loadingData ? (
              <Loader style={{ height: "100%" }} text="Hold on" />
            ) : (
              <>
                <Box display="flex" marginBottom={5}>
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
                      <Typography variant="subtitle1">{item}</Typography>
                    </Paper>
                  ))}
                </Box>
                {selectedTab === "Details" ? (
                  <>
                    <Box display="flex" marginBottom={2}>
                      <TextField
                        size="small"
                        required
                        disabled
                        value={values.name}
                        variant="outlined"
                        label="Role Name"
                        onChange={handleChange("name")}
                        fullWidth
                      />
                      <Box marginX={2} />
                      <TextField
                        size="small"
                        required
                        disabled
                        value={values.description}
                        variant="outlined"
                        label="Role Description"
                        onChange={handleChange("description")}
                        fullWidth
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
                      <Box height="400px" overflow="auto">
                        <RoleEngine
                          isDisable={true}
                          field={field}
                          resource={resource}
                          setField={setField}
                          setResource={setResource}
                        />
                      </Box>
                    </Paper>
                  </>
                ) : (
                  <Box>
                    <div style={{ height: "400px" }}>
                      <DataGrid
                        components={{
                          Toolbar: DataGridCustomToolbar,
                        }}
                        columns={rolesExistingUserCols}
                        rows={rolesUserRow}
                        density="compact"
                        checkboxSelection
                      />
                    </div>
                  </Box>
                )}
              </>
            )}
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default UserRoles;
