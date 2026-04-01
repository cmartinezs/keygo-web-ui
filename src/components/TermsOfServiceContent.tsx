import { useState } from 'react'

export function TermsOfServiceContent() {
  const [lang, setLang] = useState<'es' | 'en'>('es')

  return (
    <>
      {/* Language switch */}
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden text-xs font-medium">
          <button
            type="button"
            onClick={() => setLang('es')}
            className={`px-3 py-1.5 transition-colors ${lang === 'es' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
          >
            Español
          </button>
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`px-3 py-1.5 transition-colors ${lang === 'en' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
          >
            English
          </button>
        </div>
      </div>

    {lang === 'en' && <div className="space-y-6">
      <section>
        <h3 className="font-semibold text-slate-900 mb-2">1. Acceptance of Terms</h3>
        <p>
          By accessing, registering for, or using the KeyGo platform (&quot;Service&quot;), you agree to be bound by
          these Terms of Use and Service (&quot;Terms&quot;). These Terms constitute a legally binding agreement between
          you or the entity you represent (&quot;Customer&quot;) and KeyGo. Acceptance may be performed by electronic means
          and will be considered valid under applicable Chilean law.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">2. Description of the Service</h3>
        <p>
          KeyGo is an identity and access management (IAM) platform that allows organizations and authorized users
          to manage identities, authentication, authorization, roles, and application access through a centralized
          OAuth2/OIDC-based service. The Service is provided under the plan selected at the time of contracting and
          according to the capabilities, limits, and conditions informed in the corresponding plan catalog.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">3. Account Registration and Security</h3>
        <p>
          To use the Service, you must register an account or be invited by a tenant administrator. You agree to:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600">
          <li>Provide accurate, current, and complete information.</li>
          <li>Keep your credentials confidential and not share them with unauthorized third parties.</li>
          <li>Notify KeyGo without undue delay of any unauthorized access, suspected breach, or misuse of your account.</li>
          <li>Be responsible for the activity performed through your account, except where this results from a security issue not attributable to you.</li>
          <li>Ensure that the use of the Service by your organization and its users complies with these Terms and applicable law.</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">4. Acceptable Use</h3>
        <p>You agree not to use the Service to:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600">
          <li>Violate applicable Chilean law or any other law validly applicable to your use of the Service.</li>
          <li>Attempt to gain unauthorized access to the Service, infrastructure, accounts, data, or networks.</li>
          <li>Distribute malware, malicious code, spam, or content intended to disrupt the Service.</li>
          <li>Interfere with the integrity, availability, or performance of the Service.</li>
          <li>Use bots, scripts, crawlers, or automated access methods in a manner that unreasonably impacts the Service or breaches written authorization.</li>
          <li>Use the Service to process or manage unlawful content or to infringe third-party rights.</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">5. Plans, Billing, Taxes, and Renewals</h3>
        <p>
          The Service is offered under different subscription plans. Prices, billing periods, limits, and included
          features are those informed at the time of contracting. Unless expressly stated otherwise, recurring plans
          renew automatically for successive billing periods until cancelled. By subscribing to a recurring plan, you
          authorize the corresponding periodic charges through the selected payment method. Any applicable taxes,
          withholdings, or charges will be informed in accordance with applicable regulations and the billing data
          provided by the Customer.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">6. Cancellation, Withdrawal, and Termination</h3>
        <p>
          You may cancel the renewal of your subscription at any time through the available account settings or the
          support channels enabled by KeyGo. Unless otherwise indicated in a specific commercial condition, cancellation
          prevents future renewals and the Service remains active until the end of the already paid billing period.
          KeyGo may suspend or terminate access to the Service in case of material breach of these Terms, security risks,
          illegal use, non-payment, or protection of the platform and its users. When reasonably possible, KeyGo will
          provide prior notice. If the Customer has the legal status of consumer under Chilean law, any mandatory rights
          of withdrawal, termination, or protection recognized by such law will prevail over these Terms where applicable.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">7. Availability, Maintenance, and Support</h3>
        <p>
          KeyGo will use commercially reasonable efforts to keep the Service available and secure. However, uninterrupted
          or error-free operation cannot be guaranteed at all times. Planned maintenance, relevant changes, and incidents
          that materially affect the Service may be notified through the platform, status page, or registered email, as applicable.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">8. Limitation of Liability</h3>
        <p>
          To the maximum extent permitted by applicable law, KeyGo will not be liable for indirect, incidental, special,
          consequential, or loss-of-profit damages arising from the use of the Service. In any case, KeyGo’s total aggregate
          liability for direct damages arising out of or related to the Service will not exceed the total amount effectively
          paid by the Customer to KeyGo during the 12 months immediately preceding the event giving rise to the claim. Nothing
          in these Terms excludes or limits liability where such exclusion or limitation is not permitted by Chilean law.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">9. Intellectual Property</h3>
        <p>
          All software, source code, interfaces, visual elements, trademarks, logos, trade names, documentation, and other
          content associated with the Service are owned by KeyGo or its licensors and are protected by applicable intellectual
          property laws. Except for the limited right to use the Service in accordance with these Terms, no license, transfer,
          or assignment of intellectual property rights is granted to you.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">10. Personal Data and Confidentiality</h3>
        <p>
          KeyGo processes personal data in accordance with its Privacy Policy and applicable Chilean law. The Customer is
          responsible for ensuring that any personal data it uploads or manages through the Service has been lawfully collected
          and processed. Each party shall use reasonable measures to protect confidential information accessed in connection
          with the Service and shall not disclose it except as required by law or as necessary for the provision of the Service.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">11. Modifications to the Terms</h3>
        <p>
          KeyGo may update these Terms from time to time for legal, operational, security, or service-improvement reasons.
          If a change is material, KeyGo will provide prior notice through the platform or by email at least 15 days before
          the updated Terms take effect, unless an earlier change is required by law, security, or regulatory obligation.
          If you do not agree with a material change, you may stop using the Service and cancel renewal before the effective date.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">12. Governing Law and Jurisdiction</h3>
        <p>
          These Terms are governed by the laws of the Republic of Chile. Any dispute arising from or related to these Terms
          or the Service shall be submitted to the courts of justice having jurisdiction under applicable Chilean law. If the
          Customer acts as a consumer, any mandatory jurisdictional or procedural rights granted by consumer protection law
          shall prevail. In purely business-to-business relationships, and unless a mandatory rule provides otherwise, the
          parties submit to the ordinary courts of Santiago, Chile.
        </p>
      </section>

      <p className="text-xs text-slate-400 pt-4 border-t border-slate-100">
        Last updated: March 30, 2026.
      </p>
    </div>}

    {lang === 'es' && <div className="space-y-6">
      <section>
        <h3 className="font-semibold text-slate-900 mb-2">1. Aceptación de los Términos</h3>
        <p>
          Al acceder, registrarte o utilizar la plataforma KeyGo (&quot;Servicio&quot;), aceptas quedar obligado por
          estos Términos de Uso y Servicio (&quot;Términos&quot;). Estos Términos constituyen un acuerdo legalmente vinculante
          entre tú o la entidad que representas (&quot;Cliente&quot;) y KeyGo. La aceptación podrá realizarse por medios
          electrónicos y se considerará válida conforme a la legislación chilena aplicable.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">2. Descripción del Servicio</h3>
        <p>
          KeyGo es una plataforma de gestión de identidad y acceso (IAM) que permite a organizaciones y usuarios
          autorizados administrar identidades, autenticación, autorización, roles y acceso a aplicaciones mediante
          un servicio centralizado basado en OAuth2/OIDC. El Servicio se presta conforme al plan contratado al momento
          de la suscripción y de acuerdo con las capacidades, límites y condiciones informadas en el catálogo del plan correspondiente.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">3. Registro de Cuenta y Seguridad</h3>
        <p>
          Para utilizar el Servicio, debes registrar una cuenta o ser invitado por un administrador del tenant. Aceptas:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600">
          <li>Proporcionar información exacta, actual y completa.</li>
          <li>Mantener la confidencialidad de tus credenciales y no compartirlas con terceros no autorizados.</li>
          <li>Notificar a KeyGo sin demora indebida sobre cualquier acceso no autorizado, sospecha de vulneración o uso indebido de tu cuenta.</li>
          <li>Ser responsable de la actividad realizada a través de tu cuenta, salvo cuando ello derive de un problema de seguridad no imputable a ti.</li>
          <li>Asegurar que el uso del Servicio por parte de tu organización y sus usuarios cumpla estos Términos y la legislación aplicable.</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">4. Uso Aceptable</h3>
        <p>Aceptas no utilizar el Servicio para:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600">
          <li>Infringir la legislación chilena aplicable o cualquier otra norma válidamente aplicable al uso del Servicio.</li>
          <li>Intentar obtener acceso no autorizado al Servicio, infraestructura, cuentas, datos o redes.</li>
          <li>Distribuir malware, código malicioso, spam o contenido destinado a interrumpir el Servicio.</li>
          <li>Interferir con la integridad, disponibilidad o rendimiento del Servicio.</li>
          <li>Utilizar bots, scripts, crawlers o métodos de acceso automatizado de forma que afecten irrazonablemente al Servicio o vulneren una autorización escrita.</li>
          <li>Utilizar el Servicio para procesar o gestionar contenido ilícito o vulnerar derechos de terceros.</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">5. Planes, Cobros, Impuestos y Renovaciones</h3>
        <p>
          El Servicio se ofrece bajo distintos planes de suscripción. Los precios, períodos de facturación, límites
          y funcionalidades incluidas serán los informados al momento de la contratación. Salvo que se indique expresamente
          lo contrario, los planes recurrentes se renuevan automáticamente por períodos sucesivos hasta su cancelación.
          Al suscribirte a un plan recurrente, autorizas los cargos periódicos correspondientes mediante el medio de pago seleccionado.
          Los impuestos, retenciones o cargos aplicables serán informados conforme a la normativa vigente y a los datos de facturación
          proporcionados por el Cliente.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">6. Cancelación, Baja y Terminación</h3>
        <p>
          Puedes cancelar la renovación de tu suscripción en cualquier momento a través de la configuración disponible
          de la cuenta o de los canales de soporte habilitados por KeyGo. Salvo que se indique otra cosa en una condición
          comercial específica, la cancelación impedirá futuras renovaciones y el Servicio permanecerá activo hasta el término
          del período ya pagado. KeyGo podrá suspender o terminar el acceso al Servicio en caso de incumplimiento grave de estos
          Términos, riesgos de seguridad, uso ilícito, falta de pago o protección de la plataforma y sus usuarios. Cuando sea
          razonablemente posible, KeyGo otorgará aviso previo. Si el Cliente tiene la calidad legal de consumidor conforme a la
          legislación chilena, prevalecerán los derechos irrenunciables de retracto, terminación o protección que correspondan.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">7. Disponibilidad, Mantención y Soporte</h3>
        <p>
          KeyGo realizará esfuerzos comercialmente razonables para mantener el Servicio disponible y seguro. Sin embargo,
          no puede garantizar un funcionamiento ininterrumpido o libre de errores en todo momento. Las mantenciones programadas,
          cambios relevantes e incidentes que afecten materialmente el Servicio podrán ser informados a través de la plataforma,
          página de estado o correo registrado, según corresponda.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">8. Limitación de Responsabilidad</h3>
        <p>
          En la máxima medida permitida por la legislación aplicable, KeyGo no será responsable por daños indirectos,
          incidentales, especiales, consecuenciales o por lucro cesante derivados del uso del Servicio. En todo caso,
          la responsabilidad total acumulada de KeyGo por daños directos derivados de o relacionados con el Servicio
          no excederá el monto total efectivamente pagado por el Cliente a KeyGo durante los 12 meses inmediatamente
          anteriores al hecho que dio origen al reclamo. Nada en estos Términos excluye o limita responsabilidades
          cuando dicha exclusión o limitación no esté permitida por la legislación chilena.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">9. Propiedad Intelectual</h3>
        <p>
          Todo software, código fuente, interfaces, elementos visuales, marcas, logos, nombres comerciales,
          documentación y demás contenidos asociados al Servicio son propiedad de KeyGo o de sus licenciantes y
          se encuentran protegidos por la legislación aplicable sobre propiedad intelectual. Salvo por el derecho
          limitado de uso del Servicio conforme a estos Términos, no se concede licencia, transferencia ni cesión
          alguna de derechos de propiedad intelectual a tu favor.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">10. Datos Personales y Confidencialidad</h3>
        <p>
          KeyGo trata los datos personales conforme a su Política de Privacidad y a la legislación chilena aplicable.
          El Cliente es responsable de asegurar que los datos personales que cargue o gestione a través del Servicio
          hayan sido obtenidos y tratados lícitamente. Cada parte deberá adoptar medidas razonables para proteger la
          información confidencial a la que acceda con ocasión del Servicio y no divulgarla, salvo obligación legal o
          necesidad para la prestación del propio Servicio.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">11. Modificaciones de los Términos</h3>
        <p>
          KeyGo podrá actualizar estos Términos ocasionalmente por motivos legales, operativos, de seguridad o de mejora
          del Servicio. Si un cambio es material, KeyGo otorgará aviso previo a través de la plataforma o por correo
          electrónico con al menos 15 días de anticipación a su entrada en vigencia, salvo que una modificación anterior
          sea exigida por ley, seguridad o una obligación regulatoria. Si no estás de acuerdo con un cambio material,
          podrás dejar de usar el Servicio y cancelar su renovación antes de la fecha de entrada en vigencia.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">12. Ley Aplicable y Jurisdicción</h3>
        <p>
          Estos Términos se rigen por las leyes de la República de Chile. Cualquier controversia derivada de o relacionada
          con estos Términos o con el Servicio será sometida a los tribunales de justicia competentes conforme a la legislación
          chilena aplicable. Si el Cliente actúa en calidad de consumidor, prevalecerán los derechos de competencia y procedimiento
          que le reconozca la normativa de protección al consumidor. En relaciones exclusivamente entre empresas, y salvo norma
          imperativa en contrario, las partes se someten a los tribunales ordinarios de justicia de Santiago de Chile.
        </p>
      </section>

      <p className="text-xs text-slate-400 pt-4 border-t border-slate-100">
        Última actualización: 30 de marzo de 2026.
      </p>
    </div>}
    </>
  )
}