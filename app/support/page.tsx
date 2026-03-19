import Link from 'next/link';
import LandingNav from '../components/LandingNav';
import AnimatedSection from '../components/AnimatedSection';
import { FaLifeRing, FaClipboardCheck, FaExclamationTriangle, FaClock, FaInfoCircle, FaTasks } from 'react-icons/fa';

const SupportPage = () => {
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      <LandingNav currentPage="support" />

      <section className="relative min-h-[45vh] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-36 -right-36 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
          <div className="absolute -bottom-36 -left-36 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <AnimatedSection>
          <p className="inline-block px-4 py-2 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">SUPPORT MODEL</p>
          <h1 className="mt-4 text-5xl font-bold text-slate-900">Support</h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-600">A structured support process for fast incident handling and clear communication at every stage.</p>
          </AnimatedSection>
        </div>
      </section>

      <main className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="mx-auto max-w-5xl space-y-8">
        <AnimatedSection>
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="inline-flex rounded-xl bg-blue-100 p-3 mb-4">
            <FaLifeRing className="text-blue-600 text-xl" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900">Support</h1>
          <p className="mt-4 text-slate-600">
            Our support model is designed to resolve incidents quickly while preserving service quality and accountability.
            This page explains how issues are classified, routed, and resolved so teams know exactly what to expect.
          </p>
        </section>
        </AnimatedSection>

        <AnimatedSection delay={100}>
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="inline-flex rounded-xl bg-blue-100 p-3 mb-4">
            <FaClipboardCheck className="text-blue-600 text-xl" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Support Intake Checklist</h2>
          <ul className="mt-5 list-disc space-y-2 pl-5 text-slate-700">
            <li>Service or system affected and the exact business impact observed.</li>
            <li>Time issue began, current severity, and any temporary workarounds in place.</li>
            <li>Screenshots, logs, or error references that assist initial diagnosis.</li>
            <li>Primary contact details for follow-up and change confirmation.</li>
          </ul>
        </section>
        </AnimatedSection>

        <AnimatedSection delay={200}>
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Severity and Priority Model</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <FaExclamationTriangle className="text-red-500 mb-2" />
              <p className="font-semibold text-slate-900">High</p>
              <p className="mt-1 text-sm text-slate-600">Critical business disruption requiring immediate triage and continuous updates.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <FaClock className="text-amber-500 mb-2" />
              <p className="font-semibold text-slate-900">Medium</p>
              <p className="mt-1 text-sm text-slate-600">Functionality degraded with viable temporary workaround available.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <FaInfoCircle className="text-blue-500 mb-2" />
              <p className="font-semibold text-slate-900">Low</p>
              <p className="mt-1 text-sm text-slate-600">Non-blocking issue or enhancement request for scheduled resolution.</p>
            </div>
          </div>
        </section>
        </AnimatedSection>

        <AnimatedSection delay={300}>
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="inline-flex rounded-xl bg-blue-100 p-3 mb-4">
            <FaTasks className="text-blue-600 text-xl" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Resolution Lifecycle</h2>
          <ol className="mt-5 list-decimal space-y-2 pl-5 text-slate-700">
            <li>Acknowledge and classify request by impact and urgency.</li>
            <li>Triage with specialist assignment and remediation path.</li>
            <li>Implement fix, validate results, and monitor stability.</li>
            <li>Close with summary, lessons learned, and prevention actions.</li>
          </ol>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/contact" className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">Contact Support Team</Link>
            <Link href="/documentation" className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">Support Documentation</Link>
          </div>
        </section>
        </AnimatedSection>
      </div>
      </main>
    </div>
  );
};

export default SupportPage;
