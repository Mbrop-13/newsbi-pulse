"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { SupportTicket, SupportMessage } from "@/lib/types";
import { Send, Loader2, ArrowLeft, RefreshCw, CheckCircle2, User, Headphones } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface TicketWithUser extends SupportTicket {
  user: {
    email: string;
    raw_user_meta_data: {
      full_name?: string;
    };
  } | null;
  lastMessage?: string;
}

export default function AdminSupportPage() {
  const supabase = createClient();
  const [tickets, setTickets] = useState<TicketWithUser[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [adminUser, setAdminUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAdminUser(data.user));
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setIsLoadingTickets(true);
    try {
      // In a real app we'd do a join with auth.users via an RPC or a view.
      // Since we don't have a view, we fetch tickets, then we fetch user info if we had access to auth.users.
      // But standard supabase client can't query auth.users directly. 
      // Workaround: We'll just fetch tickets. The user name can be pulled from user_profiles if you have it.
      // For now, we'll just show the ticket ID and subject.
      
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("updated_at", { ascending: false });
        
      if (error) throw error;
      
      setTickets(data as any);
    } catch (error) {
      console.error("Error loading tickets:", error);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (!selectedTicketId) return;

    const loadMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const { data, error } = await supabase
          .from("support_messages")
          .select("*")
          .eq("ticket_id", selectedTicketId)
          .order("created_at", { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (error) {
        console.error("Error loading messages:", error);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();

    // Subscribe to new messages for this ticket
    const channel = supabase
      .channel(`admin_support_${selectedTicketId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_messages',
        filter: `ticket_id=eq.${selectedTicketId}`
      }, (payload) => {
        const newMsg = payload.new as SupportMessage;
        setMessages((prev) => {
          if (!prev.find(m => m.id === newMsg.id)) {
            return [...prev, newMsg];
          }
          return prev;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTicketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTicketId || !adminUser || isSending) return;

    const msgText = newMessage.trim();
    setNewMessage("");
    setIsSending(true);

    try {
      const { data, error } = await supabase
        .from("support_messages")
        .insert([{
          ticket_id: selectedTicketId,
          user_id: adminUser.id,
          is_admin: true,
          message: msgText
        }])
        .select()
        .single();

      if (error) throw error;

      setMessages(prev => [...prev, data]);
      
      await supabase
        .from("support_tickets")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", selectedTicketId);
        
      // Update local ticket list
      setTickets(prev => prev.map(t => 
        t.id === selectedTicketId ? { ...t, updated_at: new Date().toISOString() } : t
      ).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()));

    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleCloseTicket = async (ticketId: string) => {
    if (!confirm("¿Cerrar este ticket?")) return;
    try {
      await supabase.from("support_tickets").update({ status: 'closed' }).eq('id', ticketId);
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'closed' } : t));
    } catch (error) {
      console.error(error);
    }
  };

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Soporte Técnico</h1>
          <p className="text-sm text-gray-500">Gestiona los tickets de los usuarios.</p>
        </div>
        <button onClick={loadTickets} className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm hover:text-[#1890FF] transition-colors border border-gray-200 dark:border-gray-700">
          <RefreshCw className={`w-5 h-5 ${isLoadingTickets ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex flex-1 gap-6 min-h-0 overflow-hidden">
        {/* Tickets List */}
        <div className={`w-full md:w-1/3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col overflow-hidden shadow-sm ${selectedTicketId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-slate-800/50 font-semibold text-gray-700 dark:text-gray-200 flex justify-between items-center">
            <span>Tickets Abiertos</span>
            <span className="text-xs bg-[#1890FF] text-white px-2 py-0.5 rounded-full">{tickets.filter(t => t.status === 'open').length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isLoadingTickets ? (
               <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Cargando...</div>
            ) : tickets.length === 0 ? (
               <div className="p-8 text-center text-gray-500 text-sm">No hay tickets.</div>
            ) : (
              tickets.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTicketId(t.id)}
                  className={`w-full text-left p-4 rounded-xl transition-all border ${
                    selectedTicketId === t.id 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm' 
                      : 'bg-white dark:bg-slate-800 border-transparent hover:bg-gray-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">Ticket #{t.id.split('-')[0]}</span>
                    <span className="text-[10px] text-gray-400 shrink-0">{format(new Date(t.updated_at), "dd/MM HH:mm")}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 truncate">{t.subject}</span>
                    <span className={`w-2 h-2 rounded-full ${t.status === 'open' ? 'bg-green-500' : 'bg-gray-300'}`} />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        {selectedTicketId ? (
          <div className="w-full md:w-2/3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col overflow-hidden shadow-sm">
            {/* Chat Header */}
            <div className="h-16 border-b border-gray-100 dark:border-gray-700/50 px-4 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/50 shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedTicketId(null)} className="md:hidden p-2 -ml-2 text-gray-500">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[#1890FF]">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">Ticket #{selectedTicketId.split('-')[0]}</h3>
                  <p className="text-xs text-gray-500">{selectedTicket?.status === 'open' ? 'Abierto' : 'Cerrado'}</p>
                </div>
              </div>
              
              {selectedTicket?.status === 'open' && (
                <button 
                  onClick={() => handleCloseTicket(selectedTicketId)}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-200 dark:border-gray-600 px-3 py-1.5 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Cerrar Ticket
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f0f2f5] dark:bg-[#0B141A]">
              {isLoadingMessages ? (
                <div className="flex-1 h-full flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#1890FF]" /></div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.is_admin;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}>
                      <div 
                        className={`relative px-4 py-2 text-[15px] max-w-[75%] leading-relaxed shadow-sm ${
                          isMe 
                            ? 'bg-[#D9FDD3] dark:bg-[#005C4B] text-gray-900 dark:text-white rounded-2xl rounded-tr-sm' 
                            : 'bg-white dark:bg-[#202C33] text-gray-900 dark:text-white rounded-2xl rounded-tl-sm'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                        <div className={`text-[10px] text-right mt-1 opacity-60 ${isMe ? 'text-gray-600 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
                          {format(new Date(msg.created_at), "dd/MM HH:mm")}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-gray-700">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe una respuesta al usuario..."
                  className="flex-1 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm outline-none focus:border-[#1890FF] focus:ring-1 focus:ring-[#1890FF]"
                  disabled={selectedTicket?.status === 'closed'}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isSending || selectedTicket?.status === 'closed'}
                  className="w-10 h-10 rounded-full bg-[#1890FF] text-white flex items-center justify-center shrink-0 disabled:opacity-50"
                >
                  {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-col items-center justify-center w-2/3 h-full bg-gray-50/50 dark:bg-slate-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-400">
            <Headphones className="w-16 h-16 mb-4 opacity-50" />
            <p className="font-medium">Selecciona un ticket para ver la conversación</p>
          </div>
        )}
      </div>
    </div>
  );
}
