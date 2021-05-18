import { makeStyles } from "@material-ui/core/styles";
import { Typography, Box, Tooltip } from "@material-ui/core";
import { TreeView, TreeItem } from "@material-ui/lab";
import moment from "moment";

const useStyles = makeStyles(() => ({
  label: {
    paddingLeft: 0,
  },
  iconContainer: {
    display: "none",
  },
  group: {
    marginLeft: 0,
  },
}));

export default function CalanderList({
  activity,
  expanded,
  selected,
  handleSelect,
  startDate,
  endDate,
  totalDay,
  calendarType,
}) {
  const classes = useStyles();
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
              moment(data.startDate).format("YYYY/MM/DD") +
              " - " +
              moment(data.dueDate).format("YYYY/MM/DD")
            }
            placement="right"
            aria-label="add"
          >
            <Box
              minWidth={calendarType !== "week" ? "100px" : ""}
              height={35}
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
            >
              <Box mt={1} ml={1}>
                <Typography variant="body2">{data.status}</Typography>
              </Box>
            </Box>
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
    <TreeView
      expanded={expanded}
      selected={selected}
      onNodeSelect={handleSelect}
    >
      {TreeNodes.map((node) => {
        return node;
      })}
    </TreeView>
  );
}
