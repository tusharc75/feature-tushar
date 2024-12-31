import {
  Checkbox,
  Dialog,
  FormControl,
  FormControlLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography
} from '@mui/material';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { startCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import { CustomDialogTransition, customerAccount, customerContact, opportunity, quoteBuilder } from '../../constants/helpers';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import Loader from '../Loader';
import { ListingPageHeader } from '../PageHeaders';
const AssignProjectSalesDialog = ({ projectSalesDialogOpen, onSuccess, handleCloseDialog, assignedProjectSales, type }) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user }
  }: any = useData();
  const [projectSales, setProjectSales] = useState([]);
  const [loadingProjectSales, setLoadingProjectSales] = useState(false);
  const [selectedProjectSales, setSelectedProjectSales] = useState([]);
  const [projectSalesConst, setProjectSalesConst] = useState([]);
  const [isAssigning, setAssigning] = useState(false);
  const [resource, setResource] = useState(null);
  const [id, setId] = useState(null);
  const [addAPI, setAddAPI] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoadingProjectSales(true);
    if (type.some((item) => item?.type === customerContact.contactResource)) {
      setResource(customerContact.contactResource);
      setId(type.find((item) => item.type === customerContact.contactResource).id);
      setAddAPI('customer-contacts');
    } else if (type.some((item) => item?.type === quoteBuilder.qbResource)) {
      setResource(quoteBuilder.qbResource);
      setId(type.find((item) => item.type === quoteBuilder.qbResource).id);
      setAddAPI('quotes');
    } else if (type.some((item) => item?.type === opportunity.opportunityResource)) {
      setResource(opportunity.opportunityResource);
      setId(type.find((item) => item.type === opportunity.opportunityResource).id);
      setAddAPI('opportunities');
    } else {
      setResource(customerAccount.accountResource);
      setId(type.find((item) => item.type === customerAccount.accountResource)?.id);
      setAddAPI('customer-accounts');
    }

    let api = type.some((item) => item?.type === customerContact.contactResource)
      ? `/project-sales?filterById=[{"field": "staticData.customerAccount", "term": "${type.find((item) => item.type === customerAccount.accountResource).id
      }"}]`
      : user?.user?._id
        ? `/project-sales?filterById=[{"field": "projectManager", "term": "${user?.user?._id}"}]`
        : `/project-sales`;
    axiosInstance()
      .get(api)
      .then(({ data: { data } }) => {
        setProjectSales(
          data
            .filter((projectSales) => !assignedProjectSales.some((item) => item?._id === projectSales?._id))
            .map((obj) => ({ ...obj, isChecked: false }))
        );
        setProjectSalesConst(
          data
            .filter((projectSales) => !assignedProjectSales.some((item) => item?._id === projectSales?._id))
            .map((obj) => ({ ...obj, isChecked: false }))
        );
        setLoadingProjectSales(false);
      })
      .catch((error) => {
        setLoadingProjectSales(false);
        toastConfig.setToastConfig(error);
      });
    // eslint-disable-next-line
  }, []);

  const handleAssignProjectSales = async () => {
    if (selectedProjectSales.length) {
      setAssigning(true);
      const dataObj = {
        [resource]: [id],
        _ids: selectedProjectSales
      };

      axiosInstance()
        .put(`/project-sales/add-${addAPI}`, dataObj)
        .then(() => {
          setAssigning(false);
          toastConfig.setToastConfig({
            message: `${startCase(resource)} added successfully`,
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

  const handleSearch = (e) => {
    let value = e.target.value;
    setSearch(value);
    let result = [];
    result = projectSalesConst.filter((data) => {
      return (
        data.projectName.toLowerCase().search(value.toLowerCase()) !== -1 ||
        data.projectManager?.optionLabel.toLowerCase().search(value.toLowerCase()) !== -1
      );
    });
    setProjectSales(result);
  };

  const leftSideContents = () => {
    return (
      <>
        <FormControl component="fieldset">
          <FormControlLabel
            value="top"
            control={
              <Checkbox
                // edge="start"
                onChange={(e) => {
                  projectSales.forEach((project) => (project.isChecked = e.target.checked));
                  setSelectedProjectSales(projectSales.filter((r) => r.isChecked).map((obj) => obj._id));
                }}
                checked={projectSales.every((x) => x.isChecked)}
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
      open={projectSalesDialogOpen}
      onClose={handleCloseDialog}
      aria-labelledby="assign-roles-dialog"
    >
      <CustomDialogHeader title="Assign Project List" />
      <CustomDialogContent>
        {loadingProjectSales ? (
          <Loader text="Loading Project List" />
        ) : projectSalesConst.length ? (
          <>
            <ListingPageHeader
              showSearchInMobile={true}
              leftSideContents={leftSideContents()}
              searchValue={search}
              onSearch={handleSearch}
              isActionButtonVisible={false}
              isAddButtonVisible={false}
              setQueryString={false}
            />

            <List style={{ padding: 0 }}>
              {projectSales.map((projectSale) => (
                <ListItem divider key={projectSale._id}>
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      onChange={(e) => {
                        projectSale.isChecked = e.target.checked;
                        setSelectedProjectSales(projectSales.filter((r) => r.isChecked).map((obj) => obj._id));
                      }}
                      checked={projectSale.isChecked}
                      inputProps={{
                        'aria-labelledby': `checkbox-list-label-${projectSale._id}`
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText primary={projectSale.projectName} secondary={projectSale.projectManager?.optionLabel} />
                </ListItem>
              ))}
            </List>
          </>
        ) : (
          <Typography>All Project List has been assigned</Typography>
        )}
      </CustomDialogContent>
      <CustomDialogFooter>
        <ThemeButton onClick={handleCloseDialog} buttonType="transparent">
          Cancel
        </ThemeButton>
        <ThemeButton disabled={!selectedProjectSales.length || isAssigning} isLoading={isAssigning} onClick={handleAssignProjectSales} buttonType="theme">
          Save
        </ThemeButton>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default AssignProjectSalesDialog;
