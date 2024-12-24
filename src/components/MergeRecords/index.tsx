import { MenuItem } from '@mui/material';
import { Fragment, useState } from 'react';
import MergeRecordsDialog from './MergeRecordsDialog';

const MergeRecords = ({ selectedRecords, resource, closeActions, onSuccess }) => {
  const [open, setOpen] = useState(false);

  return (
    <Fragment>
      <MenuItem
        disabled={selectedRecords?.length ? false : true}
        onClick={() => {
          setOpen(true);
          closeActions();
        }}
      >
        {`Merge (${selectedRecords?.length})`}
      </MenuItem>
      {open && (
        <MergeRecordsDialog ids={selectedRecords?.map((e) => e?._id)} onClose={() => setOpen(false)} resource={resource} onSuccess={onSuccess} />
      )}
    </Fragment>
  );
};

export default MergeRecords;
