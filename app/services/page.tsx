import Link from 'next/link';
import LandingNav from '../components/LandingNav';
import AnimatedSection from '../components/AnimatedSection';
import { FaCogs, FaTools, FaCloud, FaShieldAlt, FaSearch, FaRocket, FaChartLine } from 'react-icons/fa';

const ServicesPage = () => {
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      <LandingNav currentPage="services" />

      <section className="relative min-h-[55vh] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center py-20">
          <AnimatedSection>
          <div>
            <p className="inline-block px-4 py-2 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold mb-4">SERVICE PORTFOLIO</p>
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900">Explore Our <span className="gradient-text">Core Services</span></h1>
            <p className="mt-6 max-w-3xl text-xl text-slate-600">
              Structured technology services that help businesses improve reliability, scale with confidence, and strengthen security.
            </p>
          </div>
          </AnimatedSection>
        </div>
      </section>

      <main className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="mx-auto max-w-7xl">
        <AnimatedSection>
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2">
            <FaCogs className="text-blue-600" />
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">Service Catalog</p>
          </div>
          <h1 className="mt-3 text-4xl font-bold text-slate-900 sm:text-5xl">Technology Services Built Around Business Outcomes</h1>
          <p className="mt-5 max-w-3xl text-slate-600">
            SlickTech delivers structured technology services for organizations that need reliability, security, and scale.
            Each service line includes assessment, implementation, documentation, and measurable success checkpoints.
            Browse the service streams below to understand scope, delivery approach, and expected outcomes.
          </p>
        </section>
        </AnimatedSection>

        <section className="mt-10 grid gap-6 lg:grid-cols-3">
          <AnimatedSection delay={100}>
          <Link href="/services/it-support" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md block">
            <div className="mb-4 inline-flex rounded-xl bg-blue-100 p-3">
              <FaTools className="text-blue-600 text-xl" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">IT Support</h2>
            <p className="mt-2 text-sm text-slate-600">Operational support for endpoints, user productivity, office networks, and core business software.</p>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-700">
              <li>Incident response and troubleshooting</li>
              <li>Device lifecycle and patch management</li>
              <li>Preventive maintenance routines</li>
            </ul>
          </Link>
          </AnimatedSection>

          <AnimatedSection delay={200}>
          <Link href="/services/cloud-solutions" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md block">
            <div className="mb-4 inline-flex rounded-xl bg-indigo-100 p-3">
              <FaCloud className="text-indigo-600 text-xl" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">Cloud Solutions</h2>
            <p className="mt-2 text-sm text-slate-600">Cloud architecture, migration, optimization, and operational governance for modern teams.</p>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-700">
              <li>Readiness assessment and planning</li>
              <li>Workload migration and modernization</li>
              <li>Cost, performance, and resilience tuning</li>
            </ul>
          </Link>
          </AnimatedSection>

          <AnimatedSection delay={300}>
          <Link href="/services/cybersecurity" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md block">
            <div className="mb-4 inline-flex rounded-xl bg-purple-100 p-3">
              <FaShieldAlt className="text-purple-600 text-xl" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">Cybersecurity</h2>
            <p className="mt-2 text-sm text-slate-600">Risk-led security programs covering prevention, detection, response, and recovery maturity.</p>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-700">
              <li>Security posture and gap assessments</li>
              <li>Technical hardening and monitoring</li>
              <li>Policy, awareness, and response readiness</li>
            </ul>
          </Link>
          </AnimatedSection>
        </section>

        <AnimatedSection delay={100}>
        <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 mb-4">
            <FaRocket className="text-blue-600" />
            <span className="text-sm font-semibold uppercase tracking-wider text-blue-700">Delivery Model</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">How Delivery Works</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:shadow-md">
              <FaSearch className="text-blue-600 mb-2" />
              <p className="text-sm font-semibold text-slate-900">1. Discovery</p>
              <p className="mt-1 text-sm text-slate-600">Review business goals, current technology stack, and known pain points.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:shadow-md">
              <FaCogs className="text-blue-600 mb-2" />
              <p className="text-sm font-semibold text-slate-900">2. Architecture</p>
              <p className="mt-1 text-sm text-slate-600">Define scope, priority sequence, dependencies, and measurable outcomes.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:shadow-md">
              <FaRocket className="text-blue-600 mb-2" />
              <p className="text-sm font-semibold text-slate-900">3. Execution</p>
              <p className="mt-1 text-sm text-slate-600">Implement in phases with milestones, reporting, and quality controls.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:shadow-md">
              <FaChartLine className="text-blue-600 mb-2" />
              <p className="text-sm font-semibold text-slate-900">4. Improvement</p>
              <p className="mt-1 text-sm text-slate-600">Track KPIs and continuously optimize reliability, security, and efficiency.</p>
            </div>
          </div>
        </section>
        </AnimatedSection>

        <AnimatedSection delay={200}>
        <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <h2 className="text-2xl font-bold text-slate-900">Common Questions</h2>
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-900">Do you support one-time projects and long-term retainers?</p>
              <p className="mt-1 text-sm text-slate-600">Yes. Engagements can be scoped as one-off interventions, phased rollouts, or continuous managed services.</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-900">Will we receive documentation after implementation?</p>
              <p className="mt-1 text-sm text-slate-600">Every engagement includes practical documentation such as runbooks, architecture notes, and maintenance guidance.</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-900">Can services be combined?</p>
              <p className="mt-1 text-sm text-slate-600">Yes. Most clients combine IT support, cloud operations, and security governance for stronger outcomes.</p>
            </div>
          </div>
        </section>
        </AnimatedSection>
        </div>
      </main>
    </div>
  );
};

export default ServicesPage;
