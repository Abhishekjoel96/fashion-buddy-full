import { Button } from "@/components/ui/button";
import { Check, CheckCircle, ChevronRight, Sparkles, Star, Zap } from "lucide-react";
import { Link } from "wouter";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/site-header";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}

function FeatureCard({ title, description, icon, index }: FeatureCardProps) {
  return (
    <div 
      className="group flex flex-col gap-6 rounded-xl p-8 transition-all duration-300 hover:bg-gray-900 hover:shadow-2xl"
      style={{
        animationDelay: `${index * 100}ms`,
      }}
    >
      <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-2 text-white">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
      </div>
      <div className="flex items-center text-primary text-sm font-medium opacity-0 transform -translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
        <span className="mr-2">Learn more</span>
        <ChevronRight size={16} />
      </div>
    </div>
  );
}

interface PricingCardProps {
  title: string;
  price: string;
  description: string;
  features: string[];
  buttonText: string;
  popular?: boolean;
}

function PricingCard({
  title,
  price,
  description,
  features,
  buttonText,
  popular = false,
}: PricingCardProps) {
  return (
    <div className={cn(
      "rounded-xl border p-8 relative transition-all duration-300 hover:border-primary",
      popular ? "border-primary bg-gray-900" : "border-gray-800 bg-gray-900/50"
    )}>
      {popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-white px-3 py-1 rounded-full text-xs font-semibold">
          Most Popular
        </div>
      )}
      <div className="flex flex-col gap-4">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <div className="mt-2">
          <span className="text-4xl font-bold text-white">{price}</span>
          {price !== "Free" && <span className="text-gray-400">/month</span>}
        </div>
        <p className="text-gray-400 mt-2 text-sm">{description}</p>
        <ul className="mt-6 space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="mt-1 text-primary">
                <Check size={16} />
              </span>
              <span className="text-sm text-gray-300">{feature}</span>
            </li>
          ))}
        </ul>
        <Button className={cn(
          "mt-8 w-full",
          popular ? "bg-primary hover:bg-primary/90" : "bg-gray-800 hover:bg-gray-700 text-white"
        )}>
          {buttonText}
        </Button>
      </div>
    </div>
  );
}

interface ColorPaletteProps {
  colors: string[];
  title: string;
}

