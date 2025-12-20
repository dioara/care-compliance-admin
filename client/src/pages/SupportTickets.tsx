import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supportTickets, type SupportTicket } from '@/lib/api';
import {
  TicketIcon,
  Search,
  AlertCircle,
  Clock,
  MessageSquare,
  X,
  Send,
  CheckCircle,
  Trash2,
  ChevronRight,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

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

interface TicketDetailModalProps {
  ticket: SupportTicket;
  onClose: () => void;
}

function TicketDetailModal({ ticket, onClose }: TicketDetailModalProps) {
  const [response, setResponse] = useState('');
  const queryClient = useQueryClient();

  const respondMutation = useMutation({
    mutationFn: (text: string) => supportTickets.respond(ticket.id, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      setResponse('');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => supportTickets.updateStatus(ticket.id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    },
  });

  const updatePriorityMutation = useMutation({
    mutationFn: (priority: string) => supportTickets.updatePriority(ticket.id, priority),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    },
  });

  const closeMutation = useMutation({
    mutationFn: () => supportTickets.close(ticket.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      onClose();
    },
  });

  const sConfig = statusConfig[ticket.status] || statusConfig.open;
  const pConfig = priorityConfig[ticket.priority] || priorityConfig.medium;

  const handleSubmitResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (response.trim()) {
      respondMutation.mutate(response.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono text-slate-500">#{ticket.ticketNumber}</span>
            <span className={`px-2 py-0.5 ${sConfig.bg} ${sConfig.text} text-xs font-medium rounded-full capitalize`}>
              {ticket.status.replace(/_/g, ' ')}
            </span>
            <span className={`px-2 py-0.5 ${pConfig.bg} ${pConfig.text} text-xs font-medium rounded-full capitalize`}>
              {ticket.priority}
            </span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{ticket.subject}</h2>
            <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
              <span>{ticket.name}</span>
              <span>•</span>
              <span>{ticket.email}</span>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm font-medium text-slate-700 mb-1">Category</p>
            <p className="text-slate-600 capitalize">{ticket.category.replace(/_/g, ' ')}</p>
          </div>

          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm font-medium text-slate-700 mb-2">Description</p>
            <p className="text-slate-600 whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {ticket.response && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <p className="text-sm font-medium text-blue-700 mb-2">Response History</p>
              <p className="text-slate-700 whitespace-pre-wrap text-sm">{ticket.response}</p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Change Status</p>
              <select
                value={ticket.status}
                onChange={(e) => updateStatusMutation.mutate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                disabled={updateStatusMutation.isPending}
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting_on_customer">Waiting on Customer</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Change Priority</p>
              <select
                value={ticket.priority}
                onChange={(e) => updatePriorityMutation.mutate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                disabled={updatePriorityMutation.isPending}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Response Form */}
          <form onSubmit={handleSubmitResponse} className="space-y-3">
            <p className="text-sm font-medium text-slate-700">Add Response</p>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Type your response here..."
              rows={4}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => closeMutation.mutate()}
                disabled={closeMutation.isPending || ticket.status === 'closed'}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50 flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Close Ticket
              </button>
              <button
                type="submit"
                disabled={!response.trim() || respondMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {respondMutation.isPending ? 'Sending...' : 'Send Response'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

interface DeleteConfirmProps {
  ticket: SupportTicket;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

function DeleteConfirm({ ticket, onClose, onConfirm, isLoading }: DeleteConfirmProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-center mb-2">Delete Ticket</h2>
          <p className="text-slate-600 text-center mb-4">
            Are you sure you want to delete ticket <strong>#{ticket.ticketNumber}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SupportTickets() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [deletingTicket, setDeletingTicket] = useState<SupportTicket | null>(null);
  const queryClient = useQueryClient();

  const { data: tickets, isLoading, error } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: supportTickets.list,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => supportTickets.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      setDeletingTicket(null);
    },
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

                <div className="flex flex-col items-end gap-2">
                  <div className="text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <span>{ticket.name}</span>
                      <span className="text-slate-300">|</span>
                      <span>{ticket.email}</span>
                    </div>
                    <div className="flex items-center gap-1 justify-end mt-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedTicket(ticket)}
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1"
                    >
                      <MessageSquare className="h-4 w-4" />
                      View & Respond
                    </button>
                    <button
                      onClick={() => setDeletingTicket(ticket)}
                      className="p-1.5 hover:bg-red-100 rounded-lg text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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

      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}

      {deletingTicket && (
        <DeleteConfirm
          ticket={deletingTicket}
          onClose={() => setDeletingTicket(null)}
          onConfirm={() => deleteMutation.mutate(deletingTicket.id)}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
