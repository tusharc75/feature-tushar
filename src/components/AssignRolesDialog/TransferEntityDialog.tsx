import { useState, useContext } from 'react';
import { Checkbox, CircularProgress, Dialog, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import CustomDialogFooter from '../CustomDialog/CustomDialogFooter';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { camelCase } from 'lodash';
import { CustomDialogTransition } from 'src/constants/helpers';

const TransferEntityDialog = ({ TransferEntityDialogOpen, onSuccess, handleCloseDialog, selectedRecs, entities, type, api }) => {
  const toastConfig = useContext(CustomToastContext);
  const [selectedEntities, setSelectedEntities] = useState([]);
  const [isAssigning, setAssigning] = useState(false);

  const handleTransferEntity = async () => {
    if (selectedEntities.length) {
      setAssigning(true);

      const dataObj = {
        entity: selectedEntities[0],
        [type]: selectedRecs
      };

      await axiosInstance()
        .put(`/${api}/change-entity`, dataObj)
        .then(({ data }) => {
          setAssigning(false);
          toastConfig.setToastConfig({
            message: data.message,
            type: 'success',
            open: true
          });

          onSuccess();
        })
        .catch((error) => {
          setAssigning(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  return (
    <Dialog
      TransitionComponent={CustomDialogTransition}
      fullWidth
      maxWidth="xs"
      open={TransferEntityDialogOpen}
      onClose={handleCloseDialog}
      aria-labelledby="dialog"
    >
      <CustomDialogHeader title="Transfer Entity" />
      <CustomDialogContent>
        {entities.length ? (
          <List style={{ padding: 0 }}>
            {entities.map((entity) => (
              <ListItem divider key={entity._id}>
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    onChange={(e) => {
                      entity.isChecked = e.target.checked;
                      entity.isChecked ? setSelectedEntities([entity._id]) : setSelectedEntities([]);
                    }}
                    checked={entity._id === selectedEntities[0]}
                    inputProps={{
                      'aria-labelledby': `checkbox-list-label-${entity._id}`
                    }}
                  />
                </ListItemIcon>
                <ListItemText primary={`${entity.entityName}`} />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography>{`Selected ${camelCase(type)} already exist in all entities`}</Typography>
        )}
      </CustomDialogContent>
      <CustomDialogFooter>
        <ThemeButton disabled={isAssigning} onClick={handleCloseDialog} buttonType="transparent">
          Cancel
        </ThemeButton>
        <ThemeButton disabled={!selectedEntities.length || isAssigning} onClick={handleTransferEntity} buttonType="theme">
          {isAssigning ? <CircularProgress size={22} /> : 'Save'}
        </ThemeButton>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default TransferEntityDialog;
