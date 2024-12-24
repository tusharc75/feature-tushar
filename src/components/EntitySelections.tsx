import React, { useState, useEffect, useContext, memo } from 'react';
import axiosInstance from '../axios/axiosInstance';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import CustomButton from './Helpers/CustomButton';
import Button from '@mui/material/Button';
import CustomDialogContent from './CustomDialog/CustomDialogContent';
import CustomDialogFooter from './CustomDialog/CustomDialogFooter';
import CustomDialogHeader from './CustomDialog/CustomDialogHeader';
import Dialog from '@mui/material/Dialog';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition, entity } from '../constants/helpers';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import BoxWithBorder from './BoxWithBorder';
import { Skeleton } from '@material-ui/lab';
import { CustomToastContext } from '../StateProvider/CustomToastContext/CustomToastContext';

function EntitySelections(props) {
  const toastConfig = useContext(CustomToastContext);
  const { open, entities = [], resource, resourceIds = [], onClose, onSuccess } = props;
  const [selectedEntities, setSelectedEntities] = useState([]);
  const [entityList, setEntityList] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const { entityApi } = entity;
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  useEffect(() => {
    setSelectedEntities([...entities]);
  }, [entities]);

  useEffect(() => {
    fetchEntities();
  }, []);

  const fetchEntities = () => {
    setDataLoading(true);
    axiosInstance()
      .get(`${entityApi}`)
      .then(({ data: { data } }) => {
        setEntityList(data);
        setDataLoading(false);
      })
      .catch((err) => {
        setDataLoading(false);
      });
  };

  const onUpdateEntity = () => {
    let filteredIds = [];
    resourceIds.forEach((currentId) => {
      if (filteredIds.indexOf(currentId) < 0) filteredIds.push(currentId);
    });
    let request = {
      ids: [...filteredIds],
      entity: [...selectedEntities]
    };
    setLoading(true);
    axiosInstance()
      .put(`/entity/entity-resource/${resource}`, request)
      .then(({ data }) => {
        setLoading(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        onClose();
        onSuccess();
      })
      .catch((error) => {
        setLoading(false);
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <>
      <Dialog
        maxWidth="sm"
        fullScreen={fullScreen || isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        open={open}
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {
          }
        }}
        fullWidth
      >
        <CustomDialogHeader
          title="Assign Entity"
          onClose={onClose}
          isMinimized={!fullScreen}
          onMinimizeMaximize={() => {
            setFullScreen((prevState) => !prevState);
          }}
          showManimizeMaximize={true}
        />

        <CustomDialogContent>
          {dataLoading ? (
            <Box>
              {[1, 2].map((i) => (
                <BoxWithBorder
                  key={i}
                  style={{
                    margin: '8px'
                  }}
                >
                  <Box padding={1}>
                    <Skeleton variant="text" width="100px" height="20px" />
                    <Box marginTop={1} />
                    <Skeleton variant="text" width="100%" height="15px" />
                  </Box>
                </BoxWithBorder>
              ))}
            </Box>
          ) : entityList?.length === 0 ? (
            <>
              <Card>
                <CardContent>
                  <Typography variant="h5" component="h2">
                    No Entity
                  </Typography>
                </CardContent>
              </Card>
            </>
          ) : (
            <List style={{ padding: 0 }}>
              {entityList?.map((d) => (
                <ListItem divider key={d?._id}>
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      onChange={(e) => {
                        let list = [...selectedEntities];
                        if (e.target.checked) {
                          if (list.indexOf(d._id) < 0) {
                            list.push(d._id);
                          }
                        } else {
                          list.splice(list.indexOf(d._id), 1);
                        }
                        setSelectedEntities([...list]);
                      }}
                      checked={selectedEntities?.indexOf(d._id) >= 0}
                      inputProps={{
                        'aria-labelledby': `checkbox-list-label-${d._id}`
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText primary={d?.entityName || ''} secondary={d?.address?.optionLabel || d?.address || ''} />
                </ListItem>
              ))}
            </List>
          )}
        </CustomDialogContent>
        <CustomDialogFooter>
          <Button size="small" color="primary" onClick={onClose}>
            Cancel
          </Button>
          <CustomButton loading={loading} disabled={loading} variant="contained" color="primary" type="submit" onClick={onUpdateEntity}>
            {' '}
            Save
          </CustomButton>
        </CustomDialogFooter>
      </Dialog>
    </>
  );
}
export default memo(EntitySelections);
