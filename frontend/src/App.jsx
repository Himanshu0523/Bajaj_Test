import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// Get backend URL with fallback and safety cleaning
const getBackendUrl = () => {
  let url = import.meta.env.VITE_BACKEND_URL;
  if (!url) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      url = 'http://localhost:3000';
    } else {
      url = '/api';
    }
  }
  url = url.replace(/\/bfhl$/, '');
  return url.replace(/\/$/, '');
};

const BACKEND_URL = getBackendUrl();

const COLUMNS = [
  { id: 'open', title: 'Open', color: 'border-t-blue-500 bg-blue-500/5 text-blue-400' },
  { id: 'in_progress', title: 'In Progress', color: 'border-t-amber-500 bg-amber-500/5 text-amber-400' },
  { id: 'resolved', title: 'Resolved', color: 'border-t-emerald-500 bg-emerald-500/5 text-emerald-400' },
  { id: 'closed', title: 'Closed', color: 'border-t-slate-500 bg-slate-500/5 text-slate-400' }
];

const PRIORITY_THEMES = {
  low: { badge: 'bg-blue-950/40 text-blue-400 border border-blue-800/30', label: 'Low' },
  medium: { badge: 'bg-indigo-950/40 text-indigo-400 border border-indigo-800/30', label: 'Medium' },
  high: { badge: 'bg-amber-950/40 text-amber-400 border border-amber-800/30', label: 'High' },
  urgent: { badge: 'bg-rose-950/40 text-rose-400 border border-rose-800/30 animate-pulse', label: 'Urgent' }
};

