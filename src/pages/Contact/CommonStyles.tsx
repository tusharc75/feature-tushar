export function commonStyle(theme) {
    const styleProps = {
        root: {
            minHeight: "100%!important",
            marginTop: 0
        },
        box: {
            backgroundColor: "#fff",
            borderRadius: 6,
            padding: theme.spacing(0.5, 1.5),
            // padding: "20px 200px"    //  Duplicate entry
        }
    }
    return styleProps
}