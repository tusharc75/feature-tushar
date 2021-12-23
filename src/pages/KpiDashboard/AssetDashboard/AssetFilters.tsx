import React from 'react';
import { Button, Box, Checkbox, TextField, Popover } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { CheckBoxOutlineBlank, CheckBox, FilterList } from '@material-ui/icons';

import routes from '../../../components/Helpers/Routes';
import axiosInstance from '../../../axios/axiosInstance';
import countriesData from '../../../constants/Country.json';
import { FilterType } from './AssetDashboard';

interface FilterProps {
  filter: FilterType;
  setFilter: any;
  loading: boolean;
  fetchData?: VoidFunction;
  enableSubmit?: boolean;
}

const AssetFilters = (props: FilterProps) => {
  const { filter, setFilter, loading } = props;
  const [loadingProduct, setLoadingProduct] = React.useState(false);
  const [loadingProductCategory, setLoadingProductCategory] = React.useState(false);
  const [allProductCategories, setAllProductCategories] = React.useState([]);
  const [allProducts, setAllProducts] = React.useState([]);

  const [filterAnchor, setFilterAnchor] = React.useState(null);
  const [openFilter, setOpenFilter] = React.useState(false);

  React.useEffect(() => {
    fetchProductCategory();
    fetchProduct();
  }, []);

  const fetchProductCategory = () => {
    setLoadingProductCategory(true);
    axiosInstance()
      .get(`${routes.productCategory.path}?limit=0`)
      .then(({ data: { data } }) => {
        setAllProductCategories(data.map((d) => ({ id: d._id, title: d.name })));
        setLoadingProductCategory(false);
      })
      .catch((err) => {
        setLoadingProductCategory(false);
      });
  };

  const fetchProduct = () => {
    setLoadingProduct(true);
    axiosInstance()
      .get(`${routes.product.path}?limit=0`)
      .then(({ data: { data } }) => {
        setAllProducts(data.map((d) => ({ id: d._id, title: d.productName })));
        setLoadingProduct(false);
      })
      .catch((err) => {
        setLoadingProduct(false);
      });
  };

  const handleClickFilter = (event) => {
    setFilterAnchor(event.currentTarget);
    setOpenFilter((prev) => !prev);
  };

  return (
    <div>
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
              disableListWrap
              loading={loadingProductCategory}
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
              renderInput={(params) => <TextField {...params} variant="outlined" label="Product" size="small" />}
            />
          </Box>
          <Box mb={1} width={200}>
            <Autocomplete
              disabled={loading}
              fullWidth
              multiple={true}
              loading={loadingProduct}
              loadingText={'Loading...'}
              value={filter.productDescription}
              options={allProductCategories}
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
    </div>
  );
};

export default AssetFilters;
