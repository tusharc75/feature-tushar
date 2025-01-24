import { CircularProgress, Dialog, TextField } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { debounce, uniqBy } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { CustomDialogTransition } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const AddMemberDialog = ({ onClose, channelId = null, onSuccess, ignoreIds = [], newChat = false, users= [] }) => {
  const [selectedUsers, setSelectedUsers] = useState(users?.length > 0 ? users : []);
  const toastConfig = useContext(CustomToastContext);

  const [options, setOptions] = useState(users?.length > 0 ? users : []);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

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
        let alreadySelectedOptions: any = currentOptions?.filter((option) => selectedUsers?.map(s => s?.optionValue)?.includes(option?.optionValue)) || [];
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
    try {
      const { data } = await axiosInstance().put(`/work-space/channel/${channelId}`, { userIds: selectedUsers?.map(s => s?.optionValue) });
      onSuccess();
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: data.message
      });
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  return (<>
    <Dialog
      maxWidth="sm"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
      onClose={onClose}
    >
      <CustomDialogHeader
        onClose={onClose}
        title={'Add Members'}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
        showRequiredLabel={false}
      />
      <CustomDialogContent >
        <Autocomplete
          multiple={true}
          fullWidth
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
          value={selectedUsers?.map((user) => options?.find((option) => option?.optionValue === user?.optionValue) || { optionLabel: '', optionValue: user?.optionValue })}
          getOptionLabel={(option) => option.optionLabel || ''}
          isOptionEqualToValue={(option, val) => option.optionValue === val.optionValue}
          onChange={(event, newValue) => { setSelectedUsers(newValue) }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={'Select Users'}
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
      </CustomDialogContent>
      <CustomDialogFooter>
        <ThemeButton
          buttonType="transparent"
          onClick={onClose}
        >
          Cancel
        </ThemeButton>
        <ThemeButton
          buttonType="theme"
          disabled={selectedUsers?.length === 0}
          onClick={(e) => {
            e.preventDefault();
            if (newChat) {
              onSuccess(selectedUsers);
            } else {
              handleAddMembers();
            }
            onClose();
          }}
        >
          Add
        </ThemeButton>
      </CustomDialogFooter>
    </Dialog>
  </>);
};

export default AddMemberDialog;
