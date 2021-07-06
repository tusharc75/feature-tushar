const SentryWebpackPlugin = require("@sentry/webpack-plugin");

module.exports = {
    // other configuration
    configureWebpack: {
        plugins: [
            new SentryWebpackPlugin({
                // sentry-cli configuration
                authToken: process.env.REACT_APP_SENTRY_AUTH_TOKEN,
                org: "vebholic-pvt-ltd",
                project: "om",
                release: process.env.REACT_APP_RELEASE,
                // webpack specific configuration
                include: ".",
                ignore: ["node_modules", "webpack.config.js"],
            }),
        ],
    },
};