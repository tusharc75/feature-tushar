import { useEffect, useState, Fragment } from 'react'
import { Avatar, TextField, Box, Button } from '@material-ui/core'
import { Autocomplete } from '@material-ui/lab'

import axiosInstance from '../../axios/axiosInstance'

const NewChat = (props) => {
    const { setChatterId, setNewChat, setSelectedChat, users } = props;
    
    const [newUsers, setNewUsers] = useState([])
    

    const createRoom = () => {
        axiosInstance().post("/chatter/user-to-user", {users: newUsers.map(d => d.id)})
            .then(({ data: { data } }) => {
                setNewChat(false)
            })
        .catch(() => {})
    }
    

    return (
        <div className="new-chatbox">
            <Autocomplete
                id="User-select"
                fullWidth
                options={users}
                autoHighlight
                multiple
                size="small"
                getOptionLabel={(option) => option.name}
                renderOption={(option) => (
                    <Fragment>
                        <Avatar src={option.avatar} />
                        <Box component="span" mr={2} />
                        {option.name}
                    </Fragment>
                )}
                value={newUsers}
                onChange={(_, newVal) => setNewUsers(newVal)}
                renderInput={(params) => (
                    <TextField
                    {...params}
                    label="Select user"
                    variant="outlined"
                    inputProps={{
                        ...params.inputProps,
                        autoComplete: 'new-password', // disable autocomplete and autofill
                    }}
                    />
                )}
            />

            <div className="new-chat-btn">
                <Button
                    disabled={!newUsers.length}
                    fullWidth
                    color='primary'
                    variant="outlined"
                    onClick={createRoom}
                >
                    Start Chatting
                </Button>
            </div>
        </div>
    )
}

export default NewChat
