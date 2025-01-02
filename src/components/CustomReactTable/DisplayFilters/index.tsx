import { Fragment, useState } from 'react';
import DisplayChips from './ChipDataDisplay';
import { useUserTempFilters } from 'src/components/CustomReactTable/GridFilter/utils';

function DisplayFilters({
  columns,
  customColumns,
  dispatchTable,
  customFilters,
  showFilters,
  handleFilterOpen,
  selectedFilter,
  setSelectedFilter,
  currentFomValue,
  setCurrentFomValue,
  resource,
  filterByIds,
  setFilterByIds,
  deepFilters,
  setDeepFilters,
  filterTerm,
  setFilterTerm
}) {
  const [chipData, setChipData] = useState([]);
  const [isFilterPresent, setIsFilterPresent] = useState<boolean>(false);
  const { setTempFilter } = useUserTempFilters();

  const clearSingleFilter = (name) => {
    // Create a copy of the customFilters object
    const newFilters = { ...customFilters };
    // Delete the property with the given name
    delete newFilters[name];
    let formValues = { ...currentFomValue };
    delete formValues[name];
    delete formValues[`from_${name}`];
    delete formValues[`to_${name}`];
    setCurrentFomValue(formValues);
    // Dispatch the updated filters and update the chipData

    const col = customColumns?.find((c) => c?.fieldData?.fieldName === name)?.fieldData;
    const filterTermP = { ...filterTerm };
    delete filterTermP[col?.fieldName];
    if (col && col?.lookup) {
      setFilterByIds(filterByIds?.filter((f) => f?.field != name));
    } else if (col && col?.type === 'date') {
      setDeepFilters(deepFilters?.filter((f) => ![`from_${name}`, `to_${name}`]?.includes(f?.field)));
    } else {
      setDeepFilters(deepFilters?.filter((f) => f?.field != name));
    }
    setFilterTerm(filterTermP);

    dispatchTable({ type: 'filter', filters: newFilters });
    setTempFilter(resource, { formValues: formValues || {}, filters: newFilters });
    setChipData((prev) => prev.filter((item) => item.name !== name));
  };

  const clearFilterAll = () => {
    dispatchTable({ type: 'filter', filters: {} });
    setSelectedFilter(null);
    setChipData([]);
    setCurrentFomValue({});
    setFilterByIds([]);
    setDeepFilters([]);
    setFilterTerm({});
  };

  return (
    <Fragment>
      {Object.keys(customFilters).length > 0 && showFilters && (
        <div className="block min-h-[5px] min-w-[100%]">
          <DisplayChips
            columns={columns}
            customFilters={customFilters}
            selectedFilter={selectedFilter}
            chipData={chipData}
            setChipData={setChipData}
            handleFilterOpen={handleFilterOpen}
            clearSingleFilter={clearSingleFilter}
            clearFilterAll={clearFilterAll}
            setIsFilterPresent={setIsFilterPresent}
          />
        </div>
      )}
    </Fragment>
  );
}

export default DisplayFilters;
