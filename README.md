# Backend Core

> A robust platform that aggregates NGO and community help data from web scraping and user inputs, processes it intelligently, and provides structured opportunities for volunteers.

## 🚀 Key Capabilities

- **Web Data Ingestion**: Automated background extraction of real-world opportunities parsing Web APIs.
- **User-Submitted Reports**: Direct submission forms for crowdsourcing emergent aid requirements.
- **Intelligent Deduplication**: Smart matching heuristics to merge similar scraped and submitted reports.

- **Dashboard Analytics**: Top-level statistic tracking for data aggregation.
- **OTP Authentication**: Secure, spreadsheet-backed (Google Apps Script) passwordless OTP verification flows.
- **Recommendations & Leaderboard**: Automated tagging and matching engine that pairs users with the best opportunities and ranks power-users based on engagement.

---

## 🛠 Tech Stack

**Backend System**
- **Node.js**: Asynchronous event-driven JavaScript runtime.
- **Express.js**: Fast, minimalist web framework structure.
- **MongoDB + Mongoose**: NoSQL database for rapid JSON document structuring and schema design.

**Ecosystem Utilities**
- **JWT**: Stateless, encrypted authentication tokens.
- **Bcrypt**: Robust cryptographic password hashing.
- **node-cron**: Scheduled expiration and data curation chron jobs.
- **SerpAPI**: Lightweight Google Search integration.
- **Google Apps Script**: External, low-friction microservice for triggering OTP interactions.

---

## 📂 Folder Structure

```text
├── config/        # Database connectivity and environment initialization
├── controllers/   # Request handling, validation coordination, and HTTP formatting
├── middleware/    # Pre-flight interceptors (JWT Auth verification boundaries)
├── models/        # Mongoose Database schemas (Opportunity, Submission, User, etc.)
├── routes/        # API endpoint definitions and router mapping
├── services/      # Core business logic, deduplication math, classification
├── utils/         # Lightweight stateless helpers (AI classifier, location regex parser)
├── index.js       # Express Server entry-point
└── test.html      # Developer Sandbox environment to query endpoints locally
```

---

## ⚙️ Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/CfRadar/SmartAid_Backend.git
cd SmartAid_Backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environments
Create a new `.env` file in the root directory mirroring the `.env.example`:
```env
PORT=3000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret
SERP_API_KEY=your_key
URL=your_google_script_url
```

### 4. Start the Server
```bash
# Recommended for local development (hot-reloading enabled)
npm run dev

# Or for production parity
node index.js
```

---

## 🔌 API Documentation

All routes assume the base path: `/api`

### 🛡 Authentication

**`POST /api/auth/signup`**
- **Description**: Creates a localized shadow-user and broadcasts a secure OTP event.
- **Request Body**:
  ```json
  { 
    "email": "user@example.com", 
    "password": "secure123" 
  }
  ```
- **Sample Response**:
  ```json
  {
    "message": "OTP sent"
  }
  ```

**`POST /api/auth/verify-otp`**
- **Description**: Validates OTP and populates the first-time demographic profile, returning a token.
- **Request Body**: 
  ```json
  { 
    "email": "user@example.com", 
    "otp": "123456", 
    "skills": ["first aid"], 
    "interests": ["medical"], 
    "availability": "weekends", 
    "location": "New York" 
  }
  ```
- **Sample Response**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "_id": "60d5ecb8b392...",
      "email": "user@example.com",
      "isVerified": true,
      "skills": ["first aid"],
      "interests": ["medical"]
    }
  }
  ```

**`POST /api/auth/login`**
- **Description**: Standard authentication for returning verified users.
- **Request Body**: 
  ```json
  { 
    "email": "user@example.com", 
    "password": "secure123" 
  }
  ```
- **Sample Response**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsIn..."
  }
  ```

### 👤 Profile

