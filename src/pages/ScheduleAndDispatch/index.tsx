import { useState } from 'react';
import routes from 'src/components/Helpers/Routes';
import { useData } from 'src/StateProvider/Provider';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import Scheduler from 'src/pages/ScheduleAndDispatch/Scheduler';
import Dispatcher from 'src/pages/ScheduleAndDispatch/Dispatch';
import CustomContainer from 'src/components/CustomContainer';

const JobType = [
  {
    key: 'Scheduler',
    value: 1
  },
  {
    key: 'Dispatcher',
    value: 2
  }
];

const ScheduleAndDispatch = () => {
  const [viewType, setViewType] = useState(1);
  const {
    state: { resources }
  }: any = useData();

  return (
    <div className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ ...routes.scheduleAndDispatch, title: resources?.scheduleAndDispatch?.titlePlural }]} />
      </div>
      <CustomContainer styles={{ minHeight: 'calc(100vh-200px)' }}>
        <div className="header-panel flex flex-col gap-3">
          <ToggleButtonGroup
            size="small"
            className="d-flex align-items-center"
            value={viewType}
            exclusive
            onChange={(event, newFilter) => {
              setViewType(newFilter);
            }}
          >
            {JobType.map((k, index) => (
              <ToggleButton value={k.value} key={index}>
                {k.key}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </div>
        {viewType === 1 && <Scheduler />}
        {viewType === 2 && <Dispatcher />}
      </CustomContainer>
    </div>
  );
};

export default ScheduleAndDispatch;
