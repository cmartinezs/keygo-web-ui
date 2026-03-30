export function PrivacyPolicyContent() {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="font-semibold text-slate-900 mb-2">1. Data Controller</h3>
        <p>
          KeyGo ("we", "us", or "our") is the data controller responsible for your personal data
          collected through the Service. If you have questions about how we handle your data,
          contact us at <span className="text-indigo-600 font-medium">privacy@keygo.app</span>.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">2. Data We Collect</h3>
        <p>We collect the following categories of personal data:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600">
          <li><strong>Identity data:</strong> first name, last name, and email address.</li>
          <li><strong>Organizational data:</strong> company name and organizational identifier (slug).</li>
          <li><strong>Account data:</strong> subscription plan, billing options, and registration date.</li>
          <li><strong>Usage data:</strong> access logs, IP addresses, user agents, and platform events.</li>
          <li><strong>Technical data:</strong> session tokens and authentication events (stored securely in memory, never in untrusted storage).</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">3. Purposes and Legal Basis</h3>
        <p>We process your personal data for the following purposes:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600">
          <li><strong>Service provision:</strong> to create and manage your account and subscription (contractual performance).</li>
          <li><strong>Billing and payments:</strong> to process your subscription and issue invoices (contractual obligation).</li>
          <li><strong>Security:</strong> to detect and prevent unauthorized access and fraudulent activity (legitimate interest).</li>
          <li><strong>Communications:</strong> to send important service notifications (legitimate interest).</li>
          <li><strong>Legal compliance:</strong> to comply with applicable legal and regulatory obligations.</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">4. Data Retention</h3>
        <p>
          We retain your personal data for the duration of your subscription and for a period of up to
          5 years after termination, or as required by applicable law. Usage logs are retained for
          a maximum of 24 months. You may request deletion of your data at any time, subject to
          legal retention obligations.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">5. Data Sharing</h3>
        <p>
          We do not sell your personal data to third parties. We may share your data with:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600">
          <li><strong>Payment processors:</strong> to handle billing and transactions securely.</li>
          <li><strong>Cloud infrastructure providers:</strong> that host our platform under strict data processing agreements.</li>
          <li><strong>Legal authorities:</strong> when required by applicable law or regulatory obligation.</li>
        </ul>
        <p className="mt-2">
          All third-party service providers are bound by confidentiality obligations and data processing agreements.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">6. Your Rights</h3>
        <p>Depending on applicable law, you have the right to:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600">
          <li><strong>Access:</strong> request a copy of the personal data we hold about you.</li>
          <li><strong>Rectification:</strong> request correction of inaccurate or incomplete data.</li>
          <li><strong>Erasure:</strong> request deletion of your personal data ("right to be forgotten").</li>
          <li><strong>Restriction:</strong> request that we limit processing of your data in certain circumstances.</li>
          <li><strong>Portability:</strong> receive your data in a structured, machine-readable format.</li>
          <li><strong>Objection:</strong> object to processing based on our legitimate interests.</li>
        </ul>
        <p className="mt-2">
          To exercise any of these rights, contact us at <span className="text-indigo-600 font-medium">privacy@keygo.app</span>.
          We will respond within 30 days.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">7. Security</h3>
        <p>
          We implement appropriate technical and organizational measures to protect your personal data,
          including encryption in transit (TLS), access controls based on the principle of least privilege,
          and regular security audits. Authentication tokens are stored in memory only and are never
          persisted to local storage or cookies without appropriate security flags.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">8. Cookies and Tracking</h3>
        <p>
          The platform uses strictly necessary session mechanisms for authentication. We do not use
          third-party advertising cookies or cross-site tracking technologies. Any analytics
          tools we use are configured to anonymize IP addresses and respect Do Not Track signals.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">9. Changes to This Policy</h3>
        <p>
          We may update this Privacy Policy from time to time. We will notify you by email or through
          the platform at least 15 days before any material change takes effect. The date of the
          last update is shown at the bottom of this document.
        </p>
      </section>

      <p className="text-xs text-slate-400 pt-4 border-t border-slate-100">
        Last updated: March 2026.
      </p>
    </div>
  )
}
