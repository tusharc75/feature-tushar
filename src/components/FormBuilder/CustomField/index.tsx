import { useEffect, useContext, useState, Fragment } from 'react';
import Divider from '@material-ui/core/Divider';
import { AddField } from '../AddField';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { Box, Grid } from '@material-ui/core';
import { DragBox } from './DragBox';
import { makeStyles } from '@material-ui/core/styles';
import styles from '../Form.module.scss';

const useStyles = makeStyles(() => ({
  acionBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: '5px',
    cursor: 'pointer',
    // border: '2px solid var(--common-border-color)',
    color: 'var(--dark-primary-text, #163340)',
    fontWeight: 'bold',
    padding: '8px',
    background: 'var(--dark-secondary, #e6f1f5)'
  }
}));

export const CustomField = ({}) => {
  const [fields, setFields] = useState([]);
  const [isAddField, setIsAddField] = useState(false);
  const [fieldData, setFieldData] = useState(null);
  const toastConfig = useContext(CustomToastContext);
  const classes = useStyles();
  useEffect(() => {
    fetchCustomField();
  }, []);

  const fetchCustomField = () => {
    axiosInstance()
      .get(`/sa-formbuilder/custom-field`)
      .then(({ data: { data } }) => {
        setFields(data);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleOpenAddField = () => {
    setIsAddField(true);
    setFieldData(null);
  };

  const handleAddField = (values) => {
    if (values._id && !Number.isInteger(values._id)) {
      axiosInstance()
        .put(`/sa-formbuilder/custom-field`, values)
        .then(({ data: { data } }) => {
          setIsAddField(false);
          setFieldData(null);
          fetchCustomField();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    } else {
      axiosInstance()
        .post(`/sa-formbuilder/custom-field`, values)
        .then(({ data: { data } }) => {
          setIsAddField(false);
          setFieldData(null);
          fetchCustomField();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleCloseAddField = () => {
    setIsAddField(false);
  };

  const handleDelete = (id) => {
    axiosInstance()
      .delete(`/sa-formbuilder/custom-field/` + id)
      .then(() => {
        fetchCustomField();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleEdit = (data) => {
    setFieldData(data);
    setIsAddField(true);
  };

  const handleImportFields = (e) => {
    e.preventDefault();
    var files = e.target.files,
      f = files[0];
    var reader = new FileReader();
    reader.onload = function (e) {
      var data: any = e.target.result;
      data = JSON.parse(data);
      delete data._id;
      handleAddField(data);
    };
    reader.readAsBinaryString(f);
  };

  return (
    <Fragment>
      <Box mt={1} mb={1}>
        <Divider />
      </Box>

      <Box>
        <Grid spacing={1} container className={styles.custom_field}>
          <Grid item xs={12} sm={6} md={6}>
            <label className={classes.acionBtn} onClick={handleOpenAddField}>
              Add Custom Field
            </label>
          </Grid>
          <Grid container justify="flex-end" item xs={12} sm={6} md={6}>
            <label htmlFor="importcustomField" className={`cursor-pointer ${classes.acionBtn}`}>
              Import Custom Field
              <input
                onClick={(e: any) => (e.target.value = null)}
                id="importcustomField"
                name="importcustomField"
                onChange={handleImportFields}
                style={{
                  opacity: '0',
                  position: 'absolute',
                  zIndex: -1
                }}
                type="file"
              />
            </label>
          </Grid>
        </Grid>
      </Box>
      <Box mt={1} mb={1}>
        <Grid container spacing={1} className={styles.addiction_field}>
          {fields &&
            fields.map((data, i) => <DragBox data={data} handleDelete={handleDelete} handleEdit={handleEdit} handleAddField={handleAddField} />)}
        </Grid>
      </Box>
      {isAddField && (
        <AddField refrence="custom" fieldData={fieldData} handleClose={handleCloseAddField} handleAddField={handleAddField} fields={fields} />
      )}
    </Fragment>
  );
};
