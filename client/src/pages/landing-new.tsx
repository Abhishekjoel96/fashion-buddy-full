import { Button } from "@/components/ui/button";
import { Check, CheckCircle, ChevronRight, Sparkles, Star, Zap } from "lucide-react";
import { Link } from "wouter";
import { useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
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
    <motion.div 
      className="group flex flex-col gap-6 rounded-xl p-8 transition-all duration-300 hover:bg-gray-900/80 backdrop-blur-lg hover:shadow-2xl border border-gray-800/30 relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{ 
        scale: 1.03,
        boxShadow: "0 25px 50px -12px rgba(79, 70, 229, 0.25)"
      }}
    >
      {/* Glowing background element */}
      <div className="absolute -inset-1 opacity-0 group-hover:opacity-20 bg-gradient-to-r from-primary to-indigo-600 blur-xl transition-all duration-700 group-hover:duration-500"></div>
      
      {/* Card content with glass morphism */}
      <div className="relative z-10">
        <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-all duration-300 shadow-lg shadow-primary/10">
          <motion.div
            animate={{ rotate: [0, 10, 0, -10, 0] }}
            transition={{ 
              repeat: Infinity, 
              repeatType: "loop", 
              duration: 5,
              ease: "easeInOut"
            }}
          >
            {icon}
          </motion.div>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2 text-white mt-6 group-hover:text-primary transition-colors duration-300">{title}</h3>
          <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
        </div>
        <motion.div 
          className="flex items-center text-primary text-sm font-medium mt-4"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <span className="mr-2">Learn more</span>
          <motion.div
            animate={{ x: [0, 5, 0] }}
            transition={{ 
              repeat: Infinity, 
              repeatType: "loop", 
              duration: 1.5,
              ease: "easeInOut"
            }}
          >
            <ChevronRight size={16} />
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
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
    <motion.div 
      className={cn(
        "rounded-xl border p-8 relative backdrop-blur-md transition-all duration-300",
        popular 
          ? "border-primary/50 bg-gray-900/80 shadow-lg shadow-primary/20" 
          : "border-gray-800/50 bg-gray-900/40 hover:border-primary/30"
      )}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.6, 
        delay: popular ? 0 : 0.2,
        type: "spring",
        stiffness: 50
      }}
      whileHover={{ 
        y: -5,
        boxShadow: popular 
          ? "0 25px 50px -12px rgba(79, 70, 229, 0.35)" 
          : "0 15px 30px -12px rgba(0, 0, 0, 0.3)"
      }}
    >
      {/* Glass morphism blur effect */}
      <div className={cn(
        "absolute inset-0 rounded-xl bg-gradient-to-b opacity-20 blur-xl -z-10",
        popular 
          ? "from-primary/40 to-indigo-600/30" 
          : "from-gray-700/30 to-gray-900/20"
      )} />
      
      {popular && (
        <motion.div 
          className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-xs font-semibold shadow-lg"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          Most Popular
        </motion.div>
      )}
      
      <motion.div 
        className="flex flex-col gap-4"
        transition={{ staggerChildren: 0.1 }}
      >
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <div className="mt-2">
          <span className={cn(
            "text-4xl font-bold",
            popular ? "bg-gradient-to-r from-blue-400 to-indigo-600 bg-clip-text text-transparent" : "text-white"
          )}>{price}</span>
          {price !== "Free" && <span className="text-gray-400">/month</span>}
        </div>
        <p className="text-gray-400 mt-2 text-sm">{description}</p>
        
        <ul className="mt-6 space-y-3">
          {features.map((feature, index) => (
            <motion.li 
              key={index} 
              className="flex items-start gap-3"
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + (index * 0.1) }}
            >
              <motion.span 
                className={cn(
                  "mt-1 rounded-full",
                  popular ? "text-primary" : "text-blue-400"
                )}
                whileHover={{ scale: 1.2 }}
              >
                <Check size={16} />
              </motion.span>
              <span className="text-sm text-gray-300">{feature}</span>
            </motion.li>
          ))}
        </ul>
        
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button className={cn(
            "mt-8 w-full shadow-lg transition-all duration-300",
            popular 
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white border-0" 
              : "bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
          )}>
            {buttonText}
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
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
    <motion.div 
      className="flex gap-6 group"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: number * 0.2
      }}
      viewport={{ once: true, margin: "-100px" }}
    >
      <div className="relative">
        {/* Number with 3D effect and glow */}
        <motion.div
          className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-white font-bold text-lg border border-gray-700 group-hover:border-primary group-hover:bg-primary/10 transition-all duration-300 shadow-lg relative z-10"
          whileHover={{ 
            scale: 1.1,
            boxShadow: "0 0 20px rgba(79, 70, 229, 0.3)"
          }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Inner glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/10 to-indigo-600/5 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300"></div>
          
          {/* Number with shadow for 3D effect */}
          <motion.span 
            className="relative z-10 bg-gradient-to-br from-white to-gray-300 bg-clip-text text-transparent drop-shadow-[0_0.5px_1px_rgba(0,0,0,0.5)] text-xl font-bold"
            animate={{
              textShadow: [
                "0 0 5px rgba(79, 70, 229, 0)",
                "0 0 10px rgba(79, 70, 229, 0.3)",
                "0 0 5px rgba(79, 70, 229, 0)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity, delay: number * 0.5 }}
          >
            {number}
          </motion.span>
        </motion.div>
        
        {/* Connecting line with animation */}
        {number < 3 && (
          <motion.div 
            className="absolute top-14 left-1/2 transform -translate-x-1/2 w-0.5 h-24 bg-gradient-to-b from-gray-800 via-gray-700 to-gray-800 group-hover:from-primary/50 group-hover:via-indigo-500/30 group-hover:to-primary/10 transition-all duration-700"
            initial={{ scaleY: 0, opacity: 0.3 }}
            whileInView={{ scaleY: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {/* Animated dot traveling down the line */}
            <motion.div
              className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary/70 shadow-[0_0_5px_rgba(79,70,229,0.5)]"
              animate={{
                y: [0, 100, 0],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: number * 0.5
              }}
            />
          </motion.div>
        )}
      </div>
      
      <motion.div 
        className="pt-3 pb-12"
        whileHover={{ x: 5 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <motion.h3 
          className="text-white text-xl font-medium mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
          animate={{
            textShadow: [
              "0 0 5px rgba(255, 255, 255, 0.1)",
              "0 0 8px rgba(255, 255, 255, 0.2)",
              "0 0 5px rgba(255, 255, 255, 0.1)"
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {title}
        </motion.h3>
        <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
      </motion.div>
    </motion.div>
  );
}

function ScrollDownIndicator() {
  return (
    <motion.div 
      className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center z-20"
      initial={{ opacity: 0, y: -20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        transition: { 
          delay: 1.5,
          duration: 0.8 
        }
      }}
      whileHover={{ scale: 1.1 }}
    >
      {/* Text with glow effect */}
      <motion.p 
        className="text-sm font-medium bg-gradient-to-r from-gray-100 to-gray-300 bg-clip-text text-transparent mb-3"
        animate={{
          textShadow: [
            "0 0 3px rgba(255,255,255,0.1)",
            "0 0 8px rgba(255,255,255,0.3)",
            "0 0 3px rgba(255,255,255,0.1)"
          ]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        Scroll Down
      </motion.p>
      
      {/* 3D mouse with animated scroll indicator */}
      <motion.div 
        className="w-6 h-10 border-2 border-gray-500/50 rounded-full flex justify-center relative overflow-hidden backdrop-blur-sm shadow-[0_0_15px_rgba(255,255,255,0.1)]"
        animate={{ 
          boxShadow: [
            "0 0 5px rgba(255,255,255,0.1)",
            "0 0 15px rgba(255,255,255,0.2)",
            "0 0 5px rgba(255,255,255,0.1)"
          ] 
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {/* Inner glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-50"></div>
        
        {/* Animated dot */}
        <motion.div 
          className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_5px_rgba(79,70,229,0.5)]"
          initial={{ y: 2 }}
          animate={{ 
            y: [2, 6, 2],
            opacity: [0.8, 1, 0.8],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          }}
        />
      </motion.div>
      
      {/* Down arrow with fade effect */}
      <motion.div
        className="mt-1"
        animate={{ 
          y: [0, 3, 0],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
          delay: 0.5
        }}
      >
        <svg width="16" height="8" viewBox="0 0 16 8" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 1L8 7L15 1" stroke="url(#paint0_linear)" strokeWidth="2" strokeLinecap="round"/>
          <defs>
            <linearGradient id="paint0_linear" x1="8" y1="7" x2="8" y2="1" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4F46E5" stopOpacity="0.8"/>
              <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.5"/>
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
    </motion.div>
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
        {/* Dynamic animated grid background */}
        <div className="absolute inset-0 z-0 bg-black">
          {/* Grid pattern */}
          <div 
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: `linear-gradient(rgba(79, 70, 229, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(79, 70, 229, 0.1) 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }}
          ></div>
          
          {/* Animated dots at grid intersections */}
          <div className="absolute inset-0 opacity-30">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-1 w-1 rounded-full bg-indigo-500"
                style={{
                  top: `${Math.floor(i / 5) * 25}%`,
                  left: `${(i % 5) * 25}%`,
                }}
                animate={{
                  opacity: [0.2, 0.8, 0.2],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 3 + (i % 4),
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
          
          {/* Horizontal lines animation */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={`h-${i}`}
              className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"
              style={{ top: `${(i + 1) * 20}%` }}
              animate={{
                opacity: [0.1, 0.3, 0.1],
                scaleX: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                delay: i * 0.5,
              }}
            />
          ))}
          
          {/* Vertical lines animation */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={`v-${i}`}
              className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-blue-500/20 to-transparent"
              style={{ left: `${(i + 1) * 20}%` }}
              animate={{
                opacity: [0.1, 0.3, 0.1],
                scaleY: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                delay: i * 0.5,
              }}
            />
          ))}
        </div>
        
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 via-purple-800/10 to-black opacity-50 z-0"></div>
        <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-indigo-600/20 to-transparent z-0"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 via-purple-800/20 to-black z-0"></div>
        
        {/* Floating blurred particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute rounded-full blur-xl opacity-20 bg-primary"
            style={{
              width: 100 + Math.random() * 200,
              height: 100 + Math.random() * 200,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [
                Math.random() * 50 - 25, 
                Math.random() * 50 - 25,
                Math.random() * 50 - 25
              ],
              y: [
                Math.random() * 50 - 25, 
                Math.random() * 50 - 25,
                Math.random() * 50 - 25
              ],
              opacity: [0.1, 0.2, 0.1],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 15 + Math.random() * 15,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}

        <div className="relative z-10 container mx-auto px-6 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-16">
              <motion.div 
                className="md:w-3/5 text-center md:text-left"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
              >
                {/* Floating 3D Text with Neon Glow */}
                <div className="relative mb-4">
                  {/* Text shadow blur for neon effect */}
                  <div className="absolute -inset-1 blur-xl bg-gradient-to-r from-blue-600/20 to-indigo-600/20 opacity-70"></div>
                  
                  <motion.h1 
                    className="relative text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight"
                    initial={{ y: 20 }}
                    animate={{ y: 0 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 100,
                      damping: 20
                    }}
                  >
                    <motion.span 
                      className="block bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent drop-shadow-xl"
                      animate={{ 
                        y: [0, -8, 0],
                        rotateX: [0, 2, 0],
                        textShadow: [
                          "0 0 5px rgba(255,255,255,0.1)",
                          "0 0 15px rgba(255,255,255,0.3)",
                          "0 0 5px rgba(255,255,255,0.1)"
                        ]
                      }}
                      transition={{ 
                        duration: 6, 
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                    >
                      AI Fashion
                    </motion.span>
                    
                    <motion.span 
                      className="block bg-gradient-to-r from-blue-400 to-indigo-600 bg-clip-text text-transparent drop-shadow-xl"
                      animate={{ 
                        y: [0, -5, 0],
                        rotateX: [0, 5, 0],
                        textShadow: [
                          "0 0 5px rgba(79, 70, 229, 0.2)",
                          "0 0 20px rgba(79, 70, 229, 0.6)",
                          "0 0 5px rgba(79, 70, 229, 0.2)"
                        ]
                      }}
                      transition={{ 
                        duration: 5, 
                        repeat: Infinity,
                        repeatType: "reverse",
                        delay: 0.5
                      }}
                    >
                      Assistant
                    </motion.span>
                    
                    <motion.span 
                      className="block text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400 drop-shadow-xl"
                      animate={{ 
                        y: [0, -3, 0],
                        rotateX: [0, 3, 0],
                        textShadow: [
                          "0 0 5px rgba(255,255,255,0.1)",
                          "0 0 10px rgba(255,255,255,0.2)",
                          "0 0 5px rgba(255,255,255,0.1)"
                        ]
                      }}
                      transition={{ 
                        duration: 7, 
                        repeat: Infinity,
                        repeatType: "reverse",
                        delay: 1
                      }}
                    >
                      on WhatsApp
                    </motion.span>
                  </motion.h1>
                </div>
                
                <motion.p 
                  className="mt-8 text-lg text-gray-400 max-w-xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  Discover your perfect style with personalized color recommendations, 
                  virtual try-ons, and curated shopping suggestions.
                </motion.p>
                
                <motion.div 
                  className="mt-10 flex flex-col sm:flex-row gap-4 justify-center md:justify-start"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      size="lg" 
                      className="relative bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 transition-all duration-300 text-white border-0 px-8 py-6 overflow-hidden group"
                      asChild
                    >
                      <Link href="/auth">
                        {/* Animation glow effect */}
                        <span className="absolute -inset-px bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover:opacity-20 group-hover:blur-md transition-all duration-300 rounded-md"></span>
                        Get Started
                      </Link>
                    </Button>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="text-white border-gray-700 hover:bg-gray-900 px-8 py-6 transition-all duration-300"
                      onClick={() => {
                        document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      How it Works
                    </Button>
                  </motion.div>
                </motion.div>

                <motion.div 
                  className="mt-16 flex items-center gap-10 justify-center md:justify-start"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9, duration: 0.6 }}
                >
                  <motion.div 
                    className="flex flex-col items-center md:items-start"
                    whileHover={{ scale: 1.1, y: -5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <motion.p 
                      className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-600 bg-clip-text text-transparent"
                      animate={{
                        textShadow: [
                          "0 0 3px rgba(79, 70, 229, 0.2)",
                          "0 0 8px rgba(79, 70, 229, 0.4)",
                          "0 0 3px rgba(79, 70, 229, 0.2)"
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      10K+
                    </motion.p>
                    <p className="text-sm text-gray-400">Happy Users</p>
                  </motion.div>
                  
                  <div className="hidden md:block w-px h-10 bg-gray-800"></div>
                  
                  <motion.div 
                    className="flex flex-col items-center md:items-start"
                    whileHover={{ scale: 1.1, y: -5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <motion.p 
                      className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-600 bg-clip-text text-transparent"
                      animate={{
                        textShadow: [
                          "0 0 3px rgba(79, 70, 229, 0.2)",
                          "0 0 8px rgba(79, 70, 229, 0.4)",
                          "0 0 3px rgba(79, 70, 229, 0.2)"
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                    >
                      50K+
                    </motion.p>
                    <p className="text-sm text-gray-400">Color Analyses</p>
                  </motion.div>
                  
                  <div className="hidden md:block w-px h-10 bg-gray-800"></div>
                  
                  <motion.div 
                    className="flex flex-col items-center md:items-start"
                    whileHover={{ scale: 1.1, y: -5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <motion.p 
                      className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-600 bg-clip-text text-transparent"
                      animate={{
                        textShadow: [
                          "0 0 3px rgba(79, 70, 229, 0.2)",
                          "0 0 8px rgba(79, 70, 229, 0.4)",
                          "0 0 3px rgba(79, 70, 229, 0.2)"
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                    >
                      90%
                    </motion.p>
                    <p className="text-sm text-gray-400">Satisfaction Rate</p>
                  </motion.div>
                </motion.div>
              </motion.div>

              <motion.div 
                className="md:w-2/5 mt-12 md:mt-0 order-first md:order-last"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <motion.div 
                  className="relative h-[580px] w-[300px] mx-auto"
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 50,
                    damping: 20,
                    delay: 0.5 
                  }}
                  whileHover={{ 
                    y: -10,
                    transition: { duration: 0.5 }
                  }}
                >
                  {/* Glowing effect around phone */}
                  <motion.div 
                    className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-700/30 to-indigo-700/30 rounded-[40px] blur-[60px]"
                    animate={{ 
                      opacity: [0.4, 0.8, 0.4],
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ 
                      duration: 5, 
                      repeat: Infinity,
                      repeatType: "reverse" 
                    }}
                  />
                  
                  {/* Floating animated particles behind phone */}
                  <div className="absolute inset-0 -z-10">
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-2 h-2 rounded-full bg-primary/40"
                        animate={{
                          x: [Math.random() * 100, Math.random() * 200, Math.random() * 100],
                          y: [Math.random() * 100, Math.random() * 500, Math.random() * 100],
                          opacity: [0.1, 0.5, 0.1],
                          scale: [1, 1.5, 1]
                        }}
                        transition={{
                          duration: 10 + Math.random() * 10,
                          repeat: Infinity,
                          repeatType: "reverse",
                          delay: i * 0.5
                        }}
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* 3D Raised and Floating Phone */}
                  <motion.div 
                    className="relative h-full w-full bg-gray-900 border border-gray-800/50 rounded-[40px] overflow-hidden shadow-[0_0_40px_rgba(60,60,60,0.3)] backdrop-blur-sm"
                    animate={{ 
                      y: [0, -10, 0],
                      rotate: [0, 0.5, 0, -0.5, 0]
                    }}
                    transition={{ 
                      duration: 8, 
                      repeat: Infinity,
                      repeatType: "reverse" 
                    }}
                  >
                    {/* Phone notch */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/3 h-6 bg-black rounded-b-xl z-10"></div>
                    
                    {/* Screen content */}
                    <div className="p-4 h-full flex flex-col">
                      {/* WhatsApp header */}
                      <div className="bg-[#075E54] text-white p-3 rounded-t-xl flex items-center shadow-md">
                        <motion.div 
                          className="w-8 h-8 rounded-full bg-gray-200 mr-3 flex items-center justify-center shadow-inner"
                          whileHover={{ scale: 1.2, rotate: 360 }}
                          transition={{ duration: 0.5 }}
                        >
                          <span className="text-xs font-bold text-[#075E54]">FB</span>
                        </motion.div>
                        <div>
                          <p className="font-medium text-sm">Fashion Buddy</p>
                          <div className="flex items-center">
                            <span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-1 animate-pulse"></span>
                            <p className="text-xs text-green-100 opacity-80">Online</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Chat content with staggered animation */}
                      <div className="flex-1 bg-gradient-to-b from-gray-900/80 to-gray-800/80 backdrop-blur-md p-3 flex flex-col gap-3 overflow-y-auto">
                        {/* User message 1 */}
                        <motion.div 
                          className="bg-gradient-to-r from-indigo-900/30 to-blue-900/30 p-2 rounded-lg max-w-[80%] self-end backdrop-blur-sm border border-indigo-500/10 shadow-lg"
                          initial={{ opacity: 0, x: 50 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1, duration: 0.5 }}
                        >
                          <p className="text-xs text-white">Hi! I want to know what colors look best on me.</p>
                          <p className="text-[10px] text-gray-400 text-right">10:42 AM</p>
                        </motion.div>
                        
                        {/* AI response 1 */}
                        <motion.div 
                          className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 p-2 rounded-lg max-w-[80%] border border-gray-700/30 shadow-lg"
                          initial={{ opacity: 0, x: -50 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1.5, duration: 0.5 }}
                        >
                          <p className="text-xs text-white">Hello! I'd be happy to help. Could you send me a selfie in natural light?</p>
                          <p className="text-[10px] text-gray-400 text-right">10:43 AM</p>
                        </motion.div>
                        
                        {/* User message 2 with photo */}
                        <motion.div 
                          className="bg-gradient-to-r from-indigo-900/30 to-blue-900/30 p-2 rounded-lg max-w-[80%] self-end backdrop-blur-sm border border-indigo-500/10 shadow-lg"
                          initial={{ opacity: 0, x: 50 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 2, duration: 0.5 }}
                        >
                          <motion.div 
                            className="bg-gray-700 h-32 w-full rounded-md mb-1 flex items-center justify-center overflow-hidden"
                            whileHover={{ scale: 1.05 }}
                          >
                            <p className="text-[10px] text-gray-400">User Selfie</p>
                          </motion.div>
                          <p className="text-[10px] text-gray-400 text-right">10:45 AM</p>
                        </motion.div>
                        
                        {/* AI response 2 with color recommendations */}
                        <motion.div 
                          className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 p-2 rounded-lg max-w-[80%] border border-gray-700/30 shadow-lg"
                          initial={{ opacity: 0, x: -50 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 2.5, duration: 0.5 }}
                        >
                          <p className="text-xs text-white">Based on your skin tone, I recommend:</p>
                          <div className="my-2 flex gap-1">
                            <motion.div 
                              className="w-6 h-6 rounded-full bg-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                              whileHover={{ scale: 1.2 }}
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                            />
                            <motion.div 
                              className="w-6 h-6 rounded-full bg-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                              whileHover={{ scale: 1.2 }}
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                            />
                            <motion.div 
                              className="w-6 h-6 rounded-full bg-violet-600 shadow-[0_0_10px_rgba(124,58,237,0.5)]"
                              whileHover={{ scale: 1.2 }}
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                            />
                          </div>
                          <p className="text-xs text-white">Would you like to see clothes in these colors?</p>
                          <p className="text-[10px] text-gray-400 text-right">10:46 AM</p>
                        </motion.div>
                        
                        {/* User message 3 */}
                        <motion.div 
                          className="bg-gradient-to-r from-indigo-900/30 to-blue-900/30 p-2 rounded-lg max-w-[80%] self-end backdrop-blur-sm border border-indigo-500/10 shadow-lg"
                          initial={{ opacity: 0, x: 50 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 3, duration: 0.5 }}
                        >
                          <p className="text-xs text-white">Yes, please show me some shirts!</p>
                          <p className="text-[10px] text-gray-400 text-right">10:47 AM</p>
                        </motion.div>
                      </div>
                      
                      {/* Input field */}
                      <div className="bg-[#1F2C34] p-2 rounded-b-xl flex items-center gap-2 shadow-md">
                        <div className="flex-1 bg-[#2A3942] rounded-full px-3 py-1.5 shadow-inner">
                          <p className="text-xs text-gray-400">Type a message</p>
                        </div>
                        <motion.div 
                          className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center shadow-lg cursor-pointer"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 12L4 4L6 12L4 20L20 12Z" fill="white"/>
                          </svg>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* Reflection effect */}
                  <div className="absolute top-[5%] bottom-[70%] left-[10%] right-[10%] bg-white/5 -z-10 blur-md rounded-full transform rotate-[15deg]"></div>
                </motion.div>
              </motion.div>
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
                        src="/images/mans-skin-tone.jpeg" 
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
                      <Button 
                        className="w-full bg-primary hover:bg-primary/90"
                        asChild
                      >
                        <Link href="/auth">Try it Yourself</Link>
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
                    src="/images/mans-skin-tone.jpeg" 
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
                    src="/images/product-recommendations.jpeg" 
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
                Fashion BuddyAI
              </div>
              <p className="text-sm text-gray-400 max-w-xs">
                Your personal AI fashion assistant on WhatsApp, powered by artificial intelligence and designed for Indian fashion and skin tones.
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