import { Box } from '@mui/material';
import { startCase } from 'lodash';
import { useData } from 'src/StateProvider/Provider';

export const ListRelatedTo = ({ relatedTo, originRelatedTo }) => {
  let filter = originRelatedTo.filter((_relatedTo) => _relatedTo.access === true);

  const {
    state: { resources }
  }: any = useData();

  return filter.length ? (
    <Box>
      {relatedTo &&
        relatedTo.map(
          (_element, index) =>
            _element.type === filter[0].type && (
              <Box className="flex flex-wrap gap-[8px]" key={index}>
                <p
                  style={{ borderStyle: 'solid' }}
                  title={`${resources[_element?.type]?.titleSingular || startCase(_element?.type)} - ${_element.name}`}
                  className="max-w-max truncate rounded-3xl border border-[#B8CCFE] bg-[#F2F6FF] px-[12px] py-[4px] text-[12px] font-semibold text-[#2A3042] dark:bg-[var(--dark-secondary)] dark:text-[var(--dark-secondary-text)] "
                >
                  {`${resources[_element?.type]?.titleSingular || startCase(_element?.type)} - ${_element.name}`}
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
              title={`${resources[_element?.type]?.titleSingular || startCase(_element?.type)} - ${_element.name}`}
              className="max-w-max truncate rounded-3xl border border-[#B8CCFE] bg-[#F2F6FF] px-[12px] py-[4px] text-[12px] font-semibold text-[#2A3042] dark:bg-[var(--dark-secondary)] dark:text-[var(--dark-secondary-text)] "
            >
              {`${resources[_element?.type]?.titleSingular || startCase(_element?.type)} - ${_element.name}`}
            </p>
          </Box>
        ))}
    </Box>
  );
};