function ColorPalette({ colors, title }: ColorPaletteProps) {
  return (
    <div className="mb-8">
      <h4 className="text-white text-sm font-medium mb-2">{title}</h4>
      <div className="flex gap-2">
        {colors.map((color, index) => (
          <div 
            key={index} 
            className="w-10 h-10 rounded-full shadow-lg"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  );
}

interface ProcessStepProps {
  number: number;
  title: string;
  description: string;
}

function ProcessStep({ number, title, description }: ProcessStepProps) {
  return (
    <div className="flex gap-6 group">
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-white font-bold text-lg border border-gray-700 group-hover:border-primary group-hover:bg-primary/10 transition-all duration-300">
          {number}
        </div>
        {number < 3 && (
          <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-px h-20 bg-gray-800 group-hover:bg-primary/50 transition-all duration-300"></div>
        )}
      </div>
      <div className="pt-3 pb-12">
        <h3 className="text-white text-xl font-medium mb-2">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function ScrollDownIndicator() {
  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center animate-bounce">
      <p className="text-sm text-white/60 mb-2">Scroll Down</p>
      <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
        <div className="w-1.5 h-1.5 bg-white/60 rounded-full mt-2 animate-scroll"></div>
      </div>
    </div>
  );
}

function ParallaxSection({ 
  children, 
  className 
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const { top } = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      if (top < windowHeight && top > -windowHeight) {
        const newOffset = (top / windowHeight) * 100;
        setOffset(newOffset);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section 
      ref={sectionRef} 
      className={cn("relative overflow-hidden", className)}
      style={{
        backgroundPositionY: `${offset}px`
      }}
    >
      {children}
    </section>
  );
}

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"color" | "tryon">("color");

  return (
    <div className="min-h-screen bg-black text-white">
      <SiteHeader />

      {/* Hero section */}
      <section className="min-h-screen relative overflow-hidden bg-[#050505] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 via-purple-800/10 to-black opacity-50 z-0"></div>
        <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-indigo-600/20 to-transparent z-0"></div>
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5 z-0"></div>

        <div className="relative z-10 container mx-auto px-6 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-16">
              <div className="md:w-3/5 text-center md:text-left">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  AI Fashion <br />
                  <span className="bg-gradient-to-r from-blue-400 to-indigo-600 bg-clip-text text-transparent">
                    Assistant
                  </span> <br />
                  on WhatsApp
                </h1>
                <p className="mt-8 text-lg text-gray-400 max-w-xl">
                  Discover your perfect style with personalized color recommendations, 
                  virtual try-ons, and curated shopping suggestions.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 transition-opacity text-white border-0 px-8 py-6"
                    asChild
                  >
                    <Link href="/auth">Get Started</Link>
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="text-white border-gray-700 hover:bg-gray-900 px-8 py-6"
                    onClick={() => {
                      document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    How it Works
                  </Button>
                </div>

                <div className="mt-16 flex items-center gap-10 justify-center md:justify-start">
                  <div className="flex flex-col items-center md:items-start">
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-600 bg-clip-text text-transparent">10K+</p>
                    <p className="text-sm text-gray-400">Happy Users</p>
                  </div>
                  <div className="hidden md:block w-px h-10 bg-gray-800"></div>
                  <div className="flex flex-col items-center md:items-start">
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-600 bg-clip-text text-transparent">50K+</p>
                    <p className="text-sm text-gray-400">Color Analyses</p>
                  </div>
                  <div className="hidden md:block w-px h-10 bg-gray-800"></div>
                  <div className="flex flex-col items-center md:items-start">
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-600 bg-clip-text text-transparent">90%</p>
                    <p className="text-sm text-gray-400">Satisfaction Rate</p>
                  </div>
                </div>
              </div>

              <div className="md:w-2/5 mt-12 md:mt-0 order-first md:order-last">
                <div className="relative h-[580px] w-[300px] mx-auto">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-700/20 to-indigo-700/20 rounded-[40px] blur-[60px]"></div>
                  <div className="relative h-full w-full bg-gray-900 border border-gray-800 rounded-[40px] overflow-hidden shadow-2xl">
                    {/* Phone notch */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/3 h-6 bg-black rounded-b-xl z-10"></div>

                    <div className="p-4 h-full flex flex-col">
                      {/* WhatsApp header */}
                      <div className="bg-[#075E54] text-white p-3 rounded-t-xl flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
                          <span className="text-xs font-bold text-[#075E54]">FB</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">Fashion Buddy</p>
                          <p className="text-xs text-green-100 opacity-80">Online</p>
                        </div>
                      </div>

                      {/* Chat content */}
                      <div className="flex-1 bg-[#E5DDD5] bg-opacity-10 backdrop-blur-sm p-3 flex flex-col gap-3 overflow-y-auto">
                        <div className="bg-[#DCF8C6] bg-opacity-10 p-2 rounded-lg max-w-[80%] self-end">
                          <p className="text-xs text-white">Hi! I want to know what colors look best on me.</p>
                          <p className="text-[10px] text-gray-400 text-right">10:42 AM</p>
                        </div>

                        <div className="bg-white bg-opacity-10 p-2 rounded-lg max-w-[80%]">
                          <p className="text-xs text-white">Hello! I'd be happy to help. Could you send me a selfie in natural light?</p>
                          <p className="text-[10px] text-gray-400 text-right">10:43 AM</p>
                        </div>

                        <div className="bg-[#DCF8C6] bg-opacity-10 p-2 rounded-lg max-w-[80%] self-end">
                          <div className="bg-gray-700 h-32 w-full rounded-md mb-1 flex items-center justify-center">
                            <p className="text-[10px] text-gray-400">User Selfie</p>
                          </div>
                          <p className="text-[10px] text-gray-400 text-right">10:45 AM</p>
                        </div>

                        <div className="bg-white bg-opacity-10 p-2 rounded-lg max-w-[80%]">
                          <p className="text-xs text-white">Based on your skin tone, I recommend:</p>
                          <div className="my-2 flex gap-1">
                            <div className="w-6 h-6 rounded-full bg-blue-600"></div>
                            <div className="w-6 h-6 rounded-full bg-emerald-600"></div>
                            <div className="w-6 h-6 rounded-full bg-violet-600"></div>
                          </div>
                          <p className="text-xs text-white">Would you like to see clothes in these colors?</p>
                          <p className="text-[10px] text-gray-400 text-right">10:46 AM</p>
                        </div>

                        <div className="bg-[#DCF8C6] bg-opacity-10 p-2 rounded-lg max-w-[80%] self-end">
                          <p className="text-xs text-white">Yes, please show me some shirts!</p>
                          <p className="text-[10px] text-gray-400 text-right">10:47 AM</p>
                        </div>
                      </div>

                      {/* Input field */}
                      <div className="bg-[#1F2C34] p-2 rounded-b-xl flex items-center gap-2">
                        <div className="flex-1 bg-[#2A3942] rounded-full px-3 py-1.5">
                          <p className="text-xs text-gray-400">Type a message</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-[#00A884] flex items-center justify-center">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 12L4 4L6 12L4 20L20 12Z" fill="white"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ScrollDownIndicator />
      </section>

      {/* Features section */}
      <section id="features" className="py-32 bg-black">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <p className="text-sm font-medium text-primary mb-2">FEATURES</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Transform Your Fashion Experience</h2>
            <p className="text-gray-400 text-lg">
              Discover a revolutionary way to shop for clothes with our AI-powered 
              fashion assistant, specifically designed for Indian fashion and skin tones.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              index={1}
              title="Color Analysis"
              description="Get custom color recommendations based on your skin tone with our AI technology calibrated for diverse Indian skin tones."
              icon={<Sparkles size={24} />}
            />
            <FeatureCard
              index={2}
              title="Virtual Try-On"
              description="See how clothes look on you before buying. Our technology creates realistic visualizations of how garments would fit your body."
              icon={<Zap size={24} />}
            />
            <FeatureCard
              index={3}
              title="Smart Shopping"
              description="Shop from popular Indian e-commerce platforms with personalized recommendations filtered to match your style preferences."
              icon={<Check size={24} />}
            />
          </div>
        </div>
      </section>

      {/* How It Works section */}
      <section id="how-it-works" className="py-32 bg-gradient-to-b from-black to-gray-950">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto mb-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
              <div>
                <p className="text-sm font-medium text-primary mb-2">HOW IT WORKS</p>
                <h2 className="text-4xl md:text-5xl font-bold text-white">Simple Process,<br />Amazing Results</h2>
              </div>

              <div className="mt-6 md:mt-0 inline-flex bg-gray-900 p-1 rounded-lg">
                <button 
                  onClick={() => setActiveTab("color")}
                  className={cn(
                    "px-4 py-2 rounded-md text-sm font-medium transition-all",
                    activeTab === "color" ? "bg-primary text-white" : "text-gray-400 hover:text-white"
                  )}
                >
                  Color Analysis
                </button>
                <button 
                  onClick={() => setActiveTab("tryon")}
                  className={cn(
                    "px-4 py-2 rounded-md text-sm font-medium transition-all",
                    activeTab === "tryon" ? "bg-primary text-white" : "text-gray-400 hover:text-white"
                  )}
                >
                  Virtual Try-On
                </button>
              </div>
            </div>

            {activeTab === "color" ? (
              <div className="grid md:grid-cols-2 gap-16 items-center">
                <div>
                  <div className="space-y-0">
                    <ProcessStep
                      number={1}
                      title="Take a Selfie"
                      description="Send a well-lit selfie through WhatsApp, making sure your face is clearly visible with no filters applied."
                    />
                    <ProcessStep
                      number={2}
                      title="AI Analysis"
                      description="Our AI analyzes your facial features and skin undertones to determine your unique skin tone profile among common Indian skin tones."
                    />
                    <ProcessStep
                      number={3}
                      title="Get Recommendations"
                      description="Receive your personalized color palette with complementary colors and specific clothing recommendations from Indian brands."
                    />
                  </div>

                  <div className="mt-12">
                    <ColorPalette 
                      title="Your complementary colors" 
                      colors={["#2563eb", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444"]} 
                    />
                    <ColorPalette 
                      title="Colors to avoid" 
                      colors={["#fef3c7", "#d1fae5", "#fee2e2", "#e0e7ff", "#fdf2f8"]} 
                    />
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-30"></div>
                  <div className="relative bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                    <div className="relative aspect-[3/4] bg-gray-800">
                      <img 
                        src="/images/skin-analysis.jpeg" 
                        alt="Skin tone analysis demo" 
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent h-1/4"></div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-medium text-white mb-2">Skin Tone: Deep Warm</h3>
                      <p className="text-sm text-gray-400 mb-4">
                        Your skin has warm undertones that pair beautifully with rich, deep colors 
                        and earth tones.
                      </p>
                      <div className="flex gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-600"></div>
                        <div className="w-8 h-8 rounded-full bg-emerald-700"></div>
                        <div className="w-8 h-8 rounded-full bg-amber-700"></div>
                        <div className="w-8 h-8 rounded-full bg-red-800"></div>
                        <div className="w-8 h-8 rounded-full bg-violet-700"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-16 items-center">
                <div>
                  <div className="space-y-0">
                    <ProcessStep
                      number={1}
                      title="Upload Full-Body Photo"
                      description="Send a full-body photo in a neutral pose through WhatsApp. Our technology works with all body types."
                    />
                    <ProcessStep
                      number={2}
                      title="Choose Clothing Items"
                      description="Select from recommended garments that match your color profile or request specific items you'd like to try on."
                    />
                    <ProcessStep
                      number={3}
                      title="See the Results"
                      description="Receive realistic visualization of how the garments would look on you and direct links to purchase them from Indian retailers."
                    />
                  </div>

                  <div className="mt-10 p-6 border border-gray-800 rounded-xl bg-gray-900/50">
                    <h4 className="text-white font-medium mb-3">The Technology</h4>
                    <p className="text-sm text-gray-400 mb-4">
                      Our virtual try-on uses advanced deep learning models trained specifically 
                      on Indian body types and clothing styles. The technology creates realistic draping 
                      and fabric simulation.
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <p className="text-xs text-gray-400">70% reduction in return rates</p>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-30"></div>
                  <div className="relative bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                    <div className="relative aspect-video bg-gray-800">
                      <img 
                        src="/images/virtual-tryon.jpeg" 
                        alt="Virtual try-on demo" 
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent h-1/4"></div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-medium text-white mb-2">Virtual Try-On Results</h3>
                      <p className="text-sm text-gray-400 mb-4">
                        Try before you buy with our realistic virtual garment simulation that shows you 
                        how clothes would look on your body.
                      </p>
                      <Button className="w-full bg-primary hover:bg-primary/90">
                        Try it Yourself
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Example chat section */}
      <section className="py-20 bg-[#050505]">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-sm font-medium text-primary mb-2">SEAMLESS EXPERIENCE</p>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Chat Now. Shop Smarter.</h2>
              <p className="text-gray-400 text-lg">
                Fashion Buddy works directly in WhatsApp, with no extra apps to download.
                Just chat like you would with a friend.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 transition-transform duration-300 hover:translate-y-[-10px]">
                <p className="text-sm text-gray-400 mb-4">Step 1</p>
                <h3 className="text-xl font-medium text-white mb-2">Send a Photo</h3>
                <p className="text-sm text-gray-400 mb-6">
                  Take a selfie or full-body photo. Our AI will analyze your features.
                </p>
                <div className="aspect-square bg-gray-800 rounded-lg mb-4 overflow-hidden">
                  <img 
                    src="/images/skin-analysis.jpeg" 
                    alt="Send a photo" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 transition-transform duration-300 hover:translate-y-[-10px] md:translate-y-6">
                <p className="text-sm text-gray-400 mb-4">Step 2</p>
                <h3 className="text-xl font-medium text-white mb-2">Get Recommendations</h3>
                <p className="text-sm text-gray-400 mb-6">
                  Receive your personalized color palette and clothing suggestions.
                </p>
                <div className="aspect-square bg-gray-800 rounded-lg mb-4 flex items-center justify-center text-gray-600">
                  <div className="flex gap-2">
                    <div className="w-10 h-10 rounded-full bg-blue-600"></div>
                    <div className="w-10 h-10 rounded-full bg-emerald-600"></div>
                    <div className="w-10 h-10 rounded-full bg-violet-600"></div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 transition-transform duration-300 hover:translate-y-[-10px]">
                <p className="text-sm text-gray-400 mb-4">Step 3</p>
                <h3 className="text-xl font-medium text-white mb-2">Shop with Confidence</h3>
                <p className="text-sm text-gray-400 mb-6">
                  Get direct links to clothing items from popular Indian e-commerce platforms.
                </p>
                <div className="aspect-square bg-gray-800 rounded-lg mb-4 overflow-hidden">
                  <img 
                    src="/images/shopping.jpeg" 
                    alt="Shop with confidence" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing section */}
      <section id="pricing" className="py-32 bg-black">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <p className="text-sm font-medium text-primary mb-2">PRICING</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Choose Your Plan</h2>
            <p className="text-gray-400 text-lg">
              Simple, transparent pricing with no hidden fees.
              Start with our free plan or upgrade for premium features.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <PricingCard
              title="Free Plan"
              price="Free"
              description="Perfect for exploring basic color analysis and shopping recommendations."
              features={[
                "1 color analysis per month",
                "3 complementary colors",
                "1 virtual try-on",
                "Limited clothing options",
                "Basic WhatsApp support"
              ]}
              buttonText="Start for Free"
            />
            <PricingCard
              title="Premium Plan"
              price="₹129"
              description="Full access to all Fashion Buddy features and premium support."
              features={[
                "10 color analyses per month",
                "Full color palette with colors to avoid",
                "10 virtual try-ons per month",
                "Full catalog access",
                "Priority WhatsApp support"
              ]}
              buttonText="Upgrade to Premium"
              popular={true}
            />
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-20 bg-gradient-to-r from-blue-900 to-indigo-900">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Ready to Transform Your Fashion Experience?</h2>
            <p className="text-lg text-blue-100 mb-10 opacity-90">
              Join thousands of users who have revolutionized their shopping experience with Fashion Buddy.
            </p>
            <Button 
              size="lg" 
              className="bg-white text-blue-900 hover:bg-gray-100 px-8 py-6 text-lg font-medium" 
              asChild
            >
              <Link href="/auth">Get Started Now</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#050505] py-16 border-t border-gray-900">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-start mb-12">
            <div className="mb-10 md:mb-0 text-center md:text-left">
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-3">
                Fashion Buddy
              </div>
              <p className="text-sm text-gray-400 max-w-xs">
                Your personal AI fashion assistant on WhatsApp, designed for Indian fashion and skin tones.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-10 text-center md:text-left">
              <div>
                <h4 className="text-white font-medium mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="hover:text-primary cursor-pointer">
                    <a 
                      href="#features"
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      Features
                    </a>
                  </li>
                  <li className="hover:text-primary cursor-pointer">
                    <a 
                      href="#how-it-works"
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      How It Works
                    </a>
                  </li>
                  <li className="hover:text-primary cursor-pointer">
                    <a 
                      href="#pricing"
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      Pricing
                    </a>
                  </li>
                </ul>
              </div>


            </div>
          </div>

          <div className="pt-8 border-t border-gray-900 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} Fashion Buddy. All rights reserved.</p>
            <div className="mt-4 md:mt-0 flex gap-6">
              <span className="hover:text-gray-300 cursor-pointer">Instagram</span>
              <span className="hover:text-gray-300 cursor-pointer">Twitter</span>
              <span className="hover:text-gray-300 cursor-pointer">LinkedIn</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom cursor effect - purely decorative */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-50 opacity-0">
        <div className="absolute w-64 h-64 rounded-full radial-gradient"></div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scroll {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }

        .animate-scroll {
          animation: scroll 1.5s ease-in-out infinite;
        }

        .radial-gradient {
          background: radial-gradient(circle, rgba(79, 70, 229, 0.15) 0%, rgba(79, 70, 229, 0) 70%);
        }
      `}} />
    </div>
  );
}