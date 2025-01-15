import { Checkbox, FormControlLabel } from '@mui/material';
import { uniqBy } from 'lodash';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { InNin } from 'src/components/Filter';
import { Option } from 'src/components/Filter/type';
import SearchBox from 'src/components/Helpers/SearchBox';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';

const DropDown = ({
  fieldData,
  deepFilters,
  setDeepFilters,
  filterByIds,
  setFilterByIds,
  multiple = true,
  filterTerm,
  setFilterTerm,
  sidebarIcon = null
}) => {
  const { setToastConfig } = useContext(CustomToastContext);

  const {
    state: { selectedEntity }
  } = useData();

  const [options, setOptions] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchVal, setSearchVal] = useState('');
  const observer = useRef(null);

  const filterFromDeepFilter = useMemo(() => {
    return deepFilters?.find((d) => d?.field === fieldData?.fieldName);
  }, [deepFilters, fieldData?.fieldName]);

  const filterFromFilterById = useMemo(() => {
    return filterByIds?.find((d) => d?.field === fieldData?.fieldName);
  }, [fieldData?.fieldName, filterByIds]);

  const fetchOptions = useCallback(
    async (page: number = 0) => {
      try {
        setLoading(true);

        if (searchVal !== '') {
          page = 0;
          setPage(0);
        }

        let query = `sa-field/options?resource=${fieldData?.lookupResource}&limit=25&page=${page}&entity=${selectedEntity}&search=${searchVal}`;
        const response = await axiosInstance().get(query);
        let data = response?.data?.data;

        setOptions((prev) =>
          page === 0 ? uniqBy([...(filterFromFilterById?.term || []), ...data], 'optionValue') : uniqBy([...prev, ...data], 'optionValue')
        );
        if (data?.length === 0) setHasMore(false);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        setToastConfig(error);
      }
    },
    [fieldData?.lookupResource, filterFromFilterById?.term, searchVal, selectedEntity, setToastConfig]
  );

  useEffect(() => {
    if (fieldData?.lookup && fieldData?.lookupResource && !fieldData?.customOptions?.length) {
      fetchOptions(page);
    } else {
      setOptions(fieldData?.customOptions);
    }
  }, [page, searchVal]);

  useEffect(() => {
    if (!searchVal) {
      setHasMore(true);
    }
  }, [searchVal]);

  useEffect(() => {
    if (loading) return;

    const lastItem = document.querySelector('.infinite-scroll:last-child');
    if (!lastItem) return;

    const observerCallback = (entries) => {
      if (entries[0].isIntersecting && hasMore && !searchVal) {
        setPage((prev) => prev + 1);
      }
    };

    observer.current = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: '0px',
      threshold: 1.0
    });
    observer.current.observe(lastItem);
    return () => observer.current?.disconnect();
  }, [loading, hasMore]);

  const handleCheckNonLookup = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, option: Option) => {
      if (!multiple) {
        if (filterFromDeepFilter) {
          if (e?.target?.checked) {
            filterFromDeepFilter.term = option?.optionValue;
            setDeepFilters([...deepFilters?.filter((d) => d?.field !== fieldData?.fieldName), filterFromDeepFilter]);
          } else {
            filterFromDeepFilter.term = filterFromDeepFilter.term = '';
            setDeepFilters([...deepFilters?.filter((d) => d?.field !== fieldData?.fieldName)]);
          }
        } else {
          setDeepFilters((pre) => [...pre, { field: fieldData?.fieldName, term: option?.optionValue }]);
        }
      } else {
        if (filterFromDeepFilter) {
          if (e?.target?.checked) {
            filterFromDeepFilter.term.push(option?.optionValue);
          } else {
            filterFromDeepFilter.term = filterFromDeepFilter.term?.filter((t) => t !== option?.optionValue);
          }
          if (filterFromDeepFilter.term?.length) {
            setDeepFilters([...deepFilters?.filter((d) => d?.field !== fieldData?.fieldName), filterFromDeepFilter]);
          } else {
            setDeepFilters([...deepFilters?.filter((d) => d?.field !== fieldData?.fieldName)]);
          }
        } else {
          setDeepFilters((pre) => [...pre, { field: fieldData?.fieldName, term: [option?.optionValue] }]);
        }
      }
    },
    [deepFilters, fieldData?.fieldName, multiple, setDeepFilters, filterFromDeepFilter]
  );

  const handleToggleSelectAllNonLookup = useCallback(() => {
    if (filterFromDeepFilter) {
      const deepFilterTermLength = filterFromDeepFilter.term?.length || 0;
      const optionsLength = fieldData?.option?.length || 0;
      const isAllSelected = deepFilterTermLength === optionsLength;
      if (isAllSelected) {
        setDeepFilters((prev) => [...prev?.filter((d) => d?.field !== fieldData?.fieldName)]);
      } else {
        filterFromDeepFilter.term = fieldData?.option?.map(({ optionValue }) => optionValue);
        setDeepFilters((prev) => [...prev?.filter((d) => d?.field !== fieldData?.fieldName), filterFromDeepFilter]);
      }
    } else {
      setDeepFilters((pre) => [...pre, { field: fieldData?.fieldName, term: fieldData?.option?.map((o) => o?.optionValue) }]);
    }
  }, [fieldData?.fieldName, fieldData?.option, filterFromDeepFilter, setDeepFilters]);

  return (
    <>
      <div className="sticky top-0 z-10 flex items-center justify-between bg-[var(--dark-primary,white)] py-[--py,_16px] max-md:flex-wrap">
        <div className="flex items-center gap-2">
          {sidebarIcon}
          <p className="line-clamp-1 text-[16px] font-medium leading-[19px]">{fieldData?.fieldLabel}</p>
          {fieldData?.lookup}
        </div>
        <div className="flex items-center justify-between">
          {filterTerm && setFilterTerm && <InNin filterTerm={filterTerm} setFilterTerm={setFilterTerm} fieldName={fieldData?.fieldName} />}
          {fieldData?.lookup && fieldData?.lookupResource && !fieldData?.customOptions?.length && (
            <SearchBox
              onChange={(e) => {
                setSearchVal(e?.target?.value);
              }}
              value={searchVal}
            />
          )}
        </div>
      </div>
      <div>
        {fieldData?.lookup && fieldData?.lookupResource ? (
          <>
            {options?.map((o, i) => {
              return (
                <div key={i} className="infinite-scroll">
                  <FormControlLabel
                    control={
                      <Checkbox
                        name={o}
                        size="small"
                        checked={
                          multiple
                            ? (filterFromFilterById?.term || [])?.map((t) => t?.optionValue)?.includes(o?.optionValue)
                            : filterFromFilterById?.term?.optionValue === o?.optionValue
                        }
                        onChange={(e) => {
                          const filter = filterFromFilterById;
                          if (multiple) {
                            if (filter) {
                              if (e?.target?.checked) {
                                filter.term.push(o);
                              } else {
                                filter.term = filter.term?.filter((t) => t?.optionValue != o?.optionValue);
                              }
                              if (filter.term?.length) {
                                setFilterByIds([...filterByIds?.filter((d) => d?.field != fieldData?.fieldName), filter]);
                              } else {
                                setFilterByIds([...filterByIds?.filter((d) => d?.field != fieldData?.fieldName)]);
                              }
                            } else {
                              setFilterByIds((pre) => [...pre, { field: fieldData?.fieldName, term: [o] }]);
                            }
                          } else {
                            if (filter) {
                              if (e?.target?.checked) {
                                filter.term = o;
                                setFilterByIds([...filterByIds?.filter((d) => d?.field != fieldData?.fieldName), filter]);
                              } else {
                                filter.term = filter.term = {};
                                setFilterByIds([...filterByIds?.filter((d) => d?.field != fieldData?.fieldName)]);
                              }
                            } else {
                              setFilterByIds((pre) => [...pre, { field: fieldData?.fieldName, term: o }]);
                            }
                          }
                        }}
                      />
                    }
                    label={
                      <span className="!text-[14px] !font-medium !leading-[17px] !text-[#6C757D] dark:!text-gray-200">{o?.optionLabel || ''}</span>
                    }
                  />
                </div>
              );
            })}
            {loading ? (
              <p>Loading...</p>
            ) : options.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-600">No Data Found</div>
            ) : (
              ''
            )}
            {!hasMore && <p></p>}
          </>
        ) : (
          <>
            {/* Select all checkbox */}
            {multiple && (
              <div className="sticky top-[63px] z-10 select-all bg-[--dark-primary,white]">
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      name={'select-all'}
                      checked={filterFromDeepFilter?.term?.length === fieldData?.option?.length && fieldData?.option?.length > 0}
                      indeterminate={filterFromDeepFilter?.term?.length > 0 && filterFromDeepFilter?.term?.length < fieldData?.option?.length}
                      onChange={handleToggleSelectAllNonLookup}
                    />
                  }
                  label={
                    <span className="select-none !text-[14px] !font-semibold !leading-[17px] !text-[--primary-text] dark:!text-gray-200">
                      Select All
                    </span>
                  }
                />
              </div>
            )}

            {fieldData?.option?.map((o, i) => {
              return (
                <div key={i} className="">
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        name={o?.optionLabel || ''}
                        checked={
                          multiple ? (filterFromDeepFilter?.term || [])?.includes(o?.optionValue) : filterFromDeepFilter?.term === o?.optionValue
                        }
                        onChange={(e) => {
                          handleCheckNonLookup(e, o);
                        }}
                        className="!text-[--new-theme-color] dark:!text-gray-200"
                      />
                    }
                    label={
                      <span className="!text-[14px] !font-medium !leading-[17px] !text-[#6C757D] dark:!text-gray-200">{o?.optionLabel || ''}</span>
                    }
                  />
                </div>
              );
            })}
          </>
        )}
      </div>
    </>
  );
};

export default DropDown;
