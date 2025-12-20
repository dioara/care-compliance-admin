import { useQuery } from '@tanstack/react-query';
import { supportTickets } from '@/lib/api';
import {
  TicketIcon,
  Search,
  AlertCircle,
  Clock,
  CheckCircle,
  MessageSquare,
} from 'lucide-react';
import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';

export default function SupportTickets() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const { data: tickets, isLoading, error } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: supportTickets.list,
  });

  const filteredTickets = tickets?.filter((ticket) => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(search.toLowerCase()) ||
      ticket.name.toLowerCase().includes(search.toLowerCase()) ||
      ticket.email.toLowerCase().includes(search.toLowerCase()) ||
      ticket.ticketNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const statuses = ['all', 'open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'];
  const priorities = ['all', 'low', 'medium', 'high', 'urgent'];

  const statusConfig: Record<string, { bg: string; text: string }> = {
    open: { bg: 'bg-blue-100', text: 'text-blue-700' },
    in_progress: { bg: 'bg-amber-100', text: 'text-amber-700' },
    waiting_on_customer: { bg: 'bg-purple-100', text: 'text-purple-700' },
    resolved: { bg: 'bg-green-100', text: 'text-green-700' },
    closed: { bg: 'bg-slate-100', text: 'text-slate-600' },
  };

  const priorityConfig: Record<string, { bg: string; text: string }> = {
    low: { bg: 'bg-slate-100', text: 'text-slate-600' },
    medium: { bg: 'bg-blue-100', text: 'text-blue-700' },
    high: { bg: 'bg-orange-100', text: 'text-orange-700' },
    urgent: { bg: 'bg-red-100', text: 'text-red-700' },
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-700">Failed to load support tickets</p>
      </div>
    );
  }

  // Calculate summary stats
  const openCount = tickets?.filter((t) => t.status === 'open').length || 0;
  const inProgressCount = tickets?.filter((t) => t.status === 'in_progress').length || 0;
  const urgentCount = tickets?.filter((t) => t.priority === 'urgent' && t.status !== 'closed' && t.status !== 'resolved').length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Support Tickets</h1>
          <p className="text-slate-500 mt-1">{tickets?.length || 0} total tickets</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none capitalize"
          >
            {statuses.map((status) => (
              <option key={status} value={status} className="capitalize">
                {status === 'all' ? 'All Statuses' : status.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none capitalize"
          >
            {priorities.map((priority) => (
              <option key={priority} value={priority} className="capitalize">
                {priority === 'all' ? 'All Priorities' : priority}
              </option>
            ))}
          </select>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TicketIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Open</p>
              <p className="text-2xl font-bold text-slate-900">{openCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">In Progress</p>
              <p className="text-2xl font-bold text-slate-900">{inProgressCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Urgent</p>
              <p className="text-2xl font-bold text-slate-900">{urgentCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets?.map((ticket) => {
          const sConfig = statusConfig[ticket.status] || statusConfig.open;
          const pConfig = priorityConfig[ticket.priority] || priorityConfig.medium;

          return (
            <div
              key={ticket.id}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-mono text-slate-500">#{ticket.ticketNumber}</span>
                    <span className={`px-2 py-0.5 ${sConfig.bg} ${sConfig.text} text-xs font-medium rounded-full capitalize`}>
                      {ticket.status.replace(/_/g, ' ')}
                    </span>
                    <span className={`px-2 py-0.5 ${pConfig.bg} ${pConfig.text} text-xs font-medium rounded-full capitalize`}>
                      {ticket.priority}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-full capitalize">
                      {ticket.category.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">{ticket.subject}</h3>
                  <p className="text-sm text-slate-600 line-clamp-2">{ticket.description}</p>
                </div>

                <div className="flex flex-col items-end gap-2 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <span>{ticket.name}</span>
                    <span className="text-slate-300">|</span>
                    <span>{ticket.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredTickets?.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No support tickets found</p>
          </div>
        )}
      </div>
    </div>
  );
}
