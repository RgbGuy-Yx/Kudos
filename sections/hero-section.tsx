"use client";

import { Loader2Icon, SparklesIcon, TrendingUpIcon, UploadCloudIcon } from "lucide-react";
import Marquee from "react-fast-marquee";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Prompt {
    label: string;
    prompt: string;
}

export default function HeroSection() {
    const router = useRouter();
    const [prompt, setPrompt] = useState("");
    const [selected, setSelected] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [textIndex, setTextIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);
    const [deleting, setDeleting] = useState(false);


    const handleStart = () => {
        setLoading(true);
        router.push('/signup');
    };

    const placeholders = [
        "grant for student builders...",
        "milestone-based funding flow...",
        "sponsor approval workflow...",
        "proof-first fund release...",
        "simple transparent grants...",
    ];


    const prompts: Prompt[] = [
        {
            label: "AI Grant",
            prompt: "Create a 4-milestone grant for an AI student project with sponsor approvals.",
        },
        {
            label: "Research",
            prompt: "Set up a university research grant with proof required before each payout.",
        },
        {
            label: "EdTech",
            prompt: "Fund an EdTech student build through staged milestone releases.",
        },
        {
            label: "Hackathon",
            prompt: "Support hackathon winners with escrow-backed, milestone-based disbursement.",
        },
        {
            label: "MVP Path",
            prompt: "Create a prototype-to-MVP grant path with clear proof checkpoints.",
        },
    ];


    useEffect(() => {
        if (prompt) return;

        const currentWord = placeholders[textIndex];

        if (!deleting && charIndex === currentWord.length) {
            setTimeout(() => setDeleting(true), 2000);
            return;
        }

        if (deleting && charIndex === 0) {
            setDeleting(false);
            setTextIndex((prev) => (prev + 1) % placeholders.length);
            return;
        }

        const timeout = setTimeout(() => {
            setCharIndex((prev) => prev + (deleting ? -1 : 1));
        }, 50);

        return () => clearTimeout(timeout);
    }, [charIndex, deleting, textIndex, prompt]);

    const animatedPlaceholder = placeholders[textIndex].substring(0, charIndex);

    return (
        <section id="home" className="flex flex-col items-center justify-center">
            <div className="flex items-center gap-2 text-gray-500 mt-32">
                <TrendingUpIcon className="size-4.5" />
                <span>Join a growing community of sponsors and builders</span>
            </div>

            <h1 className="text-center text-5xl/17 md:text-[64px]/20 font-semibold max-w-2xl m-2">
                Fund ideas. Ship <span className="text-purple-500">proof</span>. Get paid.
            </h1>

            <p className="text-center text-base text-gray-500 max-w-md mt-2">
                Sponsors fund confidently, students build faster. Every milestone is proof-driven and every payout is verifiable on Algorand.
            </p>

            <form className="focus-within:ring-2 focus-within:ring-gray-300 border border-gray-200 rounded-xl max-w-2xl w-full mt-8">
                <textarea
                    className="w-full resize-none p-4 outline-none text-gray-600"
                    placeholder={`Create a ${animatedPlaceholder}`}
                    rows={3}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                />

                <div className="flex items-center justify-between p-4 pt-0">
                    <label htmlFor="file" className="border border-gray-200 text-gray-500 p-1.5 rounded-md cursor-pointer">
                        <input type="file" id="file" hidden />
                        <UploadCloudIcon className="size-4.5" />
                    </label>

                    <button type="button" onClick={handleStart} className={`flex items-center bg-linear-to-b from-gray-600 to-gray-800 hover:from-gray-700 hover:to-gray-900 transition px-4 h-9 text-white rounded-lg ${loading ? "cursor-not-allowed opacity-80" : ""}`}>
                        {loading ? (
                            <Loader2Icon className="size-5 animate-spin" />
                        ) : (
                            <>
                                <SparklesIcon className="size-4" />
                                <span className="ml-2">Start</span>
                            </>
                        )}
                    </button>
                </div>
            </form>

            <Marquee gradient speed={30} pauseOnHover className="max-w-2xl w-full mt-3" >
                {prompts.map((item) => {
                    const isSelected = selected === item.label;

                    return (
                        <button key={item.label}
                            onClick={() => {
                                setPrompt(item.prompt);
                                setSelected(item.label);
                            }}
                            className={`px-4 py-1.5 mx-2 border rounded-full transition
                                ${isSelected
                                    ? "bg-gray-200 text-gray-800 border-gray-300 cursor-not-allowed"
                                    : "text-gray-500 bg-gray-50 border-gray-200 hover:bg-gray-100"
                                }
                            `}
                        >
                            {item.label}
                        </button>
                    );
                })}
            </Marquee>
        </section>
    );
}
