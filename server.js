const nodemailer = require("nodemailer");
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(express.static("public"));

/* =============================
   MongoDB Connection (LOCAL)
============================= */

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

/* =============================
   Ticket Schema
============================= */

const ticketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    unique: true
  },
  employeeName: String,
  department: String,
  issueType: String,
  description: String,
  status: {
    type: String,
    default: "Open"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Ticket = mongoose.model("Ticket", ticketSchema);

/* =============================
   Generate Ticket ID
============================= */

const generateTicketId = () => {
  return "TCK-" + Date.now();
};

/* =============================
   Email Setup (Gmail)
============================= */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* =============================
   Create Ticket + Send Email
============================= */

app.post("/api/tickets", async (req, res) => {
  try {

    const ticket = new Ticket({
      ...req.body,
      ticketId: generateTicketId()
    });

    await ticket.save();

    // 📧 Send Email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: "New IT Ticket Created",
      html: `
        <h2>New Ticket Created</h2>
        <p><strong>Ticket ID:</strong> ${ticket.ticketId}</p>
        <p><strong>Name:</strong> ${ticket.employeeName}</p>
        <p><strong>Department:</strong> ${ticket.department}</p>
        <p><strong>Issue:</strong> ${ticket.issueType}</p>
        <p><strong>Description:</strong> ${ticket.description}</p>
        <p><strong>Status:</strong> ${ticket.status}</p>
      `
    });

    res.json({
      message: "Ticket Created & Email Sent",
      ticketId: ticket.ticketId
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error creating ticket or sending email" });
  }
});

/* =============================
   Get All Tickets (Admin)
============================= */

app.get("/api/tickets", async (req, res) => {
  const tickets = await Ticket.find().sort({ createdAt: -1 });
  res.json(tickets);
});

/* =============================
   Track Ticket by Ticket ID
============================= */

app.get("/api/track/:ticketId", async (req, res) => {
  const ticket = await Ticket.findOne({ ticketId: req.params.ticketId });

  if (!ticket) {
    return res.status(404).json({ message: "Ticket Not Found" });
  }

  res.json(ticket);
});

/* =============================
   Update Status (Admin Only)
============================= */

app.put("/api/tickets/:id", async (req, res) => {

  if (req.body.adminPassword !== process.env.ADMIN_PASSWORD) {
    return res.status(403).json({ message: "Admin Only" });
  }

  const updated = await Ticket.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  );

  res.json(updated);
});

/* =============================
   Run on Network
============================= */

app.listen(5000, "0.0.0.0", () => {
  console.log("Server running on port 5000");
});
