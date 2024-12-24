import { makeStyles } from '@mui/styles';
import List from '@mui/material/List';
import { Typography } from '@mui/material';
import ListItem from '@mui/material/ListItem';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import { Link } from 'react-router-dom';
import BoxWithBorder from '../../components/BoxWithBorder';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1
  },
  demo: {
    backgroundColor: theme.palette.background.paper,
    width: '100%'
  },
  title: {
    margin: theme.spacing(4, 0, 2)
  },
  list: {
    width: '100%',
    padding: 0
  }
}));

const AssignedFrequentlyBoughtProduct = ({ product, unassignProduct, permissions }) => {
  const classes = useStyles();

  return (
    <div className={classes.demo}>
      <List disablePadding>
        {product && product.length
          ? product.map((obj) => (
              <BoxWithBorder key={obj._id} style={{ margin: '8px' }}>
                <ListItem disableGutters className={classes.list}>
                  <div>
                    <ListItemText
                      primary={
                        <Typography>
                          <Link className="link" to={`/product/detail/${obj._id}`}>
                            {obj.productName || ''}
                          </Link>
                        </Typography>
                      }
                      secondary={obj.mrp}
                    />
                  </div>

                  {permissions.isUpdate && (
                    <ListItemSecondaryAction title={'Unassign product'}>
                      <IconButton size="small" edge="end" aria-label="delete" onClick={() => unassignProduct(obj)}>
                        <DeleteIcon color={'error'} />
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
