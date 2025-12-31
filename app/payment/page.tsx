"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ShieldCheck, Loader2, ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import axios from "axios";
import { Suspense } from "react";

declare global {
    interface Window {
        Razorpay: any;
    }
}

function PaymentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { status } = useAuth();
    const [loading, setLoading] = useState(false);
    const [priceDisplay, setPriceDisplay] = useState("$3");
    const [currency, setCurrency] = useState("USD");
    const [amount, setAmount] = useState(300); // Default $3 in cents
    const auditId = searchParams.get("id");

    useEffect(() => {
        if (status === "unauthenticated") {
            const currentPath = window.location.pathname + window.location.search;
            router.push(`/login?callback=${encodeURIComponent(currentPath)}`);
        }
    }, [status, router]);

    useEffect(() => {
        // Load Razorpay script
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);

        // Detect user location for pricing
        const checkLocation = async () => {
            try {
                const res = await fetch('https://ipapi.co/json/');
                const data = await res.json();
                if (data.country_code === 'IN') {
                    setPriceDisplay("₹249");
                    setCurrency("INR");
                    setAmount(24900); // ₹249 * 100 paise
                }
            } catch (error) {
                console.warn('Geolocation failed, defaulting to USD:', error);
            }
        };
        checkLocation();

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    const handlePayment = async () => {
        if (!auditId) {
            alert("No audit found to pay for.");
            return;
        }

        setLoading(true);
        try {
            const orderRes = await axios.post("/api/payment/create-order", {
                auditId,
                amount: amount,
                currency: currency,
            });

            const { order } = orderRes.data;

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: "Conversion Lab",
                description: "Full Conversion Engineering Report",
                order_id: order.id,
                handler: async function (response: any) {
                    try {
                        const verifyRes = await axios.post("/api/payment/verify", {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            audit_id: auditId,
                        });

                        if (verifyRes.data.success) {
                            router.push(`/dashboard/report?id=${auditId}`);
                        }
                    } catch (err: any) {
                        console.error("Verification failed:", err);
                        alert("Payment verification failed. Please contact support.");
                        setLoading(false);
                    }
                },
                prefill: {
                    name: "",
                    email: "",
                },
                theme: {
                    color: "#000000",
                },
                modal: {
                    ondismiss: function () {
                        setLoading(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error: any) {
            console.error("Payment failed:", error);
            alert("Failed to initiate payment. Please try again.");
            setLoading(false);
        }
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
            </div>
        );
    }

    if (!auditId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
                <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 p-8 text-center max-w-md w-full">
                    <h2 className="text-xl font-bold mb-4">No Audit Selected</h2>
                    <p className="text-zinc-400 mb-6">Please start an audit from the dashboard first.</p>
                    <Button onClick={() => router.push("/dashboard")} className="bg-white text-black hover:bg-zinc-200">
                        Go to Dashboard
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
            <div className="w-full max-w-md space-y-4 animate-in fade-in zoom-in duration-500">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        if (auditId) {
                            router.push(`/dashboard/report?id=${auditId}`);
                        } else {
                            router.push("/dashboard");
                        }
                    }}
                    className="text-zinc-400 hover:text-white hover:bg-zinc-900 -ml-2"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Report
                </Button>

                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Secure Checkout</h1>
                    <p className="text-zinc-400">Unlock your full conversion report instantly.</p>
                </div>

                <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 overflow-hidden relative shadow-2xl">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500" />
                    <CardHeader className="pb-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-xl font-bold">Full Conversion Audit</CardTitle>
                                <CardDescription className="text-zinc-400">One-time purchase • Lifetime access</CardDescription>
                            </div>
                            <div className="text-3xl font-bold">{priceDisplay}</div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <ul className="space-y-3 text-sm">
                            <li className="flex gap-3 text-zinc-300">
                                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                                <span>11-Point Conversion Analysis</span>
                            </li>
                            <li className="flex gap-3 text-zinc-300">
                                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                                <span>Specific Engineering Fixes</span>
                            </li>
                            <li className="flex gap-3 text-zinc-300">
                                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                                <span>Quick Wins Checklist (24h Impact)</span>
                            </li>
                            <li className="flex gap-3 text-zinc-300">
                                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                                <span>PDF Download & Print Support</span>
                            </li>
                        </ul>

                        <div className="pt-4 space-y-4">
                            <Button
                                onClick={handlePayment}
                                className="w-full h-14 bg-white text-black hover:bg-zinc-200 font-bold text-lg"
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Processing...</span>
                                    </div>
                                ) : `Pay ${priceDisplay} & Unlock Report`}
                            </Button>

                            <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
                                <ShieldCheck className="w-4 h-4" />
                                <span>Secure SSL Encrypted Payment</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <p className="text-center text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
                    30-day money-back guarantee • Instant Delivery
                </p>
            </div>
        </div>
    );
}

export default function PaymentPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
            </div>
        }>
            <PaymentContent />
        </Suspense>
    );
}
