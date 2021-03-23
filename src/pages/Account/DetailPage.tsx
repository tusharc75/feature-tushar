import React from 'react'
import { Typography, Box, Grid } from '@material-ui/core'
import { EditOutlined } from '@material-ui/icons'
import { capitalize } from '../../services/util'
import './account.scss'
function DetailPage(props) {
    const { data } = props
    const getNode = (k, val) => {
        return <Grid item xs={6} style={{ padding: "1px" }}>
            <table cellPadding="1px" cellSpacing='1px'>
                <tr className="cTr">
                    <td className="td1" ><Typography style={{ fontWeight: 700 }} variant='subtitle1' color="textSecondary">{k}</Typography></td>
                    <td className="td2"> <Typography variant='subtitle1'><b> {capitalize(val)}</b></Typography></td>
                </tr>
            </table>

        </Grid>
    }
    return <div className="customDiv12">
        <div className="customDiv13" >
            <Typography variant='h5' color="primary"> <strong>Details</strong></Typography>
            <EditOutlined />
        </div>

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