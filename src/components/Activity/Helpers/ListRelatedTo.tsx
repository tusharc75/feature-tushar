import { Chip, Box } from "@material-ui/core";
import { resActivityColors } from "./utils";
import routes from '../../Helpers/Routes';

export const ListRelatedTo = ({ relatedTo, originRelatedTo }) => {
  let filter = originRelatedTo.filter(
    (_relatedTo) => _relatedTo.access === true
  );

  return filter.length ? (
    <Box>
      {relatedTo &&
        relatedTo.map(
          (_element, index) =>
            _element.type === filter[0].type && (
              <Box mr={1} mb={1} key={index}>
                <Chip
                  className="custom-chip"
                  label={routes[_element?.type]?.title + " - " + _element.name}
                  size="small"
                  style={{
                    backgroundColor: resActivityColors[_element.type],
                    color: "white",
                  }}
                />
              </Box>
            )
        )}
    </Box>
  ) : (
    <Box>
      {relatedTo &&
        relatedTo.map((_element, index) => (
          <Box mr={1} mb={1} key={index}>
            <Chip
              className="chip-text"
              label={routes[_element?.type]?.title + " - " + _element.name}
              size="small"
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
