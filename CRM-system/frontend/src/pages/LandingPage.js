import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, BarChart3, Calendar, MessageSquare, TrendingUp, Shield
} from 'lucide-react';
import logo from '../assets/logo.png';

const LandingPage = () => {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const features = [
    {
      icon: Users,
      title: 'Client Management',
      description: 'Organize all your clients in one place'
    },
    {
      icon: BarChart3,
      title: 'Sales Analytics',
      description: 'Track performance with real-time insights'
    },
    {
      icon: Calendar,
      title: 'Smart Scheduling',
      description: 'Never miss important meetings'
    },
    {
      icon: MessageSquare,
      title: 'WhatsApp Integration',
      description: 'Connect with clients instantly'
    },
    {
      icon: TrendingUp,
      title: 'Deal Pipeline',
      description: 'Manage your sales pipeline efficiently'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-gray-50 overflow-hidden relative">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          style={{ x: mousePosition.x, y: mousePosition.y }}
          className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-orange-400/20 to-red-400/20 rounded-full blur-3xl"
        />
        <motion.div
          style={{ x: -mousePosition.x, y: -mousePosition.y }}
          className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-orange-500/20 to-orange-300/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-orange-500/10 to-transparent rounded-full blur-3xl"
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 py-12 min-h-screen flex flex-col">
        {/* Logo and Brand */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center mb-16"
        >
          <motion.div
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-2xl shadow-2xl"
          >
            <img src={logo} alt="Logo" className="w-12 h-12 object-contain" />
          </motion.div>
          <div className="ml-4">
            <h1 className="text-3xl font-bold text-gray-900">xtreative CRM</h1>
            <p className="text-sm text-orange-600 font-medium">Sales Excellence</p>
          </div>
        </motion.div>

        {/* Hero Text */}
        <div className="text-center mb-16 max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight"
          >
            Grow Your Business
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-orange-600 to-red-500"
            >
              Smarter & Faster
            </motion.span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed"
          >
            The simple CRM built for small businesses
          </motion.p>
          {/* Single CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/login')}
              className="group relative px-12 py-5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl text-xl font-semibold shadow-2xl shadow-orange-500/40 overflow-hidden"
            >
              <span className="relative z-10">Get Started</span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600"
                initial={{ x: "-100%" }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>
          </motion.div>
        </div>

        {/* Floating Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1, type: "spring", stiffness: 100 }}
              whileHover={{ y: -15, rotateY: 5, rotateX: 5 }}
              className="group relative"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
              
              {/* Floating animation */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3 + index * 0.5, repeat: Infinity, ease: "easeInOut" }}
                className="relative p-8 backdrop-blur-xl bg-white/70 border border-white/60 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.2 }}
                  transition={{ duration: 0.6 }}
                  className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
                >
                  <feature.icon className="w-8 h-8 text-white" />
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                
                {/* Decorative corner */}
                <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full blur-2xl" />
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Simple Footer */}
      <footer className="relative z-10 backdrop-blur-md bg-white/70 border-t border-white/60 py-8 mt-auto">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-3"
            >
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="bg-gradient-to-br from-orange-500 to-orange-600 p-2 rounded-xl shadow-lg"
              >
                <img src={logo} alt="Logo" className="w-6 h-6 object-contain" />
              </motion.div>
              <div>
                <span className="text-lg font-bold text-gray-900">xtreative CRM</span>
                <p className="text-xs text-orange-600 font-medium">Sales Excellence</p>
              </div>
            </motion.div>

            <p className="text-gray-600 text-sm">
              © 2026 Xtreative CRM. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
