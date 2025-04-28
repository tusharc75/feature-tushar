import { Box } from '@mui/material';
import MessagePanel from 'src/pages/WorkSpace/MessagePanel';
import { useWorkSpace } from 'src/pages/WorkSpace/useWorkSpace';

const Collaborate = ({ resource, resourceLabel, resourceData }) => {
  const state = useWorkSpace({ title: resourceLabel });
  return (
    <Box className="activityDetailBox overflow-x-hidden">
      <MessagePanel state={state} resource={resource} fromSidebar={true} resourceLabel={resourceLabel} resourceData={resourceData} />
    </Box>
  );
};

export default Collaborate;
