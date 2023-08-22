import { Box, IconButton, Typography, useMediaQuery, useTheme } from "@material-ui/core";
import { useState } from "react";
import ChartComponent from "react-chartjs-2";
import { FiMaximize2 } from "react-icons/fi";
import ContentFullScreen from "src/components/ContentFullScreen";
import HtmlTooltip from "src/components/CustomTooltipTitle";

export default function Chart({ id, data, label = '' }) {
    const theme = useTheme();

    const isScreenSmall = useMediaQuery(theme.breakpoints.down('xs'));

    const [openFullScreen, setOpenFullScreen] = useState(false);

    return (
        <Box className="max-w-full" sx={{ border: '1px solid var(--common-border-color)', boxShadow: '0px 20.3165px 40.6331px rgba(0, 0, 0, 0.03)' }}>
            <ContentFullScreen title={'Chart'} fullScreen={openFullScreen} setFullScreen={setOpenFullScreen}>
                <Box display="flex" justifyContent="space-between" alignItems="center" style={{ padding: '15px 10px' }}>
                    <Typography component="div" color="textPrimary">
                        <h4>
                            {label}
                        </h4>
                    </Typography>
                    {!openFullScreen && (
                        <div className="">
                            <HtmlTooltip title="Open Chart In Full Screen">
                                <IconButton color="primary" style={{ marginLeft: 'auto', display: 'flex' }} onClick={() => setOpenFullScreen(true)}>
                                    <FiMaximize2 fontSize="16px" />
                                </IconButton>
                            </HtmlTooltip>
                        </div>
                    )}
                </Box>
                <Box height={openFullScreen ? window.innerHeight - 200 : isScreenSmall ? 350 : 500}
                    className="max-w-full overflow-x-auto px-[10px]">
                    <ChartComponent
                        id={id}
                        type={'line'}
                        data={data}
                        options={{
                            maintainAspectRatio: false,
                            animation: false,
                            fill: false,
                        }}
                    />
                </Box>
            </ContentFullScreen>
        </Box >

    )
}