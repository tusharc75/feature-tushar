import { Fragment, useContext, useState } from 'react';
import DisplayChips from './ChipDataDisplay';
import { FiltersContext } from 'src/StateProvider/FiltersContext/FiltersContext';

function DisplayFilters({
    columns,
    dispatchTable,
    customFilters,
    showFilters,
    handleFilterOpen,
    selectedFilter,
    setSelectedFilter,
    currentFomValue,
    setCurrentFomValue,
    resource
}) {

    const [chipData, setChipData] = useState([]);
    const [isFilterPresent, setIsFilterPresent] = useState<boolean>(false);
    const { setSavedFilters } = useContext(FiltersContext);

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
        dispatchTable({ type: 'filter', filters: newFilters });
        setSavedFilters(prev => ({...prev, [resource] : newFilters}))
        setChipData((prev) => prev.filter((item) => item.name !== name));
    };

    const clearFilterAll = () => {
        dispatchTable({ type: 'filter', filters: {} });
        setSavedFilters(prev => ({...prev, [resource] : {}}))
        setSelectedFilter(null);
        setChipData([]);
        setCurrentFomValue({});
    };

    return (<Fragment>
        {Object.keys(customFilters).length > 0 && showFilters && (
            <div className="min-w-[100%] block min-h-[5px]">
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
