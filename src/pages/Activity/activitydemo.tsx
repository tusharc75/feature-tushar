import React, { useState, useEffect } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Layout from "../../components/Layout";
import Activity from "../../components/Activity";
import UpcomingActivity from "../../components/Activity/UpcomingActivity";

const Activitydemo = () => {


    //current support type ["account","contact","lead","opportunity"] 

    // const relatedTo = [
    //     { type: "account", referenceId: "603f720c895f42001515a261", access: false },
    //     { type: "contact", referenceId: "603f7dc5895f42001515a265", access: true },
    // ]

    // const relatedTo = [
    //     { type: "account", referenceId: "60464170eeecc00015d538ab", access: true },
    // ]

    // const relatedTo = [
    //     { type: "account", referenceId: "60521f6821e404257c373fb7", access: true },
    // ]

    const relatedTo = [
        { type: "account", referenceId: "605222343c58e828945d22db", access: true },
    ]

    const [refresh, setRefresh] = useState(true);

    const handleActivityRefresh = () => {
        setRefresh(false)
        setRefresh(true)
    }

    return (<Layout>
        <Grid container spacing={3}>
            <Grid xs={4} item>
                <Activity relatedTo={relatedTo} handleActivityRefresh={handleActivityRefresh} />
            </Grid>
            <Grid xs={4} item>
                {refresh && <UpcomingActivity relatedTo={relatedTo} />}
            </Grid>
        </Grid>
    </Layout>
    );
}

export default Activitydemo;
