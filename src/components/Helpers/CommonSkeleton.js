import React from 'react'
import {
    Box,
    Grid
} from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
function CommonSkeleton({ lenArray }) {
    return <Grid container spacing={2}>
        {lenArray.map((i) => (
            <Grid item sm={6} md={6}>
                <Skeleton variant="text" width="100px" height="16px" />
                <Box marginY={1} />
                <Skeleton width="100%" height="50px" />
            </Grid>
        ))}
    </Grid>
}
export default CommonSkeleton