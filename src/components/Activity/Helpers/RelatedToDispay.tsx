import { makeStyles } from "@material-ui/core/styles";
import { Chip, Box, Typography } from "@material-ui/core";
import { purple } from "@material-ui/core/colors";
import { startCase } from "lodash";
import { resActivityColors } from "./utils";

const useStyles = makeStyles((theme) => ({
  boldFont: {
    fontWeight: 500,
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
  return (
    <Box>
      <Box mb={1}>
        <Typography variant="body2" className={classes.boldFont}>
          Related to
        </Typography>
      </Box>
      {relatedTo &&
        relatedTo.map((_element, index) => (
          <Box
            mr={1}
            key={`relatedTo${index}`}
            component="div"
            display="inline"
          >
            <Chip
              key={index}
              label={startCase(_element.type) + " - " + _element.name}
              size="medium"
              style={{
                backgroundColor: resActivityColors[_element.type],
                color: "white",
              }}
            />
          </Box>
        ))}
    </Box>
  );
};
