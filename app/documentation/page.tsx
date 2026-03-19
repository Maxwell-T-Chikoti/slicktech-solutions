import Link from 'next/link';
import LandingNav from '../components/LandingNav';
import AnimatedSection from '../components/AnimatedSection';
import { FaBook, FaFolderOpen, FaStream, FaShieldAlt, FaHistory, FaQuestionCircle, FaClipboardCheck } from 'react-icons/fa';

const DocumentationPage = () => {
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      <LandingNav currentPage="documentation" />

      <section className="relative min-h-[45vh] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-36 -right-36 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
          <div className="absolute -bottom-36 -left-36 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <AnimatedSection>
          <p className="inline-block px-4 py-2 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">KNOWLEDGE BASE</p>
          <h1 className="mt-4 text-5xl font-bold text-slate-900">Documentation</h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-600">Standards, guides, and operational references for services, support, and access workflows.</p>
          </AnimatedSection>
        </div>
      </section>

      <main className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="mx-auto max-w-5xl space-y-8">
        <AnimatedSection>
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="inline-flex rounded-xl bg-blue-100 p-3 mb-4">
            <FaBook className="text-blue-600 text-xl" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900">Documentation</h1>
          <p className="mt-4 text-slate-600">
            This documentation hub explains service scope, operating standards, and support procedures used across the
            SlickTech service portfolio. The content is intended for business stakeholders, technical teams, and operations leads.
          </p>
        </section>
        </AnimatedSection>

        <AnimatedSection delay={100}>
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="inline-flex rounded-xl bg-blue-100 p-3 mb-4">
            <FaFolderOpen className="text-blue-600 text-xl" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Reference Library</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Link href="/services" className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-white">
              <p className="font-semibold text-slate-900">Service Catalog Guide</p>
              <p className="mt-1 text-sm text-slate-600">Overview of service lines, delivery models, and expected outcomes.</p>
            </Link>
            <Link href="/support" className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-white">
              <p className="font-semibold text-slate-900">Support Operations</p>
              <p className="mt-1 text-sm text-slate-600">Issue intake, prioritization framework, and incident lifecycle process.</p>
            </Link>
            <Link href="/reset-password" className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-white">
              <p className="font-semibold text-slate-900">Identity and Access</p>
              <p className="mt-1 text-sm text-slate-600">Account recovery and secure access continuity procedures.</p>
            </Link>
            <Link href="/verify-certificate" className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-white">
              <p className="font-semibold text-slate-900">Verification and Records</p>
              <p className="mt-1 text-sm text-slate-600">Certificate verification workflow and service-completion validation.</p>
            </Link>
          </div>
        </section>
        </AnimatedSection>

        <AnimatedSection delay={200}>
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="inline-flex rounded-xl bg-blue-100 p-3 mb-4">
            <FaStream className="text-blue-600 text-xl" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Documentation Standards</h2>
          <ul className="mt-5 list-disc space-y-2 pl-5 text-slate-700">
            <li className="flex items-start gap-2"><FaFolderOpen className="mt-1 text-blue-600" />Every process includes objective, scope, and role ownership.</li>
            <li className="flex items-start gap-2"><FaClipboardCheck className="mt-1 text-blue-600" />Operational runbooks include prerequisites, procedure, and rollback guidance.</li>
            <li className="flex items-start gap-2"><FaShieldAlt className="mt-1 text-blue-600" />Security-sensitive steps are documented with least-privilege best practices.</li>
            <li className="flex items-start gap-2"><FaHistory className="mt-1 text-blue-600" />Version updates are tracked to preserve historical process changes.</li>
          </ul>
        </section>
        </AnimatedSection>

        <AnimatedSection delay={300}>
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="inline-flex rounded-xl bg-blue-100 p-3 mb-4">
            <FaQuestionCircle className="text-blue-600 text-xl" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">FAQ</h2>
          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-900">Who should use this documentation?</p>
              <p className="mt-1 text-sm text-slate-600">Service managers, IT administrators, and client-side operations teams.</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-900">How often is documentation updated?</p>
              <p className="mt-1 text-sm text-slate-600">At each major process change and as part of periodic service quality reviews.</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-900">Can we request custom documentation?</p>
              <p className="mt-1 text-sm text-slate-600">Yes. Use the contact page to request business-specific runbooks and onboarding guides.</p>
            </div>
          </div>
        </section>
        </AnimatedSection>
      </div>
      </main>
    </div>
  );
};

export default DocumentationPage;
