# Guardian Angel

Guardian Angel is a web application designed to enhance safety by connecting women who seek companionship during activities such as walking or road trips. The application allows users to create requests for company, which can be accepted by other women nearby. The goal is to foster a supportive community and improve safety during travel.

## Hosted at

https://guardian-angel-za-1344c29eb6b7.herokuapp.com/

## Features

- User registration and authentication
- Create and manage requests for companionship
- View and accept requests from other users
- User profiles with the ability to upload images
- Comments and likes on user profiles
- Analytics for tracking user activities and requests
- Integrated Google Maps API for distance calculations

## Tech Stack

- **Frontend**: React, Tailwind CSS, Axios
- **Backend**: Node.js, Express, MySQL (using JawsDB on Heroku)
- **Authentication**: JWT (JSON Web Tokens)
- **File Uploads**: Multer for handling multipart/form-data
- **Data Management**: MySQL for storing user data and requests

## Getting Started

### Prerequisites

- Node.js installed on your machine
- MySQL or JawsDB for database management
- A Heroku account for deployment

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/guardian-angel.git
   ```

2. Navigate to the project directory:

   ```bash
   cd guardian-angel
   ```

3. Install dependencies for the backend:

   ```bash
   cd backend
   npm install
   ```

4. Install dependencies for the frontend:

   ```bash
   cd ../frontend
   npm install
   ```

### Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```
DATABASE_URL=your_database_url_here
JWT_SECRET=your_jwt_secret_here
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### Running the Application

1. Start the backend server:

   ```bash
   cd backend
   node index.js
   ```

2. Start the frontend application:

   ```bash
   cd ../frontend
   npm start
   ```

## Database Management
The application uses JawsDB for database management. You can manage your database using HeidiSQL for easy access and manipulation of your data.

### Step 1: Create a JawsDB Database

1. **Sign Up / Log In**: Go to the [Heroku website](https://www.heroku.com/) and log in or create an account if you don't have one.
  
2. **Create a New App**:
   - Click on "Create New App".
   - Choose a name for your app and select a region.

3. **Add JawsDB Add-on**:
   - Navigate to the "Resources" tab in your new app dashboard.
   - In the "Add-ons" search bar, type `JawsDB` and select it from the dropdown.
   - Click on the "Provision" button to add JawsDB to your app.

4. **Access Database Credentials**:
   - After provisioning, navigate to the "Settings" tab of your app.
   - Click on "Reveal Config Vars".
   - Find the `JAWSDB_URL` variable; this contains the connection string for your JawsDB database.

### Step 2: Configure HeidiSQL

1. **Download and Install HeidiSQL**:
   - Go to the [HeidiSQL website](https://www.heidisql.com/) and download the latest version of the software.
   - Install it on your computer.

2. **Create a New Session**:
   - Open HeidiSQL.
   - Click on the "New Session" button.

3. **Enter Connection Details**:
   - **Network Type**: Choose "MySQL (TCP/IP)".
   - **Hostname / IP**: Extract this from your `JAWSDB_URL`. It will look like `yourhostname`.
   - **User**: Extract the username from `JAWSDB_URL`.
   - **Password**: Extract the password from `JAWSDB_URL`.
   - **Database**: The name of your database is also included in the `JAWSDB_URL` (it appears after the last slash `/`).

4. **Test the Connection**:
   - Click the "Load User Privileges" button to ensure your credentials are correct.
   - If successful, you should see your database listed in the "Database" dropdown.

5. **Connect**:
   - Click "Connect" to establish the connection to your JawsDB database.

### Step 3: Manage Your Database

1. **Create Tables and Structure**:
   - After connecting, you can create tables, define schemas, and manage your database through HeidiSQL's interface.

2. **Execute SQL Queries**:
   - Use the query editor to execute SQL commands, such as creating tables or inserting data.

3. **Backup and Export**:
   - You can export your database structure and data for backup purposes using HeidiSQL's export functionality.
  
   - 
## Project Structure
```
guardian-angel-app/
├── guardian-angel-frontend/
│   ├── assets/
│   ├── build/
│   ├── node_modules/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CreateRequest.css
│   │   │   ├── CreateRequest.js
│   │   │   ├── Home.css
│   │   │   ├── Home.js
│   │   │   ├── Login.css
│   │   │   ├── Login.js
│   │   │   ├── Navbar.css
│   │   │   ├── Navbar.js
│   │   │   ├── Profile.css
│   │   │   ├── Profile.js
│   │   │   ├── ProfilePage.css
│   │   │   ├── ProfilePage.js
│   │   │   ├── Register.css
│   │   │   ├── Register.js
│   │   │   ├── ViewRequests.css
│   │   │   ├── ViewRequests.js
│   │   ├── App.css
│   │   ├── App.js
│   │   ├── App.test.js
│   │   ├── index.css
│   │   ├── index.js
│   │   ├── logo.svg
│   │   ├── reportWebVitals.js
│   │   ├── setupTests.js
│   │   ├── .gitignore
│   │   ├── package-lock.json
│   │   ├── package.json
│   │   └── Procfile
├── guardian-angel-backend/
│   ├── node_modules/
│   ├── uploads/
│   ├── .env
│   ├── package-lock.json
│   ├── package.json
│   ├── Procfile
│   └── server.js
└── assets/
    ├── Demo Video.mp4
    ├── 231001_Michaela_Kemp_DV200_Open-Brief-Propoaal.pdf
    └── Michaela-Kemp_231001_DV200_Progress-Milestone-Check.pdf
```

## Pages
**Frontend (React):**
- **Login (Login.js, Login.css):** User authentication page.
- **Register (Register.js, Register.css):** User registration page.
- **Home (Home.js, Home.css):** Main landing page after login.
- **Create Request (CreateRequest.js, CreateRequest.css):** Page for creating new requests.
- **Profile (Profile.js, Profile.css):** User profile page for viewing and editing user details.
- **Profile Page (ProfilePage.js, ProfilePage.css):** A detailed view of the user's profile.
- **View Requests (ViewRequests.js, ViewRequests.css):** Page for viewing all requests made by the user.

## Demo Video
![Demo Video](assets/DemoVideo.mp4)

## Usage

- **Register a User**: Create a new account by providing your name, surname, email, and password.
- **Login**: Use your credentials to log into the application.
- **Create a Request**: After logging in, you can create requests for companionship.
- **View Requests**: Browse open requests from other users and accept them.
- **Profile Management**: Update your profile and upload a profile image.

## CORS Setup

For proper CORS configuration, the backend uses the `http-proxy-middleware` package to proxy API requests from the frontend to the backend, mitigating CORS issues. The frontend can make requests to `/api/...`, which will be forwarded to the backend server.

### Deployment

Deploy the backend on Heroku and the frontend on a hosting platform of your choice. Ensure that environment variables are configured correctly on the hosting platform.
