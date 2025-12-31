"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, ShieldCheck, CheckCircle, Loader2, ArrowLeft, Activity, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import axios from "axios";

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function UpgradePage() {
    const router = useRouter();
    const { session, status } = useAuth();
    const [loading, setLoading] = useState(false);
    const [proPrice, setProPrice] = useState({ display: "$3", currency: "USD", amount: 300 });

    useEffect(() => {
        const checkLocation = async () => {
            try {
                const res = await fetch('https://ipapi.co/json/');
                const data = await res.json();
                if (data.country_code === 'IN') {
                    setProPrice({ display: "₹249", currency: "INR", amount: 24900 });
                }
            } catch (error) {
                console.warn('Geolocation failed, defaulting to USD:', error);
            }
        };
        checkLocation();
    }, []);

    useEffect(() => {
        if (status === 'unauthenticated') {
            const destination = typeof window !== 'undefined'
                ? window.location.pathname + window.location.search
                : '/upgrade';
            router.push(`/login?callback=${encodeURIComponent(destination)}`);
        }
    }, [status, router]);

    useEffect(() => {
        // Load Razorpay script
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);

        return () => {
            // Safety check before removing
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    const handleUpgrade = async () => {
        if (status !== 'authenticated') {
            const destination = typeof window !== 'undefined'
                ? window.location.pathname + window.location.search
                : '/upgrade';
            router.push(`/login?callback=${encodeURIComponent(destination)}`);
            return;
        }

        setLoading(true);
        try {
            const orderRes = await axios.post("/api/payment/create-pro-order", {
                amount: proPrice.amount,
                currency: proPrice.currency
            });
            const { order } = orderRes.data;

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: "Conversion Lab Pro",
                description: "Monthly membership",
                order_id: order.id,
                handler: async function (response: any) {
                    try {
                        const verifyRes = await axios.post("/api/payment/verify", {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            upgrade: true,
                        });

                        if (verifyRes.data.success) {
                            window.location.href = "/dashboard?upgraded=true";
                        }
                    } catch (err) {
                        console.error("Verification failed:", err);
                        alert("Verification failed. Please contact support.");
                    }
                },
                prefill: {
                    name: "",
                    email: session?.user?.email || "",
                },
                theme: {
                    color: "#000000",
                },
                modal: {
                    ondismiss: () => setLoading(false),
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error: any) {
            console.error("Upgrade failed:", error);
            const errorMsg = error.response?.data?.error || "Failed to initiate upgrade. Please try again.";
            alert(errorMsg);
            setLoading(false);
        }
    };


    if (status === 'loading' || status === 'unauthenticated') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <p className="text-sm text-zinc-400">Preparing secure upgrade flow...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4 relative">
            <div className="absolute top-8 left-8">
                <Button
                    variant="ghost"
                    className="text-zinc-400 hover:text-white gap-2 transition-colors"
                    onClick={() => router.push("/dashboard")}
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Button>
            </div>

            <div className="w-full max-w-4xl grid md:grid-cols-2 gap-12 items-center">

                <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-sm font-bold uppercase tracking-wider">
                        <Zap className="w-4 h-4 fill-current" /> Pro Access
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                        Unlock the full <br />
                        <span className="bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">Conversion Toolkit.</span>
                    </h1>
                    <p className="text-lg text-zinc-400">
                        Stop guessing. Get unlimited audits and AI-generated landing page copy that actually sells.
                    </p>

                    <div className="space-y-4 pt-6">
                        {/* Featured: Unlimited Audits */}
                        <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-lg bg-purple-500/30 flex items-center justify-center shrink-0">
                                    <Activity className="w-5 h-5 text-purple-300" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg mb-1">Unlimited Website Audits</h3>
                                    <p className="text-zinc-300 text-sm">Run as many audits as you need. No limits, no extra charges. Analyze every page of your site.</p>
                                </div>
                            </div>
                        </div>

                        {/* Featured: AI Copy Generator */}
                        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/20 to-blue-500/20 border border-indigo-500/30">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-lg bg-indigo-500/30 flex items-center justify-center shrink-0">
                                    <Sparkles className="w-5 h-5 text-indigo-300 fill-current" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg mb-1">AI Copy Generator</h3>
                                    <p className="text-zinc-300 text-sm">Get high-converting headlines, CTAs, and subheadings written by AI. Save hours of copywriting.</p>
                                </div>
                            </div>
                        </div>

                        {/* Standard Features */}
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                                <span className="text-zinc-200 font-medium">Full Conversion Reports</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                                <span className="text-zinc-200 font-medium">Priority PDF Downloads</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                                <span className="text-zinc-200 font-medium">Advanced Analytics Dashboard</span>
                            </div>
                        </div>
                    </div>
                </div>

                <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 overflow-hidden relative shadow-2xl shadow-purple-900/20">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500" />
                    <CardHeader className="pb-4 text-center pt-8">
                        <CardTitle className="text-xl font-bold text-zinc-400 uppercase tracking-widest">Pro Monthly</CardTitle>
                        <div className="flex justify-center items-baseline gap-1 mt-4">
                            <span className="text-6xl font-black text-white">{proPrice.display}</span>
                            <span className="text-zinc-500 text-xl">/month</span>
                        </div>
                        <CardDescription className="text-zinc-400 mt-2">Cancel anytime. No contracts.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8 pb-8 px-8">
                        <Button onClick={handleUpgrade} className="w-full h-14 bg-white text-black hover:bg-zinc-200 font-bold text-xl rounded-full shadow-lg shadow-white/10 transition-transform hover:scale-105" disabled={loading || status !== 'authenticated'}>
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Processing...</span>
                                </div>
                            ) : "Upgrade Now"}
                        </Button>

                        <div className="text-center text-xs text-zinc-500 space-y-3">
                            <div className="space-y-1 text-zinc-400">
                                <p className="font-medium text-zinc-300">Unlocks:</p>
                                <p>• Unlimited Website Audits</p>
                                <p>• AI Copy Generator (Headlines &amp; CTAs)</p>
                                <p>• Competitor Analysis Spy</p>
                                <p>• Priority PDF Reports</p>
                            </div>
                        </div>

                        <div className="text-center space-y-2">
                            <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
                                <ShieldCheck className="w-3 h-3" />
                                <span>Secured by Razorpay</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
