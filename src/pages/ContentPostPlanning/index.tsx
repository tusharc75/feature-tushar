// src/pages/Planning/PlanningView.tsx
import { Box, IconButton } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import IconButtonTabs from 'src/components/IconButtonTabs';
import { TfiLayoutListThumbAlt } from 'react-icons/tfi';
import { FaRegCalendar } from 'react-icons/fa';
import { useCardReducer } from 'src/components/CardColTimeline';
import { useTableReducer } from 'src/components/CustomReactTable';
import { useData } from 'src/StateProvider/Provider';
import routes from 'src/components/Helpers/Routes';
import ListView from './List/listPageView';
import CalenderView from './Calender/calenderView';


const PlanningView = () => {
    const {
        state: { resources }
    }: any = useData();
    const { dispatch } = useCardReducer();
    const { dispatch: tableDispatch } = useTableReducer();
    const resetSelectedRecords = () => {
        dispatch({ type: 'selection', selectedRecords: [] });
        tableDispatch({ type: 'selection', selectedRecords: [] });
    };
    const [view, setView] = useState<'calendar' | 'list'>('calendar');

    const topRightSlot = (
        <TopRightButtons
            view={view}
            setView={setView}
            resetSelectedRecords={resetSelectedRecords}
        />
    );
    return (
        <Box className="main-container-v1">
            <Box className="headerbox-v1">
                <div className="headerbox-v1">
                    <CustomBreadCrumbs routes={[{ ...routes.contentPostPlanning, title: resources?.contentPostPlanning?.titlePlural }]} />
                </div>
            </Box>
            {view === 'calendar' ? (
                <CalenderView
                    topRightSlot={topRightSlot} />
            ) : (
                <ListView topRightSlot={topRightSlot} />
            )}

        </Box>
    );
};

export default PlanningView;

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
