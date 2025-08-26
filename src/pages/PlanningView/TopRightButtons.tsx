import { AddOutlined } from '@mui/icons-material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { IconButton } from '@mui/material';
import { FaRegCalendar } from 'react-icons/fa';
import { LuSquareChartGantt } from 'react-icons/lu';
import { TfiLayoutListThumbAlt } from 'react-icons/tfi';
import { useData } from 'src/StateProvider/Provider';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import IconButtonTabs from 'src/components/IconButtonTabs';
import { sidebarResource } from 'src/constants/helpers';

const TopRightButtons = ({ selectedResource, setCreateDialog, resetSelectedRecords, setView, view, onClickRefreshIcon, isProductSelected }) => {
  const {
    state: { permissions }
  }: any = useData();
  return (
    <div className="flex justify-end gap-1 ">
      {selectedResource &&
        permissions[selectedResource?.key]?.isCreate &&
        ![sidebarResource.product, sidebarResource.employeeMaster, sidebarResource.serializedAsset]?.includes(selectedResource?.resource) && (
          <ThemeButton
            className="mr-2"
            buttonType="theme"
            id={'add-button'}
            onClick={(e) => {
              setCreateDialog(true);
            }}
            startIcon={<AddOutlined />}
          >
            Create
          </ThemeButton>
        )}
      {![sidebarResource.employeeMaster]?.includes(selectedResource?.resource) && (
        <IconButtonTabs
          onItemClick={resetSelectedRecords}
          items={
            [
              {
                value: 'calendar',
                icon: <FaRegCalendar />,
                tooltip: 'Calendar View'
              },
              {
                ...(isProductSelected
                  ? {
                      value: 'gantt',
                      icon: <LuSquareChartGantt />,
                      tooltip: 'Gantt View'
                    }
                  : {
                      value: 'list',
                      icon: <TfiLayoutListThumbAlt />,
                      tooltip: 'List View'
                    })
              }
            ] as const
          }
          setValue={setView}
          value={view}
        />
      )}
      <HtmlTooltip title={'Refresh'}>
        <IconButton style={{ width: 32, height: 32 }} size="small" onClick={onClickRefreshIcon}>
          <RefreshIcon fontSize="small" color="primary" />
        </IconButton>
      </HtmlTooltip>
    </div>
  );
};

export default TopRightButtons;
