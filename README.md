# 🛡️ SecureGuard - Phishing Awareness & Security Platform

**SecureGuard** is a next-generation Phishing Awareness Simulation and Gamified Learning tool designed to train individuals and organizations against cyber threats. It combines realistic phishing simulations with interactive challenges, all wrapped in a stunning, modern **Glassmorphism UI** that supports both Light and Dark themes.

---

## ✨ Key Features

### 🚀 **Core Functionality**
- **Admin Dashboard:** Comprehensive overview of total users, active campaigns, click rates, and template statistics with interactive charts.
- **Campaign Management:** Create, schedule, and launch phishing simulations to test organizational readiness.
- **Email Template System:** Design and manage realistic email templates (Phishing, Spear Phishing) for simulutions.
- **User Management:** Admin tools to add, edit, and manage user groups and statuses.

### 🎮 **Gamified Learning**
- **Interactive Challenges:** Engage with Weekly `Active`, `Next`, `Past` sprints and Monthly Operations.
- **XP & Leveling System:** Earn XP by completing tasks, level up, and unlock achievements.
- **Leaderboard:** Compete with peers for the top rank based on security knowledge.
- **Badges:** Unlock visual badges for milestones (e.g., "Level 5 Guardian", "XP Millionaire").

### 🛠️ **Security Tools**
- **URL Scanner:** Analyze suspicious links for potential threats.
- **Breach Search:** Check if emails have been compromised in data leaks.
- **Dark Web Monitor:** Search for exposed personal data on the dark web.
- **Phone Validator:** Verify phone numbers and check for spam/scam indicators.
- **File Scanner:** Analyze file hashes for malware.

### 🎨 **UI/UX Excellence**
- **Modern Glassmorphism:** A premium aesthetic using backdrop filters, gradients, and animated cards.
- **Dual Theme Support:** Fully functional **Light** and **Dark** modes with a persistent toggle.
- **Responsive Design:** Optimized for desktops, tablets, and mobile devices.
- **Tailwind CSS Integration:** Utilizing utility-first CSS for robust styling.

---

## 🛠️ Technology Stack

- **Backend:** Node.js, Express.js
- **Frontend:** EJS (Embedded JavaScript Templating), Vanilla CSS, Tailwind CSS
- **Data Visualization:** Chart.js
- **Authentication:** Passport.js, Bcryptjs, Express-Session
- **Dependencies:** `dotenv`, `nodemailer`, `pg`, `sequelize`

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository_url>
   cd cosmohack1-final
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory based on `.env.example`:
   ```bash
   PORT=3000
   SESSION_SECRET=your_secret_key
   IPQS_API_KEY=your_ipqualityscore_api_key  # Optional: For Security Tools
   ```

4. **Run the Application**
   
   For development (with auto-reload):
   ```bash
   npm run dev
   ```
   
   For production:
   ```bash
   npm start
   ```

5. **Access the App**
   Open your browser and navigate to:
   > `http://localhost:3000`

---

## 📂 Project Structure

```
├── app.js                  # Main application entry point
├── models/                 # Data handling (Mock & Database models)
├── public/
│   ├── css/                # Stylesheets (style.css, enhanced.css)
│   └── js/                 # Client-side scripts
├── views/                  # EJS Templates
│   ├── partials/           # Reusable components (header, footer, sidebar)
│   ├── landing_page.ejs    # Public Landing Page
│   ├── dashboard.ejs       # Admin Dashboard
│   ├── gamified_learning.ejs # Gamification Hub
│   ├── campaign.ejs        # Campaign Management
│   └── ...                 # Other tool and feature pages
├── package.json            # Project dependencies
└── README.md               # Documentation
```

---

## 🔐 Default Credentials
*(For testing purposes)*

- **Username:** `admin`
- **Password:** `password`

---

## 🤝 Contribution
Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.

---

<p align="center">
  Built with ❤️ by the SecureGuard Team
</p>
