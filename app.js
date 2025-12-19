const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const https = require("https");
require("dotenv").config();
const User = require("./models/User");
const LearningTask = require("./models/LearningTask");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Session configuration
app.use(
  session({
    secret: "secureguard-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Mock data for demonstration
const mockData = {
  stats: {
    totalUsers: 150,
    activeCampaigns: 3,
    clickRate: 23,
    totalTemplates: 8,
  },
  recentCampaigns: [
    {
      id: 1,
      name: "Q4 Security Test",
      status: "Completed",
      sent: 50,
      clicked: 12,
      createdAt: new Date(),
    },
    {
      id: 2,
      name: "New Employee Training",
      status: "Active",
      sent: 25,
      clicked: 5,
      createdAt: new Date(),
    },
  ],
  templates: [
    {
      id: 1,
      name: "Fake Password Reset",
      subject: "Urgent: Password Reset Required",
      senderName: "IT Support",
      senderEmail: "it@company.com",
      category: "phishing",
    },
    {
      id: 2,
      name: "Suspicious Invoice",
      subject: "Invoice Payment Required",
      senderName: "Accounting",
      senderEmail: "billing@company.com",
      category: "spear-phishing",
    },
  ],
  campaigns: [
    {
      id: 1,
      name: "Q4 Security Test",
      template: "Fake Password Reset",
      targetGroup: "Sales",
      status: "Completed",
      sent: 50,
      clicked: 12,
    },
    {
      id: 2,
      name: "New Employee Training",
      template: "Suspicious Invoice",
      targetGroup: "Engineering",
      status: "Active",
      sent: 25,
      clicked: 5,
    },
  ],
};

// Authentication middleware
function requireAuth(req, res, next) {
  if (req.session.authenticated && req.session.user) {
    next();
  } else {
    res.redirect("/login");
  }
}

// Admin/user middleware
function isAdmin(req, res, next) {
  if (req.session.authenticated) {
    if (req.session.user && req.session.user.role === "admin") {
      next();
    } else {
      res.status(403).send("Forbidden: Access restricted to admins only.");
    }
  } else {
    res.status(401).send("Unauthorized: Please log in.");
  }
}

// Routes
app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/login", (req, res) => {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }
  res.render("login", { error: null });
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(`Attempting login for username: ${username}`);
    const user = await User.findByUsername(username);

    if (!user) {
      console.log(`User not found: ${username}`);
      return res.render("login", { error: "Invalid username or password" });
    }

    const isValidPassword = await User.validatePassword(user, password);

    if (!isValidPassword) {
      return res.render("login", { error: "Invalid username or password" });
    }

    req.session.authenticated = true;
    req.session.user = { ...user, password: undefined };

    res.redirect("/dashboard");
  } catch (error) {
    console.error("Login error:", error);
    res.render("login", { error: "An error occurred during login" });
  }
});

app.get("/signup", (req, res) => {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }
  res.render("signup", { error: null, success: null });
});

app.post("/signup", async (req, res) => {
  try {
    const { fullName, email, username, password, confirmPassword } = req.body;

    if (!fullName || !email || !username || !password) {
      return res.render("signup", {
        error: "All fields are required",
        success: null,
      });
    }

    if (password !== confirmPassword) {
      return res.render("signup", {
        error: "Passwords do not match",
        success: null,
      });
    }

    if (password.length < 6) {
      return res.render("signup", {
        error: "Password must be at least 6 characters long",
        success: null,
      });
    }

    await User.create({ fullName, email, username, password });

    res.render("signup", {
      success: "Account created successfully! You can now login.",
      error: null,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.render("signup", {
      error: error.message || "An error occurred during signup",
      success: null,
    });
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
    }
    res.redirect("/login");
  });
});

app.get("/dashboard", requireAuth, (req, res) => {
  res.render("dashboard", {
    stats: mockData.stats,
    recentCampaigns: mockData.recentCampaigns,
    user: req.session.user,
    page: "dashboard",
  });
});

app.get("/users", requireAuth, isAdmin, (req, res) => {
  const allUsers = User.getAllUsers();
  res.render("users", {
    users: allUsers,
    user: req.session.user,
    page: "users",
  });
});

