import {Fragment} from 'react'
import { createStyles, Theme, makeStyles } from '@material-ui/core/styles';
import {
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar
} from '@material-ui/core'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
      backgroundColor: theme.palette.background.paper,
    },
    inline: {
      display: 'inline',
    },
  }),
);


const ChatList = ({staticData, setSelectedChat}) => {
    const classes = useStyles();
    return (
        <div>
            <List className={classes.root}>
                {staticData.map((d,i) => (
                    <Fragment key={i}>
                    <ListItem button
                            onClick={() => setSelectedChat(d)}
                            alignItems="flex-start">
                    <ListItemAvatar>
                    <Avatar alt="Remy Sharp" />
                    </ListItemAvatar>
                    <ListItemText
                    primary={d.username}
                    secondary={
                        <Fragment>                                
                            {d.message}
                        </Fragment>
                    }
                    />
                </ListItem>
                <Divider variant="inset" component="li" />
                </Fragment>
                ))}
            </List>
        </div>
    )
}

export default ChatList
