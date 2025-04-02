import { Button } from "@/components/ui/button";
import { Check, CheckCircle, Sparkles, Star, Zap } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
}

function FeatureCard({ title, description, icon, className }: FeatureCardProps) {
  return (
    <div className={cn("rounded-lg p-6 flex flex-col gap-4", className)}>
      <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center text-primary">
        {icon}
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}

interface TestimonialProps {
  quote: string;
  author: string;
  role: string;
  image: string;
}

function Testimonial({ quote, author, role, image }: TestimonialProps) {
  return (
    <div className="rounded-lg bg-white dark:bg-slate-900 shadow-md p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2 text-yellow-500">
        <Star className="fill-yellow-500 stroke-yellow-500" size={16} />
        <Star className="fill-yellow-500 stroke-yellow-500" size={16} />
        <Star className="fill-yellow-500 stroke-yellow-500" size={16} />
        <Star className="fill-yellow-500 stroke-yellow-500" size={16} />
        <Star className="fill-yellow-500 stroke-yellow-500" size={16} />
      </div>
      <p className="text-gray-700 dark:text-gray-300 italic">"{quote}"</p>
      <div className="flex items-center gap-3 mt-2">
        <img
          src={image}
          alt={author}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <p className="font-semibold">{author}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{role}</p>
        </div>
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
  buttonVariant?: "default" | "outline" | "gradient";
  popular?: boolean;
}

function PricingCard({
  title,
  price,
  description,
  features,
  buttonText,
  buttonVariant = "default",
  popular = false,
}: PricingCardProps) {
  return (
    <div className={cn(
      "rounded-xl border p-6 shadow-sm relative",
      popular ? "border-primary" : "border-gray-200 dark:border-gray-800"
    )}>
      {popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-white px-3 py-1 rounded-full text-xs font-semibold">
          Most Popular
        </div>
      )}
      <div className="flex flex-col gap-4">
        <h3 className="text-xl font-bold">{title}</h3>
        <div className="mt-2">
          <span className="text-3xl font-bold">{price}</span>
          {price !== "Free" && <span className="text-gray-500 dark:text-gray-400">/month</span>}
        </div>
        <p className="text-gray-500 dark:text-gray-400 mt-2">{description}</p>
        <ul className="mt-4 space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <CheckCircle className="text-primary" size={18} />
              <span className="text-gray-700 dark:text-gray-300">{feature}</span>
            </li>
          ))}
        </ul>
        <Button className="mt-6 w-full" variant={buttonVariant}>
          {buttonText}
        </Button>
      </div>
    </div>
  );
}

interface StepItemProps {
  number: number;
  title: string;
  description: string;
  image?: string;
}

