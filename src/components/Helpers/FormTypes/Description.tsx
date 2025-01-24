import { Box } from '@mui/material';

const Description = ({ fieldData }) => {
  return (
    <Box pt={1} pb={1}>
      <div dangerouslySetInnerHTML={{ __html: fieldData['htmlDescription'] }} />
    </Box>
  );
};

export default Description;
