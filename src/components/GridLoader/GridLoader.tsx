import React from 'react';
import CircularProgress from '@material-ui/core/CircularProgress';
import styles from './GridLoader.module.scss'
import { Box, Typography } from '@material-ui/core';

export default function GridLoader({ text, ...rest }) {
    return (
        <div className={styles.loading_shading_mui}>
            <CircularProgress className={styles.loading_icon_mui} />
            <Box marginY={1} />
            {text && <Typography variant="caption">{text}</Typography>}
        </div>
    )
}
