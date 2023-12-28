import React, { useState } from 'react';
import { Box, Button } from '@material-ui/core';
import WebcamDialog from './WebcamDialog';

const LogIn = () => {
  const handleFaceLogin = async () => {
    setCamOpen(true);
  };

  const [camOpen, setCamOpen] = useState(false);

  return (
    <>
      <Box mt={2} />
      <Button fullWidth variant="outlined" className="azure-login" onClick={handleFaceLogin}>
        Login using Face
      </Button>
      {camOpen && <WebcamDialog open={camOpen} onClose={() => setCamOpen(false)} />}
    </>
  );
};

export default LogIn;
