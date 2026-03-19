'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import SlickTechLogo from '@/app/Assets/SlickTech_Logo.png';
import LandingNav from './components/LandingNav';
import AnimatedSection from './components/AnimatedSection';
import Counter from './components/Counter';
import { FaArrowRight, FaCheckCircle, FaUsers, FaCalendarAlt, FaShieldAlt, FaLightbulb, FaRocket, FaStar } from 'react-icons/fa';

type PublicReview = {
  id: number;
  service: string;
  rating: number;
  comment: string;
  customerName: string;
  created_at: string;
};

const HomePage = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const fetchPublicReviews = async () => {
      try {
        const response = await fetch('/api/reviews/public');
        if (!response.ok) {
          throw new Error('Failed to load reviews');
        }

        const payload = await response.json();
        setReviews(Array.isArray(payload?.reviews) ? payload.reviews : []);
      } catch (error) {
        console.warn('Could not load public reviews:', error);
        setReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchPublicReviews();
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Navigation */}
      <LandingNav currentPage="home" />

      {/* Hero Section with Animated Background */}
      <section className="relative min-h-[90vh] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/2 W-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '4s' }}></div>
        </div>

        {/* Dynamic Cursor Glow */}
        <div
          className="absolute w-96 h-96 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mix-blend-screen filter blur-[100px] opacity-10 pointer-events-none transition-all duration-100"
          style={{
            left: `${mousePosition.x - 192}px`,
            top: `${mousePosition.y - 192}px`,
          }}
        ></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="text-center w-full py-20">
            {/* Animated Logo */}
            <div className="mb-8 flex justify-center animate-bounce-in">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-lg opacity-50"></div>
                <Image
                  src={SlickTechLogo}
                  alt="SlickTech Logo"
                  width={100}
                  height={100}
                  className="relative rounded-full shadow-2xl"
                />
              </div>
            </div>

            {/* Animated Headline */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in-up">
              <span className="gradient-text">Transform Your Business</span>
              <br />
              <span className="text-slate-900">With SlickTech Solutions</span>
            </h1>

            {/* Animated Subtitle */}
            <p className="text-xl md:text-2xl text-slate-600 mb-8 max-w-3xl mx-auto animate-fade-in-up leading-relaxed" style={{ animationDelay: '0.2s' }}>
              Cutting-edge technology solutions that empower your business to thrive in the digital age. From infrastructure to innovation, we've got you covered.
            </p>

            {/* Animated CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <Link
                href="/booking"
                className="group inline-flex items-center justify-center rounded-lg bg-blue-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all duration-300 hover:bg-indigo-600 hover:shadow-2xl hover:scale-105 hover:-translate-y-2"
              >
                Get Started Now <FaArrowRight className="ml-2 group-hover:translate-x-2 transition-transform" />
              </Link>
              <Link
                href="/about"
                className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 hover:scale-105"
              >
                Learn More
              </Link>
            </div>

            {/* Animated Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-16 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
              <div className="text-center p-4 glass-effect rounded-lg backdrop-blur-md hover:scale-105 transition-transform">
                <div className="text-3xl font-bold gradient-text"><Counter from={0} to={500} suffix="+" /></div>
                <p className="text-slate-600 text-sm mt-2">Satisfied Clients</p>
              </div>
              <div className="text-center p-4 glass-effect rounded-lg backdrop-blur-md hover:scale-105 transition-transform">
                <div className="text-3xl font-bold gradient-text"><Counter from={0} to={1000} suffix="+" /></div>
                <p className="text-slate-600 text-sm mt-2">Projects Delivered</p>
              </div>
              <div className="text-center p-4 glass-effect rounded-lg backdrop-blur-md hover:scale-105 transition-transform">
                <div className="text-3xl font-bold gradient-text"><Counter from={0} to={15} suffix="+" /></div>
                <p className="text-slate-600 text-sm mt-2">Years Experience</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-blue-600 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-blue-600 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-28 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                Why Businesses Love <span className="gradient-text">SlickTech</span>
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                We combine expertise, reliability, and innovation to deliver exceptional solutions.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: FaUsers, title: 'Expert Team', desc: 'Certified professionals with years of experience' },
              { icon: FaCalendarAlt, title: 'Reliable Service', desc: 'Consistent support and timely delivery' },
              { icon: FaShieldAlt, title: 'Secure Solutions', desc: 'Enterprise-grade security measures' },
            ].map((feature, idx) => (
              <AnimatedSection key={idx} delay={idx * 100}>
                <div className="group p-8 rounded-2xl glass-effect hover:glass-effect-dark transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-2xl">
                  <div className="mb-6 inline-block p-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl group-hover:rotate-12 transition-transform">
                    <feature.icon className="text-4xl text-blue-600 group-hover:text-purple-600 transition-colors" />
                  </div>
                  <h3 className="text-2xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section with Grid Animation */}
      <section className="py-28 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <AnimatedSection>
            <div className="text-center mb-20">
              <span className="inline-block px-4 py-2 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold mb-4">OUR SERVICES</span>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                Comprehensive Tech <span className="gradient-text">Solutions</span>
              </h2>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              'IT Support',
              'System Optimization',
              'Cloud Solutions',
              'Cybersecurity',
              'Network Setup',
              'Data Backup',
              'Software Development',
              'Tech Consulting',
            ].map((service, idx) => (
              <AnimatedSection key={idx} delay={idx * 50}>
                <div className="group relative p-6 bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden">
                  {/* Animated gradient background on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-400 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                  
                  <div className="relative">
                    <FaCheckCircle className="text-green-500 mb-3 text-2xl group-hover:animate-pulse" />
                    <h3 className="font-semibold text-slate-900 group-hover:gradient-text transition-all">{service}</h3>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <AnimatedSection>
              <div className="space-y-8">
                <div>
                  <span className="inline-block px-4 py-2 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold mb-4">INNOVATION</span>
                  <h2 className="text-4xl font-bold text-slate-900 mb-4">
                    Cutting-Edge <span className="gradient-text">Technology</span>
                  </h2>
                </div>

                {[
                  { icon: FaRocket, title: 'Lightning Fast', desc: 'Optimized performance for maximum efficiency' },
                  { icon: FaLightbulb, title: 'Innovative', desc: 'Latest tech stacks and frameworks' },
                  { icon: FaUsers, title: 'Collaborative', desc: 'Working closely with your team' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 rounded-lg hover:bg-blue-50 transition-all cursor-pointer group">
                    <div className="flex-shrink-0 mt-1">
                      <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-500 text-white group-hover:scale-110 transition-transform">
                        <item.icon />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{item.title}</h3>
                      <p className="text-slate-600 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-400 rounded-3xl blur-lg opacity-30"></div>
                <div className="relative bg-gradient-to-br from-blue-100 to-purple-100 p-8 rounded-3xl h-96 flex items-center justify-center">
                  <div className="text-center">
                    <FaRocket className="text-6xl text-blue-600 mx-auto mb-4 animate-bounce" />
                    <p className="text-slate-700 font-semibold">Powering Digital Transformation</p>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* CTA Section with Animated Background */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600"></div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Business?
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
              Join hundreds of satisfied clients who trust SlickTech Solutions for their technology transformation journey.
            </p>
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 px-10 py-4 rounded-lg font-bold text-lg transition-all duration-300 hover:scale-105 shadow-2xl hover:shadow-3xl hover:-translate-y-2 btn-interactive transform"
            >
              Start Your Journey Today <FaArrowRight className="group-hover:translate-x-2" />
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-14">
              <span className="inline-block px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold mb-4">TRUSTED BY CUSTOMERS</span>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                What Clients Say About <span className="gradient-text">SlickTech</span>
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">Real feedback from customers who booked and completed services through our platform.</p>
            </div>
          </AnimatedSection>

          {loadingReviews ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, idx) => (
                <div key={idx} className="h-52 rounded-2xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
              <p className="text-slate-700 font-semibold">No reviews posted yet.</p>
              <p className="mt-2 text-slate-600">Book your first service and leave feedback after completion to help others choose with confidence.</p>
              <Link
                href="/booking"
                className="mt-5 inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Book A Service
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.slice(0, 6).map((review, idx) => (
                <AnimatedSection key={review.id} delay={idx * 80}>
                  <div className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <p className="font-semibold text-slate-900 truncate">{review.customerName}</p>
                      <span className="text-xs text-slate-500">{new Date(review.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1 mb-3 text-amber-500">
                      {[...Array(5)].map((_, starIdx) => (
                        <FaStar key={starIdx} className={starIdx < review.rating ? 'opacity-100' : 'opacity-20'} />
                      ))}
                    </div>
                    <p className="text-sm font-semibold text-blue-700 mb-2">{review.service}</p>
                    <p className="text-slate-600 text-sm leading-relaxed">{review.comment || 'Customer left a star rating without a written comment.'}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer with Animated Elements */}
      <footer className="bg-slate-900 text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-float"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <AnimatedSection delay={0}>
              <div>
                <div className="flex items-center mb-4">
                  <Image
                    src={SlickTechLogo}
                    alt="SlickTech Logo"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <span className="ml-2 text-lg font-bold">SlickTech</span>
                </div>
                <p className="text-slate-400">
                  Empowering businesses with innovative technology solutions.
                </p>
              </div>
            </AnimatedSection>

            {['Company', 'Services', 'Get Started'].map((section, idx) => (
              <AnimatedSection key={idx} delay={100 * (idx + 1)}>
                <div>
                  <h3 className="font-semibold mb-4 text-white">{section}</h3>
                  <ul className="space-y-2 text-slate-400">
                    {section === 'Services' && (
                      <>
                        <li><Link href="/services/it-support" className="hover:text-white transition-colors">IT Support</Link></li>
                        <li><Link href="/services/cloud-solutions" className="hover:text-white transition-colors">Cloud Solutions</Link></li>
                        <li><Link href="/services/cybersecurity" className="hover:text-white transition-colors">Cybersecurity</Link></li>
                      </>
                    )}
                    {section === 'Company' && (
                      <>
                        <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                        <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                        <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                      </>
                    )}
                    {section === 'Get Started' && (
                      <>
                        <li><Link href="/services" className="hover:text-white transition-colors">Explore Services</Link></li>
                        <li><Link href="/support" className="hover:text-white transition-colors">Support</Link></li>
                        <li><Link href="/documentation" className="hover:text-white transition-colors">Documentation</Link></li>
                      </>
                    )}
                  </ul>
                </div>
              </AnimatedSection>
            ))}
          </div>

          <div className="border-t border-slate-800 pt-8">
            <div className="flex justify-between items-center">
              <p className="text-slate-400">&copy; 2026 Swiftspire Technologies. All rights reserved.</p>
              <div className="flex gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-slate-800 hover:bg-blue-600 transition-colors cursor-pointer flex items-center justify-center hover:scale-110 transform duration-300">
                    <FaStar className="text-sm" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;