'use client';
import { useEffect, useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import Link from 'next/link';
import './landing.css';

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="landing">
      {/* Nav */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-logo">
          <div className="nav-logo-icon">L</div>
          <span className="gradient-text">Lexora</span>
        </div>
        <div className="nav-links">
          <a href="#features" className="nav-link">Features</a>
        </div>
        <div className="nav-actions">
          <button className="btn btn-ghost btn-icon" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <Link href="/login" className="btn btn-ghost">Sign In</Link>
          <Link href="/register" className="btn btn-primary">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-content animate-fade-in">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            100% Free & Open Source
          </div>
          <h1>
            Learn Together,<br />
            <span className="gradient-text">Build Knowledge</span>
          </h1>
          <p className="hero-subtitle">
            A collaborative workspace for teams and learners. Notion-style notebooks,
            real-time editing, vocabulary tracking, and powerful role management.
            No catch, no credit card — just learning.
          </p>
          <div className="hero-actions">
            <Link href="/register" className="btn btn-primary btn-lg">
              Get Started for Free →
            </Link>
            <Link href="#features" className="btn btn-secondary btn-lg">
              See Features
            </Link>
          </div>
          <div className="hero-stats stagger-children">
            <div className="hero-stat animate-slide-up">
              <div className="hero-stat-value gradient-text">10K+</div>
              <div className="hero-stat-label">Active Users</div>
            </div>
            <div className="hero-stat animate-slide-up">
              <div className="hero-stat-value gradient-text">50K+</div>
              <div className="hero-stat-label">Notebooks Created</div>
            </div>
            <div className="hero-stat animate-slide-up">
              <div className="hero-stat-value gradient-text">99.9%</div>
              <div className="hero-stat-label">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features" id="features">
        <div className="section-header">
          <div className="section-tag">Features</div>
          <h2 className="section-title">Everything you need to learn smarter</h2>
          <p className="section-desc">
            Powerful tools designed for collaborative learning, research, and knowledge management.
          </p>
        </div>
        <div className="features-grid stagger-children">
          <div className="feature-card animate-slide-up">
            <div className="feature-icon purple">📝</div>
            <h3>Notion-Style Notebooks</h3>
            <p>Block-based editor with rich content types — text, headings, checklists, images, and stickers. Organize with sections.</p>
          </div>
          <div className="feature-card animate-slide-up">
            <div className="feature-icon blue">⚡</div>
            <h3>Real-Time Collaboration</h3>
            <p>Work together in the same notebook. See live changes with WebSocket-powered sync and presence indicators.</p>
          </div>
          <div className="feature-card animate-slide-up">
            <div className="feature-icon green">📖</div>
            <h3>Vocabulary Tracker</h3>
            <p>Build your word bank with English/Spanish translations, verb forms, pronunciation guides, and example sentences.</p>
          </div>
          <div className="feature-card animate-slide-up">
            <div className="feature-icon orange">🔐</div>
            <h3>Role-Based Access</h3>
            <p>Owner, Editor, and Viewer roles per workspace. Fine-grained control over who can see and edit your content.</p>
          </div>
          <div className="feature-card animate-slide-up">
            <div className="feature-icon pink">📊</div>
            <h3>Activity Timeline</h3>
            <p>Full audit trail of every change. Track who edited what, when, and see the complete history of your workspace.</p>
          </div>
          <div className="feature-card animate-slide-up">
            <div className="feature-icon teal">🏢</div>
            <h3>Multi-Workspace</h3>
            <p>Create separate workspaces for different teams or projects. Invite members and manage everything from one dashboard.</p>
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="nav-logo">
            <div className="nav-logo-icon">L</div>
            <span className="gradient-text">Lexora</span>
          </div>
          <p className="footer-copy">© 2026 Lexora. All rights reserved.</p>
          <div className="footer-links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
