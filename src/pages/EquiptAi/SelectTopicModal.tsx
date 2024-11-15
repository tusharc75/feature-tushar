import { Chip, TextField } from '@material-ui/core';
import React, { useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { Topics } from 'src/components/AiChatbox';
import DashboardModal from 'src/components/DashboardModal';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { CustomDialogTransition } from 'src/constants/helpers';

type SelectTopicModalProps = {
  handleClose: () => void;
  topics: any[];
  setSelectedTopics: (topics: Topics[]) => void;
  selectedTopics: any[];
};

const SelectTopicModal = ({ handleClose, topics, setSelectedTopics, selectedTopics }: SelectTopicModalProps) => {
  const [searchedValue, setSearchedValue] = useState('');
  const [filteredTopics, setFilteredTopics] = useState(topics);

  const handleSearch = (
    e?: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
    filterValue = '',
    selectedPropsTopics = selectedTopics.map((d) => d._id)
  ) => {
    const value = e?.target.value || filterValue;
    setSearchedValue(value);
    if (value.trim() === '') return setFilteredTopics(topics.filter((topic) => !selectedPropsTopics.includes(topic._id)));
    const filtered = topics.filter(
      (topic) => topic.aiModelTopicName.toLowerCase().includes(value.trim().toLowerCase()) && !selectedPropsTopics.includes(topic._id)
    );
    setFilteredTopics(filtered);
  };

  const handleSelect = (data: any) => {
    setSelectedTopics([...selectedTopics, data]);
    handleSearch(
      undefined,
      searchedValue,
      [...selectedTopics, data].map((d) => d._id)
    );
  };

  const handleUnselect = (data: any) => {
    const filtered = selectedTopics.filter(({ _id }) => _id !== data._id);
    setSelectedTopics(filtered);
    handleSearch(undefined, searchedValue, [...filtered.map((d) => d._id)]);
  };

  return (
    <DashboardModal
      dialogProps={{
        disableEscapeKeyDown: true,
        fullScreen: isMobile || isTablet,
        maxWidth: 'sm',
        TransitionComponent: CustomDialogTransition,
        onClose: (e, reason) => {
          if (reason !== 'backdropClick') {
          }
        },
        keepMounted: true,
        fullWidth: true
      }}
      modalHead={{
        title: 'Select Topic',
        fullScreenOption: true
      }}
      handleClose={() => {
        setSelectedTopics([]);
        handleClose();
      }}
      aria-labelledby="confirmation-dialog-title"
      open={true}
      contentMaxHeight={'500px'}
      id="confirmation-dialog"
      dialogContentProps={{
        style: {
          display: 'flex',
          flexDirection: 'column'
        }
      }}
      footer={
        <>
          <ThemeButton
            iconForMobile={false}
            onClick={() => {
              setSelectedTopics([]);
              handleClose();
            }}
          >
            Cancel
          </ThemeButton>
          <ThemeButton disabled={selectedTopics.length === 0} color="primary" borderColor="none" iconForMobile={false} onClick={handleClose}>
            Apply
          </ThemeButton>
        </>
      }
    >
      <TextField
        value={searchedValue}
        type={'search'}
        size="small"
        onChange={handleSearch}
        variant="outlined"
        label="Search topics..."
        className="mb-2"
      />
      <div className="mb-2 flex flex-wrap gap-2">
        {selectedTopics?.length > 0 ? null : <p className="py-1 text-center text-gray-500">No Topics selected</p>}
        {selectedTopics?.map((c) => (
          <Chip
            key={c._id}
            color="primary"
            variant="default"
            label={c?.aiModelTopicName}
            onDelete={() => handleUnselect(c)}
            onClick={() => handleUnselect(c)}
          />
        ))}
      </div>
      <div className="flex-grow overflow-auto rounded-md p-3 [border:1px_solid_var(--common-border-color)] ">
        <div className="flex flex-grow flex-wrap gap-2 overflow-auto ">
          {filteredTopics.map((topic) => {
            return <Chip key={topic._id} variant="outlined" label={topic?.aiModelTopicName} onClick={() => handleSelect(topic)} clickable />;
          })}
        </div>
      </div>
    </DashboardModal>
  );
};

export default SelectTopicModal;
