import { Checkbox, FormControlLabel } from '@material-ui/core';
import { uniqBy } from 'lodash';
import { useContext, useEffect, useRef, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { InNin } from 'src/components/Filter';
import SearchBox from 'src/components/Helpers/SearchBox';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';

const DropDown = ({ fieldData, deepFilters, setDeepFilters, filterByIds, setFilterByIds, multiple = true, filterTerm, setFilterTerm }) => {
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

  const fetchOptions = async (page: number = 0) => {
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
        page === 0
          ? uniqBy([...(filterByIds?.find((d) => d?.field === fieldData?.fieldName)?.term || []), ...data], 'optionValue')
          : uniqBy([...prev, ...data], 'optionValue')
      );
      if (data?.length === 0) setHasMore(false);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setToastConfig(error);
    }
  };

  useEffect(() => {
    if (fieldData?.lookup && fieldData?.lookupResource) {
      fetchOptions(page);
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

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center justify-between bg-[var(--dark-primary,white)] py-[--py,_16px]">
        <p className="text-[16px] font-medium leading-[19px]">{fieldData?.fieldLabel}</p>
        <div className="flex items-center justify-between">
          <InNin filterTerm={filterTerm} setFilterTerm={setFilterTerm} fieldName={fieldData?.fieldName} />
          {fieldData?.lookup && fieldData?.lookupResource && (
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
                        checked={(filterByIds?.find((d) => d?.field === fieldData?.fieldName)?.term || [])
                          ?.map((t) => t?.optionValue)
                          ?.includes(o?.optionValue)}
                        onChange={(e) => {
                          const filter = filterByIds?.find((d) => d?.field === fieldData?.fieldName);
                          if (filter) {
                            if (e?.target?.checked) {
                              filter.term.push(o);
                            } else {
                              filter.term = filter.term?.filter((t) => t?.optionValue != o?.optionValue);
                            }
                            setFilterByIds([...deepFilters?.filter((d) => d?.field != fieldData?.fieldName), filter]);
                          } else {
                            setFilterByIds((pre) => [...pre, { field: fieldData?.fieldName, term: [o] }]);
                          }
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
            {fieldData?.option?.map((o, i) => {
              return (
                <div key={i} className="">
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        name={o?.optionLabel || ''}
                        checked={
                          multiple
                            ? (deepFilters?.find((d) => d?.field === fieldData?.fieldName)?.term || [])?.includes(o?.optionValue)
                            : deepFilters?.find((d) => d?.field === fieldData?.fieldName)?.term === o?.optionValue
                        }
                        onChange={(e) => {
                          const filter = deepFilters?.find((d) => d?.field === fieldData?.fieldName);
                          if (!multiple) {
                            if (filter) {
                              if (e?.target?.checked) {
                                filter.term = o?.optionValue;
                              } else {
                                filter.term = filter.term = '';
                              }
                              setDeepFilters([...deepFilters?.filter((d) => d?.field != fieldData?.fieldName), filter]);
                            } else {
                              setDeepFilters((pre) => [...pre, { field: fieldData?.fieldName, term: o?.optionValue }]);
                            }
                          } else {
                            if (filter) {
                              if (e?.target?.checked) {
                                filter.term.push(o?.optionValue);
                              } else {
                                filter.term = filter.term?.filter((t) => t != o?.optionValue);
                              }
                              setDeepFilters([...deepFilters?.filter((d) => d?.field != fieldData?.fieldName), filter]);
                            } else {
                              setDeepFilters((pre) => [...pre, { field: fieldData?.fieldName, term: [o?.optionValue] }]);
                            }
                          }
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
    </div>
  );
};

export default DropDown;
