import { useState, useEffect, useContext, Fragment } from 'react';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Layout from '../../components/Layout';
import Button from '@material-ui/core/Button';
import { useParams, useHistory } from 'react-router-dom';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import { Formik, Form } from 'formik';
import { object, string } from 'yup';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../axios/axiosInstance';
import CustomContainer from '../../components/CustomContainer';
import DashboardView from '../../components/Charts/DashboardView';

const ProductBuilderSchema = object().shape({
  name: string().min(3, 'Too Short!').max(50, 'Too Long').required('name is required')
});

const EditDashboards = (props) => {
  const { edit } = props;
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const { id } = useParams();

  const [isUpdating, setIsUpdating] = useState(false);
  const [initialValues, setInitialValues] = useState(null);
  const [deleteField] = useState([]);

  useEffect(() => {
    fetchDashboard();
  }, [id]);

  const fetchDashboard = () => {
    if (id === '0') {
      setInitialValues({ name: '' });
    } else {
      axiosInstance()
        .get(`/dashboard/` + id)
        .then(({ data: { data } }) => {
          setInitialValues(data);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleSave = (values) => {
    let data: any = {};
    data.name = initialValues.name;
    data.charts = values;

    setIsUpdating(true);
    if (id === '0') {
      axiosInstance()
        .post('/dashboard', data)
        .then(({ data: { data } }) => {
          setIsUpdating(false);
          history.push({ pathname: '/dashboards' });
        })
        .catch((error) => {
          setIsUpdating(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      data.BuilderId = id;
      data.deleteField = deleteField;
      axiosInstance()
        .put('/dashboard/' + id, data)
        .then(({ data: { data } }) => {
          setIsUpdating(false);
          history.push({ pathname: '/dashboards' });
        })
        .catch((error) => {
          setIsUpdating(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item xs={12}>
          <CustomBreadCrumbs
            routes={[{ title: 'Dashboards', path: '/dashboards' }, { title: id === '0' ? 'New' : initialValues && initialValues.name }]}
          />
        </Grid>
      </Grid>
      <CustomContainer>
        {initialValues ? (
          <Formik initialValues={initialValues} validationSchema={ProductBuilderSchema} onSubmit={handleSave}>
            {({ submitForm }) => (
              <Form>
                <Box p={1} bgcolor="white">
                  <Grid container spacing={1}>
                    <Grid item xs={12} sm={3}>
                      {initialValues.name}
                    </Grid>
                    <Grid item xs={12} sm={3}></Grid>
                    <Grid item xs={12} sm={6} container justify="flex-end">
                      {/* <Box>
                                            <Button disabled={isUpdating} color="primary" onClick={submitForm} variant="contained" >
                                                Save{isUpdating && <CircularProgress size={24} />}
                                            </Button>
                                        </Box> */}
                      <Box ml={1}>
                        <Button size="small" color="primary" variant="contained" onClick={() => history.push({ pathname: '/dashboards' })}>
                          Close
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                  <DashboardView edit={edit} handleSave={handleSave} Charts={initialValues.charts || []} />
                </Box>
              </Form>
            )}
          </Formik>
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomContainer>
    </Fragment>
  );
};

export default EditDashboards;
