import { useContext, useEffect, useState } from 'react';
import { Box, Typography, Button, CircularProgress, TextField,Dialog,Grid ,FormControlLabel,Checkbox,IconButton} from '@material-ui/core';
import styles from '../profilePage.module.scss';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import { Autocomplete } from '@material-ui/lab';
import { useData } from 'src/StateProvider/Provider';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from 'src/constants/helpers';
import { FieldArray, Form, Formik } from 'formik';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';

export default function UiPreference({ user1, onSuccess }) {

  const toastConfig = useContext(CustomToastContext);
  const [isUpdating, setUpdating] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [ui, setUi] = useState("All");
  const [openDialog,setOpenDialog]=useState(false);
  const [initialValues, setInitialValues] = useState({ data: [] });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [submitting, setSubmitting] = useState(false);

  const {
    state: { user }
  }: any = useData();
  
  useEffect(()=>{
    setInitialValues({data:user.role.selectedEntity.resource.map(res=>{
      return ({resource:res.name,type:"All"})
    })})
  },[user.role.selectedEntity.resource])

  const updateUiPref = (values) => {
    setSubmitting(true);
    setUpdating(true);
    let dataObj = {
      _id: user1,
      uiPreference:values.data,
    };
    axiosInstance()
      .put(`/user/ui-preference`, dataObj)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        onSuccess();
        setUpdating(false);
        setSubmitting(false);
        setIsEdit(false);
        setOpenDialog(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setSubmitting(false);
        setUpdating(false);
      });
  };
  
  const onClose=()=>{
    setOpenDialog(false);
  }

  const uiOptions: string[] = ["All", "My"];
  return (
    <>
      <div className={styles.preferenceHeader}>
        <Typography variant="h5">Your UI Preference</Typography>
      </div>
      <Box style={{ padding: '8px' }}>
        <div className="header-panel">
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => {
              setOpenDialog(true)
            }}
          >
            {isUpdating && <CircularProgress size={22} />}
            By Default Record
          </Button>
        </div>
      </Box>
      {openDialog &&
          <Dialog
          maxWidth="md"
          fullScreen={fullScreen}
          TransitionComponent={CustomDialogTransition}
          aria-labelledby="customized-dialog-title"
          open={true}
          fullWidth
          onClose={(e, reason) => {
            if (reason !== 'backdropClick') {
            }
          }}
        >
          <Formik initialValues={initialValues} onSubmit={updateUiPref}>
            {({ values, submitForm }) => (
              <>
                <CustomDialogHeader
                  onClose={onClose}
                  title={'Resources'}
                  isMinimized={!fullScreen}
                  onMinimizeMaximize={() => {
                    setFullScreen((prevState) => !prevState);
                  }}
                  showManimizeMaximize={true}
                  showRequiredLabel={false}
                />
                <CustomDialogContent>
                  <Box>
                    <Form>
                      <FieldArray
                        name="data"
                        render={(arrayHelpers) => (
                          <>
                            {values?.data?.map((data, index) => (
                              <Box mb={2} border={1} borderColor="var(--common-border-color)">
                                <Box p={2} pt={1}>
                                  <Grid container spacing={2}>
                                    <Grid item md={4} lg={4} sm={6} xs={12}>{data.resource}</Grid>
                                    <Grid item md={4} lg={4} sm={6} xs={12}>
                                      <Autocomplete
                                        value={data.type}
                                        onChange={(e, val) => {
                                          arrayHelpers.replace(index, {
                                            ...values?.data[index],
                                            ['type']: val
                                          });
                                        }}
                                        options={uiOptions}
                                        getOptionLabel={(option) => option}
                                        renderInput={(params) => (
                                          <TextField
                                            {...params}
                                            margin='none'
                                            size='small'
                                            label='By Default Record'
                                            variant='outlined'
                                          />
                                        )}
                                      />
                                      </Grid>
                                  </Grid>
                                </Box>
                              </Box>
                            ))}
                          </>
                        )}
                      />
                    </Form>
                  </Box>
                </CustomDialogContent>
                <CustomDialogFooter>
                  <Button size="small" color="primary" disabled={submitting}>
                    Cancel
                  </Button>
                  <Button
                    disabled={submitting}
                    variant="contained"
                    color="primary"
                    size="small"
                    type="submit"
                    onClick={submitForm}
                    endIcon={submitting && <CircularProgress color="inherit" size={18} />}
                  >
                    Save
                  </Button>
                </CustomDialogFooter>
              </>
            )}
          </Formik>
        </Dialog>
      }
    </>
  );
}
