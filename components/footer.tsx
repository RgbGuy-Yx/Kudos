"use client";
import { useThemeContext } from "@/contexts/ThemeContext";
import { navLinks } from "@/data/navLinks";
import Image from "next/image";
import Link from "next/link";

export default function Footer() {
    const { theme } = useThemeContext();

    return (
        <footer className="relative px-6 md:px-16 lg:px-24 xl:px-32 mt-40 w-full dark:text-slate-50">
            <Image
                className="absolute max-w-4xl w-full h-auto -mt-30 max-md:px-4 right-0 md:right-16 lg:right-24 xl:right-32 top-0 pointer-events-none"
                src={theme === "dark" ? "/assets/landing-text-dark.svg" : "/assets/landing-text-light.svg"}
                alt="landing"
                width={930}
                height={340}
                priority
            />

            <div className="flex flex-col md:flex-row justify-between w-full gap-10 border-b border-gray-200 dark:border-slate-700 pb-6">
                <div className="md:max-w-114">
                    <Link href="/">
                        <Image
                            className="h-9 md:h-9.5 w-auto shrink-0"
                            src="/assets/logo.svg"
                            alt="Kudos"
                            width={140}
                            height={40}
                            priority
                        />
                    </Link>
                    <p className="mt-6">
                        Kudos helps sponsors and students run transparent milestone-based grants on Algorand with escrow-backed releases and proof-driven approvals.
                    </p>
                </div>

                <div className="flex-1 flex items-start md:justify-end gap-20">
                    <div>
                        <h2 className="font-semibold mb-5">Company</h2>
                        <ul className="space-y-2">
                            {navLinks.map((link, index) => (
                                <li key={index}>
                                    <Link href={link.href} className="hover:text-purple-600 transition">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h2 className="font-semibold mb-5">Get in touch</h2>
                        <div className="space-y-2">
                            <p>support@kudos.app</p>
                            <p>Algorand testnet ready</p>
                        </div>
                    </div>
                </div>
            </div>

            <p className="pt-4 text-center pb-5">Copyright 2026 © Kudos. All Right Reserved.</p>
        </footer>
    );
}