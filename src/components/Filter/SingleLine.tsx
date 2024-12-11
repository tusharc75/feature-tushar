import { useState, useEffect, useRef, useContext } from 'react';
import { Checkbox, FormControlLabel } from '@material-ui/core';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import SearchBox from 'src/components/Helpers/SearchBox';
import { InNin } from 'src/components/Filter';

const SingleLine = ({ fieldData, allFields, deepFilters, setDeepFilters, filterTerm, setFilterTerm }) => {
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
      let _resource = fieldData?.resource;
      let _fieldName = fieldData?.fieldName;
      if (fieldData?.type === 'lookUpDisplay') {
        _fieldName = fieldData?.lookUpFieldDisplay;
        const lookUpField = allFields?.find((e) => e.fieldName === fieldData?.lookUpField);
        if (lookUpField) {
          _resource = lookUpField.lookupResource;
        }
      }

      if (searchVal != '') {
        page = 0;
        setPage(0);
      }

      const query = `sa-field/fieldName/options?resource=${_resource}&limit=25&page=${page}&entity=${selectedEntity}&fieldName=${_fieldName}&search=${searchVal}`;
      const response = await axiosInstance().get(query);
      let data = response?.data?.data;

      setOptions((prev) =>
        page === 0
          ? [...new Set([...(deepFilters?.find((d) => d?.field === fieldData?.fieldName)?.term || []), ...data])]
          : [...new Set([...prev, ...data])]
      );
      if (data?.length === 0) setHasMore(false);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setToastConfig(error);
    }
  };

  useEffect(() => {
    fetchOptions(page);
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
      <div className="flex items-center justify-between">
        <p>{fieldData?.fieldLabel}</p>
        <div className="flex items-center justify-between">
          <InNin filterTerm={filterTerm} setFilterTerm={setFilterTerm} fieldName={fieldData?.fieldName} />
          <SearchBox
            onChange={(e) => {
              setSearchVal(e?.target?.value);
            }}
            value={searchVal}
          />
        </div>
      </div>
      <div className="mt-4">
        {options?.map((o, i) => {
          return (
            <div key={i} className="infinite-scroll">
              <FormControlLabel
                control={
                  <Checkbox
                    name={o}
                    checked={(deepFilters?.find((d) => d?.field === fieldData?.fieldName)?.term || [])?.includes(o)}
                    onChange={(e) => {
                      const filter = deepFilters?.find((d) => d?.field === fieldData?.fieldName);
                      if (filter) {
                        if (e?.target?.checked) {
                          filter.term.push(o);
                        } else {
                          filter.term = filter.term?.filter((t) => t != o);
                        }
                        setDeepFilters([...deepFilters?.filter((d) => d?.field != fieldData?.fieldName), filter]);
                      } else {
                        setDeepFilters((pre) => [...pre, { field: fieldData?.fieldName, term: [o] }]);
                      }
                    }}
                    color="primary"
                  />
                }
                label={o}
              />
            </div>
          );
        })}
      </div>
      {loading && <p>Loading...</p>}
      {!hasMore && <p>No more data to load.</p>}
    </div>
  );
};

export default SingleLine;
