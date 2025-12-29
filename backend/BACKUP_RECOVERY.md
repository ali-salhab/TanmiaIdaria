# Database Backup & Recovery (Admin)

This project includes an admin-only backup/restore feature built on MongoDB Database Tools.

## Requirements

- MongoDB is used (via Mongoose).
- MongoDB Database Tools installed on the **backend server**:
  - `mongodump`
  - `mongorestore`

Make sure `mongodump` and `mongorestore` are available in `PATH`.

### Windows (common fix)

If you get `spawn mongodump ENOENT`, Windows can't find the tools.

Option A (recommended): add MongoDB Database Tools `bin` folder to PATH.

Option B: set an explicit env var in `backend/.env`:

```env
MONGODB_TOOLS_PATH=C:\\Program Files\\MongoDB\\Tools\\100\\bin
```

You can also use the API to check tool discovery:

- `GET /api/db-recovery/tools`

## Environment

Backend `.env` must include one of:

- `MONGO_URI=...`
- `MONGODB_URI=...`

## Storage

Backups are stored on the backend server at:

- `backend/backups/*.zip`

## API (Admin)

All endpoints require:

- Auth (`protect`)
- Permission `settings.backup`

### List backups

- `GET /api/db-recovery`

### Create backup

- `POST /api/db-recovery/create`

Creates `mongodump` output, zips it, and stores the zip file.

### Download backup

- `GET /api/db-recovery/download/:name`

### Restore

- `POST /api/db-recovery/restore`

Body:

```json
{ "name": "mybackup.zip", "drop": true }
```

- `drop=true` will wipe existing collections before restoring.

## Frontend

Admin page:

- `/dashboard/db-recovery`

Permission required:

- `settings.backup`
