import React, { useState, useEffect } from 'react';
import Box from '@material-ui/core/Box';
import { Link } from "react-router-dom";

export const ViewAll = ({ type, relatedTo }) => {
    let filter = relatedTo.filter((_relatedTo) => _relatedTo.access === true);
    return filter.length > 0 ? <Box p={1} display="flex" justifyContent="center">
        <Box>
            <Link to={"/activity/" + type + "?referenceType=" + filter[0].type + "&referenceId=" + filter[0].referenceId} >View All</Link>
        </Box>
    </Box> : null
}