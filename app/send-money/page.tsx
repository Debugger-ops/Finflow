"use client";
import React, { useState } from 'react';
import { Send, User, DollarSign, ArrowLeft, Check } from 'lucide-react';
import './sendMoney.css';
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
const SendMoney: React.FC = () => {
  const [formData, setFormData] = useState({
    recipient: '',
    amount: '',
    note: '',
  });
  const [loading, setLoading] = useState(false);
   const router = useRouter();
   const { data: session, status } = useSession();

  if (status === "loading") return <p>Loading...</p>;
  if (!session) {
    router.push("/login"); // redirect to login if not logged in
    return null;
  }
  const [isSuccess, setIsSuccess] = useState(false);
  
  const recentContacts = [
    { id: 1, name: 'John Doe', email: 'john@example.com', avatar: 'JD' },
    { id: 2, name: 'Sarah Smith', email: 'sarah@example.com', avatar: 'SS' },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', avatar: 'MJ' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (loading) return;

  setLoading(true);

  try {
    const res = await fetch("/api/transactions/send", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    recipient: formData.recipient,
    amount: Number(formData.amount),
    note: formData.note,
  }),
  credentials: "include", // ✅ Include cookies for authentication
});


    if (!res.ok) throw new Error("Failed");

    setIsSuccess(true);

    setTimeout(() => {
      setIsSuccess(false);
      setFormData({ recipient: "", amount: "", note: "" });
      router.push("/dashboard");
    }, 2000);

  } catch {
    alert("Transaction failed");
  } finally {
    setLoading(false);
  }
};


  const selectContact = (email: string) => {
    setFormData({ ...formData, recipient: email });
  };

  return (
    <div className="send-money-container">
      <div className="send-money-header">
       <button
  className="back-button"
  onClick={() => router.push("/dashboard")}
>
  <ArrowLeft size={20} />
</button>
        <h1 className="page-title">Send Money</h1>
      </div>

      {isSuccess && (
        <div className="success-message">
          <Check size={20} />
          <span>Money sent successfully!</span>
        </div>
      )}

      <div className="send-money-content">
        <div className="recent-contacts">
          <h2 className="section-title">Recent Contacts</h2>
          <div className="contacts-list">
            {recentContacts.map((contact) => (
              <button
                key={contact.id}
                className="contact-item"
                onClick={() => selectContact(contact.email)}
              >
                <div className="contact-avatar">{contact.avatar}</div>
                <div className="contact-info">
                  <span className="contact-name">{contact.name}</span>
                  <span className="contact-email">{contact.email}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <form className="send-money-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="recipient">Recipient</label>
            <div className="input-wrapper">
              <User className="input-icon" size={20} />
              <input
                type="email"
                id="recipient"
                name="recipient"
                placeholder="Enter email or phone number"
                value={formData.recipient}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="amount">Amount</label>
            <div className="input-wrapper">
              <DollarSign className="input-icon" size={20} />
              <input
                type="number"
                id="amount"
                name="amount"
                placeholder="0.00"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="note">Note (Optional)</label>
            <textarea
              id="note"
              name="note"
              placeholder="What's this for?"
              rows={3}
              value={formData.note}
              onChange={handleInputChange}
            />
          </div>

         <button type="submit" className="submit-button" disabled={loading}>
  <Send size={20} />
  <span>{loading ? "Sending..." : "Send Money"}</span>
</button>

        </form>
      </div>
    </div>
  );
};

export default SendMoney;