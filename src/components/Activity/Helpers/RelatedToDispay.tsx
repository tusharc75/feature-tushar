import { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Chip, Box, Typography } from '@material-ui/core';
import { purple } from '@material-ui/core/colors';
import { resActivityColors, resActivityTextColors } from './utils';
import { useHistory } from 'react-router-dom';
import routes from '../../Helpers/Routes';

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

export const RelatedToDispay = ({ relatedTo }) => {
  const classes = useStyles();
  const history = useHistory();
  const handleClick = (obj, resourceName) => {
    history.push(`${routes[resourceName].path}/detail/${obj?._id}`);
  };
  return (
    <Box>
      <Box mb={1}>
        <Typography variant="body2" className={classes.boldFont}>
          Related to
        </Typography>
      </Box>
      {relatedTo &&
        relatedTo.map((_element, index) => (
          <Box mr={1} key={`relatedTo${index}`} component="div" display="inline">
            <Chip
              key={index}
              label={`${routes[_element?.type]?.title + ' - ' + _element.name} `}
              size="medium"
              style={{
                backgroundColor: resActivityColors[_element.type],
                color: resActivityTextColors[_element.type]
              }}
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
