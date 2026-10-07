"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { LuMail, LuInbox } from "react-icons/lu";
import { contactService, ContactMessageResponse } from "@/services/contactService";
import { AdminPage } from "@/components/admin/AdminPage";
import { RowViewButton } from "@/components/admin/RowActionButtons";
import { DataTable, ColumnDef } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { Tooltip } from "@/components/ui/tooltip";
import { ServerErrorCard } from "@/components/ui/ServerErrorCard";
import { PERM } from "@/lib/permissions";
import { useAuth } from "@/context/AuthContext";
import { refreshAdminCounts } from "@/components/admin/AdminCounts";

const formatDate = (iso: string) => new Date(iso).toLocaleString();

export default function AdminMessagesPage() {
  const { can } = useAuth();
  const canMarkRead = can(PERM.message.update);
  const [messages, setMessages] = useState<ContactMessageResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessageResponse | null>(null);

  const fetchMessages = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setMessages(await contactService.getAllMessages());
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleOpenMessage = async (msg: ContactMessageResponse) => {
    setSelectedMessage(msg);
    if (msg.isRead || !canMarkRead) return;
    try {
      await contactService.markAsRead(msg.id);
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, isRead: true } : m)));
      refreshAdminCounts();
    } catch (err: any) {
      toast.error(err?.message || "Failed to mark as read");
    }
  };

  const columns: ColumnDef<ContactMessageResponse>[] = [
    {
      header: "From",
      className: "w-1/4",
      cell: (msg) => (
        <div className="flex items-center gap-2.5">
          {msg.isRead ? (
            <span className="w-2 h-2 rounded-full shrink-0" />
          ) : (
            <Tooltip content="Unread" side="top">
              <span className="w-2 h-2 rounded-full shrink-0 bg-brand" role="img" aria-label="Unread" />
            </Tooltip>
          )}
          <div className="min-w-0">
            <div className={`text-zinc-900 dark:text-white ${msg.isRead ? "font-semibold" : "font-bold"}`}>{msg.name}</div>
            <div className="text-[11px] font-mono text-zinc-400">{msg.phone}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Message",
      className: "w-1/2",
      cell: (msg) => (
        <span className="block max-w-md truncate text-zinc-600 dark:text-zinc-300">{msg.question}</span>
      ),
    },
    {
      header: "Received",
      className: "w-40",
      cell: (msg) => <span className="text-zinc-500">{formatDate(msg.createdAt)}</span>,
    },
    {
      header: "Status",
      className: "w-24",
      cell: (msg) =>
        msg.isRead ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700">
            Read
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-brand/10 text-brand border border-brand/20">
            New
          </span>
        ),
    },
    {
      header: "Actions",
      className: "text-right pr-5 w-20",
      cellClassName: "text-right pr-5",
      cell: (msg) => (
        <div className="flex items-center justify-end gap-1.5">
          <RowViewButton onClick={() => handleOpenMessage(msg)} title="View Message" />
        </div>
      ),
    },
  ];

  return (
    <AdminPage
      icon={LuMail}
      title="Contact Messages"
      description="Questions customers sent from the website's help chat. Open a message to mark it as read."
      permission={PERM.message.access}
      deniedDescription="You do not have permission to view customer messages."
    >
      {error ? (
        <div className="py-8">
          <ServerErrorCard error={error} onRetry={fetchMessages} variant="inline" title="Failed to Load Messages" />
        </div>
      ) : (
        <DataTable
          data={messages}
          columns={columns}
          isLoading={isLoading}
          searchPlaceholder="Search messages by name, phone, or text..."
          searchFilter={(m, query) =>
            m.name.toLowerCase().includes(query) ||
            m.phone.includes(query) ||
            m.question.toLowerCase().includes(query)
          }
          emptyTitle="No messages yet"
          emptyDescription="Messages sent from the website's help chat will appear here."
          emptyIcon={LuInbox}
        />
      )}

      <Modal
        isOpen={!!selectedMessage}
        onOpenChange={(open) => !open && setSelectedMessage(null)}
        title={`Message from ${selectedMessage?.name ?? ""}`}
        description={selectedMessage ? `Received ${formatDate(selectedMessage.createdAt)}` : undefined}
      >
        {selectedMessage && (
          <dl className="space-y-4">
            <div>
              <dt className="text-xs font-semibold text-zinc-500 mb-1">Phone</dt>
              <dd className="text-sm font-mono text-zinc-900 dark:text-white">{selectedMessage.phone}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-zinc-500 mb-1">Question</dt>
              <dd className="text-sm text-zinc-700 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                {selectedMessage.question}
              </dd>
            </div>
          </dl>
        )}
      </Modal>
    </AdminPage>
  );
}
