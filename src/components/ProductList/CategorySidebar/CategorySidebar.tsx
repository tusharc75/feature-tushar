import axiosInstance from '../../../axios/axiosInstance';
import React, { Children, useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import InputBase from '@material-ui/core/InputBase';
import SearchIcon from '@material-ui/icons/Search';
import IconButton from '@material-ui/core/IconButton';
import { Paper } from '@material-ui/core';
import styles from './category-sidebar.module.scss';
import TreeView from '@material-ui/lab/TreeView';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import TreeItem from '@material-ui/lab/TreeItem';
import ReactStars from 'react-rating-stars-component';
const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.palette.background.paper
  },
  nested: {
    paddingLeft: theme.spacing(4)
  },
  input: {
    marginLeft: theme.spacing(1),
    flex: 1
  },
  iconButton: {
    padding: 10
  }
}));

function CategorySidebar() {
  const classes = useStyles();
  const [productCategories, setProductCategories] = useState([]);

  useEffect(() => {
    let queryString = `?limit=0`;
    axiosInstance()
      .get(`/product-category${queryString}`)
      .then(({ data: { data } }) => {
        // const tempArray = data.map((item) => item.parentCategory);

        // const uniqueParent = [...new Set(tempArray)]
        // function getUniqueListBy(arr, key) {
        //   return [...new Map(arr.map(item => [item[key], item])).values()]
        //  }
        // console.log("unique", uniqueParent)
        // const uniqueArr = getUniqueListBy(uniqueParent,"optionValue")
        // let categories = data.map((u,index)=>{
        //   if(u.parentCategory == null){
        //     return {
        //       id: u.id,
        //       name: u.name,
        //       children : null
        //     }
        //   }
        //   else {

        //     return {
        //       id: u.parentCategory.optionValue,
        //       name: u.parentCategory.optionLabel,
        //       children: [
        //         {
        //           id: u.id,
        //           name: u.name,
        //         }
        //       ]
        //     }
        //   }

        // })

        // setProductCategories(categories)
        let newData = [];

        data
          .filter((d) => d.parentCategory === undefined)
          .map((m) => {
            newData.push({
              id: m.id,
              name: m.name,
              children: []
            });
          });

        data
          .filter((f) => f.parentCategory)
          .forEach((d) => {
            const indexOfCategory = newData.findIndex((ff) => ff.id === d.parentCategory.optionValue);

            newData[indexOfCategory].children.push(d);
          });

        setProductCategories(newData);
      });
  }, []);

  const renderTree = (nodes) => (
    <TreeItem key={nodes.id} nodeId={nodes.id} label={nodes.name} className={styles.single_category_name}>
      {Array.isArray(nodes.children) ? nodes.children.map((node) => renderTree(node)) : null}
    </TreeItem>
  );

  return (
    <div className={styles.sidebar_nav}>
      <Paper component="form" className={classes.root}>
        <IconButton type="submit" className={classes.iconButton} aria-label="search">
          <SearchIcon />
        </IconButton>
        <InputBase className={classes.input} placeholder="Search By Category" inputProps={{ 'aria-label': 'search' }} />
      </Paper>
      {productCategories.map((item) => (
        <div className={styles.single_category}>
          <TreeView
            className={classes.root}
            defaultCollapseIcon={<ExpandMoreIcon className={styles.single_category_icon} />}
            defaultExpanded={['root']}
            defaultExpandIcon={<ChevronRightIcon className={styles.single_category_icon} />}
          >
            {renderTree(item)}
          </TreeView>
          <hr />
        </div>
      ))}

      <h3 className={styles.single_category_name}>Ratings</h3>
      <div className={styles.rating}>
        <p className={styles.single_category_name}>Safety</p>
        <ReactStars count={5} size={24} activeColor="#ffd700" edit={false} value={3.5} isHalf={true} />
      </div>
      <div className={styles.rating}>
        <p className={styles.single_category_name}>Responsiveness</p>
        <ReactStars count={5} size={24} activeColor="#ffd700" edit={false} value={3.5} isHalf={true} />
      </div>
      <div className={styles.rating}>
        <p className={styles.single_category_name}>Equipment Quality</p>
        <ReactStars count={5} size={24} activeColor="#ffd700" edit={false} value={3} isHalf={true} />
      </div>
      <div className={styles.rating}>
        <p className={styles.single_category_name}>Technical Support</p>
        <ReactStars count={5} size={24} activeColor="#ffd700" edit={false} value={3} isHalf={true} />
      </div>
    </div>
  );
}

export default CategorySidebar;
