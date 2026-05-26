import mongoose from 'mongoose';

const SLA_TARGETS = {
  urgent: 60,       // 1 hour
  high: 240,        // 4 hours
  medium: 1440,     // 24 hours
  low: 4320         // 72 hours
};

const ticketSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    customerEmail: {
      type: String,
      required: [true, 'Customer email is required'],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email format']
    },
    priority: {
      type: String,
      required: [true, 'Priority is required'],
      enum: {
        values: ['low', 'medium', 'high', 'urgent'],
        message: '{VALUE} is not a valid priority'
      }
    },
    status: {
      type: String,
      enum: {
        values: ['open', 'in_progress', 'resolved', 'closed'],
        message: '{VALUE} is not a valid status'
      },
      default: 'open'
    },
    resolvedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for ageMinutes
ticketSchema.virtual('ageMinutes').get(function () {
  const end = this.resolvedAt ? new Date(this.resolvedAt) : new Date();
  const diffMs = end - new Date(this.createdAt);
  const diffMin = Math.floor(diffMs / 60000);
  return diffMin >= 0 ? diffMin : 0;
});

// Virtual for slaBreached
ticketSchema.virtual('slaBreached').get(function () {
  const targetMin = SLA_TARGETS[this.priority];
  if (!targetMin) return false;

  const end = this.resolvedAt ? new Date(this.resolvedAt) : new Date();
  const diffMs = end - new Date(this.createdAt);
  const diffMin = diffMs / 60000;
  return diffMin > targetMin;
});

const Ticket = mongoose.model('Ticket', ticketSchema);

export default Ticket;
export { SLA_TARGETS };
