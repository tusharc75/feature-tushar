import { useState } from 'react';
import routes from 'src/components/Helpers/Routes';
import { useData } from 'src/StateProvider/Provider';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import Scheduler from 'src/pages/ScheduleAndDispatch/Scheduler/index';
import Dispatch from 'src/pages/ScheduleAndDispatch/Dispatch/index';
import CustomContainer from 'src/components/CustomContainer';
import SearchBox from 'src/components/Helpers/SearchBox';
import { cn } from 'src/constants/helpers';
import { useDebounce } from 'src/hooks';

const JobType = [
  {
    key: 'Schedule',
    value: 1
  },
  {
    key: 'Dispatch',
    value: 2
  }
];

const ScheduleAndDispatch = () => {
  const [viewType, setViewType] = useState(1);
  const [searchValue, setSearchValue] = useState('');
  const debouncedSearchValue = useDebounce<string>(searchValue, 500);
  const {
    state: { resources }
  }: any = useData();

  return (
    <div className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ ...routes.scheduleAndDispatch, title: resources?.scheduleAndDispatch?.titlePlural }]} />
      </div>
      <CustomContainer styles={{ minHeight: 'calc(100vh-200px)' }}>
        <div className="header-panel flex gap-3">
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
          {viewType === 2 && (
            <>
              <SearchBox
                className={cn('!max-w-[250px]')}
                onChange={(e) => {
                  setSearchValue(e.target.value);
                }}
                value={searchValue}
              />
            </>
          )}
        </div>
        {viewType === 1 && <Scheduler />}
        {viewType === 2 && <Dispatch search={debouncedSearchValue} />}
      </CustomContainer>
    </div>
  );
};

export default ScheduleAndDispatch;
