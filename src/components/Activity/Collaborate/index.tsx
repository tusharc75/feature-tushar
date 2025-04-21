import { Box, Typography } from '@mui/material';
import { useState } from 'react';
import ActivityLoader from 'src/components/Helpers/ActivityLoader';
import MessagePanel from 'src/pages/WorkSpace/MessagePanel';
import { useWorkSpace } from 'src/pages/WorkSpace/useWorkSpace';

const Collaborate = ({ resource }) => {
  const state = useWorkSpace();

  const [loading, setLoading] = useState(false);
  return <Box className="activityDetailBox">{loading ? <ActivityLoader /> : <MessagePanel state={state} resource={resource} />}</Box>;
};

export default Collaborate;
