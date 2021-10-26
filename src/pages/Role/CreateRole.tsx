import { useEffect, useState } from "react";
import {
  Dialog,
  Button,
  CircularProgress,
  Grid,
  Box,
  TextField,
  Paper,
  useTheme,
  useMediaQuery,
} from "@material-ui/core";
import { useHistory } from 'react-router-dom';
import { Skeleton } from "@material-ui/lab";
import axiosInstance from "../../axios/axiosInstance";
import CustomDialogHeader from "../../components/CustomDialog/CustomDialogHeader";
import CustomDialogContent from "../../components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "../../components/CustomDialog/CustomDialogFooter";
import Loader from "../../components/Loader";
import RoleEngine from "../../components/Shared/RoleEngine";
import { roleTypes } from "../../constants/helpers";
import ConfirmCancelDialog from "../../components/ConfirmCancelDialog"
import { isMobile , isTablet } from 'react-device-detect';

const CreateRole = ({
  open,
  close,
  fetchData,
  roleType,
  setToastConfig,
  selectedEntity,
  isClone = false,
  roleId = null
}) => {
  const theme = useTheme();
  const history = useHistory();
  const [isSubmitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState({ name: "", description: "" });
  const [field, setField] = useState([]);
  const [resource, setResource] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  
  useEffect(() => {
    if (isClone) {
      fetchRoleData()
    }
    else {
      getInitialData();
    }
  }, []);

  const fetchRoleData = async () => {
    setLoading(true);
    try {
      const {
        data: { data },
      } = await axiosInstance().get(`/role/${roleId}`);
      setValues({ name: "", description: data.description });
      setField(data.field);
      setResource(data.resource);
      setLoading(false);
    } catch (error) {
      setToastConfig(error);
    }
  };

  const getInitialData = () => {
    setLoading(true);
    let api =
      roleType === roleTypes.find((d) => d.key === "Global")?.value
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
          const newId = data.data._id;
          fetchData();
          setSubmitting(false);
          history.push(`/role/detail/${newId}`);
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
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen || (isMobile || isTablet)}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true)
        }
      }}
    >
      <CustomDialogHeader title="Create New Role"
        onClose={() => setShowConfirmDialog(true)}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen(prevState => !prevState)
        }}
        showManimizeMaximize={true}
      />

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
            <Button variant="outlined" size="small" color="primary" disabled={loading}>
              Cancel
            </Button>
            <Button variant="contained" size="small" color="primary" disabled={loading}>
              Submit
            </Button>
          </CustomDialogFooter>
        </>
      ) : (
        <>
          <CustomDialogContent>
            <h2 className="form-label-style" style={{ borderBottom: "none" }}>* Required Fields</h2>

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
                    setValues({ ...values, name: e.target.value.trimStart() })
                  }
                />

                <TextField
                  required
                  variant="outlined"
                  multiline
                  size="small"
                  fullWidth
                  label="Role Description"
                  value={values.description}
                  onChange={(e) =>
                    setValues({ ...values, description: e.target.value.trimStart() })
                  }
                />
              </Box>
              <Paper>

                {loading ? (
                  <div className="d-flex align-items-center justify-content-center" style={{ minHeight: 200 }}>
                    <Loader
                      style={{ height: "100%" }}
                      text="Loading..."
                    />
                  </div>
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
              </Paper>
            </Box>
          </CustomDialogContent>
          <CustomDialogFooter>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              disabled={isSubmitting}
              onClick={() => {
                if (Boolean(!values.name) && Boolean(!values.description)) close()
                else setShowConfirmDialog(true)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="small"
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
            showConfirmDialog ?
              <ConfirmCancelDialog
                open={showConfirmDialog}
                onSave={() => {
                  setShowConfirmDialog(false)
                  handleSubmit()
                }}
                onClose={() => {
                  setShowConfirmDialog(false)
                  close()
                }}
              /> : null
          }
        </>
      )}
    </Dialog>
  );
};

export default CreateRole;
