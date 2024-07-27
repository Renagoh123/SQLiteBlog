## Installation Requirements
- **NodeJS**: [Install NodeJS](https://nodejs.org/en/)
- **SQLite3**: [Install SQLite3](https://www.tutorialspoint.com/sqlite/sqlite_installation.htm)

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   npm install moment
   npm install bootstrap
   ```

2. **Build Database**:
   - Mac/Linux: `npm run build-db`
   - Windows: `npm run build-db-win`

3. **Start the App**:
   ```bash
   npm run start
   ```
   Access the app at [http://localhost:3000](http://localhost:3000)

4. **Test Routes**:
   - [http://localhost:3000](http://localhost:3000)
   - [http://localhost:3000/users/list-users](http://localhost:3000/users/list-users)
   - [http://localhost:3000/users/add-user](http://localhost:3000/users/add-user)

5. **Clean Database**:
   - Mac/Linux: `npm run clean-db`
   - Windows: `npm run clean-db-win`

6. **Build Database**:
   - Mac/Linux: `npm run build-db`
   - Windows: `npm run build-db-win`

## Database Schema
- Modify `db_schema.sql` to create all database tables.
- Ensure the database can be recreated using `npm run build-db`.

