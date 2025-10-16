import { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { Checkbox, FormControlLabel } from '@mui/material';
import axiosInstance from '../../../../axios/axiosInstance';
import { CustomToastContext } from '../../../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../../../StateProvider/Provider';
import SearchBox from '../../../../components/Helpers/SearchBox';
import { uniqBy } from 'lodash';

interface DropdownProps {
  selectedField: any;
  filterValue: any;
  setFilterValue: (filterValue: any) => void;
}

const Dropdown = ({
  selectedField,
  filterValue,
  setFilterValue
}: DropdownProps) => {
  const [options, setOptions] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchVal, setSearchVal] = useState('');
  const observer = useRef(null);

  const { setToastConfig } = useContext(CustomToastContext);
  const { state: { selectedEntity } } = useData();

  const fetchOptions = useCallback(
    async (page: number = 0) => {
      try {
        setLoading(true);

        if (searchVal !== '') {
          page = 0;
          setPage(0);
        }

        let query = `sa-field/options?resource=${selectedField?.lookupResource}&limit=25&page=${page}&entity=${selectedEntity}&search=${searchVal}`;
        const response = await axiosInstance().get(query);
        let data = response?.data?.data;

        setOptions((prev) =>
          page === 0
            ? uniqBy([...data], 'optionValue')
            : uniqBy([...prev, ...data], 'optionValue')
        );

        if (data?.length === 0) setHasMore(false);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        setToastConfig(error);
      }
    },
    [selectedField?.lookupResource, searchVal, selectedEntity, setToastConfig]
  );

  useEffect(() => {
    if (selectedField?.lookup && selectedField?.lookupResource) {
      fetchOptions(page);
    } else if (selectedField?.option) {
      setOptions(selectedField.option);
    }
  }, [page, searchVal, selectedField, fetchOptions]);

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
  }, [loading, hasMore, searchVal]);

  const handleOptionToggle = useCallback((optionValue: string, checked: boolean) => {
    let newFilterValue = checked
      ? [...(filterValue || []), optionValue]
      : (filterValue || []).filter(val => val !== optionValue);
    setFilterValue(newFilterValue);
  }, [filterValue, setFilterValue]);

  const handleSelectAll = useCallback(() => {
    const allOptionValues = options?.map(option => option.optionValue);
    const isAllSelected = filterValue?.length === allOptionValues?.length;

    setFilterValue(isAllSelected ? [] : allOptionValues);
  }, [options, filterValue, setFilterValue]);

  return (
    <div className="flex flex-col gap-2">
      {selectedField?.lookup && selectedField?.lookupResource && (
        <SearchBox
          onChange={(e) => setSearchVal(e?.target?.value)}
          value={searchVal}
          placeholder="Search options..."
        />
      )}

      <div className="max-h-64 overflow-y-auto">
        <div className="top-0 z-10 pb-2 ml-3">
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={filterValue?.length === options?.length && options?.length > 0}
                indeterminate={filterValue?.length > 0 && filterValue?.length < options?.length}
                onChange={handleSelectAll}
              />
            }
            label={<span className="text-sm font-semibold">Select All</span>}
          />
        </div>

        <div className="space-y-1 ml-3">
          {options?.map((option, index) => (
            <div key={index} className="infinite-scroll">
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={filterValue?.includes(option.optionValue)}
                    onChange={(e) => handleOptionToggle(option.optionValue, e.target.checked)}
                  />
                }
                label={
                  <span className="text-sm font-medium text-[--primary-text]">
                    {option.optionLabel || ''}
                  </span>
                }
              />
            </div>
          ))}

          {loading && <p className="text-center py-2 text-[--primary-text]">Loading...</p>}

          {options?.length === 0 && !loading && (
            <div className="text-center py-4 text-[--primary-text]">
              No options available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dropdown;