export default function App() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    statusCounts: { open: 0, in_progress: 0, resolved: 0, closed: 0 },
    priorityCounts: { low: 0, medium: 0, high: 0, urgent: 0 },
    slaBreachedOpenCount: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterBreached, setFilterBreached] = useState('all');

  // Sidebar Create Ticket
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    customerEmail: '',
    priority: 'low'
  });
  const [formError, setFormError] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Toast State
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToast = (message, type = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const fetchTicketsAndStats = async () => {
    try {
      // Build API request query string based on status filters
      // Note: We do priority & breached filtering in frontend to avoid page jumpings
      // and allow multiple filters to play together instantly.
      const ticketsRes = await axios.get(`${BACKEND_URL}/tickets`);
      setTickets(ticketsRes.data);

      const statsRes = await axios.get(`${BACKEND_URL}/tickets/stats`);
      setStats(statsRes.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not establish connection to the DeskFlow server.');
    } finally {
      setLoading(false);
    }
  };

  // Poll for live ticket age updates and SLA breaches every 30 seconds
  useEffect(() => {
    fetchTicketsAndStats();
    const interval = setInterval(fetchTicketsAndStats, 30000);
    return () => {
      clearInterval(interval);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  // Filtered tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    const matchesBreached =
      filterBreached === 'all' ||
      (filterBreached === 'breached' && ticket.slaBreached) ||
      (filterBreached === 'non-breached' && !ticket.slaBreached);
    return matchesPriority && matchesBreached;
  });

  // Handle Drag & Drop
  const handleDragStart = (e, ticketId) => {
    e.dataTransfer.setData('text/plain', ticketId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const ticketId = e.dataTransfer.getData('text/plain');
    if (!ticketId) return;

    // Find the original ticket to check current status
    const origTicket = tickets.find(t => t._id === ticketId);
    if (!origTicket) return;

    if (origTicket.status === targetStatus) return;

    await updateTicketStatus(ticketId, targetStatus);
  };

  // Status transition request
  const updateTicketStatus = async (ticketId, targetStatus) => {
    try {
      const res = await axios.patch(`${BACKEND_URL}/tickets/${ticketId}`, {
        status: targetStatus
      });
      showToast(`Ticket status updated to "${targetStatus.replace('_', ' ')}"`);
      // Update locally immediately for instant feedback, then refetch stats
      setTickets(prev => prev.map(t => (t._id === ticketId ? res.data : t)));
      
      // Fetch stats to update numbers
      const statsRes = await axios.get(`${BACKEND_URL}/tickets/stats`);
      setStats(statsRes.data);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Error updating status.';
      showToast(errMsg, 'error');
    }
  };

  // Create Ticket Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Frontend validation
    if (!newTicket.subject.trim()) return setFormError('Subject is required.');
    if (!newTicket.description.trim()) return setFormError('Description is required.');
    if (!newTicket.customerEmail.trim()) return setFormError('Customer Email is required.');

    setFormSubmitting(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/tickets`, newTicket);
      showToast('Support ticket created successfully!');
      
      // Update state
      setTickets(prev => [res.data, ...prev]);
      setIsCreateOpen(false);
      
      // Reset form
      setNewTicket({ subject: '', description: '', customerEmail: '', priority: 'low' });
      
      // Refetch stats
      const statsRes = await axios.get(`${BACKEND_URL}/tickets/stats`);
      setStats(statsRes.data);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to submit ticket.';
      setFormError(errMsg);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete Ticket
  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm('Are you sure you want to permanently delete this ticket?')) return;
    try {
      await axios.delete(`${BACKEND_URL}/tickets/${ticketId}`);
      showToast('Ticket deleted successfully.');
      setTickets(prev => prev.filter(t => t._id !== ticketId));
      
      // Refetch stats
      const statsRes = await axios.get(`${BACKEND_URL}/tickets/stats`);
      setStats(statsRes.data);
    } catch (err) {
      showToast('Failed to delete ticket.', 'error');
    }
  };

  // Format Ticket Age helper
  const formatAge = (minutes) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="min-h-screen pb-12 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* SLA Breach Alert Banner */}
      {stats.slaBreachedOpenCount > 0 && (
        <div className="bg-gradient-to-r from-red-950 via-rose-900 to-red-950 text-rose-100 py-3 px-6 text-center border-b border-rose-500/30 flex items-center justify-center gap-2 text-sm md:text-base animate-pulse">
          <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-semibold">{stats.slaBreachedOpenCount} {stats.slaBreachedOpenCount === 1 ? 'ticket is' : 'tickets are'} breaching priority SLA!</span>
          <span className="text-xs opacity-75 hidden sm:inline">(Action required immediately)</span>
        </div>
      )}

      {/* Main Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 py-4 px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-indigo-200">
              DeskFlow
            </h1>
            <p className="text-xs text-slate-400">Support Ticket Triage</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Create ticket trigger button */}
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-lg font-medium shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 transition duration-150 ease-in-out cursor-pointer text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            File Ticket
          </button>
        </div>
      </header>

      {/* Main Board Container */}
      <main className="flex-1 px-4 md:px-12 py-8 flex flex-col gap-6 max-w-[1600px] w-full mx-auto">
        
        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-200 flex items-center gap-3 text-sm animate-fade-in">
            <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold">Connection Error</p>
              <p className="text-xs text-slate-400">{error} Please verify the backend API service is running locally on port 3000.</p>
            </div>
          </div>
        )}

        {/* Top Mini Stats Bar */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-4 flex flex-col">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Open</span>
            <span className="text-2xl font-bold text-white mt-1">{stats.statusCounts.open}</span>
          </div>
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-4 flex flex-col">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">In Progress</span>
            <span className="text-2xl font-bold text-white mt-1">{stats.statusCounts.in_progress}</span>
          </div>
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-4 flex flex-col">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Resolved</span>
            <span className="text-2xl font-bold text-white mt-1">{stats.statusCounts.resolved}</span>
          </div>
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-4 flex flex-col">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Closed</span>
            <span className="text-2xl font-bold text-white mt-1">{stats.statusCounts.closed}</span>
          </div>
        </section>

        {/* Filter Controls Strip */}
        <section className="bg-slate-900/40 border border-slate-850/70 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Priority Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Filter by Priority</label>
              <div className="flex rounded-lg overflow-hidden border border-slate-800 bg-slate-950/60 p-0.5">
                {['all', 'low', 'medium', 'high', 'urgent'].map((prio) => (
                  <button
                    key={prio}
                    onClick={() => setFilterPriority(prio)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition cursor-pointer capitalize ${
                      filterPriority === prio
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                    }`}
                  >
                    {prio}
                  </button>
                ))}
              </div>
            </div>

            {/* SLA Breach Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">SLA Compliance</label>
              <div className="flex rounded-lg overflow-hidden border border-slate-800 bg-slate-950/60 p-0.5">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'breached', label: 'Breached Only' },
                  { id: 'non-breached', label: 'Compliant' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setFilterBreached(opt.id)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
                      filterBreached === opt.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-400">
            Showing <strong className="text-slate-200">{filteredTickets.length}</strong> of{' '}
            <strong className="text-slate-200">{tickets.length}</strong> total tickets
          </div>
        </section>

        {/* Board Columns Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
          {COLUMNS.map((col) => {
            const colTickets = filteredTickets.filter(t => t.status === col.id);

            return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`flex flex-col rounded-xl border border-slate-800/80 bg-slate-900/20 max-h-[750px] shadow-lg`}
              >
                {/* Column Header */}
                <div className={`p-4 border-t-2 ${col.color} border-b border-slate-800/85 flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <span className="font-bold tracking-wide uppercase text-sm">{col.title}</span>
                    <span className="bg-slate-800 text-slate-200 text-xs px-2 py-0.5 rounded-full font-bold">
                      {colTickets.length}
                    </span>
                  </div>
                </div>

                {/* Column Cards Container */}
                <div className="p-3 overflow-y-auto space-y-3 flex-1 min-h-[300px]">
                  {colTickets.length === 0 ? (
                    <div className="h-48 border border-dashed border-slate-800/60 rounded-xl flex items-center justify-center text-slate-500 text-xs italic">
                      Drag tickets here
                    </div>
                  ) : (
                    colTickets.map((ticket) => {
                      const priorityTheme = PRIORITY_THEMES[ticket.priority] || PRIORITY_THEMES.low;

                      return (
                        <div
                          key={ticket._id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, ticket._id)}
                          className="bg-slate-950/60 border border-slate-850 hover:border-slate-700/80 rounded-xl p-4 shadow-sm hover:shadow-md transition duration-150 ease-in-out cursor-grab active:cursor-grabbing group relative animate-fade-in"
                        >
                          {/* Card top flags */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${priorityTheme.badge}`}>
                              {priorityTheme.label}
                            </span>
                            
                            {/* Time open */}
                            <span className="text-[10px] text-slate-400 bg-slate-900/50 px-1.5 py-0.5 rounded border border-slate-800/30">
                              Age: {formatAge(ticket.ageMinutes)}
                            </span>
                          </div>

                          {/* Subject */}
                          <h4 className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors line-clamp-1 mb-1">
                            {ticket.subject}
                          </h4>

                          {/* Description */}
                          <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                            {ticket.description}
                          </p>

                          {/* Email & SLA block */}
                          <div className="pt-2 border-t border-slate-900/80 flex items-center justify-between gap-2">
                            <span className="text-[10px] text-slate-500 truncate" title={ticket.customerEmail}>
                              {ticket.customerEmail}
                            </span>

                            {ticket.slaBreached && (
                              <span className="flex items-center gap-1 text-[10px] text-rose-400 bg-rose-950/50 px-2 py-0.5 rounded border border-rose-800/30 font-bold uppercase tracking-wider animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                Breach
                              </span>
                            )}
                          </div>

                          {/* Transition buttons & Delete panel (Hover revealed) */}
                          <div className="mt-3 pt-2 border-t border-slate-900/60 flex items-center justify-between opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
                            {/* Direction Arrows */}
                            <div className="flex items-center gap-1.5">
                              {/* Move Left Button */}
                              {col.id !== 'open' && (
                                <button
                                  onClick={() => {
                                    const index = COLUMNS.findIndex(c => c.id === col.id);
                                    if (index > 0) updateTicketStatus(ticket._id, COLUMNS[index - 1].id);
                                  }}
                                  title={`Move to ${COLUMNS[COLUMNS.findIndex(c => c.id === col.id) - 1]?.title}`}
                                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                  </svg>
                                </button>
                              )}

                              {/* Move Right Button */}
                              {col.id !== 'closed' && (
                                <button
                                  onClick={() => {
                                    const index = COLUMNS.findIndex(c => c.id === col.id);
                                    if (index !== -1 && index < COLUMNS.length - 1) {
                                      updateTicketStatus(ticket._id, COLUMNS[index + 1].id);
                                    }
                                  }}
                                  title={`Move to ${COLUMNS[COLUMNS.findIndex(c => c.id === col.id) + 1]?.title}`}
                                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                              )}
                            </div>

                            {/* Trash button */}
                            <button
                              onClick={() => handleDeleteTicket(ticket._id)}
                              title="Delete Ticket"
                              className="p-1 hover:bg-rose-950/40 rounded text-slate-500 hover:text-rose-400 cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </section>
      </main>

      {/* Floating Create Ticket Drawer */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex animate-fade-in">
          {/* Overlay backdrop */}
          <div
            onClick={() => setIsCreateOpen(false)}
            className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm cursor-pointer"
          />

          {/* Drawer body */}
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl p-6 md:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-white">Submit Support Ticket</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Fill out detail log to dispatch team.</p>
                </div>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {formError && (
                <div className="p-3 mb-4 bg-red-950/40 border border-red-500/30 rounded-lg text-red-200 text-xs">
                  {formError}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                {/* Subject */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300">Subject</label>
                  <input
                    type="text"
                    required
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="e.g. Server response latency spike"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300">Customer Email</label>
                  <input
                    type="email"
                    required
                    value={newTicket.customerEmail}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, customerEmail: e.target.value }))}
                    placeholder="customer@domain.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Priority */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300">Priority Level</label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="low">Low (72h Target)</option>
                    <option value="medium">Medium (24h Target)</option>
                    <option value="high">High (4h Target)</option>
                    <option value="urgent">Urgent (1h Target)</option>
                  </select>
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300">Description</label>
                  <textarea
                    rows={4}
                    required
                    value={newTicket.description}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Provide details about the issue..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-semibold transition text-sm cursor-pointer"
                >
                  {formSubmitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </form>
            </div>
            
            <div className="text-[10px] text-slate-500 text-center border-t border-slate-850 pt-4 mt-6">
              Assigned to DeskFlow Queue
            </div>
          </div>
        </div>
      )}

      {/* Nice Toast Alerts system */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-fade-in">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${
            toast.type === 'error'
              ? 'bg-red-950/90 border-red-500/50 text-red-200 shadow-red-950/20'
              : 'bg-indigo-950/90 border-indigo-500/50 text-indigo-200 shadow-indigo-950/20'
          } backdrop-blur-md`}>
            {toast.type === 'error' ? (
              <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="text-xs font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}