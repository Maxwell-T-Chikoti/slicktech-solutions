'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import SlickTechLogo from '@/app/Assets/SlickTech_Logo.png';
import LandingNav from '../components/LandingNav';
import AnimatedSection from '../components/AnimatedSection';
import Counter from '../components/Counter';
import { FaArrowRight, FaUsers, FaAward, FaHandshake, FaRocket, FaStar, FaHeart, FaBullseye, FaCheckCircle } from 'react-icons/fa';

const AboutPage = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Navigation */}
      <LandingNav currentPage="about" />

      {/* Hero Section */}
      <section className="relative min-h-[80vh] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
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
            <AnimatedSection>
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                <span className="gradient-text">Transforming Ideas</span>
                <br />
                <span className="text-slate-900">Into Digital Excellence</span>
              </h1>
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                We're a passionate team of technology experts dedicated to helping businesses reach their full potential through innovative solutions and exceptional service.
              </p>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-28 bg-white relative overflow-hidden">
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <AnimatedSection>
              <div>
                <span className="inline-block px-4 py-2 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold mb-4">OUR MISSION</span>
                <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                  Empower Your <span className="gradient-text">Digital Journey</span>
                </h2>
                <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                  We believe technology should work for you, not against you. Our mission is to bridge the gap between innovative solutions and practical business applications, making cutting-edge technology accessible to businesses of all sizes.
                </p>
                <div className="space-y-4">
                  {[
                    'Deliver exceptional, innovative solutions',
                    'Build lasting partnerships with clients',
                    'Drive measurable business impact'
                  ].map((text, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-all cursor-pointer group">
                      <FaCheckCircle className="text-green-500 text-lg flex-shrink-0 group-hover:scale-125 transition-transform" />
                      <span className="text-slate-700 font-medium">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-400 rounded-3xl blur-lg opacity-30"></div>
                <div className="relative bg-gradient-to-br from-blue-100 to-purple-100 p-12 rounded-3xl h-96 flex items-center justify-center">
                  <div className="text-center">
                    <FaRocket className="text-7xl text-blue-600 mx-auto mb-6 animate-bounce" />
                    <p className="text-slate-700 font-semibold text-lg">Innovation at Every Step</p>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-28 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <AnimatedSection>
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-2 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold mb-4">CORE VALUES</span>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                Principles That <span className="gradient-text">Guide Us</span>
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                These core values define who we are and how we work with every client.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: FaHeart, title: 'Client-Centric', desc: 'Your success is our success. We prioritize your needs and work closely with you to achieve meaningful results.' },
              { icon: FaAward, title: 'Excellence', desc: 'We maintain the highest standards in everything we do, from code quality to customer service and attention to detail.' },
              { icon: FaBullseye, title: 'Integrity', desc: 'We build trust through transparency, honesty, and reliable delivery on every commitment we make.' },
            ].map((value, idx) => (
              <AnimatedSection key={idx} delay={idx * 100}>
                <div className="group p-8 rounded-2xl glass-effect hover:glass-effect-dark transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-2xl h-full">
                  <div className="mb-6 inline-block p-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl group-hover:rotate-12 transition-transform group-hover:scale-110">
                    <value.icon className="text-4xl text-blue-600 group-hover:text-purple-600 transition-colors" />
                  </div>
                  <h3 className="text-2xl font-semibold text-slate-900 mb-3">{value.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{value.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-28 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-20">
              <span className="inline-block px-4 py-2 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold mb-4">LEADERSHIP</span>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                Meet Our <span className="gradient-text">Expert Team</span>
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Talented professionals dedicated to your success.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              { initials: 'TM', name: 'Tadiwanashe Musasa', role: 'Head Founder & Networking Specialist', bio: 'Visionary leader with expertise in network architecture and technology infrastructure. Drives innovation and strategic direction for SlickTech.' },
              { initials: 'MC', name: 'Maxwell Chikoti', role: 'Lead Developer', bio: 'Full-stack specialist with expertise in building scalable applications. Passionate about clean code and cutting-edge technologies.' },
            ].map((member, idx) => (
              <AnimatedSection key={idx} delay={idx * 100}>
                <div className="group text-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                    <div className="relative w-32 h-32 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full mx-auto flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <span className="text-3xl font-bold text-white">{member.initials}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-1">{member.name}</h3>
                  <p className="text-blue-600 mb-3 font-medium text-sm">{member.role}</p>
                  <p className="text-slate-600 text-sm leading-relaxed">{member.bio}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-28 bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white rounded-full mix-blend-multiply filter blur-3xl animate-float"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              By The Numbers
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { value: 500, suffix: '+', label: 'Satisfied Clients' },
              { value: 1000, suffix: '+', label: 'Projects Completed' },
              { value: 98, suffix: '%', label: 'Client Satisfaction' },
              { value: 15, suffix: '+', label: 'Years Experience' },
            ].map((stat, idx) => (
              <AnimatedSection key={idx} delay={idx * 100}>
                <div className="text-center p-8 rounded-lg glass-effect hover:scale-105 transition-transform cursor-pointer">
                  <div className="text-5xl font-bold text-white mb-2">
                    <Counter from={0} to={stat.value} suffix={stat.suffix} />
                  </div>
                  <p className="text-blue-100 font-medium">{stat.label}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-28 bg-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Ready to <span className="gradient-text">Collaborate</span> With Us?
            </h2>
            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Let's discuss how our expertise can help drive your digital transformation forward.
            </p>
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 px-10 py-4 rounded-lg font-bold text-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-2xl hover:-translate-y-2 btn-interactive transform"
            >
              Get Started Today <FaArrowRight />
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
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

            {['Services', 'Company', 'Get Started'].map((section, idx) => (
              <AnimatedSection key={idx} delay={100 * (idx + 1)}>
                <div>
                  <h3 className="font-semibold mb-4 text-white">{section}</h3>
                  <ul className="space-y-2 text-slate-400">
                    {section === 'Services' && (
                      <>
                        <li className="hover:text-white transition-colors cursor-pointer">IT Support</li>
                        <li className="hover:text-white transition-colors cursor-pointer">Cloud Solutions</li>
                        <li className="hover:text-white transition-colors cursor-pointer">Cybersecurity</li>
                      </>
                    )}
                    {section === 'Company' && (
                      <>
                        <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                        <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                        <li className="hover:text-white transition-colors cursor-pointer">Contact</li>
                      </>
                    )}
                    {section === 'Get Started' && (
                      <>
                        <li><Link href="/booking" className="hover:text-white transition-colors">Book a Service</Link></li>
                        <li className="hover:text-white transition-colors cursor-pointer">Support</li>
                        <li className="hover:text-white transition-colors cursor-pointer">Documentation</li>
                      </>
                    )}
                  </ul>
                </div>
              </AnimatedSection>
            ))}
          </div>

          <div className="border-t border-slate-800 pt-8">
            <div className="flex justify-between items-center flex-col md:flex-row gap-4">
              <p className="text-slate-400">&copy; 2026 SlickTech Solutions. All rights reserved.</p>
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

export default AboutPage;