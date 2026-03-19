import Link from 'next/link';
import LandingNav from '../../components/LandingNav';
import AnimatedSection from '../../components/AnimatedSection';
import { FaCloud, FaClipboardCheck, FaExchangeAlt, FaUserShield, FaChartLine, FaRocket } from 'react-icons/fa';

const CloudSolutionsPage = () => {
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      <LandingNav currentPage="services" />

      <section className="relative min-h-[45vh] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-36 -right-36 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
          <div className="absolute -bottom-36 -left-36 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <AnimatedSection>
          <p className="inline-block px-4 py-2 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">SERVICE DETAIL</p>
          <h1 className="mt-4 text-5xl font-bold text-slate-900">Cloud Solutions</h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-600">Scalable cloud architecture and migration support that improve resilience, security, and operational efficiency.</p>
          </AnimatedSection>
        </div>
      </section>

      <main className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="mx-auto max-w-5xl space-y-8">
        <AnimatedSection>
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="inline-flex rounded-xl bg-indigo-100 p-3 mb-4">
            <FaCloud className="text-indigo-600 text-xl" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">Service Detail</p>
          <h1 className="mt-3 text-4xl font-bold text-slate-900">Cloud Solutions</h1>
          <p className="mt-4 text-slate-600">
            Our Cloud Solutions practice helps teams move from fragile, manually managed infrastructure to resilient,
            scalable, and secure cloud operations. We support cloud adoption from strategy through implementation,
            then optimize for performance, cost efficiency, and operational continuity.
          </p>
        </section>
        </AnimatedSection>

        <AnimatedSection delay={100}>
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Service Components</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <FaClipboardCheck className="text-indigo-600 mb-2" />
              <p className="font-semibold text-slate-900">Cloud Readiness Assessment</p>
              <p className="mt-1 text-sm text-slate-600">Evaluate workloads, dependencies, security requirements, and migration risk factors.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <FaExchangeAlt className="text-indigo-600 mb-2" />
              <p className="font-semibold text-slate-900">Migration Execution</p>
              <p className="mt-1 text-sm text-slate-600">Phased migration plans with rollback safeguards, validation checkpoints, and cutover support.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <FaUserShield className="text-indigo-600 mb-2" />
              <p className="font-semibold text-slate-900">Cloud Security and IAM</p>
              <p className="mt-1 text-sm text-slate-600">Identity controls, least-privilege access, baseline hardening, and security observability.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <FaChartLine className="text-indigo-600 mb-2" />
              <p className="font-semibold text-slate-900">Optimization and FinOps</p>
              <p className="mt-1 text-sm text-slate-600">Rightsizing, utilization analytics, spend governance, and long-term cost discipline.</p>
            </div>
          </div>
        </section>
        </AnimatedSection>

        <AnimatedSection delay={200}>
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Delivery Phases</h2>
          <ol className="mt-5 list-decimal space-y-2 pl-5 text-slate-700">
            <li>Discovery workshop to map workloads and desired business outcomes.</li>
            <li>Reference architecture design with compliance and resilience controls.</li>
            <li>Migration waves prioritized by business criticality and complexity.</li>
            <li>Operational handover with runbooks, alerting, and governance standards.</li>
            <li>Continuous optimization cycles for performance and spend efficiency.</li>
          </ol>
        </section>
        </AnimatedSection>

        <AnimatedSection delay={300}>
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="inline-flex rounded-xl bg-indigo-100 p-3 mb-4">
            <FaRocket className="text-indigo-600 text-xl" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Expected Outcomes</h2>
          <ul className="mt-5 list-disc space-y-2 pl-5 text-slate-700">
            <li>Higher uptime and improved fault tolerance for critical systems.</li>
            <li>Faster deployment cycles and better platform agility for teams.</li>
            <li>Improved security posture through standardized cloud controls.</li>
            <li>Reduced infrastructure waste through actionable optimization practices.</li>
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/services" className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">Back to Services</Link>
            <Link href="/documentation" className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">Read Documentation</Link>
          </div>
        </section>
        </AnimatedSection>
      </div>
      </main>
    </div>
  );
};

export default CloudSolutionsPage;
