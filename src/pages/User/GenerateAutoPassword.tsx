import { useContext, useEffect, useState } from 'react';
import { Button, Checkbox, CircularProgress, Dialog, FormControlLabel, Grid, TextField } from '@material-ui/core';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { CustomDialogTransition } from 'src/constants/helpers';

const GenerateAutoPassword = ({ ids = [], onClose }) => {
  const toastConfig = useContext(CustomToastContext);

  const [isAutoGenerate, setIsAutoGenerate] = useState(true);
  const [password, setPassword] = useState('');
  const [isCreatingPassword, setIsCreatingPassword] = useState(false);

  const generateRandomPassword = () => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_-+=<>?';

    let password = '';
    for (let i = 0; i < 10; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    if (!isValid(password)) {
      return generateRandomPassword();
    } else {
      return password;
    }
  };

  const isValid = (password = '') => {
    const regex = /^(?=.*?[A-Z])(?=(.*[a-z]){1,})(?=(.*[\d]){1,})(?=(.*[\W]){1,})(?!.*\s).{8,}$/;
    return regex.test(password);
  };

  useEffect(() => {
    if (isAutoGenerate) {
      setPassword(generateRandomPassword());
    } else {
      setPassword('');
    }
  }, [isAutoGenerate]);

  const generatePassword = () => {
    setIsCreatingPassword(true);

    axiosInstance()
      .post('/user/set-password', {
        password,
        ids
      })
      .then(() => {
        toastConfig.setToastConfig({ open: true, type: 'success', message: 'Password generated successfully' });
        onClose();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Dialog TransitionComponent={CustomDialogTransition} fullWidth maxWidth="xs" open={true} onClose={onClose} aria-labelledby="assign-roles-dialog">
      <CustomDialogHeader title="Generate Password" onClose={onClose} />

      <CustomDialogContent>
        <div className="mb-5 mt-5">
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    defaultChecked
                    onChange={() => {
                      setIsAutoGenerate((prevState) => !prevState);
                    }}
                  />
                }
                label="Auto generate password"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                id="password"
                fullWidth
                label="Password"
                variant="outlined"
                value={password}
                disabled={isAutoGenerate ? true : false}
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
                size="small"
                error={!isValid(password)}
                helperText={
                  !isValid(password) && 'Minimum eight characters, at least one uppercase, one lowercase, one number and one special character'
                }
              />
            </Grid>
          </Grid>
        </div>
      </CustomDialogContent>

      <CustomDialogFooter>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>

        <Button onClick={generatePassword} variant="contained" color="primary" disabled={isCreatingPassword || !isValid(password)}>
          {isCreatingPassword ? <CircularProgress size={20} /> : 'Generate'}
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default GenerateAutoPassword;
