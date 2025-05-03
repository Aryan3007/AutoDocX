import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { FC } from "react";

const HowItWorks: FC = () => {
  return (
    <div className="max-w-6xl min-h-screen flex justify-center items-center flex-col gap-12 mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <p className="text-sm font-medium mb-2">Connect</p>
        <h2 className="text-3xl font-bold mb-3">Generate Your Documentation</h2>
        <p className="text-base">Easily connect and create API documentation in minutes.</p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* How It Works */}
        <div className="border border-gray-300 p-6 rounded flex flex-col h-full md:col-span-1">
          <div className="mb-4">
            <div className="w-10 h-10 flex items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
                <path d="M12 12l-5-5h10z" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-bold mb-3">How It Works</h3>
          <p className="text-sm mb-6 flex-grow">
            Follow these simple steps to connect your GitHub and generate documentation effortlessly.
          </p>
          <div className="flex gap-3 mt-auto">
            <Link
              href="/start"
              className="px-4 py-2 border border-gray-800 text-gray-800 rounded text-sm hover:bg-gray-100 transition-colors"
            >
              Start
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 border border-gray-800 text-gray-800 rounded text-sm hover:bg-gray-100 transition-colors flex items-center gap-1"
            >
              Login <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Step-by-Step Process */}
        <div className="border border-gray-300 p-6 rounded flex flex-col h-full">
          <div className="mb-4">
            <div className="w-10 h-10 flex items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-bold mb-3">Step-by-Step Connection Process</h3>
          <p className="text-sm mb-6 flex-grow">
            Authenticate with GitHub to get started.
          </p>
          <div className="mt-auto">
            <Link
              href="/import"
              className="px-4 py-2 border border-gray-800 text-gray-800 rounded text-sm hover:bg-gray-100 transition-colors inline-flex items-center gap-1"
            >
              Import <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Analyze Codebase */}
        <div className="border border-gray-300 p-6 rounded flex flex-col h-full">
          <div className="mb-4">
            <div className="w-10 h-10 flex items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H6v-2h6v2zm4-4H6v-2h10v2zm0-4H6V7h10v2z" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-bold mb-3">Analyze Your Codebase</h3>
          <p className="text-sm mb-6 flex-grow">
            We analyze your repository for documentation.
          </p>
          <div className="mt-auto">
            <Link
              href="/generate"
              className="px-4 py-2 border border-gray-800 text-gray-800 rounded text-sm hover:bg-gray-100 transition-colors inline-flex items-center gap-1"
            >
              Generate <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;