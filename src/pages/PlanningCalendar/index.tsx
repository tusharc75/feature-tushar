import { Grid, useMediaQuery } from '@mui/material';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import routes from 'src/components/Helpers/Routes';
import CalendarView from './CalendarView';
import Roadmap from './Roadmap';
import { useData } from 'src/StateProvider/Provider';

const viewTypes = [
  {
    key: 'Road Map',
    value: 1
  },
  {
    key: 'Calender',
    value: 2
  }
] as const;

type ViewType = (typeof viewTypes)[number]['value'];

const PlanningCalendar = () => {
  const isMobile = useMediaQuery('(max-width:768px)');
  const [viewType, setViewType] = useState<ViewType>(isMobile ? 2 : 1);
  const {
    state: { resources }
  }: any = useData();

  return (
    <div className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ ...routes.planningCalendar, title: resources?.planningCalendar?.titlePlural }]} />
        {!isMobile && (
          <ToggleButtonGroup
            size="small"
            value={viewType}
            exclusive
            onChange={(event, newFilter) => {
              setViewType(newFilter);
            }}
          >
            {viewTypes.map((k, index) => {
              return (
                <ToggleButton size="small" value={k.value} key={index} style={{ minWidth: 'max-content' }}>
                  {k.key}
                </ToggleButton>
              );
            })}
          </ToggleButtonGroup>
        )}
      </div>
      <CustomContainer styles={{ minHeight: 'calc(100vh-200px)' }}>
        {isMobile ? (
          <CalendarView />
        ) : (
          <>
            {viewType === 1 && <Roadmap />}
            {viewType === 2 && <CalendarView />}
          </>
        )}
      </CustomContainer>
    </div>
  );
};

export default PlanningCalendar;
