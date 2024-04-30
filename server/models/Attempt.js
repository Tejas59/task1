const mongoose = require('mongoose');

const loginAttemptSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    expires: 24 * 60 * 60, 
  },
  outcome: {
    type: String,
    enum: ['success', 'failure'],
    required: true,
  }
});

const LoginAttemptModel = mongoose.model('LoginAttempt', loginAttemptSchema);

module.exports = LoginAttemptModel;
