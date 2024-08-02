import { CircularProgress, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, Switch, TextField } from '@material-ui/core';
import { Formik } from 'formik';
import React, { useContext, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import DashboardModal from 'src/components/DashboardModal';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { object, string } from 'yup';

type SaveArrangeViewProps = {
  renderedFrom: string;
  order: string[];
  hidden: string[];
  onClose: () => void;
  getAllSavedViews: () => void;
  defaultValue?: (FormSchema & { _id: string }) | null;
};

const initialValue = {
  name: '',
  access: 'everyone',
  setAsDefault: false
};

const formSchema = object().shape({
  name: string().min(2, 'Name too short').max(50, 'Name too long!').required('Name is required')
});

export type FormSchema = {
  name: string;
  access: string;
  setAsDefault: boolean;
};

const SaveEditArrangeView = ({ renderedFrom, order, hidden, getAllSavedViews, onClose, defaultValue }: SaveArrangeViewProps) => {
  const toastConfig = useContext(CustomToastContext);
  const [loading, setLoading] = useState(false);

  const saveArrangeView = async (values: FormSchema) => {
    setLoading(true);
    try {
      const { setAsDefault, ...rest } = values;
      const response = await axiosInstance().post('/user/grid-view', { ...rest, key: renderedFrom, hide: hidden, order });
      const { data } = response;
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: data.message
      });
      getAllSavedViews();
      onClose();
    } catch (error) {
      toastConfig.setToastConfig(error);
    } finally {
      setLoading(false);
    }
  };

  const updateArrangeView = async (values: FormSchema) => {
    setLoading(true);
    try {
      const { setAsDefault, ...rest } = values;
      const response = await axiosInstance().put('/user/grid-view', { ...rest, key: renderedFrom, hide: hidden, order });
      const { data } = response;
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: data.message
      });
      getAllSavedViews();
      onClose();
    } catch (error) {
      toastConfig.setToastConfig(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Formik
      initialValues={defaultValue ? defaultValue : initialValue}
      validationSchema={formSchema}
      validateOnMount
      onSubmit={(values) => {
        if (defaultValue) {
          updateArrangeView(values);
        } else {
          saveArrangeView(values);
        }
      }}
    >
      {({ submitForm, values, errors, touched, setFieldValue }) => (
        <DashboardModal
          handleClose={onClose}
          open={true}
          dialogProps={{
            fullScreen: isMobile || isTablet,
            maxWidth: 'xs'
          }}
          modalHead={{
            title: defaultValue ? `Update ${defaultValue.name}` : `Save View`,
            fullScreenOption: true
          }}
          footer={
            <>
              <ThemeButton type="submit" disabled={loading} iconForMobile={false} onClick={submitForm} color="primary" borderColor="none">
                Save <CircularProgress size={20} color="inherit" className={`${loading ? '' : 'sr-only'} ml-2`} />
              </ThemeButton>
            </>
          }
        >
          <div className="grid gap-2">
            <div>
              <TextField
                fullWidth
                value={values['name']}
                onChange={(e) => {
                  setFieldValue('name', e.target.value.trimStart());
                }}
                id="view-name"
                name="name"
                label="View Name"
                variant="outlined"
                size="small"
                required
                error={touched['name'] && Boolean(errors['name'])}
                helperText={touched['name'] && errors['name']}
              />
            </div>
            <div className="mt-2">
              <FormControl size="small">
                <FormLabel id="view-access-radio-button">Access</FormLabel>
                <RadioGroup
                  row
                  aria-labelledby="view-access-radio-button"
                  value={values['access']}
                  onChange={(e) => {
                    setFieldValue('access', e.target.value.trimStart());
                  }}
                  name="access"
                >
                  <FormControlLabel value="everyone" control={<Radio size="small" />} label="Everyone" />
                  <FormControlLabel value="private" control={<Radio size="small" />} label="Private" />
                </RadioGroup>
              </FormControl>
            </div>
            <div className="ml-1">
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={values['setAsDefault']}
                    onChange={(e) => {
                      setFieldValue('setAsDefault', e.target.checked);
                    }}
                    name="setAsDefault"
                  />
                }
                label="Set as Default"
              />
            </div>
          </div>
        </DashboardModal>
      )}
    </Formik>
  );
};

export default SaveEditArrangeView;
