import { TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import routes from 'src/components/Helpers/Routes';
import { LOG_RESOURCE, } from 'src/constants/helpers';
import { useData } from '../../StateProvider/Provider';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import ResourceLogsGrid from './ResourceLogsGrid';

const ResourceLogs = () => {

  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions, resources }
  }: any = useData();
  const [option, setOption] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [resourceOptions, setResourceOptions] = useState([]);
  const [userOptions, setUserOptions] = useState([]);

  const actionOptions = [
    {
      optionLabel: 'Create',
      optionValue: 'create'
    },
    {
      optionLabel: 'Update',
      optionValue: 'update'
    },
    {
      optionLabel: 'Delete',
      optionValue: 'delete'
    }
  ];

  const [selectedAction, setSelectedAction] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const data: any = [];
    for (var key in LOG_RESOURCE) {
      if (permissions[key]?.isRead === true) {
        data.push({ optionLabel: routes[key].title, optionValue: LOG_RESOURCE[key], key: key });
      }
    }
    setResourceOptions(data);
    if (data?.length >= 1) {
      setSelectedResource(data[0]);
    }
  }, []);

  useEffect(() => {
    if (selectedResource) {
      axiosInstance()
        .get(`/sa-formbuilder/lookup?lookupResource=${selectedResource?.optionValue}`)
        .then(({ data: { data } }) => {
          setOption(data[selectedResource?.optionValue] || []);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  }, [selectedResource]);

  useEffect(() => {
    if (selectedResource) {
      axiosInstance().get(`/sa-formbuilder/lookup?lookupResource=User`).then(({ data: { data } }) => {
        setUserOptions(data["User"])
      })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  }, [selectedResource]);

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{...routes.resourceLogs, title: resources?.resourceLogs?.titlePlural}]} />
      </div>
      <CustomContainer>
        <div className="header-panel">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[8px]">
            <Autocomplete
              fullWidth
              options={resourceOptions}
              getOptionLabel={(option) => option.optionLabel}
              value={selectedResource}
              onChange={(event, newValue) => {
                setSelectedResource(newValue);
                setSelectedOption(null);
              }}
              size="small"
              renderInput={(params) => <TextField {...params} label="Select Resource" variant="outlined" />}
            />
            {selectedResource && (
              <>
                <Autocomplete
                  options={option}
                  fullWidth
                  getOptionLabel={(option: any) => option.optionLabel}
                  getOptionSelected={(option: any, value: any) => option.optionValue === value.optionValue}
                  value={selectedOption}
                  onChange={(event, newValue) => {
                    setSelectedOption(newValue);
                  }}
                  size="small"
                  renderInput={(params) => <TextField {...params} label={`Select ${selectedResource?.optionLabel}`} variant="outlined" />}
                />
                <Autocomplete
                  options={actionOptions}
                  fullWidth
                  getOptionLabel={(option: any) => option.optionLabel}
                  getOptionSelected={(option: any, value: any) => option.optionValue === value.optionValue}
                  value={selectedAction}
                  onChange={(event, newValue) => {
                    setSelectedAction(newValue);
                  }}
                  size="small"
                  renderInput={(params) => <TextField {...params} label={'Select Operation'} variant="outlined" />}
                />
                <Autocomplete
                  options={userOptions}
                  fullWidth
                  getOptionLabel={(option: any) => option.optionLabel}
                  getOptionSelected={(option: any, value: any) => option.optionValue === value.optionValue}
                  value={selectedUser}
                  onChange={(event, newValue) => {
                    setSelectedUser(newValue);
                  }}
                  size="small"
                  renderInput={(params) => <TextField {...params} label={'Select User'} variant="outlined" />}
                />
              </>
            )}
          </div>
        </div>
        <ResourceLogsGrid selectedResource={selectedResource} selectedOption={selectedOption?.optionValue} selectedAction={selectedAction?.optionValue} selectedUser={selectedUser?.optionValue} />
      </CustomContainer>
    </section>
  );
};

export default ResourceLogs;
