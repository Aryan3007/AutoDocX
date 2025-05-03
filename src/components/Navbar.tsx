import React, { useState } from 'react';
import { Github } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

const Navbar = () => {
    const [expanded, setExpanded] = useState(false);
    const { data: session } = useSession(); // Use useSession to get session data
    console.log(session);

    return (
        <div className="container px-4 mx-auto sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
                <div className="flex-shrink-0">
                    <Link href="/" passHref>
                        <h1 className="text-lg font-medium">
                            <span className="text-red-500 font-bold">/</span>AutoDocX
                        </h1>
                    </Link>
                </div>

                <div className="flex lg:hidden">
                    <button
                        type="button"
                        className="text-gray-900"
                        onClick={() => setExpanded(!expanded)}
                        aria-expanded={expanded}
                    >
                        {!expanded ? (
                            <svg
                                className="w-7 h-7"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            </svg>
                        ) : (
                            <svg
                                className="w-7 h-7"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        )}
                    </button>
                </div>

                <div className="hidden lg:flex lg:ml-16 lg:items-center lg:justify-center lg:space-x-10 xl:space-x-16">
                    <Link href="#" passHref>
                        <p className="text-base text-gray-900 transition-all duration-200 rounded focus:outline-none font-pj hover:text-opacity-50 focus:ring-1 focus:ring-gray-900 focus:ring-offset-2">
                            Features
                        </p>
                    </Link>
                    <Link href="#" passHref>
                        <p className="text-base text-gray-900 transition-all duration-200 rounded focus:outline-none font-pj hover:text-opacity-50 focus:ring-1 focus:ring-gray-900 focus:ring-offset-2">
                            Pricing
                        </p>
                    </Link>
                    <Link href="#" passHref>
                        <p className="text-base text-gray-900 transition-all duration-200 rounded focus:outline-none font-pj hover:text-opacity-50 focus:ring-1 focus:ring-gray-900 focus:ring-offset-2">
                            Automation
                        </p>
                    </Link>
                </div>

                <div className="hidden lg:ml-auto lg:flex lg:items-center lg:space-x-10">
                    {session ? (
 <Link href="/dashboard" passHref>
 <p
     className="inline-flex items-center justify-center px-4 py-2 text-base leading-7 text-white transition-all duration-200 bg-gray-900 border border-transparent rounded-xl hover:bg-gray-600 font-pj focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
     role="button"
 >
     Dashboard
 </p>
</Link>                    ) : (
                        <Link href="/login" passHref>
                            <p
                                className="inline-flex items-center justify-center px-4 py-2 text-base leading-7 text-white transition-all duration-200 bg-gray-900 border border-transparent rounded-xl hover:bg-gray-600 font-pj focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
                                role="button"
                            >
                                Login With Github <Github className="w-4 h-4 ml-2" />
                            </p>
                        </Link>
                    )}
                </div>
            </div>

            {expanded && (
                <nav>
                    <div className="px-1 py-8">
                        <div className="grid gap-y-7">
                            <Link href="#" passHref>
                                <p className="flex items-center p-3 -m-3 text-base font-medium text-gray-900 transition-all duration-200 rounded-xl hover:bg-gray-50 focus:outline-none font-pj focus:ring-1 focus:ring-gray-900 focus:ring-offset-2">
                                    Features
                                </p>
                            </Link>
                            <Link href="#" passHref>
                                <p className="flex items-center p-3 -m-3 text-base font-medium text-gray-900 transition-all duration-200 rounded-xl hover:bg-gray-50 focus:outline-none font-pj focus:ring-1 focus:ring-gray-900 focus:ring-offset-2">
                                    Pricing
                                </p>
                            </Link>
                            <Link href="#" passHref>
                                <p className="flex items-center p-3 -m-3 text-base font-medium text-gray-900 transition-all duration-200 rounded-xl hover:bg-gray-50 focus:outline-none font-pj focus:ring-1 focus:ring-gray-900 focus:ring-offset-2">
                                    Automation
                                </p>
                            </Link>
                            <Link href="#" passHref>
                                <p className="flex items-center p-3 -m-3 text-base font-medium text-gray-900 transition-all duration-200 rounded-xl hover:bg-gray-50 focus:outline-none font-pj focus:ring-1 focus:ring-gray-900 focus:ring-offset-2">
                                    Customer Login
                                </p>
                            </Link>
                            <Link href="#" passHref>
                                <p
                                    className="inline-flex items-center justify-center px-6 py-3 text-base font-bold leading-7 text-white transition-all duration-200 bg-gray-900 border border-transparent rounded-xl hover:bg-gray-600 font-pj focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
                                    role="button"
                                >
                                    Sign up
                                </p>
                            </Link>
                        </div>
                    </div>
                </nav>
            )}
        </div>
    );
};

export default Navbar;