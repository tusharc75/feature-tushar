import { DndContext, DragOverEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { Box, CircularProgress, FormControl, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { saveAs } from 'file-saver';
import { Form, Formik } from 'formik';
import update from 'immutability-helper';
import queryString from 'query-string';
import React, { Fragment, useState } from 'react';
import { MdDashboardCustomize } from 'react-icons/md';
import { useHistory, useParams } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import { ExportIcon, ImportIcon } from 'src/assets/svg/svgIcons';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import { useDndSensors } from 'src/hooks';
import Builder from './Builder';
import DashboardItem from './DashboardItem';
import DashboardView from './DashboardView';
import { IFormDataType, baseURL } from './builderHelpers';
import DeviceMessage from 'src/components/ScreenMessages/DeviceMessage';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const DashboardBuilder = () => {
  const history = useHistory();
  const { type }: any = queryString.parse(history.location.search);

  const { id } = useParams();
  const {
    state: { permissions, resources }
  } = useData();
  const isNew = id && id === 'new';
  const { setToastConfig } = React.useContext(CustomToastContext);
  const [formData, setFormData] = React.useState<IFormDataType[]>([]);
  const [selectedData, setSelectedData] = React.useState<IFormDataType>();
  const [isSubmitting, setSubmitting] = React.useState<boolean>(false);
  const [isLoading, setLoading] = React.useState<boolean>(false);
  const [values, setValues] = React.useState({ name: '', defaultDuration: 'current-year' });
  const [activeItem, setActiveItem] = useState<IFormDataType | null>(null);

  React.useEffect(() => {
    if (!isNew) {
      (() => {
        setLoading(true);
        axiosInstance()
          .get(`${baseURL}/${id}`)
          .then(({ data: { data } }) => {
            const dashboardName = (type && type === 'clone') || !data?.name ? '' : data?.name;
            setFormData(data?.charts || []);
            setValues({ name: dashboardName, defaultDuration: data?.defaultDuration });
            setLoading(false);
          })
          .catch((err) => {
            setLoading(false);
            setToastConfig(err);
          });
      })();
    }
  }, [id]);

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

  const createDashboard = (values) => {
    setSubmitting(true);
    axiosInstance()
      .post(baseURL, {
        name: values?.name.trim(),
        defaultDuration: values?.defaultDuration,
        charts: formData
      })
      .then(() => {
        setToastConfig({
          open: true,
          message: 'Successfully created dashboard',
          type: 'success'
        });
        setSubmitting(false);
        history.push('/dashboard-master');
      })
      .catch((error) => {
        setSubmitting(false);
        setToastConfig(error);
      });
  };

  const handleExportField = () => {
    const dataToExport =
      formData?.length > 0
        ? {
          name: values?.name.trim(),
          charts: formData
        }
        : {
          name: '',
          charts: [
            {
              graphyType: '', // Valid types ["Chart", "Map", "Table"]
              chartType: '', // Valid types ["Pie", "Line", "Bar", "Doughnut"]
              column: 6,
              chartTitle: '',
              kpi: { name: '', kpi: '', resource: '', id: 0, graphType: '', chartType: '' },
              hasFilters: false,
              hasTableView: false,
              hasExport: false,
              statusOptions: [],
              filters: []
            }
          ]
        };
    let blob = new Blob([JSON.stringify(dataToExport)], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${values?.name || 'Dashboard Fields'}.json`);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const files = e.target.files,
      f = files[0];
    let reader = new FileReader();
    reader.onload = function (e) {
      const data: any = e.target.result;
      const { name, charts } = JSON.parse(data);
      setValues((prev) => ({ ...prev, name }));
      setFormData(charts);
    };
    reader.readAsBinaryString(f);
    e.target.value = null;
  };

  const updateDashboard = (values: any) => {
    setSubmitting(true);
    axiosInstance()
      .put(`${baseURL}`, {
        _id: id,
        name: values?.name?.trim(),
        defaultDuration: values?.defaultDuration,
        charts: formData
      })
      .then(() => {
        setToastConfig({
          open: true,
          message: 'Successfully updated dashboard',
          type: 'success'
        });
        setSubmitting(false);
        history.push('/dashboard-master');
      })
      .catch((error) => {
        setSubmitting(false);
        setToastConfig(error);
      });
  };

  const handleClickSave = (values) => {
    if (!isNew && !type) {
      updateDashboard(values);
    } else {
      createDashboard(values);
    }
  };

  const validate = (values) => {
    const errors = {};
    if (!values.name) {
      errors['name'] = 'Dashboard Name Required';
    }
    return errors;
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;
    const dragIndex = active.data.current?.index;
    const dropIndex = over.data.current?.index;

    const card = formData[dragIndex];
    setFormData(
      update(formData, {
        $splice: [
          [dragIndex, 1],
          [dropIndex, 0, card]
        ]
      })
    );
  };

  const onDragEnd = () => {
    setActiveItem(null);
  };

  function onDragStart(event: DragStartEvent) {
    setActiveItem(formData[event.active.data.current?.index] as IFormDataType);
  }

  const sensors = useDndSensors();

  return (
    <>
      <DeviceMessage />
      <Box className="main-container-v1">
        <Box className="headerbox-v1">
          <Box className="nav-v1">
            <CustomBreadCrumbs
              routes={[
                { title: resources?.dashboardMaster?.titlePlural, path: '/dashboard-master' },
                { title: type && type === 'clone' ? 'Clone' : !isNew ? values.name : 'New', path: '' }
              ]}
            />
          </Box>
          <Box>
            <Box display="flex" justifyContent="flex-end">
              <Box mr={2}>
                <button className="new-headerbox-button-v1" onClick={handleExportField}>
                  <span>Export</span>
                  <ExportIcon />
                </button>
              </Box>
              <Box>
                <input accept="json" style={{ display: 'none' }} onChange={handleImport} id="import-file" multiple={false} type="file" />
                <label htmlFor="import-file" className="new-headerbox-button-v1">
                  <span>Import</span>
                  <ImportIcon />
                </label>
              </Box>
            </Box>
          </Box>
        </Box>
        <Box className={`detail-container-v1`}>
          <Box p={1.2} display="flex" justifyContent="space-between" alignItems={'center'}>
            <Formik initialValues={values} enableReinitialize={true} onSubmit={handleClickSave} validate={validate}>
              {({ values, errors, touched, setFieldValue, submitForm, setValues }) => (
                <Fragment>
                  <Box display="flex">
                    <Form autoComplete="off" autoCorrect="off" noValidate>
                      <Box display="flex">
                        <TextField
                          disabled={isLoading}
                          style={{ width: 300 }}
                          variant="outlined"
                          required
                          value={values.name}
                          onChange={(e) => setFieldValue('name', e.target.value)}
                          size="small"
                          label="Dashboard Name"
                          error={touched['name'] && Boolean(errors['name'])}
                          helperText={touched['name'] && errors['name']}
                        />
                        <Box pl={2}>
                          <FormControl fullWidth size="small" variant="outlined">
                            <InputLabel id="duration">Select Duration</InputLabel>
                            <Select
                              labelId="duration"
                              id="time-duration"
                              style={{ width: 300 }}
                              value={values.defaultDuration}
                              onChange={(e) => setFieldValue('defaultDuration', e.target.value)}
                              label="Select Duration"
                              size="small"
                            >
                              <MenuItem value={'1-year'}>Last 1 Year</MenuItem>
                              <MenuItem value={'6-months'}>Last 6 Months</MenuItem>
                              <MenuItem value={'3-months'}>Last 3 Months</MenuItem>
                              <MenuItem value={'1-month'}>Last 1 Month</MenuItem>
                              <MenuItem value={'current-year'}>Current Year</MenuItem>
                            </Select>
                          </FormControl>
                        </Box>
                      </Box>
                    </Form>
                  </Box>
                  {permissions?.dashboardMaster?.isUpdate && (
                    <Box py={'6px'}>
                      <ThemeButton
                        disabled={!Boolean(values.name) || formData.length === 0 || isSubmitting}
                        onClick={submitForm}
                        isLoading={isSubmitting}
                        buttonType='theme'
                      >
                        Save
                      </ThemeButton>
                    </Box>
                  )}
                </Fragment>
              )}
            </Formik>
          </Box>
          <Box p={1}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Builder setFormData={setFormData} selectedData={selectedData} handleUpdate={handleUpdate} />
              </Grid>
              <Grid size={{ xs: 12, sm: 8 }}>
                <Box className={'container-with-border'} p={2}>
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
                  <DndContext onDragEnd={onDragEnd} onDragOver={onDragOver} sensors={sensors} onDragStart={onDragStart}>
                    <DashboardView
                      selectedData={selectedData}
                      formData={formData}
                      setFormData={setFormData}
                      handleEdit={handleEdit}
                      handleRemove={handleRemove}
                    />
                    <DragOverlay>{activeItem && <DashboardItem formData={activeItem} id={activeItem.uniqueId} index={0} />}</DragOverlay>
                  </DndContext>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default DashboardBuilder;
