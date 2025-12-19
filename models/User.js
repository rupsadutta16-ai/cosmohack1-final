const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

// Point directly to users.json
const usersFilePath = path.join(__dirname, "../data/users.json");

class User {
  // Helper: Read the file fresh every time
  static _getUsers() {
    try {
      if (!fs.existsSync(usersFilePath)) return [];
      const data = fs.readFileSync(usersFilePath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Error reading users file:", error);
      return [];
    }
  }

  // Helper: Save data back to file
  static _saveUsers(users) {
    try {
      fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
    } catch (error) {
      console.error("Error saving users file:", error);
    }
  }

  // --- MISSING METHOD ADDED HERE ---
  static async create(userData) {
    const users = this._getUsers();

    // 1. Check for duplicates (username or email)
    const existingUser = users.find(
      (u) => u.username === userData.username || u.email === userData.email
    );
    if (existingUser) {
      throw new Error("Username or Email already exists");
    }

    // 2. Hash the password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // 3. Auto-increment ID
    // Finds the highest ID in the list and adds 1. If list is empty, starts at 1.
    const newId =
      users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1;

    // 4. Create the new user object
    const newUser = {
      id: newId,
      username: userData.username,
      email: userData.email,
      fullName: userData.fullName,
      password: hashedPassword,
      role: "user", // Default role
      level: 1, // Default gamification stats
      experiencePoints: 0,
      completedTasks: [],
      taskSubmissions: [],
      createdAt: new Date().toISOString(),
    };

    // 5. Save to file
    users.push(newUser);
    this._saveUsers(users);

    return newUser;
  }

  static async findById(id) {
    const users = this._getUsers();
    // Use loose equality (==) to match string "1" with number 1
    return users.find((u) => u.id == id);
  }

  static async findByUsername(username) {
    const users = this._getUsers();
    return users.find((u) => u.username === username);
  }

  static async validatePassword(user, password) {
    return await bcrypt.compare(password, user.password);
  }

  static getAllUsers() {
    return this._getUsers();
  }

  // --- THE CORE XP UPDATE LOGIC ---
  static async updateGamificationProgress(
    userId,
    newLevel,
    newXP,
    completedTasks
  ) {
    const users = this._getUsers();
    const index = users.findIndex((u) => u.id == userId);

    if (index !== -1) {
      // Update fields
      users[index].level = newLevel;
      users[index].experiencePoints = newXP;
      users[index].completedTasks = completedTasks;

      // Persist to file immediately
      this._saveUsers(users);
      return true;
    }
    return false;
  }
}

module.exports = User;
