import Chip from '@material-ui/core/Chip';
import Box from '@material-ui/core/Box';
import { UnCamelCase } from "../../../constants/helpers";

export const capitalize = (string) => {
    return string && typeof string === "string" ? string.charAt(0).toUpperCase() + string.slice(1) : string;
};

export const ListRelatedTo = ({ relatedTo }) => {
    return <Box>
        {relatedTo && relatedTo.map((_element, index) => (
            <Box mr={1} mb={1}>
                <Chip key={index} label={capitalize(UnCamelCase(_element.type)) + " - " + _element.name} size="small" />
            </Box>
        ))}
    </Box>
}