"use client";

import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function Hero() {
  return (
    <div className="overflow-x-hidden  bg-gray-50">
      {/* Hero Section */}
      <div className="py-4 min-h-screen md:py-6">
        <Navbar />
        <section className="pt-12 sm:pt-16">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="px-6 text-lg text-gray-600 font-inter">
                Smart AI tool, made for Developers & EdTech Companies
              </h1>
              <p className="mt-5 text-4xl font-bold leading-tight text-gray-900 sm:leading-tight sm:text-5xl lg:text-6xl lg:leading-tight font-pj">
                Transform Your API Documentation
                <span className="relative inline-flex sm:inline">
                  <span className="bg-gradient-to-r from-[#44BCFF] via-[#FF44EC] to-[#FF675E] blur-lg filter opacity-30 w-full h-full absolute inset-0"></span>
                  <span className="relative"> Effortlessly </span>
                </span>
              </p>
              <p className="mt-8 text-base text-gray-500 font-inter">
                Welcome to AutoDocX, where generating API documentation becomes a breeze. Connect your GitHub repositories and let our AI do the heavy lifting for you.
              </p>

              <div className="px-8 sm:items-center sm:justify-center sm:px-0 sm:space-x-5 sm:flex mt-9">
                <Link href="#" passHref>
                  <p
                    className="inline-flex items-center justify-center w-full px-8 py-3 text-lg font-bold text-white transition-all duration-200 bg-gray-900 border-2 border-transparent sm:w-auto rounded-xl font-pj hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
                    role="button"
                  >
                    Get Started
                  </p>
                </Link>
                <Link href="#" passHref>
                  <p
                    className="inline-flex items-center justify-center w-full px-6 py-3 mt-4 text-lg font-bold text-gray-900 transition-all duration-200 border-2 border-gray-400 sm:w-auto sm:mt-0 rounded-xl font-pj focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 hover:bg-gray-900 focus:bg-gray-900 hover:text-white focus:text-white hover:border-gray-900 focus:border-gray-900"
                    role="button"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      viewBox="0 0 18 18"
                      fill="none"
                      stroke="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M8.18003 13.4261C6.8586 14.3918 5 13.448 5 11.8113V5.43865C5 3.80198 6.8586 2.85821 8.18003 3.82387L12.5403 7.01022C13.6336 7.80916 13.6336 9.44084 12.5403 10.2398L8.18003 13.4261Z"
                        strokeWidth={2}
                        strokeMiterlimit={10}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Watch free demo
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Features Section */}
      <section className="py-12 min-h-screen sm:py-16">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl font-pj">
              Why Choose <span className="relative inline-flex">
                <span className="bg-gradient-to-r from-[#44BCFF] via-[#FF44EC] to-[#FF675E] blur-lg filter opacity-30 w-full h-full absolute inset-0"></span>
                <span className="relative">AutoDocX</span>
              </span>
            </h2>
            <p className="mt-4 text-base text-gray-500 font-inter max-w-2xl mx-auto">
              Discover the powerful features that make AutoDocX the go-to tool for seamless API documentation.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
              <svg className="w-8 h-8 text-gray-900 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className="text-xl font-bold text-gray-900 font-pj">AI-Powered Documentation</h3>
              <p className="mt-2 text-gray-500 font-inter">
                Our advanced AI analyzes your codebase and generates accurate, developer-friendly API documentation in minutes.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
              <svg className="w-8 h-8 text-gray-900 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" />
              </svg>
              <h3 className="text-xl font-bold text-gray-900 font-pj">Seamless GitHub Integration</h3>
              <p className="mt-2 text-gray-500 font-inter">
                Connect your GitHub repositories with a single click to automatically extract and document your APIs.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
              <svg className="w-8 h-8 text-gray-900 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-bold text-gray-900 font-pj">Customizable Outputs</h3>
              <p className="mt-2 text-gray-500 font-inter">
                Tailor your documentation with customizable templates to match your brand and project needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 min-h-screen sm:py-16">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl font-pj">
              How <span className="relative inline-flex">
                <span className="bg-gradient-to-r from-[#44BCFF] via-[#FF44EC] to-[#FF675E] blur-lg filter opacity-30 w-full h-full absolute inset-0"></span>
                <span className="relative">AutoDocX</span>
              </span> Works
            </h2>
            <p className="mt-4 text-base text-gray-500 font-inter max-w-2xl mx-auto">
              Follow these simple steps to generate professional API documentation in no time.
            </p>
          </div>
          <div className="mt-12 space-y-12 lg:space-y-0 lg:grid lg:grid-cols-4 lg:gap-x-8">
            <div className="relative flex flex-col items-center text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-900 text-white font-bold text-lg mb-4">1</div>
              <h3 className="text-xl font-bold text-gray-900 font-pj">Connect Your Repository</h3>
              <p className="mt-2 text-gray-500 font-inter">
                Link your GitHub repository to AutoDocX with a single click.
              </p>
            </div>
            <div className="relative flex flex-col items-center text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-900 text-white font-bold text-lg mb-4">2</div>
              <h3 className="text-xl font-bold text-gray-900 font-pj">AI Analysis</h3>
              <p className="mt-2 text-gray-500 font-inter">
                Our AI scans your codebase to identify and extract API endpoints.
              </p>
            </div>
            <div className="relative flex flex-col items-center text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-900 text-white font-bold text-lg mb-4">3</div>
              <h3 className="text-xl font-bold text-gray-900 font-pj">Generate Documentation</h3>
              <p className="mt-2 text-gray-500 font-inter">
                Instantly create clear, structured documentation for your APIs.
              </p>
            </div>
            <div className="relative flex flex-col items-center text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-900 text-white font-bold text-lg mb-4">4</div>
              <h3 className="text-xl font-bold text-gray-900 font-pj">Customize & Share</h3>
              <p className="mt-2 text-gray-500 font-inter">
                Edit and share your documentation to suit your team’s needs.
              </p>
            </div>
          </div>
        </div>
      </section>

     
    </div>
  );
}