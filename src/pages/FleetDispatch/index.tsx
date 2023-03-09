import { Box, Button, Grid, IconButton, Menu, MenuItem, Paper, Typography } from '@material-ui/core';
import { Fragment, useContext, useEffect, useReducer, useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import { DndProvider } from 'react-dnd';
import { isMobile, isTablet } from 'react-device-detect';
import { TouchBackend } from 'react-dnd-touch-backend';
import { HTML5Backend } from 'react-dnd-html5-backend';
import DispatchList from './DispatchList';
import { isEqual } from 'lodash';

const FleetDispatch = () => {


    const [fleet, setFleet] = useState([
        {
            id: 11,
            name: 'Truck 1'
        },
        {
            id: 22,
            name: 'Truck 2'
        }
    ])
    const [jobs, setJobs] = useState([
        {
            id: 1111,
            name: 'Job 1'
        },
        {
            id: 2222,
            name: 'Job 2'
        }
    ])

    const handleDispatch = (card1, card2) => {
        console.log(card1)
        console.log(card2)
    }

    return (
        <Box className="main-container-v1">
            <Box className="headerbox-v1">
                <Box className="nav-v1">
                    <CustomBreadCrumbs routes={[{ title: routes.fleetDispatch.title }]} />
                </Box>
            </Box>
            <Box className={`detail-container-v1`}>
                <DndProvider backend={isMobile || isTablet ? TouchBackend : HTML5Backend}>
                    <Grid container spacing={2}>
                        <Grid item md={6} xs={12} sm={4} style={{ paddingTop: '0px' }}  >
                            <DispatchList
                                activity={fleet}
                                type="fleet"
                                handleDispatch={handleDispatch}
                            />
                        </Grid>
                        <Grid item md={6} xs={12} sm={4} style={{ paddingTop: '0px' }}  >
                            <DispatchList
                                activity={jobs}
                                type="job"
                                handleDispatch={handleDispatch}
                            />
                        </Grid>
                    </Grid>
                </DndProvider>
            </Box>
        </Box>
    );
};

export default FleetDispatch;
