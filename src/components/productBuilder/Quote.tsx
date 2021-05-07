import React, { useState, useEffect, Fragment, useContext } from "react";
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';

const Quote = (props) => {

    const { productBuilderId } = props;

    return (<Box mt={5} mb={3} >
        <Box>
            <Button variant="contained" size="small" color="primary" onClick={() => { alert(productBuilderId) }}>Generate Quote</Button>
        </Box>
    </Box>
    );
}

export default Quote;
