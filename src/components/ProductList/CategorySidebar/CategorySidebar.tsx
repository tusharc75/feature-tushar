
import axiosInstance from "../../../axios/axiosInstance"
import React, { Children, useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import InputBase from '@material-ui/core/InputBase';
import SearchIcon from '@material-ui/icons/Search';
import IconButton from '@material-ui/core/IconButton';
import { Paper } from "@material-ui/core";
import styles from "./category-sidebar.module.scss"
import TreeView from '@material-ui/lab/TreeView';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import TreeItem from '@material-ui/lab/TreeItem';
const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.palette.background.paper,
  },
  nested: {
    paddingLeft: theme.spacing(4),
  },
  input: {
    marginLeft: theme.spacing(1),
    flex: 1,
  },
  iconButton: {
    padding: 10,
  },
}));

function CategorySidebar() {
    const classes = useStyles();
    const [productCategories, setProductCategories] = useState([])
   
    useEffect(() => {
        let queryString = `?limit=0`
        axiosInstance().get(`/product-category${queryString}`).then(({ data: { data} })=>{
           
          const tempArray = data.map((item) => item.parentCategory);
                
          const uniqueParent = [...new Set(tempArray)]
          // function getUniqueListBy(arr, key) {
          //   return [...new Map(arr.map(item => [item[key], item])).values()]
          //  }
          // console.log("unique", uniqueParent)
          // const uniqueArr = getUniqueListBy(uniqueParent,"optionValue")
            let categories = data.map((u,index)=>{
              if(u.parentCategory == null){
                return {
                  id: u.id,
                  name: u.name
                }
              }
              else {
               
                return {
                  id: u.parentCategory.optionValue,
                  name: u.parentCategory.optionLabel,
                  children: [
                    {
                      id: u.id,
                      name: u.name,
                    }
                  ]
                }
              }
               
            })
           
            setProductCategories(categories)
        })
    }, [])


  

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
                        <InputBase
                          className={classes.input}
                          placeholder="Search By Category"
                          inputProps={{ 'aria-label': 'search' }}
                        />
            </Paper>
       {productCategories.map(item=>(
        <div className={styles.single_category}>
        <TreeView
          className={classes.root}
          defaultCollapseIcon={<ExpandMoreIcon className={styles.single_category_icon}/>}
          defaultExpanded={['root']}
          defaultExpandIcon={<ChevronRightIcon  className={styles.single_category_icon}/>}
        >
          {renderTree(item)}
        </TreeView>
        <hr/>
      </div>
     
       ))}
    </div>
    )
}

export default CategorySidebar
