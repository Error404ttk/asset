module.exports = {
    apps: [
        {
            name: "asset-backend",
            script: "./server/server.js",
            env: {
                NODE_ENV: "production",
                PORT: 3008
            },
            watch: false
        },
        {
            name: "asset-frontend",
            script: "serve",
            env: {
                PM2_SERVE_PATH: './dist',
                PM2_SERVE_PORT: 3000,
                PM2_SERVE_SPA: 'true',
                PM2_SERVE_HOMEPAGE: '/index.html'
            }
        }
    ]
};
