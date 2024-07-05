import { Box } from '@material-ui/core';

const Description = ({ fieldData }) => {
  return (
    <Box pt={1} pb={1}>
      <div dangerouslySetInnerHTML={{ __html: fieldData['htmlDescription'] }} />
    </Box>
  );
};

export default Description;
