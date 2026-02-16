const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  employeeName: String,
  department: String,
  issueType: String,
  description: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Ticket", ticketSchema);
