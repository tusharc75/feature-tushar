import { makeStyles } from "@material-ui/core/styles";
import { Grid, Typography, IconButton } from "@material-ui/core";
import { Delete } from "@material-ui/icons";
import { Link } from "react-router-dom";
import BoxWithBorder from "../../components/BoxWithBorder";

const useStyles = makeStyles((theme) => ({
  root: {
    // flexGrow: 1,
  },
  heading: {
    fontSize: theme.typography.pxToRem(17),
    flexBasis: "33.33%",
    flexShrink: 0,
  },
  secondaryHeading: {
    fontSize: theme.typography.pxToRem(15),
    color: theme.palette.text.secondary,
  },
  actionsItems: {
    color: "grey",
    float: "right",
  },
}));

function DisplayData({ label, value, color }) {
  return (
    <div className="cTr">
      <div className="td1">
        <Typography color="textSecondary" variant="subtitle1">
          {label}
        </Typography>
      </div>
      <div className="td2">
        {" "}
        <Typography style={{ color: color ? color : "" }}>{value}</Typography>
      </div>
    </div>
  );
}

export default function AssignedEntities({
  data,
  unassignEntity,
  permissions,
}) {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      {data && data.length ? (
        <Grid container spacing={1}>
          {data.map((obj, index) => (
            <Grid item md={6} xs={12} sm={12} key={index}>
              <BoxWithBorder>
                <span
                  className={classes.actionsItems}
                  title={`Unassign ${obj.entityName}`}
                >
                  {permissions.role.isUpdate && (
                    <IconButton
                      onClick={() => unassignEntity(obj)}
                      size="small"
                    >
                      <Delete color="error" />
                    </IconButton>
                  )}
                </span>
                <Link
                  className="accountNameLink"
                  to={`/entity/detail/${obj._id}`}
                >
                  <Typography className="text-capitalize">
                    {obj?.entityName ?? ""}
                  </Typography>
                </Link>
                <DisplayData
                  label="Address"
                  value={obj?.address ?? "____"}
                  color={null}
                />
              </BoxWithBorder>
            </Grid>
          ))}
        </Grid>
      ) : null}
    </div>
  );
}
