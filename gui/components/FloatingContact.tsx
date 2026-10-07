"use client";

import { Tooltip } from "@/components/ui/tooltip";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { LuMessageCircle, LuX, LuSend, LuCheck } from "react-icons/lu";
import { contactService } from "@/services/contactService";
import { toast } from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { BD_PHONE_ERROR, isValidBdPhone } from "@/lib/phone";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { PERM } from "@/lib/permissions";
import { showsSiteChrome } from "@/lib/siteChrome";

export function FloatingContact() {
  const pathname = usePathname();
  const { can } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [question, setQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !question.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (!isValidBdPhone(phone)) {
      toast.error(BD_PHONE_ERROR);
      return;
    }

    setIsSubmitting(true);
    try {
      await contactService.submitMessage({ name, phone, question });
      setSubmitted(true);
    } catch {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setSubmitted(false);
      setName("");
      setPhone("");
      setQuestion("");
    }, 400);
  };

  // Shown wherever the footer is, and only to roles that may send messages
  if (!showsSiteChrome(pathname) || !can(PERM.storefront.sendMessage)) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[70] flex flex-col items-end gap-3 pointer-events-none">
      {/* Chat Panel */}
      <div
        className={`bg-white rounded-2xl shadow-2xl border border-zinc-200/80 w-80 overflow-hidden transition-all duration-300 pointer-events-auto ${
          isOpen ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95 pointer-events-none"
        }`}
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="bg-brand px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <LuMessageCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Need Help?</p>
              <p className="text-white/70 text-[10px]">We'll get back to you soon</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close help panel"
          >
            <LuX className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          {submitted ? (
            <div className="py-6 text-center flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-brand/10 flex items-center justify-center">
                <LuCheck className="w-7 h-7 text-brand" />
              </div>
              <div>
                <p className="font-bold text-zinc-900 text-sm">Message Sent!</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Thank you, {name.split(" ")[0]}! We'll be in touch shortly.
                </p>
              </div>
              <button
                onClick={handleClose}
                className="mt-1 px-5 py-2 rounded-full bg-brand text-white text-xs font-bold hover:bg-brand-hover transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Your Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Md Bahar Uddin"
                  disabled={isSubmitting}
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Phone Number</label>
                <PhoneInput
                  value={phone}
                  onChange={setPhone}
                  disabled={isSubmitting}
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Your Question</label>
                <Textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="How can we help you today?"
                  disabled={isSubmitting}
                  rows={3}
                  className="text-sm resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 rounded-xl bg-brand text-white text-sm font-bold hover:bg-brand-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  "Sending…"
                ) : (
                  <>
                    <LuSend className="w-4 h-4" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Floating Trigger Button */}
      <Tooltip content={isOpen ? "Close" : "Need help? Chat with us"} side="left">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open help chat"
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 cursor-pointer pointer-events-auto ${
          isOpen
            ? "bg-zinc-700 hover:bg-zinc-800 rotate-90"
            : "bg-brand hover:bg-brand-hover hover:scale-110"
        }`}
      >
        {isOpen ? (
          <LuX className="w-5 h-5 text-white" />
        ) : (
          <LuMessageCircle className="w-6 h-6 text-white" />
        )}
      </button>
      </Tooltip>
    </div>
  );
}

// Export a function to open the chat panel from outside (e.g. Footer)
export function openHelpChat() {
  const btn = document.querySelector<HTMLButtonElement>("[aria-label='Open help chat']");
  if (btn) btn.click();
}
