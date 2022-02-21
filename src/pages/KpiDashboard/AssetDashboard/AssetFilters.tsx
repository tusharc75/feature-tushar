import React from 'react';
import { Button, Box, Checkbox, TextField, Popover } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { CheckBoxOutlineBlank, CheckBox, FilterList } from '@material-ui/icons';

import routes from 'src/components/Helpers/Routes';
import axiosInstance from 'src/axios/axiosInstance';
import countriesData from 'src/constants/Country.json';
import { FilterType } from '.';

interface FilterProps {
  filter: FilterType;
  setFilter: any;
  loading: boolean;
  fetchData?: VoidFunction;
  enableSubmit?: boolean;
  loadingDropdown: boolean;
  setLoadingDropdown: any
  productCategories: any[];
  setAllProductCategories: any;
  setAssets?: any;
}

const AssetFilters = (props: FilterProps) => {
  const { filter, setFilter, loading, productCategories, loadingDropdown, setAllProductCategories, setLoadingDropdown, setAssets } = props;
  const [allProducts, setAllProducts] = React.useState([]);

  const [filterAnchor, setFilterAnchor] = React.useState(null);
  const [openFilter, setOpenFilter] = React.useState(false);

  React.useEffect(() => {
    // 
    fetchDropdownData();
  }, []);

  const fetchDropdownData = () => {
    setLoadingDropdown(true);
    axiosInstance()
    .get(`/sa-formbuilder/lookup?lookupResource=Product,Product Category`)
      .then(({ data: { data } }) => {
        if(data) {
          setAllProducts(data["Product"].map((d) => ({ id: d.optionValue, title: d.optionLabel })));
          setAllProductCategories(data["Product Category"].map((d) => ({ id: d.optionValue, title: d.optionLabel })))
        }
        setLoadingDropdown(false);
      })
      .catch((err) => {
        setLoadingDropdown(false);
      });
  };

  const handleClickFilter = (event) => {
    setFilterAnchor(event.currentTarget);
    setOpenFilter((prev) => !prev);
  };

  return (
    <Box>
      <Button onClick={handleClickFilter} color="primary" endIcon={<FilterList />}>
        Filters
      </Button>
      <Popover
        open={openFilter}
        anchorEl={filterAnchor}
        onClose={handleClickFilter}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center'
        }}
      >
        <Box p={1}>
          <Box width={200} mb={1}>
          <Autocomplete
              disabled={loading}
              fullWidth
              multiple={true}
              loading={loadingDropdown}
              loadingText={'Loading...'}
              value={filter.productDescription}
              options={productCategories}
              getOptionLabel={(option) => option.title}
              disableCloseOnSelect
              limitTags={2}
              onChange={(_, newVal) => setFilter({ ...filter, productDescription: newVal })}
              getOptionSelected={(option, value) => option.id === value.id}
              renderOption={(option, { selected }) => (
                <React.Fragment>
                  <Checkbox
                    icon={<CheckBoxOutlineBlank fontSize="small" />}
                    checkedIcon={<CheckBox fontSize="small" />}
                    style={{ marginRight: 8 }}
                    checked={selected}
                  />
                  {option.title}
                </React.Fragment>
              )}
              renderInput={(params) => <TextField {...params} variant="outlined" label="Product Category" size="small" />}
            />
          </Box>
          <Box mb={1} width={200}>
          <Autocomplete
              disabled={loading}
              fullWidth
              disableListWrap
              loading={loadingDropdown}
              loadingText={'Loading...'}
              multiple={true}
              value={filter.productCategory}
              options={allProducts}
              disableCloseOnSelect
              limitTags={2}
              onChange={(_, newVal) => setFilter({ ...filter, productCategory: newVal })}
              getOptionSelected={(option, value) => option.id === value.id}
              getOptionLabel={(option) => option.title}
              renderOption={(option, { selected }) => (
                <React.Fragment>
                  <Checkbox
                    icon={<CheckBoxOutlineBlank fontSize="small" />}
                    checkedIcon={<CheckBox fontSize="small" />}
                    style={{ marginRight: 8 }}
                    checked={selected}
                  />
                  {option.title}
                </React.Fragment>
              )}
              renderInput={(params) => <TextField {...params} variant="outlined" label="Product Master" size="small" />}
            />
          </Box>
          <Box mb={1}>
            <Autocomplete
              disabled={loading}
              size="small"
              fullWidth
              options={countriesData}
              renderOption={(option, { selected }) => (
                <React.Fragment>
                  <Checkbox
                    icon={<CheckBoxOutlineBlank fontSize="small" />}
                    checkedIcon={<CheckBox fontSize="small" />}
                    style={{ marginRight: 8 }}
                    checked={selected}
                  />
                  {option.optionLabel}
                </React.Fragment>
              )}
              value={filter.country}
              getOptionLabel={(option) => option.optionLabel || ''}
              getOptionSelected={(option, val) => (option ? option.optionValue === val.optionValue : false)}
              onChange={(_, val) => setFilter({ ...filter, country: val ? val : {} })}
              renderInput={(params) => <TextField {...params} label="Country" variant="outlined" />}
            />
          </Box>
        </Box>
      </Popover>
    </Box>
  );
};

export default AssetFilters;
