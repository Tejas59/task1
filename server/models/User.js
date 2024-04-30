const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique:true,
  },
  password: {
    type: String,
    required: true,
    minlength:5,
  },
  lockedUntil: {
    type: Date,
    default: null,
  }
});

module.exports = mongoose.model('User', userSchema);