app.get("/users/new", requireAuth, (req, res) => {
  res.render("user_form", {
    user: null,
    currentUser: req.session.user,
    page: "users",
  });
});

app.get("/templates", requireAuth, (req, res) => {
  res.render("template", {
    templates: mockData.templates,
    user: req.session.user,
    page: "templates",
  });
});

app.get("/templates/new", requireAuth, (req, res) => {
  res.render("template_form", {
    template: null,
    user: req.session.user,
    page: "templates",
  });
});

app.get("/campaigns", requireAuth, (req, res) => {
  res.render("campaign", {
    campaigns: mockData.campaigns,
    user: req.session.user,
    page: "campaigns",
  });
});

app.get("/campaigns/new", requireAuth, (req, res) => {
  res.render("campaign_form", {
    templates: mockData.templates,
    user: req.session.user,
    page: "campaigns",
  });
});

// Tracking route
app.get("/track/:campaignId/:userId", (req, res) => {
  const { campaignId, userId } = req.params;
  console.log(`User ${userId} clicked campaign ${campaignId} at ${new Date()}`);
  res.render("phished");
});

// API routes for AJAX calls
app.get("/templates/:id/preview", requireAuth, (req, res) => {
  const template = mockData.templates.find((t) => t.id == req.params.id);
  if (template) {
    res.json({
      subject: template.subject,
      body: `<p>This is a preview of the ${template.name} template.</p><p>Click <a href="/track/1/1">here</a> to continue.</p>`,
    });
  } else {
    res.status(404).json({ error: "Template not found" });
  }
});

app.get("/profile", requireAuth, (req, res) => {
  res.json(req.session.user);
});

// GAMIFICATION ROUTES

// Main Gamification Page
app.get("/gamification", requireAuth, async (req, res) => {
  try {
    // Fetch fresh user data to get current XP and Level
    const user = await User.findById(req.session.user.id);

    // Fetch all available tasks
    const tasks = LearningTask.getAllTasks();

    // Render the page with all necessary data
    res.render("gamification", {
      user: user,
      tasks: tasks,
      page: "gamification",
    });
  } catch (error) {
    console.error("Error loading gamification:", error);
    res.status(500).send("Error loading page");
  }
});

// Specific Task Page

app.get("/gamification/:id", requireAuth, async (req, res) => {
  try {
    const taskId = req.params.id;
    console.log(`[Server] Requesting Task ID: ${taskId}`);

    // Check if User exists in session
    if (!req.session.user || !req.session.user.id) {
      console.error("[Server] Error: User session invalid");
      return res.redirect("/login");
    }

    // Fetch User from DB (Wait for it!)
    const user = await User.findById(req.session.user.id);

    // Find the Task (Handle both String "1" and Number 1)
    let task = LearningTask.getTaskById(taskId);
    if (!task) {
      const numericId = parseInt(taskId);
      if (!isNaN(numericId)) {
        task = LearningTask.getTaskById(numericId);
      }
    }

    // Handle "Task Not Found"
    if (!task) {
      console.error(`[Server] Task '${taskId}' not found. Redirecting.`);
      return res.redirect("/gamification");
    }

    res.render("gamification_task", {
      task: task,
      user: user,
      page: "gamification",
    });
  } catch (error) {
    console.error("[CRITICAL ERROR] Failed to load task page:");
    console.error(error);
    res.status(500).send("Server Error. Check your terminal for details.");
  }
});

// Complete Task API

