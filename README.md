## munro-outdoor-retail backend

This project is the Backend for my fictional Retail business.<br />
Please find the Frontend in my other repo - [munro-outdoor-retail](https://github.com/nigeld-code/munro-outdoor-retail).

Enjoy!

This project is built with NodeJS and Express

Currently only locally hosted on http://localhost:8080

### 'npm run dev'

Runs the app. You will need to set up a .env file with the following:<br />
- SITE_URL - for your local network 192.168... (for Frontend connection).
- DB_API_KEY - for a MongoDB API key. Only a dummy site so one API key with admin auth is fine.
- AWS_ACCESS_KEY - for AWS SES emails.
- AWS_SECRET_ACCESS_KEY - for AWS again.
- ADMIN_PASSWORD - for admin portal.
- ADMIN_SESSION_SECRET - for sessions.

This app operates as the REST API for the Frontend Munro Website, but also hosts admin control for the site (for adding products/images etc.) available at http://localhost:8080
