import { useContext, useState } from 'react';
import { Box,Typography, Button, CircularProgress,TextField } from '@material-ui/core';
import styles from '../profilePage.module.scss';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import { Autocomplete } from '@material-ui/lab';

export default function UiPreference({ user, onSuccess }) {
  const toastConfig = useContext(CustomToastContext);
  const [isUpdating, setUpdating] = useState(false);
  const [isEdit,setIsEdit]=  useState(false);
  const [ui,setUi]=  useState("All");

  const updateUiPref = () => {
    setUpdating(true);
    let dataObj = {
      _id: user,
      uiPreference:{byDefaultRecord:ui},
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
        setIsEdit(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setUpdating(false);
      });
  };
  const handleChangeUi = (_,value) => {
    setUi(value);
  };
  const uiOptions: string[] = ["All", "My"];
  return (
    <>
      <div className={styles.preferenceHeader}>
        <Typography variant="h5">Your UI Preference</Typography>
      </div>
      <Box style={{ padding: '8px' }}>
        <div className="header-panel">
            <Autocomplete
                  style={{ width: 250 }}
                  value={ui}
                  onChange={handleChangeUi}
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
          <div className="flex flex-wrap gap-[8px] justify-end">
            {isEdit && (
            <Button
              disabled={isUpdating}
              variant="contained"
              color="primary"
              size="small"
              onClick={() => {
                updateUiPref();
              }}
            >
              {isUpdating && <CircularProgress size={22} />}
              Update
            </Button>
            )}
            {!isEdit && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => {
                setIsEdit(!isEdit)
              }}
            >
              {isUpdating && <CircularProgress size={22} />}
              Edit
            </Button>
            )}
          </div>
        </div>
      </Box>
    </>
  );
}
