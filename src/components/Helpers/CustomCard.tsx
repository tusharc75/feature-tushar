import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { IconButton, Card, CardHeader, Avatar, Menu, MenuItem } from '@mui/material';
import { MoreVert } from '@material-ui/icons';

const CustomCard = (props) => {
  const { heading, subHeading, data, edit, remove } = props;
  const [anchorEl, setAnchorEl] = useState(null);

  const getNameIntials = (name) => {
    var matches = name.match(/\b(\w)/g);
    var acronym = matches.join('');

    return acronym;
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    edit(data);
    handleClose();
  };

  const handleDelete = () => {
    remove(data.id);
  };

  return (
    <Card>
      <CardHeader
        avatar={<Avatar aria-label="recipe">{getNameIntials(heading)}</Avatar>}
        action={
          <>
            <IconButton aria-label="edit" onClick={handleClick}>
              <MoreVert />
            </IconButton>
            <Menu id="menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose}>
              <MenuItem onClick={handleEdit}>Edit</MenuItem>
              <MenuItem onClick={handleDelete}>Delete</MenuItem>
            </Menu>
          </>
        }
        title={heading}
        subheader={subHeading ? subHeading : ''}
      />
    </Card>
  );
};

CustomCard.propTypes = {
  heading: PropTypes.string.isRequired,
  subHeading: PropTypes.string,
  data: PropTypes.object.isRequired,
  edit: PropTypes.func.isRequired,
  remove: PropTypes.func.isRequired
};

export default CustomCard;
