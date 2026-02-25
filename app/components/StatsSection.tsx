import "./statssection.css";

const stats = [
  {
    number: "$2.4B+",
    label: "Transaction Volume",
    description: "Processed securely"
  },
  {
    number: "10,000+",
    label: "Active Businesses",
    description: "Trust our platform"
  },
  {
    number: "99.99%",
    label: "Uptime Guarantee",
    description: "Always available"
  },
  {
    number: "180+",
    label: "Countries Supported",
    description: "Global reach"
  }
];

const socialProofLogos = [
  "TechCrunch",
  "Forbes", 
  "Wall Street Journal",
  "Financial Times"
];

const StatsSection = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-muted/50 to-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Trusted by businesses
            <span className="gradient-text"> worldwide</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Join thousands of companies that rely on FinFlow for their financial operations
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="stats-card animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="stats-number text-3xl md:text-4xl font-bold mb-2">{stat.number}</div>
              <div className="stats-label text-lg font-semibold mb-1">{stat.label}</div>
              <div className="stats-description text-sm opacity-80">{stat.description}</div>
            </div>
          ))}
        </div>

        {/* Social Proof */}
        <div className="social-proof-section mt-16 text-center">
          <p className="text-muted-foreground mb-8">Featured in</p>
          <div className="social-grid grid grid-cols-2 md:grid-cols-4 gap-8 opacity-60">
            {socialProofLogos.map((logo, index) => (
              <div key={index} className="social-logo text-lg font-semibold">
                {logo}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;