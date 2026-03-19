import Link from 'next/link';
import LandingNav from '../../components/LandingNav';
import AnimatedSection from '../../components/AnimatedSection';
import { FaTools, FaHeadset, FaDesktop, FaNetworkWired, FaSyncAlt, FaClipboardCheck } from 'react-icons/fa';

const ITSupportPage = () => {
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
          <h1 className="mt-4 text-5xl font-bold text-slate-900">IT Support</h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-600">Operational IT support for stable daily workflows, predictable service quality, and reduced technical interruptions.</p>
          </AnimatedSection>
        </div>
      </section>

      <main className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="mx-auto max-w-5xl space-y-8">
        <AnimatedSection>
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="inline-flex rounded-xl bg-blue-100 p-3 mb-4">
            <FaTools className="text-blue-600 text-xl" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">Service Detail</p>
          <h1 className="mt-3 text-4xl font-bold text-slate-900">IT Support</h1>
          <p className="mt-4 text-slate-600">
            Our IT Support service is designed for organizations that need dependable day-to-day technology operations.
            We manage incidents, reduce recurring technical disruptions, and improve user productivity through proactive care.
            The service can be delivered remotely, on-site, or as a hybrid model depending on your environment.
          </p>
        </section>
        </AnimatedSection>

        <AnimatedSection delay={100}>
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">What Is Included</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <FaHeadset className="text-blue-600 mb-2" />
              <p className="font-semibold text-slate-900">User Support Desk</p>
              <p className="mt-1 text-sm text-slate-600">Incident triage, troubleshooting, escalation handling, and closure tracking.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <FaDesktop className="text-blue-600 mb-2" />
              <p className="font-semibold text-slate-900">Device Management</p>
              <p className="mt-1 text-sm text-slate-600">Provisioning, endpoint policy enforcement, updates, and lifecycle planning.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <FaNetworkWired className="text-blue-600 mb-2" />
              <p className="font-semibold text-slate-900">Office Network Reliability</p>
              <p className="mt-1 text-sm text-slate-600">LAN/Wi-Fi diagnostics, connectivity monitoring, and baseline performance checks.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <FaSyncAlt className="text-blue-600 mb-2" />
              <p className="font-semibold text-slate-900">Preventive Maintenance</p>
              <p className="mt-1 text-sm text-slate-600">Routine health checks to reduce downtime and improve service consistency.</p>
            </div>
          </div>
        </section>
        </AnimatedSection>

        <AnimatedSection delay={200}>
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Support Workflow</h2>
          <ol className="mt-5 list-decimal space-y-2 pl-5 text-slate-700">
            <li>Issue intake through agreed channels with standardized priority tagging.</li>
            <li>Initial diagnosis and first-response remediation attempt.</li>
            <li>Specialist escalation for infrastructure, software, or vendor-level cases.</li>
            <li>Resolution verification with end users and root-cause capture.</li>
            <li>Monthly trend review to eliminate recurring incident categories.</li>
          </ol>
        </section>
        </AnimatedSection>

        <AnimatedSection delay={300}>
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="inline-flex rounded-xl bg-blue-100 p-3 mb-4">
            <FaClipboardCheck className="text-blue-600 text-xl" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Deliverables</h2>
          <ul className="mt-5 list-disc space-y-2 pl-5 text-slate-700">
            <li>Incident performance dashboard with response and resolution metrics.</li>
            <li>Device inventory and health-status baseline report.</li>
            <li>Known issue register and remediation recommendations.</li>
            <li>Quarterly operations review with service-improvement roadmap.</li>
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

export default ITSupportPage;
