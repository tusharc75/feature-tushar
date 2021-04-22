import { useEffect, useState } from "react";
import {
  Dialog,
  Button,
  CircularProgress,
  Grid,
  Box,
  TextField,
  Paper,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  useTheme,
  useMediaQuery,
} from "@material-ui/core";
import { Redirect, Route } from 'react-router-dom';
import { Skeleton } from "@material-ui/lab";
import axiosInstance from "../../axios/axiosInstance";
import CustomDialogHeader from "../../components/CustomDialog/CustomDialogHeader";
import CustomDialogContent from "../../components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "../../components/CustomDialog/CustomDialogFooter";
import Loader from "../../components/Loader";
import RoleEngine from "../../components/Shared/RoleEngine";

const CreateRole = ({
  open,
  close,
  fetchData,
  roleType,
  setToastConfig,
  selectedEntity,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("xs"));
  const [isSubmitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRedirect, setIsRedirect] = useState(false);
  const [createdRoleId, setCreatedRoleId] = useState("");
  const [values, setValues] = useState({ name: "", description: "" });
  const [field, setField] = useState([]);
  const [resource, setResource] = useState([]);

  useEffect(() => {
    getInitialData();
    // eslint-disable-next-line
  }, []);

  const getInitialData = () => {
    setLoading(true);
    let api =
      roleType === 1
        ? `/field?resource=Role&roleType=${roleType}`
        : `/field?resource=Role&roleType=${roleType}&entity=${selectedEntity}`;
    axiosInstance()
      .get(api)
      .then(({ data: { data } }) => {
        setField(data.field);
        setResource(data.resource);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        setToastConfig(err);
      });
  };

  const handleSubmit = () => {
    if (
      resource.some(
        (d) => d.isCreate || d.isRead || d.isUpdate || d.isDelete
      ) ||
      field.some((d) => d.isCreate || d.isRead || d.isUpdate || d.isDelete)
    ) {
      setSubmitting(true);
      axiosInstance()
        .post("/role", {
          ...values,
          field,
          resource,
          type: roleType,
        })
        .then(({ data }) => {
          setCreatedRoleId(data.data._id);
          fetchData();
          setSubmitting(false);
          setIsRedirect(true);
          close();
        })
        .catch((err) => {
          setSubmitting(false);
          setToastConfig(err);
        });
    } else {
      setToastConfig({
        open: true,
        type: "error",
        message: "Please check atleast one permission",
      });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
    >
      <CustomDialogHeader title="Create New Role" onClose={close} />

      {loading ? (
        <>
          <CustomDialogContent>
            <Skeleton width="100%" height="70px" />
            <Grid container spacing={2}>
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <Grid key={i} item xs={12} sm={6} md={6}>
                  <Skeleton width="100%" height="60px" />
                </Grid>
              ))}
            </Grid>
          </CustomDialogContent>
          <CustomDialogFooter>
            <Button variant="outlined" color="primary" disabled={loading}>
              Cancel
            </Button>
            <Button variant="contained" color="primary" disabled={loading}>
              Submit
            </Button>
          </CustomDialogFooter>
        </>
      ) : (
        <>
          <CustomDialogContent>
            <Box paddingX={1} paddingY={2}>
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
                <TableContainer style={{ maxHeight: 440 }}>
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
            </Box>
          </CustomDialogContent>
          <CustomDialogFooter>
            <Button
              variant="outlined"
              color="primary"
              disabled={isSubmitting}
              onClick={close}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                Boolean(!values.name) ||
                Boolean(!values.description)
              }
            >
              {isSubmitting ? <CircularProgress size={22} /> : "Submit"}
            </Button>
          </CustomDialogFooter>
          {
            isRedirect && <Route
              exact
              path="/role"
              render={() => <Redirect to={`/role/detail/${createdRoleId}`} />}
            />
          }
        </>
      )}
    </Dialog>
  );
};

export default CreateRole;
