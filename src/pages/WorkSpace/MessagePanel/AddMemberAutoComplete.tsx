import { CircularProgress, TextField } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { debounce, uniqBy } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';

const AddMemberAutoComplete = ({
  channelId = null,
  resourceData = null,
  ignoreIds = [],
  fetchChannelData = () => {},
  resourceLabel = null,
  setSelectedChannel = (data: any) => {}
}) => {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const toastConfig = useContext(CustomToastContext);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const {
    state: {
      user: { user }
    }
  } = useData();

  const fetchOptions = debounce(async (searchKey: string = '', page: number = 0) => {
    setLoading(true);
    try {
      if (searchKey !== '') {
        page = 0;
        setCurrentPage(0);
      }
      let query = `user?limit=25&page=${page}&search=${searchKey}&ignoreIds=${JSON.stringify(ignoreIds)}`;
      const response = await axiosInstance().get(query);
      let optionsData = response?.data?.data?.map((user) => ({
        optionLabel: user.firstName + ' ' + user.lastName,
        optionValue: user._id
      }));

      setOptions((currentOptions) => {
        let alreadySelectedOptions: any =
          currentOptions?.filter((option) => selectedUsers?.map((s) => s?.optionValue)?.includes(option?.optionValue)) || [];
        optionsData = uniqBy([...alreadySelectedOptions, ...optionsData], 'optionValue');
        return page === 0 ? optionsData : [...currentOptions, ...optionsData];
      });
      if (page > 0 && optionsData?.length > 0) {
        setCurrentPage(page);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    } finally {
      setLoading(false);
    }
  }, 1000);

  const handleAddMembers = async () => {
    if (resourceData && !channelId) {
      try {
        const { data } = await axiosInstance().post('/work-space/channel', {
          access: 'public',
          title: resourceLabel,
          description: '',
          resource: resourceLabel,
          members: [...selectedUsers?.map((s) => s?.optionValue), user._id]
        });
        setSelectedChannel(data?.data);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message || 'Channel created successfully'
        });
      } catch (error) {
        toastConfig.setToastConfig(error);
      } finally {
        fetchChannelData();
        setSelectedUsers([]);
        setOptions([]);
      }
    } else {
      try {
        const { data } = await axiosInstance().put(`/work-space/channel/${channelId}`, { userIds: selectedUsers?.map((s) => s?.optionValue) });
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      } catch (error) {
        toastConfig.setToastConfig(error);
      } finally {
        fetchChannelData();
        setSelectedUsers([]);
        setOptions([]);
      }
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  return (
    <div className="flex flex-grow items-center gap-2">
      <Autocomplete
        multiple={true}
        fullWidth
        sx={{ flexGrow: 1 }}
        onOpen={() => {
          fetchOptions('', 0);
        }}
        inputValue={inputValue}
        onInputChange={(event, value, reason) => {
          if (reason === 'input') {
            setInputValue(value);
            fetchOptions(value);
          }
        }}
        loading={loading || !options}
        options={options}
        autoHighlight
        value={selectedUsers?.map(
          (user) => options?.find((option) => option?.optionValue === user?.optionValue) || { optionLabel: '', optionValue: user?.optionValue }
        )}
        getOptionLabel={(option) => option.optionLabel || ''}
        isOptionEqualToValue={(option, val) => option.optionValue === val.optionValue}
        onChange={(event, newValue) => {
          setSelectedUsers(newValue);
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={'Add Users'}
            name={'users'}
            autoFocus
            required={true}
            slotProps={{
              input: {
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                )
              }
            }}
            margin="none"
            size={'small'}
            variant="outlined"
          />
        )}
        ListboxProps={{
          onScroll: (e: any) => {
            if (e.target.scrollTop + e.target.clientHeight >= e.target.scrollHeight - 1) {
              fetchOptions('', currentPage + 1);
            }
          }
        }}
      />
      <ThemeButton
        buttonType="theme"
        disabled={selectedUsers?.length === 0}
        onClick={(e) => {
          e.preventDefault();
          handleAddMembers();
        }}
      >
        Add
      </ThemeButton>
    </div>
  );
};

export default AddMemberAutoComplete;