function StepItem({ number, title, description, image }: StepItemProps) {
  return (
    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
      <div className="rounded-full bg-primary text-white w-12 h-12 flex items-center justify-center font-bold text-xl flex-shrink-0">
        {number}
      </div>
      <div className="flex-1">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400">{description}</p>
      </div>
      {image && (
        <div className="md:w-1/3 w-full rounded-lg overflow-hidden shadow-lg mt-4 md:mt-0">
          <img src={image} alt={title} className="w-full h-auto" />
        </div>
      )}
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  label: string;
  onClick: () => void;
}

function TabButton({ active, label, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-lg font-medium transition-all",
        active
          ? "bg-primary text-white shadow-md"
          : "bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
      )}
    >
      {label}
    </button>
  );
}

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"color" | "tryon">("color");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hero section */}
      <header className="bg-gradient-to-br from-primary/90 to-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
        <div className="container mx-auto px-4 py-20">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2 text-white z-10">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Your Personal AI Fashion Assistant on WhatsApp
              </h1>
              <p className="mt-6 text-lg opacity-90">
                Get personalized fashion recommendations based on your skin tone,
                shop effortlessly, and try on clothes virtually – all through
                WhatsApp.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-white text-primary hover:bg-gray-100">
                  Start for Free
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Premium Subscription
                </Button>
              </div>
            </div>
            <div className="md:w-1/2 relative">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-xl max-w-md mx-auto">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2 mb-4">
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center mr-3">
                      <span className="text-white font-bold">FB</span>
                    </div>
                    <div>
                      <h3 className="font-semibold">Fashion Buddy</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">WhatsApp Fashion Assistant</p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-3 mb-3 max-w-[80%]">
                    Hello! I'm your personal fashion assistant. Send me a selfie for personalized color analysis.
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 mb-3 ml-auto max-w-[80%]">
                    I want to know what colors suit me best!
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-3 max-w-[80%]">
                    Based on your skin tone, I recommend Deep Blue, Emerald Green, and Ruby Red. Would you like to see clothing in these colors?
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">Try for Free</Button>
                  <Button size="sm" className="flex-1">Learn More</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features section */}
      <section className="py-20 container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Why Choose Fashion Buddy?</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Our AI-powered fashion assistant transforms your shopping experience
            with personalized recommendations tailored to your unique features.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            title="Personalized Color Analysis"
            description="Get custom color recommendations based on your skin tone and facial features, specifically calibrated for Indian skin tones."
            icon={<Sparkles size={24} />}
            className="bg-violet-50 dark:bg-violet-950/40"
          />
          <FeatureCard
            title="Virtual Try-On Technology"
            description="See exactly how clothes would look on you before buying. Visualize different styles and colors instantly."
            icon={<Zap size={24} />}
            className="bg-blue-50 dark:bg-blue-950/40"
          />
          <FeatureCard
            title="Smart Shopping Integration"
            description="Shop from major Indian e-commerce platforms with recommendations filtered by your budget and style preferences."
            icon={<Check size={24} />}
            className="bg-emerald-50 dark:bg-emerald-950/40"
          />
        </div>
      </section>

      {/* How It Works section */}
      <section className="py-20 bg-gray-100 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Experience fashion shopping reimagined with our innovative AI technology.
            </p>
          </div>

          <div className="flex justify-center mb-12">
            <div className="inline-flex bg-gray-200 dark:bg-gray-800 p-1 rounded-lg">
              <TabButton 
                active={activeTab === "color"} 
                label="Color Analysis" 
                onClick={() => setActiveTab("color")}
              />
              <TabButton 
                active={activeTab === "tryon"} 
                label="Virtual Try-On" 
                onClick={() => setActiveTab("tryon")}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md">
            {activeTab === "color" ? (
              <div>
                <div className="mb-8">
                  <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 text-transparent bg-clip-text">
                    The Science Behind Your Perfect Colors
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Discover the colors that enhance your natural beauty, specifically calibrated for diverse Indian skin tones.
                  </p>
                </div>

                <div className="space-y-10 mt-10">
                  <StepItem
                    number={1}
                    title="Upload a Selfie Through WhatsApp"
                    description="Take a well-lit selfie in natural light without filters. The clearer the image, the more accurate your color analysis will be."
                    image="/selfie-upload.svg"
                  />
                  <StepItem
                    number={2}
                    title="AI Analyzes Your Skin Undertones"
                    description="Our advanced AI examines 27 facial points to identify your specific undertones and determine your skin tone category among common Indian skin tones."
                    image="/ai-analysis.svg"
                  />
                  <StepItem
                    number={3}
                    title="Receive Your Personalized Color Palette"
                    description="Get a custom palette showing your most complementary colors and which ones to avoid. Studies show wearing your ideal colors can boost appearance perception by 40%."
                    image="/color-palette.svg"
                  />
                </div>

                <div className="mt-10 bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
                  <h4 className="font-semibold mb-2">Did You Know?</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Color psychology shows that wearing colors that complement your natural skin tone can make you appear more vibrant, healthy, and confident. Our algorithm is specially calibrated for the wide range of Indian skin tones from fair to deep.
                  </p>
                </div>

                <div className="mt-8">
                  <Testimonial
                    quote="The color analysis was spot on! I've always struggled finding clothes that suit my skin tone, but the recommendations were perfect. Shopping is so much easier now."
                    author="Priya Sharma"
                    role="Fashion Enthusiast, Mumbai"
                    image="/selfie-upload.svg"
                  />
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-8">
                  <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary to-blue-600 text-transparent bg-clip-text">
                    See It Before You Buy It
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Experience how clothes would look on you without physically trying them on, saving time and reducing purchase regret.
                  </p>
                </div>

                <div className="space-y-10 mt-10">
                  <StepItem
                    number={1}
                    title="Send a Full-Body Photo"
                    description="Take a simple full-body photo in a neutral pose. Our system works with all Indian body types and provides accurate virtual try-ons."
                    image="/fullbody-upload.svg"
                  />
                  <StepItem
                    number={2}
                    title="Browse Recommended Outfits"
                    description="AI generates outfit recommendations in your most flattering colors based on your skin tone analysis, body type, and style preferences."
                    image="/product-recommendations.svg"
                  />
                  <StepItem
                    number={3}
                    title="See Yourself in New Clothes"
                    description="Instantly visualize how different shirts would look on you. Choose your favorites and make confident purchase decisions."
                    image="/virtual-tryon.svg"
                  />
                </div>

                <div className="mt-10 bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
                  <h4 className="font-semibold mb-2">Impressive Results</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Our virtual try-on technology reduces purchase regret by 70%, allowing you to make confident buying decisions. The technology is specifically optimized for Indian body types and the most popular clothing styles from Indian fashion brands.
                  </p>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow">
                    <h5 className="font-medium mb-2 text-red-500">Unflattering Colors</h5>
                    <img
                      src="/garment-sample.svg"
                      alt="Unflattering clothing example"
                      className="w-full h-auto rounded"
                    />
                  </div>
                  <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow">
                    <h5 className="font-medium mb-2 text-green-500">Flattering Colors</h5>
                    <img
                      src="/garment-sample.svg"
                      alt="Flattering clothing example"
                      className="w-full h-auto rounded"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Pricing section */}
      <section className="py-20 container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Get started for free or upgrade to premium for enhanced features and unlimited access.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <PricingCard
            title="Free"
            price="Free"
            description="Perfect for trying out our service"
            features={[
              "1 color analysis per month",
              "3 complementary colors",
              "1 virtual try-on per month",
              "Limited product recommendations",
              "Basic customer support"
            ]}
            buttonText="Start for Free"
            buttonVariant="outline"
          />
          
          <PricingCard
            title="Premium"
            price="₹129"
            description="Unlock the full potential"
            features={[
              "10 color analyses per month",
              "5 complementary colors + colors to avoid",
              "10 virtual try-ons per month",
              "Full catalog access",
              "Priority customer support"
            ]}
            buttonText="Subscribe Now"
            popular={true}
            buttonVariant="gradient"
          />
        </div>
      </section>

      {/* CTA section */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Fashion Experience?</h2>
          <p className="max-w-2xl mx-auto mb-8 opacity-90">
            Join thousands of fashion-conscious individuals who are discovering their perfect colors and styles with Fashion Buddy.
          </p>
          <Button size="lg" variant="gradient" asChild>
            <Link href="/dashboard">
              Get Started Now
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Fashion Buddy</h3>
              <p className="text-gray-400">
                Your personal AI fashion assistant on WhatsApp.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Color Analysis</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Virtual Try-On</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Shopping Integration</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Style Recommendations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect With Us</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"></path>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-10 pt-6 text-center text-gray-500">
            <p>© 2025 Fashion Buddy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}