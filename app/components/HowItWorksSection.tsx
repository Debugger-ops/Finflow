import { Download, Link2, BarChart3 } from "lucide-react";
import "./HowItWorksSection.css";

const steps = [
  {
    icon: Download,
    number: "01",
    title: "Download & Sign Up",
    description: "Get started in seconds with our simple onboarding process. No credit card required.",
  },
  {
    icon: Link2,
    number: "02",
    title: "Connect Your Accounts",
    description: "Securely link your bank accounts and credit cards with bank-level encryption.",
  },
  {
    icon: BarChart3,
    number: "03",
    title: "Track & Optimize",
    description: "Watch your financial insights come to life and start making smarter money decisions.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works">
      <div className="container">
        <div className="header">
          <h2>
            Getting Started is
            <br />
            <span>Simple & Quick</span>
          </h2>
          <p>
            Join thousands of users who transformed their financial life in just 3 easy steps.
          </p>
        </div>

        <div className="steps-grid">
          {steps.map((step, index) => (
            <div
              key={index}
              className="step"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="step-icon">
                <step.icon />
              </div>
              <div className="step-number">
                <span>{step.number}</span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
