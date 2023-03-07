import { Box, Button, Grid, IconButton, Menu, MenuItem, Paper, Typography } from '@material-ui/core';
import { Fragment, useContext, useEffect, useReducer, useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import { DndProvider } from 'react-dnd';
import { isMobile, isTablet } from 'react-device-detect';
import { TouchBackend } from 'react-dnd-touch-backend';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { FleetDispatchList } from './FleetDispatchList';
import { isEqual } from 'lodash';


const FleetDispatch = () => {

    const [fleetDispatch, setFleetDispatch] = useState([
        {
            id: 1,
            status: 1,
            name: 'hello 1'
        },
        {
            id: 2,
            status: 1,
            name: 'hello 2'
        },
        {
            id: 3,
            status: 1,
            name: 'hello 3'
        },
        {
            id: 4,
            status: 2,
            name: 'hello 4'
        },
    ])

    const handleChangeStatus = (activityId, status, newIndex) => {
        const filterdByStatus = fleetDispatch.filter((a) => a.status === status);
        const activityIndex = filterdByStatus.findIndex((a) => a.id === activityId);

        const updatedState = fleetDispatch.map((fleetDispatch) => {
            if (fleetDispatch.id === activityId && fleetDispatch.status !== status) {
                return {
                    ...fleetDispatch,
                    status
                };
            }

            return fleetDispatch;
        });
        if (!isEqual(fleetDispatch, updatedState)) {
            setFleetDispatch(updatedState);
        }
        const updatedActivity = updatedState.find((a) => a.id === activityId);
        if (updatedActivity && updatedActivity.status === status) {
            const data = []

            fleetDispatch.forEach(element => {
                if (element.id === activityId) {
                    data.push({
                        id: element.id,
                        status: 2,
                        name: element.name
                    },)
                } else {
                    data.push(element)
                }
            });
            setFleetDispatch(data)
        }
    };

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
                        {[1, 2].map((data, index) => {
                            return (
                                <Grid item md={6} xs={12} sm={4} style={{ paddingTop: '0px' }} key={index} >
                                    <div style={{
                                        border: data === 2 ? '1px solid #D3D3D3' : '',
                                    }}>
                                        <FleetDispatchList
                                            loading={false}
                                            status={data}
                                            activity={fleetDispatch.filter(function (o) {
                                                return o.status === data;
                                            })}
                                            handleChangeStatus={handleChangeStatus}
                                        />
                                    </div>
                                </Grid>
                            );
                        })}
                    </Grid>
                </DndProvider>
            </Box>
        </Box>
    );
};

export default FleetDispatch;
