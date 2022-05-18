import React from 'react';
import { Grid, Box, Button, TextField, CircularProgress, Typography } from '@material-ui/core';
import { useParams, useHistory, useLocation } from 'react-router-dom';
import { makeStyles } from '@material-ui/styles';
import { MdDashboardCustomize } from 'react-icons/md';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import queryString from 'query-string';

import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import Builder from './Builder';
import { IFormDataType, baseURL } from './builderHelpers';
import DashboardView from './DashboardView';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const useClasses = makeStyles(() => ({
  root: {
    height: 'calc(80vh + 20px)'
  }
}));

const DashboardBuilder = () => {
  const classes = useClasses();
  const history = useHistory();
  const { type }: any = queryString.parse(history.location.search);

  const { id } = useParams();
  const isNew = id && id === 'new';
  const { setToastConfig } = React.useContext(CustomToastContext);
  const [formData, setFormData] = React.useState<IFormDataType[]>([]);
  const [selectedData, setSelectedData] = React.useState<IFormDataType>();
  const [isSubmitting, setSubmitting] = React.useState<boolean>(false);
  const [isLoading, setLoading] = React.useState<boolean>(false);
  const [name, setName] = React.useState<string>('');
  const [compareData, setCompareData] = React.useState({
    oldData: '',
    newData: ''
  });

  React.useEffect(() => {
    if (!isNew) {
      (() => {
        setLoading(true);
        axiosInstance()
          .get(`${baseURL}/${id}`)
          .then(({ data: { data } }) => {
            const dashboardName = (type && type === 'clone') || !data?.name ? '' : data?.name;
            setFormData(data?.charts || []);
            setName(dashboardName);
            setLoading(false);
            setCompareData({
              oldData: JSON.stringify({ name: dashboardName, charts: data?.charts }),
              newData: JSON.stringify({ name: dashboardName, charts: data?.charts })
            });
          })
          .catch((err) => {
            setLoading(false);
            setToastConfig(err);
          });
      })();
    }
  }, [id]);

  React.useEffect(() => {
    setCompareData((prevState) => ({
      ...prevState,
      newData: JSON.stringify({ name, charts: formData })
    }));
  }, [name, formData]);

  const handleEdit = (data: IFormDataType) => {
    setSelectedData(data);
  };

  const handleRemove = (id: string) => {
    setFormData((prevState) => prevState.filter((d) => d.uniqueId !== id));
    setSelectedData(null);
  };

  const handleUpdate = (values: IFormDataType) => {
    setFormData((prevState) =>
      prevState.map((d) => {
        if (d.uniqueId === selectedData?.uniqueId) {
          return values;
        } else {
          return d;
        }
      })
    );
    setSelectedData(null);
  };

  const createDashboard = () => {
    setSubmitting(true);
    axiosInstance()
      .post(baseURL, {
        name: name.trim(),
        charts: formData.map((form) => ({ ...form, kpi: type && type === 'clone' ? form.kpi : form.kpi.kpi }))
      })
      .then(() => {
        setToastConfig({
          open: true,
          message: 'Successfully created dashboard',
          type: 'success'
        });
        setSubmitting(false);
        history.goBack();
      })
      .catch((error) => {
        setSubmitting(false);
        setToastConfig(error);
      });
  };

  const updateDashboard = () => {
    setSubmitting(true);
    axiosInstance()
      .put(`${baseURL}`, {
        _id: id,
        name: name.trim(),
        charts: formData.map((form) => ({ ...form, kpi: form.kpi.kpi }))
      })
      .then(() => {
        setToastConfig({
          open: true,
          message: 'Successfully updated dashboard',
          type: 'success'
        });
        setSubmitting(false);
      })
      .catch((error) => {
        setSubmitting(false);
        setToastConfig(error);
      });
  };

  const handleClickSave = () => {
    if (!isNew && !type) {
      updateDashboard();
    } else {
      createDashboard();
    }
  };

  return (
    <div>
      <div className="headerbox">
        <CustomBreadCrumbs
          routes={[
            { title: 'Dashboard Builder', path: '/dashboard-master' },
            { title: type && type === 'clone' ? 'Clone' : !isNew ? name : 'New', path: '' }
          ]}
        />
      </div>
      <div className="detail-container">
        <Box bgcolor={'white'} p={1.2} display="flex" justifyContent="space-between" alignItems={'center'}>
          <Box>
            <TextField
              disabled={isLoading}
              style={{ height: 40, width: 300 }}
              variant="outlined"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              size="small"
              label="Dashboard Name"
            />
          </Box>
          <Box py={'6px'}>
            <Button
              color="primary"
              variant="contained"
              size="small"
              disableRipple
              disabled={!Boolean(name) || formData.length === 0 || isSubmitting || (!isNew && compareData.oldData === compareData.newData)}
              onClick={handleClickSave}
              startIcon={isSubmitting && <CircularProgress size={18} color="inherit" />}
            >
              Save
            </Button>
          </Box>
        </Box>

        <Box bgcolor="#f5f5f5" p={1}>
          <Grid container spacing={2} className={classes.root}>
            <Grid item xs={12} sm={4}>
              <Builder setFormData={setFormData} selectedData={selectedData} handleUpdate={handleUpdate} />
            </Grid>
            <Grid item xs={12} sm={8}>
              {formData.length === 0 && (
                <Box height="100%" width="100%" display="flex" justifyContent="center" alignItems="center">
                  {isLoading ? (
                    <CircularProgress size={22} color="primary" />
                  ) : (
                    <Box textAlign="center">
                      <MdDashboardCustomize size={120} className="headerLogo" />
                      <Typography variant="body1" align="center">
                        Start creating layout
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
              <DndProvider backend={HTML5Backend}>
                <DashboardView
                  selectedData={selectedData}
                  formData={formData}
                  setFormData={setFormData}
                  handleEdit={handleEdit}
                  handleRemove={handleRemove}
                />
              </DndProvider>
            </Grid>
          </Grid>
        </Box>
      </div>
    </div>
  );
};

export default DashboardBuilder;
