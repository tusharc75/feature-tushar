import { useState } from 'react';
import { makeStyles } from '@mui/styles';
import { Chip, Box, Typography } from '@mui/material';
import { purple } from '@mui/material/colors';
import { useHistory } from 'react-router-dom';
import routes from '../../Helpers/Routes';
import { kebabCase, startCase } from 'lodash';

const useStyles = makeStyles((theme) => ({
  boldFont: {
    fontWeight: 500
  },
  account: {
    color: purple[500]
  },
  contact: {
    color: purple[500]
  },
  chipStyle: {
    textAlign: 'center',
    padding: '8px 10px',
    borderRadius: '4px'
  }
}));

export const RelatedToDispay = ({ relatedTo, inline = false }) => {
  const classes = useStyles();
  const handleClick = (obj, resourceName) => {
    window.open(`${routes[resourceName]?.path || `/${kebabCase(resourceName)}`}/detail/${obj?._id}`);
  };
  return (
    <Box style={{ display: inline ? 'flex' : 'block', flexWrap: 'wrap', alignItems: 'center' }}>
      <Box mb={inline ? 0 : 1}>
        <Typography variant="body2" className={classes.boldFont}>
          Related to {inline && ' : '}
        </Typography>
      </Box>
      {relatedTo &&
        relatedTo.map((_element, index) => (
          <Box mr={1} key={`relatedTo${index}`} component="div" display="inline">
            <Chip
              key={index}
              label={`${routes[_element?.type]?.title || startCase(_element?.type)} - ${_element.name}`}
              size="medium"
              clickable={true}
              onClick={(e) => {
                e.preventDefault();
                const resourceName = _element.type !== 'quote' ? _element.type : 'quoteBuilder';
                handleClick(_element, resourceName);
              }}
            />
          </Box>
        ))}
    </Box>
  );
};
