import { Box } from '@mui/material';
import { useEffect, useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import IconButtonTabs from 'src/components/IconButtonTabs';
import { TfiLayoutListThumbAlt } from 'react-icons/tfi';
import { FaRegCalendar } from 'react-icons/fa';
import { useTableReducer } from 'src/components/CustomReactTable';
import { useData } from 'src/StateProvider/Provider';
import routes from 'src/components/Helpers/Routes';
import ListView from './List/listPageView';
import CalenderView from './Calender/calenderView';
import { camelCase } from 'lodash';
import { sidebarResource } from 'src/constants/helpers';
type ViewType = 'calendar' | 'list';

const ContentPostPlanning = () => {
  const renderedFrom = camelCase(sidebarResource?.contentPostPlanning);
  const {
    state: { resources }
  }: any = useData();
  const { dispatch: tableDispatch } = useTableReducer();
  const resetSelectedRecords = () => {
    tableDispatch({ type: 'selection', selectedRecords: [] });
  };

  const [view, setView] = useState<ViewType>(() => {
    return (localStorage.getItem(`${renderedFrom}_view`) as ViewType) || 'list';
  });

  useEffect(() => {
    localStorage.setItem(`${renderedFrom}_view`, view);
  }, [view]);

  const topRightSlot = <TopRightButtons view={view} setView={setView} resetSelectedRecords={resetSelectedRecords} />;
  return (
    <Box className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ ...routes.contentPostPlanning, title: resources?.contentPostPlanning?.titlePlural }]} />
      </div>
      {view === 'calendar' ? <CalenderView topRightSlot={topRightSlot} /> : <ListView topRightSlot={topRightSlot} />}
    </Box>
  );
};

export default ContentPostPlanning;

const TopRightButtons = ({ view, setView, resetSelectedRecords }: any) => {
  return (
    <div className="flex justify-end gap-1">
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
              value: 'list',
              icon: <TfiLayoutListThumbAlt />,
              tooltip: 'List View'
            }
          ] as const
        }
        setValue={(v: 'calendar' | 'list') => setView(v)}
        value={view}
      />
    </div>
  );
};
