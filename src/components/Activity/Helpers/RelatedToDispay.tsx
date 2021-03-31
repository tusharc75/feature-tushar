import Chip from '@material-ui/core/Chip';
import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { purple } from '@material-ui/core/colors';
import { capitalize } from './ListRelatedTo';

const useStyles = makeStyles((theme) => ({
    boldFont: {
        fontWeight: 500
    },
    account: {
        color: purple[500],
    },
    contact: {
        color: purple[500],
    },
}));



export const RelatedToDispay = ({ relatedTo }) => {


    const classes = useStyles();
    return <Box>
        <Box mb={1}>
            <Typography variant="body2" className={classes.boldFont}>Related to</Typography>
        </Box>
        {relatedTo && relatedTo.map((_element, index) => (
            <Box mr={1} component="div" display="inline">
                <Chip key={index} label={capitalize(_element.type) + " - " + _element.name} size="medium" color={classes[_element.type]} />
            </Box>
        ))}
    </Box>
}