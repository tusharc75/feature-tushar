import { Box, Checkbox, FormControlLabel } from '@material-ui/core';

const SuperAdminAccess = ({ superAdminAccess, setSuperAdminAccess }) => {
    return (
        <Box pb={2}>
            <Box p={1}>
                <FormControlLabel
                    control={
                        <Checkbox
                            name="superAdminAccess"
                            checked={superAdminAccess}
                            onChange={(e) => {
                                setSuperAdminAccess(e.target.checked)
                            }}
                            color="primary"
                        />
                    }
                    label="Super Admin Access"
                />
            </Box>
        </Box>
    );
};

export default SuperAdminAccess;
