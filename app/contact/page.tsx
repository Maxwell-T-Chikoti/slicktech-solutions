import Link from 'next/link';
import LandingNav from '../components/LandingNav';
import AnimatedSection from '../components/AnimatedSection';
import { FaEnvelope, FaPhoneAlt, FaClipboardList, FaClock, FaComments, FaUsers } from 'react-icons/fa';

const ContactPage = () => {
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      <LandingNav currentPage="contact" />

      <section className="relative min-h-[45vh] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-36 -right-36 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
          <div className="absolute -bottom-36 -left-36 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <AnimatedSection>
          <p className="inline-block px-4 py-2 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">GET IN TOUCH</p>
          <h1 className="mt-4 text-5xl font-bold text-slate-900">Contact</h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-600">Reach our team for service consultations, technical clarifications, and support coordination.</p>
          </AnimatedSection>
        </div>
      </section>

      <main className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="mx-auto max-w-5xl space-y-8">
        <AnimatedSection>
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <h1 className="text-4xl font-bold text-slate-900">Contact</h1>
          <p className="mt-4 text-slate-600">
            Contact our team for service consultations, technical clarifications, support escalation, or partnership discussions.
            To speed up response quality, include your organization name, current environment, and a clear summary of your objective.
          </p>
        </section>
        </AnimatedSection>

        <AnimatedSection delay={100}>
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <FaEnvelope className="text-blue-600 mb-3" />
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email</p>
            <p className="mt-2 text-slate-900">company@email.com</p>
            <p className="mt-2 text-sm text-slate-600">Recommended for general inquiries, requirements, and document sharing.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <FaPhoneAlt className="text-blue-600 mb-3" />
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Phone</p>
            <p className="mt-2 text-slate-900">(254)6578900</p>
            <p className="mt-2 text-sm text-slate-600">Best for urgent operational concerns and active incident coordination.</p>
          </div>
        </section>
        </AnimatedSection>

        <AnimatedSection delay={200}>
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="inline-flex rounded-xl bg-blue-100 p-3 mb-4">
            <FaClipboardList className="text-blue-600 text-xl" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">What to Include in Your Request</h2>
          <ul className="mt-5 list-disc space-y-2 pl-5 text-slate-700">
            <li>Organization profile, team size, and key systems currently in use.</li>
            <li>Business goal, challenge, or incident you want addressed.</li>
            <li>Expected timeline, budget guardrails, and preferred engagement model.</li>
            <li>Any existing constraints such as compliance, integration, or downtime windows.</li>
          </ul>
        </section>
        </AnimatedSection>

        <AnimatedSection delay={300}>
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Response Expectations</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <FaClock className="text-blue-600 mb-2" />
              <p className="font-semibold text-slate-900">Initial Acknowledgement</p>
              <p className="mt-1 text-sm text-slate-600">Within one business day for standard inquiries.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <FaComments className="text-blue-600 mb-2" />
              <p className="font-semibold text-slate-900">Scoping Follow-Up</p>
              <p className="mt-1 text-sm text-slate-600">Clarification questions and next-step recommendations.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <FaUsers className="text-blue-600 mb-2" />
              <p className="font-semibold text-slate-900">Ongoing Coordination</p>
              <p className="mt-1 text-sm text-slate-600">Dedicated communication path for active engagements.</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/services" className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">Browse Services</Link>
            <Link href="/support" className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">Support Process</Link>
          </div>
        </section>
        </AnimatedSection>
      </div>
      </main>
    </div>
  );
};

export default ContactPage;
