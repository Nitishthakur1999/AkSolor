import PageHeader from '../components/PageHeader';

export default function TermsPage() {
    return (
        <>
            <PageHeader
                eyebrow="Legal"
                title="Terms and"
                highlight="Conditions."
                desc="Please read these terms carefully before using our website or engaging our services."
            />

            <section className="border-t border-line bg-paper py-14 sm:py-20">
                <div className="container mx-auto max-w-[900px] px-5 sm:px-7">
                    <div className="prose max-w-none space-y-8 text-[0.96rem] leading-[1.8] text-charcoal">
                         <div>
                            <h2 className="mb-3 text-xl font-bold text-charcoal">1. Acceptance of Terms</h2>
                            <p>
                                This Terms and Conditions agreement ("Agreement") governs your access to and use of the
                                website www.aks.solar (the "Website") and the services offered by{' '}
                                <strong>AKS Solar Systems Private Limited</strong> ("AKS Solar", "we", "us", or "our"),
                                a company incorporated in 2023 under CIN U35105HP2023PTC010123, having its registered
                                office at House No. 67-A/4, NH-21, DISTT, near IDBI Bank, Bhojpur, Sundar Nagar,
                                Himachal Pradesh 175002, India.
                            </p>
                            <p>
                                By accessing the Website, submitting an enquiry, or engaging us for any solar product
                                or installation service, you ("you", "your", "Customer") agree to be bound by this
                                Agreement. If you do not agree with any part of this Agreement, please do not use the
                                Website or our services.
                            </p>
                        </div>

                        <div>
                            <h2 className="mb-3 text-xl font-bold text-charcoal">2. Description of Services</h2>
                            <p>
                                AKS Solar designs, supplies, installs, and maintains solar power systems, including
                                but not limited to rooftop solar power plants, ground-mounted solar power projects,
                                solar street lights, solar geysers, and related civil and consultancy work, for
                                residential, commercial, and institutional customers across North India.
                            </p>
                            <p>
                                Information on the Website — including product descriptions, pricing indications, and
                                project images — is provided for general informational purposes and does not
                                constitute a binding offer. All installations are subject to a separate site
                                inspection, quotation, and signed work order or agreement between you and AKS Solar.
                            </p>
                        </div>

                        <div>
                            <h2 className="mb-3 text-xl font-bold text-charcoal">3. Enquiries and Quotations</h2>
                            <p>
                                When you submit an enquiry through our contact form, you agree to provide accurate
                                and current information (name, phone number, email, and property details) so that we
                                may respond with a suitable quotation. Submitting an enquiry does not create any
                                obligation on either party until a formal quotation is accepted in writing.
                            </p>
                        </div>

                        <div>
                            <h2 className="mb-3 text-xl font-bold text-charcoal">4. Payments and Cancellation</h2>
                            <p>
                                Payment terms, advance amounts, and schedules for any solar installation project will
                                be specified in the individual quotation or work order issued to you. Cancellation of
                                a confirmed order is subject to the terms agreed upon at the time of booking, and any
                                amount already spent on materials or site work may be non-refundable.
                            </p>
                        </div>

                        <div>
                            <h2 className="mb-3 text-xl font-bold text-charcoal">5. Warranty and Maintenance</h2>
                            <p>
                                Solar panels, inverters, and other equipment supplied by AKS Solar carry the
                                manufacturer's warranty applicable to that product, details of which will be shared
                                at the time of purchase. AKS Solar's own workmanship warranty, if any, will be
                                specified separately in your project agreement. Routine maintenance requested outside
                                of an active warranty period may be chargeable.
                            </p>
                        </div>

                        <div>
                            <h2 className="mb-3 text-xl font-bold text-charcoal">6. Intellectual Property</h2>
                            <p>
                                All content on the Website — including text, images, logos, and graphics — is the
                                property of AKS Solar Systems Private Limited or its licensors and may not be
                                copied, reproduced, or used without prior written consent.
                            </p>
                        </div>

                        <div>
                            <h2 className="mb-3 text-xl font-bold text-charcoal">7. Limitation of Liability</h2>
                            <p>
                                AKS Solar shall not be liable for any indirect, incidental, or consequential loss
                                arising from delays caused by factors beyond its reasonable control, including
                                weather conditions, grid connectivity issues, government approvals, or force majeure
                                events such as natural disasters or power outages.
                            </p>
                        </div>

                        <div>
                            <h2 className="mb-3 text-xl font-bold text-charcoal">8. Governing Law and Jurisdiction</h2>
                            <p>
                                This Agreement shall be governed by and construed in accordance with the laws of
                                India. Any disputes arising out of or in connection with this Agreement shall be
                                subject to the exclusive jurisdiction of the courts at Mandi, Himachal Pradesh.
                            </p>
                        </div>

                        <div>
                            <h2 className="mb-3 text-xl font-bold text-charcoal">9. Changes to These Terms</h2>
                            <p>
                                We may update this Agreement from time to time. Continued use of the Website after
                                any changes are posted constitutes your acceptance of the revised terms.
                            </p>
                        </div>

                        <div>
                            <h2 className="mb-3 text-xl font-bold text-charcoal">10. Contact Us</h2>
                            <p>
                                If you have any questions about this Agreement, please contact us at{' '}
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