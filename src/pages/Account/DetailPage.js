import React from 'react'
import { Typography, Box } from '@material-ui/core'
function DetailPage(props) {
    const { data } = props
    console.log("🚀 ~ file: DetailPage.js ~ line 4 ~ DetailPage ~ data", data)
    return <>
        <table>
            {
                data && Object.keys(data).length > 0 ?
                    Object.keys(data).map(k => {
                        return <>
                            <Box fontWeight="fontWeightBold" fontSize="h5.fontSize" m={1}>
                                {k || ''}
                            </Box>
                            <br />
                            <hr />
                            {
                                data[k] && typeof data[k] === 'object' && Object.keys(data[k]).length > 0 ?
                                    <>
                                        {Object.keys(data[k]).map(sk => {
                                            return data[k][sk] ? <> <Typography>

                                                <Box fontWeight="fontWeightMedium" m={1} m={1}>
                                                    <span>{sk}</span>
                                                    <span style={{ color: 'darkgray', marginLeft: '5px' }}>{data[k][sk]}</span>
                                                </Box>

                                            </Typography> </> : null
                                        })}
                                    </>
                                    : data[k] ? <>
                                        <Typography>
                                            <Box fontWeight="fontWeightMedium" m={1} m={1}>
                                                <span>{k}</span>
                                                <span style={{ color: 'darkgray', marginLeft: '5px' }}>{data[k]}</span>
                                            </Box>

                                        </Typography>
                                        <br /></> : null
                            }
                        </>
                    }) : null
            }
        </table>
    </>

}
export default DetailPage