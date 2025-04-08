import { Add } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { VscLayoutSidebarLeft } from 'react-icons/vsc';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { cn } from 'src/constants/helpers';
import Channels from 'src/pages/WorkSpace/Sidebar/Channels';
import { UseWorkSpace } from 'src/pages/WorkSpace/useWorkSpace';

const Sidebar = ({ state }: { state: UseWorkSpace }) => {
  const { isSidebarCollapsed, mobScreen, setEditCreateChannelDialogData, toggleSidebar } = state;

  return (
    <>
      <div
        className={cn(
          'min-h-full w-[var(--sidebar-width)] max-w-[var(--sidebar-width)] flex-shrink-0  flex-grow space-y-3 px-3 py-4 transition-transform  duration-300 [border-right:1px_solid_var(--common-border-color)]',
          isSidebarCollapsed ? '[transform:translateX(-100%)]' : 'translate-x-0',
          mobScreen ? 'absolute bottom-0 left-0 top-0 z-20 bg-[var(--dark-primary,white)]' : ''
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <ThemeButton
            buttonType="theme"
            onClick={() => setEditCreateChannelDialogData({ open: true, _id: null })}
            iconForMobile={<Add />}
            mobileTooltip="New Channel"
            startIcon={<Add />}
          >
            New Channel
          </ThemeButton>
          <HtmlTooltip title="Hide sidebar">
            <IconButton size={'small'} style={{ minWidth: 32, minHeight: 32, marginRight: '-6px' }} onClick={toggleSidebar}>
              <VscLayoutSidebarLeft />
            </IconButton>
          </HtmlTooltip>
        </div>
        <Channels state={state} />
      </div>
    </>
  );
};

export default Sidebar;
