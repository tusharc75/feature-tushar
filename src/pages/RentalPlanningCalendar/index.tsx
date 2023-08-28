import { Grid } from '@material-ui/core';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import routes from 'src/components/Helpers/Routes';
import CalendarView from './CalendarView';

const RentalPlanningCalendar = () => {
  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs
          routes={[
            {
              title: routes.rentalPlanningCalendar.title,
              path: routes.rentalPlanningCalendar.path
            }
          ]}
        />
      </div>
      <CustomContainer styles={{ minHeight: 'calc(100vh-200px)' }}>
        <CalendarView />
      </CustomContainer>
    </section>
  );
};

export default RentalPlanningCalendar;
