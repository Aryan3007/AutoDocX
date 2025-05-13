import React from 'react';
import { ChevronRightIcon, Github } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

const Navbar = () => {
    const { data: session } = useSession(); 

    return (
        <div className="container px-4 max-w-7xl  mx-auto sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
                <div className="flex-shrink-0">
                    <Link href="/" passHref>
                        <h1 className="text-xl font-medium">
                            <span className="text-red-500 font-bold">/</span>AutoDocX
                        </h1>
                    </Link>
                </div>



                <div className=" lg:ml-auto lg:flex items-center lg:space-x-10">
                    {session ? (
                        <Link href="/dashboard/documentation" passHref>
                            <p
                                className="inline-flex gap- items-center justify-center px-4 py-2 text-base leading-7 text-black transition-all duration-200  border border-transparent rounded-xl  font-pj focus:outline-none focus:ring-2 focus:ring-offset-2"
                                role="button"
                            >
                                Generate Docs
                                <ChevronRightIcon />
                            </p>
                        </Link>) : (
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


        </div>
    );
};

export default Navbar;