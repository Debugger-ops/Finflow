import { Check } from "lucide-react";
import { Card } from "../../components/ui/card";
import "./BenefitsSection.css";

const benefits = [
  "Save up to 30% more each month",
  "Reduce financial stress by 80%",
  "Reach savings goals 2x faster",
  "Get personalized financial advice",
  "Track investments in real-time",
  "Automate bill payments",
];

const BenefitsSection = () => {
  return (
    <section id="benefits">
      <div className="container">
        <div>
          <h2>
            Why Choose
            <br />
            <span>Finlow?</span>
          </h2>
          <p>
            Join thousands of users who have transformed their financial lives. Our platform combines
            cutting-edge technology with intuitive design to help you achieve your money goals.
          </p>

          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="benefit-item"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="benefit-icon">
                <Check />
              </div>
              <span>{benefit}</span>
            </div>
          ))}
        </div>

        <div className="stats-grid">
          <Card className="stats-card">
            <div className="value">$2.4B+</div>
            <div className="label">Total money managed</div>
          </Card>
          <Card className="stats-card">
            <div className="value">100K+</div>
            <div className="label">Active users worldwide</div>
          </Card>
          <Card className="stats-card">
            <div className="value">30%</div>
            <div className="label">Average savings increase</div>
          </Card>
          <Card className="stats-card">
            <div className="value">4.9/5</div>
            <div className="label">User satisfaction rating</div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
