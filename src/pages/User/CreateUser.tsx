import { useEffect, useState,useContext } from "react";
import {
  Dialog,
  Button,
  CircularProgress,
  Grid,
  useTheme,
  useMediaQuery,
} from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import { Formik, Form } from "formik";
import axiosInstance from "../../axios/axiosInstance";
import CustomDialogHeader from "../../components/CustomDialog/CustomDialogHeader";
import CustomDialogContent from "../../components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "../../components/CustomDialog/CustomDialogFooter";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import InputField from "../../components/Helpers/InputField";
import {
  getObjKeys,
  removeEmptyKeys,
  yupSchema,
} from "../../constants/helpers";

interface InitialData {
  fields: any[];
  values: object;
}

const CreateUser = ({ open, close, fetchData }) => {
  const toastConfig = useContext(CustomToastContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("xs"));
  const [isSubmitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState<InitialData>({
    fields: [],
    values: {},
  });

  useEffect(() => {
    getInitialData();
  }, []);

  const getInitialData = () => {
    setLoading(true);
    axiosInstance()
      .get("/field?resource=User")
      .then(({ data: { data } }) => {
        const fieldsData = data.map((d: any) => d.fieldData);
        setInitialData({
          fields: fieldsData,
          values: getObjKeys("", fieldsData),
        });
        setLoading(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setLoading(false);
      });
  };

  const handleSubmit = (values) => {
    setSubmitting(true);
    axiosInstance()
      .post("/user", removeEmptyKeys(values))
      .then(({ data }) => {
        toastConfig.setToastConfig({ open: true, type: "success", message: data.message });
        console.log(data);
        setSubmitting(false);
        fetchData();
        close();
      })
      .catch((err) => {
        toastConfig.setToastConfig({ open: true, type: "error" });
        setSubmitting(false);
      });
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
    >
      <CustomDialogHeader title="Create New User" onClose={close} />

      {loading || !initialData.fields.length ? (
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
        <Formik
          initialValues={initialData.values}
          validationSchema={yupSchema(initialData.fields)}
          onSubmit={handleSubmit}
        >
          {({ values, errors, setFieldValue, touched, submitForm }) => (
            <>
              <CustomDialogContent>
                <Form noValidate>
                  <InputField
                    errors={errors}
                    values={values}
                    setFieldValue={setFieldValue}
                    touched={touched}
                    fieldsData={initialData.fields}
                    size="small"
                    fullWidth
                  />
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  variant="outlined"
                  color="primary"
                  disabled={isSubmitting || loading}
                  onClick={close}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={submitForm}
                  disabled={isSubmitting || loading}
                >
                  {isSubmitting ? <CircularProgress size={22} /> : "Submit"}
                </Button>
              </CustomDialogFooter>
            </>
          )}
        </Formik>
      )}
    </Dialog>
  );
};

export default CreateUser;
