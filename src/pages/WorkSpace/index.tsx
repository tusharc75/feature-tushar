import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import { cn } from 'src/constants/helpers';
import MessagePanel from 'src/pages/WorkSpace/MessagePanel';
import Sidebar from 'src/pages/WorkSpace/Sidebar';
import ManageChannel from './ManageChannelDialog';

import { useWorkSpace } from 'src/pages/WorkSpace/useWorkSpace';

const Workspace = ({ fromSidebar = false }: { fromSidebar?: boolean }) => {
  const state = useWorkSpace();

  return (
    <>
      <div className="main-container-v1">
        <div className="headerbox-v1">
          <CustomBreadCrumbs routes={[{ title: state.resources?.workSpace?.titlePlural }]} />
        </div>
        <CustomContainer className="!min-h-[var(--container-height)] border !p-0 [--container-height:calc(100vh-150px)] [--h:max(500px,_var(--container-height))] [--sidebar-width:270px] max-[768px]:[--container-height:calc(100vh-179px)]">
          <div
            className={cn(
              'relative flex min-h-[var(--h)] overflow-hidden rounded-l-lg transition-[margin]',
              state.isSidebarCollapsed && !state.mobScreen ? '-ml-[var(--sidebar-width)] w-[calc(100%+var(--sidebar-width))]' : ''
            )}
          >
            <Sidebar state={state} />
            <MessagePanel state={state} fromSidebar={fromSidebar} />
          </div>
        </CustomContainer>
        {state.editCreateChannelDialogData.open && (
          <ManageChannel
            onClose={() => state.setEditCreateChannelDialogData({ open: false, _id: null })}
            onSuccess={() => {
              state.fetchChannelsAndChats();
              state.setEditCreateChannelDialogData({ open: false, _id: null });
            }}
            _id={state.editCreateChannelDialogData?._id}
          />
        )}
      </div>
    </>
  );
};

export default Workspace;
