import { useState, useEffect, useContext } from "react";
import {
  Box,
  Button,
  TextField,
  Paper,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  Grid,
  CircularProgress,
  Typography,
} from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import { useParams, useHistory } from "react-router-dom";

import axiosInstance from "../../axios/axiosInstance";
import Layout from "../../components/Layout";
import Container from "../../components/Container";
import routes from "../../components/Helpers/Routes";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import DetailsPageHeader from "../../components/DetailsPageHeader";
import { useData } from "../../StateProvider/Provider";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import RoleEngine from "../../components/Shared/RoleEngine";
import Loader from "../../components/Loader";
import DeleteButton from "../../components/Helpers/DeleteButton";
import AssignedUsers from "./AssignedUsers";
import BoxWithBorder from "../../components/BoxWithBorder";

const RoleDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const { id } = useParams();
  const {
    state: { user },
  }: any = useData();
  const [headingLbl, setHeadingLbl] = useState("");
  const [loading, setLoading] = useState(false);
  const [isUpdating, setUpdating] = useState(false);
  const [roleData, setRoleData] = useState(null);
  const [currentData, setCurrentData] = useState(null);
  const [updatedData, setUpdatedData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [field, setField] = useState([]);
  const [resource, setResource] = useState([]);
  const [values, setValues] = useState({
    name: "",
    description: "",
  });
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([routes.role]);
  const [rolePermissions, setRolePermissions] = useState({
    isCreate: false,
    isUpdate: false,
    isRead: false,
    isDelete: false,
  });

  useEffect(() => {
    const data = user?.role?.sideBar;

    if (data) {
      const hasRolePermission = data.find((d) => d.name == "Role");
      if (hasRolePermission) {
        setRolePermissions({
          isCreate: hasRolePermission.isCreate,
          isUpdate: hasRolePermission.isUpdate,
          isRead: hasRolePermission.isRead,
          isDelete: hasRolePermission.isDelete,
        });
      }
    }
  }, [user]);

  useEffect(() => {
    if (id) {
      fetchRoleData();
    }
  }, [id]);

  useEffect(() => {
    const data = {
      name: values.name,
      description: values.description,
      field,
      resource,
    };
    setUpdatedData(JSON.stringify(data));
  }, [values, field, resource]);

  const fetchRoleData = async () => {
    setLoading(true);
    try {
      const {
        data: { data },
      } = await axiosInstance().get(`/role/${id}`);
      setHeadingLbl(data.name);
      setRoleData(data);
      setValues({ name: data.name, description: data.description });
      setField(data.field);
      setResource(data.resource);
      const current = {
        name: data.name,
        description: data.description,
        field: data.field,
        resource: data.resource,
      };
      setCurrentData(JSON.stringify(current));
      setCustomizedRoutes([routes.role, { title: data.name }]);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleUpdateRole = () => {
    setUpdating(true);

    axiosInstance()
      .put(`/role/${id}`, {
        _id: id,
        ...values,
        field,
        resource,
      })
      .then(({ data }) => {
        fetchRoleData();
        toastConfig.setToastConfig({
          open: true,
          type: "success",
          message: data.message,
        });

        setUpdating(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setUpdating(false);
      });
  };

  const handleDeleteRole = () => {
    if (id) {
      if (rolePermissions.isDelete) {
        axiosInstance()
          .put(`/role/remove`, { ids: [id] })
          .then(({ data }) => {
            setShowConfirmBox(false);
            history.goBack();
          })
          .catch((err) => {
            setShowConfirmBox(false);
          });
      }
    } else {
      setShowConfirmBox(false);
    }
  };

  return (
    <>
      <Layout>
        <CustomBreadCrumbs routes={customizedRoutes} />
        {!roleData ? (
          <Container>
            <Skeleton variant="text" width="150px" height="40px" />
            <Box display="flex">
              <Skeleton
                style={{ borderRadius: 6 }}
                width="120px"
                height="80px"
              />
              <Box marginX={1} />
              <Skeleton
                style={{ borderRadius: 6 }}
                width="120px"
                height="80px"
              />
            </Box>
          </Container>
        ) : (
          <DetailsPageHeader heading={headingLbl} showHeading={true}>
            {rolePermissions.isUpdate && (
              <Button
                disabled={currentData === updatedData}
                variant="contained"
                color="primary"
                onClick={handleUpdateRole}
              >
                {isUpdating ? <CircularProgress size={22} /> : "Update"}
              </Button>
            )}
            <Box marginX={1} component="span" />
            {rolePermissions.isDelete ? (
              <DeleteButton
                text="Delete"
                onClick={() => setShowConfirmBox(true)}
              />
            ) : null}
          </DetailsPageHeader>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} sm={8} md={8}>
            <Container>
              <Box display="flex" marginBottom={2} gridGap={10}>
                <TextField
                  required
                  variant="outlined"
                  size="small"
                  fullWidth
                  label="Role Name"
                  value={values.name}
                  onChange={(e) =>
                    setValues({ ...values, name: e.target.value })
                  }
                />

                <TextField
                  required
                  variant="outlined"
                  size="small"
                  fullWidth
                  label="Role Description"
                  value={values.description}
                  onChange={(e) =>
                    setValues({ ...values, description: e.target.value })
                  }
                />
              </Box>
              <Paper>
                <TableContainer style={{ height: 440 }}>
                  <Table
                    stickyHeader
                    aria-label="roles"
                    className="roles-table"
                  >
                    <TableHead>
                      <TableRow>
                        <TableCell>Names</TableCell>
                        <TableCell>Read</TableCell>
                        <TableCell>Create</TableCell>
                        <TableCell>Update</TableCell>
                        <TableCell>Delete</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={5}>
                            <Loader
                              style={{ height: "100%" }}
                              text="Loading..."
                            />
                          </TableCell>
                        </TableRow>
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
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Container>
            <Box marginY={2} />
            <Container>
              <Box padding={1} bgcolor="grey.200">
                <Typography variant="subtitle2">
                  Assigned Entities ({(roleData && roleData.entity.length) || 0}
                  )
                </Typography>
              </Box>

              <Box padding={1}></Box>
            </Container>
          </Grid>
          <Grid item xs={12} sm={4} md={4}>
            <Container>
              <Box padding={1} bgcolor="grey.200">
                <Typography variant="subtitle2">
                  Assigned Users ({(roleData && roleData.user.length) || 0})
                </Typography>
              </Box>
              <Box padding={1}>
                {loading ? (
                  [1, 2].map((i) => (
                    <BoxWithBorder
                      key={i}
                      styles={{
                        padding: "8px",
                        margin: "8px 8px",
                      }}
                    >
                      <Box padding={1}>
                        <Skeleton variant="text" width="100px" height="20px" />
                        <Box marginTop={1} />
                        <Skeleton variant="text" width="100%" height="15px" />
                      </Box>
                    </BoxWithBorder>
                  ))
                ) : (
                  <>
                    <AssignedUsers
                      unassignRole={() => {}}
                      data={roleData && roleData.user}
                    />
                    <Box marginY={1} />
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => history.push("/user")}
                    >
                      View All
                    </Button>
                  </>
                )}
              </Box>
            </Container>
          </Grid>
        </Grid>
      </Layout>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this Role ?`}
          onClose={() => setShowConfirmBox(false)}
          onOk={handleDeleteRole}
        />
      )}
    </>
  );
};

export default RoleDetailsPage;
