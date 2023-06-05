import React, { useMemo } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Typography, Box } from '@material-ui/core';
import { TreeView, TreeItem } from '@material-ui/lab';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import { useAppTheme } from 'src/constants/AppConfig';

const useStyles = makeStyles((theme) => ({
  root: {
    '&:hover > $content': {
      backgroundColor: theme.palette.action.hover
    },
    '&:focus > $content, &$selected > $content': {
      backgroundColor: `var(--tree-view-bg-color, ${theme.palette.grey[400]})`,
      color: 'var(--tree-view-color)'
    },
    '&:focus > $content $label, &:hover > $content $label, &$selected > $content $label': {
      backgroundColor: 'transparent'
    }
  },
  label: {
    paddingLeft: 0
  },
  group: {
    paddingLeft: 0,
    '& $content': {
      paddingLeft: 0
    }
  }
}));

export default function ActivityList(props) {
  const [theme] = useAppTheme();

  const types = useMemo(
    () => [
      { _id: '1', name: 'Planned', color: theme === 'light' ? 'hsl(46, 95%, 92%)' : 'hsla(46, 95%, 62%, .5)' },
      { _id: '2', name: 'In-Use', color: theme === 'light' ? 'hsl(342, 100%, 97%)' : 'hsla(342, 100%, 67%, .5)' },
      { _id: '3', name: 'Available', color: theme === 'light' ? 'hsl(206, 100%, 97%)' : 'hsla(206, 100%, 67%, .5)' }
    ],
    [theme]
  );
  const classes = useStyles();

  const { activity, expanded, selected, handleToggle, handleSelect } = props;

  const getTreeNodes = (treeList) => {
    return treeList.map((data, index) => {
      let children = [];
      if (data?.productName) {
        children = getTreeNodes(types);
        children.push(<div></div>);
      }
      let label = (
        <Box
          width={'100%'}
          height={30}
          className="d-flex align-items-center"
          style={{ backgroundColor: data?.color || 'var(--dark-secondary, white)' }}
          onClick={(event) => {
            handleSelect(event, data);
          }}
        >
          {data?.productName ? (
            <Typography variant="subtitle2" className="text-truncate" title={data?.productName}>
              {data?.productName}
            </Typography>
          ) : (
            <Typography className="text-truncate">{data?.name}</Typography>
          )}
        </Box>
      );
      return (
        <TreeItem
          key={index}
          nodeId={data._id.toString()}
          label={label}
          children={children}
          classes={{
            root: classes.root,
            group: classes.group
          }}
        />
      );
    });
  };

  let TreeNodes = getTreeNodes(activity);
  return (
    <>
      <TreeView
        defaultCollapseIcon={<ExpandMoreIcon />}
        defaultExpandIcon={<ChevronRightIcon />}
        expanded={expanded}
        selected={selected}
        onNodeToggle={handleToggle}
        // onNodeSelect={handleSelect}
      >
        {TreeNodes.map((node) => {
          return node;
        })}
      </TreeView>
    </>
  );
}
