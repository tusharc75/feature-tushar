import axiosInstance from '../../../axios/axiosInstance';
import { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import SearchIcon from '@material-ui/icons/Search';
import IconButton from '@material-ui/core/IconButton';
import { Paper } from '@material-ui/core';
import styles from './category-sidebar.module.scss';
import TreeView from '@material-ui/lab/TreeView';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import TreeItem from '@material-ui/lab/TreeItem';
import Rating from '@material-ui/lab/Rating';

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
    marginLeft: theme.spacing(1),
    flex: 1
  },
  iconButton: {
    padding: 10
  }
}));

const CategorySidebar = ({ fetchData }) => {
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
      onClick={() => { fetchData(nodes.name) }}>
      {Array.isArray(nodes.children) ? nodes.children.map((node) => renderTree(node)) : null}
    </TreeItem>
  );

  return (
    <div className={styles.sidebar_nav}>
      <Paper component="form" className={classes.root}>
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
        <p className={styles.single_category_name}>Safety</p>
        <Rating
          name="simple-controlled"
          value={valueSafety}
          onChange={(event, newValueSafety) => {
            setValueSafety(newValueSafety);
          }}
        />
      </div>
      <div className={styles.rating}>
        <p className={styles.single_category_name}>Responsiveness</p>
        <Rating
          name="simple-controlled"
          value={valueRes}
          onChange={(event, newValueRes) => {
            setValueRes(newValueRes);
          }}
        />
      </div>
      <div className={styles.rating}>
        <p className={styles.single_category_name}>Equipment Quality</p>
        <Rating
          name="simple-controlled"
          value={valueQuality}
          onChange={(event, newValueQuality) => {
            setValueQuality(newValueQuality);
          }}
        />
      </div>
      <div className={styles.rating}>
        <p className={styles.single_category_name}>Technical Support</p>
        <Rating
          name="simple-controlled"
          value={valueTech}
          onChange={(event, newValueTech) => {
            setValueTech(newValueTech);
          }}
        />
      </div>
    </div >
  );
}

export default CategorySidebar;
