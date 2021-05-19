import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import TreeView from '@material-ui/lab/TreeView';
import TreeItem from '@material-ui/lab/TreeItem';
import Box from '@material-ui/core/Box';
import { Typography } from '@material-ui/core';
import Tooltip from '@material-ui/core/Tooltip';
const moment = require('moment');


const useStyles = makeStyles((theme) => ({
    label: {
        paddingLeft: 0
    },
    iconContainer: {
        display: "none"
    },
    group: {
        marginLeft: 0
    },
    calenderHighlights: {
        color: "white",
        background: theme.palette.secondary.main,
        borderRadius: "4px",
        padding: "2px 5px",
        display: "flex",
        alignItems: "center",
        overflow: "hidden"
    }
}));


export default function CalanderList({ activity, expanded, selected, handleSelect, startDate, endDate, totalDay }) {

    const classes = useStyles();
    const getTreeNodes = (activity) => {
        return activity.map((data, index) => {

            let children = [];
            if (data.child && data.child.length) {
                children = getTreeNodes(data.child);
                children.push(<div></div>);
            }

            let label = <Box width={"100%"} height={50} display="flex" alignItems="center">
                <Tooltip title={<span>{data.status} : {moment(data.startDate).format("YYYY/MM/DD") + " - " + moment(data.dueDate).format("YYYY/MM/DD")}</span>} placement="right" aria-label="add">
                    <Box className={classes.calenderHighlights} style={{
                        position: 'absolute',
                        left: ((100 * ((moment(data.startDate)).diff(startDate, 'days'))) / totalDay) + "%",
                        right: ((100 * (endDate.diff(moment(data.dueDate), 'days'))) / totalDay) + "%"
                    }}>
                        <Box>
                            <Typography variant="body2">{data.status}</Typography>
                        </Box>
                    </Box>
                </Tooltip>
            </Box>

            return <TreeItem
                key={index}
                nodeId={data._id.toString()}
                label={label}
                children={children}
                classes={{
                    group: classes.group,
                    iconContainer: classes.iconContainer,
                    label: classes.label,
                }}
            />
        })
    }

    let TreeNodes = getTreeNodes(activity);
    return <TreeView
        expanded={expanded}
        selected={selected}
        onNodeSelect={handleSelect}
    >
        {TreeNodes.map((node) => {
            return node
        })}
    </TreeView>
}