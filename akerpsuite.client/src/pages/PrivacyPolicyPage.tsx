import PageHeader from '../components/PageHeader';

export default function PrivacyPolicyPage() {
    return (
        <>
            <PageHeader
                eyebrow="Legal"
                title="Privacy"
                highlight="Policy."
                desc="How AKS Solar Systems Private Limited collects, uses, and protects your information."
            />

            <section className="border-t border-line bg-paper py-14 sm:py-20">
                <div className="container mx-auto max-w-[900px] px-5 sm:px-7">
                    <div className="prose max-w-none space-y-8 text-[0.96rem] leading-[1.8] text-charcoal">
                        <div>
                            <h2 className="mb-3 text-xl font-bold text-charcoal">1. Introduction</h2>
                            <p>
                                This Privacy Policy explains how <strong>AKS Solar Systems Private Limited</strong>{' '}
                                ("AKS Solar", "we", "us", or "our"), a company incorporated under CIN
                                U35105HP2023PTC010123 and registered at House No. 67-A/4, NH-21, DISTT, near IDBI
                                Bank, Bhojpur, Sundar Nagar, Himachal Pradesh 175002, collects, uses, and protects
                                information when you visit www.aks.solar (the "Website") or contact us regarding our
                                solar products and services.
                            </p>
                            <p>
                                By using the Website or submitting your information through our enquiry form, you
                                consent to the collection and use of information in accordance with this policy.
                            </p>
                        </div>

                        <div>
                            <h2 className="mb-3 text-xl font-bold text-charcoal">2. Information We Collect</h2>
                            <p>When you submit an enquiry or contact us, we may collect:</p>
                            <ul className="ml-5 list-disc space-y-1.5">
                                <li>Your name</li>
                                <li>Phone number</li>
                                <li>Email address</li>
                                <li>Location / state</li>
                                <li>Details of the service you are interested in and any message you provide</li>
                            </ul>
                            <p>
                                We may also automatically collect limited technical information, such as your
                                browser type and general usage patterns on the Website, to help us improve it.
                            </p>
                        </div>

                        <div>
                            <h2 className="mb-3 text-xl font-bold text-charcoal">3. How We Use Your Information</h2>
                            <p>We use the information you provide to:</p>
                            <ul className="ml-5 list-disc space-y-1.5">
                                <li>Respond to your enquiry and provide a quotation for solar products or services</li>
                                <li>Contact you by phone, email, or WhatsApp regarding your enquiry or ongoing project</li>
                                <li>Improve our Website, products, and customer service</li>
                                <li>Comply with applicable legal and regulatory requirements</li>
                            </ul>
                            <p>We do not sell your personal information to third parties.</p>
                        </div>

                        <div>
                            <h2 className="mb-3 text-xl font-bold text-charcoal">4. Sharing of Information</h2>
                            <p>
                                We may share your information with trusted third parties only where necessary — for
                                example, with equipment manufacturers for warranty registration, government
                                authorities for subsidy schemes such as PM Surya Ghar Muft Bijli Yojna, or service
                                partners assisting with installation — solely for the purpose of fulfilling your
                                request.
                            </p>
                        </div>

                        <div>
                            <h2 className="mb-3 text-xl font-bold text-charcoal">5. Data Security</h2>
                            <p>
                                We take reasonable technical and organisational measures to protect your personal
                                information from unauthorised access, alteration, disclosure, or destruction. However,
                                no method of transmission over the internet is completely secure, and we cannot
                                guarantee absolute security.
                            </p>
                        </div>

                        <div>
                            <h2 className="mb-3 text-xl font-bold text-charcoal">6. Data Retention</h2>
                            <p>
                                We retain your personal information only for as long as necessary to respond to your
                                enquiry, fulfil a service agreement, or comply with our legal obligations, after
                                which it is securely deleted or anonymised.
                            </p>
                        </div>

                        <div>
                            <h2 className="mb-3 text-xl font-bold text-charcoal">7. Your Rights</h2>
                            <p>
                                You may request access to, correction of, or deletion of your personal information
                                held by us at any time by contacting us using the details below.
                            </p>
                        </div>

                        <div>
                            <h2 className="mb-3 text-xl font-bold text-charcoal">8. Cookies</h2>
                            <p>
                                The Website may use cookies or similar technologies to improve your browsing
                                experience and understand how visitors use our Website. You can control cookie
                                preferences through your browser settings.
                            </p>
                        </div>

                        <div>
                            <h2 className="mb-3 text-xl font-bold text-charcoal">9. Changes to This Policy</h2>
                            <p>
                                We may update this Privacy Policy from time to time. Any changes will be posted on
                                this page with a revised "Last updated" date.
                            </p>
                        </div>

                        <div>
                            <h2 className="mb-3 text-xl font-bold text-charcoal">10. Contact Us</h2>
                            <p>
                                If you have any questions about this Privacy Policy or how your information is
                                handled, please contact us at{' '}
                                <a href="tel:+918988353500" className="font-medium text-gold-deep hover:underline">
                                    +91 89883 53500
                                </a>{' '}
                                or write to us at our registered office address listed above.
                            </p>
                        </div>

                    </div>
                </div>
            </section>
        </>
    );
}