import axiosInstance from '../../../axios/axiosInstance';
import React, { Children, useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import InputBase from '@material-ui/core/InputBase';
import SearchIcon from '@material-ui/icons/Search';
import IconButton from '@material-ui/core/IconButton';
import { Checkbox, Paper } from '@material-ui/core';
import styles from './category-sidebar.module.scss';
import TreeView from '@material-ui/lab/TreeView';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import TreeItem from '@material-ui/lab/TreeItem';
import Rating from '@material-ui/lab/Rating';
import Box from '@material-ui/core/Box'

const useStyles = makeStyles((theme) => ({
  root: {
    // width: '100%',
    backgroundColor: theme.palette.background.paper,
    marginBottom: "10px"
  },
  nested: {
    paddingLeft: theme.spacing(4)
  },
  input: {
    marginLeft: theme.spacing(3),
    flex: 1,
    width: '70%'
  },
  iconButton: {
    padding: 10
  }
}));

function CategorySidebar() {
  const classes = useStyles();
  const [productCategories, setProductCategories] = useState([]);
  const [valueSafety, setValueSafety] = useState(2);
  const [valueRes, setValueRes] = useState(2);
  const [valueQuality, setValueQuality] = useState(2);
  const [valueTech, setValueTech] = useState(2);
  useEffect(() => {
    let queryString = `?limit=0`;


    axiosInstance()
      .get(`/product-category${queryString}`)
      .then(({ data: { data } }) => {

        let parentCategories = {}
        data.map(o => {
          if (o?.parentCategory) {
            let label = o?.parentCategory?.optionLabel
            if (parentCategories[label]) {
              parentCategories[label].push(o)
            }
            else {
              parentCategories[label] = [o]
            }
          }
        })

        data = data.map(obj => {
          if (parentCategories[obj.name]) {
            obj.children = parentCategories[obj.name]
          }
          else {
            obj.children = []
          }
          return obj
        })

        let allCategories = data.filter(obj => !(obj?.parentCategory))

        setProductCategories(allCategories)
      });
  }, []);



  const renderTree = (nodes) => (
    <TreeItem key={nodes.id} nodeId={nodes.id} label={nodes.name}
      onClick={() => { }}>
      {Array.isArray(nodes.children) ? nodes.children.map((node) => renderTree(node)) : null}
    </TreeItem>
  );

  return (
    <div className={styles.sidebar_nav}>
      <Paper component="form" className={`d-flex ${classes.root}`}>
        <InputBase className={classes.input} placeholder="Search By Category" inputProps={{ 'aria-label': 'search' }} />
        <IconButton type="submit" className={classes.iconButton} aria-label="search">
          <SearchIcon />
        </IconButton>
       
      </Paper>
      {
        productCategories.map(obj => {
          return <TreeView
            className={classes.root}
            defaultCollapseIcon={<ExpandMoreIcon />}
            defaultExpanded={['root']}
            defaultExpandIcon={<ChevronRightIcon />}
          >
            {renderTree(obj)}
          </TreeView>
        })
      }
      <h3 className={styles.single_category_name}>Ratings</h3>
      <div className={styles.rating}>
        <p className={styles.single_category_name && styles.font_size}>Safety</p>
        <Rating
          name="simple-controlled"
          value={valueSafety}
          className={styles.rating_size}
          onChange={(event, newValueSafety) => {
            setValueSafety(newValueSafety);
          }}

        />
      </div>
      <div className={styles.rating}>
        <p className={styles.single_category_name && styles.font_size}>Responsiveness</p>
        <Rating
          name="simple-controlled"
          value={valueRes}
          className={styles.rating_size}
          onChange={(event, newValueRes) => {
            setValueRes(newValueRes);
          }}
        />
      </div>
      <div className={styles.rating}>
        <p className={styles.single_category_name && styles.font_size}>Equipment Quality</p>
        <Rating
          name="simple-controlled"
          value={valueQuality}
          className={styles.rating_size}
          onChange={(event, newValueQuality) => {
            setValueQuality(newValueQuality);
          }}
        />
      </div>
      <div className={styles.rating}>
        <p className={styles.single_category_name && styles.font_size}>Technical Support</p>
        <Rating
          name="simple-controlled"
          value={valueTech}
          className={styles.rating_size}
          onChange={(event, newValueTech) => {
            setValueTech(newValueTech);
          }}
        />
      </div>
    </div>
  );
}

export default CategorySidebar;
