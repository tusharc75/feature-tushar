import React from "react";
import { Box, Typography, Container } from "@material-ui/core";

const Unauthorized = () => {
  return (
    <div>
      <Container maxWidth="sm">
        <Box textAlign="center">
          <Typography variant="h2">Unauthorized Access</Typography>
        </Box>
      </Container>
    </div>
  );
};

export default Unauthorized;
