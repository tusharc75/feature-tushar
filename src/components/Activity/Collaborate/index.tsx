import MessagePanel from 'src/pages/WorkSpace/MessagePanel';
import { useWorkSpace } from 'src/pages/WorkSpace/useWorkSpace';

const Collaborate = ({ resource, resourceLabel, resourceData }) => {
  const state = useWorkSpace({ title: resourceLabel, fromSidebar: true });

  return (
    <div
      ref={(node) => {
        if (node) {
          node.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
        }
      }}
      className="activityDetailBox overflow-x-hidden"
    >
      <MessagePanel state={state} resource={resource} fromSidebar={true} resourceLabel={resourceLabel} resourceData={resourceData} />
    </div>
  );
};

export default Collaborate;
