import { Box } from "@material-ui/core";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";

const Quotation = ({ }) => {
    return (
        <Box p={2} height={500} bgcolor="white">
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
    );
};

export default Quotation;