import { Box, Typography } from '@material-ui/core';

const Description = ({ label, fieldData }) => {
  return (
    <Box border={1} borderColor="var(--common-border-color)" p={1}>
      <Typography
        style={{ marginBottom: '12px', fontWeight: '500', textAlign: 'center' }}
        color={'primary'}
      >
        {label}
      </Typography>
      <div dangerouslySetInnerHTML={{ __html: fieldData['htmlDescription'] }} />
    </Box>
  );
};

export default Description;
