import { Box } from '@material-ui/core';
import routes from '../../Helpers/Routes';

export const ListRelatedTo = ({ relatedTo, originRelatedTo }) => {
  let filter = originRelatedTo.filter((_relatedTo) => _relatedTo.access === true);

  return filter.length ? (
    <Box>
      {relatedTo &&
        relatedTo.map(
          (_element, index) =>
            _element.type === filter[0].type && (
              <Box className="flex flex-wrap gap-[8px]" key={index}>
                <p
                  style={{ borderStyle: 'solid' }}
                  title={routes[_element?.type]?.title + ' - ' + _element.name}
                  className="text-[#2A3042] dark:text-[var(--dark-secondary-text)] bg-[#F2F6FF] dark:bg-[var(--dark-secondary)] border border-[#B8CCFE] max-w-max rounded-3xl px-[12px] py-[4px] truncate font-semibold text-[12px] "
                >
                  {routes[_element?.type]?.title + ' - ' + _element.name}
                </p>
              </Box>
            )
        )}
    </Box>
  ) : (
    <Box>
      {relatedTo &&
        relatedTo.map((_element, index) => (
          <Box className="flex flex-wrap gap-[8px]" key={index}>
            <p
              style={{ borderStyle: 'solid' }}
              title={routes[_element?.type]?.title + ' - ' + _element.name}
              className="text-[#2A3042] dark:text-[var(--dark-secondary-text)] bg-[#F2F6FF] dark:bg-[var(--dark-secondary)] border border-[#B8CCFE] max-w-max rounded-3xl px-[12px] py-[4px] truncate font-semibold text-[12px] "
            >
              {routes[_element?.type]?.title + ' - ' + _element.name}
            </p>
          </Box>
        ))}
    </Box>
  );
};