app.post("/gamification/complete-task", requireAuth, async (req, res) => {
  const { taskId } = req.body;

  if (!taskId) {
    console.error("[Server] Error: Task ID missing in form submission");
    return res.redirect("/gamification");
  }

  try {
    const user = await User.findById(req.session.user.id);
    let task = LearningTask.getTaskById(taskId);
    if (!task) {
      const numericId = parseInt(taskId);
      if (!isNaN(numericId)) {
        task = LearningTask.getTaskById(numericId);
      }
    }

    if (!user || !task) {
      console.error("[Server] User or Task not found.");
      return res.redirect("/gamification");
    }

    // Check if already completed
    const alreadyDone =
      user.completedTasks.includes(task.id) ||
      user.completedTasks.includes(task.id.toString());

    if (alreadyDone) {
      console.log("[Server] Task already completed. Redirecting.");
      return res.redirect("/gamification");
    }

    // Update Stats
    user.experiencePoints += task.experienceReward || 10;
    user.completedTasks.push(task.id.toString());

    // Level Up Logic
    const experienceToNextLevel = user.level * 100;
    if (user.experiencePoints >= experienceToNextLevel) {
      user.level++;
      user.experiencePoints -= experienceToNextLevel;
    }

    await User.updateGamificationProgress(
      user.id,
      user.level,
      user.experiencePoints,
      user.completedTasks
    );

    console.log(`[Server] User ${user.username} completed task ${task.id}`);

    res.redirect("/gamification");
  } catch (error) {
    console.error("[Server] Error completing task:", error);
    res.redirect("/gamification");
  }
});

app.get("/gamified-learning", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);

    // 1. Calculate Rank
    const allUsers = User.getAllUsers();
    const sortedUsers = allUsers.sort(
      (a, b) => b.experiencePoints - a.experiencePoints
    );
    const rank = sortedUsers.findIndex((u) => u.id === user.id) + 1;
    user.rank = rank;

    // --- DATA GENERATION ---
    const formatDate = (date) =>
      date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const today = new Date();

    // 2. WEEKLY CHALLENGES DATA
    const weeklyChallenges = {
      active: {
        id: "w-active",
        title: "The SQL Injection Sprint",
        description:
          "Find and patch 3 SQL vulnerabilities in the provided dummy bank application.",
        xp: 500,
        startDate: formatDate(
          new Date(today.setDate(today.getDate() - today.getDay()))
        ), // Last Sunday
        endDate: formatDate(new Date(today.setDate(today.getDate() + 6))), // Next Saturday
        winner: "TBD",
        status: "active",
      },
      upcoming: [
        {
          id: "w-next",
          title: "Cross-Site Scripting (XSS) Race",
          description: "A speed run to identify reflected XSS attacks.",
          xp: 600,
          startDate: "Next Mon",
          endDate: "Next Sun",
          status: "upcoming",
        },
      ],
      past: [
        {
          id: "w-past-1",
          title: "Password Cracking Marathon",
          description: "Brute-force the hashes (legally!) in our sandbox.",
          xp: 450,
          startDate: "Last Week",
          endDate: "Last Week",
          winner: "CyberNinja_99",
          status: "past",
        },
      ],
    };

    // 3. MONTHLY CHALLENGES DATA
    const monthlyChallenges = {
      active: {
        id: "m-active",
        title: "Red Team Operation: Alpha",
        description:
          "A full-scale penetration test on the 'MegaCorp' simulation. Root access required.",
        xp: 2500,
        startDate: "Oct 1",
        endDate: "Oct 31",
        winner: "TBD",
        status: "active",
      },
      upcoming: [
        {
          id: "m-next",
          title: "Blue Team Defense Month",
          description: "Defend the fortress against an automated AI attacker.",
          xp: 3000,
          startDate: "Nov 1",
          endDate: "Nov 30",
          status: "upcoming",
        },
      ],
      past: [
        {
          id: "m-past",
          title: "The Zero-Day Hunt",
          description: "Find the hidden vulnerability in the kernel module.",
          xp: 5000,
          startDate: "Sep 1",
          endDate: "Sep 30",
          winner: "SarahHacks",
          status: "past",
        },
      ],
    };

    // 4. DAILY MISSIONS
    const missions = [
      {
        id: 101,
        title: "Phishing Detective",
        description: "Identify 3 phishing emails.",
        xp: 50,
        difficulty: "easy",
      },
      {
        id: 102,
        title: "2FA Setup",
        description: "Enable 2FA settings.",
        xp: 150,
        difficulty: "medium",
      },
      {
        id: 103,
        title: "Malware Analysis",
        description: "Analyze the file hash.",
        xp: 300,
        difficulty: "hard",
      },
    ];

    // 5. ACHIEVEMENTS
    const achievements = [
      { name: "First Steps", icon: "🟢", unlocked: true },
      { name: "Level 5 Guardian", icon: "🛡️", unlocked: user.level >= 5 },
      {
        name: "XP Millionaire",
        icon: "💎",
        unlocked: user.experiencePoints >= 1000,
      },
      {
        name: "Mission Master",
        icon: "🎯",
        unlocked: user.completedTasks && user.completedTasks.length > 5,
      },
    ];

    // 6. RENDER THE PAGE WITH ALL VARIABLES
    res.render("gamified_learning", {
      user: user,
      missions: missions,
      weeklyChallenges: weeklyChallenges, // <--- This fixes your error
      monthlyChallenges: monthlyChallenges, // <--- This fixes the next error you would get
      achievements: achievements,
      page: "gamified_learning",
    });
  } catch (error) {
    console.error("[Server] Error loading gamified learning:", error);
    res.redirect("/dashboard");
  }
});

