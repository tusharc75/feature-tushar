import { useState } from 'react'
import { Box, Button, Typography } from '@material-ui/core';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import CustomContainer from 'src/components/CustomContainer';
import { motion } from 'framer-motion';

function Docs() {
    const [openDialog, setOpenDialog] = useState({ open: false, type: "" });

    return (
        <div
        className="main-content"
      >
        <Box >
          {/* Add content for the section */}
          <Typography variant="h4">Getting Started</Typography>
          <Typography variant="body1">Welcome to the Equipt Portal.</Typography>
        </Box>
      </div>
      
    )
}

export default Docs;