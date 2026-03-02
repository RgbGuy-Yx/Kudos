import Image from "next/image";
import Link from "next/link";

export default function Footer() {
    return (
        <footer className="relative overflow-hidden px-6 md:px-16 lg:px-24 xl:px-32 w-full text-sm text-slate-500 bg-white pt-10">
            <Image
                src="/assets/logo.svg"
                alt="Logo"
                width={400}
                height={400}
                className="hidden md:block absolute -bottom-30 -left-80 opacity-5 w-full h-full pointer-events-none"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-14">
                <div className="sm:col-span-2 lg:col-span-1">
                    <h3 className="text-xl font-bold text-gray-900">Kudos</h3>
                    <p className="text-sm/7 mt-6">Kudos enables transparent student grant funding through milestone-based escrow on Algorand with sponsor approval workflows.</p>
                </div>
                <div className="flex flex-col lg:items-center lg:justify-center">
                    <div className="flex flex-col text-sm space-y-2.5">
                        <h2 className="font-semibold mb-5 text-gray-800">Platform</h2>
                        <Link className="hover:text-slate-600 transition" href="/signup">Create account</Link>
                        <Link className="hover:text-slate-600 transition" href="/login">Connect wallet</Link>
                        <Link className="hover:text-slate-600 transition" href="/dashboard/sponsor">Sponsor dashboard</Link>
                        <Link className="hover:text-slate-600 transition" href="/dashboard/student">Student dashboard</Link>
                    </div>
                </div>
                <div>
                    <h2 className="font-semibold text-gray-800 mb-5">Ecosystem</h2>
                    <div className="text-sm space-y-6 max-w-sm">
                        <p>Algorand smart contracts for milestone escrow.</p>
                        <p>Pera Wallet authentication and signing.</p>
                        <p>MongoDB milestone proof storage.</p>
                    </div>
                </div>
            </div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4 border-t mt-6 border-slate-200">
                <p className="text-center">
                    Copyright 2026 © Kudos. All Rights Reserved.
                </p>
                <div className="flex items-center gap-4">
                    <Link href="/">
                        Privacy Policy
                    </Link>
                    <Link href="/">
                        Terms of Service
                    </Link>
                    <Link href="/">
                        Cookie Policy
                    </Link>
                </div>
            </div>
        </footer>
    );
};