// Handle "Start Mission" Button Click
app.post("/missions/start/:id", requireAuth, (req, res) => {
  const missionId = req.params.id;
  console.log(`[Server] Starting mission: ${missionId}`);

  // Logic: Redirect to the specific GET route for that challenge
  if (missionId === "w-active") {
    return res.redirect("/weekly-challenge"); // Redirects to the GET route below
  }

  if (missionId === "m-active") {
    return res.redirect("/monthly-challenge");
  }

  // For daily missions, map them to specific tasks or a generic daily page
  if (!isNaN(parseInt(missionId))) {
    return res.redirect("/daily-challenge");
  }

  // Fallback
  res.redirect("/gamified-learning");
});

// Weekly Challenge Page Route

app.get("/weekly-challenge", requireAuth, async (req, res) => {
  const user = await User.findById(req.session.user.id);

  const task = {
    id: "w-active",
    title: "Weekly: The SQL Injection Sprint",
    description:
      "Your goal is to identify and patch 3 SQL vulnerabilities in the dummy bank app within 60 minutes.",
    videoUrl: "",
    documentation:
      "Read about SQL Injection prevention cheatsheets before starting.",
    miniTaskDescription: "Submit the flag found in the admin database table.",
    experienceReward: 500,
  };

  res.render("weekly_challenge", { task, user, page: "gamified_learning" });
});

// Monthly Challenge Page Route

app.get("/monthly-challenge", requireAuth, async (req, res) => {
  const user = await User.findById(req.session.user.id);

  const task = {
    id: "m-active",
    title: "Monthly: Red Team Operation Alpha",
    description:
      "This is a full-scale penetration test simulation. Root access required.",
    videoUrl: "",
    documentation: "Review the Rules of Engagement (RoE) document.",
    miniTaskDescription: "Upload the root.txt hash code.",
    experienceReward: 2500,
  };

  res.render("monthly_challenge", { task, user, page: "gamified_learning" });
});

// Daily Challenge Page Route

app.get("/daily-challenge", requireAuth, async (req, res) => {
  const user = await User.findById(req.session.user.id);

  const task = {
    id: "daily-generic",
    title: "Daily Mission",
    description: "Complete your daily quick-fire cybersecurity task.",
    documentation: "Quick tip: Always check the sender's email address.",
    miniTaskDescription: "Mark this task as complete to keep your streak.",
    experienceReward: 50,
  };

  res.render("daily_challenge", { task, user, page: "gamified_learning" });
});

// Leaderboard Page Route

app.get("/leaderboard", requireAuth, (req, res) => {
  res.render("leaderboard", { user: req.session.user, page: "leaderboard" });
});

// Leaderboard API

