import { Grid } from '@material-ui/core';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import CalendarView from './CalendarView';

const RentalPlanningCalendar = () => {

    return (<>
        <Grid container className="headerbox">
            <Grid item md={10} sm={9} xs={8}>
                <CustomBreadCrumbs
                    routes={[
                        {
                            title: 'Rental Planning Calendar',
                            path: '/Rental-planning-calendar'
                        }
                    ]}
                />
            </Grid>
        </Grid>
        <CustomContainer styles={{ minHeight: 'calc(100vh-200px)' }}>
            <CalendarView />
        </CustomContainer>
    </>
    );
};

export default RentalPlanningCalendar;
