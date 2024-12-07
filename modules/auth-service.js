const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

require('dotenv').config();

let User;

const userSchema = new mongoose.Schema({
    userName: { type: String, unique: true },
    password: String,
    email: String,
    loginHistory: [
        {
            dateTime: Date,
            userAgent: String,
        }
    ]
});

// Initialize the database connection
function initialize() {
    return new Promise((resolve, reject) => {
        let db = mongoose.createConnection(process.env.MONGODB);

        db.on('error', (err) => {
            reject(err);
        });

        db.once('open', () => {
            User = db.model('users', userSchema);
            resolve();
        });
    });
}

// Register a new user
function registerUser(userData) {
    return new Promise((resolve, reject) => {
        // Hash the password using bcrypt
        bcrypt.hash(userData.password, 10).then(hash => {
            // Replace userData.password with the hashed password
            userData.password = hash;

            // Now you can save the user data to the database
            // Assuming you are using a function to save to the database
            saveUserToDatabase(userData)
                .then(() => resolve("User registered successfully"))
                .catch(err => reject("Error saving user to database: " + err));
        }).catch(err => {
            reject("There was an error encrypting the password: " + err);
        });
    });
}

// Check a user's credentials
function checkUser(userData) {
    return new Promise((resolve, reject) => {
        // Assuming you have a function to get the user by userName
        getUserFromDatabase(userData.userName).then(user => {
            // Compare the provided password with the stored hashed password
            bcrypt.compare(userData.password, user.password).then(result => {
                if (result === true) {
                    resolve("User authenticated successfully");
                } else {
                    reject(`Incorrect password for user: ${userData.userName}`);
                }
            }).catch(err => {
                reject("Error comparing password: " + err);
            });
        }).catch(err => {
            reject("User not found: " + err);
        });
    });
}


module.exports = { initialize, registerUser, checkUser };
