import { CallMade } from '@mui/icons-material';
import { useAutocomplete } from '@mui/material';
import useSearch from 'src/components/Header/NewSearchBar/useSearch';
import UserFavoriteIcon from 'src/components/UserFavouriteIcon';

const SearchBar = () => {
  const { items } = useSearch();
  const {
    getRootProps,
    getInputLabelProps,
    getInputProps,
    getTagProps,
    getListboxProps,
    getOptionProps,
    groupedOptions,
    value,
    focused,
    setAnchorEl
  } = useAutocomplete({
    id: 'search-bar',
    multiple: false,
    options: items,
    groupBy: (option) => option.sectionName,
    getOptionLabel: (option) => option.resourceLabel,
    isOptionEqualToValue: (option, value) => option.resourceLabel === value.resourceLabel
  });

  return (
    <>
      <div className="relative [--search-h:50px]">
        <div {...getRootProps()}>
          <div ref={setAnchorEl}>
            <label {...getInputLabelProps()} className="hidden">
              Search
            </label>
            <input {...getInputProps()} className="" />
          </div>
        </div>
        {groupedOptions.length > 0 ? (
          <ul
            {...getListboxProps()}
            className="absolute left-0 right-0 top-[--search-h] z-[1] m-[2px_0_0] max-h-[250px] list-none space-y-2 overflow-y-auto bg-[--dark-secondary,white]  shadow-md"
          >
            {groupedOptions.map((group) => {
              return (
                <li key={group.key} id={`search-bar-group-${group.index}`} className="">
                  <div className="sticky top-0 z-10 bg-[--dark-secondary,white] px-[23px] py-[14px] ">
                    <h6 className="line-clamp-1 text-[14px] font-medium text-[#828282]">{group.group}</h6>
                  </div>
                  <ul>
                    {group.options.map((option, optionIndex) => {
                      const { key, ...optionProps } = getOptionProps({ option, index: group.index + optionIndex });
                      return (
                        <li
                          key={key}
                          {...optionProps}
                          title={option.resourceLabel}
                          className="flex cursor-pointer items-center px-[23px] py-[3px] text-[15px] text-[--primary-text] hover:bg-gray-200 aria-[selected=true]:bg-gray-200 aria-[selected=true]:font-semibold dark:hover:bg-gray-600 dark:aria-[selected=true]:bg-gray-600 [&.Mui-focused]:bg-gray-200 dark:[&.Mui-focused]:bg-gray-600  "
                        >
                          <span className="mr-[14px]">
                            <CallMade style={{ fontSize: 16 }} />
                          </span>
                          <span className="my-1 block flex-grow">{option.resourceLabel}</span>
                          <UserFavoriteIcon item={option as any} />
                        </li>
                      );
                    })}
                  </ul>
                  <span className="mx-[23px] block border-b"></span>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </>
  );
};

export default SearchBar;
