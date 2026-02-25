"use client";
import React, { useState } from 'react';
import { CreditCard, ArrowLeft, Check, Lock } from 'lucide-react';
import './addCard.css';
import { useRouter } from "next/navigation";

const AddCard: React.FC = () => {
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });
  const [isSuccess, setIsSuccess] = useState(false);
  const [cardType, setCardType] = useState('');
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;

    if (name === 'cardNumber') {
      value = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      value = value.slice(0, 19);

      if (value.startsWith('4')) setCardType('visa');
      else if (value.startsWith('5')) setCardType('mastercard');
      else if (value.startsWith('3')) setCardType('amex');
      else setCardType('');
    }

    if (name === 'expiryDate') {
      value = value.replace(/\D/g, '');
      if (value.length >= 2) {
        value = value.slice(0, 2) + '/' + value.slice(2, 4);
      }
      value = value.slice(0, 5);
    }

    if (name === 'cvv') {
      value = value.replace(/\D/g, '').slice(0, 4);
    }

    if (name === 'cardName') {
      value = value.toUpperCase();
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(false);

    try {
      const res = await fetch("/api/cards/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to add card");

      setIsSuccess(true);

      setTimeout(() => {
        setIsSuccess(false);
        setFormData({ cardNumber: '', cardName: '', expiryDate: '', cvv: '' });
        setCardType('');
        router.push("/dashboard");
      }, 2000);
    } catch (error) {
      alert("Failed to add card");
      console.error(error);
    }
  };

  const cardBrandLabel: Record<string, string> = {
    visa: 'VISA',
    mastercard: 'MC',
    amex: 'AMEX',
  };

  return (
    <div className="add-card-container">
      <div className="add-card-header">
        <button
          className="back-button"
          onClick={() => router.push("/dashboard")}
          aria-label="Go back to dashboard"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="page-title">Add Card</h1>
      </div>

      {isSuccess && (
        <div className="success-message">
          <Check size={20} />
          <span>Card added successfully!</span>
        </div>
      )}

      <div className="add-card-content">
        {/* Card Preview */}
        <div className="card-preview">
          <div className={`credit-card ${cardType}`}>
            <div className="card-chip" />
            <div className="card-number">
              {formData.cardNumber || '•••• •••• •••• ••••'}
            </div>
            <div className="card-details">
              <div className="card-holder">
                <span className="card-label">Card Holder</span>
                <span className="card-value">{formData.cardName || 'YOUR NAME'}</span>
              </div>
              <div className="card-expiry">
                <span className="card-label">Expires</span>
                <span className="card-value">{formData.expiryDate || 'MM/YY'}</span>
              </div>
            </div>
            <div className="card-brand">
              {cardType ? cardBrandLabel[cardType] : ''}
            </div>
          </div>
        </div>

        {/* Form */}
        <form className="add-card-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="cardNumber">Card Number</label>
            <div className="input-wrapper">
              <CreditCard className="input-icon" size={20} />
              <input
                type="text"
                id="cardNumber"
                name="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={formData.cardNumber}
                onChange={handleInputChange}
                inputMode="numeric"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="cardName">Cardholder Name</label>
            <input
              type="text"
              id="cardName"
              name="cardName"
              placeholder="JOHN DOE"
              value={formData.cardName}
              onChange={handleInputChange}
              autoComplete="cc-name"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="expiryDate">Expiry Date</label>
              <input
                type="text"
                id="expiryDate"
                name="expiryDate"
                placeholder="MM/YY"
                value={formData.expiryDate}
                onChange={handleInputChange}
                inputMode="numeric"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="cvv">CVV</label>
              <input
                type="password"
                id="cvv"
                name="cvv"
                placeholder="•••"
                value={formData.cvv}
                onChange={handleInputChange}
                inputMode="numeric"
                autoComplete="cc-csc"
                required
              />
            </div>
          </div>

          <div className="security-note">
            <Lock size={16} />
            <span>Your card information is encrypted and secure</span>
          </div>

          <button type="submit" className="submit-button submit-button-emerald">
            <CreditCard size={20} />
            <span>Add Card</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddCard;