import { useState, useEffect } from 'react';
import { Box, Grid, Typography, TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { makeStyles } from '@material-ui/core/styles';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { isEqual, kebabCase } from 'lodash';
import { isMobile, isTablet } from 'react-device-detect';

import statusList from '../../Helpers/statusList';
import { GetBoard } from '../../../../axios/activity';
import { useData } from '../../../../StateProvider/Provider';

import { BoardList } from './BoardList';
import axiosInstance from '../../../../axios/axiosInstance';
import { getApi, getData, resourceOptions } from '../../../../constants/helpers';

const useStyles = makeStyles((theme) => ({
  block: {
    background: '#f0f0f0',
    borderRadius: '4px',
    minHeight: 'calc(100vh - 33.5vh)',
    height: '100%'
  },
  activityMainBlock: {
    height: 'calc(100vh - 32vh)',
    overflow: 'auto'
  },
  ".MuiGrid-spacing-xs-1": {
    width: "calc(100vw + 14px)"
  }
}));

const Board = ({ type, filter }) => {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const classes = useStyles();
  const {
    state: { user, permissions }
  }: any = useData();
  const [resource, setResource] = useState('');
  const [resourceData, setResourceData] = useState(null);
  const [loadingResources, setLoadingResources] = useState(false);
  const [selectedResourceData, setSelectedResourceData] = useState(null);

  useEffect(() => {
    fetchBoard();
  }, [type, filter]);

  const fetchBoard = () => {
    GetBoard(type, JSON.stringify(filter))
      .then(({ data }) => {
        setActivities(data);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
      });
  };

  // Data for Autocomplete
  useEffect(() => {
    if (!resource) return;
    setLoadingResources(true);
    axiosInstance()
      .get(`${getApi(resource)}?limit=100`)
      .then(({ data: { data } }) => {
        if (data.length) {
          const mappedData = data.map((_d) => getData(resource, _d));
          setResourceData(mappedData || []);
        }
        setLoadingResources(false);
      })
      .catch((error) => {
        setLoadingResources(false);
      });

    return () => {
      setSelectedResourceData(null);
      setResourceData(null);
    };
    // eslint-disable-next-line
  }, [resource]);

  const handleChangeStatus = (activityId: string, status: string, newIndex: string) => {
    const filterdByStatus = activities.filter((a) => a.status === status);
    const activityIndex = filterdByStatus.findIndex((a) => a._id === activityId);

    const updatedState = activities.map((activity: any) => {
      if (activity._id === activityId && activity.status !== status) {
        return {
          ...activity,
          status
        };
      }

      return activity;
    });
    if (!isEqual(activities, updatedState)) {
      setActivities(updatedState);
    }
    const updatedActivity = updatedState.find((a) => a._id === activityId);
    if (updatedActivity && updatedActivity.status === status) {
      updateStatus(activityId, updatedActivity);
    }
  };

  const updateStatus = (id: string, updatedData: any) => {
    axiosInstance()
      .put(`${type}/${id}`, { status: updatedData.status })
      .then(({ data }) => { })
      .catch((err) => {
        fetchBoard();
      });
  };


  let newResourceOptions = [];

  for(let i=0; i<resourceOptions.length; i++){
    if(resourceOptions[i] === 'Customer Account'){
       if(permissions.customerAccount.isRead === true ){
         newResourceOptions.push(resourceOptions[i]);
         i++;
       }
    }
    if(resourceOptions[i] === 'Customer Contact'){
      if(permissions.customerContact.isRead === true ){
        newResourceOptions.push(resourceOptions[i]);
      }
   }
   if(resourceOptions[i] === 'Supplier Account'){
    if(permissions.supplierAccount.isRead === true ){
      newResourceOptions.push(resourceOptions[i]);
    }
 }
 if(resourceOptions[i] === 'Supplier Contact'){
  if(permissions.supplierContact.isRead === true ){
    newResourceOptions.push(resourceOptions[i]);
  }
}
if(resourceOptions[i] === 'Lead'){
  if(permissions.lead.isRead === true ){
    newResourceOptions.push(resourceOptions[i]);
  }
}
if(resourceOptions[i] === 'Opportunity'){
  if(permissions.opportunity.isRead === true ){
    newResourceOptions.push(resourceOptions[i]);
  }
}
if(resourceOptions[i] === 'Customer Account'){
  if(permissions.customerAccount.isRead === true ){
    newResourceOptions.push(resourceOptions[i]);
  }
}
if(resourceOptions[i] === 'Quote'){
  if(permissions.quoteBuilder.isRead === true ){
    newResourceOptions.push(resourceOptions[i]);
  }
}
if(resourceOptions[i] === 'Rental Management'){
  if(permissions.rentalManagement.isRead === true ){
    newResourceOptions.push(resourceOptions[i]);
  }
}
if(resourceOptions[i] === 'Delivery Ticket'){
  if(permissions.deliveryTicket.isRead === true ){
    newResourceOptions.push(resourceOptions[i]);
  }
}
if(resourceOptions[i] === "Project Sales"){
  if(permissions.projectSales.isRead === true ){
    newResourceOptions.push(resourceOptions[i]);
  }
}
  }





  return (
    <>
      <Box display="flex" pb={1}>
        <Autocomplete
          options={newResourceOptions}
          getOptionLabel={(option) => option}
          style={{ width: '50%' }}
          value={resource}
          onChange={(event, newValue) => {
            setResource(newValue);
          }}
          size="small"
          renderInput={(params) =>
            isMobile && !isTablet ? (
              <TextField {...params} label="Select Resource" variant="standard" className={isMobile ? 'serchBox' : ''} />
            ) : (
              <TextField {...params} label="Select Resource" variant="outlined" />
            )
          }
        />
        <Box mx={isMobile ? 0 : 1} />
        {Boolean(resource) && resourceData && (
          <Autocomplete
            disabled={loadingResources}
            options={resourceData}
            getOptionLabel={(option: any) => option.name}
            getOptionSelected={(option: any, value: any) => option.name === value.name}
            style={{ width: '50%' }}
            value={selectedResourceData}
            onChange={(event, newValue) => {
              setSelectedResourceData(newValue);
            }}
            size="small"
            renderInput={(params) => <TextField {...params} label={`Select ${resource}`} variant="outlined" />}
          />
        )}
      </Box>
      <DndProvider backend={isMobile || isTablet ? TouchBackend : HTML5Backend}>
        <Grid container spacing={2} className={classes.activityMainBlock}>
          {statusList.map((data, index) => (
            <Grid item md={3} xs={12} sm={4} key={index}>
              <div className={classes.block}>
                {!loading && (
                  <Box p={1}>
                    <Typography variant="subtitle2">
                      {data.status.toUpperCase()}
                      {' (' +
                        activities.filter(function (o) {
                          return o.status === data.status;
                        }).length +
                        ')'}
                    </Typography>
                  </Box>
                )}
                <BoardList
                  loading={loading}
                  selectedResource={selectedResourceData}
                  resource={resource}
                  status={data.status}
                  activity={activities.filter(function (o) {
                    return o.status === data.status;
                  })}
                  fetchBoard={fetchBoard}
                  type={type}
                  handleChangeStatus={handleChangeStatus}
                />
              </div>
            </Grid>
          ))}
        </Grid>
      </DndProvider>
    </>
  );
};

export default Board;
