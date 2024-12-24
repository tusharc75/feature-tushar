import {
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  FormControl,
  FormControlLabel,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography
} from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../axios/axiosInstance';
import { CustomDialogTransition, opportunity } from '../../constants/helpers';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import Loader from '../Loader';
import { ListingPageHeader } from '../PageHeaders';
const AssignOpportunityDialog = ({ opportunityDialogOpen, onSuccess, handleCloseDialog, assignedOpportunity, accountId, contactId }) => {
  const toastConfig = useContext(CustomToastContext);
  const [opportunities, setOpportunities] = useState([]);
  const [opportunitiesConst, setOpportunitiesConst] = useState([]);
  const [loadingOpportunities, setLoadingOpportunities] = useState(false);
  const [selectedOpportunities, setSelectedOpportunities] = useState([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoadingOpportunities(true);
    axiosInstance()
      .get(`${opportunity.opportunityApi}?filterById=[{"field":"customerAccount", "term": "${accountId}"}]`)
      .then(({ data: { data } }) => {
        setOpportunities(
          data
            .filter((opportunity) => !assignedOpportunity.some((item) => item?._id === opportunity?._id))
            .map((obj) => ({ ...obj, isChecked: false }))
        );
        setOpportunitiesConst(
          data
            .filter((opportunity) => !assignedOpportunity.some((item) => item?._id === opportunity?._id))
            .map((obj) => ({ ...obj, isChecked: false }))
        );
        setLoadingOpportunities(false);
      })
      .catch((error) => {
        setLoadingOpportunities(false);
        toastConfig.setToastConfig(error);
      });
    // eslint-disable-next-line
  }, []);

  const handleAssignOpportunities = async () => {
    if (selectedOpportunities.length) {
      setIsAssigning(true);

      const dataObj = {
        _ids: selectedOpportunities,
        customerContact: [contactId]
      };

      await axiosInstance()
        .put(`/opportunity/add-customer-contacts`, dataObj)
        .then(({ data }) => {
          setIsAssigning(false);
          toastConfig.setToastConfig({
            message: data.message,
            type: 'success',
            open: true
          });

          onSuccess();
        })
        .catch((error) => {
          setIsAssigning(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleSearch = (e) => {
    let value = e.target.value;
    setSearch(value);
    let result = [];
    result = opportunitiesConst.filter((data) => {
      return data.opportunityName.toLowerCase().search(value.toLowerCase()) !== -1 || data.stage.toLowerCase().search(value.toLowerCase()) !== -1;
    });
    setOpportunities(result);
  };

  const leftSideContents = () => {
    return (
      <>
        <FormControl component="fieldset">
          <FormControlLabel
            value="top"
            className="m-0"
            control={
              <Checkbox
                edge="start"
                onChange={(e) => {
                  opportunities.forEach((opportunity) => (opportunity.isChecked = e.target.checked));
                  setSelectedOpportunities(opportunities.filter((r) => r.isChecked).map((obj) => obj._id));
                }}
                checked={opportunities.every((x) => x.isChecked)}
                inputProps={{
                  'aria-labelledby': `checkbox-list-label-select-all`
                }}
              />
            }
            label="Select All"
          />
        </FormControl>
      </>
    );
  };

  return (
    <Dialog
      TransitionComponent={CustomDialogTransition}
      fullWidth
      maxWidth="xs"
      open={opportunityDialogOpen}
      onClose={handleCloseDialog}
      aria-labelledby="assign-roles-dialog"
    >
      <CustomDialogHeader title="Assign Opportunities" />
      <CustomDialogContent>
        {loadingOpportunities ? (
          <Loader text="Loading Opportunities" />
        ) : opportunitiesConst.length ? (
          <>
            <ListingPageHeader
              showSearchInMobile={true}
              leftSideContents={leftSideContents()}
              isActionButtonVisible={false}
              isAddButtonVisible={false}
              setQueryString={false}
              searchValue={search}
              onSearch={handleSearch}
            />

            <List style={{ padding: 0 }}>
              {opportunities.map((opportunity) => (
                <ListItem divider key={opportunity._id}>
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      onChange={(e) => {
                        opportunity.isChecked = e.target.checked;
                        setSelectedOpportunities(opportunities.filter((r) => r.isChecked).map((obj) => obj._id));
                      }}
                      checked={opportunity.isChecked}
                      inputProps={{
                        'aria-labelledby': `checkbox-list-label-${opportunity._id}`
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText primary={opportunity.opportunityName} secondary={opportunity.stage} />
                </ListItem>
              ))}
            </List>
          </>
        ) : (
          <Typography>All Opportunity has been assigned</Typography>
        )}
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button disabled={isAssigning} onClick={handleCloseDialog} color="primary" size="small">
          Cancel
        </Button>
        <Button
          disabled={!selectedOpportunities.length || isAssigning}
          onClick={handleAssignOpportunities}
          color="primary"
          size="small"
          variant="contained"
        >
          {isAssigning ? <CircularProgress size={22} /> : 'Save'}
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default AssignOpportunityDialog;
