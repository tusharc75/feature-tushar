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
} from '@material-ui/core';
import { camelCase, kebabCase, lowerCase, startCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';

import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import SearchBox from '../../components/Helpers/SearchBox';
import Loader from '../../components/Loader';

const AssignDataDialog = (props) => {
  const { dialogOpen, onSuccess, handleCloseDialog, type, projectID, existingData, accountId = '', entityIds = [], users } = props;
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user }
  }: any = useData();
  const [data, setData] = useState([]);
  const [dataConst, setDataConst] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedData, setSelectedData] = useState([]);
  const [isAssigning, setAssigning] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let url = `/${type}?limit=0`;

    switch (type) {
      case 'customer-account':
        const userIdsString = users.map((u) => `"${u?._id?.toString()}"`).join(', ');
        url = `/${type}?filterById=[{"field":"owner", "term": {"$in":[${userIdsString}]}} ]`;
        break;

      case 'customer-contact':
        url = `/${type}?filterById=[{"field":"accountName", "term": "${accountId}"},{"field":"ownerCollaborator", "term": "${user?.user?._id}"} ]&filterType=and`;
        break;

      case 'opportunity':
        url = `/${type}?filterById=[{"field":"customerAccount", "term": "${accountId}"},{"field":"ownerCollaborator", "term": "${user?.user?._id}"} ]&filterType=and`;
        break;

      case 'quote-builder':
        url = `/${type}?filterById=[{"field":"customerAccountName", "term": "${accountId}"},{"field":"ownerCollaborator", "term": "${user?.user?._id}"} ]&filterType=and`;
        break;

      case 'quotation':
        url = `/${type}?filterById=[{"field":"customerAccount", "term": "${accountId}"},{"field":"ownerCollaborator", "term": "${user?.user?._id}"} ]&filterType=and`;
        break;

      case 'user':
        if (entityIds.length > 0) {
          url = `/${type}?filterById=[{"field":"entities.entity", "term": {"$in": [${entityIds.map((m) => `"${m}"`)}] } }]`;
        }
        break;
    }

    setLoading(true);
    axiosInstance()
      .get(url)
      .then(({ data: { data } }) => {
        const filteredData = data.filter((_d) => !existingData().some((item) => item === _d?._id));

        setData(filteredData);
        setDataConst(filteredData);
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
        toastConfig.setToastConfig(error);
      });
    // eslint-disable-next-line
  }, []);

  const handleUserSelection = (e, id) => {
    let tempSelectedData = [...selectedData];
    let curIndex = tempSelectedData.indexOf(id);
    if (e.target.checked) {
      if (curIndex < 0) tempSelectedData = [...tempSelectedData, id];
    } else if (curIndex >= 0) {
      tempSelectedData.splice(curIndex, 1);
    }
    setSelectedData(tempSelectedData);
  };

  const changeType = (type) => {
    let newType;
    if (type !== 'quote-builder') {
      newType = type;
    } else {
      newType = 'quote';
    }
    return newType;
  };

  const handleSave = () => {
    if (selectedData.length) {
      setAssigning(true);

      const dataObj = {
        [camelCase(type)]: [...selectedData, ...existingData()],
        _id: projectID
      };

      axiosInstance()
        .put(`/project-sales/add-${kebabCase(changeType(type))}`, dataObj)
        .then(() => {
          setAssigning(false);
          toastConfig.setToastConfig({
            message: `${startCase(type)} added successfully`,
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

  const getHeading = (type: string, data: any) => {
    switch (type) {
      case 'user':
        return `${data?.firstName ?? ''}  ${data.lastName}`;
      case 'lead':
        return `${data?.firstName ?? ''} ${data?.middleName ?? ''}  ${data.lastName}`;
      case 'opportunity':
        return `${data.opportunityName}`;
      case 'quote-builder':
        return `${data.quoteName}`;
      case 'customer-account':
        return `${data.accountName}`;
      case 'customer-contact':
        return `${data?.concatedName ?? ''}`;
      default:
        break;
    }
  };

  const getSubHeading = (type: string, data: any) => {
    switch (type) {
      case 'user':
        return data.email;
      case 'lead':
        return '';
      case 'opportunity':
        return '';
      case 'quote-builder':
        return '';
      case 'customer-account':
        return '';
      case 'customer-contact':
        return '';
      default:
        return '';
    }
  };

  const handleSearch = (e) => {
    let value = e.target.value;
    setSearch(value);
    let result = [];
    result = dataConst.filter((data) => {
      switch (type) {
        case 'user':
          return (
            data.firstName.toLowerCase().search(value.toLowerCase()) !== -1 ||
            data.lastName.toLowerCase().search(value.toLowerCase()) !== -1 ||
            data.email.toLowerCase().search(value.toLowerCase()) !== -1
          );
        case 'lead':
          return (
            data.salutation?.toLowerCase().search(value.toLowerCase()) !== -1 ||
            data.firstName?.toLowerCase().search(value.toLowerCase()) !== -1 ||
            data.middleName?.toLowerCase().search(value.toLowerCase()) !== -1 ||
            data.lastName?.toLowerCase().search(value.toLowerCase()) !== -1
          );
        case 'opportunity':
          return data.opportunityName.toLowerCase().search(value.toLowerCase()) !== -1;
        case 'quote-builder':
          return data.quoteName.toLowerCase().search(value.toLowerCase()) !== -1;
        case 'customer-account':
          return data.accountName.toLowerCase().search(value.toLowerCase()) !== -1;
        case 'customer-contact':
          return (
            data?.salutation?.toLowerCase().search(value.toLowerCase()) !== -1 ||
            data?.firstName?.toLowerCase().search(value.toLowerCase()) !== -1 ||
            data?.middleName?.toLowerCase().search(value.toLowerCase()) !== -1 ||
            data?.lastName?.toLowerCase().search(value.toLowerCase()) !== -1
          );
        default:
          break;
      }
    });
    setData(result);
  };

  return (
    <Dialog fullWidth maxWidth="xs" open={dialogOpen} onClose={handleCloseDialog} aria-labelledby="assign-dialog">
      <CustomDialogHeader title={`Assign ${startCase(type)}`} />
      <CustomDialogContent>
        {loading ? (
          <Loader text={`Loading ${startCase(type)}`} />
        ) : dataConst.length ? (
          <>
            <Grid container>
              <Grid item xs={12} md={6} sm={6} className="d-flex align-items-center gap-2">
                <FormControl component="fieldset">
                  <FormControlLabel
                    value="top"
                    control={
                      <Checkbox
                        // edge="start"
                        onChange={(e) => {
                          data.forEach((data) => (data.isChecked = e.target.checked));
                          setSelectedData(data.filter((r) => r.isChecked).map((obj) => obj._id));
                        }}
                        checked={data.every((x) => x.isChecked)}
                        inputProps={{
                          'aria-labelledby': `checkbox-list-label-select-all`
                        }}
                      />
                    }
                    label="Select All"
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6} sm={6} container justify="flex-end">
                <SearchBox onChange={handleSearch} className="terms_header_search_bar" width="300px" value={search} />
              </Grid>
            </Grid>

            <List style={{ padding: 0 }}>
              {data.map((_d) => (
                <ListItem divider key={_d._id}>
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      onChange={(e) => handleUserSelection(e, _d._id)}
                      checked={selectedData.indexOf(_d._id) >= 0}
                      inputProps={{
                        'aria-labelledby': `checkbox-list-label-${_d._id}`
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText primary={getHeading(type, _d)} secondary={getSubHeading(type, _d)} />
                </ListItem>
              ))}
            </List>
          </>
        ) : (
          <Typography>
            There are no {lowerCase(type)} or you have already added all {lowerCase(type)}
          </Typography>
        )}
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button disabled={isAssigning} onClick={handleCloseDialog} color="primary" size="small">
          Cancel
        </Button>
        <Button disabled={!selectedData.length || isAssigning} onClick={handleSave} color="primary" size="small" variant="contained">
          {isAssigning ? <CircularProgress size={22} /> : 'Save'}
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default AssignDataDialog;
