import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FC } from "react";

const Features: FC = () => {
    return (
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col items-center">
            {/* Header */}
            <div className="text-center mb-12">
                <p className="text-sm font-medium mb-2">Streamlined</p>
                <h1 className="text-4xl font-bold mb-3">
                    Unlock Effortless Documentation
                    <br />
                    with AutoDocX
                </h1>
                <p className="text-lg">
                    Experience the future of API documentation. AutoDocX simplifies your workflow by integrating
                    <br />
                    seamlessly with GitHub.
                </p>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mb-12">
                {/* Left Side Features */}
                <div className="space-y-8">
                    <FeatureCard
                        icon="github"
                        title="GitHub OAuth Login"
                        description="Easily log in using your GitHub credentials for a secure and smooth experience."
                    />
                    <FeatureCard
                        icon="import"
                        title="Import Repositories Effortlessly"
                        description="Quickly import public or private repositories to start generating documentation instantly."
                    />
                </div>

                {/* Center Image */}
                <div className=" rounded-lg flex items-center justify-center h-64">
                    <Image
                        src="https://cdn.rareblocks.xyz/collection/clarity/images/hero/2/illustration.png"
                        alt="AutoDocX Dashboard Preview"
                        width={400}
                        height={320}
                        className="object-cover"
                    />
                </div>

                {/* Right Side Features (rendered below on mobile) */}
                <div className="space-y-8">
                    <FeatureCard
                        icon="ai"
                        title="AI-Powered Documentation"
                        description="Leverage Google Gemini for intelligent, clean, and comprehensive API documentation generation."
                    />
                    <FeatureCard
                        icon="start"
                        title="Get Started Today"
                        description="Join AutoDocX now and transform your documentation process with ease and efficiency."
                    />
                </div>
            </div>

            {/* Call to Action Buttons */}
            <div className="flex flex-wrap gap-4 justify-center">
                <Link
                    href="/learn-more"
                    className="px-6 py-2 border border-gray-800 text-gray-800 rounded hover:bg-gray-100 transition-colors"
                >
                    Learn More
                </Link>
                <Link
                    href="/signup"
                    className="px-6 py-2 border border-gray-800 text-gray-800 rounded hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                    Sign Up <ArrowRight size={16} />
                </Link>
            </div>
        </div>
    );
};

interface FeatureCardProps {
    icon: "github" | "import" | "ai" | "start";
    title: string;
    description: string;
}

const FeatureCard: FC<FeatureCardProps> = ({ icon, title, description }) => {
    return (
        <div className="flex flex-col items-center text-center p-4">
            <div className="mb-4">
                {icon === "github" && (
                    <div className="w-12 h-12 text-black flex items-center justify-center">
                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
                        </svg>
                    </div>
                )}
                {icon === "import" && (
                    <div className="w-12 h-12 text-black flex items-center justify-center">
                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M5 20h14v-2H5v2zm0-10h4v6h6v-6h4l-7-7-7 7z" />
                        </svg>
                    </div>
                )}
                {icon === "ai" && (
                    <div className="w-12 h-12 text-black flex items-center justify-center">
                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M21 11.5v-1c0-.8-.7-1.5-1.5-1.5H16v6h1.5v-2h1.1l.9 2H21l-.9-2.1c.5-.3.9-.8.9-1.4zm-1.5 0h-2v-1h2v1zm-13-.5h-2V9H3v6h1.5v-2.5h2V15H8V9H6.5v2zM13 9H9.5v6H13c.8 0 1.5-.7 1.5-1.5v-3c0-.8-.7-1.5-1.5-1.5zm0 4.5h-2v-3h2v3z" />
                        </svg>
                    </div>
                )}
                {icon === "start" && (
                    <div className="w-12 h-12 text-black flex items-center justify-center">
                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                        </svg>
                    </div>
                )}
            </div>
            <h3 className="text-lg font-bold mb-2">{title}</h3>
            <p className="text-sm">{description}</p>
        </div>
    );
};

export default Features;