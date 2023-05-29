import { Chip, Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import routes from '../../Helpers/Routes';

const useStyles = makeStyles((theme) => ({
  chipStyle: {
    textAlign: 'center',
    borderRadius: '4px',
    height: 'unset !important',
    '& span.MuiChip-label': {
      fontSize: '12px',
      lineHeight: '15px',
      fontWeight: '500',
      padding: '8px 21px',
      display: 'inline-block'
    }
  }
}));

export const ListRelatedTo = ({ relatedTo, originRelatedTo }) => {
  const classes = useStyles();
  let filter = originRelatedTo.filter((_relatedTo) => _relatedTo.access === true);

  return filter.length ? (
    <Box>
      {relatedTo &&
        relatedTo.map(
          (_element, index) =>
            _element.type === filter[0].type && (
              <Box mr={1} mb={1} key={index}>
                <Chip className="custom-chip" label={routes[_element?.type]?.title + ' - ' + _element.name} size="small" />
              </Box>
            )
        )}
    </Box>
  ) : (
    <Box>
      {relatedTo &&
        relatedTo.map((_element, index) => (
          <Box mr={1} mb={1} key={index}>
            <Chip className={`${classes.chipStyle} chip-text`} label={` ${routes[_element?.type]?.title + ' - ' + _element.name}`} size="small" />
          </Box>
        ))}
    </Box>
  );
};
