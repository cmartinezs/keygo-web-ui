export function TermsOfServiceContent() {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="font-semibold text-slate-900 mb-2">1. Acceptance of Terms</h3>
        <p>
          By accessing or using the KeyGo platform ("Service"), you agree to be bound by these Terms of Use and Service ("Terms").
          If you do not agree to all of these Terms, do not use the Service.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">2. Description of the Service</h3>
        <p>
          KeyGo is an identity and access management (IAM) platform that allows organizations ("Tenants") to manage
          users, roles, and application access through a centralized OAuth2/OIDC service.
          The Service is provided on a subscription basis according to the selected plan.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">3. Account Registration</h3>
        <p>
          To use the Service, you must register and create an account as a Contractor. You agree to:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600">
          <li>Provide accurate, current, and complete information during registration.</li>
          <li>Maintain the security of your credentials and not share them with third parties.</li>
          <li>Notify KeyGo immediately of any unauthorized access to your account.</li>
          <li>Be responsible for all activity that occurs under your account.</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">4. Acceptable Use</h3>
        <p>You agree not to use the Service to:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600">
          <li>Violate any applicable local, national, or international law or regulation.</li>
          <li>Transmit harmful, offensive, or unauthorized content.</li>
          <li>Attempt to gain unauthorized access to any part of the Service or its infrastructure.</li>
          <li>Interfere with or disrupt the integrity or performance of the Service.</li>
          <li>Use automated scripts or bots to access the Service without prior written permission.</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">5. Plans and Billing</h3>
        <p>
          The Service is offered under different subscription plans. Prices, features, and billing periods
          are described in the plan catalog at the time of contracting. KeyGo reserves the right to modify
          plans with prior notice. In the event of a price change, you will be notified at least 30 days
          in advance and may cancel your subscription before the change takes effect.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">6. Cancellation and Termination</h3>
        <p>
          You may cancel your subscription at any time from your account settings. Upon cancellation,
          access to the Service will remain active until the end of the current billing period.
          KeyGo may suspend or terminate your account if you violate these Terms or for any other
          justified reason, with prior notice whenever possible.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">7. Limitation of Liability</h3>
        <p>
          KeyGo shall not be liable for indirect, incidental, special, or consequential damages arising
          from your use of the Service. Service availability is provided on a best-effort basis. Planned
          maintenance periods will be communicated in advance. The total liability of KeyGo shall not
          exceed the amount paid by you in the 12 months prior to the claim.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">8. Intellectual Property</h3>
        <p>
          All trademarks, logos, software, interfaces, and content of the Service are the exclusive property
          of KeyGo or its licensors. Nothing in these Terms grants you any license or right over such
          intellectual property beyond what is necessary to use the Service.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">9. Modifications to the Terms</h3>
        <p>
          KeyGo reserves the right to update these Terms at any time. We will notify you by email or
          through the platform at least 15 days before any material change takes effect. Your continued
          use of the Service after the effective date constitutes acceptance of the new Terms.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">10. Governing Law</h3>
        <p>
          These Terms shall be governed by and construed in accordance with applicable law.
          Any dispute arising from the use of the Service shall be resolved through binding arbitration
          or, where applicable, the competent courts agreed upon by the parties.
        </p>
      </section>

      <p className="text-xs text-slate-400 pt-4 border-t border-slate-100">
        Last updated: March 2026.
      </p>
    </div>
  )
}
