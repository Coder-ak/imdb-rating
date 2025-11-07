module.exports = {
  apps: [
    {
      name: "imdb-rating",
      script: "./dist/index.js",
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
