"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/auth-provider";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertTriangle, Trash2 } from "lucide-react";
import axios from "axios";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
    const { session } = useAuth();
    const router = useRouter();
    const [name, setName] = useState(session?.user?.name || "");
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSaveName = async () => {
        if (!name.trim()) return;
        setIsSaving(true);
        setSaveMessage(null);
        try {
            const res = await axios.post("/api/user/update", { name });
            if (res.data.success) {
                setSaveMessage({ type: 'success', text: 'Display name updated!' });
                router.refresh();
            }
        } catch (error: any) {
            console.error("Failed to update name:", error);
            setSaveMessage({ type: 'error', text: error.response?.data?.error || 'Failed to update name' });
        } finally {
            setIsSaving(false);
        }
    };

    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const handleDeleteAccount = async () => {
        if (!confirmDelete) {
            setConfirmDelete(true);
            return;
        }

        setIsDeleting(true);
        try {
            console.log("Settings: Initiating account deletion");
            const res = await axios.delete("/api/user/delete");

            if (res.data.success) {
                // Clear all local auth data aggressively
                if (typeof window !== 'undefined') {
                    window.localStorage.clear();
                    window.sessionStorage.clear();

                    // Expire all cookies (simple way)
                    document.cookie.split(";").forEach((c) => {
                        document.cookie = c
                            .replace(/^ +/, "")
                            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                    });
                }

                console.log("Settings: Account deleted, redirecting...");
                window.location.href = "/";
            }
        } catch (error) {
            console.error("Failed to delete account:", error);
            alert("Failed to delete account. Please try again or contact support.");
            setIsDeleting(false);
            setConfirmDelete(false);
        }
    };

    return (
        <div className="space-y-8 max-w-2xl animate-in fade-in duration-500">
            <h1 className="text-3xl font-bold text-zinc-900">Account Settings</h1>

            <Card className="bg-white border-zinc-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg text-zinc-900">Profile Information</CardTitle>
                    <CardDescription className="text-zinc-500">Update your account details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Display Name</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your Name"
                            className="bg-white border-zinc-200 text-zinc-900 focus-visible:ring-purple-500"
                        />
                    </div>
                    <div className="grid gap-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Email Address</label>
                        <Input value={session?.user?.email || ""} disabled className="bg-zinc-50 border-zinc-200 text-zinc-500 cursor-not-allowed" />
                        <p className="text-xs text-zinc-400">Email cannot be changed.</p>
                    </div>
                    <div className="pt-2 flex items-center gap-4">
                        <Button
                            onClick={handleSaveName}
                            disabled={isSaving || !name.trim()}
                            className="bg-zinc-900 text-white hover:bg-zinc-800"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Save Changes
                        </Button>
                        {saveMessage && (
                            <span className={cn(
                                "text-sm font-medium animate-in fade-in slide-in-from-left-2",
                                saveMessage.type === 'success' ? "text-green-600" : "text-red-600"
                            )}>
                                {saveMessage.text}
                            </span>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-red-50/30 border-red-100 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-red-700 text-base">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <p className="text-zinc-700 font-bold text-sm">Delete Account</p>
                        <p className="text-zinc-500 text-xs">This action is permanent and cannot be undone.</p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {confirmDelete ? (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setConfirmDelete(false)}
                                    disabled={isDeleting}
                                    className="text-zinc-500 hover:text-zinc-900"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleDeleteAccount}
                                    disabled={isDeleting}
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold gap-2 px-4"
                                >
                                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    Confirm Delete
                                </Button>
                            </>
                        ) : (
                            <Button
                                variant="destructive"
                                onClick={() => setConfirmDelete(true)}
                                className="bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:text-red-700 shadow-sm font-bold w-full sm:w-auto"
                            >
                                Delete My Account
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
