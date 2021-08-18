import Box from "@material-ui/core/Box"
import Typography from "@material-ui/core/Typography"
import TinyMce from "./../../components/TinyMCE/index"

export default function PDFTemplateSection({ sectionName, label, details, setValue }) {

    return <Box style={{ width: "1000px" }}>
        <Typography variant="h5" component="h5"> {label}</Typography>
        <TinyMce
            onChange={(value) => {
                setValue(sectionName, value)
            }}
            height={400}
            // initialValue={details[sectionName]}
            imageOrFileUploadCompletePercentage={(
                completePercentage
            ) => null}
        //     imageOrFileUploadCompletePercentage = {(
        //         completePercentage
        //     ) => {
        //     setUploadingImageOrFileProgress(
        //         completePercentage
        //     );
        // }}
        />
    </Box>
}