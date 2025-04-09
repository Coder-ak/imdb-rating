# IMDB Rating API

A TypeScript-based API service that provides IMDb ratings through a simple endpoint.

## Features

- IMDb rating lookup via API
- Automatic daily data updates via cron job
- Rate limiting for API protection
- SQLite database for data storage
- TypeScript for type safety

## Installation

```bash
# Clone the repository (if using Git)
git clone <repository-url>
cd imdb-rating

# Install dependencies
npm install

# Build the project
npm run build
```

## Configuration

Create a `.env` file in the root directory with the following content:

```
PORT=3000
RATINGS_URL=
```

## Usage

### Starting the Server

```bash
# Development mode
npm run dev

# Production mode
npm start

# Or using PM2
pm2 start ecosystem.config.js
```

### API Endpoints

- **Get Rating by IMDb ID**: `GET /api/v1/rating/:id`
  - Example: `GET /api/v1/rating/tt0111161`
  - Response: `{"id":"tt0111161","rating":9.3,"votes":2345678}`

### Manual Data Import

To manually trigger the IMDb data import:

```bash
npm run import
```

## Deployment

1. Ensure PM2 is installed globally: `npm install -g pm2`
2. Deploy to production: `pm2 start ecosystem.config.js`
3. Save PM2 process list: `pm2 save`
4. Set up PM2 to start on system boot: `pm2 startup`

## License

[ISC](LICENSE)
