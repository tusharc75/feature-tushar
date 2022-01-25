import React from 'react';
import { Dialog, Box, Button, Grid, CircularProgress } from '@material-ui/core';

import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import { getObjKeys } from '../../constants/helpers';
import FormTypes from '../../components/Helpers/FormTypes';
import axiosInstance from '../../axios/axiosInstance';
import routes from '../../components/Helpers/Routes';

// POST /product/61cad683bcce3823a24211d8/images
// {

//     "product":"61cad683bcce3823a24211d8",

//     "images":["https://images.unsplash.com/photo-1639242585506-d66e7f47c047?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80"]

// }
//GET  /product/61cad683bcce3823a24211d8/images
//PUT /product/61cad683bcce3823a24211d8/images  - UPDATE
//PUT /product/61cad683bcce3823a24211d8/images/remove - DLETE
// {
//     "ids":["61ee69f4d14ebc59b4961ecc"]
// }
// GET /e-product/image/61cad683bcce3823a24211d8?fields=[{"field":"field","value":""}] - GET single image for e commerce

const AddConfigurationDialog = (props) => {
  const { data, fields, close, id, fetchData } = props;
  const [formData, setFormData] = React.useState({
    values: {},
    fields: [],
    images: []
  });
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    const values = getObjKeys('', fields);
    if(data && Object.keys(data.values).length > 0 && data.images.length > 0) {
      setFormData({
        ...data,
        fields
      })
    } else {
      setFormData({
        ...formData,
        values,
        fields
      });

    }
  }, [fields, data]);

  const onChange = (name, value) => {
    if (name === 'images') {
      setFormData({ ...formData, images: value });
      return;
    }
    let newValues = {
      ...formData.values,
      [name]: value
    };
    setFormData({ ...formData, values: newValues });
  };

  const postImages = () => {
    setSubmitting(true);
    if(data) { 
      axiosInstance()
      .put(`${routes.product.path}/${id}/images`, {
        product: id,
        images: formData.images,
        productConfiguration: formData.values,
        _id: data.values.id
      })
      .then(() => {
        setSubmitting(false);
        fetchData()
        close()
      })
      .catch(() => {
        setSubmitting(false);
      });
    } else {
      axiosInstance()
      .post(`${routes.product.path}/${id}/images`, {
        product: id,
        images: formData.images,
        productConfiguration: formData.values
      })
      .then(() => {
        setSubmitting(false);
        fetchData()
        close()
      })
      .catch(() => {
        setSubmitting(false);
      });
    }
  };

  return (
    <Dialog open onClose={close} maxWidth="md" fullWidth>
      <CustomDialogHeader title="Add Configuration" onClose={() => {
          if(submitting) return
          close()
        }} 
      />
      <CustomDialogContent>
        <Box py={2}>
          <Grid container spacing={2}>
            {fields.map((field) => (
              <Grid item xs={12} sm={6} key={field.fieldName}>
                <FormTypes
                  isNew={true}
                  fieldData={field}
                  values={formData.values}
                  errors={{}}
                  touched={{}}
                  label={field.fieldLabel}
                  name={field.fieldName}
                  type={field.type}
                  options={field.option}
                  setFieldValue={onChange}
                  required={field.required}
                  fullWidth
                  isTooltip={field?.isTooltip || false}
                  tooltipMessage={field?.tooltipMessage}
                  size="small"
                />
              </Grid>
            ))}
            <Grid item xs={12}>
              <FormTypes
                isNew={true}
                values={formData}
                errors={{}}
                touched={{}}
                label={'Upload Images'}
                name={'images'}
                type={'multiImageUpload'}
                setFieldValue={onChange}
                required={true}
                fullWidth
                isTooltip={false}
                tooltipMessage={''}
                size="small"
              />
            </Grid>
          </Grid>
        </Box>
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button disabled={submitting} variant="outlined" color="primary" onClick={close}>
          Close
        </Button>
        <Button
          disabled={submitting}
          variant="contained"
          color="primary"
          onClick={postImages}
          endIcon={submitting && <CircularProgress color="inherit" size={18} />}
        >
          Save
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default AddConfigurationDialog;