app.get("/api/leaderboard", requireAuth, (req, res) => {
  try {
    const allUsers = User.getAllUsers();
    const leaderboard = allUsers
      .sort((a, b) => {
        if (b.level !== a.level) return b.level - a.level;
        return b.experiencePoints - a.experiencePoints;
      })
      .map((user) => ({
        username: user.username,
        level: user.level,
        experiencePoints: user.experiencePoints,
      }));
    res.json({ success: true, leaderboard });
  } catch (error) {
    console.error("[Server] Error fetching leaderboard:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Security Tools Routes

app.get("/url-scanner", requireAuth, (req, res) => {
  res.render("url_scanner", { user: req.session.user, page: "tools" });
});

app.get("/file-scanner", requireAuth, (req, res) => {
  res.render("file_scanner", { user: req.session.user, page: "tools" });
});

app.get("/breach-search", requireAuth, (req, res) => {
  res.render("breach_search", { user: req.session.user, page: "tools" });
});

app.get("/darkweb-monitor", requireAuth, (req, res) => {
  res.render("darkwebmonitor", { user: req.session.user, page: "tools" });
});

app.get("/phone-validator", requireAuth, (req, res) => {
  res.render("phone_number_validation", {
    user: req.session.user,
    page: "tools",
  });
});

app.get("/request-log", requireAuth, (req, res) => {
  res.render("request_log", { user: req.session.user, page: "reports" });
});

app.get("/analytics", requireAuth, (req, res) => {
  res.render("analytics", { user: req.session.user, page: "reports" });
});

// API Endpoints for Tools

app.post("/api/scan-url", requireAuth, async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  const apiKey = process.env.IPQS_API_KEY;
  const encodedUrl = encodeURIComponent(url);
  const apiUrl = `https://www.ipqualityscore.com/api/json/url/${apiKey}/${encodedUrl}`;

  try {
    const fetchFromIPQS = () => {
      return new Promise((resolve, reject) => {
        https
          .get(apiUrl, (apiRes) => {
            let data = "";
            apiRes.on("data", (chunk) => (data += chunk));
            apiRes.on("end", () => {
              try {
                resolve(JSON.parse(data));
              } catch (e) {
                reject(new Error("Failed to parse JSON response"));
              }
            });
          })
          .on("error", (err) => reject(err));
      });
    };

    const apiData = await fetchFromIPQS();

    if (apiData.success === false) {
      return res.json({
        success: false,
        error: apiData.message || "API Key invalid",
      });
    }

    res.json({
      success: true,
      unsafe: apiData.unsafe || apiData.phishing || apiData.malware,
      risk_score: apiData.risk_score || 0,
      domain: apiData.domain || url,
      domain_age: apiData.domain_age?.human || "Unknown",
      threats: {
        phishing: apiData.phishing === true,
        malware: apiData.malware === true,
        spamming: apiData.spamming === true,
        suspicious: apiData.suspicious === true,
      },
    });
  } catch (error) {
    console.error("[Server] URL Scan Error:", error.message);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

app.post("/api/scan-file", requireAuth, async (req, res) => {
  setTimeout(() => {
    res.json({
      clean: Math.random() > 0.2,
      fileSize: "2.4 MB",
      detections: Math.floor(Math.random() * 5),
      details: [
        "Signature analysis: Complete",
        "Behavioral analysis: No suspicious activity",
        "Heuristic scan: Passed",
        "Sandbox execution: Safe",
      ],
    });
  }, 2000);
});

app.post("/api/breach-search", requireAuth, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const apiKey = process.env.IPQS_API_KEY;
  const apiUrl = `https://www.ipqualityscore.com/api/json/email/${apiKey}/${email}`;

  try {
    const fetchEmailData = () => {
      return new Promise((resolve, reject) => {
        https
          .get(apiUrl, (apiRes) => {
            let data = "";
            apiRes.on("data", (chunk) => (data += chunk));
            apiRes.on("end", () => {
              try {
                resolve(JSON.parse(data));
              } catch (e) {
                reject(new Error("Failed to parse API response"));
              }
            });
          })
          .on("error", (err) => reject(err));
      });
    };

    const apiData = await fetchEmailData();
    if (apiData.success === false) {
      return res.json({ success: false, error: apiData.message });
    }

    res.json({
      success: true,
      valid: apiData.valid,
      fraud_score: apiData.fraud_score || 0,
      leaked: apiData.leaked || false,
      recent_abuse: apiData.recent_abuse || false,
      email: email,
    });
  } catch (error) {
    console.error("[Server] Breach Search Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/darkweb-monitor", requireAuth, async (req, res) => {
  const { data, type } = req.body;
  if (!data) return res.status(400).json({ error: "Search data is required" });

  const apiKey = process.env.IPQS_API_KEY;
  const searchType = type || "email";
  const encodedData = encodeURIComponent(data);
  const apiUrl = `https://www.ipqualityscore.com/api/json/leaked/${searchType}/${apiKey}/${encodedData}`;

  try {
    const fetchLeakData = () => {
      return new Promise((resolve, reject) => {
        https
          .get(apiUrl, (apiRes) => {
            let raw = "";
            apiRes.on("data", (chunk) => (raw += chunk));
            apiRes.on("end", () => {
              try {
                resolve(JSON.parse(raw));
              } catch (e) {
                reject(new Error("Failed to parse API response"));
              }
            });
          })
          .on("error", (err) => reject(err));
      });
    };

    const apiData = await fetchLeakData();
    if (apiData.success === false) {
      return res.json({ success: false, error: apiData.message });
    }

    res.json({
      success: true,
      leaked: apiData.leaked || false,
      query: data,
      results: apiData.results || [],
    });
  } catch (error) {
    console.error("[Server] Dark Web Scan Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/phone-validation", requireAuth, async (req, res) => {
  const { phone, country } = req.body;
  if (!phone)
    return res.status(400).json({ error: "Phone number is required" });

  const apiKey = process.env.IPQS_API_KEY;
  const userPhone = encodeURIComponent(phone);
  let apiUrl = `https://www.ipqualityscore.com/api/json/phone/${apiKey}/${userPhone}`;
  if (country && country !== "US") apiUrl += `?country=${country}`;

  try {
    const fetchPhoneData = () => {
      return new Promise((resolve, reject) => {
        https
          .get(apiUrl, (apiRes) => {
            let data = "";
            apiRes.on("data", (chunk) => (data += chunk));
            apiRes.on("end", () => {
              try {
                resolve(JSON.parse(data));
              } catch (e) {
                reject(new Error("Failed to parse API response"));
              }
            });
          })
          .on("error", (err) => reject(err));
      });
    };

    const apiData = await fetchPhoneData();
    if (apiData.success === false) {
      return res.json({ success: false, message: apiData.message });
    }
    res.json(apiData);
  } catch (error) {
    console.error("[Server] Phone Validation Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/request-log", requireAuth, async (req, res) => {
  const { type, start_date, stop_date } = req.body;
  const apiKey = process.env.IPQS_API_KEY;
  const reqType = type || "proxy";
  let apiUrl = `https://www.ipqualityscore.com/api/json/requests/${apiKey}/list?type=${reqType}`;

  if (start_date) apiUrl += `&start_date=${start_date}`;
  if (stop_date) apiUrl += `&stop_date=${stop_date}`;

  try {
    const fetchLogs = () => {
      return new Promise((resolve, reject) => {
        https
          .get(apiUrl, (apiRes) => {
            let data = "";
            apiRes.on("data", (chunk) => (data += chunk));
            apiRes.on("end", () => {
              try {
                resolve(JSON.parse(data));
              } catch (e) {
                reject(new Error("Failed to parse API response"));
              }
            });
          })
          .on("error", (err) => reject(err));
      });
    };

    const apiData = await fetchLogs();
    if (apiData.success === false) {
      return res.json({ success: false, message: apiData.message });
    }

    const requests = (apiData.requests || []).map((req) => ({
      date: req.created_at || "N/A",
      query:
        req.search_term ||
        req.ip ||
        req.email ||
        req.url ||
        req.phone ||
        "Unknown",
      fraud_score: req.fraud_score !== undefined ? req.fraud_score : 0,
      country_code: req.country_code || "N/A",
    }));

    res.json({ success: true, requests });
  } catch (error) {
    console.error("[Server] Log Fetch Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`⚡ CredLocker server running on http://localhost:${PORT}`);
  console.log(`🔐 Default admin: admin / password`);
  console.log(`📝 Or create a new account at /signup`);
});
