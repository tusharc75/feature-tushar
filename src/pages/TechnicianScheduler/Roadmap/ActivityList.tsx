import { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Typography, Box, Button, Dialog, Avatar, IconButton } from '@material-ui/core';
import { TreeView, TreeItem } from '@material-ui/lab';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import moment from 'moment';
import { Map } from '@material-ui/icons';

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
    marginLeft: 0
  }
}));

export default function ActivityList(props) {
  const classes = useStyles();

  const { activity, expanded, selected, handleToggle, handleSelect } = props;

  const getTreeNodes = (treeList) => {
    return treeList.map((data, index) => {
      let children = [];
      if (data.child && data.child.length > 0) {
        children = getTreeNodes(data.child);
        children.push(<div></div>);
      }

      let label = (
        <Box
          width={'100%'}
          height={99}
          className="d-flex align-items-center"
          onClick={(event) => {
            handleSelect(event, data, 'technician');
          }}
        >
          <Box width={'80%'} className="d-flex align-items-center">
            <Avatar variant="circle" sizes="small" style={{ height: 45, width: 45 }} alt="Remy Sharp" src={data?.photo} />
            <Box ml={2} flex style={{ flexDirection: 'column' }}>
              <Typography style={{ fontWeight: 'bolder', fontSize: '1rem' }}>{`${data?.firstName} ${data?.lastName}`}</Typography>
              <p style={{ fontSize: '0.8rem', color: 'grey' }}>{`${data?.competencyType?.optionLabel || ''}`}</p>
              <p style={{ fontSize: '0.6rem', color: 'grey' }}>{`${data?.competencies?.map((e) => e.optionLabel)?.toString()}`}</p>
            </Box>
          </Box>
          <Box width={'20%'} className="d-flex align-items-center">
            <IconButton
              style={{ padding: 0 }}
              onClick={(event) => {
                event.stopPropagation();
                handleSelect(event, data, 'map');
              }}
            >
              <Map fontSize="medium" />
            </IconButton>
          </Box>
        </Box>
      );

      return (
        <TreeItem
          key={index}
          nodeId={data._id.toString()}
          label={label}
          children={children}
          style={{ borderBottom: '1px solid var(--common-border-color)' }}
          classes={{
            root: classes.root
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
