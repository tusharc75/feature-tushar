import { Grid } from '@material-ui/core';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import routes from 'src/components/Helpers/Routes';
import CalendarView from './CalendarView';
import { useData } from 'src/StateProvider/Provider';

const RentalPlanningCalendar = () => {
  const {
    state: { resources }
  }: any = useData();
  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs
          routes={[{ ...routes.rentalPlanningCalendar, title: resources?.rentalPlanningCalendar?.titlePlural }]}
        />
      </div>
      <CustomContainer styles={{ minHeight: 'calc(100vh-200px)' }}>
        <CalendarView />
      </CustomContainer>
    </section>
  );
};

export default RentalPlanningCalendar;
