import { useContext, useEffect, useState, FC, Fragment } from 'react';
import { Dialog, Button, Box, TextField, Grid, IconButton, CircularProgress } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { Add, Delete } from '@material-ui/icons';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { generateUniqueId, packages, product } from '../../constants/helpers';

type DialogProps = {
  ids: string | string[];
  onClose: VoidFunction;
  onSuccess: VoidFunction;
  resource: string;
  title: string;
  label: string;
  resourceData: any[];
  text?: string;
};

interface FormData {
  resource: {
    name: string;
    id: string;
  };
  id: string;
  qty: number;
}

interface ResourceType {
  name: string;
  id: string;
}

const AssignQuantityDialog: FC<DialogProps> = (props) => {
  const { ids, onClose, onSuccess, title, label, resource, resourceData: existingResourceData, text } = props;
  const { setToastConfig } = useContext(CustomToastContext);
  const [resourceData, setResourceData] = useState<ResourceType[]>([]);
  const [allResourceData, setAllResourceData] = useState<ResourceType[]>([]);
  const [isSubmitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData[]>([
    {
      id: generateUniqueId(),
      resource: null,
      qty: 0
    }
  ]);

  useEffect(() => {
    if (existingResourceData.length > 0) {
      let existingData = [];
      if (resource.includes('product')) {
        existingData = existingResourceData.map((product) => ({
          id: product?._id,
          resource: {
            name: product?.productName,
            id: product?._id
          },
          qty: product?.qty
        }));
      } else {
        existingData = existingResourceData.map(({ wareHouse, qty }) => ({
          id: wareHouse?._id,
          resource: {
            name: wareHouse?.warehouseName,
            id: wareHouse?._id
          },
          qty
        }));
      }
      setFormData(existingData);
    }
  }, [existingResourceData]);

  useEffect(() => {
    if (formData.length === 0) {
      const initialData = [
        {
          id: generateUniqueId(),
          resource: null,
          qty: 0
        }
      ];

      setFormData(initialData);

      const customFormArr = initialData.map((fD) => fD.resource?.id && fD.resource.id).filter((x) => x);
      const filteredData =
        resourceData.length > 0
          ? resourceData.filter((d) => !customFormArr.includes(d?.id))
          : allResourceData.filter((d) => !customFormArr.includes(d?.id));
      setResourceData(filteredData);
    } else {
      const customFormArr = formData.map((fD) => fD.resource?.id).filter((x) => x);
      const filteredData =
        allResourceData.length > 0
          ? allResourceData.filter((d) => !customFormArr.includes(d?.id))
          : resourceData.filter((d) => !customFormArr.includes(d?.id));
      setResourceData(filteredData);
    }
  }, [formData]);

  useEffect(() => {
    (() => {
      axiosInstance()
        .get(`${resource}?limit=0`)
        .then(({ data: { data } }) => {
          let existingData = [];
          if (existingResourceData.length > 0) {
            existingData = existingResourceData.map((r) => {
              if (resource.includes('warehouse')) {
                return r?.wareHouse?._id;
              } else {
                return r?._id;
              }
            });
          }


          let newData = [];
          if (resource.includes('warehouse')) {
            if (existingData.length > 0) {
              data = data.map((_d) => ({ id: _d._id, name: _d.warehouseName }));

              setAllResourceData(data);
              newData = data.filter((w: ResourceType) => !existingData.includes(w.id));
            } else {
              newData = data.map((_d) => ({ id: _d._id, name: _d.warehouseName }));
            }
          } else {
            if (existingData.length > 0) {
              data = data.map((_d) => ({ id: _d._id, name: _d.productName }));
              setAllResourceData(data);
              newData = data.filter((p: ResourceType) => !existingData.includes(p.id));
            } else {
              newData = data.map((_d) => ({ id: _d._id, name: _d.productName }));
            }
          }
          setResourceData(newData);
        })
        .catch((err) => {
          setToastConfig(err);
        });
    })();
  }, [existingResourceData]);

  const submitForm = () => {
    setSubmitting(true);
    if (resource.includes('product')) {
      axiosInstance()
        .post(`${packages.packageApi}/add-products`, {
          ids: ids,
          products: formData.map((d) => ({ product: d.resource.id, qty: d.qty }))
        })
        .then(() => {
          setSubmitting(false);
          onSuccess();
        })
        .catch((err) => {
          setSubmitting(false);
          setToastConfig(err);
        });
    } else {
      axiosInstance()
        .put(`${product.api}/stock`, {
          _id: ids,
          stock: formData.map((d) => ({ warehouse: d.resource.id, qty: d.qty }))
        })
        .then(() => {
          setSubmitting(false);
          onSuccess();
        })
        .catch((err) => {
          setSubmitting(false);
          setToastConfig(err);
        });
    }
  };

  const handleChange = (name: string, data: FormData, val: any) => {
    if (name === 'resource') {
      setResourceData((prevState) => {
        const updatedArr = prevState.filter((state) => state.id !== val.id);
        return updatedArr;
      });
    }

    setFormData((prevState) => {
      const updatedState = prevState.map((state) => {
        if (state.id === data.id) {
          state[name] = val;
        }
        return state;
      });

      return updatedState;
    });
  };
  return (
    <Dialog open fullWidth maxWidth="md" onClose={onClose}>
      <CustomDialogHeader title={title} onClose={onClose} />
      <CustomDialogContent>
        <Box p={2}>
          <Grid container spacing={2}>
            {formData.map((form, indx) => (
              <Fragment key={form.id}>
                <Grid item xs={5} sm={5}>
                  <Autocomplete
                    fullWidth
                    size="small"
                    options={resourceData}
                    value={form.resource}
                    getOptionLabel={(option) => option?.name}
                    getOptionSelected={(option, value) => option.id === value.id}
                    onChange={(_, val) => {
                      handleChange('resource', form, val);
                    }}
                    renderInput={(params) => <TextField {...params} variant="outlined" required label={label} />}
                  />
                </Grid>
                <Grid item xs={5} sm={5}>
                  <TextField
                    size="small"
                    fullWidth
                    value={form.qty}
                    type="number"
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val > 0) {
                        handleChange('qty', form, val);
                      } else {
                        handleChange('qty', form, 0);
                      }
                    }}
                    variant="outlined"
                    required
                    label="Quantity"
                  />
                </Grid>
                <Grid item xs={2} sm={2}>
                  <Box display="flex" justifyContent="flex-end" alignItems="center">
                    {/* {indx !== 0 && ( */}
                    <Box ml={2}>
                      <IconButton
                        size="small"
                        color="primary"
                        // disabled={!Boolean(form.resource) || !Boolean(form.qty)}
                        onClick={() => {
                          setFormData((prevState) => prevState.filter((s) => s.id !== form.id));
                        }}
                      >
                        <Delete color="error" />
                      </IconButton>
                    </Box>
                    {/* )} */}
                  </Box>
                </Grid>
              </Fragment>
            ))}
          </Grid>
        </Box>
        {typeof text !== 'undefined' ? (
          <Button
            size="small"
            color="primary"
            // disabled={!Boolean(form.resource) || !Boolean(form.qty)}
            variant="outlined"
            onClick={() => {
              setFormData((prevState) => [...prevState, { id: generateUniqueId(), resource: null, qty: 0 }]);
            }}
          >
            {`${text}`}
            <Add color={`primary`} />
          </Button>
        ) : (
          <Button
            size="small"
            color="primary"
            // disabled={!Boolean(form.resource) || !Boolean(form.qty)}
            variant="outlined"
            onClick={() => {
              setFormData((prevState) => [...prevState, { id: generateUniqueId(), resource: null, qty: 0 }]);
            }}
          >
            Add Products
            <Add color={`primary`} />
          </Button>
        )}
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button variant="outlined" disabled={isSubmitting} color="primary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={submitForm}
          variant="contained"
          disabled={isSubmitting || !Boolean(formData[formData.length - 1]?.resource) || !Boolean(formData[formData.length - 1]?.qty)}
          color="primary"
          endIcon={isSubmitting && <CircularProgress size={20} />}
        >
          Save
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default AssignQuantityDialog;
