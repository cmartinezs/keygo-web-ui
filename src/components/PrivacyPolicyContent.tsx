import { useState } from 'react'

export function PrivacyPolicyContent() {
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

    {lang === 'es' && <div className="space-y-6">
      <section>
        <h3 className="font-semibold text-slate-900 mb-2">1. Responsable y Alcance</h3>
        <p>
          Esta Política de Privacidad describe cómo KeyGo trata los datos personales recopilados a través
          de su plataforma, sitio web, consola de administración, flujos de autenticación y canales de soporte
          (el &quot;Servicio&quot;).
        </p>
        <p className="mt-2">
          En relación con los datos necesarios para operar el Servicio, gestionar cuentas, facturación,
          soporte, seguridad y comunicaciones propias de KeyGo, KeyGo actúa como responsable del tratamiento.
          En determinados casos, cuando un Cliente utiliza KeyGo para gestionar usuarios, accesos, aplicaciones,
          roles o autenticación de su organización, KeyGo puede tratar ciertos datos por cuenta de dicho Cliente
          para la prestación del Servicio.
        </p>
        <p className="mt-2">
          Si tienes preguntas sobre esta Política o sobre el tratamiento de tus datos, puedes escribir a{" "}
          <span className="text-indigo-600 font-medium">privacy@keygo.app</span>.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">2. Datos Personales que Recopilamos</h3>
        <p>Podemos recopilar y tratar las siguientes categorías de datos personales:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600">
          <li><strong>Datos de identificación:</strong> nombre, apellido, correo electrónico, nombre de usuario u otros identificadores equivalentes.</li>
          <li><strong>Datos organizacionales:</strong> nombre de la empresa, tenant, slug, aplicaciones asociadas, membresías, roles y permisos.</li>
          <li><strong>Datos de cuenta y contratación:</strong> plan contratado, estado de la suscripción, datos de facturación y fecha de registro.</li>
          <li><strong>Datos de autenticación y seguridad:</strong> eventos de login, restablecimiento de contraseña, direcciones IP, user agent, identificadores de sesión y registros de auditoría.</li>
          <li><strong>Datos de soporte y contacto:</strong> información que entregues al comunicarte con nosotros por soporte, formularios o correo electrónico.</li>
          <li><strong>Datos técnicos y de navegación:</strong> información sobre uso del Servicio, errores, rendimiento y mecanismos técnicos necesarios para mantener sesiones seguras.</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">3. Finalidades del Tratamiento</h3>
        <p>Tratamos datos personales para las siguientes finalidades:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600">
          <li><strong>Prestación del Servicio:</strong> crear cuentas, autenticar usuarios, gestionar tenants, apps, membresías, roles, sesiones y accesos.</li>
          <li><strong>Seguridad e integridad:</strong> prevenir accesos no autorizados, detectar incidentes, investigar actividad maliciosa y proteger la plataforma.</li>
          <li><strong>Facturación y cobros:</strong> procesar pagos, emitir documentos tributarios y administrar el plan contratado.</li>
          <li><strong>Atención y soporte:</strong> responder consultas, resolver incidencias y acompañar la implementación o uso del Servicio.</li>
          <li><strong>Comunicaciones operativas:</strong> enviar avisos importantes sobre seguridad, cambios relevantes, mantenimiento, cuenta o suscripción.</li>
          <li><strong>Cumplimiento normativo:</strong> cumplir obligaciones legales, regulatorias, tributarias o requerimientos válidamente emitidos por autoridad competente.</li>
          <li><strong>Mejora del Servicio:</strong> elaborar métricas, análisis internos y estadísticas, idealmente usando datos agregados o minimizados cuando ello sea razonablemente posible.</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">4. Criterios del Tratamiento</h3>
        <p>
          KeyGo tratará datos personales únicamente en la medida necesaria para cumplir las finalidades informadas
          en esta Política, prestar el Servicio, ejecutar la relación contractual, resguardar la seguridad de la
          plataforma, cumplir obligaciones legales o contar con el consentimiento del titular cuando ello corresponda.
        </p>
        <p className="mt-2">
          Cuando se soliciten datos personales, informaremos en lo posible su finalidad y, cuando corresponda,
          si su entrega es obligatoria o facultativa para acceder a una funcionalidad o servicio determinado.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">5. Comunicación y Acceso a Terceros</h3>
        <p>
          KeyGo no vende datos personales a terceros. No obstante, podemos comunicar o permitir acceso a datos
          personales en los siguientes casos:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600">
          <li><strong>Proveedores tecnológicos:</strong> infraestructura cloud, almacenamiento, correo transaccional, monitoreo, soporte técnico y herramientas necesarias para operar el Servicio.</li>
          <li><strong>Procesadores de pago y facturación:</strong> en la medida necesaria para gestionar cobros, pagos, facturas o boletas.</li>
          <li><strong>Cliente respectivo y sus administradores autorizados:</strong> cuando el tratamiento se realice dentro del tenant del Cliente para gestionar usuarios, accesos, aplicaciones, roles o eventos de autenticación.</li>
          <li><strong>Aplicaciones autorizadas por el Cliente:</strong> cuando ello sea necesario para ejecutar flujos de autenticación, autorización, provisioning o consumo legítimo del Servicio por parte de apps registradas dentro del tenant.</li>
          <li><strong>Autoridades competentes:</strong> cuando exista obligación legal, requerimiento judicial o administrativo válido, o cuando sea necesario para resguardar derechos, seguridad o continuidad del Servicio.</li>
        </ul>
        <p className="mt-2">
          Procuramos que nuestros proveedores y terceros autorizados queden sujetos a obligaciones de confidencialidad
          y resguardo acordes al servicio que prestan.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">6. Transferencias Internacionales</h3>
        <p>
          Algunos proveedores que utilizamos para alojar, respaldar, monitorear o soportar el Servicio podrían
          encontrarse fuera de Chile. En esos casos, KeyGo procurará adoptar medidas contractuales y organizacionales
          razonables para resguardar la confidencialidad, integridad y seguridad de los datos personales tratados
          en el contexto del Servicio.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">7. Conservación de los Datos</h3>
        <p>
          Conservaremos los datos personales mientras sean necesarios para la prestación del Servicio, el cumplimiento
          de la finalidad para la cual fueron recopilados, la ejecución de la relación contractual, la resolución de
          disputas, la defensa de derechos de KeyGo o el cumplimiento de obligaciones legales y tributarias.
        </p>
        <p className="mt-2">
          Los registros de seguridad, autenticación y auditoría podrán conservarse por períodos adicionales razonables
          cuando ello sea necesario para fines operativos, prevención de fraude, continuidad del servicio o cumplimiento normativo.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">8. Derechos del Titular</h3>
        <p>
          Conforme a la legislación chilena aplicable, el titular de los datos personales podrá solicitar, según corresponda:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600">
          <li><strong>Acceso:</strong> conocer los datos personales relativos a su persona, su procedencia y finalidad.</li>
          <li><strong>Rectificación o modificación:</strong> corregir datos erróneos, inexactos, equívocos o incompletos.</li>
          <li><strong>Cancelación o eliminación:</strong> solicitar la supresión de datos cuando su almacenamiento carezca de fundamento legal o se encuentren caducos, salvo excepción legal.</li>
          <li><strong>Bloqueo o suspensión temporal:</strong> solicitar la suspensión del tratamiento en los casos previstos por la normativa aplicable.</li>
          <li><strong>Oposición:</strong> oponerse al uso de sus datos para fines promocionales, publicitarios, encuestas o comunicaciones no esenciales, cuando corresponda.</li>
        </ul>
        <p className="mt-2">
          Para ejercer estos derechos, puedes escribir a{" "}
          <span className="text-indigo-600 font-medium">privacy@keygo.app</span>. Responderemos conforme a los
          plazos legales aplicables o, en su defecto, dentro de un plazo razonable según la naturaleza de la solicitud.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">9. Seguridad</h3>
        <p>
          KeyGo adopta medidas técnicas y organizacionales razonables para proteger los datos personales contra
          acceso no autorizado, pérdida, alteración, divulgación o destrucción indebida. Estas medidas pueden incluir,
          entre otras, cifrado en tránsito, controles de acceso basados en privilegios mínimos, registro de eventos
          relevantes, segregación lógica, revisión de incidentes y buenas prácticas de seguridad aplicables al Servicio.
        </p>
        <p className="mt-2">
          Sin perjuicio de lo anterior, ningún sistema puede garantizar seguridad absoluta en todo momento.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">10. Cookies y Tecnologías Similares</h3>
        <p>
          El Servicio puede utilizar cookies, almacenamiento local u otros mecanismos técnicos estrictamente necesarios
          para permitir el funcionamiento de sesiones, autenticación, seguridad, preferencias esenciales y continuidad
          del Servicio.
        </p>
        <p className="mt-2">
          Si KeyGo llegara a utilizar cookies o tecnologías no esenciales, como analítica adicional o funcionalidades
          de medición no estrictamente necesarias, ello será informado oportunamente y se ofrecerán las opciones
          correspondientes cuando la normativa o el contexto así lo requieran.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">11. Cambios a esta Política</h3>
        <p>
          KeyGo podrá actualizar esta Política de Privacidad por razones legales, operativas, de seguridad o mejora
          del Servicio. Cuando un cambio sea material, procuraremos informarlo previamente a través de la plataforma
          o por correo electrónico. La fecha de última actualización se indica al final de este documento.
        </p>
      </section>

      <p className="text-xs text-slate-400 pt-4 border-t border-slate-100">
        Última actualización: 30 de marzo de 2026.
      </p>
    </div>}

    {lang === 'en' && <div className="space-y-6">
      <section>
        <h3 className="font-semibold text-slate-900 mb-2">1. Controller and Scope</h3>
        <p>
          This Privacy Policy describes how KeyGo processes personal data collected through its platform,
          website, administration console, authentication flows, and support channels (the &quot;Service&quot;).
        </p>
        <p className="mt-2">
          In relation to the data necessary to operate the Service, manage accounts, billing, support,
          security, and KeyGo’s own communications, KeyGo acts as the controller of the processing.
          In certain cases, when a Customer uses KeyGo to manage users, access, applications, roles,
          or authentication within its organization, KeyGo may process certain data on behalf of that
          Customer in order to provide the Service.
        </p>
        <p className="mt-2">
          If you have questions about this Policy or about the processing of your data, you may contact us at{" "}
          <span className="text-indigo-600 font-medium">privacy@keygo.app</span>.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">2. Personal Data We Collect</h3>
        <p>We may collect and process the following categories of personal data:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600">
          <li><strong>Identification data:</strong> first name, last name, email address, username, or other equivalent identifiers.</li>
          <li><strong>Organizational data:</strong> company name, tenant, slug, related applications, memberships, roles, and permissions.</li>
          <li><strong>Account and contracting data:</strong> subscribed plan, subscription status, billing details, and registration date.</li>
          <li><strong>Authentication and security data:</strong> login events, password reset events, IP addresses, user agent, session identifiers, and audit logs.</li>
          <li><strong>Support and contact data:</strong> information you provide when contacting us through support, forms, or email.</li>
          <li><strong>Technical and usage data:</strong> information about use of the Service, errors, performance, and technical mechanisms necessary to maintain secure sessions.</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">3. Purposes of Processing</h3>
        <p>We process personal data for the following purposes:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600">
          <li><strong>Service delivery:</strong> creating accounts, authenticating users, managing tenants, apps, memberships, roles, sessions, and access.</li>
          <li><strong>Security and integrity:</strong> preventing unauthorized access, detecting incidents, investigating malicious activity, and protecting the platform.</li>
          <li><strong>Billing and payments:</strong> processing payments, issuing tax documents, and managing the subscribed plan.</li>
          <li><strong>Support and customer care:</strong> responding to inquiries, resolving incidents, and assisting with implementation or use of the Service.</li>
          <li><strong>Operational communications:</strong> sending important notices about security, material changes, maintenance, account status, or subscription matters.</li>
          <li><strong>Legal compliance:</strong> complying with legal, regulatory, tax, or valid requests issued by competent authorities.</li>
          <li><strong>Service improvement:</strong> generating metrics, internal analysis, and statistics, ideally using aggregated or minimized data whenever reasonably possible.</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">4. Processing Criteria</h3>
        <p>
          KeyGo will process personal data only to the extent necessary to fulfill the purposes described
          in this Policy, provide the Service, perform the contractual relationship, protect the security
          of the platform, comply with legal obligations, or rely on the data subject’s consent where required.
        </p>
        <p className="mt-2">
          When personal data is requested, we will inform, where possible, the purpose of the processing and,
          where applicable, whether the provision of such data is mandatory or optional for accessing a specific
          feature or service.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">5. Disclosure and Access by Third Parties</h3>
        <p>
          KeyGo does not sell personal data to third parties. However, we may disclose or allow access to
          personal data in the following cases:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600">
          <li><strong>Technology providers:</strong> cloud infrastructure, storage, transactional email, monitoring, technical support, and tools necessary to operate the Service.</li>
          <li><strong>Payment and billing providers:</strong> to the extent necessary to manage charges, payments, invoices, or receipts.</li>
          <li><strong>The relevant Customer and its authorized administrators:</strong> when processing takes place within the Customer’s tenant to manage users, access, applications, roles, or authentication events.</li>
          <li><strong>Applications authorized by the Customer:</strong> when necessary to execute authentication, authorization, provisioning, or legitimate Service consumption flows by applications registered within the tenant.</li>
          <li><strong>Competent authorities:</strong> where there is a legal obligation, valid judicial or administrative request, or where necessary to protect rights, security, or continuity of the Service.</li>
        </ul>
        <p className="mt-2">
          We seek to ensure that our providers and authorized third parties are subject to confidentiality
          and security obligations appropriate to the services they provide.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">6. International Transfers</h3>
        <p>
          Some providers we use to host, back up, monitor, or support the Service may be located outside Chile.
          In such cases, KeyGo will seek to adopt reasonable contractual and organizational measures to safeguard
          the confidentiality, integrity, and security of the personal data processed in connection with the Service.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">7. Data Retention</h3>
        <p>
          We will retain personal data for as long as necessary to provide the Service, fulfill the purpose for
          which the data was collected, perform the contractual relationship, resolve disputes, defend KeyGo’s rights,
          or comply with legal and tax obligations.
        </p>
        <p className="mt-2">
          Security, authentication, and audit logs may be retained for additional reasonable periods where necessary
          for operational purposes, fraud prevention, service continuity, or legal compliance.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">8. Data Subject Rights</h3>
        <p>
          In accordance with applicable Chilean law, the data subject may request, as applicable:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600">
          <li><strong>Access:</strong> to know the personal data relating to them, its source, and its purpose.</li>
          <li><strong>Rectification or amendment:</strong> to correct inaccurate, erroneous, misleading, or incomplete data.</li>
          <li><strong>Cancellation or deletion:</strong> to request the removal of data where its storage lacks legal basis or where the data is outdated, subject to legal exceptions.</li>
          <li><strong>Blocking or temporary suspension:</strong> to request suspension of processing in cases provided for by applicable law.</li>
          <li><strong>Objection:</strong> to object to the use of their data for promotional, advertising, survey, or non-essential communications, where applicable.</li>
        </ul>
        <p className="mt-2">
          To exercise these rights, you may contact us at{" "}
          <span className="text-indigo-600 font-medium">privacy@keygo.app</span>. We will respond in accordance
          with the applicable legal deadlines or, where no specific deadline applies, within a reasonable period
          depending on the nature of the request.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">9. Security</h3>
        <p>
          KeyGo adopts reasonable technical and organizational measures to protect personal data against unauthorized
          access, loss, alteration, disclosure, or improper destruction. These measures may include, among others,
          encryption in transit, least-privilege access controls, relevant event logging, logical segregation,
          incident review, and security best practices applicable to the Service.
        </p>
        <p className="mt-2">
          Notwithstanding the above, no system can guarantee absolute security at all times.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">10. Cookies and Similar Technologies</h3>
        <p>
          The Service may use cookies, local storage, or other technical mechanisms that are strictly necessary
          to enable sessions, authentication, security, essential preferences, and continuity of the Service.
        </p>
        <p className="mt-2">
          If KeyGo later uses non-essential cookies or technologies, such as additional analytics or measurement
          functionalities that are not strictly necessary, this will be properly informed and corresponding options
          will be offered where required by law or by the context of use.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">11. Changes to this Policy</h3>
        <p>
          KeyGo may update this Privacy Policy for legal, operational, security, or Service improvement reasons.
          Where a change is material, we will seek to provide prior notice through the platform or by email.
          The date of the latest update is shown at the end of this document.
        </p>
      </section>

      <p className="text-xs text-slate-400 pt-4 border-t border-slate-100">
        Last updated: March 30, 2026.
      </p>
    </div>}
    </>
  )
}