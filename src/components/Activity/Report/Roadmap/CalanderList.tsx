import { makeStyles } from "@material-ui/core/styles";
import { Box, Tooltip } from "@material-ui/core";
import { TreeView, TreeItem } from "@material-ui/lab";
import moment from "moment";
import { useState } from "react";
import ActivityModelHandler from "../../ActivityModelHandler";

const useStyles = makeStyles((theme) => ({
  label: {
    paddingLeft: 0,
  },
  iconContainer: {
    display: "none",
  },
  group: {
    marginLeft: 0,
  },
  calenderHighlights: {
    color: "white",
    background: "red",
    borderRadius: "4px",
    padding: "2px 5px",
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
  },
}));

export default function CalanderList(props) {
  const {
    activity,
    expanded,
    selected,
    handleSelect,
    startDate,
    endDate,
    totalDay,
    calendarType,
    type,
    fetchRoadmap,
  } = props;
  const classes = useStyles();
  const [activityData, setActivityData] = useState(null);

  const getTreeNodes = (activity) => {
    return activity.map((data, index) => {
      let children = [];
      if (data.child && data.child.length) {
        children = getTreeNodes(data.child);
        children.push(<div></div>);
      }

      let label = (
        <Box width={"100%"} height={50}>
          <Tooltip
            title={
              data.status +
              " - " +
              moment(data.startDate).format("YYYY/MM/DD") +
              " - " +
              moment(data.dueDate).format("YYYY/MM/DD")
            }
            placement="right"
          >
            <Box
              onClick={() => setActivityData({ id: data._id, type })}
              minWidth={calendarType !== "week" ? "100px" : ""}
              height={30}
              borderRadius="borderRadius"
              display="flex"
              mt={1}
              style={{
                position: "absolute",
                left:
                  (100 * moment(data.startDate).diff(startDate, "days")) /
                    totalDay +
                  "%",
                right:
                  (100 * endDate.diff(moment(data.dueDate), "days")) /
                    totalDay +
                  "%",
              }}
              bgcolor="info.main"
              color="white"
            ></Box>
          </Tooltip>
        </Box>
      );

      return (
        <TreeItem
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
      );
    });
  };

  let TreeNodes = getTreeNodes(activity);
  return (
    <>
      <TreeView
        expanded={expanded}
        selected={selected}
        onNodeSelect={handleSelect}
      >
        {TreeNodes.map((node) => {
          return node;
        })}
      </TreeView>
      {activityData && (
        <ActivityModelHandler
          fetchBoard={fetchRoadmap}
          setActivityData={setActivityData}
          fromCalender={true}
          activityType={activityData.type}
          activityId={activityData.id}
        />
      )}
    </>
  );
}
