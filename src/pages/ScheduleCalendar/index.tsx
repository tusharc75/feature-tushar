import { Grid } from '@material-ui/core';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import { useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import CalendarView from './CalendarView';
import Roadmap from './Roadmap';

const viewTypes = [
  {
    key: 'Road Map',
    value: 1
  },
  {
    key: 'Calender',
    value: 2
  }
];

const ScheduleCalendar = () => {

  const [viewType, setViewType] = useState(1);

  return (<>
    <Grid container className="headerbox">
      <Grid item md={10} sm={9} xs={8}>
        <CustomBreadCrumbs
          routes={[
            {
              title: 'Schedule Calender',
              path: '/schedule-calendar'
            }
          ]}
        />
      </Grid>
      <Grid container justify="flex-end" md={2} sm={3} xs={4} >
        <ToggleButtonGroup
          size="small"
          value={viewType}
          exclusive
          onChange={(event, newFilter) => { setViewType(newFilter) }}>
          {viewTypes.map((k, index) => {
            return (<ToggleButton
              size="small"
              value={k.value}
              key={index}>
              {k.key}
            </ToggleButton>
            );
          })}
        </ToggleButtonGroup>
      </Grid>
    </Grid>
    <CustomContainer styles={{ minHeight: 'calc(100vh-200px)' }}>
      {viewType === 1 && <Roadmap />}
      {viewType === 2 && <CalendarView />}
    </CustomContainer>
  </>
  );
};

export default ScheduleCalendar;
