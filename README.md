# Bajaj Finserv Health Dev Challenge - Qualifying Round

A full-stack web application designed and built for the Bajaj Finserv Health Qualifying Round. The application consists of a robust Express-based backend API and a beautiful, interactive React frontend built with Vite.

## 🚀 Live Demo & Repository
- **GitHub Repository**: [https://github.com/Himanshu0523/Bajaj_Test.git](https://github.com/Himanshu0523/Bajaj_Test.git)
- **Roll Number (Title)**: `0827AL231056`

---

## 🛠 Tech Stack

### Backend
- **Node.js** with **Express.js** (ES Modules)
- **CORS** middleware enabled for seamless frontend-backend communication
- **Dotenv** for secure environment configuration
- **Nodemon** for smooth local development auto-reloads

### Frontend
- **React 18** with **Vite**
- **Axios** for API requests
- **React Select** for premium multi-select filtering dropdowns
- Responsive & beautifully styled with premium Vanilla CSS custom design system (dark modes, micro-animations, glassmorphism)

---

## 🔌 API Endpoints (Backend)

### 1. `GET /bfhl`
Returns a hardcoded operation code.
- **Response**:
  ```json
  {
    "operation_code": 1
  }
  ```

### 2. `POST /bfhl`
Processes an array of alphanumeric inputs and an optional Base64 file. Separates numbers, alphabets, finds the highest lowercase alphabet, checks for prime numbers, and processes file metadata.
- **Request Body**:
  ```json
  {
    "data": ["A", "1", "3", "z", "b"],
    "file_b64": "data:image/png;base64,iVBORw0KGgoAAA..."
  }
  ```
- **Response Body**:
  ```json
  {
    "is_success": true,
    "user_id": "himanshu_satpute_0827AL231056",
    "email": "himanshusatpute231233@acropolis.in",
    "roll_number": "0827AL231056",
    "numbers": ["1", "3"],
    "alphabets": ["A", "z", "b"],
    "highest_lowercase_alphabet": ["z"],
    "is_prime_found": true,
    "file_valid": true,
    "file_mime_type": "image/png",
    "file_size_kb": 24.5
  }
  ```

---

## 💻 Local Setup and Running Instructions

### 1. Clone the repository
```bash
git clone https://github.com/Himanshu0523/Bajaj_Test.git
cd Bajaj_Test
```

### 2. Run the Backend
```bash
cd backend
npm install
npm run dev
```
The backend server will start on [http://localhost:3000](http://localhost:3000).

### 3. Run the Frontend
```bash
cd ../frontend
npm install
npm run dev
```
The frontend application will start on [http://localhost:5173](http://localhost:5173).

---

## 🎨 Features
- **Strict JSON Validator**: Validates the entered text dynamically before calling the endpoint.
- **Base64 File Processing**: Automatically handles base64 image or document inputs, validating MIME types and calculating size.
- **Multi-Select Filter**: Premium dropdown filter allowing real-time selection of response sections (Numbers, Alphabets, Highest lowercase alphabet).
- **Responsive Layout**: Adapts perfectly to mobile, tablet, and desktop screens.
