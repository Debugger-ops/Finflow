"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";  // ✅ for redirection
import { Eye, EyeOff, Mail, Lock, ArrowRight, Github } from "lucide-react";
import "./login.css";

const Login = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false); // ✅ Add this
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
 
  const handleSubmit = async () => {
    setLoading(true);

    const result = await signIn("credentials", {
      redirect: false, // important: handle redirection manually
      email: formData.email,
      password: formData.password,
    });

    setLoading(false);

    if (result?.error) {
      alert("Invalid credentials");
    } else {
      router.push("/dashboard");
    }
  };



  return (
    <div className="login-container">
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="login-logo">
            <Lock size={32} color="white" />
          </div>
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Login to your account</p>
        </div>

        {/* Form */}
        <div>
          {/* Email */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <div className="input-wrapper">
              <div className="input-icon">
                <Mail size={20} />
              </div>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="input-wrapper">
              <div className="input-icon">
                <Lock size={20} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input password-input"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot */}
          <div className="remember-forgot">
            <div className="remember-me">
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="checkbox"
              />
              <label htmlFor="rememberMe" className="checkbox-label">
                Remember me
              </label>
            </div>
            <a href="#" className="forgot-link">
              Forgot password?
            </a>
          </div>

          {/* Submit */}
          <button type="button" onClick={handleSubmit} className="submit-btn">
            <span>Login</span>
            <ArrowRight size={20} />
          </button>
        </div>

        {/* Divider */}
        <div className="divider">
          <span className="divider-text">Or continue with</span>
        </div>

        {/* Social Login */}
        <button type="button" className="social-btn">
          <Github size={20} />
          <span>Continue with GitHub</span>
        </button>

        {/* Sign up */}
        <div className="signup-section">
          <p className="signup-text">
            Don't have an account?{" "}
            <a href="/register" className="signup-link">
              Sign up
            </a>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="footer-text">
        <p className="footer-links">
          By signing in, you agree to our{" "}
          <a href="#">Terms of Service</a> and{" "}
          <a href="#">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
