import React from "react";
import { Button } from "../../components/ui/button";
import { ArrowRight, Shield } from "lucide-react";
import "./CTASection.css";

const CTASection = () => {
  return (
    <section className="cta-section">
      <div className="cta-container">
        <div className="cta-gradient">
          <div className="cta-content">
            <div className="cta-inner">
              <h2 className="cta-title">
                Ready to Take Control of
                <br />
                <span className="cta-highlight">
                  Your Financial Future?
                </span>
              </h2>
              <p className="cta-subtext">
                Join over 100,000 users who are already managing their money smarter with Finlow. Start your free trial today—no credit card required.
              </p>
              <div className="cta-buttons">
                <Button className="cta-primary-btn">
                  Start Free Trial
                  <ArrowRight className="arrow-icon" />
                </Button>
                <Button className="cta-outline-btn" variant="outline">
                  Schedule a Demo
                </Button>
              </div>
              <div className="cta-footer">
                <Shield className="shield-icon" />
                <span>Bank-level security • Free forever • No credit card required</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
