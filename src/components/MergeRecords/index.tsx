import { MenuItem } from '@material-ui/core';
import { Fragment, useState } from 'react';
import MergeRecordsDialog from './MergeRecordsDialog';

const MergeRecords = ({ selectedRecords, resource, closeActions, onSuccess }) => {

  const [open, setOpen] = useState(false);

  return (
    <Fragment>
      <MenuItem
        disabled={selectedRecords?.length === 1 ? false : true}
        onClick={() => {
          setOpen(true);
          closeActions();
        }}
      >
        Merge
      </MenuItem>
      {open &&
        <MergeRecordsDialog
          id={selectedRecords[0]?._id}
          onClose={() => setOpen(false)}
          resource={resource}
          onSuccess={onSuccess}
        />
      }
    </Fragment>
  );
};

export default MergeRecords;
