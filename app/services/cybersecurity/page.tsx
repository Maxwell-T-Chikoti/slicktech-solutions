import Link from 'next/link';
import LandingNav from '../../components/LandingNav';
import AnimatedSection from '../../components/AnimatedSection';
import { FaShieldAlt, FaSearch, FaLock, FaBroadcastTower, FaUserShield, FaClipboardCheck } from 'react-icons/fa';

const CybersecurityPage = () => {
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
          <h1 className="mt-4 text-5xl font-bold text-slate-900">Cybersecurity</h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-600">Layered security services that reduce exposure, strengthen controls, and improve incident readiness.</p>
          </AnimatedSection>
        </div>
      </section>

      <main className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="mx-auto max-w-5xl space-y-8">
        <AnimatedSection>
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="inline-flex rounded-xl bg-purple-100 p-3 mb-4">
            <FaShieldAlt className="text-purple-600 text-xl" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">Service Detail</p>
          <h1 className="mt-3 text-4xl font-bold text-slate-900">Cybersecurity</h1>
          <p className="mt-4 text-slate-600">
            Our Cybersecurity service builds practical, layered defense programs that reduce risk without slowing business
            operations. We combine technical controls, governance standards, and team readiness to improve your ability
            to prevent incidents, detect threats early, and respond effectively.
          </p>
        </section>
        </AnimatedSection>

        <AnimatedSection delay={100}>
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Coverage Areas</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <FaSearch className="text-purple-600 mb-2" />
              <p className="font-semibold text-slate-900">Security Posture Assessment</p>
              <p className="mt-1 text-sm text-slate-600">Baseline review of controls, vulnerabilities, exposure paths, and policy maturity.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <FaLock className="text-purple-600 mb-2" />
              <p className="font-semibold text-slate-900">Hardening and Prevention</p>
              <p className="mt-1 text-sm text-slate-600">Endpoint protection, configuration standards, and access-control enforcement.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <FaBroadcastTower className="text-purple-600 mb-2" />
              <p className="font-semibold text-slate-900">Threat Detection</p>
              <p className="mt-1 text-sm text-slate-600">Monitoring strategy, alert tuning, and visibility improvements for critical assets.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <FaUserShield className="text-purple-600 mb-2" />
              <p className="font-semibold text-slate-900">Incident Response Readiness</p>
              <p className="mt-1 text-sm text-slate-600">Playbooks, escalation paths, and simulation exercises for faster recovery.</p>
            </div>
          </div>
        </section>
        </AnimatedSection>

        <AnimatedSection delay={200}>
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Program Approach</h2>
          <ol className="mt-5 list-decimal space-y-2 pl-5 text-slate-700">
            <li>Prioritize high-impact risks based on business criticality and threat likelihood.</li>
            <li>Implement prevention controls first, then strengthen monitoring and response layers.</li>
            <li>Document standards for access, patching, backups, and vendor integrations.</li>
            <li>Train teams on secure operating habits and incident escalation processes.</li>
            <li>Review and refine controls continuously as the environment evolves.</li>
          </ol>
        </section>
        </AnimatedSection>

        <AnimatedSection delay={300}>
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="inline-flex rounded-xl bg-purple-100 p-3 mb-4">
            <FaClipboardCheck className="text-purple-600 text-xl" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Deliverables and Reporting</h2>
          <ul className="mt-5 list-disc space-y-2 pl-5 text-slate-700">
            <li>Risk register with remediation priority and ownership recommendations.</li>
            <li>Security control matrix aligned to your operational environment.</li>
            <li>Incident response workflow and communication templates.</li>
            <li>Executive summary reports for leadership-level decision support.</li>
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/services" className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">Back to Services</Link>
            <Link href="/support" className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">Support Guidelines</Link>
          </div>
        </section>
        </AnimatedSection>
      </div>
      </main>
    </div>
  );
};

export default CybersecurityPage;