**`GET /api/profile`**
- **Description**: Retrieves your authenticated metadata and calculated contribution stats.
- **Headers**: `Authorization: Bearer <your_jwt_token>`
- **Sample Response**:
  ```json
  {
    "_id": "60d5ecb8b392...",
    "email": "user@example.com",
    "skills": ["first aid"],
    "rankingScore": 12,
    "stats": {
      "peopleHelped": 2,
      "hoursContributed": 1,
      "tasksCompleted": 0
    }
  }
  ```

**`PUT /api/profile`**
- **Description**: Destructive update to mutate user characteristics.
- **Headers**: `Authorization: Bearer <your_jwt_token>`
- **Request Body**: 
  ```json
  { 
    "skills": ["logistics"], 
    "interests": ["disaster response"], 
    "availability": "weekdays", 
    "location": "Boston, MA" 
  }
  ```
- **Sample Response**:
  ```json
  {
    "_id": "60d5ecb...",
    "skills": ["logistics"],
    "interests": ["disaster response"]
  }
  ```

### 📄 Reports (User Submissions)

**`POST /api/report`**
- **Description**: Submits an externally observed crisis or required aid. Allows strict submissions or 'drafts'.
- **Request Body**: 
  ```json
  { 
    "title": "Need Blankets", 
    "description": "50 families require blankets due to snow", 
    "category": "disaster", 
    "urgency": "high", 
    "peopleAffected": 50, 
    "location": { "address": "Denver, CO" }, 
    "status": "submitted" 
  }
  ```
- **Sample Response**:
  ```json
  {
    "isDraft": false,
    "submission": { "processingStatus": "processed", "rawData": {...} },
    "opportunity": {
      "_id": "64bc1...",
      "title": "Need Blankets",
      "category": "disaster",
      "location": { "address": "Denver, CO", "type": "Point" },
      "status": "open"
    }
  }
  ```

### 🎯 Opportunities

**`GET /api/opportunities`**
- **Description**: Fetch and filter finalized/cleansed opportunities from both user-input and the web.
- **Query Params**: `?category=medical&urgency=high&location=Denver`
- **Sample Response**:
  ```json
  [
    {
      "title": "Local Clinic Volunteer",
      "category": "medical",
      "urgency": "high",
      "location": { "address": "Denver, CO" }
    }
  ]
  ```

**`GET /api/opportunities/nearby`**
- **Description**: Find geographically adjacent opportunities using MongoDB 2dsphere spatial querying.
- **Query Params**: `?lat=40.7128&lng=-74.0060&radius=15` (radius in km)
- **Sample Response**:
  ```json
  [
    {
      "title": "Food Drive - Downtown",
      "location": { "type": "Point", "coordinates": [-74.0060, 40.7128] }
    }
  ]
  ```

### 📥 Raw Submissions

**`GET /api/submissions`**
- **Description**: Returns all unparsed data payloads before they are formatted into Opportunities.
- **Sample Response**:
  ```json
  [
    {
      "_id": "abc1234",
      "type": "web",
      "processingStatus": "processed"
    }
  ]
  ```

**`POST /api/submissions`**
- **Description**: A lower-level route for manually inserting a raw unstructured object.

**`POST /api/submissions/:id/process`**
- **Description**: Manually forces the worker routine to execute parsing logic against a specific raw submission ID.

### 🩺 System Health

**`GET /api/health`**
- **Description**: Basic ping verifying the API is active and ready.
- **Sample Response**:
  ```json
  {
    "success": true,
    "message": "Volunteer platform API is healthy"
  }
  ```

### ⭐ Recommendations

**`GET /api/recommendations`**
- **Description**: Sorts open opportunities against your JWT profile's `skills` & `interests`, returning the top 5 highest-affinity tasks cleanly.
- **Headers**: `Authorization: Bearer <your_jwt_token>`
- **Sample Response**:
  ```json
  [
    {
      "title": "Emergency Dispatch Coordination",
      "category": "logistics",
      "urgency": "high"
    }
  ]
  ```

### 🏆 Leaderboard

