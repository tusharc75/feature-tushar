import { makeStyles } from "@material-ui/core/styles";
import List from "@material-ui/core/List";
import { Typography } from "@material-ui/core";
import ListItem from "@material-ui/core/ListItem";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemText from "@material-ui/core/ListItemText";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";
import { Link } from "react-router-dom";
import BoxWithBorder from "../../components/BoxWithBorder";
import CopyToClipboard from "../../components/Helpers/CopyToClipboard";

const useStyles = makeStyles((theme) => ({
    root: {
        flexGrow: 1,
    },
    demo: {
        backgroundColor: theme.palette.background.paper,
        width: "100%",
    },
    title: {
        margin: theme.spacing(4, 0, 2),
    },
    list: {
        width: "100%",
        padding: 0,
    },
}));

const AssignedFrequentlyBoughtProduct = ({ product,
    unassignProduct,
    permissions, }) => {
    const classes = useStyles();

    return (
        <div className={classes.demo}>
            <List disablePadding>
                {product && product.length
                    ? product.map((obj) => (
                        <BoxWithBorder key={obj._id} style={{ margin: "8px" }}>
                            <ListItem disableGutters className={classes.list}>
                                <div>
                                    <ListItemText
                                        primary={
                                            <Typography>
                                                <Link
                                                    className="link"
                                                    to={`/product/detail/${obj._id}`}
                                                >
                                                    {obj.productName || ""}
                                                </Link>
                                            </Typography>
                                        }
                                        secondary={obj.mrp}
                                    />
                                </div>

                                {permissions.isUpdate && (
                                    <ListItemSecondaryAction
                                        title={"Unassign product"}
                                    >
                                        <IconButton
                                            size="small"
                                            edge="end"
                                            aria-label="delete"
                                            onClick={() => unassignProduct(obj)}
                                        >
                                            <DeleteIcon
                                                color={"error"}
                                            />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                )}
                            </ListItem>
                        </BoxWithBorder>
                    ))

                    : null}
            </List>
        </div>
    );
};

export default AssignedFrequentlyBoughtProduct;
