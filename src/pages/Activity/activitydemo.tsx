import React, { useState, useEffect } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Layout from "../../components/Layout";
import Activity from "../../components/Activity";
import UpcomingActivity from "../../components/Activity/UpcomingActivity";
import ProductBuilder from "../../components/productBuilder/master";

const Activitydemo = () => {


    //current support type ["customerAccount","customerContact","supplierAccount","supplierContact","lead","opportunity"] 

    const relatedTo = [
        { type: "customerAccount", referenceId: "605222343c58e828945d22db", access: true },
    ]



    const [refresh, setRefresh] = useState(true);

    const handleActivityRefresh = () => {
        setRefresh(false)
        setRefresh(true)
    }

    //current support type product Builder ["opportunity"] 

    //    const relatedTo = [
    //         { name: "ROMIT SADARIA", type: "opportunity", referenceId: "605222343c58e828945d22db", access: true },
    //     ]

    return (
        <Grid container spacing={3}>
            <Grid xs={4} item>
                <Activity relatedTo={relatedTo} handleActivityRefresh={handleActivityRefresh} />
            </Grid>
            <Grid xs={4} item>
                {refresh && <UpcomingActivity relatedTo={relatedTo} />}
            </Grid>
        </Grid>
    );
}

export default Activitydemo;