**`GET /api/leaderboard`**
- **Description**: Yields the Top 10 system contributors weighted dynamically `(peopleHelped * 5) + (tasks * 3) + (hours * 2)`.
- **Sample Response**:
  ```json
  [
    {
      "email": "hero@community.org",
      "rankingScore": 150,
      "stats": { "peopleHelped": 20, "hoursContributed": 10, "tasksCompleted": 10 }
    }
  ]
  ```

### 🌐 Ingestion (Web Searches)

**`GET /api/ingest`**
- **Description**: Manually kicks off the async web-scraping queue. 
  - *Functionality*: It leverages **SerpAPI** to run complex, headless Google Searches for volunteering, emergency response, and community aid opportunities.
  - *Processing*: The returned unstructured HTML/JS results are fed natively into our `aiClassifier.js` to intelligently detect categories (food, medical, disaster) and mapped into `locationParser.js` to extract distinct location coordinates via regex strings.
  - *Persistence*: Finally, it filters out low-quality unstructured junk and generates perfectly uniform `<Opportunity>` documents.
- **Sample Response**:
  ```json
  {
    "totalFetched": 30,
    "submissionsProcessed": 30,
    "created": 12,
    "updated": 5,
    "skipped": 13,
    "failed": 0
  }
  ```

---

## 🔄 Data Architecture Explained

Our data pipeline operates on two distinct streams converging into a unified `Opportunity` target:

1. **Web Scraper** → JSON Payload → Extractor Parsing → Validation → `Opportunity`
2. **User Standard Form** → JSON Payload → Extraction/Normalization → Validation → `Opportunity`

✨ **Intelligent Deduplication**: When data hits the pipeline, we calculate Levenshtein Distance algorithms across titles, addresses, and generate SHA-256 hashes. If an incoming payload matches an existing entry close enough, we run an **Update** replacing only empty fields, rather than a duplicate **Creation**.

---

## 🔑 Authentication Workflow Flowchart

The system applies a hard-line gate strategy initially:
1. User provides email/password (**Signup**).
2. System broadcasts secure **OTP**.
3. User supplies the OTP + Demographics (**Verify** + Profile Setup).
4. System sets `isVerified = true` and yields **JWT**.
5. Subsequent access follows traditional Email/Pass → **Login**.

---

## ⏱ Data Life-Cycle (Cron Mechanics)

Scraped web data can age rapidly.
- We utilize `node-cron` workers hitting on periodic cycles to scrub opportunities older than `~48 hours`.
- If an opportunity hits expiration, it is intelligently archived without disrupting analytics statistics globally.

---

## 💻 Frontend Developer Guide

It is incredibly easy to interface with the core app. Just ensure that operations marked protected append the standard HTTP Authorization header.

> [!WARNING]
> Background ingestions utilizing the SerpAPI run automatically every **30 minutes** via `node-cron`. Ensure frontend components do not repeatedly trigger `GET /api/ingest`, as it will rapidly deplete your external SerpAPI quota. You should almost exclusively rely on querying `GET /api/opportunities` for active items instead.

**Using Fetch API:**
```javascript
fetch("http://localhost:3000/api/profile", {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer <YOUR_JWT_HERE>"
  }
})
.then(res => res.json())
.then(data => console.log(data));
```

---

## 🧪 Real-Time Environment Sandbox

Don't want to spin up Postman? We included `test.html` strictly for frontend testing.
1. Run the Node server via `npm run dev`.
2. Open `http://localhost:3000/test.html` in your browser.
3. Every button triggers an endpoint natively. Sign up, generate an OTP from your browser's inspect window (or Google Apps output), log in, modify your profile, and test recommendations—all visually.

---

## 📈 Future Scalability Pipeline

We have isolated four core paths for immediate V2 scaling:
- **ML Category Classification:** Upgrading the static text-parser heuristic to a tuned native Machine Learning classification pipeline.
- **Native Geolocation Boundaries:** Upgrading Mongoose Points to rigorous PostGIS intersections.
- **Third Party Integrations:** Phasing out the Google Apps script in favor of direct robust communication buses like SendGrid/Twilio.
- **WebSocket Feeds:** Streaming active opportunities instantly without polling.
