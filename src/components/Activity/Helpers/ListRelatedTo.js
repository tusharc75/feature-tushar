import React, { useState, useEffect } from 'react';
import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';
import Chip from '@material-ui/core/Chip';
import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

const capitalize = (s) => {
    if (typeof s !== 'string') return ''
    return s.charAt(0).toUpperCase() + s.slice(1)
}


export const ListRelatedTo = ({ relatedTo }) => {

    return <Box>
        {relatedTo && relatedTo.map((_element, index) => (
            <Box mr={1} mb={1}>
                <Chip key={index} label={capitalize(_element.type) + " - " + _element.name} size="small" />
            </Box>
        ))}
    </Box>
}