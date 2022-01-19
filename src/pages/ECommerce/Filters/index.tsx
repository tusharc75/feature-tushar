import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  ListSubheader,
  List,
  ListItem,
  Checkbox,
  ListItemIcon,
  IconButton,
  ListItemSecondaryAction,
  ListItemText,
  Collapse,
  CircularProgress
} from '@material-ui/core';
import { ExpandLess, ExpandMore, Add, Remove } from '@material-ui/icons';
import { Skeleton } from '@material-ui/lab';

import axiosInstance from '../../../axios/axiosInstance';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    backgroundColor: theme.palette.background.paper
  },
  nested: {
    paddingLeft: theme.spacing(4)
  },
  nestedDeep: {
    paddingLeft: theme.spacing(6)
  }
}));

type CategoriesList = {
  name: string;
  id: string;
  open: boolean;
};

type FiltersList = {
  fieldName: string;
  fieldLabel: string;
  option: {
    optionLabel: string;
    optionValue: string;
    checked: boolean;
  }[];
  open: boolean;
};

const Filters = (props: any) => {
  const { setToastConfig, productCategories } = props;
  const classes = useStyles();
  const [loadingFilter, setLoadingFilter] = React.useState(false);
  const [categoryList, setCategoryList] = React.useState<CategoriesList[] | any[]>([]);
  const [filters, setFilters] = React.useState<FiltersList[] | any[]>([]);

  React.useEffect(() => {
    setCategories();
  }, [productCategories]);

  const setCategories = () => {
    if (!productCategories && productCategories.length === 0) return;
    setCategoryList(productCategories.map((p: any) => ({ name: p.name, id: p.id, open: false })));
  };

  /**
   *  Handle when one category is being expanded
   */

  const onCategoryClick = React.useCallback((id, open: boolean) => {
    setCategoryList((prevState) =>
      prevState.map((category: CategoriesList) => ({
        ...category,
        open: category.id === id ? !category.open : category.open
      }))
    );

    if (open) {
      setTimeout(() =>  setFilters([]), 500)
      return;
    }

    fetchFilters(id);
  }, []);

  /**
   * Fetch filters of selected category
   */
  const fetchFilters = (id) => {
    let url = id ? `category=${id}` : '';
    setLoadingFilter(true);
    axiosInstance()
      .get(`/ecommerce/filters?${url}`)
      .then(({ data: { data } }) => {
        setLoadingFilter(false);
        setFilters(
          data.map((d: any) => ({
            ...d,
            open: false,
            option: d.option.map((_d: any) => ({
              ..._d,
              checked: false
            }))
          }))
        );
      })
      .catch((err) => {
        setToastConfig(err);
        setLoadingFilter(false);
      });
  };

  /**
   * Handle expand on filter
   */
  const handleClickExpand = (fieldName: string) => {
    setFilters((prevState) =>
      prevState.map((filter: FiltersList) => ({
        ...filter,
        open: filter.fieldName === fieldName ? !filter.open : filter.open
      }))
    );
  };
  /**
   * Handle click on Each Filters
   */
  const handleClickFilter = (fieldName: string, optionValue: string) => {
    setFilters((prevState) =>
      prevState.map((filter: FiltersList) => ({
        ...filter,
        option: filter.option.map((opt) => ({
          ...opt,
          checked: filter.fieldName === fieldName && opt.optionValue === optionValue ? !opt.checked : opt.checked
        }))
      }))
    );
  };

  return (
    <List
      dense
      component="nav"
      aria-labelledby="nested-list-categories"
      subheader={
        <ListSubheader component="div" id="nested-list-categories">
          {categoryList.length > 0 ? "Categories" : "Loading Categories..."}
        </ListSubheader>
      }
      className={classes.root}
    >
      {categoryList.map((item: CategoriesList) => (
        <React.Fragment key={item.id}>
          <ListItem>
            <ListItemText primary={item.name} />
            <ListItemSecondaryAction>
              {loadingFilter ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <IconButton size="small" edge="end" onClick={() => onCategoryClick(item.id, item.open)}>
                  {item.open ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              )}
            </ListItemSecondaryAction>
          </ListItem>
          <Collapse in={item.open} timeout="auto" unmountOnExit>
            <List component="div" disablePadding dense>
              {filters.length > 0 ? (
                filters.map((filter: FiltersList) => (
                  <React.Fragment key={filter.fieldName}>
                    <ListItem className={classes.nested}>
                      <ListItemText primary={filter.fieldLabel} />
                      <ListItemSecondaryAction>
                        <IconButton size="small" edge="end" onClick={() => handleClickExpand(filter.fieldName)}>
                          {filter.open ? <Remove fontSize="small" /> : <Add fontSize="small" />}
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Collapse in={filter.open} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding dense>
                        {filter.option.map((opt) => (
                          <ListItem key={opt.optionValue} className={classes.nestedDeep} role={undefined} dense>
                            <ListItemIcon>
                              <Checkbox
                                size='small'
                                edge="start"
                                checked={opt.checked}
                                tabIndex={-1}
                                disableRipple
                                onClick={() => handleClickFilter(filter.fieldName, opt.optionValue)}
                                inputProps={{ 'aria-labelledby': opt.optionValue }}
                              />
                            </ListItemIcon>
                            <ListItemText id={opt.optionValue} primary={opt.optionLabel} />
                          </ListItem>
                        ))}
                      </List>
                    </Collapse>
                  </React.Fragment>
                ))
              ) : (
                <>
                  <ListItem className={classes.nested}>
                    <Skeleton variant="text" width={'100%'} height={30} />
                  </ListItem>
                  <ListItem className={classes.nested}>
                    <Skeleton variant="text" width={'100%'} height={30} />
                  </ListItem>
                  <ListItem className={classes.nested}>
                    <Skeleton variant="text" width={'100%'} height={30} />
                  </ListItem>
                  <ListItem className={classes.nested}>
                    <Skeleton variant="text" width={'100%'} height={30} />
                  </ListItem>
                  <ListItem className={classes.nested}>
                    <Skeleton variant="text" width={'100%'} height={30} />
                  </ListItem>
                </>
              )}
            </List>
          </Collapse>
        </React.Fragment>
      ))}
    </List>
  );
};

export default Filters;
