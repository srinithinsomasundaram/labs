"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, CheckCircle, Loader2, Sparkles, Search, TrendingUp, Target, Eye, DollarSign, Shield, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { AuditResult, AuditResultData } from "@/components/audit-result";
import { AuditLoading } from "@/components/audit-loading";
import { Logo } from "@/components/logo";
import axios from "axios";

export default function Home() {
  const router = useRouter();
  const { status } = useAuth();
  const [step, setStep] = useState<"input" | "scanning" | "preview" | "success">("input");

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);
  const [url, setUrl] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);
  const [auditResult, setAuditResult] = useState<AuditResultData | null>(null);
  const [auditId, setAuditId] = useState<string | null>(null);
  const [proPrice, setProPrice] = useState({ display: "$3", currency: "USD", amount: 300 });
  const [auditPrice, setAuditPrice] = useState({ display: "$3", currency: "USD", amount: 300 });

  useEffect(() => {
    const checkLocation = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data.country_code === 'IN') {
          setProPrice({ display: "₹249", currency: "INR", amount: 24900 });
          setAuditPrice({ display: "₹249", currency: "INR", amount: 24900 });
        }
      } catch (error) {
        console.warn('Geolocation failed, defaulting to USD:', error);
      }
    };
    checkLocation();
  }, []);

  const scanSteps = [
    "Connecting to site...",
    "Analyzing headline effectiveness...",
    "Detecting trust signals...",
    "Reviewing mobile responsiveness...",
    "Generating conversion score...",
  ];

  const handleAudit = async () => {
    if (!url) return;

    setStep("scanning");
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < scanSteps.length - 1 ? prev + 1 : prev));
    }, 1500);

    try {
      const response = await axios.post("/api/audit", { url });
      clearInterval(stepInterval);
      setAuditResult(response.data.auditResult);
      setAuditId(response.data.auditId);
      setStep("preview");
    } catch (error) {
      clearInterval(stepInterval);
      setStep("input");
      alert("Failed to audit. Please check URL.");
      console.error(error);
    }
  };

  const handleUnlock = () => {
    if (auditId) {
      router.push(`/signup?auditId=${auditId}&callback=${encodeURIComponent(`/payment?id=${auditId}`)}`);
    } else {
      router.push("/signup");
    }
  };

  if (step === "scanning") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <AuditLoading
          title={scanSteps[loadingStep]}
          subtitle="Analyzing your website's conversion potential..."
          progress={((loadingStep + 1) / scanSteps.length) * 100}
        />
      </div>
    );
  }

  if ((step === "preview" || step === "success") && auditResult) {
    return (
      <div className="min-h-screen bg-white">
        <nav className="sticky top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Logo showText textClassName="font-bold text-lg tracking-tight text-zinc-900" />
            </div>
          </div>
        </nav>

        <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <AuditResult
            result={auditResult}
            isUnlocked={step === "success"}
            onUnlock={handleUnlock}
            mode={step === "preview" ? "preview" : "dashboard"}
            url={url}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {/* Navbar */}
      <nav className="sticky top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo showText textClassName="font-bold text-lg tracking-tight text-zinc-900" />

            <div className="hidden md:flex items-center gap-6">
              <a href="#pricing" className="text-zinc-500 hover:text-zinc-900 font-medium transition-colors">Pricing</a>
              <Button variant="ghost" className="text-zinc-500 hover:text-zinc-900 font-medium" onClick={() => router.push('/login')}>Login</Button>
           
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 border border-purple-100 text-purple-700 text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Conversion Optimization</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-zinc-900 leading-[1.1]">
            Turn Your Website Into a{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
              Conversion Machine
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-zinc-500 max-w-3xl mx-auto leading-relaxed">
            Get an AI-powered audit of your landing page in seconds. Discover exactly what's blocking conversions and how to fix it.
          </p>

          {/* Input */}
          <div className="max-w-2xl mx-auto mt-12">
            <div className="bg-white p-2 rounded-2xl shadow-2xl shadow-zinc-900/5 border border-zinc-200 flex flex-col md:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
                <Input
                  type="url"
                  placeholder="https://yourwebsite.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pl-12 h-16 w-full border-0 bg-transparent text-lg placeholder:text-zinc-400 focus-visible:ring-0 shadow-none text-zinc-900"
                  onKeyDown={(e) => e.key === "Enter" && handleAudit()}
                />
              </div>
              <Button
                size="lg"
                onClick={handleAudit}
                disabled={!url}
                className="h-16 px-8 text-lg font-bold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-95"
              >
                Analyze My Website <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
            <p className="text-sm text-zinc-400 mt-4">✨ No signup required • Free preview in 30 seconds</p>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-zinc-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-zinc-900 mb-6">
              Your Website is Leaking Revenue
            </h2>
            <p className="text-xl text-zinc-500 max-w-2xl mx-auto">
              Most websites convert less than 2% of visitors. That means 98 out of 100 people leave without taking action.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">Unclear Value Proposition</h3>
              <p className="text-zinc-500">Visitors don't understand what you offer or why it matters to them.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">Missing Trust Signals</h3>
              <p className="text-zinc-500">No social proof, testimonials, or credibility markers to build confidence.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">Weak Call-to-Actions</h3>
              <p className="text-zinc-500">Generic CTAs that don't create urgency or clearly state the next step.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-zinc-900 mb-6">
              Engineered for Revenue, Not Guesswork
            </h2>
            <p className="text-xl text-zinc-500 max-w-2xl mx-auto">
              Our AI analyzes your landing page against 20+ proven conversion heuristics used by top-performing SaaS companies.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 mb-1">Clarity Analysis</h3>
                  <p className="text-zinc-500">Is your headline clear? Does it communicate value in 5 seconds?</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 mb-1">Trust & Credibility</h3>
                  <p className="text-zinc-500">Scans for social proof, testimonials, and authority signals.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 mb-1">Urgency & Scarcity</h3>
                  <p className="text-zinc-500">Identifies missing urgency triggers that drive action.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 mb-1">Mobile Experience</h3>
                  <p className="text-zinc-500">Checks responsive design and mobile-first optimization.</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-8 rounded-2xl border border-purple-100">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Eye className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">Conversion Score</p>
                    <p className="text-2xl font-bold text-zinc-900">8.2/10</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600">Clarity</span>
                    <span className="font-medium text-green-600">Strong</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600">Trust Signals</span>
                    <span className="font-medium text-yellow-600">Moderate</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600">Call-to-Action</span>
                    <span className="font-medium text-red-600">Weak</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-zinc-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-zinc-900 mb-6">
              What You Get
            </h2>
            <p className="text-xl text-zinc-500 max-w-2xl mx-auto">
              A complete conversion engineering blueprint, not just generic advice.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-2">11-Point Checklist</h3>
              <p className="text-zinc-500 text-sm">Actionable fixes ranked by impact and ease of implementation.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-2">AI Copy Rewrites</h3>
              <p className="text-zinc-500 text-sm">Better headlines, CTAs, and value propositions written for you.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-2">Competitor Analysis</h3>
              <p className="text-zinc-500 text-sm">See how your page stacks up against industry leaders.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-2">Action Plan</h3>
              <p className="text-zinc-500 text-sm">Step-by-step implementation guide prioritized by ROI.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-zinc-900 mb-6">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-zinc-500 max-w-2xl mx-auto">
              Start with a one-time audit, upgrade when you need ongoing optimization.
            </p>
          </div>

          <div className="flex justify-center">
            {/* One-Time Audit */}
            <div className="bg-white p-8 rounded-2xl border-2 border-zinc-200 shadow-sm">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-zinc-900 mb-2">One-Time Audit</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-zinc-900">{auditPrice.display}</span>
                  <span className="text-zinc-500">one-time</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-zinc-600">Full conversion audit report</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-zinc-600">11-point actionable checklist</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-zinc-600">Competitor analysis</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-zinc-600">PDF export</span>
                </li>
              </ul>

              <Button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold">
                Get Your Audit
              </Button>
            </div>

          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-zinc-50">
        <div className="max-w-6xl mx-auto text-center space-y-6">
          <p className="text-sm font-semibold tracking-[0.3em] uppercase text-zinc-500">
            Trusted by 100+ high-growth SaaS teams
          </p>
          <h3 className="text-3xl md:text-4xl font-bold text-zinc-900">
            Proven conversion lifts across every stage of your funnel
          </h3>
          <p className="text-zinc-500 max-w-3xl mx-auto">
            From seed-stage founders to public SaaS leaders, over one hundred companies
            rely on Conversion Engineering Lab to find—and fix—hidden leaks before they
            slow growth.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold text-zinc-900">
            Ready to Stop Leaking Revenue?
          </h2>
          <p className="text-xl text-zinc-500 max-w-2xl mx-auto">
            Get your conversion audit in 30 seconds. No signup required for preview.
          </p>

          <div className="max-w-2xl mx-auto">
            <div className="bg-white p-2 rounded-2xl shadow-2xl shadow-zinc-900/5 border border-zinc-200 flex flex-col md:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
                <Input
                  type="url"
                  placeholder="https://yourwebsite.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pl-12 h-16 w-full border-0 bg-transparent text-lg placeholder:text-zinc-400 focus-visible:ring-0 shadow-none text-zinc-900"
                  onKeyDown={(e) => e.key === "Enter" && handleAudit()}
                />
              </div>
              <Button
                size="lg"
                onClick={handleAudit}
                disabled={!url}
                className="h-16 px-8 text-lg font-bold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-95"
              >
                Start Free Audit <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 py-12 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-zinc-500">
          <p>&copy; 2025 Conversion Engineering Lab. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-zinc-900 transition-colors">Privacy</a>
            <a href="#" className="hover:text-zinc-900 transition-colors">Terms</a>
            <a href="#" className="hover:text-zinc-900 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
