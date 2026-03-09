"use client";

import SectionTitle from "@/components/SectionTitle";
import ChatbotWidget from "@/components/ChatbotWidget";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import { useThemeContext } from "@/contexts/ThemeContext";
import { companiesLogo } from "@/data/companiesLogo";
import { featuresData } from "@/data/featuresData";
import { FaqSection } from "@/sections/FaqSection";
import Pricing from "@/sections/Pricing";
import { VideoIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Marquee from "react-fast-marquee";

export default function Home() {
  const { theme } = useThemeContext();

  return (
    <>
      <Navbar />
      <main>
        <div className="flex flex-col items-center justify-center text-center px-4 bg-[url('/assets/light-hero-gradient.svg')] dark:bg-[url('/assets/dark-hero-gradient.svg')] bg-no-repeat bg-cover">
          <div className="flex flex-wrap items-center justify-center gap-3 p-1.5 pr-4 mt-46 rounded-full border border-slate-300 dark:border-slate-600 bg-white/70 dark:bg-slate-600/20">
            <div className="flex items-center -space-x-3">
              <Image
                className="size-7 rounded-full"
                height={50}
                width={50}
                src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=50"
                alt="userImage1"
              />
              <Image
                className="size-7 rounded-full"
                height={50}
                width={50}
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=50"
                alt="userImage2"
              />
              <Image
                className="size-7 rounded-full"
                height={50}
                width={50}
                src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=50&h=50&auto=format&fit=crop"
                alt="userImage3"
              />
            </div>
            <p className="text-xs">Join a growing community of sponsors and builders</p>
          </div>

          <h1 className="mt-2 text-5xl/15 md:text-[64px]/19 font-semibold max-w-2xl">
            Fund bold ideas with
            <span className="bg-linear-to-r from-[#923FEF] dark:from-[#C99DFF] to-[#C35DE8] dark:to-[#E1C9FF] bg-clip-text text-transparent"> trustless </span>
            payouts
          </h1>
          <p className="text-base dark:text-slate-300 max-w-lg mt-2">
            Milestone-based escrow grants on Algorand. Transparent, verifiable, and built for builders.
          </p>

          <div className="flex items-center gap-4 mt-8">
            <Link href="/signup" className="bg-purple-600 hover:bg-purple-700 transition text-white rounded-md px-6 h-11 inline-flex items-center">
              Get started
            </Link>
            <Link href="/login" className="flex items-center gap-2 border border-purple-900 transition text-slate-600 dark:text-white rounded-md px-6 h-11">
              <VideoIcon strokeWidth={1} />
              <span>Open dashboard</span>
            </Link>
          </div>

          <h3 className="text-base text-center text-slate-400 mt-28 pb-14 font-medium">
            Built with modern tools and trusted infrastructure —
          </h3>

          <Marquee className="max-w-5xl mx-auto" gradient speed={25} gradientColor={theme === "dark" ? "#000" : "#fff"}>
            <div className="flex items-center justify-center">
              {[...companiesLogo, ...companiesLogo].map((company, index) => (
                <Image
                  key={index}
                  className="mx-11"
                  src={company.logo}
                  alt={company.name}
                  width={100}
                  height={100}
                />
              ))}
            </div>
          </Marquee>
        </div>

        <div id="features">
          <SectionTitle
            text1="FEATURES"
            text2="Built for transparent grant execution"
            text3="Escrow contracts, milestone reviews, and sponsor-student workflows in one platform."
          />

          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-4 mt-10 px-6 md:px-16 lg:px-24 xl:px-32">
            {featuresData.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-xl space-y-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/20 max-w-80 md:max-w-66"
              >
                <feature.icon className="text-purple-500 size-8 mt-4" strokeWidth={1.3} />
                <h3 className="text-base font-medium">{feature.title}</h3>
                <p className="text-slate-400 line-clamp-2">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        <Pricing />
        <FaqSection />

        <div className="flex flex-col items-center text-center justify-center mt-20 px-4">
          <h3 className="text-3xl font-semibold mt-16 mb-4">Ready to launch your next grant?</h3>
          <p className="text-slate-600 dark:text-slate-200 max-w-xl mx-auto">
            Set up sponsor and student roles, define milestones, and run your full grant lifecycle with transparent fund releases.
          </p>
          <div className="flex items-center gap-4 mt-8">
            <Link href="/signup" className="bg-purple-600 hover:bg-purple-700 transition text-white rounded-md px-6 h-11 inline-flex items-center">
              Create account
            </Link>
            <Link href="/sponsors" className="border border-purple-900 transition text-slate-600 dark:text-white rounded-md px-6 h-11 inline-flex items-center">
              Browse sponsors
            </Link>
          </div>
        </div>
      </main>
      <ChatbotWidget />
      <Footer />
    </>
  );
}
