import { useEffect, useState, useContext } from 'react';
import { Dialog, useTheme, TextField } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Autocomplete, Skeleton } from '@mui/material';
import axiosInstance from '../../axios/axiosInstance';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useHistory } from 'react-router-dom';
import {
  cycleCountPhysicalInventory,
  CustomDialogTransition
} from '../../constants/helpers';
import { useData } from '../../StateProvider/Provider';
import { isMobile, isTablet } from 'react-device-detect';
import { Formik } from 'formik';
import { object, string } from 'yup';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const ManageCycleCountPInventorSchema = object().shape({
  inventoryCycle: string().required('Please enter inventory cycle'),
  user: string().required('Please enter user'),
  productCategory: string().required('Please enter product category'),
  warehouse: string().required('Please enter warehouse')
});

const ManageCycleCountPInventory = ({ open, close, onSuccess }) => {
  const theme = useTheme();
  const [isSubmitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [optionsArray, setOptionsArray] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState({ inventoryCycle: '', user: '', productCategory: '', warehouse: '' });

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = () => {
    setLoading(true);
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=Product Category,User,Warehouse,Inventory Cycle`)
      .then(({ data: { data } }) => {
        if (data) {
          setOptionsArray(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
      });
  };

  const handleSubmit = (values) => {
    setSubmitting(true);
    axiosInstance()
      .post(cycleCountPhysicalInventory.api, values)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        onSuccess();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      maxWidth="md"
      TransitionComponent={CustomDialogTransition}
      fullWidth
      fullScreen={fullScreen || isMobile || isTablet}
    >
      <CustomDialogHeader
        title={'Create Cycle Count Physical Inventory'}
        onClose={close}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
      />

      {loading ? (
        <>
          <CustomDialogContent>
            <Skeleton width="100%" height="70px" />
            <Grid container spacing={2}>
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <Grid key={i} size={{ xs: 12, sm: 6, md: 6 }}>
                  <Skeleton width="100%" height="60px" />
                </Grid>
              ))}
            </Grid>
          </CustomDialogContent>
          <CustomDialogFooter>
            <ThemeButton onClick={close} buttonType='transparent'>
              Cancel
            </ThemeButton>
            <ThemeButton onClick={handleSubmit} buttonType='theme' disabled={loading}>
              Submit
            </ThemeButton>
          </CustomDialogFooter>
        </>
      ) : (
        <Formik initialValues={selectedOptions} onSubmit={handleSubmit} validationSchema={ManageCycleCountPInventorSchema}>
          {({ values, errors, setFieldValue, touched, submitForm }) => (
            <>
              <CustomDialogContent>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                    <Autocomplete
                      options={optionsArray['Inventory Cycle']}
                      getOptionLabel={(option) => option.optionLabel}
                      value={optionsArray['Inventory Cycle'].find((d) => values?.inventoryCycle === d?.optionValue)?.optionLabel}
                      fullWidth
                      onChange={(event, newValue) => {
                        setFieldValue('inventoryCycle', newValue?.optionValue);
                      }}
                      size="small"
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Inventory Cycle"
                          variant="outlined"
                          error={touched['inventoryCycle'] && Boolean(errors['inventoryCycle'])}
                          helperText={touched['inventoryCycle'] && errors['inventoryCycle']}
                          required
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                    <Autocomplete
                      options={optionsArray['User']}
                      getOptionLabel={(option) => option.optionLabel}
                      value={optionsArray['User'].find((d) => values?.user === d?.optionValue)?.optionLabel}
                      fullWidth
                      onChange={(event, newValue) => {
                        setFieldValue('user', newValue?.optionValue);
                      }}
                      size="small"
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Users"
                          variant="outlined"
                          error={touched['user'] && Boolean(errors['user'])}
                          helperText={touched['user'] && errors['user']}
                          required
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                    <Autocomplete
                      options={optionsArray['Product Category']}
                      getOptionLabel={(option) => option.optionLabel}
                      value={optionsArray['Product Category'].find((d) => values?.productCategory === d?.optionValue)?.optionLabel}
                      fullWidth
                      onChange={(event, newValue) => {
                        setFieldValue('productCategory', newValue?.optionValue);
                      }}
                      size="small"
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Product Category"
                          variant="outlined"
                          error={touched['productCategory'] && Boolean(errors['productCategory'])}
                          helperText={touched['productCategory'] && errors['productCategory']}
                          required
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                    <Autocomplete
                      options={optionsArray['Warehouse']}
                      getOptionLabel={(option) => option.optionLabel}
                      value={optionsArray['Warehouse'].find((d) => values?.warehouse === d?.optionValue)?.optionLabel}
                      fullWidth
                      onChange={(event, newValue) => {
                        setFieldValue('warehouse', newValue?.optionValue);
                      }}
                      size="small"
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Warehouse"
                          variant="outlined"
                          error={touched['warehouse'] && Boolean(errors['warehouse'])}
                          helperText={touched['warehouse'] && errors['warehouse']}
                          required
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CustomDialogContent>
              <CustomDialogFooter>
                <ThemeButton buttonType='transparent' onClick={close}>
                  Cancel
                </ThemeButton>
                <ThemeButton buttonType='theme' onClick={submitForm}>
                  Submit
                </ThemeButton>
              </CustomDialogFooter>
            </>
          )}
        </Formik>
      )}
    </Dialog>
  );
};

export default ManageCycleCountPInventory;
