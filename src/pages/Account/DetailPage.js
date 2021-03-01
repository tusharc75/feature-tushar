import React from 'react'
import { Typography, Box, Grid } from '@material-ui/core'
import { capitalize } from '../../services/util'

function DetailPage(props) {
    const { data } = props
    const getNode = (k, val) => {
        return <Grid item xs={6} style={{ padding: "1px" }}>
            <table cellPadding="5px" cellSpacing='8px'>
                <tr style={{ width: "90%" }}>
                    <td style={{ width: '150px' }}><Typography style={{ fontWeight: '700' }} variant='subtitle1' color="textSecondary">{k}</Typography></td>
                    <td style={{ wordWrap: 'break-word' }}> <Typography variant='subtitle1'><bold> {capitalize(val)}</bold></Typography></td>
                </tr>
            </table>

        </Grid>
    }
    return <div style={{ flexGrow: 1, padding: "5px" }}>
        <Typography variant='h5' color="primary"> <strong>Details</strong></Typography>
        <Grid container spacing={3} style={{ padding: '20px' }}>
            {
                data && Object.keys(data).length > 0 ?
                    Object.keys(data).map(k => {
                        return <>
                            {
                                data[k] && typeof data[k] === 'object' && Object.keys(data[k]).length > 0 ?
                                    <>
                                        {Object.keys(data[k]).map((sk, i) => {
                                            return <>
                                                {
                                                    data[k][sk] ? getNode(sk, data[k][sk]) : null
                                                }</>
                                        })}
                                    </>
                                    : data[k] ? getNode(k, data[k]) : null
                            }
                        </>
                    }) : null
            }
        </Grid>
    </div >

}
export default DetailPage