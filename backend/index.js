import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Ticket from './ticket.model.js';

dotenv.config();

const app = express();

// Enable CORS for local development and deployed frontend
app.use(cors({
  origin: true, // Allow all origins or specify React app dev origin in production
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || (
  (process.env.NETLIFY || process.env.NODE_ENV === 'production')
    ? 'mongodb+srv://himanshusatpute7_db_user:VbaYVERxxb1h14wQ@cluster0.zejjlik.mongodb.net/deskflow?retryWrites=true&w=majority'
    : 'mongodb://127.0.0.1:27017/deskflow'
);
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB successfully.'))
  .catch(err => console.error('MongoDB connection error:', err));

// Transition validator helper
const isValidTransition = (oldStatus, newStatus) => {
  if (oldStatus === newStatus) return true;

  const order = ['open', 'in_progress', 'resolved', 'closed'];
  const oldIdx = order.indexOf(oldStatus);
  const newIdx = order.indexOf(newStatus);

  if (oldIdx === -1 || newIdx === -1) return false;

  const diff = newIdx - oldIdx;
  // Forward 1 step or backward 1 step is allowed
  return diff === 1 || diff === -1;
};

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// GET /bfhl for backward compatibility or direct health testing
app.get('/bfhl', (req, res) => {
  res.status(200).json({ operation_code: 1 });
});

// POST /tickets - Create a ticket
app.post('/tickets', async (req, res) => {
  try {
    const { subject, description, customerEmail, priority } = req.body;
    
    // Create new ticket instance to trigger validations
    const ticket = new Ticket({
      subject,
      description,
      customerEmail,
      priority
    });

    await ticket.save();
    res.status(201).json(ticket);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Internal server error while creating ticket.' });
  }
});

// GET /tickets - List tickets with combinable filters
app.get('/tickets', async (req, res) => {
  try {
    const { status, priority, breached } = req.query;
    const filterQuery = {};

    if (status) {
      filterQuery.status = status;
    }
    if (priority) {
      filterQuery.priority = priority;
    }

    let tickets = await Ticket.find(filterQuery).sort({ createdAt: -1 });

    // Handle derived SLA breach filter in memory
    if (breached !== undefined) {
      const isBreached = breached === 'true';
      tickets = tickets.filter(t => t.slaBreached === isBreached);
    }

    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error while fetching tickets.' });
  }
});

// GET /tickets/stats - Aggregated stats
app.get('/tickets/stats', async (req, res) => {
  try {
    const tickets = await Ticket.find({});
    
    const statusCounts = { open: 0, in_progress: 0, resolved: 0, closed: 0 };
    const priorityCounts = { low: 0, medium: 0, high: 0, urgent: 0 };
    let slaBreachedOpenCount = 0;

    tickets.forEach(ticket => {
      if (statusCounts[ticket.status] !== undefined) {
        statusCounts[ticket.status]++;
      }
      if (priorityCounts[ticket.priority] !== undefined) {
        priorityCounts[ticket.priority]++;
      }
      // Count SLA-breached tickets that are currently open
      if (ticket.slaBreached && (ticket.status === 'open' || ticket.status === 'in_progress')) {
        slaBreachedOpenCount++;
      }
    });

    res.status(200).json({
      statusCounts,
      priorityCounts,
      slaBreachedOpenCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error while compiling stats.' });
  }
});

// PATCH /tickets/:id - Update ticket (status transitions rules)
app.patch('/tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, subject, description, priority, customerEmail } = req.body;

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }

    // Enforce status transitions rules if status is changing
    if (status && status !== ticket.status) {
      if (!isValidTransition(ticket.status, status)) {
        return res.status(400).json({
          message: `Invalid status transition from '${ticket.status}' to '${status}'. Only adjacent step transitions are allowed.`
        });
      }

      // Automatically handle resolvedAt
      if (status === 'resolved') {
        ticket.resolvedAt = new Date();
      } else if (ticket.status === 'resolved') {
        // Moving back from resolved must clear resolvedAt
        ticket.resolvedAt = null;
      }
      
      ticket.status = status;
    }

    // Update other fields if provided
    if (subject !== undefined) ticket.subject = subject;
    if (description !== undefined) ticket.description = description;
    if (priority !== undefined) ticket.priority = priority;
    if (customerEmail !== undefined) ticket.customerEmail = customerEmail;

    await ticket.save();
    res.status(200).json(ticket);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Internal server error while updating ticket.' });
  }
});

// DELETE /tickets/:id - Delete a ticket
app.delete('/tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTicket = await Ticket.findByIdAndDelete(id);
    
    if (!deletedTicket) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }
    
    res.status(200).json({ message: 'Ticket deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error while deleting ticket.' });
  }
});

export default app;

if (!process.env.NETLIFY) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}