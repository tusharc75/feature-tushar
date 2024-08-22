import { CircularProgress, TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { debounce } from 'lodash';
import { useContext, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import DashboardModal from 'src/components/DashboardModal';
import CustomButton from 'src/components/Helpers/CustomButton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const AddMemberDialog = ({ onClose, channelId, onSuccess, ignoreIds }) => {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const toastConfig = useContext(CustomToastContext);

  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const fetchOptions = debounce(async (searchKey: string = '', page: number = 0) => {
    setLoading(true);
    try {
      if (searchKey !== '') {
        page = 0;
        setCurrentPage(0);
      }
      let query = `user?limit=25&page=${page}&search=${searchKey}&withoutRoleLookup=true&ignoreIds=${JSON.stringify(ignoreIds)}`;
      const response = await axiosInstance().get(query);
      let optionsData = response?.data?.data?.map((user) => ({
        optionLabel: user.firstName + ' ' + user.lastName,
        optionValue: user._id
      }));

      setOptions((currentOptions) => {
        return page === 0 ? [...optionsData] : [...currentOptions, ...optionsData];
      });
      if (page > 0 && optionsData?.length > 0) {
        setCurrentPage(page);
      }
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  }, 1000);

  const handleAddMembers = async () => {
    try {
      const { data } = await axiosInstance().put(`/work-space/channel/${channelId}`, { userIds: selectedUsers });
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

  return (
    <DashboardModal
      handleClose={onClose}
      open={true}
      dialogProps={{
        fullScreen: isMobile || isTablet,
        maxWidth: 'xs'
      }}
      modalHead={{
        title: `Add Members`,
        fullScreenOption: true
      }}
      footer={
        <CustomButton
          variant="contained"
          color="primary"
          disabled={selectedUsers.length === 0}
          onClick={(e) => {
            e.preventDefault();
            handleAddMembers();
            onClose();
          }}
        >
          Add
        </CustomButton>
      }
    >
      <Autocomplete
        multiple={true}
        fullWidth
        onOpen={() => {
          fetchOptions('', 0);
        }}
        onInputChange={(event, value, reason) => {
          if (reason === 'input') {
            fetchOptions(value);
          }
        }}
        loading={loading}
        options={options}
        autoHighlight
        value={selectedUsers?.map((userId) => options.find((option) => option.optionValue === userId) || { optionLabel: '', optionValue: userId })}
        getOptionLabel={(option) => option.optionLabel || ''}
        getOptionSelected={(option, val) => option.optionValue === val.optionValue}
        onChange={(event, newValue) => {
          setSelectedUsers(newValue.map((user) => user.optionValue));
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={'Select Members'}
            name={'members'}
            required={true}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              )
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
    </DashboardModal>
  );
};

export default AddMemberDialog;
