import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import TreeView from '@material-ui/lab/TreeView';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import TreeItem from '@material-ui/lab/TreeItem';
import Box from '@material-ui/core/Box';
import Chip from '@material-ui/core/Chip';
import { Typography } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';


const useStyles = makeStyles((theme) => ({
    root: {
        '&:hover > $content': {
            backgroundColor: theme.palette.action.hover,
        },
        '&:focus > $content, &$selected > $content': {
            backgroundColor: `var(--tree-view-bg-color, ${theme.palette.grey[400]})`,
            color: 'var(--tree-view-color)',
        },
        '&:focus > $content $label, &:hover > $content $label, &$selected > $content $label': {
            backgroundColor: 'transparent',
        },
    },
    label: {
        paddingLeft: 0
    },
    group: {
        marginLeft: 0
    }
}));

export default function ActivityList({ activity, treeList, expanded, selected, handleToggle, handleSelect }) {

    const classes = useStyles();
    const getTreeNodes = (treeList) => {
        return treeList.map((data, index) => {
            let children = [];
            if (data.subActivity && data.subActivity.length > 0) {
                children = getTreeNodes(data.subActivity);
                children.push(<div></div>);
            }

            let label = <Box width={"100%"} height={50}>
                <Box display="flex" ml={1} mt={2} mb={1} width={"100%"} style={{ position: "absolute" }}>
                    <Grid container>
                        <Grid item xs={9}>
                            <Typography variant="body2">{data.name}</Typography>
                        </Grid>
                        <Grid xs={3} container justify="flex-end">
                            <Box mr={2}>
                                {/* <Chip size="small" label={data.type} color="primary" /> */}
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </Box>

            return <TreeItem
                key={index}
                nodeId={data._id.toString()}
                label={label}
                //onLabelClick={(e) => handelOpenActivity(e, data._id)}
                children={children}
                classes={{
                    root: classes.root,
                }}
            />
        })
    }

    // const handelOpenActivity = (event, activityId) => {
    //     event.preventDefault()
    // }

    let TreeNodes = getTreeNodes(activity);
    return <TreeView
        defaultCollapseIcon={<ExpandMoreIcon />}
        defaultExpandIcon={<ChevronRightIcon />}
        expanded={expanded}
        selected={selected}
        onNodeToggle={handleToggle}
        onNodeSelect={handleSelect}
    >
        {TreeNodes.map((node) => {
            return node
        })}
    </TreeView>
}