import { Box, TextField } from '@mui/material';
import React from 'react';
import { backendApi } from 'src/config';
import { FiLock } from 'react-icons/fi';
import axiosInstance from 'src/axios/axiosInstance';
import { ThemeButton } from 'src/components/Helpers/Buttons';

function SSOLoginButton() {
  const [checking, setChecking] = React.useState(false);
  const [textFieldShow, setTextFieldShow] = React.useState(false);
  const [textFieldError, setTextFieldError] = React.useState({ error: false, msg: '' });

  const [name, setName] = React.useState(null);

  const handleBrandCheck = async () => {
    if (name === null || name === '' || name.length < 1) return setTextFieldError({ error: true, msg: 'Please enter a brand' });
    setChecking(true);
    try {
      await axiosInstance()
        .get(`/brand/saml-check/${name}`)
        .then(async ({ data: { data } }) => {
          const res = await axiosInstance().get(backendApi + '/user/login/sso/' + data?.brand);
          const { data: resData } = res;
          window.location.href = resData.redirectUrl;
        });
      setChecking(false);
    } catch (e) {
      setChecking(false);
      setTextFieldError({ error: true, msg: 'SAML Not Found' });
    }
  };

  return (
    <>
      {textFieldShow && (
        <>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            label="Brand"
            name="brand"
            value={name || ''}
            error={textFieldError.error}
            helperText={textFieldError.msg}
            onChange={(e) => setName(e.target.value)}
          />
          <Box mt={1} />
        </>
      )}
      <ThemeButton
        onClick={() => {
          if (!textFieldShow) setTextFieldShow(true);
          if (textFieldShow) handleBrandCheck();
        }}
        disabled={checking}
        isLoading={checking}
        buttonType='theme'
      >
        Continue with SAML SSO
      </ThemeButton>
    </>
  );
}

export default SSOLoginButton;
