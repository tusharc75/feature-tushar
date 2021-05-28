import { useContext, useEffect, useState } from "react";
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
import InputField from "../../components/Helpers/InputField";
import { useHistory } from "react-router-dom";
import { getObjKeys, yupSchema } from "../../constants/helpers";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";

interface InitialData {
  fields: any[];
  values: object;
}

const CreateProjectSales = ({ open, close, fetchData, type = null }) => {
  const theme = useTheme();
  const toastConfig = useContext(CustomToastContext);
  const isMobile = useMediaQuery(theme.breakpoints.down("xs"));
  const [isSubmitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState<InitialData>({
    fields: [],
    values: {},
  });
  const history = useHistory();

  useEffect(() => {
    getInitialData();
  }, []);

  const getInitialData = () => {
    setLoading(true);
    axiosInstance()
      .get("/field?resource=Project Sales")
      .then(({ data: { data } }) => {
        const fieldsData = data.map((d: any) => d.fieldData);
        setInitialData({
          fields: fieldsData,
          values: getObjKeys("", fieldsData),
        });
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
      });
  };

  const handleSubmit = (values) => {
    setSubmitting(true);
    var tempStaticData = {};
    if (type) {
      type.map((d: any) => {
        tempStaticData[d.type] = [d.id]
      });
    }
    tempStaticData["user"] = [values?.projectManager]
    values.staticData = tempStaticData
    axiosInstance()
      .post("/project-Sales", values)
      .then(({ data }) => {
        const newId = data.data?._id;
        setSubmitting(false);
        fetchData();
        if (type) {
          close();
        }
        else {
          history.push(`/project-sales/detail/${newId}`, {
            managerId: data.data?.projectManager,
          });
          close();
        }
        toastConfig.setToastConfig({
          open: true,
          type: "success",
          message: data.message,
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
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
      <CustomDialogHeader title="Create New Project Sales" onClose={close} />

      {loading || !initialData.fields.length ? (
        <>
          <CustomDialogContent>
            <Skeleton width="100%" height="70px" />
            <Grid container spacing={2}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
                <Grid key={i} item xs={12} sm={6} md={6}>
                  <Skeleton width="100%" height="60px" />
                </Grid>
              ))}
            </Grid>
          </CustomDialogContent>
          <CustomDialogFooter>
            <Button variant="outlined" size="small" color="primary" disabled>
              Cancel
            </Button>
            <Button variant="contained" size="small" color="primary" disabled>
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
                  size="small" 
                  disabled={isSubmitting || loading}
                  onClick={close}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  size="small" 
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

export default CreateProjectSales;
