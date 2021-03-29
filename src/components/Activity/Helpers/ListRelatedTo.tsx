import Chip from '@material-ui/core/Chip';
import Box from '@material-ui/core/Box';

export const ListRelatedTo = ({ relatedTo }) => {
    return <Box>
        {relatedTo && relatedTo.map((_element, index) => (
            <Box mr={1} mb={1}>
                <Chip key={index} className="text-capitalize" label={_element.type + " - " + _element.name} size="small" />
            </Box>
        ))}
    </Box>
}